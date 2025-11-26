const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export type ApiOptions = RequestInit & { skipJson?: boolean }

export async function apiFetch(path: string, options: ApiOptions = {}) {
  const headers = new Headers(options.headers || {})

  // assume JSON by default
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  // Attach token if present
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token')
    if (token) headers.set('Authorization', `Bearer ${token}`)
  }

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
      credentials: options.credentials ?? 'same-origin'
    })

    if (options.skipJson) return res

    const text = await res.text()
    const data = text ? JSON.parse(text) : null

    if (!res.ok) {
      const message = (data && (data.erro || data.error || data.message)) || res.statusText
      const err: any = new Error(message)
      err.status = res.status
      err.response = data
      throw err
    }

    return data
  } catch (error: any) {
    // Se for erro de conexão (fetch failed), lança um erro mais amigável ou silencioso se preferir
    if (error.message === 'Failed to fetch') {
      console.warn(`Falha de conexão com ${API_BASE}${path}. O servidor pode estar offline.`)
    }
    throw error
  }
}

export default apiFetch
