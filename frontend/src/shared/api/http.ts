import { ApiError, toApiError } from './errors'

const API_PREFIX = '/api/v1'

type QueryValue = string | number | boolean | null | undefined

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  query?: Record<string, QueryValue>
  json?: unknown
  form?: Record<string, string>
  anonymous?: boolean
}

export interface Page<T> {
  items: T[]
  total: number
}

let accessToken: string | null = null
let refreshing: Promise<boolean> | null = null
let handleUnauthorized = () => {}

export const setAccessToken = (token: string | null) => {
  accessToken = token
}

export const setUnauthorizedHandler = (handler: () => void) => {
  handleUnauthorized = handler
}

function buildUrl(path: string, query: RequestOptions['query'] = {}) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== '') params.set(key, String(value))
  }
  const search = params.toString()
  return `${API_PREFIX}${path}${search ? `?${search}` : ''}`
}

async function send(path: string, { method = 'GET', query, json, form }: RequestOptions) {
  const headers: Record<string, string> = {}
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`
  let body: BodyInit | undefined
  if (json !== undefined) {
    headers['Content-Type'] = 'application/json'
    body = JSON.stringify(json)
  } else if (form) {
    body = new URLSearchParams(form)
  }
  try {
    return await fetch(buildUrl(path, query), { method, headers, body, credentials: 'same-origin' })
  } catch {
    throw new ApiError('Нет связи с сервером. Проверьте подключение и повторите попытку.', 'network')
  }
}

export function refreshAccessToken(): Promise<boolean> {
  refreshing ??= send('/auth/refresh', { method: 'POST' })
    .then(async (response) => {
      if (!response.ok) return false
      const { access_token } = (await response.json()) as { access_token: string }
      setAccessToken(access_token)
      return true
    })
    .catch(() => false)
    .finally(() => {
      refreshing = null
    })
  return refreshing
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  let response = await send(path, options)
  if (response.status === 401 && !options.anonymous) {
    if (await refreshAccessToken()) {
      response = await send(path, options)
    } else {
      setAccessToken(null)
      handleUnauthorized()
    }
  }
  if (!response.ok) throw await toApiError(response)
  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}
