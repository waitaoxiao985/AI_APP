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

export function dailyPicks(rows, seed, n = 3) {
  const scored = rows.map((r) => {
    let h = Math.imul(r.id ^ seed, 2654435761);
    h = Math.imul(h ^ (h >>> 15), 2246822519);
    h = Math.imul(h ^ (h >>> 13), 3266489917);
    return { r, k: (h ^ (h >>> 16)) >>> 0 };
  });
  scored.sort((a, b) => a.k - b.k);
  const picked = [];
  const usedCats = new Set();
  for (const { r } of scored) {
    if (picked.length >= n) break;
    if (!usedCats.has(r.category)) {
      picked.push(r);
      usedCats.add(r.category);
    }
  }
  for (const { r } of scored) {
    if (picked.length >= n) break;
    if (!picked.includes(r)) picked.push(r);
  }
  return picked;
}

router.get('/daily', async (req, res) => {
  try {
    const result = await query(
      'SELECT id, title, summary, category, read_time, created_at FROM articles ORDER BY id'
    );
    const seed = Math.floor(Date.now() / 86400000);
    res.json({
      date: new Date().toISOString().slice(0, 10),
      articles: dailyPicks(result.rows, seed)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '获取今日推荐失败' });
  }
});

function logSearch(term) {
  const t = term.slice(0, 100);
  query('UPDATE search_logs SET hits = hits + 1, updated_at = CURRENT_TIMESTAMP WHERE term = $1', [t])
    .then(() =>
      query(
        'INSERT INTO search_logs (term, hits) SELECT $1::varchar(100), 1 WHERE NOT EXISTS (SELECT 1 FROM search_logs WHERE term = $1)',
        [t]
      )
    )
    .catch((e) => console.error('logSearch failed:', e.message));
}

router.get('/search/hot', async (req, res) => {
  try {
    const result = await query(
      'SELECT term FROM search_logs ORDER BY hits DESC, updated_at DESC LIMIT 8'
    );
    res.json({ hot: result.rows.map((r) => r.term) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '获取热词失败' });
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
    logSearch(q);
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
