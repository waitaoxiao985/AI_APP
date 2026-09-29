# AI 知识库 App

一个面向 AI 学习者的轻量知识库应用，提供大模型、提示工程、AI 安全等方向的文章浏览、搜索、阅读与收藏功能。

纯 JavaScript + JSX 直白写法，无复杂封装，适合作为学习与作品集项目。

## 功能特性

1. **首页信息流** — 顶部品牌区（字形 + 标题 + 副标题 + 圆形搜索入口）→ 今日推荐轮播（自动播放 / 触摸滑动 / 圆点指示 / 左右箭头）→ 快捷入口卡片组（知识分类 / AI 快讯 / 今日新闻 / 网络安全）→ 专题轮播 → 收藏预览
2. **全部文章** — `/articles` 全量列表 + 分类筛选，顶栏返回
3. **搜索** — 按标题 / 摘要 / 正文检索，热词来自 `search_logs` 的搜索日志聚合
4. **专题** — `/topic/:id` 专题聚合页；`/today` 取当日推荐后跳转
5. **AI 快讯** — 每日 08:30 定时抓取 + 启动补跑，共 6 个源（5 个 AI 垂直媒体经自建 RSSHub 取全文、Hacker News 经 Algolia 按关键词检索），按 link 去重、上限 300 条。取到全文的直接阅读，只给链接的降级为「标题 + 摘要 + 阅读原文」；列表页顶部有**日期条**可按天翻阅（近 7 天），详情页展示**核心观点 / 标签 / 阅读时长**
6. **安全快讯** — `/security-news` 网络安全资讯独立模块，每日 08:40 定时采集 + 启动补跑；RSS 抓取 + 规则富化（中文标题 / 摘要 / 标签 / 阅读时长）+ 免费翻译 API，配套 `reset-news` 一次性脚本
7. **今日新闻** — `/news-today` 按日期与板块（财经 / 政治 / 军事 / 游戏）翻阅；每日 08:35、20:35 两次采集
8. **长文阅读 / 收藏 / 登录注册** — 参考文献与版权声明随文排版、JWT 鉴权收藏、bcrypt 密码加密

底部导航 2 个 tab（首页 / 我的），其余为带返回栏的二级页。

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | React 18 + React Router 6 + Vite 5（纯 JavaScript/JSX） |
| 界面 | Design DNA 驱动的 CSS 设计系统 + Phosphor Icons（21px 字号档，Regular/Fill 双状态） |
| 字体 | 系统无衬线栈（SF Pro / HarmonyOS Sans / PingFang / Segoe UI），**零网络字体依赖**；数字启用 `tabular-nums` |
| 后端 | Node.js + Express 4 + pg（PostgreSQL 驱动） |
| 数据库 | 云端 Neon PostgreSQL（本地开发可选 openGauss，兼容 PostgreSQL 协议） |
| 认证 | bcryptjs 密码加密 + jsonwebtoken（JWT，7 天有效） |
| 快讯采集 | `rss-parser` 抓 RSS/Atom + Hacker News Algolia API + `node-cron` 定时同步（08:30 / 08:35 / 08:40 / 20:35），正文长度过滤与存量治理，规则富化（核心观点 / 标签 / 阅读时长）+ 免费翻译 API |

## 界面设计

界面风格由一份 **Design DNA** JSON 驱动：先把审美方向结构化成三个维度的字段，再把字段逐条翻译成代码，避免「凭感觉调样式」。

文件：`frontend/design-dna.ai-blue.json`（由参考截图测色生成）

### 三个维度

| 维度 | 内容 | 落地位置 |
|---|---|---|
| **design_system** | 可度量的 token：色板、字阶、间距、圆角、阴影、动效曲线、图标、组件模式 | `frontend/src/index.css` 的 `:root` 变量 |
| **design_style** | 可感知的取向：mood、构图策略、留白哲学、交互手感、品牌语气 | 组件结构与文案写法 |
| **visual_effects** | 需要 CSS 以外手段实现的渲染：滚动触发入场、轮播、毛玻璃 | CSS 动画 + `App.jsx` 的 `useReveal()` |

### 风格方向：深蓝内容流（AI Blue Feed）

