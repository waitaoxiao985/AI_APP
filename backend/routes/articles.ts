import express from 'express';
import jwt from 'jsonwebtoken';
import { supabase } from '../config/supabase';

const router = express.Router();

// Type definition for Article
interface Article {
  id: string;
  title: string;
  description: string;
  content: string;
  category_id: string;
  image_url: string;
  read_time: string;
  tag: string;
  status: 'published' | 'pending' | 'rejected';
  created_at: string;
  updated_at: string;
}

// Mock data for development
const mockArticles: Article[] = [
  {
    id: 'llm',
    title: '深入理解大语言模型',
    description: '探索概率性词元预测如何构成现代对话式 AI 的基石。',
    content: '大语言模型（LLM）是人工智能领域的重要突破，它们通过学习大量文本数据来理解和生成人类语言...',
    category_id: '2',
    image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAJwz2XXj_HzsJTnpgQAr4hEasnKsExrqaY8FiB1eT_CE2-M7xxuEIugFZXB5tMXiZ6J2qOM2AtcKUtW0VEcwKiW48dOG5xczbYQluW_AR_0omJPJmVc2qd_OEh_lunRoIUBoiaYpu-mTQHhTTAWA1g0bmKXZlk4PsFZ9HzibmglOMS8H4KESeRD2wXPYwUNjd-LMOghi9x1qRkNBXsvQLfmgGnCWBPfEGwwcbQJ3QTIWVmmo2P7_i2R2mGpPfCQKpt9Rh4op2LhJB8',
    read_time: '8 分钟阅读',
    tag: '大语言模型',
    status: 'published' as const,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'agi',
    title: '通用人工智能 (AGI) 中的对齐问题',
    description: '我们如何确保超智能系统在任何情况下都能遵循人类意图和价值观？',
    content: 'AGI对齐问题是人工智能安全领域的核心挑战...',
    category_id: '4',
    image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD69rLtY4nNzmD2C8nVKZ-2yujG3hrxgX2nEPJWAY6J9_1ARZtDa4sVqnIaj02p7NBiTbaB9spjBlvxU3OWovHQ2Dycq8K8xrcBu0OEXoJYFtjBXeQO3ey4fyR9FLe3Tc2Vm_SqOBPzKm3ZFBKsXYRzPYHdsD5MvI8UIxvZ0zhx-oVIHxepb03XR4UYKgzY4LtN8qjc3evGfMkJR76JcPxkMiBIDYuTe0b_Tm8sf2djKRKJ1lCrYLSQsUh7wqmxlNX5OtBfXaVRmHO7',
    read_time: '4 分钟阅读',
    tag: 'AI 伦理',
    status: 'published' as const,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'npu',
    title: 'NPU 的崛起：定制化硅片',
    description: '为什么专用神经处理单元正在取代通用 GPU 进行推理任务。',
    content: '随着AI模型的不断增大，专用硬件的需求也在增加...',
    category_id: '3',
    image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD2dfL9I5QMzGWE5Og2tQKJrNbTZi79pkWjpraklHpPsX1yi8YFAVqcjBsZ8MJmYiTOxp7-VWo6yCotOmf3-vWSKaT0FiS52hMtQKov5f9VeCVR5aZL_5WEyZlU_mcvTMIgQQWRndDQEg68SrpL0O_X1hFXK5gyNcUyU-tz-1IXzQ8D1ej7o7-Y0aBX-bZ0qog99fwHuq9FLVggqRWH4mDXysB7s8tI9biqSF3ei2uitib_g7QdId7P4_qzf4c5cz7JdlCklCUqkobu',
    read_time: '6 分钟阅读',
    tag: '硬件',
    status: 'published' as const,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'neuro',
    title: '神经可塑性',
    description: '大脑如何通过经验和学习改变自身结构和功能。',
    content: '神经可塑性是大脑的一种基本特性，它允许大脑在整个生命周期中不断适应和改变...',
    category_id: '1',
    image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD69rLtY4nNzmD2C8nVKZ-2yujG3hrxgX2nEPJWAY6J9_1ARZtDa4sVqnIaj02p7NBiTbaB9spjBlvxU3OWovHQ2Dycq8K8xrcBu0OEXoJYFtjBXeQO3ey4fyR9FLe3Tc2Vm_SqOBPzKm3ZFBKsXYRzPYHdsD5MvI8UIxvZ0zhx-oVIHxepb03XR4UYKgzY4LtN8qjc3evGfMkJR76JcPxkMiBIDYuTe0b_Tm8sf2djKRKJ1lCrYLSQsUh7wqmxlNX5OtBfXaVRmHO7',
    read_time: '5 分钟阅读',
    tag: '神经科学',
    status: 'published' as const,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'emergence',
    title: '涌现行为',
    description: '复杂系统中从简单规则中产生的集体行为。',
    content: '涌现行为是指在复杂系统中，由简单个体遵循局部规则而产生的全局复杂行为...',
    category_id: '2',
    image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCgNJ6hCtHDt598qEL0o3KTPfekzJ-a2-r9ajkGbKLlwgZS-VURPMYWLFrUhJ9JElxKSDJxuelkLLwUD8iEzV35H59hQdRCfphfTSEGPiYXC-hjcTBIIShoOOqhkSQ6tisxgPaaO22NeZ4nLb7NUbvOm8-xE4SEKsLTjZG3ZqemsOkbYEAPzrLB385MhCumKNc19vP2eSAaY57ul-7LL1d5rrUwk5jCcp9LfoW9bUsKmyhwYzp1kgYr0dlaJc77Q5V56TjIzQ60vz5j',
    read_time: '7 分钟阅读',
    tag: '复杂系统',
    status: 'published' as const,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

// Get all articles
router.get('/', async (req, res) => {
  try {
    const { category, limit = 10, offset = 0 } = req.query;

    let query = supabase
      .from('articles')
      .select('id, title, description, image_url, read_time, tag, category_id, created_at');

    if (category) {
      query = query.eq('category_id', category);
    }

    const { data: articles, error } = await (query as any)
      .limit(Number(limit))
      .offset(Number(offset))
      .order('created_at', { ascending: false });

    if (error || !articles || articles.length === 0) {
      // Return mock data for development
      let filteredArticles = mockArticles.filter(a => a.status === 'published');
      if (category) {
        filteredArticles = filteredArticles.filter(a => a.category_id === category);
      }
      const paginatedArticles = filteredArticles.slice(Number(offset), Number(offset) + Number(limit));
      return res.status(200).json({ articles: paginatedArticles });
    }

    res.status(200).json({ articles });
  } catch (error) {
    // Return mock data on error
    const { category, limit = 10, offset = 0 } = req.query;
    let filteredArticles = mockArticles.filter(a => a.status === 'published');
    if (category) {
      filteredArticles = filteredArticles.filter(a => a.category_id === category);
    }
    const paginatedArticles = filteredArticles.slice(Number(offset), Number(offset) + Number(limit));
    res.status(200).json({ articles: paginatedArticles });
  }
});

// Get article by id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: article, error } = await supabase
      .from('articles')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !article) {
      // Return mock data for development
      const mockArticle = mockArticles.find(a => a.id === id && a.status === 'published');
      if (mockArticle) {
        return res.status(200).json({ article: mockArticle });
      }
      return res.status(404).json({ error: 'Article not found' });
    }

    res.status(200).json({ article });
  } catch (error) {
    // Return mock data on error
    const { id } = req.params;
    const mockArticle = mockArticles.find(a => a.id === id && a.status === 'published');
    if (mockArticle) {
      return res.status(200).json({ article: mockArticle });
    }
    res.status(404).json({ error: 'Article not found' });
  }
});

