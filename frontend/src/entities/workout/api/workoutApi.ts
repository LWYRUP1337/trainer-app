import dayjs from 'dayjs'
import { request } from '@/shared/api'
import type { AttendanceMark, AttendanceStatus, Workout, WorkoutFormValues, WorkoutPatch } from '../model/types'

interface WorkoutDto {
  id: number
  title: string
  description: string | null
  location: string | null
  starts_at: string
  ends_at: string
  participants: { athlete_id: number; athlete_name: string; status: AttendanceStatus }[]
}

const CALENDAR_LIMIT = 500

const toWorkout = (dto: WorkoutDto): Workout => ({
  id: dto.id,
  title: dto.title,
  description: dto.description ?? '',
  location: dto.location ?? '',
  start: dto.starts_at,
  end: dto.ends_at,
  participants: dto.participants.map((p) => ({ athleteId: p.athlete_id, athleteName: p.athlete_name, status: p.status })),
})

const list = async (query: Record<string, string | number>) =>
  (await request<WorkoutDto[]>('/workouts', { query })).map(toWorkout)

const toItems = (marks: AttendanceMark[]) => marks.map((m) => ({ athlete_id: m.athleteId, status: m.status }))

export const workoutApi = {
  listByMonth: (year: number, month: number) => {
    const start = dayjs().year(year).month(month).startOf('month')
    return list({ date_from: start.format(), date_to: start.add(1, 'month').format(), limit: CALENDAR_LIMIT })
  },

  upcoming: (limit: number) => list({ date_from: dayjs().format(), limit }),

  get: async (id: number) => toWorkout(await request<WorkoutDto>(`/workouts/${id}`)),

  create: async ({ title, start, end, location, athleteIds }: WorkoutFormValues) =>
    toWorkout(
      await request<WorkoutDto>('/workouts', {
        method: 'POST',
        json: { title, starts_at: start, ends_at: end, location: location?.trim() || null, athlete_ids: athleteIds },
      }),
    ),

  update: async (id: number, { title, description, location, start, end }: WorkoutPatch) =>
    toWorkout(
      await request<WorkoutDto>(`/workouts/${id}`, {
        method: 'PATCH',
        json: { title, description: description || null, location: location || null, starts_at: start, ends_at: end },
      }),
    ),

  remove: (id: number) => request<void>(`/workouts/${id}`, { method: 'DELETE' }),

  saveAttendance: async (id: number, marks: AttendanceMark[]) =>
    toWorkout(await request<WorkoutDto>(`/workouts/${id}/attendance`, { method: 'PUT', json: { items: toItems(marks) } })),

  addParticipants: (id: number, athleteIds: number[]) =>
    workoutApi.saveAttendance(
      id,
      athleteIds.map((athleteId) => ({ athleteId, status: 'planned' })),
    ),

  removeParticipant: async (id: number, athleteId: number) => {
    await request<void>(`/workouts/${id}/participants/${athleteId}`, { method: 'DELETE' })
    return workoutApi.get(id)
  },
}
