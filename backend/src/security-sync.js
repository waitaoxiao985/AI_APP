import Parser from 'rss-parser';
import { query } from './db.js';
import { enrichSecurityItem } from './security-enrich.js';

// 自建 RSSHub 服务地址（本地默认 http://localhost:1200）。
// 未配置时全部走原生 feed；配置后，带 rsshub 字段的源优先走 RSSHub（可取到全文），失败自动回退原生 feed。
const RSSHUB_BASE = process.env.RSSHUB_BASE_URL ? process.env.RSSHUB_BASE_URL.replace(/\/+$/, '') : '';

// 网络安全源：优先中文，英文源走 translate.js 翻译。
// 仅保留实测可达的源；带 rsshub 的优先经 RSSHub 取全文，原生 feed 兜底。
const SOURCES = [
  { name: 'FreeBuf', url: 'https://www.freebuf.com/feed' },
  { name: '嘶吼', rsshub: '/4hou', url: 'https://www.4hou.com/feed' },
  { name: 'BleepingComputer', url: 'https://www.bleepingcomputer.com/feed/' },
  { name: 'Krebs', url: 'https://krebsonsecurity.com/feed/' },
  { name: 'The Hacker News', url: 'https://thehackernews.com/feeds/posts/default' }
];

const MAX_SECURITY_NEWS = 300;

// 正文短于该长度的，视为源站未在 feed 中提供全文，只留标题 + 摘要 + 原文链接
const MIN_CONTENT = 120;

// 降级源：其 RSS 只推标题与跳转链接，正文永远是空壳，强制按「标题 + 原文链接」处理。
const EXCERPT_ONLY_SOURCES = new Set();

const CLICK_THROUGH_STUB = /^(点击查看原文|点击原文|阅读全文|阅读原文)[>＞:：\s]*$/i;

