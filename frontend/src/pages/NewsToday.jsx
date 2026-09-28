import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Clock, Newspaper, Shield, ChartLineUp, GameController, Scroll, CaretLeft, CaretRight } from '@phosphor-icons/react'
import { getNewsToday } from '../api.js'

const DAY = 24 * 60 * 60 * 1000
const PAGE = 20
const TTL = 5 * 60 * 1000 // 缓存有效期 5 分钟

// 板块展示名 → 接口分类名
const BOARDS = [
  { key: '军事', icon: Shield, category: '军事' },
  { key: '金融', icon: ChartLineUp, category: '财经' },
  { key: '游戏', icon: GameController, category: '游戏' },
  { key: '政治', icon: Scroll, category: '政治' }
]

// 模块级内存缓存：key = 'selectedDate|category'（selectedDate 为 '' 表示「最新」）
// value = { news, total, counts, date, ts }
const cache = new Map()
const cacheKey = (date, cat) => `${date || ''}|${cat}`

function shiftDate(dateStr, delta) {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + delta)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function sameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function groupLabel(date) {
  const now = new Date()
  const d = new Date(date)
  if (sameDay(d, now)) return '今天'
  if (sameDay(d, new Date(now.getTime() - DAY))) return '昨天'
  return d.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })
}

function groupByDate(items) {
  const groups = []
  let current = null
  items.forEach((n) => {
    const ts = n.published_at ? new Date(n.published_at).getTime() : null
    const sameBucket =
      current &&
      ((ts === null && current.date === null) ||
        (ts !== null && current.date !== null && sameDay(new Date(ts), new Date(current.date))))
    if (sameBucket) {
      current.items.push(n)
    } else {
      current = { label: ts === null ? '其他' : groupLabel(ts), date: ts, items: [n] }
      groups.push(current)
    }
  })
  return groups
}

