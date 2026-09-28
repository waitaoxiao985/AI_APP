# 改造新闻抓取管线（AI 快讯提质）Spec

> 变更记录：应用户决定，原方案的「MiMo 大模型清洗」已移除，改为零成本本地关键词规则过滤（2026-09-28）。

## Why
「AI 快讯」每日定时抓取混入了 Hacker News 首页热榜带来的非 AI 新闻（医学、社会新闻等）与多年前的旧帖（标题带 "(2021)" 年份后缀）。需要把 HN 数据源改为 Algolia 官方搜索 API 按关键词定向抓取，并用本地关键词校验过滤非 AI 噪声，保证入库快讯全部与 AI 强相关。

## What Changes
- HN 数据源更换：不再抓 HN 首页热榜，改用 Algolia HN 搜索 API（`https://hn.algolia.com/api/v1/search?query=...`，免费无 Key），按 8 个关键词（AI、LLM、GPT、Claude、OpenAI、Anthropic、machine learning、deep learning）按时间排序检索、合并去重，每日取最新约 25 条（20-30 区间内）
- 旧帖过滤：标题匹配 "(20xx)" 年份后缀且年份早于今年的条目直接丢弃；存量库同模式行幂等清理
- 噪声过滤（本地规则，零成本）：Algolia 检索可能命中 url/正文而非标题，HN 条目标题必须含 AI 关键词（`ai|llm|gpt|chatgpt|claude|openai|anthropic` 词边界匹配，含复数，及 machine/deep learning 短语）才入库，否则丢弃；RSS 源全部为 AI 垂直媒体，直接保留
- **BREAKING**（数据库结构）：`news` 表新增 `title_zh VARCHAR(300)`、`summary VARCHAR(200)` 两列（幂等迁移，兼容 openGauss），保留原有全部字段。中文 RSS 条目 title_zh=原标题、summary=excerpt 前 50 字；HN 英文条目 title_zh=英文原标题、summary 从正文截取或留空（不做机器翻译）
- `news-sync.js` 由「逐源抓取即时入库」重构为「收集 → 去重 → 过滤 → 入库」，保留既有 RSS 存量回填与清理逻辑
- `/api/news` 列表与详情接口返回 `title_zh`、`summary` 字段
- 定时任务不变：每日 08:30 node-cron + 启动补跑 + `/api/news/sync` 手动触发

## Impact
- Affected specs: 快讯采集管线、快讯 API
- Affected code:
  - `backend/src/news-sync.js`（主体重构：HN 抓取器、年份过滤、标题关键词校验、syncNews 流程编排、ensureNewsColumns 迁移）
  - `backend/src/routes/news.js`（两处 SELECT 增列）
  - `backend/init.sql`（CREATE TABLE news 增列）
  - `backend/src/server.js`、`backend/src/fetch-news.mjs`（不改，随 syncNews 自动生效）
- 数据库影响（全部幂等，改前说明）：
  - `ALTER TABLE ADD COLUMN` × 2：仅元数据变更，0 行数据受影响
  - 存量回填 UPDATE：`title_zh IS NULL` 的行（≤300 行）回填为原标题；`summary IS NULL` 的行回填为 excerpt 前 50 字（无 excerpt 则空串）
  - 旧帖 DELETE：标题以 "(20xx)" 结尾且年份 < 今年（2026）的存量行，预计极少量
- 运行依赖：无新增外部 API 依赖（Algolia 免费无 Key；不调用任何大模型服务）

## ADDED Requirements

### Requirement: HN 关键词检索数据源
系统 SHALL 通过 Algolia HN 搜索 API 按关键词检索 Hacker News，替代首页热榜抓取。

#### Scenario: 正常抓取
- **WHEN** 每日同步执行
- **THEN** 依次请求 8 个关键词（`search_by_date` 接口、`tags=story`、每词 hitsPerPage=15、限定最近 30 天、相邻请求间隔 ≥500ms、单次失败重试 1 次）
- **THEN** 8 组结果按 objectID 与 url 合并去重，按发布时间倒序取最新约 25 条作为 HN 候选
- **THEN** HN 条目 `source` 固定为 `Hacker News`，`link` 优先取 story url，无 url 的 Ask HN 回退 `https://news.ycombinator.com/item?id=<objectID>`；story_text 达正文阈值则入库，否则 content 为空

#### Scenario: 单个关键词请求失败
- **WHEN** 某关键词请求两次均失败
- **THEN** 跳过该关键词并记日志，其余关键词结果正常合入

