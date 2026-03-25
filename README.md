<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# AI 知识库应用

这是一个前后端一体的AI知识库应用，提供AI相关知识的浏览、搜索、收藏、学习进度跟踪、文章上传和管理功能。

## 项目概述

- **前端**：使用React 19、TypeScript、Tailwind CSS和Lucide React构建
- **后端**：使用Express.js、TypeScript和Supabase构建
- **数据库**：使用Supabase (PostgreSQL)
- **管理员功能**：文章管理、状态审核、批量操作等

## 技术栈

### 前端
- React 19
- TypeScript
- Tailwind CSS
- Lucide React
- Vite
- Motion React (动画效果)

### 后端
- Express.js
- TypeScript
- Supabase
- JWT认证

## 项目结构

```
AI_APP/
├── src/              # 前端代码
│   ├── services/     # API服务封装
│   ├── App.tsx       # 主应用组件
│   └── main.tsx      # 应用入口
├── backend/          # 后端代码
│   ├── config/       # 配置文件
│   ├── routes/       # API路由
│   ├── migrations/   # 数据库迁移文件
│   └── server.ts     # 后端服务器
├── .env.example      # 环境变量示例
└── README.md         # 项目说明
```

## 运行步骤

### 前端

**前置条件:** Node.js

1. 安装依赖:
   ```bash
   npm install
   ```
2. 设置环境变量:
   - 复制 `.env.example` 文件为 `.env.local`
   - 设置 `GEMINI_API_KEY` 为你的Gemini API密钥
3. 运行应用:
   ```bash
   npm run dev
   ```
   前端默认运行在 `http://localhost:3002`

### 后端

1. 进入后端目录:
   ```bash
   cd backend
   ```
2. 安装依赖:
   ```bash
   npm install
   ```
3. 设置环境变量:
   - 复制 `.env.example` 文件为 `.env`
   - 配置Supabase连接信息（可选，默认使用模拟数据）
4. 运行后端服务:
   ```bash
   npm run dev
   ```
   后端默认运行在 `http://localhost:3003`

## 环境变量配置

### 前端 (.env.local)

```
# Gemini API密钥
GEMINI_API_KEY="your-gemini-api-key"

# 应用URL
APP_URL="http://localhost:3000"
```

### 后端 (.env)

```
# Supabase配置
SUPABASE_URL="https://your-project-id.supabase.co"
SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# JWT配置
JWT_SECRET="your-jwt-secret-key"
JWT_EXPIRES_IN="24h"

# 服务器配置
PORT=3003
NODE_ENV="development"
```

## API文档

### 认证API
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `GET /api/auth/me` - 获取当前用户信息

### 文章API
- `GET /api/articles` - 获取文章列表
- `GET /api/articles/:id` - 获取文章详情
- `GET /api/articles/search` - 搜索文章
- `POST /api/articles` - 创建文章
- `PUT /api/articles/:id` - 更新文章
- `DELETE /api/articles/:id` - 删除文章

### 分类API
- `GET /api/categories` - 获取分类列表
- `GET /api/categories/:id` - 获取分类详情

### 用户API
- `GET /api/users/profile` - 获取用户资料
- `PUT /api/users/profile` - 更新用户资料
- `PUT /api/users/preferences` - 更新用户偏好设置
- `GET /api/users/bookmarks` - 获取用户收藏
- `POST /api/users/bookmarks` - 添加收藏
- `DELETE /api/users/bookmarks/:id` - 删除收藏
- `GET /api/users/progress` - 获取用户阅读进度
- `POST /api/users/progress` - 更新阅读进度

### 管理员API
- `POST /api/admin/login` - 管理员登录
- `GET /api/admin/articles` - 获取所有文章（包括待审核）
- `PUT /api/admin/articles/:id/status` - 更新文章状态
- `PUT /api/admin/articles/:id` - 编辑文章
- `DELETE /api/admin/articles/:id` - 删除文章

## 注意事项

- 后端服务默认运行在 `http://localhost:3003`
- 前端应用默认运行在 `http://localhost:3002`
- 如果未配置Supabase，后端会使用模拟数据
- 模拟用户凭据：
  - 邮箱: user@example.com
  - 密码: password123
- 管理员登录凭据：
  - 密码: admin123