import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sql = fs.readFileSync(path.join(__dirname, '..', 'init.sql'), 'utf8');

async function main() {
  try {
    await pool.query(sql);
    console.log('数据库初始化成功：users / articles / bookmarks 三张表 + 10 篇种子文章');
  } catch (err) {
    console.error('初始化失败:', err.message);
    process.exit(1);
  }
  await pool.end();
}

main();
