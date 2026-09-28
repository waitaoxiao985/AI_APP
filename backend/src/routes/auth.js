import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { query } from '../db.js';

const router = express.Router();

// H1: 登录/注册限流，同一 IP 5 分钟最多 10 次，防暴力破解与撞库
const authLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: '请求过于频繁，请稍后再试' }
});
router.use(authLimiter);

const TOKEN_EXPIRES_IN = '2d'; // M1: 缩短 token 有效期
const GENERIC_AUTH_ERROR = '用户名或密码错误';

router.post('/register', async (req, res) => {
  const { username, password, nickname } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码不能为空' });
  }
  // M2: 基础口令策略
  if (typeof username !== 'string' || username.length < 3 || username.length > 20) {
    return res.status(400).json({ error: '用户名长度需为 3-20 个字符' });
  }
  if (typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({ error: '密码至少 6 位' });
  }
  try {
    const exists = await query('SELECT id FROM users WHERE username = $1', [username]);
    if (exists.rows.length > 0) {
      // M5: 不暴露用户名是否存在，统一提示
      return res.status(400).json({ error: '注册失败，请更换用户名后重试' });
    }
    const hash = await bcrypt.hash(password, 10);
    const result = await query(
      'INSERT INTO users (username, password, nickname) VALUES ($1, $2, $3) RETURNING id, username, nickname',
      [username, hash, nickname || username]
    );
    const user = result.rows[0];
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: TOKEN_EXPIRES_IN });
    res.json({ token, user });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: '注册失败' });
  }
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码不能为空' });
  }
  try {
    const result = await query('SELECT * FROM users WHERE username = $1', [username]);
    if (result.rows.length === 0) {
      return res.status(400).json({ error: GENERIC_AUTH_ERROR });
    }
    const user = result.rows[0];
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.status(400).json({ error: GENERIC_AUTH_ERROR });
    }
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: TOKEN_EXPIRES_IN });
    res.json({ token, user: { id: user.id, username: user.username, nickname: user.nickname } });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: '登录失败' });
  }
});

router.get('/me', async (req, res) => {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: '未登录' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const result = await query('SELECT id, username, nickname FROM users WHERE id = $1', [payload.id]);
    if (result.rows.length === 0) return res.status(401).json({ error: '用户不存在' });
    res.json({ user: result.rows[0] });
  } catch (err) {
    return res.status(401).json({ error: '登录已过期' });
  }
});

export default router;
