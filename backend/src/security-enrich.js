// 网络安全资讯规则富化：对单条新条目产出中文标题 / 摘要 / 核心观点 / 标签 / 阅读时长。
// 全程不调用 LLM：翻译走 translate.js 免费端点，其余为本地规则（打分选句 + 词典命中）。
// 与 news-enrich.js 同构但标签词典独立为安全领域，避免污染 AI 快讯。
// 任何一步失败都把该字段置空，绝不抛出，保证单条失败不影响其他条目入库。

import { translate } from './translate.js';

const CJK_RE = /[\u4e00-\u9fff]/;
function isChinese(text) {
  return CJK_RE.test(String(text || ''));
}

// 中英文按句切分（句末标点）
function splitSentences(text) {
  return String(text || '')
    .replace(/\n+/g, ' ')
    .split(/(?<=[。！？!?\.])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 8);
}

// 计数「字符」：中文按字、英文按词粗略折算，用于阅读时长与长度判断
function countUnits(text) {
  const t = String(text || '');
  const cjk = (t.match(/[\u4e00-\u9fff]/g) || []).length;
  const words = (t.replace(/[\u4e00-\u9fff]/g, ' ').match(/[A-Za-z0-9]+/g) || []).length;
  return cjk + words;
}

// 软截断：按显示字符数限制，并在空白/标点处回退，避免切断英文单词
function softClip(text, maxChars) {
  const t = String(text || '').trim();
  if ([...t].length <= maxChars) return t;
  let cut = [...t].slice(0, maxChars).join('');
  const m = cut.match(/^(.*)[\s，。、；：,.!?]/);
  if (m && m[1] && [...m[1]].length >= maxChars * 0.5) {
    cut = m[1];
  }
  cut = cut.replace(/[A-Za-z0-9]+$/, '').trim();
  return cut || [...t].slice(0, maxChars).join('').trim();
}

// 把文本裁到不超过 max 个字符，优先在句/词边界断开
function clip(text, max) {
  const t = String(text || '').trim();
  if (countUnits(t) <= max) return t;
  const sentences = splitSentences(t);
  let acc = '';
  for (const s of sentences) {
    if (countUnits(acc + s) > max && acc) break;
    acc = acc ? acc + s : s;
  }
  if (countUnits(acc) > max) {
    acc = softClip(acc, max);
  }
  return acc;
}

// ---- 打分关键词：命中越多句子越可能被选进摘要 / 观点（安全领域）----
const SCORE_WORDS = [
  /\d+/,
  /CVE|漏洞|vulnerability|零日|0day|exploit|利用/i,
  /攻击|attack|入侵|breach|泄露|leak|数据泄露|data breach/i,
  /勒索|ransom|钓鱼|phishing|木马|malware|僵尸网络|botnet/i,
  /补丁|patch|修复|fixed|修复|更新|威胁情报|threat intel/i
];

function scoreSentence(s, index) {
  let score = 0;
  for (const re of SCORE_WORDS) if (re.test(s)) score += 2;
  if (index === 0) score += 2;
  else if (index === 1) score += 1;
  const u = countUnits(s);
  if (u >= 20 && u <= 80) score += 1;
  if (u < 12) score -= 2;
  return score;
}

// ---- 标签词典：安全领域，命中词（中英）→ 中文标签 ----
const TAG_RULES = [
  { tag: '漏洞', re: /\b(CVE|vulnerability|exploit|0day|zero[-\s]?day)\b|漏洞|零日|利用代码|exp\b/i },
  { tag: '勒索', re: /ransom|勒索|lockbit|conti|revil/i },
  { tag: '钓鱼', re: /phishing|钓鱼|鱼叉|spear/i },
  { tag: '恶意软件', re: /malware|木马|trojan|病毒|virus|勒索软件|后门|backdoor/i },
  { tag: '数据泄露', re: /data breach|数据泄露|信息泄露|leak|泄露|拖库/i },
  { tag: 'APT', re: /\bAPT\b|高级持续性|国家级|威胁行为者|threat actor/i },
  { tag: '供应链', re: /supply chain|供应链|依赖|dependency|投毒|poisoning/i },
  { tag: 'DDoS', re: /ddos|拒绝服务|dos攻击/i },
  { tag: '渗透', re: /penetration|渗透|红队|red team|攻防|ctf/i },
  { tag: '合规', re: /合规|regulation|监管|等保|gdpr|网安法|数据安全法/i },
  { tag: '威胁情报', re: /threat intel|威胁情报|ioc|指标|indicator/i },
  { tag: '补丁', re: /patch|补丁|修复|fixed|安全更新/i }
];

