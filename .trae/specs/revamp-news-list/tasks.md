# Tasks

- [x] Task 1: 抽出纯函数工具（相对时间 / 来源分级 / 本地存储）
  - [x] SubTask 1.1: 在 `News.jsx` 内实现 `relativeTime(publishedAt)`，覆盖 刚刚 / x 分钟前 / x 小时前 / 昨天 / M月d日 / 空值 / 未来时间 六种情况，按**自然日**判定昨天
  - [x] SubTask 1.2: 实现 `sourceTone(source)`，把 5 个现有源（量子位、雷峰网、AIbase、AIbase日报、智源社区）映射到单色体系分级档位，未知源落 `tone-neutral`
  - [x] SubTask 1.3: 实现安全的 localStorage 读写封装（读取失败/写入失败/JSON 解析失败一律静默降级），键名：`ai_app_news_read`、`ai_app_news_fav`、`ai_app_news_cache`

- [x] Task 2: 改造列表项展示（chip + 相对时间 + 标题截断 + 中文标题兼容）
  - [x] SubTask 2.1: 来源改用 `span.news-chip.news-chip-<tone>`，移除现有的 `.tag` 用法
  - [x] SubTask 2.2: 时间改用 `relativeTime()`，并给时间节点加 `title` 属性显示完整日期时间
  - [x] SubTask 2.3: 标题加 `className="news-item-title"`，原生 `title={完整标题}` 承载 tooltip
  - [x] SubTask 2.4: 当 `n.title_zh` 存在时，主标题用 `title_zh`，并把原 `title` 渲染为小字灰色副行 `p.news-item-subtitle`
  - [x] SubTask 2.5: `index.css` 新增 `.news-chip*`、`.news-item-title`（两行 `-webkit-line-clamp` + 标准 `line-clamp`）、`.news-item-subtitle` 样式，全部走 CSS 变量

- [x] Task 3: 已读与收藏交互
  - [x] SubTask 3.1: 进入页面时从 localStorage 载入已读 id 集合与收藏 id 集合
  - [x] SubTask 3.2: 整卡 `Link` 的 `onClick` 写入已读集合；已读条目加 `news-item-read` 类，标题与副标题透明度降至约 50%
  - [x] SubTask 3.3: 条目内新增收藏按钮 `button.news-fav`（Phosphor `BookmarkSimple`，Regular/Fill 双状态），`aria-label` 随状态切换
  - [x] SubTask 3.4: 收藏按钮 `onClick` 调 `preventDefault()` + `stopPropagation()`，避免触发整卡跳转，并切换持久化状态
  - [x] SubTask 3.5: `index.css` 新增 `.news-fav` 样式，默认隐藏，hover/focus-visible 显示；hover 规则包在 `@media (hover: hover) and (pointer: fine)` 内

- [x] Task 4: 请求失败降级与缓存标注
  - [x] SubTask 4.1: 请求成功后写入 `ai_app_news_cache`（含 `at` 时间戳与列表数据）
  - [x] SubTask 4.2: 请求失败或返回空且存在缓存时，渲染缓存并设置 `stale` 状态；无缓存时保留现有错误提示
  - [x] SubTask 4.3: 新增 `span.news-stale`（模块角落标注「更新于 x 天前」，当天显示「更新于今天」），并在 `index.css` 补样式

- [x] Task 5: 构建与自查
  - [x] SubTask 5.1: 运行 `cd frontend && npx vite build`，确认无报错
  - [x] SubTask 5.2: 核查新增 className 在 CSS 中无缺失、无裸色值、未加载网络字体
  - [x] SubTask 5.3: 浏览器 DOM 断言校验（不依赖截图）：chip 类名与计算色值、时间文本、标题 `line-clamp`、收藏按钮 hover 可见、已读透明度

- [x] Task 6: 修复验证阶段发现的缺陷
  - [x] SubTask 6.1: 修复已读状态未持久化 —— `writeArray` 原先写在 `setReadIds` 的 updater 内，整卡点击跳转导致组件卸载、updater 永不执行；改为在点击处理器内同步写入
  - [x] SubTask 6.2: 修复 chip 区分度不足 —— `tone-2` 改用 `--accent-tint` 描边 + `--text-2` 文字，`tone-neutral` 改用 `--sunken` 底 + `--line-strong` 描边

# Task Dependencies

- Task 2 依赖 Task 1（使用其纯函数与存储封装）
- Task 3 依赖 Task 1；Task 3 与 Task 2 共享同一列表项结构，需在 Task 2 之后进行
- Task 4 依赖 Task 1 的存储封装，可与 Task 2 / Task 3 并行
- Task 5 依赖 Task 2、Task 3、Task 4 全部完成
- Task 6 依赖 Task 5 的验证结论
