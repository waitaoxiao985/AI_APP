import { query, pool } from './db.js';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
// 封面存到前端 public，Vite 在 dev 与 build 下都会以 /covers/... 提供
const COVER_DIR = join(__dirname, '..', '..', 'frontend', 'public', 'covers');

const MODEL = process.env.COVER_MODEL || 'flux';
const W = 768;
const H = 512;
const DELAY = 2500; // 免费服务的请求间隔，避免限流
const RETRY = 2;

// 分类只给抽象科技元素，避免诱导出人物/机器人主体
const CAT_HINT = {
  '大模型基础': 'interconnected network nodes, glowing data streams',
  '架构原理': 'layered geometric data flow, parallel lines',
  '提示工程': 'binary code particles, terminal grid pattern',
  'AI 安全': 'shield outline, protective mesh, lock glyph',
  '应用实践': 'floating geometric panels, interface wireframe'
};

// 强约束：抽象、纯色、深蓝科技风，明确排除一切人物与具象主体
function buildPrompt(article) {
  const hint = CAT_HINT[article.category] || 'glowing network nodes';
  return (
    `abstract technology wallpaper, ${hint}, thin glowing circuit lines, geometric network, ` +
    `subtle particles, plain solid deep blue background, monochrome blue, flat, minimalist, ` +
    `clean, high-tech, digital art, no people, no humans, no characters, no faces, no robots, ` +
    `no person, no figures, no text, no watermark`
  );
}

const NEGATIVE = encodeURIComponent(
  'people, human, person, face, character, robot, figure, man, woman, body, portrait, text, watermark, logo'
);

function extFromType(type) {
  if (/png/i.test(type)) return 'png';
  if (/webp/i.test(type)) return 'webp';
  return 'jpg';
}

async function generateOne(article) {
  const prompt = buildPrompt(article);
  const url =
    `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}` +
    `?width=${W}&height=${H}&model=${MODEL}&nologo=true&seed=${article.id + 9000}&enhance=true&negative=${NEGATIVE}`;

  let lastErr = null;
  for (let attempt = 0; attempt <= RETRY; attempt++) {
    try {
      const resp = await fetch(url);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const type = resp.headers.get('content-type') || '';
      if (!type.startsWith('image/')) {
        const txt = (await resp.text()).slice(0, 120);
        throw new Error(`非图片响应: ${txt}`);
      }
      const buf = Buffer.from(await resp.arrayBuffer());
      if (buf.length < 2000) throw new Error('图片过小，疑似失败');
      const ext = extFromType(type);
      const fileName = `cover-${article.id}.${ext}`;
      writeFileSync(join(COVER_DIR, fileName), buf);
      const path = `/covers/${fileName}`;
      await query('UPDATE articles SET cover = $1 WHERE id = $2', [path, article.id]);
      console.log(`[ok] #${article.id} ${article.title.slice(0, 24)} -> ${path} (${(buf.length / 1024).toFixed(0)}KB)`);
      return true;
    } catch (e) {
      lastErr = e;
      if (attempt < RETRY) await new Promise((r) => setTimeout(r, 4000));
    }
  }
  console.log(`[fail] #${article.id} ${article.title.slice(0, 24)}: ${lastErr && lastErr.message}`);
  return false;
}

async function main() {
  if (!existsSync(COVER_DIR)) mkdirSync(COVER_DIR, { recursive: true });
  await query('ALTER TABLE articles ADD COLUMN IF NOT EXISTS cover VARCHAR(300)');

  // --force 强制重生成全部并覆盖；默认只补缺
  const force = process.argv.includes('--force');
  const res = force
    ? await query('SELECT id, title, category FROM articles ORDER BY id')
    : await query("SELECT id, title, category FROM articles WHERE cover IS NULL OR cover = '' ORDER BY id");
  const total = res.rows.length;
  console.log(`待生成封面 ${total} 篇（模型 ${MODEL}${force ? '，强制重生成' : ''}）`);
  let ok = 0;
  for (let i = 0; i < res.rows.length; i++) {
    if (await generateOne(res.rows[i])) ok++;
    if (i < res.rows.length - 1) await new Promise((r) => setTimeout(r, DELAY));
  }
  console.log(`完成：成功 ${ok}/${total}`);
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