由一张参考截图的**确定性测色**驱动（k-means k=8、分层采样 160,000 px），不是凭肉眼估色——感知色会向熟悉色板漂移，ΔE 常超 10。隐喻是「夜间驾驶舱的抬头显示」，关键词：`clean` `technological` `calm` `premium` `focused`。

**色板**（单色蓝体系 + 冷灰中性色，无第二色相）

| 用途 | 色值 | 来源 |
|---|---|---|
| 页面底色 | `#060b12` | 测得，占屏 70.8% |
| 卡片面 | `#0c2340` | 测得，12.0% |
| 抬升面 | `#124580` | 测得，6.3% |
| 信号蓝 accent | `#2977cb` | 测得 role=accent，3.4% |
| 正文 / 次要 / 元信息 | `#d9e4eb` / `#b6c4d1` / `#89a5bc` | 首尾两个为测得值 |
| 语义色 | success `#3ecf8e` · warning `#f0a63c` · error `#f2555a` · info `#4f9bf0` | 参考图未出现，按蓝色体系外推 |

> 测量时先把 mockup 外圈的模糊背景裁掉（否则会混入 `#342828`、`#665e68` 两个暖灰，破坏单一冷灰家族）；`measured_palette` 里那个 0.37% 的暖橙 `#b6633b` 来自缩略图照片，属图像内容而非界面颜色，未取用。

**字阶与形制**

- 系统无衬线，标题正文同族，**不加载任何网络字体**
- 圆角 `8 / 14 / 20 / pill` 四档
- 卡片**不描边**，靠底色明度差 + 柔和冷蓝阴影分层；列表无分隔线、无奇偶斑马底
- 动效 `cubic-bezier(0.2, 0, 0, 1)`，`150 / 250 / 400ms` 三档，无回弹
- 列表卡结构：左侧 88×66（4:3）缩略图 + 右侧标题 / 摘要（各两行截断）/ 元信息 + chevron

**视觉特效**

已开启：

| 特效 | 实现 |
|---|---|
| 滚动触发入场 | `App.jsx` 的 `useReveal()`：IntersectionObserver + MutationObserver 捕获异步列表 + 1500ms 兜底 |
| 轮播自动播放 | `setInterval`，受 `prefers-reduced-motion` 守卫 |
| 毛玻璃 | 顶栏 / 底栏 `backdrop-filter: blur(18px) saturate(160%)` |

已关闭（DNA 标 `enabled: false`，**代码里没有任何实现**）：背景网格 / 噪点 / 呼吸辉光、粒子、3D、着色器、Canvas、光标聚光、打字机、SVG 动画、视差、图像特效。

**降级策略**

- `prefers-reduced-motion: reduce` → 关闭全部动画，入场元素直接可见
- 触发滚动观察的条件不满足 → 1500ms 后强制 `opacity: 1`，内容绝不卡在不可见

### 质量检查

| 项 | 结果 |
|---|---|
| 色值溯源 | CSS 中 19 个 hex，13 个与 DNA 精确匹配、6 个同族派生（色相 210–219°），**0 个游离色**；28 种 rgba **0 越界** |
| WCAG 对比度 | 14 组全部达标：正文 12.22:1、次要 8.88:1、元信息 6.14:1、accent 文字 6.18:1、按钮白字 4.57:1 |
| 已关闭特效 | `canvas` / `three` / `gsap` / `lottie` / `pixi` / `WebGL` / 噪点 / 网格 / 聚光 / 打字机 / 信号线 扫描命中 **0** |
| DNA token | `--bg` `--surface` `--accent` `--text` `--r-*` `--ease` `--dur-*` 等 **17 个 token 与 DNA 逐字一致** |

### 修改设计

调风格时**只改两处**：`design-dna.ai-blue.json` 记录意图，`index.css` 的 `:root` 执行数值。组件样式里的颜色一律引用变量，不写裸色值——这是上表「0 游离色」能成立的前提。

## 项目结构

