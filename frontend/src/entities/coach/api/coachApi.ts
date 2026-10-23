import { ApiError, request } from '@/shared/api/client'
import { db } from '@/shared/api/mockDb'
import type { Coach, CoachFormValues } from '../model/types'

export const coachApi = {
  get: () => request<Coach>(() => db.coach),
  update: (values: CoachFormValues) =>
    request<Coach>(() => Object.assign(db.coach, values), 250),

  login: (values: { email: string; password: string }) =>
    request<Coach>(() => {
      if (values.password !== 'demo1234') {
        throw new ApiError('Неверный email или пароль (в демо-режиме пароль: demo1234)')
      }
      return db.coach
    }, 250),
}
