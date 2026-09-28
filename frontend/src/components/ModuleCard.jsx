import { Link } from 'react-router-dom'
import { CaretRight } from '@phosphor-icons/react'

/* 标准化方框入口卡片：整卡可点，props 驱动（title/subtitle/icon/to）。
   预留卡后续仅需修改调用处的 props 即可更名并接入新功能。 */
export default function ModuleCard({ title, subtitle, icon: Icon, to }) {
  return (
    <Link to={to} className="module-card">
      <span className="module-card-ico">
        <Icon size={21} aria-hidden="true" />
      </span>
      <span className="module-card-title">{title}</span>
      {subtitle && <span className="module-card-sub">{subtitle}</span>}
      <span className="module-card-go">
        <CaretRight size={12} aria-hidden="true" />
      </span>
    </Link>
  )
}
