const API_URL = import.meta.env.VITE_API_URL || ''
const TOKEN_KEY = 'minhal_token'

let _token = localStorage.getItem(TOKEN_KEY)

export function setToken(tok) {
  _token = tok
  if (tok) localStorage.setItem(TOKEN_KEY, tok)
  else localStorage.removeItem(TOKEN_KEY)
}

export function getToken() { return _token }

export function clearToken() {
  _token = null
  localStorage.removeItem(TOKEN_KEY)
}

async function request(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers }
  if (_token) headers['Authorization'] = `Bearer ${_token}`

  const url = `${API_URL}${path}`
  const res = await fetch(url, { ...options, headers })

  if (res.status === 401) {
    clearToken()
    window.location.href = '/login'
    throw new Error('Session expired')
  }

  if (!res.ok) {
    let msg = `Request failed (${res.status})`
    try { const err = await res.json(); msg = err.error || msg } catch {}
    throw new Error(msg)
  }

  if (res.status === 204) return null
  return res.json()
}

export const api = {
  get:    (path)       => request(path, { method: 'GET' }),
  post:   (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) }),
  patch:  (path, body) => request(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (path)       => request(path, { method: 'DELETE' }),
}
