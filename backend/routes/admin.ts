import express from 'express';
import jwt from 'jsonwebtoken';
// 文章管理路由
import { mockArticles } from './articles';

const router = express.Router();

// 硬编码的管理员凭据（开发环境）
const ADMIN_CREDENTIALS = {
  username: process.env.ADMIN_USERNAME || 'admin',
  password: process.env.ADMIN_PASSWORD || 'admin123'
};

// 登录接口
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // 验证管理员凭据
    if (username !== ADMIN_CREDENTIALS.username || password !== ADMIN_CREDENTIALS.password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // 生成JWT token
    const secret = process.env.JWT_SECRET || 'default-secret-key-for-development-only';
    const token = (jwt as any).sign({ role: 'admin' }, secret, { expiresIn: '24h' });

    res.status(200).json({ token });
  } catch (error) {
    console.error('Error in admin login:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 验证管理员权限的中间件
export const authenticateAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // 验证token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'default-secret-key-for-development-only'
    ) as { role: string };

    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// 获取所有文章（管理员专用）
router.get('/articles', authenticateAdmin, async (req, res) => {
  try {
    const { status, category } = req.query;
    
    let filteredArticles = mockArticles;
    
    if (status) {
      filteredArticles = filteredArticles.filter(a => a.status === status);
    }
    
    if (category) {
      filteredArticles = filteredArticles.filter(a => a.category_id === category);
    }
    
    res.status(200).json({ articles: filteredArticles });
  } catch (error) {
    console.error('Error in admin articles list:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 更新文章状态
router.put('/articles/:id/status', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status || !['pending', 'published', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    const articleIndex = mockArticles.findIndex(a => a.id === id);
    if (articleIndex === -1) {
      return res.status(404).json({ error: 'Article not found' });
    }
    
    mockArticles[articleIndex] = {
      ...mockArticles[articleIndex],
      status: status as any,
      updated_at: new Date().toISOString()
    };
    
    res.status(200).json({ article: mockArticles[articleIndex] });
  } catch (error) {
    console.error('Error in update article status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 编辑文章
router.put('/articles/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, content, category_id, image_url, read_time, tag, status } = req.body;
    
    const articleIndex = mockArticles.findIndex(a => a.id === id);
    if (articleIndex === -1) {
      return res.status(404).json({ error: 'Article not found' });
    }
    
    mockArticles[articleIndex] = {
      ...mockArticles[articleIndex],
      title: title || mockArticles[articleIndex].title,
      description: description || mockArticles[articleIndex].description,
      content: content || mockArticles[articleIndex].content,
      category_id: category_id || mockArticles[articleIndex].category_id,
      image_url: image_url || mockArticles[articleIndex].image_url,
      read_time: read_time || mockArticles[articleIndex].read_time,
      tag: tag || mockArticles[articleIndex].tag,
      status: status || mockArticles[articleIndex].status,
      updated_at: new Date().toISOString()
    };
    
    res.status(200).json({ article: mockArticles[articleIndex] });
  } catch (error) {
    console.error('Error in edit article:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 删除文章
router.delete('/articles/:id', authenticateAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const articleIndex = mockArticles.findIndex(a => a.id === id);
    if (articleIndex === -1) {
      return res.status(404).json({ error: 'Article not found' });
    }
    
    mockArticles.splice(articleIndex, 1);
    
    res.status(200).json({ message: 'Article deleted successfully' });
  } catch (error) {
    console.error('Error in delete article:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;