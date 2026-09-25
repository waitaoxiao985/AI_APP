# AI 知识库 App

一个面向 AI 学习者的轻量知识库应用，提供大模型、提示工程、AI 安全等方向的文章浏览、搜索、阅读与收藏功能。

纯 JavaScript + JSX 直白写法，无复杂封装，适合作为学习与作品集项目。

## 功能特性

核心五件套：

1. **浏览与分类筛选** — 首页文章列表，按分类（大模型基础 / 架构原理 / 提示工程 / AI 安全 / 应用实践）筛选
2. **搜索** — 按关键词搜索文章标题、摘要、正文
3. **详情阅读** — 文章全文阅读，显示分类与阅读时长
4. **收藏** — 登录后可收藏 / 取消收藏文章，在「我的」查看收藏列表
5. **登录注册** — 用户名 + 密码注册登录（bcrypt 加密 + JWT 令牌）

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | React 18 + React Router 6 + Vite 5（纯 JavaScript/JSX） |
| 后端 | Node.js + Express 4 + pg（PostgreSQL 驱动） |
| 数据库 | openGauss（兼容 PostgreSQL 协议） |
| 认证 | bcryptjs 密码加密 + jsonwebtoken（JWT，7 天有效） |

## 项目结构

```
AI_APP/
├── backend/                  后端服务
│   ├── package.json
│   ├── .env.example          环境变量模板
│   ├── init.sql              建表 + 10 篇种子文章
│   └── src/
│       ├── server.js         Express 入口（端口 3003）
│       ├── db.js             pg 连接池
│       ├── init-db.js        一键初始化数据库脚本
│       └── routes/
│           ├── auth.js       注册 / 登录 / 我的信息
│           ├── articles.js   文章列表 / 分类 / 搜索 / 详情
│           └── bookmarks.js  收藏列表 / 加收藏 / 取消收藏
├── frontend/                 前端应用
│   ├── package.json
│   ├── vite.config.js        开发端口 5173，/api 代理到 3003
│   ├── index.html
│   └── src/
│       ├── main.jsx          React 挂载入口
│       ├── App.jsx           路由 + 底部导航
│       ├── api.js            fetch 封装 + token 管理
│       ├── index.css         全局样式
│       └── pages/
│           ├── Login.jsx     登录 / 注册
│           ├── Discover.jsx  发现（列表 + 分类）
│           ├── Search.jsx    搜索
│           ├── Article.jsx   文章详情 + 收藏
│           └── Profile.jsx   我的（收藏 + 退出）
├── README.md
└── .gitignore
```

## 运行拓扑

```
浏览器 → 前端 Vite (5173) ──代理 /api──→ 后端 Express (3003) ──pg──→ openGauss (192.168.159.134:7654)
```

- 前端、后端可跑在同一台机器（开发机 / 宿主机）
- 数据库跑在独立的 openEuler 虚拟机（openGauss），走 TCP 7654 端口

## 环境要求

- Node.js 18+（开发时使用 v24）
- npm 9+
- openGauss 2.1+（或任意 PostgreSQL 兼容数据库）

## 部署运行

### 1. 准备数据库（openGauss）

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

### 2. 初始化表结构和种子数据

```bash
cd backend
npm install
copy .env.example .env    # 按实际环境修改数据库连接信息
npm run init-db           # 建 users / articles / bookmarks 三张表 + 10 篇种子文章
```

`.env` 示例：

```
DB_HOST=192.168.159.134
DB_PORT=7654
DB_NAME=aiapp
DB_USER=appuser
DB_PASSWORD=Secure@2026
JWT_SECRET=ai-app-secret-2026
PORT=3003
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

## API 接口

| 方法 | 路径 | 说明 | 鉴权 |
|---|---|---|---|
| POST | /api/auth/register | 注册（username/password/nickname） | 否 |
| POST | /api/auth/login | 登录 | 否 |
| GET | /api/auth/me | 获取当前用户 | 是 |
| GET | /api/articles | 文章列表（支持 category 分页） | 否 |
| GET | /api/articles/categories | 全部分类 | 否 |
| GET | /api/articles/search?q= | 搜索文章 | 否 |
| GET | /api/articles/:id | 文章详情 | 否 |
| GET | /api/bookmarks | 我的收藏列表 | 是 |
| GET | /api/bookmarks/check/:articleId | 是否已收藏 | 是 |
| POST | /api/bookmarks | 加收藏 | 是 |
| DELETE | /api/bookmarks/:articleId | 取消收藏 | 是 |

鉴权方式：请求头 `Authorization: Bearer <token>`。

## 数据库表

| 表 | 字段 |
|---|---|
| users | id, username(唯一), password(bcrypt), nickname, created_at |
| articles | id, title, summary, content, category, read_time, created_at |
| bookmarks | id, user_id, article_id, created_at（user_id + article_id 唯一） |

种子数据：10 篇 AI 方向文章（大模型基础 / 架构原理 / 提示工程 / AI 安全 / 应用实践）。
