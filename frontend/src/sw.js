import { precacheAndRoute } from 'workbox-precaching'
import { registerRoute, NavigationRoute } from 'workbox-routing'
import { NetworkFirst, NetworkOnly } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'

// 预缓存（injectManifest 注入的清单）
precacheAndRoute(self.__WB_MANIFEST)

// SPA 导航回退到 index.html，排除 /api
registerRoute(
  new NavigationRoute(({ url }) => {
    if (url.pathname.startsWith('/api')) return new Response('', { status: 404 })
    return caches.match('/index.html', { ignoreSearch: true })
  })
)

// 文章类 API：网络优先，缓存兜底
registerRoute(
  ({ url }) => /^\/api\/(articles|categories)/.test(url.pathname),
  new NetworkFirst({
    cacheName: 'api-articles',
    networkTimeoutSeconds: 5,
    plugins: [new ExpirationPlugin({ maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 7 })]
  })
)

// 其余 API：仅网络
registerRoute(({ url }) => url.pathname.startsWith('/api'), new NetworkOnly())

// === Web Push 处理 ===
self.addEventListener('push', (event) => {
  let data = { title: 'AI 知识库', body: '有新内容更新', url: '/' }
  try {
    if (event.data) data = { ...data, ...event.data.json() }
  } catch (e) {
    /* 非 JSON，用默认值 */
  }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/pwa-192x192.png',
      badge: '/pwa-64x64.png',
      data: { url: data.url || '/' },
      tag: 'ai-app-news'
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = (event.notification.data && event.notification.data.url) || '/'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if ('focus' in c) {
          c.navigate(url)
          return c.focus()
        }
      }
      if (clients.openWindow) return clients.openWindow(url)
    })
  )
})

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting()
})