```
AI_APP/
├── backend/                      后端服务
│   ├── package.json
│   ├── .env.example              环境变量模板
│   ├── init.sql                  建表 + 10 篇入门种子文章
│   ├── seed-deep-articles.sql    深度长文（文末含参考文献与版权声明）
│   └── src/
│       ├── server.js             Express 入口（3003），注册路由 + 安全中间件 + cron
│       ├── db.js                 pg 连接池
│       ├── init-db.js            建表 + 种子（先 init.sql 再 seed-deep）
│       ├── reset-db.js           清库重建
│       ├── seed-deep.js          深度长文种子（幂等，可单独执行）
│       ├── news-sync.js          快讯采集：5 个 AI 垂直源（RSSHub）+ Hacker News + 长度过滤 + 存量治理 + 截止日配置
│       ├── news-enrich.js        快讯规则富化（中文标题 / 摘要 / 核心观点 / 标签 / 阅读时长，不调 LLM）
│       ├── security-sync.js      安全资讯采集（独立于 AI 快讯）
│       ├── security-enrich.js    安全资讯规则富化
│       ├── translate.js          免费翻译 API 封装（富化用）
│       ├── reset-news.js         一次性脚本：清空 news 表（快照预览 + CONFIRM 确认）
│       ├── daily-news-sync.js    今日新闻采集（按 财经 / 政治 / 军事 / 游戏 板块归档）
│       ├── gen-covers.mjs        生成文章封面占位图
│       ├── fetch-news.mjs        手动触发一次快讯同步
│       ├── fetch-security-news.mjs 手动触发一次安全资讯同步
│       ├── fetch-daily-news.mjs  手动触发一次今日新闻同步
│       └── routes/
│           ├── auth.js           注册 / 登录 / 我的信息
│           ├── articles.js       列表 / 分类 / 搜索 / 今日推荐 / 热词 / 详情
│           ├── bookmarks.js      收藏列表 / 最近 / 加收 / 取消
│           ├── topics.js         专题列表 / 专题详情
│           ├── news.js           快讯列表（按天过滤）/ 有数据的日期列表 / 快讯详情
│           ├── security-news.js  安全资讯列表 / 详情
│           └── news-today.js     今日新闻（按日期 + 板块）
├── frontend/                     前端应用
│   ├── package.json
│   ├── vite.config.js            开发端口 5173，/api 代理到 3003，PWA 配置
│   ├── index.html                meta + theme-color（无网络字体）
│   ├── design-dna.ai-blue.json   Design DNA 规范（三个维度）
│   ├── public/covers/            文章封面占位图
│   └── src/
│       ├── main.jsx              React 挂载入口 + PWA
│       ├── sw.js                 Service Worker（PWA 运行时缓存）
│       ├── App.jsx               路由 / 底部导航 / useReveal 滚动入场
│       ├── api.js                fetch 封装 + token 管理
│       ├── time.js               相对时间（X 分钟前 / X 小时前）
│       ├── index.css             设计系统（token + 组件 + 特效）
│       ├── components/
│       │   ├── ModuleCard.jsx    首页快捷入口卡片
│       │   ├── Cover.jsx         文章封面（按分类着色）
│       │   └── SecurityCard.jsx  安全资讯卡片
│       └── pages/
│           ├── Login.jsx         登录 / 注册（表单校验）
│           ├── Discover.jsx      首页：品牌区 + 今日推荐轮播 + 快捷入口 + 专题 + 收藏
│           ├── Articles.jsx      全部文章（分类筛选）
│           ├── Search.jsx        搜索
│           ├── Topic.jsx         专题详情
│           ├── Article.jsx       长文详情 + 收藏 + 参考文献排版
│           ├── News.jsx          快讯列表（含日期条按天翻阅）
│           ├── SecurityNews.jsx  安全资讯列表
│           ├── NewsToday.jsx     今日新闻（按日期 / 板块翻阅）
│           ├── NewsDetail.jsx    快讯详情（核心观点 / 标签 / 阅读时长，正文 / 仅链接两种形态）
│           ├── Profile.jsx       我的（收藏 + 退出）
│           └── NotFound.jsx      404
├── README.md
└── .gitignore
```

## 运行拓扑

**线上（推荐，数据库云托管）**：

```
手机 / 浏览器 → Vercel 前端 ──rewrite /api──→ Vercel 后端 ──pg──→ Neon PostgreSQL（公网）
```

**本地开发**：

```
浏览器 → 前端 Vite (5173) ──代理 /api──→ 后端 Express (3003) ──pg──→ Neon PostgreSQL
                                                              └─可选─→ openGauss (192.168.159.136:7654)
```

