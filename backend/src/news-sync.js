import Parser from 'rss-parser';
import { query } from './db.js';

// 自建 RSSHub 服务地址（本地默认 http://localhost:1200）。
// 未配置时全部走原生 feed；配置后，带 rsshub 字段的源优先走 RSSHub（可取到全文），失败自动回退原生 feed。
const RSSHUB_BASE = process.env.RSSHUB_BASE_URL ? process.env.RSSHUB_BASE_URL.replace(/\/+$/, '') : '';

// 只保留 AI 垂直源：中文 AI 媒体为主，全部经 RSSHub 取全文
const SOURCES = [
  { name: '量子位', rsshub: '/qbitai/category/' + encodeURIComponent('资讯'), url: 'https://www.qbitai.com/feed' },
  { name: '雷峰网', rsshub: '/leiphone/category/ai' },
  { name: 'AIbase', rsshub: '/aibase/news' },
  { name: 'AIbase日报', rsshub: '/aibase/daily' },
  { name: '智源社区', rsshub: '/baai/hub' }
];

const MAX_NEWS = 300;

// 正文短于该长度的，视为源站未在 feed 中提供全文，只留标题 + 摘要 + 原文链接
const MIN_CONTENT = 120;

// 降级源：其 RSS 只推标题与跳转链接，正文永远是空壳，强制按「标题 + 原文链接」处理。
// 当前 5 个源都能经 RSSHub 取到正文，故为空；机制保留备新源使用
const EXCERPT_ONLY_SOURCES = new Set();

const CLICK_THROUGH_STUB = /^(点击查看原文|点击原文|阅读全文|阅读原文)[>＞:：\s]*$/i;

// Hacker News 关键词：经 Algolia 搜索 API 按时间倒序逐个抓取
const HN_KEYWORDS = ['AI', 'LLM', 'GPT', 'Claude', 'OpenAI', 'Anthropic', 'machine learning', 'deep learning'];

// HN 标题关键词校验（不区分大小写）：Algolia 按关键词检索，但可能命中 url 或正文，
// 标题本身不含 AI 关键词的一律视为噪声丢弃；复数（LLMs/GPTs）与 ChatGPT 一并覆盖
const AI_TITLE_RE = /\b(ai|llm|gpt|chatgpt|claude|openai|anthropic)s?\b|machine\s+learning|deep\s+learning/i;

