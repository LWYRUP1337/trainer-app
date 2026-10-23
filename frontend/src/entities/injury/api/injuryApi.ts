import dayjs from 'dayjs'
import { ApiError, request } from '@/shared/api/client'
import { db } from '@/shared/api/mockDb'
import type { Injury, InjuryFormValues } from '../model/types'

export const injuryApi = {
  list: (athleteId: number) =>
    request<Injury[]>(() =>
      db.injuries.filter((i) => i.athleteId === athleteId).sort((a, b) => b.startedAt.localeCompare(a.startedAt)),
    ),

  create: (athleteId: number, values: InjuryFormValues) =>
    request<Injury>(() => {
      const injury: Injury = {
        id: db.seq.injury++,
        athleteId,
        title: values.title.trim(),
        bodyPart: values.bodyPart.trim(),
        severity: values.severity,
        startedAt: values.startedAt,
        recoveredAt: null,
        notes: values.notes?.trim() ?? '',
      }
      db.injuries.push(injury)
      return injury
    }, 250),

  markRecovered: (id: number) =>
    request<Injury>(() => {
      const injury = db.injuries.find((i) => i.id === id)
      if (!injury) throw new ApiError('Травма не найдена', 'not_found')
      injury.recoveredAt = dayjs().format('YYYY-MM-DD')
      return injury
    }, 150),

  remove: (id: number) =>
    request<void>(() => {
      db.injuries = db.injuries.filter((i) => i.id !== id)
    }, 150),
}
