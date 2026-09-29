import express from 'express';
import { query } from '../db.js';

const router = express.Router();

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

router.get('/', async (req, res) => {
  const rawLimit = req.query.limit === undefined ? DEFAULT_LIMIT : Number(req.query.limit);
  if (!Number.isInteger(rawLimit) || rawLimit < 1) return res.status(400).json({ error: 'limit 参数无效' });
  const limit = Math.min(rawLimit, MAX_LIMIT);
  const rawOffset = req.query.offset === undefined ? 0 : Number(req.query.offset);
  if (!Number.isInteger(rawOffset) || rawOffset < 0) return res.status(400).json({ error: 'offset 参数无效' });
  // 采集为定时任务，结果可缓存 5 分钟
  res.set('Cache-Control', 'public, max-age=300');
  try {
    // 列表不返回 excerpt 正文（详情接口才取），降低传输量
    const result = await query(
      `SELECT id, title, title_zh, summary, key_points, tags, read_time, link, source, published_at FROM security_news
       ORDER BY published_at DESC NULLS LAST, id DESC LIMIT $1 OFFSET $2`,
      [limit, rawOffset]
    );
    const totalRes = await query('SELECT count(*)::int AS n FROM security_news');
    res.json({ news: result.rows, total: totalRes.rows[0].n });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '获取安全资讯失败' });
  }
});

router.get('/:id', async (req, res) => {
  if (!/^\d+$/.test(req.params.id)) return res.status(400).json({ error: '安全资讯 id 无效' });
  const id = Number(req.params.id);
  if (id < 1 || id > 2147483647) return res.status(400).json({ error: '安全资讯 id 无效' });
  try {
    const result = await query(
      'SELECT id, title, title_zh, summary, key_points, tags, read_time, link, source, published_at, excerpt, content FROM security_news WHERE id = $1',
      [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: '安全资讯不存在' });
    res.json({ news: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '获取安全资讯详情失败' });
  }
});

export default router;