// Search articles
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'Search query required' });
    }

    const { data: articles, error } = await supabase
      .from('articles')
      .select('id, title, description, image_url, read_time, tag, category_id, created_at')
      .ilike('title', `%${q}%`)
      .or(`ilike(description, %${q}%)`)
      .order('created_at', { ascending: false });

    if (error || !articles || articles.length === 0) {
      // Return mock data for development
      const searchQuery = String(q).toLowerCase();
      const filteredArticles = mockArticles.filter(a => 
        a.status === 'published' && (
          a.title.toLowerCase().includes(searchQuery) || 
          a.description?.toLowerCase().includes(searchQuery)
        )
      );
      return res.status(200).json({ articles: filteredArticles });
    }

    res.status(200).json({ articles });
  } catch (error) {
    // Return mock data on error
    const { q } = req.query;
    const searchQuery = String(q).toLowerCase();
    const filteredArticles = mockArticles.filter(a => 
      a.status === 'published' && (
        a.title.toLowerCase().includes(searchQuery) || 
        a.description?.toLowerCase().includes(searchQuery)
      )
    );
    res.status(200).json({ articles: filteredArticles });
  }
});

// Create article (protected)
router.post('/', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Verify token
    jwt.verify(token, process.env.JWT_SECRET || '') as { userId: string };

    const { title, description, content, category_id, image_url, read_time, tag } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const { data: article, error } = await supabase
      .from('articles')
      .insert({
        title,
        description,
        content,
        category_id,
        image_url,
        read_time,
        tag
      })
      .select('*')
      .single();

    if (error || !article) {
      // Return mock data for development
      const newArticle = {
        id: String(mockArticles.length + 1),
        title,
        description,
        content,
        category_id,
        image_url,
        read_time,
        tag,
        status: 'pending' as const,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      mockArticles.push(newArticle);
      return res.status(201).json({ article: newArticle });
    }

    res.status(201).json({ article });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Update article (protected)
router.put('/:id', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Verify token
    jwt.verify(token, process.env.JWT_SECRET || '') as { userId: string };

    const { id } = req.params;
    const { title, description, content, category_id, image_url, read_time, tag, status } = req.body;

    const { data: article, error } = await supabase
      .from('articles')
      .update({
        title,
        description,
        content,
        category_id,
        image_url,
        read_time,
        tag,
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('*')
      .single();

    if (error || !article) {
      // Return mock data for development
      const articleIndex = mockArticles.findIndex(a => a.id === id);
      if (articleIndex !== -1) {
        mockArticles[articleIndex] = {
          ...mockArticles[articleIndex],
          title,
          description,
          content,
          category_id,
          image_url,
          read_time,
          tag,
          status: status || mockArticles[articleIndex].status,
          updated_at: new Date().toISOString()
        };
        return res.status(200).json({ article: mockArticles[articleIndex] });
      }
      return res.status(404).json({ error: 'Article not found' });
    }

    res.status(200).json({ article });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Delete article (protected)
router.delete('/:id', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Verify token
    jwt.verify(token, process.env.JWT_SECRET || '') as { userId: string };

    const { id } = req.params;

    const { error } = await supabase
      .from('articles')
      .delete()
      .eq('id', id);

    if (error) {
      // Return success for mock data
      const articleIndex = mockArticles.findIndex(a => a.id === id);
      if (articleIndex !== -1) {
        mockArticles.splice(articleIndex, 1);
        return res.status(200).json({ message: 'Article deleted successfully' });
      }
      return res.status(404).json({ error: 'Article not found' });
    }

    res.status(200).json({ message: 'Article deleted successfully' });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

export { mockArticles };
export default router;