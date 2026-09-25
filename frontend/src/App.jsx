import React, { useState, useEffect, useRef } from 'react'
import { Routes, Route, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { Compass, User } from '@phosphor-icons/react'
import { getToken, removeToken, me, getDaily } from './api.js'
import Login from './pages/Login.jsx'
import Discover from './pages/Discover.jsx'
import Search from './pages/Search.jsx'
import Article from './pages/Article.jsx'
import Profile from './pages/Profile.jsx'
import Topic from './pages/Topic.jsx'
import NotFound from './pages/NotFound.jsx'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [pathname])
  return null
}

/* 滚动触发入场 (visual_effects.scroll_effects.scroll_triggered_animations)
   异步数据晚于 Effect 到达，必须配合 MutationObserver；再加 1500ms 兜底，
   确保任何情况下内容都不会卡在 opacity:0。 */
function useReveal(pathname) {
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const all = () => document.querySelectorAll('.enter')

    if (reduce || !('IntersectionObserver' in window)) {
      all().forEach((el) => el.classList.add('in'))
      return
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('in')
            io.unobserve(e.target)
          }
        })
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.05 }
    )

    const seen = new WeakSet()
    const track = (root) => {
      if (!(root instanceof HTMLElement)) return
      const list = []
      if (root.classList.contains('enter')) list.push(root)
      if (root.querySelectorAll) root.querySelectorAll('.enter').forEach((n) => list.push(n))
      list.forEach((el) => {
        if (seen.has(el)) return
        seen.add(el)
        io.observe(el)
      })
    }

    all().forEach(track)

    const mo = new MutationObserver((muts) => {
      muts.forEach((m) => m.addedNodes.forEach(track))
    })
    mo.observe(document.body, { childList: true, subtree: true })

    const fallback = setTimeout(() => {
      document.querySelectorAll('.enter:not(.in)').forEach((el) => el.classList.add('in'))
    }, 1500)

    return () => {
      clearTimeout(fallback)
      mo.disconnect()
      io.disconnect()
    }
  }, [pathname])
}

/* 光标特效 (visual_effects.cursor_effects.spotlight)
   仅精确指针设备、且仅悬停在面板内部时显示。 */
function Spotlight() {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return

    let x = 0
    let y = 0
    let raf = 0

    const paint = () => {
      el.style.transform = `translate3d(${x}px, ${y}px, 0)`
      raf = 0
    }

    const move = (e) => {
      x = e.clientX
      y = e.clientY
      if (!raf) raf = requestAnimationFrame(paint)
      const target = e.target instanceof Element ? e.target : null
      const onPanel = !!(target && target.closest('.feature, .row, .center, .user-card, .login-card'))
      el.classList.toggle('on', onPanel)
    }

    const hide = () => el.classList.remove('on')

    window.addEventListener('pointermove', move, { passive: true })
    window.addEventListener('pointerleave', hide)
    return () => {
      if (raf) cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerleave', hide)
    }
  }, [])

  return <div className="spotlight" ref={ref} aria-hidden="true" />
}

function TodayRedirect() {
  const navigate = useNavigate()
  useEffect(() => {
    getDaily()
      .then((d) => navigate(d.articles.length ? '/article/' + d.articles[0].id : '/', { replace: true }))
      .catch(() => navigate('/', { replace: true }))
  }, [navigate])
  return null
}

export default function App() {
  const [user, setUser] = useState(null)
  const navigate = useNavigate()
  const location = useLocation()

  useReveal(location.pathname)

  useEffect(() => {
    if (getToken()) {
      me()
        .then((data) => setUser(data.user))
        .catch(() => removeToken())
    }
  }, [])

  function logout() {
    removeToken()
    setUser(null)
    navigate('/')
  }

  const hideTab =
    location.pathname.startsWith('/login') ||
    location.pathname.startsWith('/article/') ||
    location.pathname.startsWith('/topic/')

  return (
    <div className="app">
      <a className="skip-link" href="#main">跳到主要内容</a>
      <ScrollToTop />
      <Spotlight />

      <main id="main" tabIndex={-1}>
        <Routes>
          <Route path="/" element={<Discover user={user} />} />
          <Route path="/search" element={<Search />} />
          <Route path="/profile" element={<Profile user={user} logout={logout} />} />
          <Route path="/login" element={<Login setUser={setUser} />} />
          <Route path="/article/:id" element={<Article user={user} />} />
          <Route path="/topic/:id" element={<Topic />} />
          <Route path="/today" element={<TodayRedirect />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      {!hideTab && (
        <nav className="tabbar" aria-label="主导航">
          <NavLink to="/" end className={({ isActive }) => 'tab' + (isActive ? ' active' : '')}>
            {({ isActive }) => (
              <>
                <Compass size={21} weight={isActive ? 'fill' : 'regular'} />
                <span>发现</span>
              </>
            )}
          </NavLink>
          <NavLink to="/profile" className={({ isActive }) => 'tab' + (isActive ? ' active' : '')}>
            {({ isActive }) => (
              <>
                <User size={21} weight={isActive ? 'fill' : 'regular'} />
                <span>我的</span>
              </>
            )}
          </NavLink>
        </nav>
      )}
    </div>
  )
}
