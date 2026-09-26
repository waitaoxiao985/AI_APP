import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { CaretLeft, Clock, Books } from '@phosphor-icons/react'
import { getTopic } from '../api.js'
import { relTime } from '../time.js'

export default function Topic() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reload, setReload] = useState(0)

  useEffect(() => {
    let alive = true
    setLoading(true)
    setError('')
    getTopic(id)
      .then((d) => {
        if (!alive) return
        setData(d)
        setLoading(false)
      })
      .catch((err) => {
        if (!alive) return
        setError(err.message || '专题加载失败')
        setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [id, reload])

  return (
    <div className="page topic-page">
      <div className="detail-bar">
        <button className="icon-btn" onClick={() => navigate(-1)} aria-label="返回">
          <CaretLeft size={20} />
        </button>
      </div>

      {loading && (
        <div aria-hidden="true">
          <div className="sk sk-line w-45 h-title" />
          <div className="sk sk-line w-88" />
          <div className="sk sk-line w-60" />
          <div style={{ height: 20 }} />
          <div className="sk-row">
            <div className="sk sk-cover" />
            <div className="sk-lines">
              <div className="sk sk-line w-40" />
              <div className="sk sk-line w-90" />
            </div>
          </div>
        </div>
      )}

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

      {!loading && !error && data && (
        <>
          <header className="topic-hero enter">
            <p className="topic-kicker">专题</p>
            <h1 className="topic-title">{data.topic.title}</h1>
            <p className="topic-sub">{data.topic.subtitle}</p>
            <p className="topic-meta">共 {data.articles.length} 篇文章</p>
          </header>

          {data.articles.length === 0 && (
            <div className="empty enter">
              <div className="empty-art" aria-hidden="true">
                <Books size={23} />
              </div>
              <p className="empty-title">暂无内容</p>
              <p className="empty-copy">该专题还没有收录文章，稍后再来看看。</p>
            </div>
          )}

          <section className="row-list" aria-label="专题文章">
            {data.articles.map((a, i) => (
              <Link key={a.id} to={'/article/' + a.id} className="row enter" style={{ '--i': i }}>
                <div className="cover" data-cat={a.category} />
                <div className="row-body">
                  <span className="tag">{a.category}</span>
                  <h3>{a.title}</h3>
                  <p>{a.summary}</p>
                <div className="meta">
                  <Clock size={12} />
                  <span>{a.read_time}</span>
                  {a.created_at && (
                    <>
                      <span className="meta-dot" aria-hidden="true" />
                      <span>{relTime(a.created_at)}</span>
                    </>
                  )}
                </div>
                </div>
              </Link>
            ))}
          </section>
        </>
      )}
    </div>
  )
}
