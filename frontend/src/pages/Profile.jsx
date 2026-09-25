import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BookmarkSimple, Clock, SignOut } from '@phosphor-icons/react'
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
        <div className="page-head">
          <h1 className="page-title">我的</h1>
          <p className="page-sub">登录后同步你的收藏</p>
        </div>
        <div className="center enter">
          <div className="logo-mark">知</div>
          <p>登录后可以收藏文章，随时回来接着读</p>
          <button onClick={() => navigate('/login')}>去登录</button>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="page-head">
        <h1 className="page-title">我的</h1>
      </div>

      <div className="user-card enter">
        <div className="avatar">{user.nickname.slice(0, 1)}</div>
        <div>
          <h3>{user.nickname}</h3>
          <p>@{user.username}</p>
          <div className="stat-line">
            <BookmarkSimple size={13} weight="fill" />
            <span>收藏了 {bookmarks.length} 篇文章</span>
          </div>
        </div>
      </div>

      <h2 className="sub-title">我的收藏</h2>

      {bookmarks.length === 0 && (
        <p className="empty">还没有收藏文章<br />读到喜欢的，点一下收藏就会出现在这里</p>
      )}

      {bookmarks.map((b, i) => (
        <Link key={b.id} to={'/article/' + b.article_id} className="row enter" style={{ '--i': i }}>
          <div className="cover" data-cat={b.category} />
          <div className="row-body">
            <span className="tag">{b.category}</span>
            <h3>{b.title}</h3>
            <p>{b.summary}</p>
            <div className="meta">
              <Clock size={12} />
              <span>{b.read_time}</span>
            </div>
          </div>
        </Link>
      ))}

      <button className="btn-danger" style={{ marginTop: 22 }} onClick={logout}>
        <SignOut size={17} style={{ verticalAlign: '-3px', marginRight: 6 }} />
        退出登录
      </button>
    </div>
  )
}
