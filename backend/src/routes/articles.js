import express from 'express';
import { query } from '../db.js';

const router = express.Router();

router.get('/categories', async (req, res) => {
  try {
    const result = await query('SELECT DISTINCT category FROM articles ORDER BY category');
    res.json({ categories: result.rows.map(r => r.category) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '获取分类失败' });
  }
});

router.get('/search', async (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q) return res.json({ articles: [] });
  try {
    const result = await query(
      `SELECT id, title, summary, category, read_time, created_at FROM articles
       WHERE title ILIKE $1 OR summary ILIKE $1 OR content ILIKE $1
       ORDER BY created_at DESC LIMIT 50`,
      [`%${q}%`]
    );
    res.json({ articles: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '搜索失败' });
  }
});

router.get('/', async (req, res) => {
  const { category } = req.query;
  const limit = Number(req.query.limit) || 20;
  const offset = Number(req.query.offset) || 0;
  try {
    const params = [];
    let where = '';
    if (category && category !== '全部') {
      params.push(category);
      where = ' WHERE category = $1';
    }
    params.push(limit, offset);
    const result = await query(
      `SELECT id, title, summary, category, read_time, created_at FROM articles${where}
       ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    res.json({ articles: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '获取文章失败' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await query('SELECT * FROM articles WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: '文章不存在' });
    res.json({ article: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '获取文章失败' });
  }
});

export default router;
