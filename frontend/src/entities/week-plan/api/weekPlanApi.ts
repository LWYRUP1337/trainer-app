import dayjs from 'dayjs'
import { ApiError, request } from '@/shared/api/client'
import { db } from '@/shared/api/mockDb'
import type { ApplyPlanResult, ApplyPlanValues, SlotFormValues, WeekPlan } from '../model/types'

const sorted = (plan: WeekPlan): WeekPlan => ({
  ...plan,
  items: [...plan.items].sort((a, b) => a.weekday - b.weekday || a.startTime.localeCompare(b.startTime)),
})

export const weekPlanApi = {
  get: () => request<WeekPlan>(() => sorted(db.weekPlan)),

  addSlot: (values: SlotFormValues) =>
    request<WeekPlan>(() => {
      const clash = db.weekPlan.items.find(
        (i) => i.weekday === values.weekday && i.startTime < values.endTime && i.endTime > values.startTime,
      )
      if (clash) throw new ApiError(`Пересекается со слотом «${clash.title}» ${clash.startTime}–${clash.endTime}`, 'time_conflict')
      db.weekPlan.items.push({ id: db.seq.slot++, ...values, title: values.title.trim() })
      return sorted(db.weekPlan)
    }, 250),

  removeSlot: (id: number) =>
    request<WeekPlan>(() => {
      db.weekPlan.items = db.weekPlan.items.filter((i) => i.id !== id)
      return sorted(db.weekPlan)
    }, 150),

  /** Создаёт тренировки по шаблону на N недель; пересекающиеся пропускает. */
  apply: (values: ApplyPlanValues) =>
    request<ApplyPlanResult>(() => {
      if (db.weekPlan.items.length === 0) throw new ApiError('В плане недели нет тренировок')
      const result: ApplyPlanResult = { created: 0, skipped: [] }
      const athleteIds = db.athletes.filter((a) => a.isActive).map((a) => a.id)
      const first = dayjs(values.startDate)
      for (let offset = 0; offset < values.weeks * 7; offset++) {
        const day = first.add(offset, 'day')
        const weekday = day.day() === 0 ? 7 : day.day()
        for (const item of sorted(db.weekPlan).items.filter((i) => i.weekday === weekday)) {
          const [sh, sm] = item.startTime.split(':').map(Number)
          const [eh, em] = item.endTime.split(':').map(Number)
          const start = day.hour(sh).minute(sm).second(0)
          const end = day.hour(eh).minute(em).second(0)
          const clash = db.workouts.some((w) => dayjs(w.start).isBefore(end) && dayjs(w.end).isAfter(start))
          if (clash) {
            result.skipped.push({
              date: day.format('YYYY-MM-DD'),
              title: item.title,
              startTime: item.startTime,
              reason: 'Пересекается с другой тренировкой',
            })
            continue
          }
          db.workouts.push({
            id: db.seq.workout++,
            title: item.title,
            description: '',
            location: '',
            start: start.format(),
            end: end.format(),
            participants: athleteIds.map((athleteId) => ({ athleteId, status: 'planned' as const })),
          })
          result.created++
        }
      }
      return result
    }, 300),
}
