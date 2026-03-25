import express from 'express';
import { supabase } from '../config/supabase';

const router = express.Router();

// Mock data for development
const mockCategories = [
  {
    id: '1',
    name: '神经网络',
    icon: 'brain',
    count: 424,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '2',
    name: '自然语言处理',
    icon: 'languages',
    count: 892,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '3',
    name: '机器人与控制',
    icon: 'cpu',
    count: 156,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '4',
    name: '伦理与对齐',
    icon: 'gavel',
    count: 211,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

// Get all categories
router.get('/', async (req, res) => {
  try {
    const { data: categories, error } = await supabase
      .from('categories')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !categories || categories.length === 0) {
      // Return mock data for development
      return res.status(200).json({ categories: mockCategories });
    }

    res.status(200).json({ categories });
  } catch (error) {
    // Return mock data on error
    res.status(200).json({ categories: mockCategories });
  }
});

// Get category by id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data: category, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !category) {
      // Return mock data for development
      const mockCategory = mockCategories.find(c => c.id === id);
      if (mockCategory) {
        return res.status(200).json({ category: mockCategory });
      }
      return res.status(404).json({ error: 'Category not found' });
    }

    res.status(200).json({ category });
  } catch (error) {
    // Return mock data on error
    const { id } = req.params;
    const mockCategory = mockCategories.find(c => c.id === id);
    if (mockCategory) {
      return res.status(200).json({ category: mockCategory });
    }
    res.status(404).json({ error: 'Category not found' });
  }
});

export default router;