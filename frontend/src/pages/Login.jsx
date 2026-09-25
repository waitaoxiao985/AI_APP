import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login, register, setToken } from '../api.js'

export default function Login({ setUser }) {
  const [isRegister, setIsRegister] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  async function submit(e) {
    e.preventDefault()
    setError('')
    try {
      const data = isRegister
        ? await register(username, password, nickname)
        : await login(username, password)
      setToken(data.token)
      setUser(data.user)
      navigate('/profile')
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="page login-page">
      <div className="brand enter">
        <div className="logo-mark">知</div>
        <h1>AI 知识库</h1>
        <p className="slogan">学习大模型、提示工程与 AI 安全</p>
      </div>

      <form className="card login-card enter" style={{ '--i': 1 }} onSubmit={submit}>
        <h2>{isRegister ? '创建账号' : '欢迎回来'}</h2>

        <div className="field">
          <label htmlFor="username">用户名</label>
          <input
            id="username"
            placeholder="字母或数字"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="password">密码</label>
          <input
            id="password"
            type="password"
            placeholder="至少 6 位"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {isRegister && (
          <div className="field">
            <label htmlFor="nickname">昵称（选填）</label>
            <input
              id="nickname"
              placeholder="展示在「我的」页面"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
            />
          </div>
        )}

        {error && <p className="error">{error}</p>}

        <button type="submit">{isRegister ? '注册并登录' : '登录'}</button>

        <p className="switch" onClick={() => setIsRegister(!isRegister)}>
          {isRegister ? '已有账号？去登录' : '没有账号？去注册'}
        </p>
      </form>
    </div>
  )
}
