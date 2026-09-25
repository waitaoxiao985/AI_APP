import express from 'express';
import { query } from '../db.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const result = await query(
      `SELECT t.id, t.title, t.subtitle, count(ta.article_id)::int AS article_count
       FROM topics t LEFT JOIN topic_articles ta ON ta.topic_id = t.id
       GROUP BY t.id, t.title, t.subtitle ORDER BY t.id`
    );
    res.json({ topics: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '获取专题失败' });
  }
});

router.get('/:id', async (req, res) => {
  if (!/^\d+$/.test(req.params.id)) return res.status(400).json({ error: '专题 id 无效' });
  const id = Number(req.params.id);
  if (id < 1 || id > 2147483647) return res.status(400).json({ error: '专题 id 无效' });
  try {
    const t = await query('SELECT id, title, subtitle FROM topics WHERE id = $1', [id]);
    if (t.rows.length === 0) return res.status(404).json({ error: '专题不存在' });
    const a = await query(
      `SELECT a.id, a.title, a.summary, a.category, a.read_time, a.created_at
       FROM topic_articles ta JOIN articles a ON a.id = ta.article_id
       WHERE ta.topic_id = $1 ORDER BY a.id`,
      [id]
    );
    res.json({ topic: t.rows[0], articles: a.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '获取专题详情失败' });
  }
});

export default router;
