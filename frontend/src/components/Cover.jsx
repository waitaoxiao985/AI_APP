import React from 'react'

// 文章封面：有 cover 图则渲染（统一蓝色双色调，见 .cover-img），无则回退到 CSS 渐变底
export default function Cover({ category, src, alt = '' }) {
  return (
    <div className="cover" data-cat={category}>
      {src ? <img className="cover-img" src={src} alt={alt} loading="lazy" /> : null}
    </div>
  )
}