export default function NewsToday() {
  const [active, setActive] = useState('军事')
  const [selectedDate, setSelectedDate] = useState('') // '' = 最新有数据日
  const [curDate, setCurDate] = useState(null)
  const [news, setNews] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')
  const [reload, setReload] = useState(0)

  const aliveRef = useRef(true)
  const sentinelRef = useRef(null)
  const board = BOARDS.find((b) => b.key === active) || BOARDS[0]
  const cat = board.category
  // 已知具体日期后直接带日期请求，省去后端 MAX(date) 往返
  const reqDate = selectedDate || curDate || ''

  const apply = useCallback((hit) => {
    setNews(hit.news)
    setTotal(hit.total)
    setCurDate(hit.date)
  }, [])

  const loadPage = useCallback(async (date, category, offset) => {
    return getNewsToday(date || undefined, category, PAGE, offset)
  }, [])

  // 主加载：命中缓存即时显示，过期后台静默刷新，未命中才出骨架屏
  useEffect(() => {
    aliveRef.current = true
    const key = cacheKey(selectedDate, cat)
    const hit = cache.get(key)
    const fresh = hit && Date.now() - hit.ts < TTL

    if (hit) {
      apply(hit)
      setError('')
      setLoading(false)
    } else {
      setLoading(true)
      setError('')
    }

    if (!fresh) {
      loadPage(reqDate, cat, 0)
        .then((data) => {
          if (!aliveRef.current) return
          const entry = {
            news: data.news || [],
            total: data.total || 0,
            counts: data.counts || {},
            date: data.date || null,
            ts: Date.now()
          }
          cache.set(key, entry)
          apply(entry)
          setLoading(false)
        })
        .catch((err) => {
          if (!aliveRef.current) return
          if (!hit) {
            setError(err.message || '今日新闻加载失败')
            setLoading(false)
          }
        })
    }

    // 空闲时预取其余三个分类的第一页
    BOARDS.forEach((b) => {
      if (b.category === cat) return
      const k = cacheKey(selectedDate, b.category)
      const h = cache.get(k)
      if (h && Date.now() - h.ts < TTL) return
      loadPage(reqDate, b.category, 0)
        .then((data) => {
          cache.set(k, {
            news: data.news || [],
            total: data.total || 0,
            counts: data.counts || {},
            date: data.date || null,
            ts: Date.now()
          })
        })
        .catch(() => {})
    })

    return () => {
      aliveRef.current = false
    }
  }, [selectedDate, cat, reload, apply, loadPage])

  // 滚动到底部加载下一页
  const loadMore = useCallback(() => {
    if (loadingMore || loading) return
    const key = cacheKey(selectedDate, cat)
    const hit = cache.get(key)
    if (!hit || hit.news.length >= hit.total) return
    setLoadingMore(true)
    loadPage(reqDate, cat, hit.news.length)
      .then((data) => {
        const merged = hit.news.concat(data.news || [])
        const entry = { ...hit, news: merged, ts: Date.now() }
        cache.set(key, entry)
        apply(entry)
        setLoadingMore(false)
      })
      .catch(() => setLoadingMore(false))
  }, [loadingMore, loading, selectedDate, cat, apply, loadPage])

  useEffect(() => {
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
  }, [loadMore, news.length])

  const groups = groupByDate(news)
  const hasMore = news.length < total

  return (
    <div className="page">
      <header className="page-head">
        <h1 className="page-title">今日新闻</h1>
        <p className="page-sub">点击下方板块，查看对应领域的最新资讯</p>
      </header>

      <div className="board-grid" role="tablist" aria-label="新闻板块">
        {BOARDS.map((b) => {
          const Icon = b.icon
          const isActive = b.key === active
          return (
            <button
              key={b.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={isActive ? 'board-card board-card-active' : 'board-card'}
              onClick={() => setActive(b.key)}
            >
              <Icon size={22} weight={isActive ? 'fill' : 'regular'} />
              <span className="board-card-name">{b.key}</span>
            </button>
          )
        })}
      </div>

      <div className="news-date-bar">
        <button
          type="button"
          className="news-date-btn"
          onClick={() => curDate && setSelectedDate(shiftDate(curDate, -1))}
          aria-label="前一天"
        >
          <CaretLeft size={14} />
        </button>
        <span className="news-date-label">{curDate ? curDate.replaceAll('-', ' / ') : '暂无数据'}</span>
        <button
          type="button"
          className="news-date-btn"
          onClick={() => {
            if (!curDate) return
            const next = shiftDate(curDate, 1)
            const today = new Date()
            const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
            setSelectedDate(next >= todayStr ? '' : next)
          }}
          aria-label="后一天"
        >
          <CaretRight size={14} />
        </button>
      </div>

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

      {!loading && !error && groups.length === 0 && (
        <div className="empty enter">
          <div className="empty-art" aria-hidden="true">
            <Newspaper size={23} />
          </div>
          <p className="empty-title">暂无新闻</p>
          <p className="empty-copy">该板块该日期暂无采集数据，采集完成后会自动出现。</p>
        </div>
      )}

      {!loading && !error && groups.length > 0 && (
        <div>
          {groups.map((g) => (
            <section key={g.date || 'other'} aria-label={g.label} className="news-today-group">
              <h2 className="news-today-title">{g.label}</h2>
              <div className="row-list">
                {g.items.map((n, i) => {
                  const summary = (n.summary && n.summary.trim()) || ''
                  return (
                    <a
                      key={n.id}
                      href={n.link}
                      target="_blank"
                      rel="noreferrer"
                      className="news-item enter"
                      style={{ '--i': i }}
                    >
                      <div className="news-item-top">
                        <span className="tag">{n.source}</span>
                        <span className="news-time">
                          <Clock size={11} />
                          {n.published_at ? new Date(n.published_at).toLocaleDateString('zh-CN') : ''}
                        </span>
                      </div>
                      <h3>{n.title}</h3>
                      {summary && summary.trim().length >= 12 && <p>{summary}</p>}
                    </a>
                  )
                })}
              </div>
            </section>
          ))}
          {hasMore && (
            <div ref={sentinelRef} className="news-load-more">
              {loadingMore ? '加载中…' : '下滑加载更多'}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
