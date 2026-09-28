import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import cron from 'node-cron';
import { syncNews } from './news-sync.js';
import { syncDailyNews } from './daily-news-sync.js';
import authRoutes from './routes/auth.js';
import articleRoutes from './routes/articles.js';
import bookmarkRoutes from './routes/bookmarks.js';
import topicRoutes from './routes/topics.js';
import newsRoutes from './routes/news.js';
import dailyNewsRoutes from './routes/daily-news.js';
import newsTodayRoutes from './routes/news-today.js';

dotenv.config();

// C1: JWT_SECRET 强度校验，弱密钥或留空时拒绝启动
const WEAK_SECRETS = new Set(['ai-app-secret-2026', 'change-me', '', 'secret']);
const secret = process.env.JWT_SECRET || '';
if (WEAK_SECRETS.has(secret) || Buffer.byteLength(secret, 'utf8') < 32) {
  console.error('JWT_SECRET 强度不足或未配置，请设置 32 字节以上的随机密钥后再启动');
  process.exit(1);
}

const app = express();

// H3: 安全响应头
app.use(
  helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: 'cross-origin' } })
);

// H2: CORS 白名单，来源从 CORS_ORIGIN（逗号分隔）读取，未配置则默认本地开发地址
const allowOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
app.use(
  cors({
    origin(origin, cb) {
      // 无 origin（同源/curl）或在白名单内则放行；否则不带 ACAO 头，由浏览器拦截
      if (!origin || allowOrigins.includes(origin)) return cb(null, true);
      return cb(null, false);
    }
  })
);

// L1: 限制请求体大小，防大体量 DoS
app.use(express.json({ limit: '64kb' }));

app.get('/health', (req, res) => {
  res.json({ ok: true });
});

app.get('/api/news/sync', async (req, res) => {
  const token = process.env.SYNC_TOKEN;
  const bearer = (req.headers.authorization || '').startsWith('Bearer ')
    ? req.headers.authorization.slice(7)
    : null;
  // M4: 优先走 Header；query token 兼容保留
  if (token && req.query.token && req.query.token === token) {
    console.warn('/api/news/sync 仍在使用 query token，建议改用 Authorization: Bearer 头');
  }
  const authed =
    (token && (bearer === token || req.query.token === token)) ||
    (process.env.CRON_SECRET && bearer === process.env.CRON_SECRET);
  if (!authed) {
    return res.status(401).json({ error: 'token 无效' });
  }
  if (process.env.VERCEL) {
    try {
      const [total] = await Promise.all([syncNews(), syncDailyNews()]);
      res.json({ ok: true, total });
    } catch (e) {
      console.error('新闻采集失败（手动触发）:', e.message);
      res.status(500).json({ error: '采集失败' });
    }
    return;
  }
  res.json({ ok: true, started: true });
  syncNews()
    .then((n) => console.log(`新闻采集完成（手动触发）: ${n} 条`))
    .catch((e) => console.error('新闻采集失败（手动触发）:', e.message));
  syncDailyNews()
    .then((n) => console.log(`今日新闻采集完成（手动触发）: ${n} 条`))
    .catch((e) => console.error('今日新闻采集失败（手动触发）:', e.message));
});

app.use('/api/auth', authRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/bookmarks', bookmarkRoutes);
app.use('/api/topics', topicRoutes);
app.use('/api/news/today', newsTodayRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/daily-news', dailyNewsRoutes);

app.use((err, req, res, next) => {
  // L2: 生产环境只打印 message，避免堆栈与敏感信息落日志
  console.error(process.env.NODE_ENV === 'production' ? err.message : err);
  res.status(500).json({ error: '服务器内部错误' });
});

function runNewsSync(tag) {
  syncNews()
    .then((n) => console.log(`新闻采集完成（${tag}）: ${n} 条`))
    .catch((e) => console.error(`新闻采集失败（${tag}）: `, e.message));
}

function runDailyNewsSync(tag) {
  syncDailyNews()
    .then((n) => console.log(`今日新闻采集完成（${tag}）: ${n} 条`))
    .catch((e) => console.error(`今日新闻采集失败（${tag}）: `, e.message));
}

const PORT = process.env.PORT || 3003;

if (!process.env.VERCEL) {
  cron.schedule('30 8 * * *', () => runNewsSync('定时 08:30'));
  cron.schedule('35 8 * * *', () => runDailyNewsSync('定时 08:35'));
  cron.schedule('35 20 * * *', () => runDailyNewsSync('定时 20:35'));
  runNewsSync('启动补跑');
  runDailyNewsSync('启动补跑');
  app.listen(PORT, () => console.log(`后端已启动: http://localhost:${PORT}`));
}

export default app;