- 线上主路径：数据库用免费托管 PostgreSQL（Neon），本机虚拟机可保持关机
- 本地开发默认走同一 Neon 库；离线时在 `.env` 注释掉 `DATABASE_URL` 即回退直连 openGauss

## 环境要求

- Node.js 18+（开发时使用 v24）
- npm 9+
- 云端：Neon（或任意 PostgreSQL 兼容托管数据库）；离线开发可选 openGauss 2.1+

## 部署运行

### 1. 准备数据库（推荐：云端 Neon，本机零依赖）

1. 注册 https://neon.com（免费层无需信用卡），创建项目（区域选 Singapore / us-east-1 均可）
2. Dashboard → **Connect** → 复制 **Pooled connection**（host 带 `-pooler` 后缀）
3. 将连接串写入 `backend/.env` 的 `DATABASE_URL`（`.env.example` 已给示例）

### 2. 初始化表结构和种子数据

```bash
cd backend
npm install
copy .env.example .env    # 填入 DATABASE_URL（或离线时用下方 DB_* 直连 openGauss）
npm run init-db           # 建 users / articles / bookmarks / news / daily_news 等表 + 10 篇种子文章
npm run seed-deep        # 仅追加深度长文（幂等，不删表，可对已有库执行）
npm run gen-covers       # 生成文章封面占位图（写入 frontend/public/covers）
npm run fetch-news           # 首次抓取快讯（之后由每日 08:30 定时任务自动补）
npm run fetch-security-news  # 首次抓取安全资讯（之后由每日 08:40 定时任务自动补）
npm run fetch-daily-news     # 首次抓取今日新闻（之后由每日 08:35 / 20:35 定时任务自动补）
```

`.env` 示例（云端优先）：

```
DATABASE_URL=postgresql://neondb_owner:xxx@ep-xxx-pooler.us-east-1.aws.neon.tech/ai_app?sslmode=require
JWT_SECRET=<32 字节以上随机串>   # 必填；留空或用弱串后端会拒绝启动
PORT=3003
SYNC_TOKEN=change-me        # 手动触发快讯同步的 token
CRON_SECRET=change-me       # Vercel Cron 鉴权
CORS_ORIGIN=http://localhost:5173   # 允许的前端来源，逗号分隔
```

> `JWT_SECRET` 需 ≥ 32 字节，可用 `openssl rand -base64 48` 生成。`change-me`、`ai-app-secret-2026` 这类弱串会被启动校验直接拒绝。

离线开发（可选）：注释掉 `DATABASE_URL`，改用下方 `DB_*` 直连本机 openGauss：

```
DB_HOST=192.168.159.136
DB_PORT=7654
DB_NAME=aiapp
DB_USER=appuser
DB_PASSWORD=Secure@2026
```

### 3. 启动后端

```bash
npm run dev
# 后端已启动 http://localhost:3003
```

### 4. 启动前端

```bash
cd ../frontend
npm install
npm run dev
# 打开 http://localhost:5173
```

### 5. 上线部署（Vercel）

- **后端**（项目 `ai-app-backend`）：`cd backend && npx vercel --prod`
  - 环境变量需配置：`DATABASE_URL`（Neon pooler 串）、`JWT_SECRET`、`SYNC_TOKEN`、`CRON_SECRET`、`CORS_ORIGIN`（线上前端域名）
  - 不需要配 `RSSHUB_BASE_URL`：云端访问不到本机 RSSHub，会自动回退到原生 feed
  - `vercel.json` 已配置 cron：每日 **08:30（北京时间，`30 0 * * *` UTC）** 触发 `/api/news/sync`，该入口会同时执行快讯采集与今日新闻采集，用 `CRON_SECRET` 走 Bearer 鉴权
- **前端**（项目 `ai-app`）：`cd frontend && npx vercel --prod`
  - `vercel.json` 已配置 `/api/*` rewrite 到后端域名
- 手动触发一次采集：`GET <后端域名>/api/news/sync?token=<SYNC_TOKEN>`（同样会跑快讯与今日新闻两条链路）
- 安全资讯：云端无 cron，靠启动补跑 + 手动触发 `GET <后端域名>/api/security-news/sync`（Bearer token 或 `?token=`）；本地则每日 **08:40** 由 node-cron 定时采集

