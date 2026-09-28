# Checklist

- [x] 快讯条目的时间不再显示完整日期，而是按 刚刚 / x 分钟前 / x 小时前 / 昨天 / M月d日 渲染
- [x] 时间节点的判定基于自然日（跨天即「昨天」），而非简单的 24 小时差
- [x] `published_at` 为空或非法时不渲染时间节点，页面不报错
- [x] 来源渲染为圆角 chip，且颜色全部来自 CSS 变量，`index.css` 中未新增游离色值
- [x] chip 配色保持在深蓝单色体系内（未引入橙色等第二色相）
- [x] chip 的视觉权重明显低于标题（字号/对比度/背景强度）
- [x] 未知来源命中中性兜底样式，不报错
- [x] 标题最多两行，超出以省略号截断
- [x] 标题元素带 `title` 属性，可看到完整标题
- [x] 当数据不含 `title_zh` 时，渲染结果与改造前一致，无空行、无报错
- [x] 当数据含 `title_zh` 时，中文为主标题、英文原题以小字灰色副行显示
- [x] 整条新闻卡片仍是可点击区域（不只是标题文字），点击进入站内详情页 `/news/:id`
- [x] 详情页「阅读原文」外链保持 `target="_blank"` 与 `rel="noopener noreferrer"`
- [x] 点击过的条目 id 写入 localStorage，且刷新后已读状态仍生效
- [x] 已读条目标题透明度降到约 50%
- [x] localStorage 不可用时页面正常渲染，不抛错
- [x] 指针悬停（`hover: hover` + `pointer: fine`）或键盘聚焦时，条目右侧出现收藏按钮
- [x] 点击收藏按钮可切换收藏状态并持久化，且不会触发卡片跳转
- [x] 已收藏条目图标为 Fill 状态，未收藏为 Regular 状态
- [x] 收藏按钮具备 `:focus-visible` 样式，键盘可达
- [x] 请求成功时写入本地缓存
- [x] 请求失败或返回空且存在缓存时，渲染缓存数据且不显示空白或错误
- [x] 使用缓存时在模块角落显示「更新于 x 天前」
- [x] 请求失败且无缓存时，仍显示原有错误提示与「重新加载」按钮
- [x] `npx vite build` 通过，无报错
- [x] 新增 className 均已在 `index.css` 中定义，无缺失、无死 CSS
- [x] 首页 `Discover.jsx`、`NewsToday.jsx`、`NewsDetail.jsx` 与后端接口未被改动
- [x] 未引入网络字体，未新增禁用特效（粒子/3D/噪点等）

## 验证记录

- 构建：`npx vite build`（vite v5.4.21）通过，4592 模块，无报错
- 浏览器 DOM 断言（Chromium，非截图）：
  - chip：`news-chip news-chip-tone-3`，`background: rgba(41,119,203,0.14)`、`border-radius: 999px`、`font-size: 10px`；5 个来源计算样式各不相同
  - 标题：`-webkit-line-clamp: 2` + `overflow: hidden`；注入超长标题后 `scrollHeight 163 > clientHeight 47`，确认两行截断生效
  - 相对时间：渲染为「x 小时前」，`.news-time` 的 `title` 承载完整日期时间
  - 已读：点击整卡 → `ai_app_news_read` 写入 `["15"]` → 返回列表 `.news-item-read` 生效、标题 `opacity: 0.5` → 刷新后仍保留
  - 收藏：点击不跳转，`ai_app_news_fav` 在 `["15"]` 与 `[]` 间正确切换
  - 收藏按钮可见性：悬停后计算样式 `opacity: 1`、`pointer-events: auto`；键盘聚焦（`:focus-within`）路径同样为 `opacity: 1`
  - 降级：模拟接口失败（fetch 拒绝）后重新进入路由，列表渲染缓存 50 条、`.news-stale` 出现、`.error` 为 0；缓存时间戳改为 3 天前时文案为「更新于 3 天前」
- 局限说明：
  - 本环境自动化浏览器的合成 hover 无法稳定反映到 `element.matches(':hover')`，故 hover 可见性以「悬停后计算样式 opacity/pointer-events」与「CSSOM 中 `@media (hover: hover) and (pointer: fine)` 规则存在且媒体查询匹配」共同判定
  - `title_zh` 分支因真实接口尚无该字段，未能在真实数据上端到端触发；已通过「无该字段时渲染不报错」的端到端验证 + 代码分支核对确认
