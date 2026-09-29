import express from 'express';
import { query } from '../db.js';

const router = express.Router();

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

// 校验可选日期参数：YYYY-MM-DD，非法返回 400
function parseDate(raw) {
  if (raw === undefined || raw === '') return null;
  if (typeof raw !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) return 'invalid';
  const d = new Date(raw + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return 'invalid';
  return d;
}

router.get('/', async (req, res) => {
  const rawLimit = req.query.limit === undefined ? DEFAULT_LIMIT : Number(req.query.limit);
  if (!Number.isInteger(rawLimit) || rawLimit < 1) return res.status(400).json({ error: 'limit 参数无效' });
  const limit = Math.min(rawLimit, MAX_LIMIT);
  const rawOffset = req.query.offset === undefined ? 0 : Number(req.query.offset);
  if (!Number.isInteger(rawOffset) || rawOffset < 0) return res.status(400).json({ error: 'offset 参数无效' });
  const date = parseDate(req.query.date);
  if (date === 'invalid') return res.status(400).json({ error: 'date 参数无效' });
  // 采集为定时任务，结果可缓存 5 分钟
  res.set('Cache-Control', 'public, max-age=300');
  try {
    // 列表不返回 excerpt 正文（详情接口才取），降低传输量
    const params = [limit, rawOffset];
    let where = '';
    if (date) {
      // 按当天 00:00:00 ~ 次日 00:00:00 过滤；published_at 存 UTC 时刻，Date 对象参数由驱动序列化
      where = 'WHERE published_at >= $3 AND published_at < $4';
      params.push(date, new Date(date.getTime() + 24 * 60 * 60 * 1000));
    }
    const result = await query(
      `SELECT id, title, title_zh, summary, key_points, tags, read_time, link, source, published_at FROM news
       ${where} ORDER BY published_at DESC NULLS LAST, id DESC LIMIT $1 OFFSET $2`,
      params
    );
    const totalParams = date ? [params[2], params[3]] : [];
    const totalRes = await query(
      `SELECT count(*)::int AS n FROM news ${where ? 'WHERE published_at >= $1 AND published_at < $2' : ''}`,
      totalParams
    );
    res.json({ news: result.rows, total: totalRes.rows[0].n });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '获取快讯失败' });
  }
});

// 有数据的日期列表（最近 14 天，含各天条数），供日期条渲染。必须在 /:id 之前注册
router.get('/dates', async (req, res) => {
  res.set('Cache-Control', 'public, max-age=300');
  try {
    const result = await query(
      `SELECT to_char(published_at, 'YYYY-MM-DD') AS date, count(*)::int AS count
       FROM news
       WHERE published_at >= now() - interval '14 days'
       GROUP BY to_char(published_at, 'YYYY-MM-DD')
       ORDER BY date DESC`
    );
    res.json({ dates: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '获取快讯日期失败' });
  }
});

router.get('/:id', async (req, res) => {
  if (!/^\d+$/.test(req.params.id)) return res.status(400).json({ error: '快讯 id 无效' });
  const id = Number(req.params.id);
  if (id < 1 || id > 2147483647) return res.status(400).json({ error: '快讯 id 无效' });
  try {
    const result = await query(
      'SELECT id, title, title_zh, summary, key_points, tags, read_time, link, source, published_at, excerpt, content FROM news WHERE id = $1',
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
