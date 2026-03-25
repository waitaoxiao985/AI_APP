import express from 'express';
import jwt from 'jsonwebtoken';
import { supabase } from '../config/supabase';

const router = express.Router();

// ====================== 注册 ======================
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, title } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: '缺少必要字段：email, password, name' });
    }

    // 使用 Supabase Auth 注册（密码会自动加密）
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, title }   // 这些数据会存到 auth.users 的 raw_user_meta_data 中
      }
    });

    if (authError) {
      return res.status(400).json({ error: authError.message });
    }

    if (!authData.user) {
      return res.status(500).json({ error: '注册失败' });
    }

    // 生成 JWT（如果你前端仍然需要自己的 token）
    const jwtSecret = process.env.JWT_SECRET || 'default-secret-key-for-development-only';
    const token = jwt.sign(
      { userId: authData.user.id },
      jwtSecret,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      user: {
        id: authData.user.id,
        email: authData.user.email,
        name: name,
        title: title || null,
      },
      token,
      // 如果你开启了邮箱确认，这里会返回 session: null
      session: authData.session
    });

  } catch (error: any) {
    console.error('Register error:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// ====================== 登录 ======================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: '缺少 email 或 password' });
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return res.status(401).json({ error: error.message });
    }

    const jwtSecret = process.env.JWT_SECRET || 'default-secret-key-for-development-only';
    const token = jwt.sign(
      { userId: data.user.id },
      jwtSecret,
      { expiresIn: '24h' }
    );

    res.status(200).json({
      user: {
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.name || null,
        title: data.user.user_metadata?.title || null,
      },
      token,
      session: data.session
    });

  } catch (error: any) {
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// ====================== 获取当前用户 ======================
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: '未提供 token' });
    }

    const jwtSecret = process.env.JWT_SECRET || 'default-secret-key-for-development-only';
    const decoded = jwt.verify(token, jwtSecret) as { userId: string };

    // 从 Supabase Auth 获取用户信息
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: '无效的 token' });
    }

    res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.name || null,
        title: user.user_metadata?.title || null,
      }
    });

  } catch (error) {
    res.status(401).json({ error: '无效的 token' });
  }
});

export default router;