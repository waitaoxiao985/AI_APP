import express from 'express';
import { query } from '../db.js';

const router = express.Router();

function escapeLike(str) {
  return str.replace(/[\\%_]/g, '\\$&');
}

router.get('/categories', async (req, res) => {
  try {
    const result = await query(
      'SELECT category, count(*)::int AS count FROM articles GROUP BY category ORDER BY category'
    );
    res.json({
      categories: result.rows.map(r => r.category),
      counts: Object.fromEntries(result.rows.map(r => [r.category, r.count]))
    });
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
      ['%' + escapeLike(q) + '%']
    );
    res.json({ articles: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '搜索失败' });
  }
});

router.get('/', async (req, res) => {
  const { category } = req.query;
  const limitRaw = req.query.limit === undefined ? 20 : Number(req.query.limit);
  const offsetRaw = req.query.offset === undefined ? 0 : Number(req.query.offset);
  if (!Number.isInteger(limitRaw) || limitRaw < 1 || !Number.isInteger(offsetRaw) || offsetRaw < 0) {
    return res.status(400).json({ error: 'limit/offset 参数无效' });
  }
  const limit = Math.min(limitRaw, 100);
  try {
    const params = [];
    let where = '';
    if (category && category !== '全部') {
      params.push(category);
      where = ' WHERE category = $1';
    }
    params.push(limit, offsetRaw);
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
  if (!/^\d+$/.test(req.params.id)) return res.status(400).json({ error: '文章 id 无效' });
  const id = Number(req.params.id);
  if (id < 1 || id > 2147483647) return res.status(400).json({ error: '文章 id 无效' });
  try {
    const result = await query('SELECT * FROM articles WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: '文章不存在' });
    res.json({ article: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '获取文章失败' });
  }
});

export default router;
