import express from 'express';
import jwt from 'jsonwebtoken';
import { query } from '../db.js';

const router = express.Router();

function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: '未登录' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ error: '登录已过期' });
  }
}

router.get('/', auth, async (req, res) => {
  try {
    const result = await query(
      `SELECT b.id, b.article_id, a.title, a.summary, a.category, a.read_time
       FROM bookmarks b JOIN articles a ON a.id = b.article_id
       WHERE b.user_id = $1 ORDER BY b.created_at DESC`,
      [req.user.id]
    );
    res.json({ bookmarks: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '获取收藏失败' });
  }
});

router.get('/check/:articleId', auth, async (req, res) => {
  try {
    const result = await query(
      'SELECT id FROM bookmarks WHERE user_id = $1 AND article_id = $2',
      [req.user.id, req.params.articleId]
    );
    res.json({ bookmarked: result.rows.length > 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '查询收藏状态失败' });
  }
});

router.post('/', auth, async (req, res) => {
  const { article_id } = req.body;
  if (!article_id) return res.status(400).json({ error: '缺少 article_id' });
  try {
    await query(
      'INSERT INTO bookmarks (user_id, article_id) VALUES ($1, $2)',
      [req.user.id, article_id]
    );
    res.json({ message: '收藏成功' });
  } catch (err) {
    if (err.code === '23505') return res.json({ message: '已收藏过' });
    console.error(err);
    res.status(500).json({ error: '收藏失败' });
  }
});

router.delete('/:articleId', auth, async (req, res) => {
  try {
    await query(
      'DELETE FROM bookmarks WHERE user_id = $1 AND article_id = $2',
      [req.user.id, req.params.articleId]
    );
    res.json({ message: '已取消收藏' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '取消收藏失败' });
  }
});

export default router;
