# AGENTS.md — AI 知识库 App 智能体工作规范

> 面向在本仓库工作的 AI 智能体。先读本文件与 `README.md`，再动手。

## 一、项目是什么

面向 AI 学习者的轻量知识库：文章浏览 / 搜索 / 阅读 / 收藏 + 专题聚合 + AI 快讯。定位是**学习与作品集项目**，代码风格直白、无重封装。

| 层 | 技术 | 关键约束 |
|---|---|---|
| 前端 | React 18 + React Router 6 + Vite 5 | **纯 JS/JSX，不引入 TypeScript**；**无 CSS 框架**，手写 CSS |
| 后端 | Node.js + Express 4 + pg | ESM（`"type": "module"`） |
| 数据库 | openGauss（PostgreSQL 兼容） | 见「二、已知坑」的语法差异 |
| 图标 | `@phosphor-icons/react` | 不换其他图标库 |
| 快讯 | `rss-parser` + `node-cron` | 每日 08:30 同步 + 启动补跑 |

**端口**：后端 3003，前端 5173（vite 把 `/api` 代理到 3003），DB `192.168.159.134:7654`。

**命令**
```bash
cd backend  && npm run dev | init-db | seed-deep | reset-db | fetch-news
cd frontend && npm run dev | build | preview
```
⚠️ `init-db` 与 `reset-db` 会 **DROP 表**。给已有库加数据一律走幂等 SQL，先提示用户备份。

## 二、硬性规则

### 1. 设计：只改两个地方
- 意图记在 `frontend/design-dna.ai-blue.json`（三维度规范，颜色来自参考图确定性测色）
- 数值落在 `frontend/src/index.css` 的 `:root`
- 组件样式里**颜色一律 `var(--token)`，禁止裸色值**——这是色值溯源检查「0 游离色」能成立的前提
- 新增 token 必须先登记进 DNA，再在 `:root` 落地

### 2. SQL / openGauss 方言
- **不支持 `FILTER (WHERE ...)` 聚合子句** → 改用 `SUM(CASE WHEN ... THEN 1 ELSE 0 END)`
- 种子数据一律幂等：`WHERE NOT EXISTS` / `CREATE TABLE IF NOT EXISTS`
- `ILIKE` 模式必须转义 `\ % _`（参考 `backend/src/routes/articles.js` 的 `escapeLike`）
- 文章正文里**不转载第三方全文**；深度长文文末必须有「参考文献」+「版权声明」

### 3. API
- 所有 `:id` 走 `/^\d+$/` + 范围校验，非法返 400（参考 `articles.js` / `topics.js` / `news.js`）
- 分页：`limit`/`offset` 必须是整数，`limit ≤ 100`
- 错误信息用陈述句，**不加感叹号**，格式如「获取文章失败」

### 4. 前端
- 新增 `className` 必须同步写 CSS——当前状态是 **JSX 用到的类在 CSS 里 0 缺失**，别打破
- 删除组件时连带清死 CSS（历史上已清过两轮，别回退）
- `.enter` 入场动画依赖 `App.jsx` 的 `useReveal()`（IntersectionObserver + MutationObserver + 1500ms 兜底），**别让它卡在 `opacity: 0`**
- 交互元素必须同时有 `:hover`（包在 `@media (hover: hover) and (pointer: fine)` 里）和 `:focus-visible`
- 删除 `prefers-reduced-motion` 守卫前先确认它仍覆盖所有动画

### 5. 快讯与版权（红线）
- 抓取**只认 RSS 的 `content:encoded`**（发布方主动分发），**不抓 HTML 提取正文**
- 正文 < 120 字不入库；`EXCERPT_ONLY_SOURCES` 里的源降级为「标题 + 摘要 + 原文链接」
- 给新源前先测它的 feed 是否带全文；带全文才值得接

## 三、每次改完必做

```bash
cd frontend && npx vite build     # 必跑，无报错才算完
```

改样式另外核对两项：
1. **色值溯源**：`index.css` 里每个 hex 都要能追到 DNA 色板或其同族派生（色相 210–220° 冷蓝），游离色必须为 0
2. **WCAG 对比度**：正文 ≥ 4.5:1，大字/图标 ≥ 3:1；`--accent` 只可作大字与图标，**小字一律用 `--accent-strong`**；`--text-faint` 不承载可读文字

改数据库先写幂等 SQL 并说明会被影响的行数；改完报告**改动面 + 影响面**，再问是否继续。

## 四、已知坑（先看这里，能省很多时间）

1. **git push 失败**：仓库级 `http.proxy` / `https.proxy` 是**空字符串**，覆盖了全局代理，导致直连 443 被拦。绕过方式：
   ```bash
   git -c http.proxy=http://127.0.0.1:7890 -c https.proxy=http://127.0.0.1:7890 push
   ```
   （不要擅自改用户 git config。）
2. **PowerShell 里别写内联 node**：`node -e "..."` 的引号会被吞；`>` 重定向会写成 **UTF-16**；中文在控制台显示为乱码但**文件本身是 UTF-8**。
   → **一律把脚本写成临时 `.mjs` 文件再 `node xxx.mjs`**。
3. **别信浏览器截图判断样式**：曾出现 `page.screenshot()` 返回陈旧渲染（与同一程序内的 DOM 断言矛盾）。
   → 以 `getComputedStyle` / `document.styleSheets` / `document.body.innerText` 为准。
4. **端口占用**：3003 / 5173 已有进程时先查 PID，不要重复起。
5. **读代码用 UTF-8**：`init.sql`、`README.md` 均为 UTF-8，控制台乱码是显示问题，不是文件损坏。

## 五、工作方式

1. 动手前先读 `README.md` 对应章节 + `design-dna.ai-blue.json`
2. **小步改，每步 `npx vite build` 验证**，不要一次性大改
3. 每完成一步**报告一次**：改了什么、影响到哪，然后等确认再继续
4. 不确定的取舍**先问再做**，尤其是改信息架构、动数据库、改 git 操作
5. 不要自行 commit / push，除非明确要求
