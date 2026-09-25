import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const SEED_FILES = ['seed-deep-articles.sql'];

export async function runSeedFiles() {
  for (const name of SEED_FILES) {
    const file = path.join(__dirname, '..', name);
    if (!fs.existsSync(file)) continue;
    const sql = fs.readFileSync(file, 'utf8');
    await pool.query(sql);
    console.log(`已执行种子脚本: ${name}`);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runSeedFiles()
    .then(() => pool.end())
    .catch((err) => {
      console.error('种子数据写入失败:', err.message);
      process.exit(1);
    });
}
