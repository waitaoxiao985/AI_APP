const KEY = 'ai_app_token'

export function getToken() {
  return localStorage.getItem(KEY)
}

export function setToken(token) {
  localStorage.setItem(KEY, token)
}

export function removeToken() {
  localStorage.removeItem(KEY)
}

async function request(path, options = {}) {
  const headers = { 'Content-Type': 'application/json' }
  const token = getToken()
  if (token) headers.Authorization = 'Bearer ' + token
  const res = await fetch('/api' + path, { ...options, headers })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || '请求失败')
  return data
}

export function register(username, password, nickname) {
  return request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, password, nickname })
  })
}

export function login(username, password) {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password })
  })
}

export function me() {
  return request('/auth/me')
}

export function getCategories() {
  return request('/articles/categories')
}

export function getArticles(category, limit) {
  const params = []
  if (category && category !== '全部') params.push('category=' + encodeURIComponent(category))
  if (limit) params.push('limit=' + String(limit))
  return request('/articles' + (params.length ? '?' + params.join('&') : ''))
}

export function getDaily() {
  return request('/articles/daily')
}

export function getHotSearch() {
  return request('/articles/search/hot')
}

export function getBookmarksRecent(limit) {
  return request('/bookmarks/recent?limit=' + limit)
}

export function getNews(limit, offset) {
  const params = new URLSearchParams()
  if (limit) params.set('limit', String(limit))
  if (offset) params.set('offset', String(offset))
  const qs = params.toString()
  return request('/news' + (qs ? '?' + qs : ''))
}

export function getNewsItem(id) {
  return request('/news/' + id)
}

export function getDailyNews(category, limit) {
  const params = new URLSearchParams()
  if (category) params.set('category', category)
  if (limit) params.set('limit', String(limit))
  const qs = params.toString()
  return request('/daily-news' + (qs ? '?' + qs : ''))
}

export function getNewsToday(date, category, limit, offset) {
  const params = new URLSearchParams()
  if (date) params.set('date', date)
  if (category && category !== '全部') params.set('category', category)
  if (limit) params.set('limit', String(limit))
  if (offset) params.set('offset', String(offset))
  const qs = params.toString()
  return request('/news/today' + (qs ? '?' + qs : ''))
}

export function getTopics() {
  return request('/topics')
}

export function getTopic(id) {
  return request('/topics/' + id)
}

export function searchArticles(keyword) {
  return request('/articles/search?q=' + encodeURIComponent(keyword))
}

export function getArticle(id) {
  return request('/articles/' + id)
}

export function getBookmarks() {
  return request('/bookmarks')
}

export function checkBookmark(articleId) {
  return request('/bookmarks/check/' + articleId)
}

export function addBookmark(articleId) {
  return request('/bookmarks', {
    method: 'POST',
    body: JSON.stringify({ article_id: articleId })
  })
}

export function removeBookmark(articleId) {
  return request('/bookmarks/' + articleId, { method: 'DELETE' })
}
