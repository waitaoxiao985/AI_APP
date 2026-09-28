# 今日新闻板块（独立于 AI 快讯）Spec

## Why
「今日新闻」页（`/news-today`）目前直接复用 AI 快讯的 `/api/news` 数据，两者内容完全相同——但它们定位根本不同：AI 快讯是 AI 垂直快讯，今日新闻应是覆盖财经、政治、军事、游戏等分类的通用新闻聚合。需要为今日新闻建立独立的数据源、数据表、采集管线与 API，并把页面改造成按分类浏览的通用新闻板块。

## What Changes
- **数据源**：新增按分类配置的通用新闻 RSS 源（走本地 RSSHub 优先 + 原生 feed 兜底，复用现有模式），首批分类：财经、政治、军事、游戏（分类白名单可扩展）
- **BREAKING**（前端行为）：`NewsToday.jsx` 从「按日期分组展示 AI 快讯」改为「分类 Tab + 按日期分组的通用新闻」，条目点击改为跳原文外链（`target="_blank"`），不再进站内详情页
- 数据库新增 `daily_news` 表（幂等建表，兼容 openGauss）：`id/title/link(unique)/source/category/published_at/excerpt/fetched_at`，**只存标题+摘要+原文链接，不存正文**（规避版权，与 AI 快讯的全文定位区分）
- 新增采集脚本 `backend/src/daily-news-sync.js`：按分类抓取、link 去重、无年份过滤无 AI 关键词过滤（通用新闻不需要）、每分类保留条数上限
- 新增 API `GET /api/daily-news?category=&limit=`（category 白名单校验、limit ≤ 100）
- 定时任务：每日 08:35 采集（错开 08:30 的 AI 快讯采集，避免同时压 RSSHub）+ 启动补跑；`/api/news/sync` 手动触发时同时触发本管线；新增 `npm run fetch-daily-news`
- 前端：`api.js` 新增 `getDailyNews()`；`NewsToday.jsx` 重构（分类 Tab、外链条目）；新增 Tab 样式（CSS 变量，无裸色值，遵守 Design DNA）

## Impact
- Affected specs: 今日新闻板块（新）、与 AI 快讯（`news` 表）零共享
- Affected code:
  - `backend/init.sql`（新增 daily_news 建表，幂等）
  - `backend/src/daily-news-sync.js`（新增）
  - `backend/src/routes/daily-news.js`（新增）+ `backend/src/server.js`（注册路由、cron、手动触发）
  - `backend/package.json`（npm script）
  - `frontend/src/api.js`、`frontend/src/pages/NewsToday.jsx`、`frontend/src/index.css`
- 数据库影响：**新建表，0 行现有数据受影响**；`daily_news` 预期每分类保留约 60-100 条、总量上限 400 条
- 部署注意：Vercel 访问不到本地 RSSHub，无原生 feed 兜底的分类在云端会跳过（与 AI 快讯源同机制）
- 与 AI 快讯的关系：数据源完全不重叠（通用媒体 vs AI 垂直媒体），表独立，不做跨表去重

## ADDED Requirements

### Requirement: 分类新闻数据源
系统 SHALL 按分类（财经/政治/军事/游戏）从通用新闻 RSS 源采集新闻。

#### Scenario: 源探测与定稿
- **WHEN** 实施第一步
- **THEN** 对每分类的候选源（RSSHub 路由 + 原生 feed）逐个实测抓取，只接入能稳定返回标题+链接+摘要的源；每分类至少 1 个，无法达标时换候选并报告

#### Scenario: 采集入库
- **WHEN** 每日 08:35 定时 / 启动补跑 / 手动触发
- **THEN** 各分类源依次抓取（RSSHub 优先、原生 feed 兜底），按 link 去重后只新增（`INSERT ... WHERE NOT EXISTS`），excerpt 取自 feed 摘要（不足 8 字置空），**不存正文全文**
- **THEN** 每分类只保留最新约 100 条（按 fetched_at 裁剪）

#### Scenario: 单源失败
- **WHEN** 某源 RSSHub 与原生 feed 均失败
- **THEN** 记 `[skip]` 日志跳过该源，其余源正常，库中旧数据不受影响

### Requirement: 今日新闻 API
#### Scenario: 按分类查询
- **WHEN** 请求 `GET /api/daily-news?category=财经&limit=20`
- **THEN** category 在白名单（财经/政治/军事/游戏）内返回该分类条目，缺省返回全部分类混合（按 published_at 倒序）；limit 缺省 20、上限 100，非整数或越界返 400
- **THEN** 每条含 `id/title/link/source/category/published_at/excerpt`，不含 content

### Requirement: 今日新闻页面（分类 Tab）
#### Scenario: 浏览今日新闻
- **WHEN** 用户进入 `/news-today`
- **THEN** 显示分类 Tab（全部/财经/政治/军事/游戏），默认「全部」；条目按日期分组（今天/昨天/月日），沿用现有分组逻辑
- **THEN** 每条展示来源 tag、时间、标题、摘要（≥30 字才展示），点击在新标签页打开原文外链
- **THEN** 切换 Tab 立即加载对应分类；加载/错误/空态复用现有骨架屏、错误条、空态组件与样式
- **AND** 与 `/news`（AI 快讯）数据零重叠

## MODIFIED Requirements

### Requirement: /api/news/sync 手动触发
本地/云端手动触发采集时，除 AI 快讯管线外**同时触发**今日新闻管线（并行、互不阻塞）；响应行为与现状保持兼容（不破坏现有调用方）。

## REMOVED Requirements

### Requirement: 今日新闻复用 AI 快讯数据
**Reason**: 两者定位不同（AI 垂直 vs 通用分类新闻），内容重复且不符合板块定位。
**Migration**: `NewsToday.jsx` 数据源整体切换到 `/api/daily-news`；AI 快讯页 `/news` 与详情 `/news/:id` 不受影响。