> **国内访问提示**：`*.vercel.app` 与 Neon 端点在中国大陆访问不稳定。面向国内手机市场的正式发布，建议后续迁移到国内云（腾讯云/阿里云 RDS PostgreSQL + 备案域名），属独立变更。

### 可选：本地 openGauss 自建（仅离线开发）

在 openGauss 所在机器上执行（超管 `opengauss`）：

```bash
su - opengauss -c "gsql -d postgres -c \"CREATE USER appuser WITH PASSWORD 'Secure@2026';\""
su - opengauss -c "gsql -d postgres -c \"CREATE DATABASE aiapp WITH ENCODING 'UTF8' OWNER appuser;\""
```

确认 `postgresql.conf` 中 `listen_addresses = '*'`、`password_encryption_type = 0`，`pg_hba.conf` 放行应用机网段：

```
host  all  all  192.168.159.0/24  md5
```

防火墙放行 7654 端口（openGauss 默认端口是 7654，不是 5432）。

> **坑 1**：`password_encryption_type` 必须是 `0`（标准 PostgreSQL md5）。默认值 `2` 是 sha256，openGauss 会走它自有的认证协议，`node-postgres` 无法完成握手（报 `Cannot read properties of undefined (reading 'message')`）。该参数是 postmaster 级，改完必须重启才生效。

> **坑 2**：openGauss 的 systemd 服务是 oneshot 类型，改配置后 `systemctl restart` 不会杀掉旧进程，必须先 `pkill -u opengauss` 再 `systemctl start`。

## API 接口

| 方法 | 路径 | 说明 | 鉴权 |
|---|---|---|---|
| POST | /api/auth/register | 注册（username/password/nickname） | 否 |
| POST | /api/auth/login | 登录 | 否 |
| GET | /api/auth/me | 获取当前用户 | 是 |
| GET | /api/articles | 文章列表（category / limit / offset，均校验） | 否 |
| GET | /api/articles/categories | 全部分类 + 各分类计数 | 否 |
| GET | /api/articles/daily | 今日推荐（按日期种子哈希 + 分类去重取 3 篇） | 否 |
| GET | /api/articles/search?q= | 搜索文章（LIKE 通配符已转义，同时写入搜索日志） | 否 |
| GET | /api/articles/search/hot | 热门搜索词（search_logs 按 hits 取前 8） | 否 |
| GET | /api/articles/:id | 文章详情 | 否 |
| GET | /api/topics | 专题列表（含各专题文章数） | 否 |
| GET | /api/topics/:id | 专题详情 + 该专题文章 | 否 |
| GET | /api/news | 快讯列表（date / limit ≤ 100 / offset，均校验） | 否 |
| GET | /api/news/dates | 有数据的日期列表（近 14 天，含各天条数），供日期条渲染 | 否 |
| GET | /api/news/today | 今日新闻（date / category / limit / offset，返回当日各板块计数） | 否 |
| GET | /api/news/:id | 快讯详情（核心观点 / 标签 / 阅读时长；正文可能为 null，表示仅链接） | 否 |
| GET | /api/security-news | 安全资讯列表（limit ≤ 100 / offset） | 否 |
| GET | /api/security-news/:id | 安全资讯详情 | 否 |
| GET | /api/security-news/sync | 手动触发安全资讯采集（Bearer token 或 ?token=） | 是 |
| GET | /api/bookmarks | 我的收藏列表 | 是 |
| GET | /api/bookmarks/recent?limit= | 最近收藏 + 总数 | 是 |
| GET | /api/bookmarks/check/:articleId | 是否已收藏 | 是 |
| POST | /api/bookmarks | 加收藏 | 是 |
| DELETE | /api/bookmarks/:articleId | 取消收藏 | 是 |

鉴权方式：请求头 `Authorization: Bearer <token>`。所有 `:id` 与分页参数均做格式与范围校验，非法值返回 400。

## 数据库表

