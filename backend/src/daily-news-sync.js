import Parser from 'rss-parser';
import { query } from './db.js';

// 自建 RSSHub 服务地址（本地默认 http://localhost:1200）。
// 未配置时全部走原生 feed；配置后，带 rsshub 字段的源优先走 RSSHub，失败自动回退原生 feed。
const RSSHUB_BASE = process.env.RSSHUB_BASE_URL ? process.env.RSSHUB_BASE_URL.replace(/\/+$/, '') : '';

const MIMO_ENDPOINT = 'https://token-plan-cn.xiaomimimo.com/v1/chat/completions';
const MIMO_MODEL = 'mimo-v2.6-flash';
const MIMO_BATCH = 50; // 单次批量清洗条数上限，避免请求体过大

// 今日新闻分类与源配置（已实测定稿）。失效源可在此直接换路由。
// 缺路由的源：新华网、中国军网（RSSHub 无对应路由）→ 用同分类可用源补位
const CATEGORIES = [
  { name: '财经', sources: [
    { name: '华尔街见闻', rsshub: '/wallstreetcn/news' },
    { name: '财新', rsshub: '/caixin/latest' },
    { name: '第一财经', rsshub: '/yicai/brief' }
  ]},
  { name: '政治', sources: [
    { name: '人民网', rsshub: '/people/politics' },
    { name: '澎湃新闻', rsshub: '/thepaper/featured' },
    { name: '联合早报中国', rsshub: '/zaobao/realtime/china' }
  ]},
  { name: '军事', sources: [
    { name: '参考消息', rsshub: '/cankaoxiaoxi' },
    { name: '观察者网', rsshub: '/guancha/headline' }
  ]},
  { name: '游戏', sources: [
    { name: '游民星空', rsshub: '/gamersky/news' },
    { name: '游侠网', rsshub: '/ali213/news' },
    { name: '机核', rsshub: '/gcores/news', url: 'https://www.gcores.com/rss' },
    { name: '触乐', rsshub: '/chuapp' }
  ]}
];

const ALLOWED_CATEGORIES = CATEGORIES.map((c) => c.name);
const PER_SOURCE_LIMIT = 15; // 每源取最新条数

const CLICK_THROUGH_STUB = /^(点击查看原文|点击原文|阅读全文|阅读原文)[>＞:：\s]*$/i;

// 解码 HTML 实体（含 &amp; 命名实体与 &#NN; / &#xNN; 数字实体）
function decodeEntities(s) {
  const named = {
    nbsp: ' ', amp: '&', lt: '<', gt: '>', quot: '"',
    apos: "'", '#39': "'", lsquo: '‘', rsquo: '’',
    ldquo: '“', rdquo: '”', hellip: '…', mdash: '—', ndash: '–'
  };
  return String(s || '')
    .replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (m, code) => {
      if (code[0] === '#') {
        const n = code[1].toLowerCase() === 'x'
          ? parseInt(code.slice(2), 16)
          : parseInt(code.slice(1), 10);
        return Number.isNaN(n) ? m : String.fromCodePoint(n);
      }
      return named[code.toLowerCase()] !== undefined ? named[code.toLowerCase()] : m;
    });
}

function stripHtml(html) {
  return decodeEntities(String(html || ''))
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|h[1-6]|li|tr|blockquote)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
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

// 降级摘要：MiMo 不可用时，用 RSS 摘要截断到 50 字，保证每条都带 summary
function fallbackSummary(item) {
  const s = (item.excerpt || item.title || '').replace(/\s+/g, ' ').trim();
  return s.slice(0, 50);
}

async function ensureColumn(table, col, def) {
  const r = await query(
    'SELECT 1 FROM information_schema.columns WHERE table_name = $1 AND column_name = $2',
    [table, col]
  );
  if (r.rows.length === 0) {
    await query(`ALTER TABLE ${table} ADD COLUMN ${col} ${def}`);
    console.log(`[schema] 已新增列 ${table}.${col}`);
  }
}

