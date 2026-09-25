import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Clock, MagnifyingGlass } from '@phosphor-icons/react'
import { searchArticles, getCategories } from '../api.js'

export default function Search() {
  const [keyword, setKeyword] = useState('')
  const [articles, setArticles] = useState([])
  const [searched, setSearched] = useState(false)
  const [loading, setLoading] = useState(false)
  const [hot, setHot] = useState([])

  useEffect(() => {
    getCategories().then((data) => setHot(data.categories))
  }, [])

  async function doSearch(e, q) {
    if (e) e.preventDefault()
    const word = (q !== undefined ? q : keyword).trim()
    if (!word) return
    setKeyword(word)
    setLoading(true)
    setSearched(true)
    const data = await searchArticles(word)
    setArticles(data.articles)
    setLoading(false)
  }

  return (
    <div className="page">
      <div className="page-head">
        <h1 className="page-title">搜索</h1>
        <p className="page-sub">按标题、摘要和正文找文章</p>
      </div>

      <form className="search-form" onSubmit={doSearch}>
        <div className="search-wrap">
          <span className="search-icon">
            <MagnifyingGlass size={18} />
          </span>
          <input
            placeholder="搜一搜你感兴趣的"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
        </div>
        <button type="submit">搜索</button>
      </form>

      {!searched && (
        <div className="enter">
          <p className="hot-label">大家在读</p>
          <div className="chips">
            {hot.map((c) => (
              <span key={c} className="chip" onClick={(e) => doSearch(e, c)}>
                {c}
              </span>
            ))}
          </div>
        </div>
      )}

      {searched && !loading && (
        <p className="result-line">
          {articles.length > 0 ? '找到 ' + articles.length + ' 篇相关文章' : ''}
        </p>
      )}

      {loading && [0, 1, 2].map((i) => (
        <div className="sk-row" key={i}>
          <div className="sk sk-cover" />
          <div className="sk-lines">
            <div className="sk sk-line" style={{ width: '40%' }} />
            <div className="sk sk-line" style={{ width: '90%' }} />
            <div className="sk sk-line" style={{ width: '55%' }} />
          </div>
        </div>
      ))}

      {!loading && articles.map((a, i) => (
        <Link key={a.id} to={'/article/' + a.id} className="row enter" style={{ '--i': i }}>
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

      {searched && !loading && articles.length === 0 && (
        <p className="empty">没有找到相关文章，换个关键词试试</p>
      )}
    </div>
  )
}
