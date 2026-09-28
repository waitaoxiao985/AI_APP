# 数据库上云（Neon PostgreSQL）Spec

## Why

当前数据库 openGauss 跑在本地虚拟机（192.168.159.136:7654），虚拟机关机后整站不可用；这与「最终投入手机市场、真正可用」的目标冲突。后端已部署在 Vercel（`ai-app-backend`），缺的只是把数据库换成公网可达的托管 PostgreSQL。

## 调研结论（选型）

| 方案 | 免费额度 | 空闲行为 | 适配结论 |
|---|---|---|---|
| **Neon Free（推荐）** | 0.5GB 存储 / 100 CU·h/月 / 5GB 流量 | 计算层 5 分钟无访问自动休眠，来请求毫秒级唤醒（首个请求多 ~0.5s） | `db.js` 已内置 Neon 兼容（剥 `channel_binding` + SSL）；提供 pooler 连接串，适配 Vercel Serverless；无「项目暂停」机制 |
| Supabase Free | 500MB 库 / 2 个活跃项目 | **项目闲置 1 周整库暂停，需手动恢复** | 对要长期在线的手机端应用是硬伤，作备选 |
| 腾讯云/阿里云 RDS | 无免费层 | 常驻 | 国内访问最佳，但需备案域名 + 付费，留作正式上线国内市场阶段 |
| Render/Railway/Fly | 无长期免费/按量 | 常驻 | 不如 Neon 契合当前零成本阶段 |

本项目数据量极小（13 篇文章 + 3 专题 + 快讯上限 300 条，总量 << 10MB），Neon Free 额度足够。本地 openGauss 保留为离线开发选项（`DB_*` 分支不受影响）。

**已知限制（写入本 spec，不在本次实现）**：`*.vercel.app` 与 Neon 端点在中国大陆访问不稳定。面向国内手机市场的正式发布，后续需迁移到国内云 + 备案域名，属独立变更。

## What Changes

- 新增云数据库（Neon），通过 `DATABASE_URL` 接入，本地 openGauss 降级为可选开发库
- 在 Neon 上重建全部表结构 + 种子数据（`init.sql` + `seed-deep-articles.sql` 均为标准 PostgreSQL 语法与幂等写法，可直接执行）
- Vercel 后端项目补齐环境变量：`DATABASE_URL`（用 Neon **pooler** 连接串，防 Serverless 连接数耗尽）、`JWT_SECRET`、`CRON_SECRET`
- `backend/vercel.json` cron 由 `25 0 * * *` 对齐为 `30 0 * * *`（= 北京时间 08:30，与项目文档约定一致）
- 更新 `backend/.env.example` 与 `README.md` 部署章节，说明云端数据库配置方式

**数据影响面**：云端为全新建库。openGauss 里的测试账号（users）、收藏（bookmarks）、搜索日志（search_logs）、历史快讯（news）不会迁移——文章与专题全部由种子重建，快讯重新抓取即可；如需保留测试数据可另行 pg_dump，本次不做。openGauss 库本身不动、不删。

## Impact

- Affected specs: 无既有 spec 文档（本目录首个）
- Affected code: `backend/.env.example`、`backend/vercel.json`、`README.md`（部署章节）；`backend/src/db.js` 与全部路由**零改动**（云端分支已存在）
- 运行拓扑变为：手机/浏览器 → Vercel 前端 → Vercel 后端函数 → Neon（公网）；本地开发走 localhost:3003 → 同一 Neon

## ADDED Requirements

### Requirement: 云端 PostgreSQL 数据库
系统 SHALL 通过 `DATABASE_URL` 连接公网托管 PostgreSQL（Neon），在本地虚拟机关机状态下保持全站可用。

#### Scenario: 虚拟机关机后全站可用
- **WHEN** openGauss 虚拟机关机，用户通过线上域名访问首页
- **THEN** 文章、专题、快讯、搜索、登录收藏全部正常返回，无 5xx

#### Scenario: 冷启动可接受
- **WHEN** 数据库闲置超过 5 分钟后首个请求到达
- **THEN** 请求在 2 秒内正常返回（Neon 唤醒延迟 ~0.5s）

### Requirement: 云端数据完整性
迁移后 Neon 中 SHALL 存在与种子一致的数据：13 篇文章、3 个专题及其文章映射、快讯表可由采集任务填充。

#### Scenario: 种子迁移完成
- **WHEN** 对 Neon 执行 `npm run init-db` 与 `npm run seed-deep`
- **THEN** `articles` 13 行、`topics` 3 行、`topic_articles` 映射与分类规则一致，且脚本可重复执行不产生重复行

### Requirement: 云端定时快讯采集
Vercel cron SHALL 每日北京时间 08:30 调用 `/api/news/sync`，通过 `CRON_SECRET` 鉴权，成功将 RSS 快讯写入 Neon。

#### Scenario: 手动触发采集成功
- **WHEN** 携带合法 token 请求线上 `/api/news/sync`
- **THEN** 返回 `{ ok: true }` 且 Neon `news` 表新增当日快讯（8 源、按 link 去重、正文 <120 字不入库的规则不变）

### Requirement: 本地开发不依赖虚拟机
本地 `npm run dev`（前后端）SHALL 在仅配置 `DATABASE_URL` 的情况下正常工作，openGauss 虚拟机可保持关机。

## MODIFIED Requirements

### Requirement: 部署文档
`README.md` 部署章节现仅描述 openGauss 自建路径；修改为「云端（Neon + Vercel，线上主路径）」与「本地 openGauss（可选开发路径）」双路径说明，`.env.example` 注释同步细化（标注 pooler 连接串用法与 Vercel 所需变量）。

## REMOVED Requirements

### Requirement: 对 openGauss 的运行时强依赖
**Reason**: 数据库迁往公网托管后，openGauss 仅为离线开发选项。
**Migration**: 不卸载、不改库；`.env` 不设 `DATABASE_URL` 时仍按 `DB_*` 直连，行为完全保留。
