import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { BookmarkSimple, CaretLeft, Clock, LinkSimple, BookOpen } from '@phosphor-icons/react'
import { getArticle, checkBookmark, addBookmark, removeBookmark } from '../api.js'

function Inline({ text }) {
  const parts = String(text).split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, i) =>
    part.startsWith('**') && part.endsWith('**') && part.length > 4 ? (
      <strong key={i}>{part.slice(2, -2)}</strong>
    ) : (
      <React.Fragment key={i}>{part}</React.Fragment>
    )
  )
}

function RefLine({ line }) {
  const m = line.match(/^(原文链接|链接)[：:]\s*(https?:\/\/\S+)/)
  if (m) {
    return (
      <p className="ref-link">
        <LinkSimple size={12} weight="bold" className="ico-inline-sm" />
        {m[1]}：
        <a href={m[2]} target="_blank" rel="noreferrer">
          {m[2]}
        </a>
      </p>
    )
  }
  return (
    <p>
      <Inline text={line} />
    </p>
  )
}

function Block({ block, section }) {
  const lines = block.split('\n').filter((l) => l.trim() !== '')
  const head = block.trim()

  if (head.startsWith('### ')) return <h3><Inline text={head.slice(4)} /></h3>
  if (head.startsWith('## ')) return <h2><Inline text={head.slice(3)} /></h2>
  if (head === '---') return <hr />

  const isUl = lines.every((l) => l.trim().startsWith('- '))
  const isOl = lines.every((l) => /^\d+\.\s/.test(l.trim()))

  if (isUl) {
    return <ul>{lines.map((l, i) => <li key={i}><Inline text={l.trim().slice(2)} /></li>)}</ul>
  }
  if (isOl) {
    return (
      <ol>
        {lines.map((l, i) => (
          <li key={i}><Inline text={l.trim().replace(/^\d+\.\s/, '')} /></li>
        ))}
      </ol>
    )
  }

  if (section === 'refs') {
    return (
      <div className="ref-item">
        {lines.map((l, i) => <RefLine key={i} line={l} />)}
      </div>
    )
  }

  return (
    <p className={section === 'notice' ? 'notice-line' : undefined}>
      <Inline text={block} />
    </p>
  )
}

function Content({ raw }) {
  const blocks = raw.replace(/\\n/g, '\n').split(/\n\s*\n/).filter((b) => b.trim() !== '')
  let section = 'body'
  return blocks.map((block, i) => {
    const head = block.trim()
    if (head.startsWith('## 参考文献')) section = 'refs'
    else if (head.startsWith('## 版权声明')) section = 'notice'
    else if (head.startsWith('## ')) section = 'body'
    return <Block key={i} block={block} section={head.startsWith('## ') ? 'head' : section} />
  })
}

export default function Article({ user }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [article, setArticle] = useState(null)
  const [error, setError] = useState('')
  const [bookmarked, setBookmarked] = useState(false)

  useEffect(() => {
    let alive = true
    setArticle(null)
    setError('')
    getArticle(id)
      .then((data) => alive && setArticle(data.article))
      .catch((err) => alive && setError(err.message || '文章加载失败'))
    if (user) {
      checkBookmark(id)
        .then((data) => alive && setBookmarked(data.bookmarked))
        .catch(() => {})
    }
    return () => {
      alive = false
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
    <article className="page detail-page">
      <div className="detail-bar">
        <button className="icon-btn" onClick={() => navigate(-1)} aria-label="返回">
          <CaretLeft size={20} />
        </button>
        <svg
          className="signal-line"
          viewBox="0 0 240 12"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path d="M0 6 H240" />
        </svg>
      </div>

      {!article && !error && (
        <div className="sk-article" aria-hidden="true">
          <div className="sk sk-eyebrow" />
          <div className="sk sk-title w-92" />
          <div className="sk sk-title w-88" />
          <div className="sk sk-meta" />
          {[0, 1, 2, 3].map((i) => (
            <div className="sk sk-para" key={i} />
          ))}
        </div>
      )}

      {error && (
        <div className="center enter" role="alert">
          <div className="empty-art" aria-hidden="true">
            <BookOpen size={23} />
          </div>
          <p className="empty-title">加载失败</p>
          <p>{error}</p>
          <div className="error-actions">
            <button onClick={() => navigate('/')}>回到发现</button>
            <button className="btn-text" onClick={() => navigate('/search')}>
              去搜索
            </button>
          </div>
        </div>
      )}

      {article && (
        <div className="enter">
          <header>
            <span className="tag">{article.category}</span>
            <h1>{article.title}</h1>
            <div className="meta meta-none">
              <Clock size={13} />
              <span>{article.read_time}</span>
            </div>
          </header>
          <div className="content">
            <Content raw={article.content} />
          </div>
        </div>
      )}

      <div className="action-bar">
        <button className={bookmarked ? 'fav-on' : 'btn-ghost'} onClick={toggle} disabled={!article}>
          <BookmarkSimple
            size={18}
            weight={bookmarked ? 'fill' : 'regular'}
            className="ico-inline"
          />
          {bookmarked ? '已收藏' : '收藏这篇'}
        </button>
      </div>
    </article>
  )
}
