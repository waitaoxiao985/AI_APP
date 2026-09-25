import React, { useState, useEffect } from 'react'
import { Routes, Route, NavLink, useNavigate, useLocation } from 'react-router-dom'
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
          <NavLink to="/" end className="tab">发现</NavLink>
          <NavLink to="/search" className="tab">搜索</NavLink>
          <NavLink to="/profile" className="tab">我的</NavLink>
        </nav>
      )}
    </div>
  )
}
