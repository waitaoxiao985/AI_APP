import express from 'express';
import { query } from '../db.js';

const router = express.Router();

// 分类白名单：与 daily-news-sync.js 的 CATEGORIES 保持一致
const CATEGORIES = ['财经', '政治', '军事', '游戏'];

router.get('/', async (req, res) => {
  const raw = req.query.limit === undefined ? 20 : Number(req.query.limit);
  if (!Number.isInteger(raw) || raw < 1) return res.status(400).json({ error: 'limit 参数无效' });
  const limit = Math.min(raw, 100);
  const category = req.query.category;
  if (category !== undefined && !CATEGORIES.includes(category)) {
    return res.status(400).json({ error: 'category 参数无效' });
  }
  try {
    const base = `SELECT id, title, link, source, category, published_at, excerpt FROM daily_news`;
    const order = `ORDER BY published_at DESC NULLS LAST, id DESC LIMIT $1`;
    const result = category
      ? await query(`${base} WHERE category = $2 ${order}`, [limit, category])
      : await query(`${base} ${order}`, [limit]);
    res.json({ news: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '获取今日新闻失败' });
  }
});

export default router;
