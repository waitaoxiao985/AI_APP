import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MagnifyingGlass, Clock, BookmarkSimple, CaretRight, Books } from '@phosphor-icons/react'
import { getArticles } from '../api.js'

export default function Discover() {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reload, setReload] = useState(0)
  const [slide, setSlide] = useState(0)
  const navigate = useNavigate()
  const touchX = useRef(0)

  useEffect(() => {
    let alive = true
    setLoading(true)
    setError('')
    getArticles('全部')
      .then((data) => {
        if (!alive) return
        setArticles(data.articles)
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
    if (articles.length < 2) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = setInterval(() => setSlide((s) => (s + 1) % Math.min(articles.length, 3)), 4500)
    return () => clearInterval(id)
  }, [articles.length])

  const hero = articles.slice(0, 3)

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
        <button type="button" className="search-cta" onClick={() => navigate('/search')}>
          <MagnifyingGlass size={16} aria-hidden="true" />
          <span>搜索文章、专题、术语</span>
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
            {hero.map((a, i) => (
              <Link
                key={a.id}
                to={'/article/' + a.id}
                className={'carousel-slide' + (i === slide ? ' carousel-on' : '')}
                aria-hidden={i !== slide}
                tabIndex={i === slide ? 0 : -1}
              >
                <div className="cover" data-cat={a.category} />
                <div className="carousel-scrim" />
                <div className="carousel-copy">
                  <span className="tag">{a.category}</span>
                  <h3>{a.title}</h3>
                  <div className="meta">
                    <Clock size={12} />
                    <span>{a.read_time}</span>
                  </div>
                </div>
                <span className="carousel-count">
                  {i + 1}/{hero.length}
                </span>
              </Link>
            ))}
          </section>
        </>
      )}

      {!loading && !error && (
        <>
          <p className="sub-eyebrow module-head">专题</p>
          <button type="button" className="promo enter" onClick={() => navigate('/search')}>
            <span className="promo-copy">
              <span className="promo-title">提示工程实战专题</span>
              <span className="promo-sub">从基本原则到进阶技巧，一站读完</span>
            </span>
            <span className="promo-go">
              点击进入专题
              <CaretRight size={13} />
            </span>
          </button>
        </>
      )}

      {!loading && !error && (
        <>
          <p className="sub-eyebrow module-head">我的收藏</p>
          <div className="saved-card enter">
            <div className="saved-ico" aria-hidden="true">
              <BookmarkSimple size={21} weight="duotone" />
            </div>
            <div className="saved-copy">
              <p className="saved-title">收藏的文章都在这里</p>
              <p className="saved-sub">登录后可同步收藏，随时回来接着读</p>
            </div>
            <button type="button" className="saved-go" onClick={() => navigate('/profile')}>
              去查看
              <CaretRight size={13} />
            </button>
          </div>
        </>
      )}

      {!loading && !error && articles.length === 0 && (
        <div className="empty enter">
          <div className="empty-art" aria-hidden="true">
            <Books size={23} />
          </div>
          <p className="empty-title typewriter">无匹配记录</p>
          <p className="empty-copy">暂无内容，稍后再来看看。</p>
        </div>
      )}
    </div>
  )
}
