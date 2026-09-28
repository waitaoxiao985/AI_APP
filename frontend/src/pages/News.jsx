import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CaretLeft, Clock, Newspaper, BookmarkSimple } from '@phosphor-icons/react'
import { getNews } from '../api.js'

const READ_KEY = 'ai_app_news_read'
const FAV_KEY = 'ai_app_news_fav'
const CACHE_KEY = 'ai_app_news_cache'

// 已知来源到单色体系分级的映射；AIbase 与 AIbase日报 是两个独立的源，需分别登记
const SOURCE_TONES = {
  量子位: 'tone-1',
  雷峰网: 'tone-2',
  AIbase: 'tone-3',
  AIbase日报: 'tone-4',
  智源社区: 'tone-5'
}

function sourceTone(source) {
  return SOURCE_TONES[source] || 'tone-neutral'
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

// 相对时间：空值/非法返回 ''；按自然日判定「昨天」
function relativeTime(publishedAt) {
  if (!publishedAt) return ''
  const date = new Date(publishedAt)
  if (Number.isNaN(date.getTime())) return ''
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minute = 60 * 1000
  const hour = 60 * minute
  if (diff < minute) return '刚刚'
  if (diff < hour) return Math.floor(diff / minute) + ' 分钟前'
  const dayDiff = Math.round((startOfDay(now) - startOfDay(date)) / (24 * hour))
  if (dayDiff <= 0) return Math.floor(diff / hour) + ' 小时前'
  if (dayDiff === 1) return '昨天'
  return date.getMonth() + 1 + '月' + date.getDate() + '日'
}

// 缓存标注：不足 1 个自然日显示「更新于今天」
function staleLabel(at) {
  const then = new Date(at)
  if (Number.isNaN(then.getTime())) return '更新于今天'
  const dayDiff = Math.round((startOfDay(new Date()) - startOfDay(then)) / (24 * 60 * 60 * 1000))
  if (dayDiff < 1) return '更新于今天'
  return '更新于 ' + dayDiff + ' 天前'
}

// ---- 本地存储：任何异常一律静默降级 ----

function readArray(key) {
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.map(String) : []
  } catch {
    return []
  }
}

function writeArray(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* 存储不可用时忽略 */
  }
}

function readCache() {
  try {
    const raw = window.localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || !Array.isArray(parsed.news) || parsed.news.length === 0) return null
    return parsed
  } catch {
    return null
  }
}

function writeCache(news, total) {
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), news, total }))
  } catch {
    /* 存储不可用时忽略 */
  }
}

