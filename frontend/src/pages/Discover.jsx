import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getArticles, getCategories } from '../api.js'

export default function Discover() {
  const [categories, setCategories] = useState(['全部'])
  const [category, setCategory] = useState('全部')
  const [articles, setArticles] = useState([])

  useEffect(() => {
    getCategories().then((data) => setCategories(['全部', ...data.categories]))
  }, [])

  useEffect(() => {
    getArticles(category).then((data) => setArticles(data.articles))
  }, [category])

  return (
    <div className="page">
      <h1 className="page-title">发现</h1>
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
      <div className="list">
        {articles.map((a) => (
          <Link key={a.id} to={'/article/' + a.id} className="card item">
            <span className="tag">{a.category}</span>
            <h3>{a.title}</h3>
            <p>{a.summary}</p>
            <small>{a.read_time}</small>
          </Link>
        ))}
        {articles.length === 0 && <p className="empty">暂无文章</p>}
      </div>
    </div>
  )
}
