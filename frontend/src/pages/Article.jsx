import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getArticle, checkBookmark, addBookmark, removeBookmark } from '../api.js'

export default function Article({ user }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [article, setArticle] = useState(null)
  const [bookmarked, setBookmarked] = useState(false)

  useEffect(() => {
    getArticle(id).then((data) => setArticle(data.article))
    if (user) {
      checkBookmark(id)
        .then((data) => setBookmarked(data.bookmarked))
        .catch(() => {})
    }
  }, [id, user])

  async function toggle() {
    if (!user) {
      navigate('/login')
      return
    }
    if (bookmarked) {
      await removeBookmark(id)
      setBookmarked(false)
    } else {
      await addBookmark(id)
      setBookmarked(true)
    }
  }

  if (!article) {
    return (
      <div className="page">
        <p className="empty">加载中...</p>
      </div>
    )
  }

  return (
    <div className="page detail-page">
      <div className="detail-bar">
        <button className="back" onClick={() => navigate(-1)}>返回</button>
        <button className={'fav' + (bookmarked ? ' fav-on' : '')} onClick={toggle}>
          {bookmarked ? '已收藏' : '收藏'}
        </button>
      </div>
      <span className="tag">{article.category}</span>
      <h1>{article.title}</h1>
      <p className="meta">{article.read_time}</p>
      <div className="content">
        {article.content.split('\n\n').map((para, i) => (
          <p key={i}>{para}</p>
        ))}
      </div>
    </div>
  )
}
