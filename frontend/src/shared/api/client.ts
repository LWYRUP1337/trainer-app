export type ApiErrorCode = 'not_found' | 'time_conflict' | 'validation' | 'network'

export class ApiError extends Error {
  code: ApiErrorCode
  constructor(message: string, code: ApiErrorCode = 'validation') {
    super(message)
    this.code = code
  }
}

let simulateFailure = false
export const setSimulateFailure = (value: boolean) => {
  simulateFailure = value
}

export const clone = <T,>(value: T): T => structuredClone(value)

export function request<T>(handler: () => T, delayMs = 150): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    window.setTimeout(() => {
      if (simulateFailure) {
        reject(new ApiError('Нет связи с сервером. Проверьте подключение и повторите попытку.', 'network'))
        return
      }
      try {
        resolve(clone(handler()))
      } catch (error) {
        reject(error)
      }
    }, delayMs)
  })
}
