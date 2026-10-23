import dayjs from 'dayjs'
import { ApiError, request } from '@/shared/api/client'
import { db } from '@/shared/api/mockDb'
import type { Participant, Workout, WorkoutDetails, WorkoutFormValues } from '../model/types'
import { WorkoutPatch } from '../model/types'

function find(id: number): Workout {
  const workout = db.workouts.find((w) => w.id === id)
  if (!workout) throw new ApiError('Тренировка не найдена', 'not_found')
  return workout
}

function toDetails(workout: Workout): WorkoutDetails {
  return {
    ...workout,
    participants: workout.participants.map((p) => ({
      ...p,
      athleteName: db.athletes.find((a) => a.id === p.athleteId)?.fullName ?? '—',
    })),
  }
}

const byStart = (a: Workout, b: Workout) => dayjs(a.start).valueOf() - dayjs(b.start).valueOf()

export const workoutApi = {
  listByMonth: (year: number, month: number) =>
    request<Workout[]>(() =>
      db.workouts
        .filter((w) => dayjs(w.start).year() === year && dayjs(w.start).month() === month)
        .sort(byStart),
    ),

  get: (id: number) => request<WorkoutDetails>(() => toDetails(find(id))),

  upcoming: (limit: number) =>
    request<Workout[]>(() =>
      db.workouts
        .filter((w) => dayjs(w.start).isAfter(dayjs()))
        .sort(byStart)
        .slice(0, limit),
    ),

  create: (values: WorkoutFormValues) =>
    request<Workout>(() => {
      const start = dayjs(values.start)
      const end = dayjs(values.end)
      if (!end.isAfter(start)) throw new ApiError('Конец тренировки должен быть позже начала')
      const clash = db.workouts.find((w) => dayjs(w.start).isBefore(end) && dayjs(w.end).isAfter(start))
      if (clash) {
        throw new ApiError(
          `Время пересекается с тренировкой «${clash.title}» ${dayjs(clash.start).format('DD.MM HH:mm')}–${dayjs(clash.end).format('HH:mm')}`,
          'time_conflict',
        )
      }
      const workout: Workout = {
        id: db.seq.workout++,
        title: values.title.trim(),
        description: '',
        location: values.location?.trim() ?? '',
        start: values.start,
        end: values.end,
        participants: values.athleteIds.map((athleteId) => ({ athleteId, status: 'planned' })),
      }
      db.workouts.push(workout)
      return workout
    }, 250),

  saveAttendance: (id: number, participants: Participant[]) =>
    request<WorkoutDetails>(() => {
      const workout = find(id)
      workout.participants = participants
      return toDetails(workout)
    }, 250),


  update: (id: number, patch: WorkoutPatch) =>
    request<WorkoutDetails>(() => {
      const workout = find(id)
      const start = dayjs(patch.start ?? workout.start)
      const end = dayjs(patch.end ?? workout.end)
      if (!end.isAfter(start)) throw new ApiError('Конец тренировки должен быть позже начала')
      const clash = db.workouts.find(
        (w) => w.id !== id && dayjs(w.start).isBefore(end) && dayjs(w.end).isAfter(start),
      )
      if (clash) {
        throw new ApiError(
          `Время пересекается с тренировкой «${clash.title}» ${dayjs(clash.start).format('DD.MM HH:mm')}–${dayjs(clash.end).format('HH:mm')}`,
          'time_conflict',
        )
      }
      Object.assign(workout, patch)
      return toDetails(workout)
    }, 250),

  remove: (id: number) =>
    request<void>(() => {
      find(id) // если тренировки нет, будет ошибка «не найдена»
      db.workouts = db.workouts.filter((w) => w.id !== id)
    }, 250),


  addParticipants: (id: number, athleteIds: number[]) =>
    request<WorkoutDetails>(() => {
      const workout = find(id)
      for (const athleteId of athleteIds) {
        if (!db.athletes.some((a) => a.id === athleteId)) throw new ApiError('Спортсмен не найден', 'not_found')
        if (!workout.participants.some((p) => p.athleteId === athleteId)) {
          workout.participants.push({ athleteId, status: 'planned' })
        }
      }
      return toDetails(workout)
    }, 250),
    

  removeParticipant: (id: number, athleteId: number) =>
    request<WorkoutDetails>(() => {
      const workout = find(id)
      if (!workout.participants.some((p) => p.athleteId === athleteId)) {
        throw new ApiError('Спортсмен не участвует в этой тренировке', 'not_found')
      }
      workout.participants = workout.participants.filter((p) => p.athleteId !== athleteId)
      return toDetails(workout)
    }, 250),
}
