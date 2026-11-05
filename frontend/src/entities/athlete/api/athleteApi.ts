import { ApiError, db, request } from '@/shared/api'
import type { Athlete, AthleteFilter, AthleteFormValues, AthletePatch } from '../model/types'

function find(id: number) {
  const athlete = db.athletes.find((a) => a.id === id)
  if (!athlete) throw new ApiError('Спортсмен не найден', 'not_found')
  return athlete
}

const hasActiveInjury = (athleteId: number) =>
  db.injuries.some((i) => i.athleteId === athleteId && i.recoveredAt === null)

const withStatus = (athlete: Omit<Athlete, 'hasActiveInjury'>): Athlete => ({
  ...athlete,
  hasActiveInjury: hasActiveInjury(athlete.id),
})

export const athleteApi = {
  list: (params: { search: string; filter: AthleteFilter }) =>
    request<Athlete[]>(() => {
      const query = params.search.trim().toLowerCase()
      return db.athletes
        .map(withStatus)
        .filter((a) => !query || a.fullName.toLowerCase().includes(query))
        .filter((a) => {
          if (params.filter === 'active') return a.isActive
          if (params.filter === 'injured') return a.hasActiveInjury
          return true
        })
        .sort((a, b) => a.fullName.localeCompare(b.fullName, 'ru'))
    }),

  get: (id: number) => request<Athlete>(() => withStatus(find(id))),

  create: (values: AthleteFormValues) =>
    request<Athlete>(() => {
      const athlete = {
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
      return withStatus(athlete)
    }, 250),

  update: (id: number, patch: AthletePatch) => request<Athlete>(() => withStatus(Object.assign(find(id), patch)), 250),

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
