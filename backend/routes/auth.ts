import express from 'express';
import jwt from 'jsonwebtoken';
import { supabase } from '../config/supabase';

const router = express.Router();

// Mock data for development
const mockUsers = [
  {
    id: '1',
    email: 'user@example.com',
    password: 'password123',
    name: 'Alexander Chen',
    title: '计算语言学高级研究员',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

// Register user
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, title } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if user already exists
    const { data: existingUser, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Check mock users
    const mockUserExists = mockUsers.find(u => u.email === email);
    if (mockUserExists) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Create user
    const { data: user, error } = await supabase
      .from('users')
      .insert({
        email,
        password,
        name,
        title
      })
      .select('id, email, name, title')
      .single();

    if (error || !user) {
      // Return mock data for development
      const newUser = {
        id: String(mockUsers.length + 1),
        email,
        name,
        title,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      mockUsers.push({ ...newUser, password });
      
      // Generate JWT token
      const jwtSecret = process.env.JWT_SECRET || 'default-secret-key-for-development-only';
      const token = jwt.sign(
        { userId: newUser.id },
        jwtSecret as string,
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' } as any
      );

      return res.status(201).json({ user: newUser, token });
    }

    // Create user preferences
    await supabase
      .from('user_preferences')
      .insert({
        user_id: user.id
      });

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET || 'default-secret-key-for-development-only';
    const token = jwt.sign(
      { userId: user.id },
      jwtSecret as string,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' } as any
    );

    res.status(201).json({ user, token });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Find user
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, name, title, password')
      .eq('email', email)
      .single();

    if (error || !user) {
      // Check mock users
      const mockUser = mockUsers.find(u => u.email === email && u.password === password);
      if (mockUser) {
        // Generate JWT token
        const jwtSecret = process.env.JWT_SECRET || 'default-secret-key-for-development-only';
        const token = jwt.sign(
          { userId: mockUser.id },
          jwtSecret as string,
          { expiresIn: process.env.JWT_EXPIRES_IN || '24h' } as any
        );

        // Remove password from response
        const { password: _, ...userWithoutPassword } = mockUser;

        return res.status(200).json({ user: userWithoutPassword, token });
      }
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    if (user.password !== password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET || 'default-secret-key-for-development-only';
    const token = jwt.sign(
      { userId: user.id },
      jwtSecret as string,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' } as any
    );

    // Remove password from response
    delete user.password;

    res.status(200).json({ user, token });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Verify token
    const jwtSecret = process.env.JWT_SECRET || 'default-secret-key-for-development-only';
    const decoded = jwt.verify(token, jwtSecret) as { userId: string };

    // Get user
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, name, title')
      .eq('id', decoded.userId)
      .single();

    if (error || !user) {
      // Check mock users
      const mockUser = mockUsers.find(u => u.id === decoded.userId);
      if (mockUser) {
        const { password: _, ...userWithoutPassword } = mockUser;
        return res.status(200).json({ user: userWithoutPassword });
      }
      return res.status(401).json({ error: 'Invalid token' });
    }

    res.status(200).json({ user });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;