### Requirement: 旧帖过滤
系统 SHALL 过滤标题带历史年份后缀的旧帖。

#### Scenario: 命中年份后缀
- **WHEN** 条目标题匹配 `\((20\d{2})\)\s*$` 且年份早于今年（2026）
- **THEN** 该条目直接丢弃，不入库
- **AND** 存量库中同模式行由幂等 DELETE 清理

### Requirement: HN 标题关键词校验（噪声过滤）
系统 SHALL 在入库前对 HN 新条目做标题关键词校验，不依赖任何外部 AI 服务。

#### Scenario: 校验通过
- **WHEN** HN 新条目标题命中 `/\b(ai|llm|gpt|chatgpt|claude|openai|anthropic)s?\b|machine\s+learning|deep\s+learning/i`
- **THEN** 该条目入库

#### Scenario: 校验不通过
- **WHEN** HN 新条目标题不含任何 AI 关键词（Algolia 全文检索命中了 url 或正文的情况）
- **THEN** 该条目丢弃并计入日志（`HN 关键词过滤: 丢弃 N 条`）
- **AND** RSS 源条目不经过此校验（全部为 AI 垂直媒体，直接保留）

### Requirement: 数据结构扩展
系统 SHALL 为每条新闻提供译题与摘要字段，并保留原有字段。

#### Scenario: 新条目入库
- **WHEN** 过滤后的条目入库
- **THEN** `news` 表每条含 `title`（原标题）、`link`、`source`、`published_at`、`excerpt`、`content` 原有字段，以及新字段 `title_zh`、`summary`（由存量回填兜底为原标题 / excerpt 前 50 字）

#### Scenario: 存量库迁移
- **WHEN** syncNews 启动时检测到 `news` 表缺少新列
- **THEN** 通过 information_schema 探测后执行 `ALTER TABLE ADD COLUMN` 补齐（不依赖 `ADD COLUMN IF NOT EXISTS`，兼容 openGauss），重复执行无副作用

### Requirement: API 字段暴露
#### Scenario: 快讯列表与详情
- **WHEN** 请求 `GET /api/news` 或 `GET /api/news/:id`
- **THEN** 响应包含 `title_zh` 与 `summary` 字段

### Requirement: 健壮性
#### Scenario: 抓取失败
- **WHEN** 任一数据源抓取失败
- **THEN** 保留上一次成功的数据，不覆盖（入库只做 `INSERT ... WHERE NOT EXISTS` 新增，无破坏性写）
- **AND** Algolia 调用有 ≥500ms 间隔与 1 次重试
- **AND** node-cron 维持每日 08:30 执行 + 启动补跑 + 手动 token 触发

## MODIFIED Requirements

### Requirement: syncNews 采集流程
原有流程为「逐源抓取、边抓边入库」。修改为：
1. 收集：5 个 RSS 源（RSSHub 优先、原生 feed 兜底）+ HN Algolia 候选，全部先在内存收集，不直接写库
2. 过滤：年份后缀旧帖过滤；批内按 link 去重
3. 比对：与库中已有 link 比对，分为「新条目」与「已存在条目」
4. 过滤：HN 新条目做标题 AI 关键词校验，不通过的丢弃；RSS 新条目直接保留
5. 入库：新条目插入（title_zh/summary 存 NULL，由存量回填补齐）；已存在的 RSS 条目保留原有 content/excerpt 回填逻辑
6. 存量治理：旧帖 DELETE、title_zh/summary 存量回填、短正文清空、占位摘要清空（原逻辑保留）
7. 裁剪：维持 300 条上限（按 fetched_at 保留最新）

## REMOVED Requirements

### Requirement: HN 首页热榜抓取
**Reason**: 首页热榜混入大量非 AI 新闻与多年旧帖，不再作为数据源。
**Migration**: 本地代码当前无 HN 首页抓取逻辑（现库 5 个中文 RSS 源全部保留）；新增的 HN 数据源从第一版起即按 Algolia 关键词检索实现，无需代码回退动作。

### Requirement: MiMo 大模型清洗
**Reason**: 应用户决定不想引入收费的模型 API；相关性过滤由免费的本地关键词校验承担。
**Migration**: MiMo 客户端代码、`MIMO_API_KEY` 环境变量及 `.env` 登记全部移除，管线零外部模型依赖。代价：HN 英文条目无机器中文译题（title_zh 为英文原标题，由存量回填补齐）。
