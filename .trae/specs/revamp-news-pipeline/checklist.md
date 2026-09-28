# Checklist

- [x] init.sql 的 news 表含 title_zh VARCHAR(300)、summary VARCHAR(200)，新装库结构正确
- [x] ensureNewsColumns 幂等迁移：information_schema 探测 + ALTER ADD COLUMN，重复执行无副作用，不依赖 ADD COLUMN IF NOT EXISTS（openGauss 兼容）
- [x] HN 抓取走 hn.algolia.com search_by_date + tags=story，8 个关键词全覆盖，合并去重后每日候选 ≤30 条（实跑 25 条）
- [x] Algolia 相邻请求间隔 ≥500ms，单次失败重试 1 次，单关键词最终失败跳过不中断整体
- [x] 标题 "(20xx)" 年份后缀且早于今年的条目不入库，存量同模式行被清理（库内抽查 0 条）
- [x] HN 新条目标题含 AI 关键词（词边界正则，覆盖复数与 ChatGPT）才入库；实跑 25 条过滤丢弃 12 条，入库 13 条 100% 命中关键词
- [x] RSS 条目为 AI 垂直源直通入库，不经关键词校验
- [x] 抓取或过滤任一失败均不破坏既有库数据（入库仅 INSERT ... WHERE NOT EXISTS 新增）
- [x] 新入库条目均带 title_zh 与 summary 字段值（存量回填兜底），原有字段（title/link/source/published_at）完整保留
- [x] GET /api/news 列表与 GET /api/news/:id 详情均返回 title_zh、summary（3103 端口临时实例实跑验证）
- [x] 定时任务维持每日 08:30 + 启动补跑 + /api/news/sync 手动 token 触发，server.js 无行为变更
- [x] 管线无任何收费/外部模型依赖：MiMo 代码与 MIMO_API_KEY 环境变量全部移除，backend 目录 grep 零残留
- [x] 跑通一遍管线后：入库新闻全部与 AI 相关（HN 标题关键词校验 + RSS 垂直源）、无 (2021) 类旧帖、来源分布 6 家不止 HN 一家
- [x] cd frontend && npx vite build 通过
