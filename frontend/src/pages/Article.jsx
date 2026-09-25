import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { BookmarkSimple, CaretLeft, Clock } from '@phosphor-icons/react'
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

  return (
    <div className="page detail-page">
      <div className="detail-bar">
        <button className="icon-btn" onClick={() => navigate(-1)} aria-label="返回">
          <CaretLeft size={20} />
        </button>
      </div>

      {!article && (
        <div>
          <div className="sk sk-line" style={{ width: '35%', height: 12 }} />
          <div className="sk sk-line" style={{ width: '92%', height: 24, margin: '16px 0' }} />
          <div className="sk sk-line" style={{ width: '88%', height: 24, margin: '0 0 16px' }} />
          <div className="sk sk-line" style={{ width: '45%', height: 12 }} />
          <div style={{ height: 28 }} />
          {[0, 1, 2, 3].map((i) => (
            <div className="sk sk-line" key={i} style={{ width: '100%', height: 14, marginBottom: 16 }} />
          ))}
        </div>
      )}

      {article && (
        <div className="enter">
          <span className="tag">{article.category}</span>
          <h1>{article.title}</h1>
          <div className="meta meta-none">
            <Clock size={13} />
            <span>{article.read_time}</span>
          </div>
          <div className="content">
            {article.content.replace(/\\n/g, '\n').split('\n\n').map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
        </div>
      )}

      <div className="action-bar">
        <button className={bookmarked ? 'fav-on' : 'btn-ghost'} onClick={toggle} disabled={!article}>
          <BookmarkSimple size={18} weight={bookmarked ? 'fill' : 'regular'} style={{ verticalAlign: '-3px', marginRight: 6 }} />
          {bookmarked ? '已收藏' : '收藏这篇'}
        </button>
      </div>
    </div>
  )
}
