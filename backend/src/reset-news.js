// 一次性脚本：清空 news 表，让快讯「从 cutoff 日重新积累」。
// 用法：
//   node src/reset-news.js            # 只打印快照（行数 + source 分布），不删除
//   CONFIRM=1 node src/reset-news.js  # 确认后真正 TRUNCATE
// 幂等：重复执行无副作用。不接入 cron / 启动流程。

import { query, pool } from './db.js';

function parseBool(v) {
  return v === '1' || v === 'true' || v === 'yes';
}

async function main() {
  const confirm = parseBool(process.env.CONFIRM);

  // 1) 操作前快照
  const total = await query('SELECT count(*)::int AS n FROM news');
  console.log(`[snapshot] news 当前行数: ${total.rows[0].n}`);

  const bySource = await query(
    `SELECT coalesce(source, '(空)') AS source, count(*)::int AS n
     FROM news GROUP BY source ORDER BY n DESC`
  );
  console.log('[snapshot] 各 source 分布:');
  if (bySource.rows.length === 0) {
    console.log('  (空表)');
  } else {
    for (const r of bySource.rows) {
      console.log(`  ${r.source}: ${r.n}`);
    }
  }

  // 2) 外键依赖检查：有其它表引用 news 则中止，不擅自删
  const fk = await query(
    `SELECT
       tc.table_name AS child_table,
       kcu.column_name AS child_column
     FROM information_schema.table_constraints tc
     JOIN information_schema.key_column_usage kcu
       ON tc.constraint_name = kcu.constraint_name
     JOIN information_schema.constraint_column_usage ccu
       ON tc.constraint_name = ccu.constraint_name
     WHERE tc.constraint_type = 'FOREIGN KEY'
       AND ccu.table_name = 'news'`
  );
  if (fk.rows.length > 0) {
    console.error('[abort] 检测到引用 news 的外键，中止删除：');
    for (const r of fk.rows) console.error(`  ${r.child_table}.${r.child_column}`);
    await pool.end();
    process.exit(1);
  }

  // 3) 未确认：只打印快照后退出
  if (!confirm) {
    console.log('\n[dry-run] 未设置 CONFIRM=1，未执行删除。确认无误后用 `CONFIRM=1 node src/reset-news.js` 执行。');
    await pool.end();
    return;
  }

  // 4) 确认：TRUNCATE 并重置自增
  await query('TRUNCATE TABLE news RESTART IDENTITY');
  const after = await query('SELECT count(*)::int AS n FROM news');
  console.log(`[done] 已清空 news，当前行数: ${after.rows[0].n}`);

  await pool.end();
}

main().catch(async (e) => {
  console.error('[error]', e && e.message);
  try { await pool.end(); } catch {}
  process.exit(1);
});
