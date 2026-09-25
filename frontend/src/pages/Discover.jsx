import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Clock } from '@phosphor-icons/react'
import { getArticles, getCategories } from '../api.js'

export default function Discover() {
  const [categories, setCategories] = useState(['全部'])
  const [category, setCategory] = useState('全部')
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getCategories().then((data) => setCategories(['全部', ...data.categories]))
  }, [])

  useEffect(() => {
    setLoading(true)
    getArticles(category).then((data) => {
      setArticles(data.articles)
      setLoading(false)
    })
  }, [category])

  const featured = articles[0]
  const rest = articles.slice(1)

  return (
    <div className="page">
      <div className="page-head">
        <h1 className="page-title">发现</h1>
        <p className="page-sub">大模型、提示工程与 AI 安全，慢慢读</p>
      </div>

      <div className="chips">
        {categories.map((c) => (
          <span
            key={c}
            className={'chip' + (c === category ? ' chip-on' : '')}
            onClick={() => setCategory(c)}
          >
            {c}
          </span>
        ))}
      </div>

      {loading && (
        <div>
          <div className="sk-feature">
            <div className="sk sk-cover" />
            <div className="sk-lines">
              <div className="sk sk-line" style={{ width: '30%' }} />
              <div className="sk sk-line" style={{ width: '85%', height: 18 }} />
              <div className="sk sk-line" style={{ width: '60%' }} />
            </div>
          </div>
          {[0, 1, 2].map((i) => (
            <div className="sk-row" key={i}>
              <div className="sk sk-cover" />
              <div className="sk-lines">
                <div className="sk sk-line" style={{ width: '40%' }} />
                <div className="sk sk-line" style={{ width: '90%' }} />
                <div className="sk sk-line" style={{ width: '55%' }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && articles.length === 0 && (
        <p className="empty">这个分类下还没有文章，换个分类看看</p>
      )}

      {!loading && featured && (
        <Link to={'/article/' + featured.id} className="feature enter" style={{ '--i': 0 }}>
          <div className="cover" data-cat={featured.category}>
            <span className="cover-mark">{featured.category}</span>
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

      {!loading && rest.map((a, i) => (
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
    </div>
  )
}
