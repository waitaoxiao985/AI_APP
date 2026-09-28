# Checklist

- [x] 每分类（财经/政治/军事/游戏）至少接入 1 个实测通过的源，配置含 RSSHub 路由与/或原生 feed 兜底（财经 2 + 政治 3 + 军事 1 + 游戏 3，机核带原生兜底；财联社 RSS 条目无 link 弃用并在代码注释中说明）
- [x] init.sql 的 daily_news 表结构完整（title/link unique/source/category/published_at/excerpt/fetched_at + 索引），幂等可重复执行
- [x] ensureDailyNewsTable 在采集开头幂等建表，老库不跑 init-db 也能用（CREATE TABLE IF NOT EXISTS，openGauss 兼容；无 FILTER 子句）
- [x] daily_news 只存标题+摘要+原文链接，不存正文全文（版权红线）；摘要 < 8 字置空
- [x] 入库只新增不覆盖（INSERT ... WHERE NOT EXISTS），单源失败跳过不破坏旧数据
- [x] 每分类按 fetched_at 裁剪至 100 条上限
- [x] GET /api/daily-news：category 白名单校验（非法 400）、limit 缺省 20 上限 100（非法 400）、不含 content 字段（实跑验证）
- [x] 定时：每日 08:35 采集今日新闻（错开 08:30 AI 快讯）+ 启动补跑；/api/news/sync 手动触发同时触发两管线且响应形状兼容（临时实例启动日志验证两管线并行）
- [x] npm run fetch-daily-news 可独立跑通（245 条入库）
- [x] NewsToday 页面：分类 Tab（全部/财经/政治/军事/游戏）、默认全部、切换即加载；条目外链新标签页打开（rel="noreferrer"）
- [x] 日期分组（今天/昨天/月日）沿用原逻辑；加载/错误/空态沿用骨架屏/错误条/空态
- [x] 新增 CSS 只用 Design DNA 变量无裸色值；hover 包在 @media (hover: hover) 且有 focus-visible；JSX 类名在 CSS 里 0 缺失（29/29 核对，顺带补齐历史缺失的 .w-30/.w-68）
- [x] daily_news 与 news 表 link 零重叠（SQL 实测 0 条）
- [x] 跑通后各分类均有条目入库（财经 81/政治 74/游戏 70/军事 20），来源 9 家不止一家
- [x] cd frontend && npx vite build 通过
