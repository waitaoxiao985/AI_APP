import React, { useState } from 'react'
import { Bell } from '@phosphor-icons/react'
import { getVapidKey, subscribePush } from '../api.js'

// base64url -> Uint8Array，供 PushManager 订阅用
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const out = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i)
  return out
}

export default function PushToggle() {
  const [state, setState] = useState('idle') // idle | loading | on | off
  const [msg, setMsg] = useState('')

  const supported =
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window

  async function enable() {
    if (!supported) {
      setMsg('当前浏览器不支持推送')
      return
    }
    setState('loading')
    setMsg('')
    try {
      const reg = await navigator.serviceWorker.ready
      const { publicKey } = await getVapidKey()
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey)
      })
      await subscribePush(sub.toJSON())
      setState('on')
      setMsg('推送已开启，新闻更新会提醒你')
    } catch (e) {
      setState('off')
      if (Notification.permission === 'denied') {
        setMsg('通知权限被拒绝，请在浏览器设置里允许通知')
      } else {
        setMsg('开启失败：' + (e.message || '请重试'))
      }
    }
  }

  if (!supported) {
    return (
      <div className="push-row enter">
        <Bell size={17} />
        <div className="push-body">
          <strong>新闻更新推送</strong>
          <p>当前浏览器不支持桌面/移动推送</p>
        </div>
      </div>
    )
  }

  return (
    <div className="push-row enter">
      <Bell size={17} weight={state === 'on' ? 'fill' : 'regular'} />
      <div className="push-body">
        <strong>新闻更新推送</strong>
        <p>{msg || (state === 'on' ? '已开启' : '开启后，每日新闻更新会收到提醒')}</p>
      </div>
      {state === 'on' ? (
        <span className="push-on">已开启</span>
      ) : (
        <button className="btn-text" disabled={state === 'loading'} onClick={enable}>
          {state === 'loading' ? '开启中…' : '开启推送'}
        </button>
      )}
    </div>
  )
}
