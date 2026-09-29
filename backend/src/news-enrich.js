// 规则富化：对单条新快讯产出中文标题 / 摘要 / 核心观点 / 标签 / 阅读时长。
// 全程不调用 LLM：翻译走免费 API，其余为本地规则（打分选句 + 词典命中）。
// 任何一步失败都把该字段置空，绝不抛出，保证单条失败不影响其他条目入库。

import { translate } from './translate.js';

// ---- 工具 ----

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

// 把文本裁到不超过 max 个字符，优先在句/词边界断开
function clip(text, max) {
  const t = String(text || '').trim();
  if (countUnits(t) <= max) return t;
  // 先在句末标点处截
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

// 软截断：按显示字符数限制，并在空白/标点处回退，避免切断英文单词
function softClip(text, maxChars) {
  const t = String(text || '').trim();
  if ([...t].length <= maxChars) return t;
  let cut = [...t].slice(0, maxChars).join('');
  // 在最后一个空白或中文标点处回退，避免切掉半个英文词
  const m = cut.match(/^(.*)[\s，。、；：,.!?]/);
  if (m && m[1] && [...m[1]].length >= maxChars * 0.5) {
    cut = m[1];
  }
  // 若结尾仍落在 ASCII 词中间，去掉整个尾部拉丁/数字词段，避免出现 "Clau" 这类残词
  cut = cut.replace(/[A-Za-z0-9]+$/, '').trim();
  return cut || [...t].slice(0, maxChars).join('').trim();
}

// ---- 关键词 / 打分 ----

// 打分关键词：命中越多句子越可能被选进摘要 / 观点
const SCORE_WORDS = [
  /\d+/,
  /模型|model|GPT|LLM|Claude|参数|parameter|token/i,
  /开源|open source|发布|launch|release|推出/i,
  /融资|估值|billion|million|Series|美元/i,
  /上下文|context|多模态|multimodal|agent|智能体/i
];

function scoreSentence(s, index) {
  let score = 0;
  for (const re of SCORE_WORDS) if (re.test(s)) score += 2;
  // 位置越靠前小幅加分（导语通常更重要）
  if (index === 0) score += 2;
  else if (index === 1) score += 1;
  // 长度适中加分，过短扣分
  const u = countUnits(s);
  if (u >= 20 && u <= 80) score += 1;
  if (u < 12) score -= 2;
  return score;
}

// ---- 标签词典：命中词（中英）→ 中文标签 ----

const TAG_RULES = [
  { tag: 'AI模型', re: /\b(GPT|LLM|Claude|模型|大模型)\b|大语言模型/i },
  { tag: 'Agent', re: /\bagent\b|智能体|助手/i },
  { tag: '多模态', re: /multimodal|多模态|视觉|语音|图像|video/i },
  { tag: '开源', re: /open source|开源|MIT|Apache|GPL|github/i },
  { tag: '商业', re: /融资|估值|billion|million|Series|收购|acquire|估值|美元/i },
  { tag: '安全', re: /safety|安全|对齐|alignment|风险|风险/i },
  { tag: '硬件', re: /GPU|芯片|硬件|H100|芯片|英伟达|NVIDIA|TPU/i },
  { tag: '政策', re: /regulation|监管|政策|法案|law|合规|govern/i },
  { tag: '长上下文', re: /context|上下文|window|token 上下文|长上下文/i },
  { tag: '数据与RAG', re: /数据库|向量|vector|RAG|检索|retrieval/i }
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
export async function enrichItem(item) {
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
      // 按分数从高到低拼接，直到接近 200 字
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

  // 4) 核心观点：选含数字/关键词的句子，每条 ≤30 字，去重取 ≤3 条
  try {
    if (zhText) {
      const kpRe = /\d|模型|参数|token|上下文|开源|发布|融资|多模态|agent|智能体/i;
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
