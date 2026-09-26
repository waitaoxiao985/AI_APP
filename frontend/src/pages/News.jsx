import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Clock, Newspaper } from '@phosphor-icons/react'
import { getNews } from '../api.js'

export default function News() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reload, setReload] = useState(0)

  useEffect(() => {
    let alive = true
    setLoading(true)
    setError('')
    getNews(50)
      .then((data) => {
        if (!alive) return
        setItems(data.news)
        setLoading(false)
      })
      .catch((err) => {
        if (!alive) return
        setError(err.message || '快讯加载失败')
        setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [reload])

  return (
    <div className="page">
      <header className="page-head">
        <h1 className="page-title">AI 快讯</h1>
        <p className="page-sub">每日自动聚合的行业动态</p>
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
            <Newspaper size={23} />
          </div>
          <p className="empty-title typewriter">暂无快讯</p>
          <p className="empty-copy">定时采集完成后会自动出现在这里。</p>
        </div>
      )}

      {!loading && !error && (
        <section className="row-list" aria-label="快讯列表">
          {items.map((n, i) => (
            <Link key={n.id} to={'/news/' + n.id} className="news-item enter" style={{ '--i': i }}>
              <div className="news-item-top">
                <span className="tag">{n.source}</span>
                <span className="news-time">
                  <Clock size={11} />
                  {n.published_at ? new Date(n.published_at).toLocaleDateString('zh-CN') : ''}
                </span>
              </div>
              <h3>{n.title}</h3>
              <p>{n.excerpt}</p>
            </Link>
          ))}
        </section>
      )}
    </div>
  )
}
