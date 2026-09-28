import express from 'express';
import { query } from '../db.js';

const router = express.Router();

const CATEGORIES = ['财经', '政治', '军事', '游戏'];
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

// GET /api/news/today?date=YYYY-MM-DD&category=财经|全部&limit=20&offset=0
// 不传 date 默认返回最新有数据的一天；category 不传或「全部」返回全部分类
router.get('/', async (req, res) => {
  const category = req.query.category;
  if (category !== undefined && category !== '全部' && !CATEGORIES.includes(category)) {
    return res.status(400).json({ error: 'category 参数无效' });
  }
  let date = req.query.date;
  if (date !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: 'date 参数格式无效' });
  }
  const rawLimit = req.query.limit === undefined ? DEFAULT_LIMIT : Number(req.query.limit);
  if (!Number.isInteger(rawLimit) || rawLimit < 1) {
    return res.status(400).json({ error: 'limit 参数无效' });
  }
  const limit = Math.min(rawLimit, MAX_LIMIT);
  const rawOffset = req.query.offset === undefined ? 0 : Number(req.query.offset);
  if (!Number.isInteger(rawOffset) || rawOffset < 0) {
    return res.status(400).json({ error: 'offset 参数无效' });
  }
  // 同一天同一分类结果可缓存 5 分钟（采集为定时任务，数据不频繁变动）
  res.set('Cache-Control', 'public, max-age=300');
  try {
    if (!date) {
      const latest = await query('SELECT MAX(date)::text AS d FROM daily_news');
      date = latest.rows[0].d;
    }
    if (!date) {
      return res.json({ date: null, news: [], counts: {}, total: 0 });
    }

    const filterCat = category && category !== '全部';
    const base = `SELECT id, title, link, source, category, published_at, summary
                 FROM daily_news WHERE date = $1`;
    const whereCat = filterCat ? ' AND category = $2' : '';
    const order = ' ORDER BY published_at DESC NULLS LAST, id DESC LIMIT $' + (filterCat ? '3' : '2') + ' OFFSET $' + (filterCat ? '4' : '3');

    const params = filterCat ? [date, category, limit, rawOffset] : [date, limit, rawOffset];
    const rows = await query(base + whereCat + order, params);

    const countRes = await query(
      'SELECT category, count(*)::int AS n FROM daily_news WHERE date = $1 GROUP BY category',
      [date]
    );
    const counts = {};
    for (const c of CATEGORIES) counts[c] = 0;
    for (const r of countRes.rows) counts[r.category] = r.n;
    // total 从 counts 派生，省去一次查询往返
    const total = filterCat ? (counts[category] || 0) : Object.values(counts).reduce((a, b) => a + b, 0);

    res.json({ date, news: rows.rows, counts, total });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '获取今日新闻失败' });
  }
});

export default router;
