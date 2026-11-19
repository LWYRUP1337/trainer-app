import type { Dayjs } from 'dayjs'
import { DATE_API } from '@/shared'
import { request } from '@/shared/api'
import type { AthleteAttendance, DashboardStats, MarkedStatus, SummaryReport } from '../model/types'

interface SummaryDto {
  workouts_held: number
  attendance_percent: number
  new_injuries: number
}

interface AttendanceDto {
  items: { athlete_id: number; full_name: string; present: number; absent: number; excused: number; percent: number }[]
}

interface AthleteAttendanceDto {
  present: number
  total: number
  percent: number
  history: { workout_id: number; title: string; starts_at: string; status: MarkedStatus }[]
}

interface DashboardDto {
  active_athletes: number
  active_injuries: number
  upcoming_workouts: number
}

export const reportApi = {
  summary: async (from: Dayjs, to: Dayjs): Promise<SummaryReport> => {
    const query = { date_from: from.format(DATE_API), date_to: to.format(DATE_API) }
    const [summary, attendance] = await Promise.all([
      request<SummaryDto>('/reports/summary', { query }),
      request<AttendanceDto>('/reports/attendance', { query }),
    ])
    return {
      held: summary.workouts_held,
      averagePercent: summary.attendance_percent,
      newInjuries: summary.new_injuries,
      rows: attendance.items
        .filter((r) => r.present + r.absent + r.excused > 0)
        .map((r) => ({
          athleteId: r.athlete_id,
          fullName: r.full_name,
          present: r.present,
          absent: r.absent,
          excused: r.excused,
          percent: r.percent,
        })),
    }
  },

  athleteAttendance: async (athleteId: number): Promise<AthleteAttendance> => {
    const dto = await request<AthleteAttendanceDto>(`/reports/athletes/${athleteId}/attendance`)
    return {
      present: dto.present,
      total: dto.total,
      percent: dto.percent,
      history: dto.history.map((h) => ({ workoutId: h.workout_id, title: h.title, start: h.starts_at, status: h.status })),
    }
  },

  dashboard: async (): Promise<DashboardStats> => {
    const dto = await request<DashboardDto>('/reports/dashboard')
    return { activeAthletes: dto.active_athletes, activeInjuries: dto.active_injuries, upcoming: dto.upcoming_workouts }
  },
}
