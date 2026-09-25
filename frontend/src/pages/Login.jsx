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
      <h1 className="logo">AI 知识库</h1>
      <p className="slogan">学习大模型 · 提示工程 · AI 安全</p>
      <form className="card" onSubmit={submit}>
        <h2>{isRegister ? '注册' : '登录'}</h2>
        <input
          placeholder="用户名"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="password"
          placeholder="密码"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {isRegister && (
          <input
            placeholder="昵称（选填）"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
          />
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
