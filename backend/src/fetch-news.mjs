import { syncNews } from './news-sync.js';
import { pool } from './db.js';

try {
  const total = await syncNews();
  console.log('news 表: ' + total + ' 条（上限 300）');
} catch (err) {
  console.error('采集失败:', err.message);
  process.exitCode = 1;
}
await pool.end();
process.exit(0);
