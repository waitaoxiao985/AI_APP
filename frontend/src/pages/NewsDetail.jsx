import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { CaretLeft, CaretRight, Clock, LinkSimple } from '@phosphor-icons/react'
import { getNewsItem } from '../api.js'

export default function NewsDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true
    setLoading(true)
    setError('')
    getNewsItem(id)
      .then((data) => {
        if (!alive) return
        setItem(data.news)
        setLoading(false)
      })
      .catch((err) => {
        if (!alive) return
        setError(err.message || '快讯加载失败')
        setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [id])

  const body =
    item && item.content && item.content.trim().length >= 60 ? item.content : '';
  const paragraphs = body ? body.split('\n\n').filter((p) => p.trim()) : [];
  const snippet = item && !body ? (item.excerpt || '').trim() : '';
  const showSnippet = snippet.length >= 30;

  return (
    <div className="page detail-page">
      <div className="detail-bar">
        <button className="icon-btn" onClick={() => navigate(-1)} aria-label="返回">
          <CaretLeft size={20} />
        </button>
      </div>

      {loading && (
        <div aria-hidden="true">
          <div className="sk sk-line w-45 h-title" />
          <div className="sk sk-line w-88" />
          <div className="sk sk-line w-60" />
          <div style={{ height: 24 }} />
          {[0, 1, 2, 3].map((i) => (
            <div className="sk sk-line" key={i} style={{ width: '100%', height: 14, marginBottom: 16 }} />
          ))}
        </div>
      )}

      {error && (
        <div className="error enter" role="alert">
          {error}
        </div>
      )}

      {!loading && !error && item && (
        <div className="enter">
          <div className="news-item-top">
            <span className="tag">{item.source}</span>
            <span className="news-time">
              <Clock size={11} />
              {item.published_at ? new Date(item.published_at).toLocaleDateString('zh-CN') : ''}
            </span>
          </div>
          <h1>{item.title}</h1>

          {paragraphs.length > 0 && (
            <div className="content">
              {paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          )}

          {!body && (
            <div className="news-lead enter" style={{ '--i': 1 }}>
              <p className="news-lead-title">源站未提供正文</p>
              <p className="news-lead-copy">
                该条目的 RSS 未附完整正文，本应用不做全文提取。
                点击下方「阅读原文」前往源站阅读。
              </p>
              {showSnippet && <p className="news-lead-snippet">{snippet}</p>}
            </div>
          )}
        </div>
      )}

      {!loading && item && (
        <div className="action-bar">
          <a className="action-btn" href={item.link} target="_blank" rel="noopener noreferrer">
            <LinkSimple size={16} />
            阅读原文
            <CaretRight size={13} />
          </a>
        </div>
      )}
    </div>
  )
}
