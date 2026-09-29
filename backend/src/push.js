import webpush from 'web-push';
import { query } from './db.js';

// 幂等建表：存储 Web Push 订阅
export async function ensurePushTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS push_subscriptions (
      id SERIAL PRIMARY KEY,
      endpoint TEXT UNIQUE NOT NULL,
      p256dh TEXT NOT NULL,
      auth TEXT NOT NULL,
      user_id INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

function vapidConfigured() {
  return !!(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
}

export function getVapidPublicKey() {
  return process.env.VAPID_PUBLIC_KEY || null;
}

// 新增订阅（按 endpoint 去重）
export async function saveSubscription(sub, userId) {
  const { endpoint, keys } = sub || {};
  if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
    throw new Error('订阅信息不完整');
  }
  await query(
    `INSERT INTO push_subscriptions (endpoint, p256dh, auth, user_id)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (endpoint) DO UPDATE SET p256dh = EXCLUDED.p256dh, auth = EXCLUDED.auth, user_id = EXCLUDED.user_id`,
    [endpoint, keys.p256dh, keys.auth, userId || null]
  );
}

// 取全部订阅
async function allSubscriptions() {
  const res = await query('SELECT id, endpoint, p256dh, auth FROM push_subscriptions');
  return res.rows;
}

// 删除失效订阅（404/410）
async function removeSubscription(id) {
  await query('DELETE FROM push_subscriptions WHERE id = $1', [id]);
}

// 向所有订阅者推送一条通知；返回成功数
export async function broadcastPush({ title, body, url }) {
  if (!vapidConfigured()) {
    console.warn('未配置 VAPID，跳过推送');
    return 0;
  }
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:noreply@example.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );

  const subs = await allSubscriptions();
  const payload = JSON.stringify({ title, body, url });
  let ok = 0;
  for (const s of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        payload
      );
      ok++;
    } catch (err) {
      // 404/410 = 订阅已失效，清理
      if (err.statusCode === 404 || err.statusCode === 410) {
        await removeSubscription(s.id).catch(() => {});
      } else {
        console.error('推送失败:', err.statusCode || err.message);
      }
    }
  }
  return ok;
}
