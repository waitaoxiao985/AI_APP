import React from 'react'
import { Clock, Hourglass, CaretRight } from '@phosphor-icons/react'

// 安全资讯来源到单色体系分级的映射；未登记的源用 neutral 兜底
const SOURCE_TONES = {
  FreeBuf: 'tone-1',
  嘶吼: 'tone-2',
  Krebs: 'tone-3',
  BleepingComputer: 'tone-4',
  'The Hacker News': 'tone-5'
}

function sourceTone(source) {
  return SOURCE_TONES[source] || 'tone-neutral'
}

function parseList(raw) {
  if (!raw) return []
  if (Array.isArray(raw)) return raw
  try {
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? arr.filter((x) => x && String(x).trim()) : []
  } catch {
    return []
  }
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function relativeTime(publishedAt) {
  if (!publishedAt) return ''
  const date = new Date(publishedAt)
  if (Number.isNaN(date.getTime())) return ''
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minute = 60 * 1000
  const hour = 60 * minute
  if (diff < minute) return '刚刚'
  if (diff < hour) return Math.floor(diff / minute) + ' 分钟前'
  const dayDiff = Math.round((startOfDay(now) - startOfDay(date)) / (24 * hour))
  if (dayDiff <= 0) return Math.floor(diff / hour) + ' 小时前'
  if (dayDiff === 1) return '昨天'
  return date.getMonth() + 1 + '月' + date.getDate() + '日'
}

// 单条安全资讯卡片：复用 AI 快讯的 news-* 样式类（已含 hover/focus-visible 与 reduced-motion 降级）
export default function SecurityCard({ n, i }) {
  const time = relativeTime(n.published_at)
  const tags = parseList(n.tags)
  const keyPoints = parseList(n.key_points)
  const showSummary = n.summary && n.summary.trim().length >= 8
  return (
    <div className="news-row" key={n.id}>
      <div className="news-item enter" style={{ '--i': i }}>
        <div className="news-item-top">
          <span className={'news-chip news-chip-' + sourceTone(n.source)}>{n.source}</span>
          <span className="news-meta-right">
            {n.read_time && (
              <span className="news-readtime">
                <Hourglass size={11} />
                {n.read_time}
              </span>
            )}
            {time && (
              <span className="news-time" title={new Date(n.published_at).toLocaleString('zh-CN')}>
                <Clock size={11} />
                {time}
              </span>
            )}
          </span>
        </div>
        {n.title_zh ? (
          <>
            <h3 className="news-item-title" title={n.title_zh}>
              {n.title_zh}
            </h3>
            <p className="news-item-subtitle">{n.title}</p>
          </>
        ) : (
          <h3 className="news-item-title" title={n.title}>
            {n.title}
          </h3>
        )}
        {showSummary && <p className="news-item-summary">{n.summary}</p>}
        {tags.length > 0 && (
          <div className="news-tags">
            {tags.map((t) => (
              <span className="news-tag" key={t}>
                {t}
              </span>
            ))}
          </div>
        )}
        {keyPoints.length > 0 && (
          <ul className="news-keypoints">
            {keyPoints.map((p, idx) => (
              <li className="news-keypoint" key={idx}>
                {p}
              </li>
            ))}
          </ul>
        )}
      </div>
      <a
        className="news-card-foot news-readmore"
        href={n.link}
        target="_blank"
        rel="noopener noreferrer"
      >
        阅读原文
        <CaretRight size={12} />
      </a>
    </div>
  )
}