function extractTags(text) {
  const t = String(text || '');
  const found = [];
  for (const rule of TAG_RULES) {
    if (rule.re.test(t)) found.push(rule.tag);
  }
  // 去重，取前 5；不足 2 个返回空（不强填）
  const uniq = [...new Set(found)].slice(0, 5);
  return uniq.length >= 2 ? uniq : [];
}

// ---- 主流程 ----
// 输入：采集到的原始 item（含 title / excerpt / content 等）
// 输出：{ title_zh, summary, key_points, tags, read_time }，缺失字段为 '' 或 []
export async function enrichSecurityItem(item) {
  const result = { title_zh: '', summary: '', key_points: [], tags: [], read_time: '' };

  const title = String(item.title || '').trim();
  const rawBody = String(item.content || item.excerpt || '').trim();

  // 1) 标题中文化
  try {
    result.title_zh = title ? (isChinese(title) ? title : await translate(title)) : '';
  } catch {
    result.title_zh = title;
  }

  // 2) 中文语料：正文非中文则翻译（只译前 1200 字符，控制免费端点用量）
  let zhText = '';
  try {
    if (rawBody) {
      zhText = isChinese(rawBody) ? rawBody : await translate(rawBody.slice(0, 1200));
    }
  } catch {
    zhText = rawBody;
  }

  // 标签基于「标题 + 中文语料」命中
  try {
    result.tags = extractTags(title + ' ' + zhText);
  } catch {
    result.tags = [];
  }

  // 3) 摘要（抽取式）：语料过短则不生成
  try {
    if (countUnits(zhText) >= 50) {
      const sentences = splitSentences(zhText);
      const scored = sentences
        .map((s, i) => ({ s, score: scoreSentence(s, i) }))
        .filter((x) => x.score > 0)
        .sort((a, b) => b.score - a.score);
      let summary = '';
      for (const x of scored) {
        if (countUnits(summary) >= 150) break;
        summary = summary ? summary + x.s : x.s;
      }
      if (!summary) summary = scored.length ? scored[0].s : clip(zhText, 200);
      result.summary = clip(summary, 200);
      if (countUnits(result.summary) < 40) result.summary = '';
    }
  } catch {
    result.summary = '';
  }

  // 4) 核心观点：选含数字/安全关键词的句子，每条 ≤30 字，去重取 ≤3 条
  try {
    if (zhText) {
      const kpRe = /\d|漏洞|CVE|攻击|泄露|勒索|补丁|修复|威胁|apt|恶意软件|钓鱼/i;
      const sentences = splitSentences(zhText).filter((s) => kpRe.test(s));
      const seen = new Set();
      const points = [];
      for (const s of sentences) {
        const p = softClip(s, 30);
        if (!p || seen.has(p)) continue;
        seen.add(p);
        points.push(p);
        if (points.length >= 3) break;
      }
      result.key_points = points;
    }
  } catch {
    result.key_points = [];
  }

  // 5) 阅读时长：按正文字数估算（中文 ~400 字/分钟），无正文则空
  try {
    if (rawBody && countUnits(rawBody) >= 40) {
      const minutes = Math.max(1, Math.ceil(countUnits(rawBody) / 400));
      result.read_time = minutes + ' 分钟';
    }
  } catch {
    result.read_time = '';
  }

  return result;
}
