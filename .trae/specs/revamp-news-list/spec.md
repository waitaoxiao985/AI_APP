# 快讯列表展示与交互改造 Spec

## Why

AI 快讯列表页（`/news`）当前每个条目只渲染「来源标签 + 标题 + 完整日期」，信息密度低、时间不直观、来源与标题视觉权重接近，且没有已读/收藏/离线降级能力。本次把这些列表项的展示与交互补齐，让用户能快速判断「这条新闻有多新、来自哪里、我读没读过」。

**与原始需求的偏差点（已与用户确认）**：

1. 需求描述的是「首页 AI 快讯模块」，但首页（`Discover.jsx`）现在只有一张跳转卡片 `ModuleCard → /news`，**并没有新闻列表**。真正渲染列表的是 `/news`（`News.jsx`）。经确认，本次**只改造 `/news` 页面**，首页卡片与其余模块一律不动。
2. 需求提到「Hacker News 橙色系、InfoQ 蓝色系」，但这两个源**已不在快讯源清单中**（现为 量子位 / 雷峰网 / AIbase / AIbase日报 / 智源社区）。经确认，来源 chip **不引入第二色相**，改在深蓝单色体系内用明度/透明度分级。
3. 需求要求「所有快讯链接 `target="_blank"` 新标签打开」，但这会让站内详情页（含 RSSHub 抓取的全文）无法从列表进入。经确认，**整卡点击仍进站内详情页 `/news/:id`**；详情页已有的「阅读原文」外链保持 `_blank` + `noopener noreferrer`。

## What Changes

- `News.jsx` 列表项：时间改为相对时间；来源改为单色系 chip；标题两行截断 + 原生 `title` tooltip；兼容可选的 `title_zh` 字段
- `News.jsx` 新增状态能力：已读（localStorage）、收藏（localStorage，项目现有收藏仅支持文章，无快讯收藏接口）
- `News.jsx` 新增离线降级：请求成功写缓存，失败/空时读缓存展示并标注「更新于 x 天前」
- `index.css`：新增 chip / 相对时间 / 标题截断 / 收藏按钮 / 降级标注 / 已读态样式，全部走 CSS 变量
- 后端接口、其他页面、首页模块卡片**均不改动**

## Impact

- Affected specs: 快讯列表页展示与交互（新增能力，无既有 spec 依赖）
- Affected code:
  - `frontend/src/pages/News.jsx`（主要改动）
  - `frontend/src/index.css`（新增样式）
  - `frontend/src/api.js`（只读使用 `getNews`，不改）
  - `frontend/src/pages/NewsToday.jsx`、`frontend/src/pages/NewsDetail.jsx`、`frontend/src/pages/Discover.jsx`：**不改动**

## ADDED Requirements

### Requirement: 相对时间显示

列表项 SHALL 用相对时间替代完整日期，且不再重复显示完整日期。

#### Scenario: 分钟级
- **WHEN** `published_at` 距今不足 60 分钟
- **THEN** 显示「刚刚」（不足 1 分钟）或「x 分钟前」

#### Scenario: 当天小时级
- **WHEN** `published_at` 与当前时间是同一个自然日，且距今超过 1 小时
- **THEN** 显示「x 小时前」

#### Scenario: 昨天
- **WHEN** `published_at` 落在当前时间的**前一个自然日**
- **THEN** 显示「昨天」

#### Scenario: 更早
- **WHEN** `published_at` 早于昨天
- **THEN** 显示「M月d日」（不显示年份）

#### Scenario: 缺失时间
- **WHEN** `published_at` 为空或非法
- **THEN** 不渲染时间节点，不报错

#### Scenario: 未来时间
- **WHEN** `published_at` 晚于当前时间（源站时间偏差）
- **THEN** 按「刚刚」处理，不出现负数

### Requirement: 来源 chip

来源 SHALL 以圆角 chip 徽章渲染，且其视觉权重明显低于标题。

#### Scenario: 单色系分级
- **WHEN** 渲染任一条目的来源
- **THEN** chip 使用深蓝单色体系内的颜色（不同源用不同明度/透明度/描边强度区分），颜色只引用 `index.css` 的 CSS 变量，不出现裸色值

#### Scenario: 未知来源兜底
- **WHEN** 来源名不在已知映射表中
- **THEN** 使用中性兜底样式，不报错

### Requirement: 标题两行截断与完整标题提示

标题 SHALL 最多显示两行，超出以省略号截断。

#### Scenario: 超长标题
- **WHEN** 标题超过两行
- **THEN** 视觉上截断为两行并显示省略号，且该元素带 `title` 属性承载完整标题

#### Scenario: 短标题
- **WHEN** 标题不超过两行
- **THEN** 正常完整显示，行为与现状一致

### Requirement: 中文标题兼容

#### Scenario: 存在中文字段
- **WHEN** 条目包含 `title_zh`（当前接口不返回该字段）
- **THEN** 中文标题作为主标题，英文原题以小字灰色副行显示

#### Scenario: 不存在中文字段
- **WHEN** 条目不包含 `title_zh`
- **THEN** 按现有 `title` 正常渲染，不报错、不出现空行

### Requirement: 已读标记

#### Scenario: 点击标记已读
- **WHEN** 用户点击某条目（整卡可点，跳转站内详情页 `/news/:id`）
- **THEN** 该条目 id 写入 localStorage，卡片回到列表时标题透明度降至约 50%

#### Scenario: 已读持久化
- **WHEN** 用户刷新页面或重新进入 `/news`
- **THEN** 已读状态从 localStorage 恢复

#### Scenario: 存储不可用
- **WHEN** localStorage 读取/写入失败（隐私模式等）
- **THEN** 忽略异常，页面正常渲染，不报错

### Requirement: 快讯收藏（localStorage）

#### Scenario: hover 显示收藏按钮
- **WHEN** 指针悬停在条目上（仅 `hover: hover` 且 `pointer: fine` 设备）或条目获得键盘焦点
- **THEN** 条目右侧出现收藏图标按钮

#### Scenario: 切换收藏
- **WHEN** 用户点击收藏按钮
- **THEN** 切换该条目的收藏状态并持久化到 localStorage，且**不触发**整卡跳转

#### Scenario: 收藏态视觉
- **WHEN** 条目处于已收藏状态
- **THEN** 图标切换为 Fill 状态以示区分

### Requirement: 请求失败降级与缓存标注

#### Scenario: 请求成功
- **WHEN** `/api/news` 返回成功
- **THEN** 列表正常渲染，并把数据与写入时间缓存到 localStorage

#### Scenario: 请求失败或返回空
- **WHEN** 接口失败，或返回的列表为空，且本地存在缓存
- **THEN** 渲染缓存数据，不显示错误提示也不显示空白，并在模块角落标注「更新于 x 天前」

#### Scenario: 无缓存可用
- **WHEN** 接口失败且本地无缓存
- **THEN** 保留现有的错误提示与「重新加载」按钮

## MODIFIED Requirements

### Requirement: 快讯列表项

**原行为**：每个条目是整卡 `Link` 到 `/news/:id`，顶部一行渲染 `<span class="tag">{source}</span>` 与 `<span class="news-time">Clock 图标 + toLocaleDateString('zh-CN')</span>`，其下是标题与摘要。

**新行为**：整卡仍为 `Link` 到 `/news/:id`；来源改为单色系 chip；时间改为相对时间；标题两行截断并带 `title` 完整提示；标题区在存在 `title_zh` 时增加英文副行；条目右侧新增收藏按钮；已读条目标题降透明度。

## REMOVED Requirements

无。
