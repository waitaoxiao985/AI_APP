# Tasks

> 顺序执行。任务 1 需要用户在浏览器侧操作（注册/创建项目/复制密钥），其余由开发侧完成。

- [x] Task 1: 创建 Neon 项目并获取连接串（用户操作，开发侧指导）
  - [x] 注册 https://neon.com（可用 GitHub 登录，免费层无需信用卡）
  - [x] 创建项目（区域选 Singapore/AWS，离中国最近）
  - [x] 在 Dashboard → Connection String 处复制 **Pooled connection**（含 `-pooler` 后缀的 host），形如 `postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require`
  - 备注：实际复用既有项目 neon-coquelicot-ocean（us-east-1），库为 ai_app，此前已在 opencode 会话完成建表与种子
- [x] Task 2: 本地接入 Neon 并重建数据
  - [x] `backend/.env` 追加 `DATABASE_URL=<pooler 连接串>`（保留原有 `DB_*` 行作回退）
  - [x] 依次执行 `npm run init-db`、`npm run fetch-news`（init-db 幂等复跑成功；fetch-news 169→176 条）
  - [x] 核对：articles=13、topics=3、topic_articles=13 映射正确、news=176
  - [x] 验证本地前后端（5173 → 3003 → Neon）全流程正常，此时虚拟机可关机（虚拟机本就处于关机状态，全站仍可用）
- [x] Task 3: Vercel 后端环境变量与部署
  - [x] 确认 Vercel 已配置 DATABASE_URL / JWT_SECRET / CRON_SECRET / SYNC_TOKEN（2 天前 opencode 设置，Secret 类型无法读明文）；SYNC_TOKEN 因无法读取、重设为已知值 `haAF4ruNU0syLO8pS7kZd9RK` 并同步本地 .env
  - [x] `backend/vercel.json` cron schedule 改为 `30 0 * * *`（北京时间 08:30）
  - [x] 触发重新部署（backend + frontend 均 Ready，cron 语法通过部署校验）
- [x] Task 4: 线上接口全量验证
  - [x] 线上后端 `ai-app-backend-seven.vercel.app` 全接口 200：articles / categories / daily / search / hot / topics / news / health
  - [x] 鉴权链路实测：注册（建用户 id=1）→ 登录 → /api/auth/me → 收藏添加/列表/check/删除 全部通过
  - [x] 线上前端 `ai-app-red-nu.vercel.app` 浏览器渲染正常（首页推荐/分类/文章均来自 Neon，无错误），/api 转发到后端 200
- [x] Task 5: 云端快讯采集验证
  - [x] 手动触发 `GET /api/news/sync?token=<SYNC_TOKEN>` 返回 `{"ok":true,"total":179}`（176→179）
  - [x] 直查 Neon news 表确认 179 条已落库
  - [x] 错误 token 返回 401，鉴权生效；cron 由 Vercel 自动触发（Bearer CRON_SECRET），部署已通过校验
- [x] Task 6: 文档同步
  - [x] `backend/.env.example`：补 Neon pooler 连接串示例 + DATABASE_URL/DB_* 双路径说明 + Vercel 变量清单
  - [x] `README.md` 运行拓扑与部署章节改为「云端主路径 + 本地 openGauss 可选」，技术栈表同步更新
- [x] Task 7: 收尾自查
  - [x] `cd frontend && npx vite build` 无报错（4590 modules，built in 10.12s）
  - [x] 线上环境完整可用（后端 seven / 前端 red-nu 均验证），openGauss 虚拟机全程处于关机状态
  - [x] 回退路径代码级确认：`backend/src/db.js` 未改动，未设 `DATABASE_URL` 时走 `DB_*` 直连 openGauss（虚拟机关机，未做实连）

# Task Dependencies
- Task 2 依赖 Task 1（需要连接串）
- Task 3 依赖 Task 2（数据就绪后再切线上）
- Task 4、Task 5 依赖 Task 3（需要线上部署生效）
- Task 6、Task 7 依赖 Task 4/5 通过