// 列表按发布时间倒序，取最新一条的日期作为页面日期；无日期数据时回落到今天
function latestDate(items) {
  const withDate = items.find((n) => n.published_at)
  return new Date(withDate ? withDate.published_at : Date.now()).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

export default function News() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')
  const [reload, setReload] = useState(0)
  const [stale, setStale] = useState('')
  const [readIds, setReadIds] = useState(() => new Set(readArray(READ_KEY)))
  const [favIds, setFavIds] = useState(() => new Set(readArray(FAV_KEY)))
  const itemsRef = React.useRef([])
  const sentinelRef = React.useRef(null)

  useEffect(() => {
    let alive = true
    setError('')
    setStale('')
    // 有缓存立即显示，不等网络；后台静默刷新
    const cached = readCache()
    if (cached && cached.news.length > 0) {
      setItems(cached.news)
      itemsRef.current = cached.news
      setTotal(cached.total || cached.news.length)
      setLoading(false)
    } else {
      setLoading(true)
    }

    getNews(20, 0)
      .then((data) => {
        if (!alive) return
        const list = Array.isArray(data.news) ? data.news : []
        if (list.length > 0) {
          setItems(list)
          itemsRef.current = list
          setTotal(data.total || list.length)
          writeCache(list, data.total || list.length)
        } else if (!cached) {
          setItems([])
        }
        setLoading(false)
      })
      .catch((err) => {
        if (!alive) return
        if (!cached) {
          setError(err.message || '快讯加载失败')
          setLoading(false)
        }
      })
    return () => {
      alive = false
    }
  }, [reload])

  // 滚动到底加载下一页
  const loadMore = React.useCallback(() => {
    if (loadingMore || loading) return
    const cur = itemsRef.current
    if (cur.length >= total) return
    setLoadingMore(true)
    getNews(20, cur.length)
      .then((data) => {
        const merged = cur.concat(Array.isArray(data.news) ? data.news : [])
        itemsRef.current = merged
        setItems(merged)
        setLoadingMore(false)
      })
      .catch(() => setLoadingMore(false))
  }, [loadingMore, loading, total])

  React.useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore()
      },
      { rootMargin: '400px 0px' }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [loadMore, items.length])

  // 注意：写入必须同步发生——点击整卡会立即路由跳转并卸载本组件，
  // 放在 setState 的 updater 里会因组件卸载而永远不执行
  function markRead(id) {
    const key = String(id)
    if (readIds.has(key)) return
    const next = new Set(readIds)
    next.add(key)
    setReadIds(next)
    writeArray(READ_KEY, Array.from(next))
  }

  function toggleFav(e, id) {
    e.preventDefault()
    e.stopPropagation()
    const key = String(id)
    setFavIds((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      writeArray(FAV_KEY, Array.from(next))
      return next
    })
  }

  return (
    <div className="page news-page">
      <div className="detail-bar">
        <button className="icon-btn" onClick={() => navigate(-1)} aria-label="返回">
          <CaretLeft size={20} />
        </button>
        <span className="detail-bar-title">{latestDate(items)}</span>
      </div>

      <header className="page-head">
        <h1 className="page-title">AI 快讯</h1>
        <p className="page-sub">每日自动聚合的行业动态</p>
      </header>

      {stale && <p className="news-stale">{stale}</p>}

      {error && (
        <div className="error enter" role="alert">
          {error}
          <div className="error-actions">
            <button className="btn-text" onClick={() => setReload((r) => r + 1)}>
              重新加载
            </button>
          </div>
        </div>
      )}

      {loading && (
        <div aria-hidden="true">
          {[0, 1, 2, 3].map((i) => (
            <div className="sk-row" key={i} style={{ display: 'block' }}>
              <div className="sk-lines">
                <div className="sk sk-line w-30" />
                <div className="sk sk-line w-90" />
                <div className="sk sk-line w-68" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="empty enter">
          <div className="empty-art" aria-hidden="true">
            <Newspaper size={23} />
          </div>
          <p className="empty-title">暂无快讯</p>
          <p className="empty-copy">定时采集完成后会自动出现在这里。</p>
        </div>
      )}

      {!loading && !error && (
        <section className="row-list" aria-label="快讯列表">
          {items.map((n, i) => {
            const time = relativeTime(n.published_at)
            const read = readIds.has(String(n.id))
            const fav = favIds.has(String(n.id))
            return (
              <div className="news-row" key={n.id}>
                <Link
                  className={'news-item enter' + (read ? ' news-item-read' : '')}
                  style={{ '--i': i }}
                  to={'/news/' + n.id}
                  onClick={() => markRead(n.id)}
                >
                  <div className="news-item-top">
                    <span className={'news-chip news-chip-' + sourceTone(n.source)}>{n.source}</span>
                    {time && (
                      <span className="news-time" title={new Date(n.published_at).toLocaleString('zh-CN')}>
                        <Clock size={11} />
                        {time}
                      </span>
                    )}
                  </div>
                  {n.title_zh ? (
                    <>
                      <h3 className="news-item-title" title={n.title_zh}>
                        {n.title_zh}
                      </h3>
                      <p className="news-item-subtitle">{n.title}</p>
                    </>
                  ) : (
                    <h3 className="news-item-title" title={n.title}>
                      {n.title}
                    </h3>
                  )}
                  {n.summary && n.summary.trim().length >= 8 && <p>{n.summary}</p>}
                </Link>
                <button
                  type="button"
                  className="news-fav"
                  onClick={(e) => toggleFav(e, n.id)}
                  aria-label={fav ? '取消收藏' : '收藏'}
                  aria-pressed={fav}
                >
                  <BookmarkSimple size={16} weight={fav ? 'fill' : 'regular'} />
                </button>
              </div>
            )
          })}
          {items.length < total && (
            <div ref={sentinelRef} className="news-load-more">
              {loadingMore ? '加载中…' : '下滑加载更多'}
            </div>
          )}
        </section>
      )}
    </div>
  )
}
