import express from 'express';
import { query } from '../db.js';

const router = express.Router();

router.get('/', async (req, res) => {
  const raw = req.query.limit === undefined ? 20 : Number(req.query.limit);
  if (!Number.isInteger(raw) || raw < 1) return res.status(400).json({ error: 'limit 参数无效' });
  const limit = Math.min(raw, 50);
  try {
    const result = await query(
      `SELECT id, title, link, source, published_at, excerpt FROM news
       ORDER BY published_at DESC NULLS LAST, id DESC LIMIT $1`,
      [limit]
    );
    res.json({ news: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '获取快讯失败' });
  }
});

router.get('/:id', async (req, res) => {
  if (!/^\d+$/.test(req.params.id)) return res.status(400).json({ error: '快讯 id 无效' });
  const id = Number(req.params.id);
  if (id < 1 || id > 2147483647) return res.status(400).json({ error: '快讯 id 无效' });
  try {
    const result = await query(
      'SELECT id, title, link, source, published_at, excerpt, content FROM news WHERE id = $1',
      [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: '快讯不存在' });
    res.json({ news: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '获取快讯详情失败' });
  }
});

export default router;
