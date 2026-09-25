import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BookmarkSimple, Clock, SignOut, Books } from '@phosphor-icons/react'
import { getBookmarks } from '../api.js'

export default function Profile({ user, logout }) {
  const [bookmarks, setBookmarks] = useState([])
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    if (!user) return
    getBookmarks()
      .then((data) => setBookmarks(data.bookmarks))
      .catch((err) => setError(err.message || '收藏加载失败'))
  }, [user])

  if (!user) {
    return (
      <div className="page">
        <header className="page-head">
          <h1 className="page-title">我的</h1>
          <p className="page-sub">登录后同步你的收藏</p>
        </header>

        <div className="center enter">
          <div className="logo-mark" aria-hidden="true">知</div>
          <p className="empty-title">未认证</p>
          <p>登录后可写入收藏列表，随时回来接着读。</p>
          <button onClick={() => navigate('/login')}>去登录</button>
        </div>

        <p className="page-foot">
          本应用文章为原创撰写，文末附参考文献与版权归属，不转载第三方全文。
        </p>
      </div>
    )
  }

  return (
    <div className="page">
      <header className="page-head">
        <h1 className="page-title">我的</h1>
      </header>

      <section className="user-card enter" aria-label="账号信息">
        <div className="avatar" aria-hidden="true">{user.nickname.slice(0, 1)}</div>
        <div>
          <h3>{user.nickname}</h3>
          <p>@{user.username}</p>
          <div className="stat-line">
            <BookmarkSimple size={13} weight="fill" />
            <span>收藏了 {bookmarks.length} 篇文章</span>
          </div>
        </div>
      </section>

      <h2 className="sub-title">我的收藏</h2>

      {error && (
        <div className="error enter" role="alert">
          {error}
        </div>
      )}

      {!error && bookmarks.length === 0 && (
        <div className="empty enter">
          <div className="empty-art" aria-hidden="true">
            <Books size={23} />
          </div>
          <p className="empty-title typewriter">收藏列表为空</p>
          <p className="empty-copy">阅读时点击「收藏这篇」，文章会写入此列表。</p>
          <button className="btn-text" onClick={() => navigate('/')}>
            去发现文章
          </button>
        </div>
      )}

      {!error && bookmarks.length > 0 && (
        <section className="row-list" aria-label="收藏列表">
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
        </section>
      )}

      <button className="btn-danger btn-block-gap" onClick={logout}>
        <SignOut size={17} style={{ verticalAlign: '-3px', marginRight: 6 }} />
        退出登录
      </button>

      <p className="page-foot">
        文章正文为原创撰写；所引文献的著作权归各自作者与出版方所有，使用第三方内容请遵守其原始授权协议。
      </p>
    </div>
  )
}
