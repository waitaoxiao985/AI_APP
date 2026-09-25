import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Clock, BookOpen } from '@phosphor-icons/react'
import { getArticles, getCategories } from '../api.js'

export default function Discover() {
  const [categories, setCategories] = useState(['全部'])
  const [category, setCategory] = useState('全部')
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reload, setReload] = useState(0)

  useEffect(() => {
    getCategories()
      .then((data) => setCategories(['全部', ...data.categories]))
      .catch(() => {})
  }, [])

  useEffect(() => {
    let alive = true
    setLoading(true)
    setError('')
    getArticles(category)
      .then((data) => {
        if (!alive) return
        setArticles(data.articles)
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
  }, [category, reload])

  const featured = articles[0]
  const rest = articles.slice(1)

  return (
    <div className="page">
      <header className="page-head">
        <h1 className="page-title">发现</h1>
        <p className="page-sub">大模型、提示工程与 AI 安全，慢慢读</p>
      </header>

      <div className="chips" role="group" aria-label="文章分类">
        {categories.map((c) => (
          <button
            key={c}
            type="button"
            aria-pressed={c === category}
            className={'chip' + (c === category ? ' chip-on' : '')}
            onClick={() => setCategory(c)}
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
          <div className="sk-feature">
            <div className="sk sk-cover" />
            <div className="sk-lines">
              <div className="sk sk-line w-30" />
              <div className="sk sk-line w-85 h-title" />
              <div className="sk sk-line w-60" />
            </div>
          </div>
          {[0, 1, 2].map((i) => (
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

      {!loading && !error && articles.length === 0 && (
        <div className="empty enter">
          <div className="empty-art" aria-hidden="true">
            <BookOpen size={23} />
          </div>
          <p className="empty-title typewriter">无匹配记录</p>
          <p className="empty-copy">该分类下暂无条目。切换上方分类标签，或执行一次搜索。</p>
        </div>
      )}

      {!loading && !error && featured && (
        <Link to={'/article/' + featured.id} className="feature enter">
          <div className="cover" data-cat={featured.category}>
            <span className="sweep" aria-hidden="true" />
          </div>
          <div className="feature-body">
            <span className="tag">{featured.category}</span>
            <h3>{featured.title}</h3>
            <p>{featured.summary}</p>
            <div className="meta">
              <Clock size={13} />
              <span>{featured.read_time}</span>
            </div>
          </div>
        </Link>
      )}

      {!loading && !error && rest.length > 0 && (
        <p className="sub-eyebrow">继续读</p>
      )}

      {!loading && !error && (
        <section className="row-list" aria-label="文章列表">
          {rest.map((a, i) => (
            <Link key={a.id} to={'/article/' + a.id} className="row enter" style={{ '--i': i + 1 }}>
              <div className="cover" data-cat={a.category} />
              <div className="row-body">
                <span className="tag">{a.category}</span>
                <h3>{a.title}</h3>
                <p>{a.summary}</p>
                <div className="meta">
                  <Clock size={12} />
                  <span>{a.read_time}</span>
                </div>
              </div>
            </Link>
          ))}
        </section>
      )}
    </div>
  )
}
