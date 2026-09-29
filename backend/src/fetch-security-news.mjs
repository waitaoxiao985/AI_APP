import { syncSecurityNews } from './security-sync.js';
import { pool } from './db.js';

try {
  const total = await syncSecurityNews();
  console.log('security_news 表: ' + total + ' 条（上限 300）');
} catch (err) {
  console.error('安全资讯采集失败:', err.message);
  process.exitCode = 1;
}
await pool.end();
process.exit(0);
