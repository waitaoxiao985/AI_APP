# Tasks

- [x] Task 1: news 表结构扩展（幂等迁移）
  - [x] SubTask 1.1: `backend/init.sql` 的 `CREATE TABLE news` 增加 `title_zh VARCHAR(300)`、`summary VARCHAR(200)`
  - [x] SubTask 1.2: `backend/src/news-sync.js` 新增 `ensureNewsColumns()`：查 information_schema 探测缺列后执行 `ALTER TABLE ADD COLUMN`（不依赖 `ADD COLUMN IF NOT EXISTS`，兼容 openGauss），在 `syncNews()` 开头调用

- [x] Task 2: HN Algolia 抓取器 + 旧帖过滤工具
  - [x] SubTask 2.1: `fetchHNStories()`：8 个关键词走 `search_by_date`（`tags=story`、`hitsPerPage=15`、最近 30 天窗口），相邻请求间隔 ≥500ms，失败重试 1 次；单关键词最终失败则跳过并记日志
  - [x] SubTask 2.2: 合并结果按 objectID + url 去重，按发布时间倒序取最新约 25 条；source='Hacker News'，无 url 的 Ask HN 回退讨论页链接
  - [x] SubTask 2.3: 年份过滤工具 `isOldYearTitle(title)`：匹配 `\((20\d{2})\)\s*$` 且年份 < 今年则丢弃

- [x] Task 3: MiMo 批量清洗客户端（后由 Task 7 移除，改用本地规则过滤）
  - [x] SubTask 3.1-3.3: 曾实现 `mimoClean` 批量清洗（单请求、index 对位、fail-open、80 分块）；Task 7 按用户决定整体删除

- [x] Task 4: syncNews 流程重构（收集 → 去重 → 过滤 → 入库 → 存量治理）
  - [x] SubTask 4.1: `fetchSource` 改为返回条目数组，不直接写库（保留 RSSHub 优先/原生 feed 兜底/正文阈值/降级源逻辑）
  - [x] SubTask 4.2: 编排：收集全部源 → 年份过滤 → 批内按 link 去重 → 与库中 link 比对 → HN 新条目标题关键词校验后入库
  - [x] SubTask 4.3: 已存在 link 的 RSS 条目保留原 content/excerpt 回填 UPDATE
  - [x] SubTask 4.4: 存量治理（幂等）：旧帖 DELETE（年份后缀早于今年）、title_zh/summary 存量回填（title_zh IS NULL → = title；summary IS NULL → excerpt 前 50 字或空串）、原短正文/占位摘要清理保留、300 条裁剪保留
  - [x] SubTask 4.5: 日志：各源扫描/入库条数、HN 过滤丢弃统计，与现有 `[ok]/[skip]` 风格一致

- [x] Task 5: API 字段暴露
  - [x] SubTask 5.1: `backend/src/routes/news.js` 列表与详情 SELECT 增加 `title_zh`、`summary`
  - [x] SubTask 5.2: ~~`.env`/`.env.example` 登记 `MIMO_API_KEY`~~（曾登记，Task 7 移除）

- [x] Task 6: 验证
  - [x] SubTask 6.1: 语法与启动检查：`node --check` 各改动文件；后端实例启动无报错
  - [x] SubTask 6.2: 跑 `npm run fetch-news` + SQL 抽查验收：入库条目全部 AI 相关（HN 13 条标题 100% 含 AI 关键词）、无 "(20xx)" 旧帖、title_zh/summary 零缺失、来源 6 家（Hacker News + 5 家 RSS）
  - [x] SubTask 6.3: `cd frontend && npx vite build` 回归通过（本次未改前端）

- [x] Task 7: 按用户决定移除 MiMo，改为本地关键词规则过滤
  - [x] SubTask 7.1: 删除 `mimoClean`/`mimoCleanChunk`/`MIMO_*` 常量；删除 `.env`/`.env.example` 的 `MIMO_API_KEY` 段；grep 确认 backend 零残留
  - [x] SubTask 7.2: 新增 `looksAIRelated()`（词边界正则，覆盖复数 LLMs/GPTs 与 ChatGPT），HN 新条目标题校验不过则丢弃；RSS 条目直通
  - [x] SubTask 7.3: 重跑管线 + DB 抽查（HN 25 条过滤后 13 条入库、全部含 AI 关键词）+ `npx vite build` 回归

# Task Dependencies
- Task 4 依赖 Task 1、2、3
- Task 7 依赖 Task 1-6（在其成果上替换清洗方案）
