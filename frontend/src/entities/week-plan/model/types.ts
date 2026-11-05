export interface WeekPlanItem {
  id: number
  weekday: number
  startTime: string
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
  startDate: string
  weeks: number
}

export interface ApplyPlanResult {
  created: number
  skipped: { date: string; title: string; startTime: string; reason: string }[]
}
