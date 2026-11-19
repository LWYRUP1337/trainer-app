export type ApiErrorCode =
  | 'network'
  | 'unauthorized'
  | 'forbidden'
  | 'not_found'
  | 'conflict'
  | 'time_conflict'
  | 'validation'
  | 'server'

export class ApiError extends Error {
  code: ApiErrorCode
  status: number

  constructor(message: string, code: ApiErrorCode, status = 0) {
    super(message)
    this.code = code
    this.status = status
  }
}

interface ErrorBody {
  detail?: unknown
  code?: string
}

const defaultMessages: Record<number, string> = {
  401: 'Требуется вход в систему',
  403: 'Недостаточно прав для этого действия',
  404: 'Запись не найдена',
}

const timeConflictCodes = new Set(['time_conflict', 'plan_items_overlap'])

function codeFrom(status: number, code?: string): ApiErrorCode {
  if (code && timeConflictCodes.has(code)) return 'time_conflict'
  if (status === 401) return 'unauthorized'
  if (status === 403) return 'forbidden'
  if (status === 404) return 'not_found'
  if (status === 409) return 'conflict'
  if (status >= 500) return 'server'
  return 'validation'
}

function messageFrom(detail: unknown, status: number): string {
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) {
    const messages = detail
      .map((item: { msg?: unknown }) => (typeof item.msg === 'string' ? item.msg.replace(/^Value error, /, '') : ''))
      .filter(Boolean)
    if (messages.length) return [...new Set(messages)].join('. ')
  }
  if (status >= 500) return 'Ошибка сервера. Попробуйте позже.'
  return defaultMessages[status] ?? 'Не удалось выполнить запрос'
}

export async function toApiError(response: Response): Promise<ApiError> {
  const body = (await response.json().catch(() => ({}))) as ErrorBody
  return new ApiError(messageFrom(body.detail, response.status), codeFrom(response.status, body.code), response.status)
}
