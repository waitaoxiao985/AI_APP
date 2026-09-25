import React, { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Brain,
  Cpu,
  MagicWand,
  ShieldCheck,
  RocketLaunch,
  Sparkle,
  Lightning,
  FlagBanner,
  Books,
  MagnifyingGlass,
  BookmarkSimple,
  Clock,
  CaretRight
} from '@phosphor-icons/react'
import { getArticles, getCategories } from '../api.js'

function catIcon(name) {
  if (name === '大模型基础') return Brain
  if (name === '架构原理') return Cpu
  if (name === '提示工程') return MagicWand
  if (name === 'AI 安全') return ShieldCheck
  if (name === '应用实践') return RocketLaunch
  return Sparkle
}

const FUNCS = [
  { key: 'today', label: '今日推荐', Icon: Lightning },
  { key: 'promo', label: '专题', Icon: FlagBanner },
  { key: 'library', label: '文章库', Icon: Books },
  { key: 'search', label: '搜索', Icon: MagnifyingGlass },
  { key: 'fav', label: '我的收藏', Icon: BookmarkSimple }
]

function scrollTo(el) {
  if (!el) return
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
}

export default function Discover() {
  const [categories, setCategories] = useState([])
  const [counts, setCounts] = useState({})
  const [allArticles, setAllArticles] = useState([])
  const [category, setCategory] = useState('推荐')
  const [slide, setSlide] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reload, setReload] = useState(0)
  const navigate = useNavigate()
  const heroRef = useRef(null)
  const promoRef = useRef(null)
  const feedRef = useRef(null)
  const touchX = useRef(0)

  useEffect(() => {
    let alive = true
    setLoading(true)
    setError('')
    Promise.all([getCategories(), getArticles('全部')])
      .then(([catData, artData]) => {
        if (!alive) return
        setCategories(catData.categories)
        setCounts(catData.counts || {})
        setAllArticles(artData.articles)
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
    if (allArticles.length < 2) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = setInterval(() => setSlide((s) => (s + 1) % Math.min(allArticles.length, 3)), 4500)
    return () => clearInterval(id)
  }, [allArticles.length])

  const hero = allArticles.slice(0, 3)
  const tickerItems = allArticles.slice(0, 5)
  const feed = category === '推荐' ? allArticles : allArticles.filter((a) => a.category === category)

  function goCategory(name) {
    setCategory(name)
    scrollTo(feedRef.current)
  }

  function onFunc(key) {
    if (key === 'today') scrollTo(heroRef.current)
    else if (key === 'promo') scrollTo(promoRef.current)
    else if (key === 'library') scrollTo(feedRef.current)
    else if (key === 'search') navigate('/search')
    else if (key === 'fav') navigate('/profile')
  }

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

      <nav className="channel-row" aria-label="内容频道">
        {['推荐', ...categories].map((c) => (
          <button
            key={c}
            type="button"
            aria-pressed={c === category}
            className={'channel-item' + (c === category ? ' channel-on' : '')}
            onClick={() => goCategory(c)}
          >
            {c}
          </button>
        ))}
      </nav>

      <div className="ticker" aria-label="今日播报">
        <span className="ticker-dot" aria-hidden="true" />
        <div className="ticker-window">
          <div className="ticker-track">
            {[...tickerItems, ...tickerItems].map((a, i) => (
              <span key={i} className="ticker-item" aria-hidden={i >= tickerItems.length}>
                {a.title}
              </span>
            ))}
          </div>
        </div>
      </div>

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
          <div className="sk-row">
            <div className="sk sk-cover" />
            <div className="sk-lines">
              <div className="sk sk-line w-40" />
              <div className="sk sk-line w-90" />
            </div>
          </div>
          <div className="sk-row">
            <div className="sk sk-cover" />
            <div className="sk-lines">
              <div className="sk sk-line w-40" />
              <div className="sk sk-line w-90" />
            </div>
          </div>
        </div>
      )}

      {!loading && !error && hero.length > 0 && (
        <section
          className="carousel enter"
          ref={heroRef}
          aria-label="精选文章"
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
      )}

      {!loading && !error && (
        <button type="button" className="promo" ref={promoRef} onClick={() => goCategory('提示工程')}>
          <span className="promo-copy">
            <span className="promo-title">提示工程实战专题</span>
            <span className="promo-sub">收录 {counts['提示工程'] ?? 0} 篇文章，从原则到进阶技巧</span>
          </span>
          <span className="promo-go">
            点击进入专题
            <CaretRight size={13} />
          </span>
        </button>
      )}

      {!loading && !error && categories.length > 0 && (
        <section className="kong" aria-label="快捷入口">
          {categories.map((c) => {
            const Icon = catIcon(c)
            return (
              <button key={c} type="button" className="kong-cell" onClick={() => goCategory(c)}>
                <span className="kong-ico">
                  <Icon size={22} weight="duotone" aria-hidden="true" />
                  {counts[c] !== undefined && <span className="kong-badge">{counts[c]}</span>}
                </span>
                <span className="kong-name">{c}</span>
              </button>
            )
          })}
          {FUNCS.map(({ key, label, Icon }) => (
            <button key={key} type="button" className="kong-cell" onClick={() => onFunc(key)}>
              <span className="kong-ico kong-ico-fn">
                <Icon size={22} aria-hidden="true" />
              </span>
              <span className="kong-name">{label}</span>
            </button>
          ))}
        </section>
      )}

      {!loading && !error && (
        <p className="sub-eyebrow feed-head">{category === '推荐' ? '最新文章' : category}</p>
      )}

      {!loading && !error && feed.length === 0 && (
        <div className="empty enter">
          <div className="empty-art" aria-hidden="true">
            <Books size={23} />
          </div>
          <p className="empty-title typewriter">无匹配记录</p>
          <p className="empty-copy">该频道下暂无条目，切换上方频道看看。</p>
        </div>
      )}

      {!loading && !error && feed.length > 0 && (
        <section className="row-list" ref={feedRef} aria-label="文章列表">
          {feed.map((a, i) => (
            <Link key={a.id} to={'/article/' + a.id} className="row enter" style={{ '--i': i }}>
              <div className="cover" data-cat={a.category} />
              <div className="row-body">
                <span className="tag">{a.category}</span>
                <h3>{a.title}</h3>
                <p>{a.summary}</p>
                <div className="meta">
                  <Clock size={12} />
                  <span>{a.read_time}</span>
                </div>
              </div>
            </Link>
          ))}
        </section>
      )}
    </div>
  )
}
