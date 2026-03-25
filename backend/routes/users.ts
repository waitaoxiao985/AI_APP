import express from 'express';
import jwt from 'jsonwebtoken';
import { supabase } from '../config/supabase';

const router = express.Router();

// Mock data for development
const mockUserPreferences = {
  '1': {
    id: '1',
    user_id: '1',
    language: 'zh-CN',
    notifications_enabled: true,
    dark_mode: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
};

interface Bookmark {
  id: string;
  user_id: string;
  article_id: string;
  created_at: string;
  articles?: {
    id: string;
    title: string;
    description: string;
    image_url: string;
    read_time: string;
    tag: string;
  };
}

const mockBookmarks: Bookmark[] = [
  {
    id: '1',
    user_id: '1',
    article_id: '1',
    created_at: new Date().toISOString(),
    articles: {
      id: '1',
      title: 'Transformer 架构',
      description: '一种基于注意力机制的变革性深度学习架构，可在序列到序列任务中实现前所未有的并行化处理。',
      image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBrbv5QRWI8QqV5zuOPv4KtXT0q4TF32gfjsoVxbrZ5cm0ewJ5iVPEo4kPYLWf62vTZK4uepTslOmbE7OBQwACVsT44bzKcavEHubs_kkH7sGkDT0jOOUvma0ictwczvKviyKIaDNUpK5K578fp4uCRTsjNXZmKF0ZXbOmjfzmo7epp3WlnpDlOr5-RySvXHu4dstfghyGs2XjC3ty7mouqQtJH1C_mbHseXm9YuG3ZdBpvjOi6PZ9We9X-YsCiKkJVn50mJ6FM0fwE',
      read_time: '10 分钟阅读',
      tag: '深度学习架构'
    }
  },
  {
    id: '2',
    user_id: '1',
    article_id: '2',
    created_at: new Date().toISOString(),
    articles: {
      id: '2',
      title: '通用人工智能 (AGI) 中的对齐问题',
      description: '我们如何确保超智能系统在任何情况下都能遵循人类意图和价值观？',
      image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD69rLtY4nNzmD2C8nVKZ-2yujG3hrxgX2nEPJWAY6J9_1ARZtDa4sVqnIaj02p7NBiTbaB9spjBlvxU3OWovHQ2Dycq8K8xrcBu0OEXoJYFtjBXeQO3ey4fyR9FLe3Tc2Vm_SqOBPzKm3ZFBKsXYRzPYHdsD5MvI8UIxvZ0zhx-oVIHxepb03XR4UYKgzY4LtN8qjc3evGfMkJR76JcPxkMiBIDYuTe0b_Tm8sf2djKRKJ1lCrYLSQsUh7wqmxlNX5OtBfXaVRmHO7',
      read_time: '4 分钟阅读',
      tag: 'AI 伦理'
    }
  }
];

interface Progress {
  id: string;
  user_id: string;
  article_id: string;
  progress: number;
  last_read: string;
  articles?: {
    id: string;
    title: string;
    description: string;
  };
}

const mockProgress: Progress[] = [
  {
    id: '1',
    user_id: '1',
    article_id: '1',
    progress: 85,
    last_read: new Date().toISOString(),
    articles: {
      id: '1',
      title: 'Transformer 架构',
      description: '一种基于注意力机制的变革性深度学习架构，可在序列到序列任务中实现前所未有的并行化处理。'
    }
  },
  {
    id: '2',
    user_id: '1',
    article_id: '2',
    progress: 40,
    last_read: new Date().toISOString(),
    articles: {
      id: '2',
      title: '通用人工智能 (AGI) 中的对齐问题',
      description: '我们如何确保超智能系统在任何情况下都能遵循人类意图和价值观？'
    }
  }
];

// Get user profile
router.get('/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || '') as { userId: string };

    // Get user
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, name, title')
      .eq('id', decoded.userId)
      .single();

    if (userError || !user) {
      // Return mock data for development
      if (decoded.userId === '1') {
        const mockUser = {
          id: '1',
          email: 'user@example.com',
          name: 'Alexander Chen',
          title: '计算语言学高级研究员'
        };
        const mockPreferences = mockUserPreferences['1'];
        return res.status(200).json({ user: mockUser, preferences: mockPreferences });
      }
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Get user preferences
    const { data: preferences, error: prefError } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', decoded.userId)
      .single();

    if (prefError) {
      // Return mock preferences for development
      if (decoded.userId === '1') {
        const mockPreferences = mockUserPreferences['1'];
        return res.status(200).json({ user, preferences: mockPreferences });
      }
      return res.status(500).json({ error: prefError.message });
    }

    res.status(200).json({ user, preferences });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Update user profile
router.put('/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || '') as { userId: string };

    const { name, title } = req.body;

    const { data: user, error } = await supabase
      .from('users')
      .update({
        name,
        title,
        updated_at: new Date().toISOString()
      })
      .eq('id', decoded.userId)
      .select('id, email, name, title')
      .single();

    if (error || !user) {
      // Return mock data for development
      if (decoded.userId === '1') {
        const mockUser = {
          id: '1',
          email: 'user@example.com',
          name,
          title
        };
        return res.status(200).json({ user: mockUser });
      }
      return res.status(500).json({ error: error.message });
    }

    res.status(200).json({ user });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Update user preferences
router.put('/preferences', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || '') as { userId: string };

    const { language, notifications_enabled, dark_mode } = req.body;

    const { data: preferences, error } = await supabase
      .from('user_preferences')
      .update({
        language,
        notifications_enabled,
        dark_mode,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', decoded.userId)
      .select('*')
      .single();

    if (error || !preferences) {
      // Return mock data for development
      if (decoded.userId === '1') {
        const mockPreferences = {
          ...mockUserPreferences['1'],
          language,
          notifications_enabled,
          dark_mode,
          updated_at: new Date().toISOString()
        };
        mockUserPreferences['1'] = mockPreferences;
        return res.status(200).json({ preferences: mockPreferences });
      }
      return res.status(500).json({ error: error?.message || 'Unknown error' });
    }

    res.status(200).json({ preferences });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Get user bookmarks
router.get('/bookmarks', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || '') as { userId: string };

    const { data: bookmarks, error } = await supabase
      .from('user_bookmarks')
      .select('id, article_id, created_at, articles(id, title, description, image_url, read_time, tag)')
      .eq('user_id', decoded.userId)
      .order('created_at', { ascending: false });

    if (error || !bookmarks || bookmarks.length === 0) {
      // Return mock data for development
      if (decoded.userId === '1') {
        const userBookmarks = mockBookmarks.filter(b => b.user_id === decoded.userId);
        return res.status(200).json({ bookmarks: userBookmarks });
      }
      return res.status(200).json({ bookmarks: [] });
    }

    res.status(200).json({ bookmarks });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Add bookmark
router.post('/bookmarks', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || '') as { userId: string };

    const { article_id } = req.body;

    if (!article_id) {
      return res.status(400).json({ error: 'Missing article_id' });
    }

    const { data: bookmark, error } = await supabase
      .from('user_bookmarks')
      .insert({
        user_id: decoded.userId,
        article_id
      })
      .select('id, article_id, created_at')
      .single();

    if (error || !bookmark) {
      // Return mock data for development
      const newBookmark = {
        id: String(mockBookmarks.length + 1),
        user_id: decoded.userId,
        article_id,
        created_at: new Date().toISOString()
      };
      mockBookmarks.push(newBookmark);
      return res.status(201).json({ bookmark: newBookmark });
    }

    res.status(201).json({ bookmark });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Remove bookmark
router.delete('/bookmarks/:id', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || '') as { userId: string };

    const { id } = req.params;

    const { error } = await supabase
      .from('user_bookmarks')
      .delete()
      .eq('id', id)
      .eq('user_id', decoded.userId);

    if (error) {
      // Return success for mock data
      const bookmarkIndex = mockBookmarks.findIndex(b => b.id === id && b.user_id === decoded.userId);
      if (bookmarkIndex !== -1) {
        mockBookmarks.splice(bookmarkIndex, 1);
        return res.status(200).json({ message: 'Bookmark removed successfully' });
      }
      return res.status(500).json({ error: error.message });
    }

    res.status(200).json({ message: 'Bookmark removed successfully' });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Get user progress
router.get('/progress', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || '') as { userId: string };

    const { data: progress, error } = await supabase
      .from('user_progress')
      .select('id, article_id, progress, last_read, articles(id, title, description)')
      .eq('user_id', decoded.userId)
      .order('last_read', { ascending: false });

    if (error || !progress || progress.length === 0) {
      // Return mock data for development
      if (decoded.userId === '1') {
        const userProgress = mockProgress.filter(p => p.user_id === decoded.userId);
        return res.status(200).json({ progress: userProgress });
      }
      return res.status(200).json({ progress: [] });
    }

    res.status(200).json({ progress });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Update user progress
router.post('/progress', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || '') as { userId: string };

    const { article_id, progress } = req.body;

    if (!article_id || progress === undefined) {
      return res.status(400).json({ error: 'Missing article_id or progress' });
    }

    // Upsert progress
    const { data: userProgress, error } = await supabase
      .from('user_progress')
      .upsert(
        {
          user_id: decoded.userId,
          article_id,
          progress,
          last_read: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        { onConflict: 'user_id,article_id' }
      )
      .select('id, article_id, progress, last_read')
      .single();

    if (error || !userProgress) {
      // Return mock data for development
      const newProgress = {
        id: String(mockProgress.length + 1),
        user_id: decoded.userId,
        article_id,
        progress,
        last_read: new Date().toISOString()
      };
      mockProgress.push(newProgress);
      return res.status(200).json({ progress: newProgress });
    }

    res.status(200).json({ progress: userProgress });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;