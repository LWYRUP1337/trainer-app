import type { FormInstance } from 'antd'
import { ApiError } from '../api'

export const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : 'Произошла неизвестная ошибка'

export const conflictToField =
  (form: FormInstance, field: string) =>
  (error: unknown): boolean => {
    if (!(error instanceof ApiError) || error.code !== 'time_conflict') return false
    form.setFields([{ name: field, errors: [error.message] }])
    return true
  }
