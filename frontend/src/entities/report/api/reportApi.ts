import dayjs, { type Dayjs } from 'dayjs'
import { request } from '@/shared/api/client'
import { db } from '@/shared/api/mockDb'
import type { AthleteAttendance, AttendanceRow, DashboardStats, SummaryReport } from '../model/types'

const percent = (present: number, total: number) => (total ? Math.round((present * 100) / total) : 0)

export const reportApi = {
  summary: (from: Dayjs, to: Dayjs) =>
    request<SummaryReport>(() => {
      const inRange = db.workouts.filter(
        (w) => !dayjs(w.start).isBefore(from.startOf('day')) && !dayjs(w.start).isAfter(to.endOf('day')),
      )
      const rows: AttendanceRow[] = db.athletes
        .filter((a) => a.isActive)
        .map((a) => {
          let present = 0
          let absent = 0
          let excused = 0
          for (const w of inRange) {
            const p = w.participants.find((x) => x.athleteId === a.id)
            if (p?.status === 'present') present++
            if (p?.status === 'absent') absent++
            if (p?.status === 'excused') excused++
          }
          return { athleteId: a.id, fullName: a.fullName, present, absent, excused, percent: percent(present, present + absent + excused) }
        })
        .filter((r) => r.present + r.absent + r.excused > 0)
      const totalPresent = rows.reduce((s, r) => s + r.present, 0)
      const totalCounted = rows.reduce((s, r) => s + r.present + r.absent + r.excused, 0)
      return {
        held: inRange.filter((w) => dayjs(w.end).isBefore(dayjs())).length,
        averagePercent: percent(totalPresent, totalCounted),
        newInjuries: db.injuries.filter(
          (i) => !dayjs(i.startedAt).isBefore(from.startOf('day')) && !dayjs(i.startedAt).isAfter(to.endOf('day')),
        ).length,
        rows,
      }
    }),

  athleteAttendance: (athleteId: number) =>
    request<AthleteAttendance>(() => {
      const history: AthleteAttendance['history'] = []
      for (const w of [...db.workouts].sort((a, b) => dayjs(b.start).valueOf() - dayjs(a.start).valueOf())) {
        const p = w.participants.find((x) => x.athleteId === athleteId)
        if (p && p.status !== 'planned') history.push({ workoutId: w.id, title: w.title, start: w.start, status: p.status })
      }
      const present = history.filter((h) => h.status === 'present').length
      return { present, total: history.length, percent: percent(present, history.length), history: history.slice(0, 10) }
    }),

  dashboard: () =>
    request<DashboardStats>(() => ({
      activeAthletes: db.athletes.filter((a) => a.isActive).length,
      activeInjuries: db.injuries.filter((i) => i.recoveredAt === null).length,
      upcoming: db.workouts.filter((w) => dayjs(w.start).isAfter(dayjs())).length,
    })),
}