// 幂等建表 + 补列：与 init.sql 中 daily_news 定义保持一致，老库不跑 init-db 也能用
async function ensureDailyNewsTable() {
  await query(`CREATE TABLE IF NOT EXISTS daily_news (
    id SERIAL PRIMARY KEY,
    title VARCHAR(300) NOT NULL,
    link VARCHAR(500) UNIQUE NOT NULL,
    source VARCHAR(100),
    category VARCHAR(20) NOT NULL,
    published_at TIMESTAMP,
    excerpt VARCHAR(500),
    summary VARCHAR(200),
    date DATE,
    fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);
  await ensureColumn('daily_news', 'summary', 'VARCHAR(200)');
  await ensureColumn('daily_news', 'date', 'DATE');
  await query('DROP INDEX IF EXISTS idx_daily_news_date');
  await query('CREATE INDEX IF NOT EXISTS idx_daily_news_date ON daily_news(date)');
  await query('DROP INDEX IF EXISTS idx_daily_news_date_category');
  await query('CREATE INDEX IF NOT EXISTS idx_daily_news_date_category ON daily_news(date, category)');
  // 存量回填：date 取抓取日，summary 取摘要前 50 字（历史数据不删）
  await query("UPDATE daily_news SET date = DATE(fetched_at) WHERE date IS NULL");
  await query("UPDATE daily_news SET summary = LEFT(COALESCE(NULLIF(excerpt,''), title), 50) WHERE summary IS NULL OR summary = ''");
}

async function insertDailyNews(item) {
  await query(
    `INSERT INTO daily_news (title, link, source, category, published_at, excerpt, summary, date)
     SELECT $1::varchar(300), $2::varchar(500), $3::varchar(100), $4::varchar(20), $5::timestamp, $6::varchar(500), $7::varchar(200), $8::date
     WHERE NOT EXISTS (SELECT 1 FROM daily_news WHERE link = $2)`,
    [item.title, item.link, item.source, item.category, item.publishedAt || null, item.excerpt || null, item.summary || null, item.date]
  );
}

// 抓取单个 RSS 源，只收集条目不写库；RSSHub 优先、原生 feed 兜底；带一次失败重试
async function fetchSource(source) {
  const parser = new Parser({ timeout: 30000 });
  const candidates = [];
  if (RSSHUB_BASE && source.rsshub) candidates.push(RSSHUB_BASE + source.rsshub);
  if (source.url) candidates.push(source.url);
  let feed = null;
  let lastError = null;
  for (const url of candidates) {
    // 每个候选最多尝试两次（一次重试）
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        feed = await parser.parseURL(url);
        break;
      } catch (e) {
        lastError = e;
        await new Promise((r) => setTimeout(r, 1500));
      }
    }
    if (feed) break;
  }
  if (!feed) throw lastError || new Error('无可用订阅源');

  const items = [];
  for (const raw of (feed.items || []).slice(0, PER_SOURCE_LIMIT)) {
    const title = stripHtml(String(raw.title || '')).slice(0, 300);
    const link = String(raw.link || '').trim().slice(0, 500);
    if (!title || !link) continue;
    const bodyHtml = raw['content:encoded'] || raw.content || raw.contentSnippet || '';
    let excerpt = cleanSnippet(stripHtml(bodyHtml));
    if (excerpt.length < 8) excerpt = '';
    const publishedAt = raw.isoDate ? new Date(raw.isoDate) : null;
    items.push({
      title,
      link,
      source: source.name,
      category: source.category,
      publishedAt: publishedAt && !Number.isNaN(publishedAt.getTime()) ? publishedAt : null,
      excerpt,
      summary: ''
    });
  }
  return items;
}

function extractJsonArray(text) {
  const s = String(text || '');
  const start = s.indexOf('[');
  const end = s.lastIndexOf(']');
  if (start === -1 || end === -1 || end < start) return null;
  try {
    const arr = JSON.parse(s.slice(start, end + 1));
    return Array.isArray(arr) ? arr : null;
  } catch {
    return null;
  }
}

// 批量调用 MiMo 清洗：返回每条 {category, summary, is_duplicate}。
// 未配置 key 或整批失败 → 按原始分类保留，摘要降级生成。
async function cleanWithMimo(items) {
  const key = process.env.MIMO_API_KEY;
  if (!key) {
    console.log('[mimo] 未配置 MIMO_API_KEY，跳过 AI 清洗（按原分类保留，摘要降级生成）');
    return items.map((it) => ({ ...it, summary: fallbackSummary(it), is_duplicate: false }));
  }

  const out = [];
  for (let i = 0; i < items.length; i += MIMO_BATCH) {
    const batch = items.slice(i, i + MIMO_BATCH);
    const lines = batch.map((it, j) => `${i + j + 1}. ${it.title}（来源：${it.source}，原分类：${it.category}）`);
    const prompt =
      '你是新闻分类与摘要助手。以下是当天抓取的新闻标题列表。对每条输出一个 JSON 对象：' +
      '{"category":"财经|政治|军事|游戏|其他","summary":"一句话中文摘要，不超过50字","is_duplicate":是否与列表内其他新闻重复的布尔值}。' +
      '只返回 JSON 数组，不要任何多余文字。\n\n' + lines.join('\n');

    let arr = null;
    for (let attempt = 0; attempt < 2 && !arr; attempt++) {
      try {
        const resp = await fetch(MIMO_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
          body: JSON.stringify({
            model: MIMO_MODEL,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.2
          })
        });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data = await resp.json();
        const content = data?.choices?.[0]?.message?.content || '';
        arr = extractJsonArray(content);
      } catch (e) {
        console.log(`[mimo] 第 ${Math.floor(i / MIMO_BATCH) + 1} 批清洗失败（尝试 ${attempt + 1}/2）：${e.message}`);
        await new Promise((r) => setTimeout(r, 2000));
      }
    }

    if (!arr) {
      // 整批解析失败：按原始分类保留，摘要降级
      console.log(`[mimo] 第 ${Math.floor(i / MIMO_BATCH) + 1} 批解析失败，按原分类降级保留`);
      for (const it of batch) out.push({ ...it, summary: fallbackSummary(it), is_duplicate: false });
      continue;
    }

    for (let j = 0; j < batch.length; j++) {
      const r = arr[j];
      const it = batch[j];
      if (!r || typeof r !== 'object') {
        out.push({ ...it, summary: fallbackSummary(it), is_duplicate: false });
        continue;
      }
      const cat = ALLOWED_CATEGORIES.includes(r.category) ? r.category : it.category;
      const dup = r.is_duplicate === true;
      const summary = typeof r.summary === 'string' ? stripHtml(r.summary).slice(0, 200) : fallbackSummary(it);
      out.push({ ...it, category: cat, summary, is_duplicate: dup });
    }
    // 批次间请求间隔
    await new Promise((r) => setTimeout(r, 1200));
  }
  return out;
}

export async function syncDailyNews() {
  await ensureDailyNewsTable();

  const today = new Date();
  const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  // 逐分类抓取：分类内并行，单源失败不阻塞
  const collected = [];
  for (const cat of CATEGORIES) {
    const settled = await Promise.allSettled(
      cat.sources.map((src) => fetchSource({ ...src, category: cat.name }))
    );
    settled.forEach((r, i) => {
      const src = cat.sources[i];
      if (r.status === 'fulfilled') {
        console.log(`[ok] ${cat.name}/${src.name}: 扫描 ${r.value.length} 条`);
        for (const it of r.value) collected.push(it);
      } else {
        console.log(`[skip] ${cat.name}/${src.name}: ${r.reason && r.reason.message}`);
      }
    });
  }

  // 本次采集内按 link 去重
  const seen = new Set();
  const deduped = [];
  for (const it of collected) {
    if (seen.has(it.link)) continue;
    seen.add(it.link);
    deduped.push(it);
  }
  console.log(`[daily] 去重后待清洗 ${deduped.length} 条`);

  // MiMo 批量清洗
  const cleaned = await cleanWithMimo(deduped);

  // 入库：只保留四个目标分类（丢弃「其他」），丢弃 is_duplicate；date = 抓取日；只新增不覆盖
  let kept = 0;
  for (const it of cleaned) {
    if (it.is_duplicate) continue;
    if (!ALLOWED_CATEGORIES.includes(it.category)) continue;
    await insertDailyNews({ ...it, date: dateStr });
    kept++;
  }
  console.log(`[daily] ${dateStr} 入库 ${kept} 条`);

  const total = await query('SELECT count(*)::int AS n FROM daily_news');
  return total.rows[0].n;
}
