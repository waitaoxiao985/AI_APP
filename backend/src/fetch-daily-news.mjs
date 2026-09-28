import { syncDailyNews } from './daily-news-sync.js';
import { pool } from './db.js';

try {
  const total = await syncDailyNews();
  console.log('daily_news 表: ' + total + ' 条（每分类上限 100）');
} catch (err) {
  console.error('采集失败:', err.message);
  process.exitCode = 1;
}
await pool.end();
process.exit(0);
