// In dev, Vite proxies /api → localhost:8000. In prod, point to the backend host.
const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '/api'

export class ApiError extends Error {
  constructor(
    public status: number,
    public detail: string,
    public data?: Record<string, unknown>,
  ) {
    super(detail)
    this.name = 'ApiError'
  }
}

let isRefreshing = false
let refreshPromise: Promise<boolean> | null = null

async function tryRefreshToken(): Promise<boolean> {
  if (isRefreshing && refreshPromise) return refreshPromise
  isRefreshing = true
  refreshPromise = (async () => {
    const token = localStorage.getItem('admin_token')
    if (!token) return false
    try {
      const res = await fetch(BASE_URL + '/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_token: token }),
      })
      if (!res.ok) return false
      const data = await res.json()
      localStorage.setItem('admin_token', data.access_token)
      return true
    } catch {
      return false
    } finally {
      isRefreshing = false
      refreshPromise = null
    }
  })()
  return refreshPromise
}

async function handleResponse<T>(res: Response, retry: () => Promise<T>): Promise<T> {
  if (res.status === 401) {
    const refreshed = await tryRefreshToken()
    if (refreshed) return retry()
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_id')
    localStorage.removeItem('admin_name')
    localStorage.removeItem('admin_email')
    localStorage.removeItem('admin_is_super')
    window.location.href = '/admin/login'
    throw new ApiError(401, 'Session expired')
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }))
    const detail = typeof body.detail === 'string' ? body.detail : res.statusText
    throw new ApiError(res.status, detail, body)
  }
  return res.json() as Promise<T>
}

function authHeader(): Record<string, string> {
  const token = localStorage.getItem('admin_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function fetchWithRefresh(input: RequestInfo, init?: RequestInit): Promise<Response> {
  const res = await fetch(input, init)
  if (res.status === 401) {
    const token = localStorage.getItem('admin_token')
    if (token) {
      const refreshed = await tryRefreshToken()
      if (refreshed) {
        const newToken = localStorage.getItem('admin_token')
        return fetch(input, {
          ...init,
          headers: { ...init?.headers as Record<string, string>, Authorization: `Bearer ${newToken}` },
        })
      }
    }
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_id')
    localStorage.removeItem('admin_name')
    localStorage.removeItem('admin_email')
    localStorage.removeItem('admin_is_super')
    window.location.href = '/admin/login'
  }
  return res
}

export async function get<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(BASE_URL + path, window.location.origin)
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  const res = await fetchWithRefresh(url.toString(), { headers: authHeader() })
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }))
    throw new ApiError(res.status, body.detail ?? res.statusText, body)
  }
  return res.json() as Promise<T>
}

export async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetchWithRefresh(BASE_URL + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }))
    throw new ApiError(res.status, body.detail ?? res.statusText, body)
  }
  return res.json() as Promise<T>
}

export async function patch<T>(path: string, body: unknown): Promise<T> {
  const res = await fetchWithRefresh(BASE_URL + path, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }))
    throw new ApiError(res.status, body.detail ?? res.statusText, body)
  }
  return res.json() as Promise<T>
}

export async function del(path: string): Promise<void> {
  const res = await fetchWithRefresh(BASE_URL + path, {
    method: 'DELETE',
    headers: authHeader(),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }))
    throw new ApiError(res.status, body.detail ?? res.statusText)
  }
}