function looksAIRelated(title) {
  return AI_TITLE_RE.test(String(title || ''));
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

// 去掉「点击查看原文」这类跳转占位，留下真正有信息量的摘要
function cleanSnippet(text) {
  const s = toExcerpt(text);
  if (CLICK_THROUGH_STUB.test(s)) return '';
  return s;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// 幂等迁移：老库缺列时补上 title_zh / summary。
// openGauss 不支持 ADD COLUMN IF NOT EXISTS，先查 information_schema 再普通 ADD COLUMN，重复执行无副作用
async function ensureNewsColumns() {
  const res = await query("SELECT column_name FROM information_schema.columns WHERE table_name = 'news'");
  const cols = new Set(res.rows.map((r) => r.column_name));
  if (!cols.has('title_zh')) {
    await query('ALTER TABLE news ADD COLUMN title_zh VARCHAR(300)');
  }
  if (!cols.has('summary')) {
    await query('ALTER TABLE news ADD COLUMN summary VARCHAR(200)');
  }
}

// 标题以「(20XX)」结尾且年份早于今年的，视为旧帖（如「回顾 2023 大模型 (2023)」）
function isOldYearTitle(title) {
  const m = /\((20\d{2})\)\s*$/.exec(String(title || ''));
  if (!m) return false;
  return Number(m[1]) < new Date().getFullYear();
}

async function insertNews(item) {
  await query(
    `INSERT INTO news (title, link, source, published_at, excerpt, content, title_zh, summary)
     SELECT $1::varchar(300), $2::varchar(500), $3::varchar(100), $4::timestamp, $5::varchar(500), $6::text, $7::varchar(300), $8::varchar(200)
     WHERE NOT EXISTS (SELECT 1 FROM news WHERE link = $2)`,
    [item.title, item.link, item.source, item.publishedAt, item.excerpt, item.content, item.title_zh || null, item.summary || null]
  );
}

// 抓取单个 RSS 源，只收集条目不写库；RSSHub 优先、原生 feed 兜底，正文阈值与降级源逻辑与旧版一致
async function fetchSource(source) {
  // RSSHub 冷缓存首次请求需回源抓取，给足超时
  const parser = new Parser({ timeout: 30000 });
  // 候选订阅源：RSSHub 路由优先（可取全文），原生 feed 兜底
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
    // 只有源站真给了全文（且非降级源）才保留正文，否则只留标题 + 链接
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

// 抓取 Hacker News：按关键词走 Algolia 搜索 API，只取最近 30 天的 story
async function fetchHNStories() {
  const since = Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60;
  // 合并去重：objectID 唯一；url 非空时同 url 只保留 points 更高的一条
  const byId = new Map();
  const byUrl = new Map();
  for (const kw of HN_KEYWORDS) {
    const params = new URLSearchParams({
      query: kw,
      tags: 'story',
      hitsPerPage: '15',
      numericFilters: 'created_at_i>' + since
    });
    let hits = null;
    let lastError = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      if (attempt > 0) await sleep(1000);
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 15000);
      try {
        const res = await fetch('https://hn.algolia.com/api/v1/search_by_date?' + params.toString(), {
          signal: controller.signal
        });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const data = await res.json();
        hits = data.hits || [];
        break;
      } catch (e) {
        lastError = e;
      } finally {
        clearTimeout(timer);
      }
    }
    if (!hits) {
      console.log(`[skip] HN 关键词 ${kw}: ${lastError && lastError.message}`);
      continue;
    }
    for (const hit of hits) {
      if (!hit || !hit.objectID || !hit.title) continue;
      if (byId.has(hit.objectID)) continue;
      const link = String(hit.url || 'https://news.ycombinator.com/item?id=' + hit.objectID)
        .trim()
        .slice(0, 500);
      const prev = link ? byUrl.get(link) : null;
      if (prev) {
        // 同 url 只保留 points 更高的一条
        if ((hit.points || 0) > (prev.hit.points || 0)) {
          byId.delete(prev.hit.objectID);
          const entry = { hit, link };
          byId.set(hit.objectID, entry);
          byUrl.set(link, entry);
        }
        continue;
      }
      const entry = { hit, link };
      byId.set(hit.objectID, entry);
      if (link) byUrl.set(link, entry);
    }
    // 相邻关键词的请求之间留出间隔
    await sleep(500);
  }
  const items = [...byId.values()].map(({ hit, link }) => {
    const storyText = stripHtml(hit.story_text);
    // HN 故事大多无正文，story_text 达到全文阈值才保留
    const content = storyText.length >= MIN_CONTENT ? storyText : null;
    const publishedAt = hit.created_at ? new Date(hit.created_at) : null;
    return {
      title: String(hit.title).trim().slice(0, 300),
      link,
      source: 'Hacker News',
      publishedAt: publishedAt && !Number.isNaN(publishedAt.getTime()) ? publishedAt : null,
      content,
      excerpt: content ? toExcerpt(content) : ''
    };
  });
  items.sort((a, b) => (b.publishedAt ? b.publishedAt.getTime() : 0) - (a.publishedAt ? a.publishedAt.getTime() : 0));
  return items.slice(0, 25);
}

export async function syncNews() {
  // 幂等迁移：老库补齐 title_zh / summary 两列
  await ensureNewsColumns();

  // 收集 RSS：并行抓取，单源失败不阻塞其他源
  const settled = await Promise.allSettled(SOURCES.map((source) => fetchSource(source)));
  const rssItems = [];
  settled.forEach((r, i) => {
    if (r.status === 'fulfilled') {
      console.log(`[ok] ${SOURCES[i].name}: 扫描 ${r.value.length} 条`);
      rssItems.push(...r.value);
    } else {
      console.log(`[skip] ${SOURCES[i].name}: ${r.reason && r.reason.message}`);
    }
  });

  // 收集 HN：整体失败只记日志，不影响后续流程
  let hnItems = [];
  try {
    hnItems = await fetchHNStories();
    console.log(`[ok] Hacker News: 扫描 ${hnItems.length} 条`);
  } catch (e) {
    console.log(`[skip] Hacker News: ${e && e.message}`);
  }

  // 合并候选：RSS 在前 HN 在后 → 旧年份标题过滤 → 批内按 link 去重（首个保留）
  const seenLink = new Set();
  const candidates = [];
  for (const it of [...rssItems, ...hnItems]) {
    if (isOldYearTitle(it.title)) continue;
    if (seenLink.has(it.link)) continue;
    seenLink.add(it.link);
    candidates.push(it);
  }

  // 与库比对：已存在条目保留回填行为，新条目进入过滤
  const fresh = [];
  if (candidates.length) {
    const links = candidates.map((it) => it.link);
    const ph = links.map((_, i) => '$' + (i + 1)).join(', ');
    const existed = await query(`SELECT link FROM news WHERE link IN (${ph})`, links);
    const known = new Set(existed.rows.map((r) => r.link));
    for (const it of candidates) {
      if (!known.has(it.link)) {
        fresh.push(it);
        continue;
      }
      // 早前走原生 feed 只存到标题摘要的条目，若这次取到全文则回填正文
      if (it.content) {
        await query(
          `UPDATE news SET content = $2, excerpt = COALESCE(NULLIF(excerpt, ''), $3)
             WHERE link = $1 AND content IS NULL`,
          [it.link, it.content, it.excerpt]
        );
      }
    }
  }

  // 新条目过滤：RSS 源全部是 AI 垂直媒体直接入库；HN 标题不含 AI 关键词的视为噪声丢弃
  let hnDropped = 0;
  const toInsert = fresh.filter((it) => {
    if (it.source !== 'Hacker News' || looksAIRelated(it.title)) return true;
    hnDropped++;
    return false;
  });
  if (hnDropped) console.log(`[ok] HN 关键词过滤: 丢弃 ${hnDropped} 条`);

  for (const it of toInsert) {
    await insertNews(it);
  }

  // ---- 存量治理（幂等） ----
  // 旧帖清理：整表读出（≤ MAX_NEWS 行）在 JS 侧用 isOldYearTitle 过滤后批量删除
  const existing = await query('SELECT id, title FROM news');
  const oldIds = existing.rows.filter((r) => isOldYearTitle(r.title)).map((r) => r.id);
  if (oldIds.length) {
    const ph = oldIds.map((_, i) => '$' + (i + 1)).join(', ');
    await query(`DELETE FROM news WHERE id IN (${ph})`, oldIds);
    console.log(`[ok] 旧年份标题清理: 删除 ${oldIds.length} 条`);
  }
  // 存量回填：中文标题直接补 title_zh，摘要截前 50 字补 summary
  await query('UPDATE news SET title_zh = title WHERE title_zh IS NULL');
  await query(
    "UPDATE news SET summary = COALESCE(NULLIF(left(coalesce(excerpt, ''), 50), ''), '') WHERE summary IS NULL"
  );
  // 原清理逻辑：短正文置 NULL、跳转占位摘要清空、降级源正文清空
  await query('UPDATE news SET content = NULL WHERE length(coalesce(content, \'\')) < $1', [MIN_CONTENT]);
  await query('UPDATE news SET excerpt = \'\' WHERE excerpt LIKE \'点击查看原文%\'');
  const stubNames = [...EXCERPT_ONLY_SOURCES];
  if (stubNames.length) {
    const ph = stubNames.map((_, i) => '$' + (i + 1)).join(', ');
    await query(`UPDATE news SET content = NULL WHERE content IS NOT NULL AND source IN (${ph})`, stubNames);
  }
  // 裁剪：只保留最新 MAX_NEWS 条
  await query(
    'DELETE FROM news WHERE id NOT IN (SELECT id FROM news ORDER BY fetched_at DESC, id DESC LIMIT ' + MAX_NEWS + ')'
  );

  const total = await query('SELECT count(*)::int AS n FROM news');
  return total.rows[0].n;
}
