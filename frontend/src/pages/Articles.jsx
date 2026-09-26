import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CaretLeft, Clock, Books } from '@phosphor-icons/react'
import { getArticles, getCategories } from '../api.js'
import { relTime } from '../time.js'

export default function Articles() {
  const navigate = useNavigate()
  const [cats, setCats] = useState(['全部'])
  const [cat, setCat] = useState('全部')
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reload, setReload] = useState(0)

  useEffect(() => {
    getCategories()
      .then((d) => setCats(['全部', ...d.categories]))
      .catch(() => {})
  }, [])

  useEffect(() => {
    let alive = true
    setLoading(true)
    setError('')
    getArticles(cat, 100)
      .then((d) => {
        if (!alive) return
        setList(d.articles)
        setLoading(false)
      })
      .catch((err) => {
        if (!alive) return
        setError(err.message || '文章加载失败')
        setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [cat, reload])

  return (
    <div className="page topic-page">
      <div className="detail-bar">
        <button className="icon-btn" onClick={() => navigate(-1)} aria-label="返回">
          <CaretLeft size={20} />
        </button>
        <span className="detail-bar-title">全部文章</span>
      </div>

      <header className="page-head">
        <h1 className="page-title">全部文章</h1>
        <p className="page-sub">共 {list.length} 篇，可按分类筛选</p>
      </header>

      <div className="chips" role="group" aria-label="文章分类">
        {cats.map((c) => (
          <button
            key={c}
            type="button"
            className={c === cat ? 'chip chip-on' : 'chip'}
            aria-pressed={c === cat}
            onClick={() => setCat(c)}
          >
            {c}
          </button>
        ))}
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
            <div className="sk-row" key={i}>
              <div className="sk sk-cover" />
              <div className="sk-lines">
                <div className="sk sk-line w-40" />
                <div className="sk sk-line w-90" />
                <div className="sk sk-line w-55" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && !error && list.length === 0 && (
        <div className="empty enter">
          <div className="empty-art" aria-hidden="true">
            <Books size={23} />
          </div>
          <p className="empty-title">无匹配记录</p>
          <p className="empty-copy">该分类下暂时没有文章，换个分类看看。</p>
        </div>
      )}

      {!loading && !error && list.length > 0 && (
        <section className="row-list" aria-label="全部文章">
          {list.map((a, i) => (
            <Link key={a.id} to={'/article/' + a.id} className="row enter" style={{ '--i': Math.min(i, 8) }}>
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
      )}
    </div>
  )
}
