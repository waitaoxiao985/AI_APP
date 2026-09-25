import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { searchArticles } from '../api.js'

export default function Search() {
  const [keyword, setKeyword] = useState('')
  const [articles, setArticles] = useState([])
  const [searched, setSearched] = useState(false)

  async function doSearch(e) {
    e.preventDefault()
    const q = keyword.trim()
    if (!q) return
    const data = await searchArticles(q)
    setArticles(data.articles)
    setSearched(true)
  }

  return (
    <div className="page">
      <h1 className="page-title">搜索</h1>
      <form className="search-bar" onSubmit={doSearch}>
        <input
          placeholder="搜索文章标题、内容"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
        <button type="submit">搜索</button>
      </form>
      <div className="list">
        {articles.map((a) => (
          <Link key={a.id} to={'/article/' + a.id} className="card item">
            <span className="tag">{a.category}</span>
            <h3>{a.title}</h3>
            <p>{a.summary}</p>
            <small>{a.read_time}</small>
          </Link>
        ))}
        {searched && articles.length === 0 && <p className="empty">没有找到相关文章</p>}
      </div>
    </div>
  )
}
