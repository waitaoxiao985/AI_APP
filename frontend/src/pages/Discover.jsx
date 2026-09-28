import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  MagnifyingGlass,
  Clock,
  BookmarkSimple,
  CaretLeft,
  CaretRight,
  Books,
  Newspaper,
  CalendarBlank,
  Sparkle
} from '@phosphor-icons/react'
import { getDaily, getTopics, getBookmarksRecent } from '../api.js'
import Cover from '../components/Cover.jsx'
import ModuleCard from '../components/ModuleCard.jsx'

export default function Discover({ user }) {
  const [daily, setDaily] = useState([])
  const [topics, setTopics] = useState([])
  const [promo, setPromo] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reload, setReload] = useState(0)
  const [slide, setSlide] = useState(0)
  const [recent, setRecent] = useState([])
  const [favTotal, setFavTotal] = useState(0)
  const navigate = useNavigate()
  const touchX = useRef(0)

  useEffect(() => {
    if (!user) {
      setRecent([])
      setFavTotal(0)
      return
    }
    let alive = true
    getBookmarksRecent(2)
      .then((data) => {
        if (!alive) return
        setRecent(data.bookmarks)
        setFavTotal(data.total)
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [user])

  useEffect(() => {
    let alive = true
    setLoading(true)
    setError('')
    Promise.all([getDaily(), getTopics()])
      .then(([dayData, topicData]) => {
        if (!alive) return
        setDaily(dayData.articles)
        setTopics(topicData.topics)
        setLoading(false)
      })
      .catch((err) => {
        if (!alive) return
        setError(err.message || '内容加载失败')
        setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [reload])

  useEffect(() => {
    if (daily.length < 2) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = setInterval(() => setSlide((s) => (s + 1) % Math.min(daily.length, 3)), 4500)
    return () => clearInterval(id)
  }, [daily.length])

  useEffect(() => {
    if (topics.length < 2) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = setInterval(() => setPromo((s) => (s + 1) % topics.length), 5200)
    return () => clearInterval(id)
  }, [topics.length])

  const hero = daily
  const topic = topics[promo]

  function onTouchStart(e) {
    touchX.current = e.touches[0].clientX
  }

  function onTouchEnd(e) {
    const dx = e.changedTouches[0].clientX - touchX.current
    const n = hero.length
    if (n < 2 || Math.abs(dx) < 40) return
    setSlide((s) => (dx < 0 ? (s + 1) % n : (s - 1 + n) % n))
  }

  return (
    <div className="page">
      <header className="discover-top">
        <div className="brand-glyph" aria-hidden="true">知</div>
        <div className="brand-text">
          <h1 className="brand-title">AI 知识</h1>
          <p className="brand-sub">探索人工智能的无限可能</p>
        </div>
        <button
          type="button"
          className="search-round"
          aria-label="搜索文章、专题、术语"
          onClick={() => navigate('/search')}
        >
          <MagnifyingGlass size={18} aria-hidden="true" />
        </button>
      </header>

      {error && (
        <div className="error enter" role="alert">
          {error}
          <div className="error-actions">
            <button className="btn-text" onClick={() => setReload((r) => r + 1)}>
              重新加载
            </button>
          </div>
        </div>
      )}

      {loading && (
        <div aria-hidden="true">
          <div className="sk-feature">
            <div className="sk sk-cover" />
          </div>
          <div className="sk sk-line w-45" />
          <div className="sk sk-line w-88" />
        </div>
      )}

      {!loading && !error && hero.length > 0 && (
        <>
          <p className="sub-eyebrow module-head">今日推荐</p>
          <section
            className="carousel enter"
            aria-label="今日推荐"
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            {hero.length > 1 && (
              <button
                type="button"
                className="carousel-arrow carousel-prev"
                aria-label="上一篇"
                onClick={() => setSlide((s) => (s - 1 + hero.length) % hero.length)}
              >
                <CaretLeft size={16} />
              </button>
            )}
            {hero.map((a, i) => (
              <Link
                key={a.id}
                to={'/article/' + a.id}
                className={'carousel-slide' + (i === slide ? ' carousel-on' : '')}
                aria-hidden={i !== slide}
                tabIndex={i === slide ? 0 : -1}
              >
                <Cover category={a.category} src={a.cover} alt={a.title} />
                <div className="carousel-scrim" />
                <div className="carousel-copy">
                  <span className="tag">{a.category}</span>
                  <h3>{a.title}</h3>
                  <div className="meta">
                    <Clock size={12} />
                    <span>{a.read_time}</span>
                  </div>
                </div>
              </Link>
            ))}
            {hero.length > 1 && (
              <div className="carousel-dots" aria-hidden="true">
                {hero.map((_, i) => (
                  <span key={i} className={i === slide ? 'dot dot-on' : 'dot'} />
                ))}
              </div>
            )}
            {hero.length > 1 && (
              <button
                type="button"
                className="carousel-arrow carousel-next"
                aria-label="下一篇"
                onClick={() => setSlide((s) => (s + 1) % hero.length)}
              >
                <CaretRight size={16} />
              </button>
            )}
          </section>
        </>
      )}

      {!loading && !error && (
        <>
          <p className="sub-eyebrow module-head">快捷入口</p>
          <div className="module-grid enter" aria-label="快捷入口">
            <ModuleCard title="知识分类" subtitle="按主题浏览文章" icon={Books} to="/articles" />
            <ModuleCard title="AI 快讯" subtitle="每日行业动态" icon={Newspaper} to="/news" />
            <ModuleCard title="今日新闻" subtitle="按日期翻阅快讯" icon={CalendarBlank} to="/news-today" />
            <ModuleCard title="更多内容" subtitle="预留入口 · 后续接入新功能" icon={Sparkle} to="/articles" />
          </div>
        </>
      )}

      {!loading && !error && topic && (
        <>
          <p className="sub-eyebrow module-head">专题</p>
          <button
            type="button"
            className="promo enter"
            onClick={() => navigate('/topic/' + topic.id)}
          >
            <span className="promo-copy">
              <span className="promo-title">{topic.title}</span>
              <span className="promo-sub">{topic.subtitle}</span>
            </span>
            <span className="promo-go">
              点击进入专题
              <CaretRight size={13} />
            </span>
            <span className="promo-count">
              {promo + 1}/{topics.length}
            </span>
          </button>
        </>
      )}

      {!loading && !error && (
        <>
          <p className="sub-eyebrow module-head">我的收藏</p>
          {user && recent.length > 0 && (
            <div className="saved-card enter">
              <div className="saved-ico" aria-hidden="true">
                <BookmarkSimple size={21} weight="duotone" />
              </div>
              <div className="saved-copy">
                {recent.map((b) => (
                  <p key={b.id} className="saved-item">{b.title}</p>
                ))}
                <p className="saved-sub">共 {favTotal} 篇收藏</p>
              </div>
              <button type="button" className="saved-go" onClick={() => navigate('/profile')}>
                查看全部
                <CaretRight size={13} />
              </button>
            </div>
          )}
          {user && recent.length === 0 && (
            <div className="saved-card enter">
              <div className="saved-ico" aria-hidden="true">
                <BookmarkSimple size={21} weight="duotone" />
              </div>
              <div className="saved-copy">
                <p className="saved-title">还没有收藏</p>
                <p className="saved-sub">读到喜欢的文章，点一下收藏就会出现在这里</p>
              </div>
              <button type="button" className="saved-go" onClick={() => navigate('/search')}>
                去找文章
                <CaretRight size={13} />
              </button>
            </div>
          )}
          {!user && (
            <div className="saved-card enter">
              <div className="saved-ico" aria-hidden="true">
                <BookmarkSimple size={21} weight="duotone" />
              </div>
              <div className="saved-copy">
                <p className="saved-title">收藏的文章都在这里</p>
                <p className="saved-sub">登录后可同步收藏，随时回来接着读</p>
              </div>
              <button type="button" className="saved-go" onClick={() => navigate('/login')}>
                去登录
                <CaretRight size={13} />
              </button>
            </div>
          )}
        </>
      )}

      {!loading && !error && daily.length === 0 && (
        <div className="empty enter">
          <div className="empty-art" aria-hidden="true">
            <Books size={23} />
          </div>
          <p className="empty-title">无匹配记录</p>
          <p className="empty-copy">暂无内容，稍后再来看看。</p>
        </div>
      )}
    </div>
  )
}
