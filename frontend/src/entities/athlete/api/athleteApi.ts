import { ApiError, request } from '@/shared/api/client'
import { db } from '@/shared/api/mockDb'
import type { Athlete, AthleteFilter, AthleteFormValues, AthleteListItem } from '../model/types'

function find(id: number): Athlete {
  const athlete = db.athletes.find((a) => a.id === id)
  if (!athlete) throw new ApiError('Спортсмен не найден', 'not_found')
  return athlete
}

const hasActiveInjury = (athleteId: number) =>
  db.injuries.some((i) => i.athleteId === athleteId && i.recoveredAt === null)

export const athleteApi = {
  list: (params: { search: string; filter: AthleteFilter }) =>
    request<AthleteListItem[]>(() => {
      const query = params.search.trim().toLowerCase()
      return db.athletes
        .filter((a) => !query || a.fullName.toLowerCase().includes(query))
        .filter((a) => {
          if (params.filter === 'active') return a.isActive
          if (params.filter === 'injured') return hasActiveInjury(a.id)
          return true
        })
        .map((a) => ({ ...a, hasActiveInjury: hasActiveInjury(a.id) }))
        .sort((a, b) => a.fullName.localeCompare(b.fullName, 'ru'))
    }),

  get: (id: number) => request<Athlete>(() => find(id)),

  create: (values: AthleteFormValues) =>
    request<Athlete>(() => {
      const athlete: Athlete = {
        id: db.seq.athlete++,
        fullName: values.fullName.trim(),
        birthDate: values.birthDate ?? null,
        heightCm: values.heightCm ?? null,
        weightKg: values.weightKg ?? null,
        phone: values.phone?.trim() ?? '',
        isActive: true,
        notes: '',
        nutritionPlan: '',
      }
      db.athletes.push(athlete)
      return athlete
    }, 250),

  update: (id: number, patch: Partial<Omit<Athlete, 'id'>>) =>
    request<Athlete>(() => Object.assign(find(id), patch), 250),

  remove: (id: number) =>
    request<void>(() => {
      find(id)
      db.athletes = db.athletes.filter((a) => a.id !== id)
      db.injuries = db.injuries.filter((i) => i.athleteId !== id)
      db.workouts.forEach((w) => {
        w.participants = w.participants.filter((p) => p.athleteId !== id)
      })
    }, 250),
}
