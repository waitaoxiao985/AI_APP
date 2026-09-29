import express from 'express';
import jwt from 'jsonwebtoken';
import { ensurePushTable, saveSubscription, getVapidPublicKey } from '../push.js';

const router = express.Router();

router.use(async (req, res, next) => {
  try {
    await ensurePushTable();
    next();
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: '推送服务初始化失败' });
  }
});

// 公开 VAPID 公钥（前端订阅要用）
router.get('/vapid-key', (req, res) => {
  const key = getVapidPublicKey();
  if (!key) return res.status(500).json({ error: '推送未配置' });
  res.json({ publicKey: key });
});

// 从 Bearer token 解析用户 id（可选，订阅可不登录）
function parseUserId(req) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET).id;
  } catch {
    return null;
  }
}

router.post('/subscribe', async (req, res) => {
  try {
    const userId = parseUserId(req);
    await saveSubscription(req.body, userId);
    res.json({ ok: true });
  } catch (err) {
    console.error(err.message);
    res.status(400).json({ error: '订阅失败' });
  }
});

export default router;
