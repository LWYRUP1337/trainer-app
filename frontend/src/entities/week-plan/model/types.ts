export interface WeekPlanItem {
  id: number
  weekday: number // 1 — понедельник ... 7 — воскресенье
  startTime: string // HH:mm
  endTime: string
  title: string
}

export interface WeekPlan {
  id: number
  title: string
  items: WeekPlanItem[]
}

export interface SlotFormValues {
  weekday: number
  startTime: string
  endTime: string
  title: string
}

export interface ApplyPlanValues {
  startDate: string // YYYY-MM-DD
  weeks: number
}

export interface ApplyPlanResult {
  created: number
  skipped: { date: string; title: string; startTime: string; reason: string }[]
}
