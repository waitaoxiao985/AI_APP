# Checklist

- [x] Neon 项目已创建，拿到 pooler 连接串（含 `-pooler` 后缀）
- [x] 本地 `.env` 配置 `DATABASE_URL` 后 `init-db` + `fetch-news` 执行成功
- [x] Neon 中 articles=13 篇、topics=3 个、topic_articles 映射与分类规则一致
- [x] 本地全流程（首页/文章/专题/搜索/快讯）走 Neon 正常，openGauss 虚拟机处于关机状态
- [x] Vercel `ai-app-backend` 已配置 DATABASE_URL / JWT_SECRET / CRON_SECRET 并重新部署
- [x] `vercel.json` cron 为 `30 0 * * *`（北京时间 08:30）
- [x] 线上 `/api/*` 全量接口验证通过（文章、分类、今日推荐、搜索、热词、专题、快讯、注册登录、收藏）
- [x] 线上手动触发 `/api/news/sync` 成功，快讯写入 Neon
- [x] 前端线上域名完整可用（轮播、详情、收藏、快讯）
- [x] `.env.example` 与 `README.md` 部署章节已更新为双路径说明
- [x] `npx vite build` 无报错
- [x] 不设 `DATABASE_URL` 时本地仍可直连 openGauss（db.js 回退分支未改动，代码级确认；虚拟机关机未实连）
