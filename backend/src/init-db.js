import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from './db.js';
import { runSeedFiles } from './seed-deep.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sql = fs.readFileSync(path.join(__dirname, '..', 'init.sql'), 'utf8');

async function main() {
  try {
    await pool.query(sql);
    console.log('数据库初始化成功：users / articles / bookmarks 三张表 + 10 篇入门种子文章');
    await runSeedFiles();
    console.log('深度长文写入完成');
    await pool.query(sql);
    console.log('专题映射已同步');
  } catch (err) {
    console.error('初始化失败:', err.message);
    process.exit(1);
  }
  await pool.end();
}

main();
