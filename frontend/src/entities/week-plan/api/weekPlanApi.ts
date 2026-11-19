import { request } from '@/shared/api'
import type { ApplyPlanResult, ApplyPlanValues, SlotFormValues, WeekPlan } from '../model/types'

interface WeekPlanDto {
  id: number
  title: string
  items: { id: number; weekday: number; start_time: string; end_time: string; title: string }[]
}

interface ApplyResultDto {
  created_count: number
  skipped: { date: string; title: string; start_time: string; reason: string }[]
}

const DEFAULT_TITLE = 'Шаблон недели'
const hhmm = (time: string) => time.slice(0, 5)

const toWeekPlan = (dto: WeekPlanDto): WeekPlan => ({
  id: dto.id,
  title: dto.title,
  items: dto.items.map((i) => ({ id: i.id, weekday: i.weekday, startTime: hhmm(i.start_time), endTime: hhmm(i.end_time), title: i.title })),
})

export const weekPlanApi = {
  current: async (): Promise<WeekPlan | null> => {
    const [plan] = await request<WeekPlanDto[]>('/week-plans')
    return plan ? toWeekPlan(plan) : null
  },

  create: async () => toWeekPlan(await request<WeekPlanDto>('/week-plans', { method: 'POST', json: { title: DEFAULT_TITLE } })),

  addSlot: async (planId: number, { weekday, startTime, endTime, title }: SlotFormValues) =>
    toWeekPlan(
      await request<WeekPlanDto>(`/week-plans/${planId}/items`, {
        method: 'POST',
        json: { weekday, start_time: startTime, end_time: endTime, title },
      }),
    ),

  removeSlot: async (planId: number, itemId: number) => {
    await request<void>(`/week-plans/${planId}/items/${itemId}`, { method: 'DELETE' })
    return toWeekPlan(await request<WeekPlanDto>(`/week-plans/${planId}`))
  },

  apply: async (planId: number, { startDate, weeks, athleteIds }: ApplyPlanValues): Promise<ApplyPlanResult> => {
    const result = await request<ApplyResultDto>(`/week-plans/${planId}/apply`, {
      method: 'POST',
      json: {
        start_date: startDate,
        weeks,
        athlete_ids: athleteIds,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
    })
    return {
      created: result.created_count,
      skipped: result.skipped.map((s) => ({ date: s.date, title: s.title, startTime: hhmm(s.start_time), reason: s.reason })),
    }
  },
}
