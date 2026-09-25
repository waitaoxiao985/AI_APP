import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sql = fs.readFileSync(path.join(__dirname, '..', 'init.sql'), 'utf8');

async function main() {
  try {
    await pool.query('DROP TABLE IF EXISTS bookmarks');
    await pool.query('DROP TABLE IF EXISTS articles');
    await pool.query('DROP TABLE IF EXISTS users');
    console.log('已清空 bookmarks / articles / users 三张表');
    await pool.query(sql);
    console.log('表结构重建完成，入门种子文章写入完成');
    const seedFile = path.join(__dirname, '..', 'seed-deep-articles.sql');
    if (fs.existsSync(seedFile)) {
      await pool.query(fs.readFileSync(seedFile, 'utf8'));
      console.log('深度长文写入完成');
    }
  } catch (err) {
    console.error('重置失败:', err.message);
    process.exit(1);
  }
  await pool.end();
}

main();
