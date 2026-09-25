import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getBookmarks } from '../api.js'

export default function Profile({ user, logout }) {
  const [bookmarks, setBookmarks] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    if (user) {
      getBookmarks().then((data) => setBookmarks(data.bookmarks))
    }
  }, [user])

  if (!user) {
    return (
      <div className="page">
        <h1 className="page-title">我的</h1>
        <div className="card center">
          <p>登录后可以收藏文章</p>
          <button onClick={() => navigate('/login')}>去登录</button>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <h1 className="page-title">我的</h1>
      <div className="card user-card">
        <div className="avatar">{user.nickname.slice(0, 1)}</div>
        <div>
          <h3>{user.nickname}</h3>
          <p>@{user.username}</p>
        </div>
      </div>

      <h2 className="sub-title">我的收藏</h2>
      <div className="list">
        {bookmarks.map((b) => (
          <Link key={b.id} to={'/article/' + b.article_id} className="card item">
            <span className="tag">{b.category}</span>
            <h3>{b.title}</h3>
            <p>{b.summary}</p>
            <small>{b.read_time}</small>
          </Link>
        ))}
        {bookmarks.length === 0 && <p className="empty">还没有收藏文章</p>}
      </div>

      <button className="logout" onClick={logout}>退出登录</button>
    </div>
  )
}
