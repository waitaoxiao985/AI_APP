import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Clock, MagnifyingGlass, MagnifyingGlassPlus } from '@phosphor-icons/react'
import { searchArticles, getHotSearch } from '../api.js'

export default function Search() {
  const [keyword, setKeyword] = useState('')
  const [articles, setArticles] = useState([])
  const [searched, setSearched] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [hot, setHot] = useState([])

  useEffect(() => {
    getHotSearch()
      .then((data) => setHot(data.hot))
      .catch(() => {})
  }, [])

  async function doSearch(e, q) {
    if (e) e.preventDefault()
    const word = (q !== undefined ? q : keyword).trim()
    if (!word) return
    setKeyword(word)
    setLoading(true)
    setSearched(true)
    setError('')
    try {
      const data = await searchArticles(word)
      setArticles(data.articles)
    } catch (err) {
      setError(err.message || '搜索失败')
      setArticles([])
    } finally {
      setLoading(false)
    }
  }

  function reset() {
    setKeyword('')
    setArticles([])
    setSearched(false)
    setError('')
  }

  return (
    <div className="page">
      <header className="page-head">
        <h1 className="page-title">搜索</h1>
        <p className="page-sub">按标题、摘要和正文找文章</p>
      </header>

      <form className="search-form" onSubmit={doSearch} role="search">
        <div className="search-wrap">
          <span className="search-icon" aria-hidden="true">
            <MagnifyingGlass size={18} />
          </span>
          <input
            aria-label="搜索关键词"
            placeholder="搜一搜你感兴趣的"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
        </div>
        <button type="submit">搜索</button>
      </form>

      {error && (
        <div className="error enter" role="alert">
          {error}
          <div className="error-actions">
            <button className="btn-text" onClick={(e) => doSearch(e)}>
              再试一次
            </button>
          </div>
        </div>
      )}

      {!searched && (
        <div className="enter">
          <p className="hot-label">大家在读</p>
          <div className="chips" role="group" aria-label="热门搜索词">
            {hot.map((c) => (
              <button key={c} type="button" className="chip" onClick={(e) => doSearch(e, c)}>
                {c}
              </button>
            ))}
          </div>
        </div>
      )}

      {searched && !loading && !error && (
        <p className="result-line">
          {articles.length > 0
            ? '找到 ' + articles.length + ' 篇相关文章 · 关键词「' + keyword + '」'
            : '关键词「' + keyword + '」'}
        </p>
      )}

      {loading && (
        <div aria-hidden="true">
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

      {!loading && !error && (
        <section className="row-list" aria-label="搜索结果">
          {articles.map((a, i) => (
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
        </section>
      )}

      {searched && !loading && !error && articles.length === 0 && (
        <div className="empty enter">
          <div className="empty-art" aria-hidden="true">
            <MagnifyingGlassPlus size={23} />
          </div>
          <p className="empty-title typewriter">无匹配记录</p>
          <p className="empty-copy">
            0 条结果。换个更短的关键词，或点上方热词直接搜。
          </p>
          <button className="btn-text" onClick={reset}>
            清空搜索
          </button>
        </div>
      )}
    </div>
  )
}
