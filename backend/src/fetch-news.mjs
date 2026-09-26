import Parser from 'rss-parser';
import { pool } from './db.js';

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

async function insertNews(item) {
  await pool.query(
    `INSERT INTO news (title, link, source, published_at, excerpt, content)
     SELECT $1::varchar(300), $2::varchar(500), $3::varchar(100), $4::timestamp, $5::varchar(500), $6::text
     WHERE NOT EXISTS (SELECT 1 FROM news WHERE link = $2)`,
    [item.title, item.link, item.source, item.publishedAt, item.excerpt, item.content]
  );
}

async function fetchSource(parser, source) {
  const feed = await parser.parseURL(source.url);
  let inserted = 0;
  for (const raw of feed.items || []) {
    const title = String(raw.title || '').trim().slice(0, 300);
    const link = String(raw.link || '').trim().slice(0, 500);
    if (!title || !link) continue;
    const bodyHtml = raw['content:encoded'] || raw.content || raw.contentSnippet || '';
    const content = stripHtml(bodyHtml);
    const publishedAt = raw.isoDate ? new Date(raw.isoDate) : null;
    await insertNews({
      title,
      link,
      source: source.name,
      publishedAt: publishedAt && !Number.isNaN(publishedAt.getTime()) ? publishedAt : null,
      excerpt: toExcerpt(content || title),
      content
    });
    inserted++;
  }
  return inserted;
}

async function main() {
  const parser = new Parser({ timeout: 15000 });
  let totalNew = 0;
  for (const source of SOURCES) {
    try {
      const scanned = await fetchSource(parser, source);
      console.log(`[ok] ${source.name}: 扫描 ${scanned} 条`);
    } catch (err) {
      console.log(`[skip] ${source.name}: ${err.message}`);
    }
  }
  const before = await pool.query('SELECT count(*)::int AS n FROM news');
  await pool.query('DELETE FROM news WHERE id NOT IN (SELECT id FROM news ORDER BY fetched_at DESC, id DESC LIMIT ' + MAX_NEWS + ')');
  const after = await pool.query('SELECT count(*)::int AS n FROM news');
  totalNew = after.rows[0].n;
  console.log(`news 表: ${before.rows[0].n} -> ${totalNew} 条（上限 ${MAX_NEWS}）`);
  await pool.end();
  process.exit(0);
}

main().catch((err) => {
  console.error('采集失败:', err.message);
  process.exit(1);
});