| 表 | 字段 |
|---|---|
| users | id, username(唯一), password(bcrypt), nickname, created_at |
| articles | id, title, summary, content, category, read_time, created_at |
| bookmarks | id, user_id, article_id, created_at（user_id + article_id 唯一） |
| topics | id, title(唯一), subtitle, created_at |
| topic_articles | id, topic_id, article_id, created_at（topic_id + article_id 唯一） |
| search_logs | term(唯一), hits, updated_at —— 搜索词计数，供热词接口聚合 |
| news | id, title, title_zh, summary, key_points, tags, read_time, link(唯一), source, published_at, excerpt, content, fetched_at —— `content` 为 null 表示源站未给正文，`title_zh` 存中文标题，`key_points`/`tags`/`read_time` 为规则富化产物 |
| security_news | id, title, link(唯一), source, published_at, excerpt, content, title_zh, summary, key_points, tags, read_time, fetched_at —— 安全资讯，独立于 AI 快讯 `news` 表 |
| daily_news | id, title, link(唯一), source, category, published_at, excerpt, summary, date, fetched_at —— 今日新闻按 `date` + `category`（财经 / 政治 / 军事 / 游戏）归档 |

种子数据：

- **13 篇文章**（10 篇入门短文 + 3 篇原创深度长文；大模型基础 / 架构原理 / 提示工程 / AI 安全 / 应用实践）
- **3 个专题**，按分类自动挂载文章
- 所有种子均为幂等写法（`WHERE NOT EXISTS`），可重复执行

快讯入库规则：5 个 AI 垂直源（量子位、雷峰网人工智能栏目、AIbase 资讯、AIbase 日报、智源社区）经自建 RSSHub 路由取正文；Hacker News 经 Algolia 搜索 API 按关键词取最近 30 天的 story，标题不含 AI 关键词的作为噪声丢弃。正文短于 120 字的不入库，只保留「标题 + 摘要 + 原文链接」，不做 HTML 站点抓取。入库可配置 `NEWS_MIN_PUBLISH_DATE` 截止日（只保留该日及以后的文章，宁缺毋滥）。存量治理（旧年份标题清理、中文标题与摘要回填、裁剪至最新 300 条）均为幂等操作。快讯与安全资讯均经 `news-enrich.js` / `security-enrich.js` 做规则富化（中文标题 / 摘要 / 核心观点 / 标签 / 阅读时长），翻译走免费 API，全程不调用付费大模型。

今日新闻入库规则：`daily-news-sync.js` 覆盖 财经 / 政治 / 军事 / 游戏 四个板块共 12 个源，均经自建 RSSHub 路由，每源取最新 15 条；入库前可选调用 MiMo 大模型做去重、摘要与板块归类，未配置 `MIMO_API_KEY` 时自动跳过并按原始分类保留。

## 内容与版权说明

本仓库内的文章正文分为两类：

1. **入门短文**：`backend/init.sql` 中的 10 篇种子文章，为本项目原创撰写的概览性介绍。
2. **深度长文**：`backend/seed-deep-articles.sql` 中的长文，为本项目原创撰写，每篇正文末尾附有「参考文献」与「版权声明」两节。

### 转载与引用政策

- 深度长文**不转载任何第三方文章全文**。文中涉及他人工作的部分，均以学术引用（citation）的方式概括其结论与方法。
- 每条参考文献均标明：作者、题名、发表出处与年份、arXiv 编号或 DOI、原文链接，以及**版权归属方**。
- 第三方文献的著作权归各自作者与出版方所有，与本应用无关。读者如需复用文献内容，请遵守其原始授权协议（例如 ACL Anthology 的 CC BY 4.0、OWASP 文档的 CC BY-SA 4.0、NIST 出版物的公有领域条款）。
- 本文正文按本仓库的许可条款使用；如需转载本项目原创文章，请同样保留文末的参考文献与版权声明。

### 添加新文章

新建一个 `.sql` 文件并加入 `backend/src/seed-deep.js` 的 `SEED_FILES` 数组，使用如下幂等写法：

```sql
INSERT INTO articles (title, summary, content, category, read_time)
SELECT '标题', '摘要', '正文', '分类', '15 分钟'
WHERE NOT EXISTS (SELECT 1 FROM articles WHERE title = '标题');
```

正文排版约定（前端 `Article.jsx` 会据此渲染）：`## ` 为二级标题，`### ` 为三级标题，空行分段，`- ` 开头为无序列表，`1. ` 开头为有序列表，`**文字**` 为加粗，`---` 为分隔线；正文末尾依次以 `## 参考文献` 与 `## 版权声明` 收尾。
