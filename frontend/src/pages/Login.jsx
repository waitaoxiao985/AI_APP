import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CaretLeft } from '@phosphor-icons/react'
import { login, register, setToken } from '../api.js'

export default function Login({ setUser }) {
  const [isRegister, setIsRegister] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const navigate = useNavigate()

  function validate() {
    const errs = {}
    if (!username.trim()) errs.username = '请填写用户名'
    else if (!/^[A-Za-z0-9_]{2,50}$/.test(username.trim()))
      errs.username = '用户名支持字母、数字和下划线，2 到 50 位'
    if (!password) errs.password = '请填写密码'
    else if (isRegister && password.length < 6) errs.password = '密码至少 6 位'
    if (isRegister && nickname.length > 50) errs.nickname = '昵称最长 50 位'
    setFieldErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function submit(e) {
    e.preventDefault()
    setError('')
    if (!validate()) return
    setPending(true)
    try {
      const data = isRegister
        ? await register(username.trim(), password, nickname.trim() || undefined)
        : await login(username.trim(), password)
      setToken(data.token)
      setUser(data.user)
      navigate('/profile')
    } catch (err) {
      setError(err.message)
    } finally {
      setPending(false)
    }
  }

  function switchMode() {
    setIsRegister(!isRegister)
    setFieldErrors({})
    setError('')
  }

  return (
    <div className="page login-page">
      <div className="back-row">
        <button className="icon-btn" onClick={() => navigate(-1)} aria-label="返回">
          <CaretLeft size={20} />
        </button>
      </div>

      <header className="brand enter">
        <div className="logo-mark" aria-hidden="true">知</div>
        <h1>AI 知识库</h1>
        <p className="slogan">学习大模型、提示工程与 AI 安全</p>
      </header>

      <form className="login-card enter" style={{ '--i': 1 }} onSubmit={submit} noValidate>
        <h2>{isRegister ? '创建账号' : '欢迎回来'}</h2>

        <div className="field">
          <label htmlFor="username">用户名</label>
          <input
            id="username"
            placeholder="字母、数字或下划线"
            value={username}
            autoComplete="username"
            aria-invalid={fieldErrors.username ? 'true' : undefined}
            onChange={(e) => setUsername(e.target.value)}
          />
          {fieldErrors.username && <p className="field-error">{fieldErrors.username}</p>}
        </div>

        <div className="field">
          <label htmlFor="password">密码</label>
          <input
            id="password"
            type="password"
            placeholder={isRegister ? '至少 6 位' : '输入密码'}
            value={password}
            autoComplete={isRegister ? 'new-password' : 'current-password'}
            aria-invalid={fieldErrors.password ? 'true' : undefined}
            onChange={(e) => setPassword(e.target.value)}
          />
          {fieldErrors.password && <p className="field-error">{fieldErrors.password}</p>}
        </div>

        {isRegister && (
          <div className="field">
            <label htmlFor="nickname">昵称（选填）</label>
            <input
              id="nickname"
              placeholder="展示在「我的」页面"
              value={nickname}
              autoComplete="nickname"
              aria-invalid={fieldErrors.nickname ? 'true' : undefined}
              onChange={(e) => setNickname(e.target.value)}
            />
            {fieldErrors.nickname && <p className="field-error">{fieldErrors.nickname}</p>}
          </div>
        )}

        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}

        <button type="submit" disabled={pending}>
          {pending ? '处理中…' : isRegister ? '注册并登录' : '登录'}
        </button>

        <button type="button" className="switch" onClick={switchMode}>
          {isRegister ? '已有账号？去登录' : '没有账号？去注册'}
        </button>
      </form>
    </div>
  )
}
