import React, { useState, useEffect } from 'react'
import { Routes, Route, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { Compass, MagnifyingGlass, User } from '@phosphor-icons/react'
import { getToken, removeToken, me } from './api.js'
import Login from './pages/Login.jsx'
import Discover from './pages/Discover.jsx'
import Search from './pages/Search.jsx'
import Article from './pages/Article.jsx'
import Profile from './pages/Profile.jsx'

export default function App() {
  const [user, setUser] = useState(null)
  const navigate = useNavigate()
  const location = useLocation()

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

  const hideTab = location.pathname.startsWith('/login') || location.pathname.startsWith('/article/')

  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<Discover />} />
        <Route path="/search" element={<Search />} />
        <Route path="/profile" element={<Profile user={user} logout={logout} />} />
        <Route path="/login" element={<Login setUser={setUser} />} />
        <Route path="/article/:id" element={<Article user={user} />} />
      </Routes>

      {!hideTab && (
        <nav className="tabbar">
          <NavLink to="/" end className={({ isActive }) => 'tab' + (isActive ? ' active' : '')}>
            {({ isActive }) => (
              <>
                <Compass size={23} weight={isActive ? 'fill' : 'regular'} />
                <span>发现</span>
              </>
            )}
          </NavLink>
          <NavLink to="/search" className={({ isActive }) => 'tab' + (isActive ? ' active' : '')}>
            {({ isActive }) => (
              <>
                <MagnifyingGlass size={23} weight={isActive ? 'fill' : 'regular'} />
                <span>搜索</span>
              </>
            )}
          </NavLink>
          <NavLink to="/profile" className={({ isActive }) => 'tab' + (isActive ? ' active' : '')}>
            {({ isActive }) => (
              <>
                <User size={23} weight={isActive ? 'fill' : 'regular'} />
                <span>我的</span>
              </>
            )}
          </NavLink>
        </nav>
      )}
    </div>
  )
}
