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

export function getArticles(category) {
  const q = category && category !== '全部' ? '?category=' + encodeURIComponent(category) : ''
  return request('/articles' + q)
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