// 入库 cutoff：只保留 published_at >= 该时间的文章。
// 环境变量 SEC_MIN_PUBLISH_DATE 可指定绝对日期（YYYY-MM-DD）；未设置时默认最近 7 天。
const CUTOFF_DATE = (() => {
  const raw = (process.env.SEC_MIN_PUBLISH_DATE || '').trim();
  if (raw) {
    const d = new Date(raw + 'T00:00:00');
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const d = new Date();
  d.setDate(d.getDate() - 7);
  d.setHours(0, 0, 0, 0);
  return d;
})();

function beforeCutoff(item) {
  if (!CUTOFF_DATE) return false;
  const t = item && item.publishedAt;
  // 无发布时间的条目无法判定新旧，保留（宁缺毋滥的反向：不丢未知时间的新内容）
  if (!t || Number.isNaN(t.getTime())) return false;
  return t < CUTOFF_DATE;
}

function stripHtml(html) {
  return String(html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|h[1-6]|li|tr|blockquote)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function toExcerpt(text) {
  return text.replace(/\n+/g, ' ').replace(/\s{2,}/g, ' ').trim().slice(0, 160);
}

function cleanSnippet(text) {
  const s = toExcerpt(text);
  if (CLICK_THROUGH_STUB.test(s)) return '';
  return s;
}

// 幂等建表 + 补列。openGauss 不支持 ADD COLUMN IF NOT EXISTS，先查 information_schema 再普通 ADD。
async function ensureSecurityColumns() {
  await query(`CREATE TABLE IF NOT EXISTS security_news (
    id SERIAL PRIMARY KEY,
    title VARCHAR(300) NOT NULL,
    link VARCHAR(500) UNIQUE NOT NULL,
    source VARCHAR(100),
    published_at TIMESTAMP,
    excerpt VARCHAR(500),
    content TEXT,
    title_zh VARCHAR(300),
    summary VARCHAR(200),
    key_points TEXT,
    tags TEXT,
    read_time VARCHAR(20),
    fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);
  const res = await query("SELECT column_name FROM information_schema.columns WHERE table_name = 'security_news'");
  const cols = new Set(res.rows.map((r) => r.column_name));
  if (!cols.has('title_zh')) {
    await query('ALTER TABLE security_news ADD COLUMN title_zh VARCHAR(300)');
  }
  if (!cols.has('summary')) {
    await query('ALTER TABLE security_news ADD COLUMN summary VARCHAR(200)');
  }
  if (!cols.has('key_points')) {
    await query('ALTER TABLE security_news ADD COLUMN key_points TEXT');
  }
  if (!cols.has('tags')) {
    await query('ALTER TABLE security_news ADD COLUMN tags TEXT');
  }
  if (!cols.has('read_time')) {
    await query('ALTER TABLE security_news ADD COLUMN read_time VARCHAR(20)');
  }
}

async function insertSecurityNews(item) {
  const keyPoints = item.key_points && item.key_points.length ? JSON.stringify(item.key_points) : null;
  const tags = item.tags && item.tags.length ? JSON.stringify(item.tags) : null;
  await query(
    `INSERT INTO security_news (title, link, source, published_at, excerpt, content, title_zh, summary, key_points, tags, read_time)
     SELECT $1::varchar(300), $2::varchar(500), $3::varchar(100), $4::timestamp, $5::varchar(500), $6::text, $7::varchar(300), $8::varchar(200), $9::text, $10::text, $11::varchar(20)
     WHERE NOT EXISTS (SELECT 1 FROM security_news WHERE link = $2)`,
    [item.title, item.link, item.source, item.publishedAt, item.excerpt, item.content, item.title_zh || null, item.summary || null, keyPoints, tags, item.read_time || null]
  );
}

const AD_RE = /赞助|sponsored|广告|推广|ADV|promoted/i;
function isAd(item) {
  return AD_RE.test(String(item.title || '')) || AD_RE.test(String(item.excerpt || ''));
}

// 抓取单个 RSS 源，只收集条目不写库；RSSHub 优先、原生 feed 兜底
async function fetchSource(source) {
  const parser = new Parser({ timeout: 30000 });
  const candidates = [];
  if (RSSHUB_BASE && source.rsshub) candidates.push(RSSHUB_BASE + source.rsshub);
  if (source.url) candidates.push(source.url);
  let feed = null;
  let lastError = null;
  for (const url of candidates) {
    try {
      feed = await parser.parseURL(url);
      break;
    } catch (e) {
      lastError = e;
    }
  }
  if (!feed) throw lastError || new Error('无可用订阅源');
  const items = [];
  const excerptOnly = EXCERPT_ONLY_SOURCES.has(source.name);
  for (const raw of feed.items || []) {
    const title = String(raw.title || '').trim().slice(0, 300);
    const link = String(raw.link || '').trim().slice(0, 500);
    if (!title || !link) continue;
    const bodyHtml = raw['content:encoded'] || raw.content || raw.contentSnippet || '';
    const stripped = stripHtml(bodyHtml);
    const content = !excerptOnly && stripped.length >= MIN_CONTENT ? stripped : null;
    let excerpt = content ? toExcerpt(content) : cleanSnippet(stripped);
    if (excerpt.length < 8) excerpt = '';
    const publishedAt = raw.isoDate ? new Date(raw.isoDate) : null;
    items.push({
      title,
      link,
      source: source.name,
      publishedAt: publishedAt && !Number.isNaN(publishedAt.getTime()) ? publishedAt : null,
      excerpt,
      content
    });
  }
  return items;
}

export async function syncSecurityNews() {
  await ensureSecurityColumns();

  // 收集：并行抓取，单源失败不阻塞其他源
  const settled = await Promise.allSettled(SOURCES.map((source) => fetchSource(source)));
  const rssItems = [];
  settled.forEach((r, i) => {
    if (r.status === 'fulfilled') {
      console.log(`[sec ok] ${SOURCES[i].name}: 扫描 ${r.value.length} 条`);
      rssItems.push(...r.value);
    } else {
      console.log(`[sec skip] ${SOURCES[i].name}: ${r.reason && r.reason.message}`);
    }
  });

  // 批内按 link 去重（首个保留）
  const seenLink = new Set();
  const candidates = [];
  for (const it of rssItems) {
    if (seenLink.has(it.link)) continue;
    seenLink.add(it.link);
    candidates.push(it);
  }

  // 与库比对：已存在条目保留回填行为，新条目进入过滤
  const fresh = [];
  if (candidates.length) {
    const links = candidates.map((it) => it.link);
    const ph = links.map((_, i) => '$' + (i + 1)).join(', ');
    const existed = await query(`SELECT link FROM security_news WHERE link IN (${ph})`, links);
    const known = new Set(existed.rows.map((r) => r.link));
    for (const it of candidates) {
      if (!known.has(it.link)) {
        fresh.push(it);
        continue;
      }
      if (it.content) {
        await query(
          `UPDATE security_news SET content = $2, excerpt = COALESCE(NULLIF(excerpt, ''), $3)
             WHERE link = $1 AND content IS NULL`,
          [it.link, it.content, it.excerpt]
        );
      }
    }
  }

  // 新条目过滤：cutoff + 广告
  let adDropped = 0;
  let cutoffDropped = 0;
  const toInsert = fresh.filter((it) => {
    if (beforeCutoff(it)) {
      cutoffDropped++;
      return false;
    }
    if (isAd(it)) {
      adDropped++;
      return false;
    }
    return true;
  });
  if (CUTOFF_DATE && cutoffDropped) {
    console.log(`[sec ok] cutoff 过滤: 丢弃 ${cutoffDropped} 条`);
  }
  if (adDropped) console.log(`[sec ok] 广告过滤: 丢弃 ${adDropped} 条`);

  // 入库前对每条做规则富化（翻译 + 摘要/观点/标签/时长）；单条失败仅该字段为空
  for (const it of toInsert) {
    try {
      const enriched = await enrichSecurityItem(it);
      it.title_zh = enriched.title_zh || it.title_zh || null;
      it.summary = enriched.summary || it.summary || null;
      it.key_points = enriched.key_points;
      it.tags = enriched.tags;
      it.read_time = enriched.read_time;
    } catch (e) {
      console.log(`[sec skip] 富化失败 ${it.title && it.title.slice(0, 30)}: ${e && e.message}`);
    }
    await insertSecurityNews(it);
  }

  // ---- 存量治理（幂等）----
  await query('UPDATE security_news SET title_zh = title WHERE title_zh IS NULL');
  await query(
    "UPDATE security_news SET summary = COALESCE(NULLIF(left(coalesce(excerpt, ''), 50), ''), '') WHERE summary IS NULL"
  );
  await query('UPDATE security_news SET content = NULL WHERE length(coalesce(content, \'\')) < $1', [MIN_CONTENT]);
  await query("UPDATE security_news SET excerpt = '' WHERE excerpt LIKE '点击查看原文%'");
  const stubNames = [...EXCERPT_ONLY_SOURCES];
  if (stubNames.length) {
    const ph = stubNames.map((_, i) => '$' + (i + 1)).join(', ');
    await query(`UPDATE security_news SET content = NULL WHERE content IS NOT NULL AND source IN (${ph})`, stubNames);
  }
  // 裁剪：只保留最新 MAX_SECURITY_NEWS 条
  await query(
    'DELETE FROM security_news WHERE id NOT IN (SELECT id FROM security_news ORDER BY fetched_at DESC, id DESC LIMIT ' + MAX_SECURITY_NEWS + ')'
  );

  const total = await query('SELECT count(*)::int AS n FROM security_news');
  return total.rows[0].n;
}
