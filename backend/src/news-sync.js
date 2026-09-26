import Parser from 'rss-parser';
import { query } from './db.js';

const SOURCES = [
  { name: 'Hacker News', url: 'https://hnrss.org/frontpage' },
  { name: 'InfoQ中文', url: 'https://www.infoq.cn/feed' },
  { name: '少数派', url: 'https://sspai.com/feed' },
  { name: '量子位', url: 'https://www.qbitai.com/feed' },
  { name: 'Google AI', url: 'https://blog.google/technology/ai/rss/' },
  { name: 'TechCrunch', url: 'https://techcrunch.com/feed/' },
  { name: '阮一峰', url: 'https://www.ruanyifeng.com/blog/atom.xml' },
  { name: 'Cloudflare Blog', url: 'https://blog.cloudflare.com/rss/' }
];

const MAX_NEWS = 300;

// 正文短于该长度的，视为源站未在 feed 中提供全文（如 TechCrunch 的摘要式 feed）
const MIN_CONTENT = 120;

// 这些源的 RSS 只推标题与跳转链接，正文永远是空壳，按「标题 + 原文链接」降级处理
const EXCERPT_ONLY_SOURCES = new Set(['InfoQ中文', '量子位', '少数派', 'Google AI']);

const CLICK_THROUGH_STUB = /^(点击查看原文|点击原文|阅读全文|阅读原文)[>＞:：\s]*$/i;

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

// 去掉「点击查看原文」这类跳转占位，留下真正有信息量的摘要
function cleanSnippet(text) {
  const s = toExcerpt(text);
  if (CLICK_THROUGH_STUB.test(s)) return '';
  return s;
}

async function insertNews(item) {
  await query(
    `INSERT INTO news (title, link, source, published_at, excerpt, content)
     SELECT $1::varchar(300), $2::varchar(500), $3::varchar(100), $4::timestamp, $5::varchar(500), $6::text
     WHERE NOT EXISTS (SELECT 1 FROM news WHERE link = $2)`,
    [item.title, item.link, item.source, item.publishedAt, item.excerpt, item.content]
  );
}

async function fetchSource(source) {
  const parser = new Parser({ timeout: 12000 });
  const feed = await parser.parseURL(source.url);
  let scanned = 0;
  const excerptOnly = EXCERPT_ONLY_SOURCES.has(source.name);
  for (const raw of feed.items || []) {
    const title = String(raw.title || '').trim().slice(0, 300);
    const link = String(raw.link || '').trim().slice(0, 500);
    if (!title || !link) continue;
    const bodyHtml = raw['content:encoded'] || raw.content || raw.contentSnippet || '';
    const stripped = stripHtml(bodyHtml);
    // 只有源站真给了全文（且非降级源）才入库正文，否则只留标题 + 链接
    const content = !excerptOnly && stripped.length >= MIN_CONTENT ? stripped : null;
    let excerpt = content ? toExcerpt(content) : cleanSnippet(stripped);
    if (excerpt.length < 8) excerpt = '';
    const publishedAt = raw.isoDate ? new Date(raw.isoDate) : null;
    await insertNews({
      title,
      link,
      source: source.name,
      publishedAt: publishedAt && !Number.isNaN(publishedAt.getTime()) ? publishedAt : null,
      excerpt,
      content
    });
    scanned++;
  }
  return scanned;
}

export async function syncNews() {
  const results = await Promise.allSettled(SOURCES.map((source) => fetchSource(source)));
  results.forEach((r, i) => {
    if (r.status === 'fulfilled') {
      console.log(`[ok] ${SOURCES[i].name}: 扫描 ${r.value} 条`);
    } else {
      console.log(`[skip] ${SOURCES[i].name}: ${r.reason && r.reason.message}`);
    }
  });
  await query(
    'DELETE FROM news WHERE id NOT IN (SELECT id FROM news ORDER BY fetched_at DESC, id DESC LIMIT ' + MAX_NEWS + ')'
  );
  // 存量清理（幂等）：短于阈值的空壳正文、跳转占位摘要、降级源的正文一律清掉
  await query('UPDATE news SET content = NULL WHERE length(coalesce(content, \'\')) < $1', [MIN_CONTENT]);
  await query('UPDATE news SET excerpt = \'\' WHERE excerpt LIKE \'点击查看原文%\'');
  const stubNames = [...EXCERPT_ONLY_SOURCES];
  if (stubNames.length) {
    const ph = stubNames.map((_, i) => '$' + (i + 1)).join(', ');
    await query(`UPDATE news SET content = NULL WHERE content IS NOT NULL AND source IN (${ph})`, stubNames);
  }
  const total = await query('SELECT count(*)::int AS n FROM news');
  return total.rows[0].n;
}
