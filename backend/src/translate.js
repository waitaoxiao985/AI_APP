// 免费翻译封装：主 Google 非官方端点，备 MyMemory；失败一律降级返回原文，绝不抛错。
// 不含任何 LLM / 付费接口，仅用于把英文标题与正文转成中文。

const CJK_RE = /[\u4e00-\u9fff]/;

// 进程内缓存，避免同一段文本重复请求（采集一次内同文很少，但标题翻译可省往返）
const cache = new Map();
const MAX_CACHE = 500;

function isChinese(text) {
  return CJK_RE.test(String(text || ''));
}

async function fetchWithTimeout(url, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return res;
  } finally {
    clearTimeout(timer);
  }
}

// 主：Google 非官方翻译端点（免费、免 key）
async function translateGoogle(text) {
  const url =
    'https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=zh-CN&dt=t&q=' +
    encodeURIComponent(text);
  const res = await fetchWithTimeout(url, 8000);
  const data = await res.json();
  // 返回结构：[[["译文","原文",...],...],...]
  const parts = (data && data[0]) || [];
  const translated = parts
    .map((seg) => (Array.isArray(seg) ? seg[0] : ''))
    .filter(Boolean)
    .join('');
  if (!translated || translated.trim().length < 1) throw new Error('空译文');
  return translated.trim();
}

// 备：MyMemory（免费低量免 key）
async function translateMyMemory(text) {
  const q = text.slice(0, 450); // 免费端点有长度限制，截前 450 字符
  const url =
    'https://api.mymemory.translated.net/get?q=' +
    encodeURIComponent(q) +
    '&langpair=en|zh-CN';
  const res = await fetchWithTimeout(url, 8000);
  const data = await res.json();
  const translated = data && data.responseData && data.responseData.translatedText;
  if (!translated || String(translated).trim().length < 1) throw new Error('空译文');
  // MyMemory 命中限额时返回英文提示句，识别后视为失败
  if (/MYMEMORY WARNING/i.test(translated)) throw new Error('限额');
  return String(translated).trim();
}

// 翻译一段文本：中文原样返回；非中文依次尝试主备端点，全部失败返回原文。
export async function translate(text) {
  const raw = String(text || '').trim();
  if (!raw) return '';
  if (isChinese(raw)) return raw; // 已是中文，直接返回
  if (cache.has(raw)) return cache.get(raw);

  let result = raw;
  for (const fn of [translateGoogle, translateMyMemory]) {
    try {
      const out = await fn(raw);
      if (out && out !== raw) {
        result = out;
        break;
      }
    } catch (e) {
      // 单端点失败，继续试下一个
    }
  }

  if (cache.size >= MAX_CACHE) cache.clear();
  cache.set(raw, result);
  return result;
}

// 批量翻译：顺序执行（免费端点限流），单条失败保留原文
export async function translateAll(texts) {
  const out = [];
  for (const t of texts) {
    out.push(await translate(t));
  }
  return out;
}
