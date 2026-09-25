import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Compass } from '@phosphor-icons/react'

export default function NotFound() {
  const navigate = useNavigate()

  return (
    <div className="page">
      <header className="page-head">
        <h1 className="page-title">页面不存在</h1>
        <p className="page-sub">这个地址下没有内容，可能链接已经变了</p>
      </header>

      <div className="center enter">
        <div className="empty-art" aria-hidden="true">
          <Compass size={24} />
        </div>
        <p className="empty-title typewriter">404 · 资源不存在</p>
        <p>该地址未返回内容。使用下方指令跳转到可用页面。</p>
        <div className="error-actions">
          <button onClick={() => navigate('/')}>回到发现</button>
          <button className="btn-text" onClick={() => navigate('/search')}>
            去搜索
          </button>
        </div>
      </div>
    </div>
  )
}
