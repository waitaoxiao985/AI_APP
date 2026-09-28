# Tasks

- [x] Task 1: 数据源探测与定稿
  - [x] SubTask 1.1: 写临时探测脚本（.mjs），按分类候选清单逐个实测 RSSHub 路由与原生 feed，记录能稳定返回标题+链接+摘要的源
  - [x] SubTask 1.2: 每分类选定通过探测的源：财经（华尔街见闻、第一财经；财联社 RSS 无 link 弃用、FT 超时弃用）、政治（澎湃精选、联合早报中国/世界）、军事（观察者网头条；环球军事 503 弃用）、游戏（游民星空、游侠网、机核含原生兜底；3DM 404 弃用）；探测脚本已删除

- [x] Task 2: 数据库 daily_news 表
  - [x] SubTask 2.1: `backend/init.sql` 新增 `CREATE TABLE IF NOT EXISTS daily_news`（8 列）+ published_at 索引；幂等可重复执行
  - [x] SubTask 2.2: `daily-news-sync.js` 里 `ensureDailyNewsTable()` 用 `CREATE TABLE IF NOT EXISTS` 同构建表（sync 开头调用，兼容存量库）

- [x] Task 3: 采集脚本 daily-news-sync.js
  - [x] SubTask 3.1: 按分类配置 CATEGORIES（复用 RSSHub 优先 + 原生 feed 兜底模式），只存 excerpt 不存 content（摘要 < 8 字置空）
  - [x] SubTask 3.2: 流程：ensureDailyNewsTable → 各分类各源抓取（分类内并行、单源失败跳过）→ 分类内 link 去重 → INSERT WHERE NOT EXISTS 新增 → 每分类裁剪至 100 条 → 返回总数；日志 `[ok]/[skip]` 带分类名
  - [x] SubTask 3.3: `package.json` 加 `fetch-daily-news` script + `src/fetch-daily-news.mjs`

- [x] Task 4: API 路由 + 定时任务
  - [x] SubTask 4.1: `backend/src/routes/daily-news.js`：category 白名单校验（非法 400）、limit 缺省 20 上限 100（非法 400），SELECT 七列不含 content
  - [x] SubTask 4.2: `server.js` 注册路由；`35 8 * * *` cron + 启动补跑；`/api/news/sync` 手动触发并行触发两管线（Vercel await Promise.all、本地 fire-and-forget，响应形状兼容）

- [x] Task 5: 前端今日新闻页
  - [x] SubTask 5.1: `api.js` 新增 `getDailyNews(category, limit)`，与 getNews 风格一致
  - [x] SubTask 5.2: 重构 `NewsToday.jsx`：分类 Tab（全部/财经/政治/军事/游戏、aria-pressed）+ 按日期分组沿用；条目改外链 `<a target="_blank" rel="noreferrer">`；加载/错误/空态沿用
  - [x] SubTask 5.3: `index.css` 补 `.cat-tabs/.cat-tab/.cat-tab-active` 样式（对齐现有 chip pill 模式、纯 CSS 变量、hover 在媒体查询内、focus-visible）；顺带修复既有缺口补齐 `.w-30/.w-68`；JSX 类名 29/29 全存在

- [x] Task 6: 验证
  - [x] SubTask 6.1: `npm run fetch-daily-news` 跑通（245 条入库），临时后端实例启动补跑两管线并行正常
  - [x] SubTask 6.2: SQL 抽查：四分类均有条目（财经 81/政治 74/游戏 70/军事 20）、9 家来源、与 news 表 link 零重叠、无 content 列
  - [x] SubTask 6.3: API 冒烟：缺省/按分类正常，非法 category 与非法 limit 均返 400
  - [x] SubTask 6.4: `cd frontend && npx vite build` 通过

# Task Dependencies
- Task 3 依赖 Task 1（定稿源配置）与 Task 2（建表）
- Task 4 依赖 Task 3
- Task 5 依赖 Task 4（API 形状确定）
- Task 6 依赖全部
- Task 1 与 Task 2 可并行
