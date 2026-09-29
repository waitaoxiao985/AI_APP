import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CaretLeft, Newspaper, ShieldCheck } from '@phosphor-icons/react'
import { getSecurityNews } from '../api.js'
import SecurityCard from '../components/SecurityCard.jsx'

const CACHE_KEY = 'ai_app_security_cache_v1'

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

export default function SecurityNews() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')
  const [reload, setReload] = useState(0)
  const itemsRef = React.useRef([])
  const sentinelRef = React.useRef(null)

  useEffect(() => {
    let alive = true
    setError('')
    const cached = readCache()
    if (cached && cached.news.length > 0) {
      setItems(cached.news)
      itemsRef.current = cached.news
      setTotal(cached.total || cached.news.length)
      setLoading(false)
    } else {
      setLoading(true)
    }
    getSecurityNews(20, 0)
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
          setError(err.message || '安全资讯加载失败')
          setLoading(false)
        }
      })
    return () => {
      alive = false
    }
  }, [reload])

  const loadMore = React.useCallback(() => {
    if (loadingMore || loading) return
    const cur = itemsRef.current
    if (cur.length >= total) return
    setLoadingMore(true)
    getSecurityNews(20, cur.length)
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

  return (
    <div className="page news-page">
      <div className="detail-bar">
        <button className="icon-btn" onClick={() => navigate(-1)} aria-label="返回">
          <CaretLeft size={20} />
        </button>
        <span className="detail-bar-title">网络安全</span>
      </div>

      <header className="page-head">
        <h1 className="page-title">网络安全</h1>
        <p className="page-sub">漏洞预警 · 安全动态 · 攻防技术</p>
      </header>

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
            <ShieldCheck size={23} />
          </div>
          <p className="empty-title">安全资讯收集中</p>
          <p className="empty-copy">定时采集完成后会自动出现在这里。</p>
        </div>
      )}

      {!loading && !error && (
        <section className="row-list" aria-label="网络安全列表">
          {items.map((n, i) => (
            <SecurityCard key={n.id} n={n} i={i} />
          ))}
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
