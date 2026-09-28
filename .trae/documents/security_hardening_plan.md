# 项目安全加固计划（上架安卓市场前）

> 静态审计对象：backend（Node/Express/pg/JWT）。依赖 `npm audit` 0 漏洞；`.env` 已被 git 忽略（无已提交的密钥泄露）。
> 目标：修复后达到「公网可访问 + 移动 WebView 内嵌」的基本安全水位。

## 审计结论速览

| 等级 | 数量 | 说明 |
|---|---|---|
| 严重 | 1 | 可被猜解的密钥导致账户接管 |
| 高危 | 4 | 暴力破解、CORS 放开、缺失安全头、输入校验缺口 |
| 中危 | 5 | 长 token、密码策略、TLS 校验关闭等 |
| 低危 | 2 | 无请求体限制、错误日志 |

---

## 严重 / Critical

### C1. JWT 密钥强度不足 → 可伪造任意用户 token
- **位置**：`backend/.env` 的 `JWT_SECRET=ai-app-secret-2026`
- **风险**：该密钥是可预测的弱字符串。攻击者一旦猜到（或源码/环境泄露），就能用 `jwt.sign({id:任意用户})` 伪造 token，读取/篡改任意用户的收藏等数据，构成完整账户接管。上公网/安卓市场后这是致命项。
- **修复**：
  1. 用随机生成器生成 32+ 字节强密钥（`crypto.randomBytes(48).toString('base64url')`），替换 `.env` 的 `JWT_SECRET`，并在 `.env.example` 里留空占位提示。
  2. 启动时校验：若 `JWT_SECRET` 为空或等于默认值/长度不足，后端拒绝启动。
  3. 同步轮换后旧 token 全部失效（用户需重新登录）。

---

## 高危 / High

### H1. 登录/注册接口无限流 → 暴力破解与撞库
- **位置**：`backend/src/routes/auth.js` 的 `/login`、`/register`
- **风险**：无任何速率限制，攻击者可对 `/login` 高频尝试密码（撞库/爆破），或批量注册。
- **修复**：引入 `express-rate-limit`，对 `/api/auth` 设严格限流（如 同一 IP 5 分钟 10 次），超限返回 429。登录失败不区分「用户不存在/密码错」（当前已一致，保持）。

### H2. CORS 全开放 `app.use(cors())`
- **位置**：`backend/src/server.js:18`
- **风险**：任意网站都可跨域调用本 API。配合 localStorage 里的 Bearer token，第三方页面可发起带凭证的请求。
- **修复**：白名单化 origin——只允许前端域名（开发期 `http://localhost:5173`，生产期你的前端域名）。从环境变量 `CORS_ORIGIN` 读取，未配置时默认仅允许 localhost。

### H3. 缺失安全响应头（无 helmet）
- **位置**：`backend/src/server.js`
- **风险**：缺 `X-Content-Type-Options`、`X-Frame-Options`/CSP frame-ancestors（点击劫持）、HSTS 等。WebView/浏览器内嵌场景下点击劫持风险。
- **修复**：引入 `helmet`，配置基础安全头（关闭过严的 CSP 以免破坏前端，保留 nosniff / frameguard / hidePoweredBy）。

### H4. 收藏接口 `articleId` 未做数字校验 → 不一致的输入校验
- **位置**：`backend/src/routes/bookmarks.js` 的 `/check/:articleId`、`DELETE /:articleId`、`POST /` 的 `article_id`
- **风险**：其他路由的 `:id` 都做了 `/^\d+$/` 校验，唯独这几处没有。非数字会落到 DB 报错（500 信息泄露）或行为不确定。
- **修复**：给这三处补上与 articles.js 一致的数字校验（非法返 400）。

---

## 中危 / Medium

### M1. JWT 有效期 7 天且无轮换
- **位置**：`auth.js` 签发 `expiresIn: '7d'`
- **风险**：token 一旦泄露，7 天内持续有效。
- **修复**：缩短到 2 天；可选增加「修改密码/退出全部设备」失效机制（本期可只缩短有效期）。

### M2. 无密码强度策略
- **位置**：`auth.js /register`
- **风险**：允许 1 位弱密码。
- **修复**：注册时校验密码长度 ≥ 6（最小），用户名长度 3–20。

### M3. DB 连接关闭 TLS 证书校验
- **位置**：`backend/src/db.js:11` `ssl: { rejectUnauthorized: false }`
- **风险**：公网访问 Neon 时不校验证书，存在中间人风险。
- **修复**：改为 `ssl: { rejectUnauthorized: true }`（Neon 证书合法，可正常校验）。

### M4. `/api/news/sync` 的 token 走 query string
- **位置**：`server.js` 的 `req.query.token`
- **风险**：token 会出现在访问日志/历史里。
- **修复**：统一改为 Header（`Authorization: Bearer`），兼容保留 query 一段时间并记录弃用日志。

### M5. 用户名枚举（注册接口明确返回「用户名已存在」）
- **位置**：`auth.js /register`
- **风险**：可探测哪些用户名已注册。
- **修复**：改为统一提示「注册失败，请稍后重试」或保留但加 H1 限流缓解（本期与 H1 一并处理即可，可暂不改文案）。

---

## 低危 / Low

### L1. 无请求体大小限制 → 大体量 DoS
- **修复**：`express.json({ limit: '64kb' })`。

### L2. 全局错误处理器打印完整 err 到控制台
- **修复**：生产环境仅打印 message，避免堆栈/敏感信息落日志。

---

## 执行顺序（按等级从高到低，逐步修复 + 验证）

1. **C1 强密钥**：生成新 JWT_SECRET → 改 `.env`/`.env.example` → 加启动校验 → 重启验证登录仍正常（旧 token 失效可接受）。
2. **H1 限流**：装 `express-rate-limit` → auth 路由加 429 限流 → curl 压测验证。
3. **H2 CORS 白名单**：改 `cors()` 为 origin 白名单 → 前后端联调验证。
4. **H3 helmet 安全头**：装 helmet → 配置基础头 → 浏览器检查响应头。
5. **H4 输入校验补齐**：bookmarks 三处加数字校验 → 非法参数返 400。
6. **中低危批量**：M1 缩短有效期 / M2 密码策略 / M3 TLS 校验 / M4 header token / L1 请求体限制 / L2 日志收敛。
7. 全量回归：`npx vite build` + 关键接口冒烟（注册/登录/收藏/各列表）。

## 注意
- 以上只动后端代码与 `.env`；不碰数据库结构、不改前端交互逻辑。
- 密钥轮换会让现有登录态失效，属预期。
