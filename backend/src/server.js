import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cron from 'node-cron';
import { syncNews } from './news-sync.js';
import authRoutes from './routes/auth.js';
import articleRoutes from './routes/articles.js';
import bookmarkRoutes from './routes/bookmarks.js';
import topicRoutes from './routes/topics.js';
import newsRoutes from './routes/news.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ ok: true });
});

app.get('/api/news/sync', (req, res) => {
  const token = process.env.SYNC_TOKEN;
  if (!token || req.query.token !== token) {
    return res.status(401).json({ error: 'token 无效' });
  }
  res.json({ ok: true, started: true });
  syncNews()
    .then((n) => console.log(`新闻采集完成（手动触发）: ${n} 条`))
    .catch((e) => console.error('新闻采集失败（手动触发）:', e.message));
});

app.use('/api/auth', authRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/bookmarks', bookmarkRoutes);
app.use('/api/topics', topicRoutes);
app.use('/api/news', newsRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: '服务器内部错误' });
});

function runNewsSync(tag) {
  syncNews()
    .then((n) => console.log(`新闻采集完成（${tag}）: ${n} 条`))
    .catch((e) => console.error(`新闻采集失败（${tag}）: `, e.message));
}

cron.schedule('30 8 * * *', () => runNewsSync('定时 08:30'));
runNewsSync('启动补跑');

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => console.log(`后端已启动: http://localhost:${PORT}`));
