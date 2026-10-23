export interface AttendanceRow {
  athleteId: number
  fullName: string
  present: number
  absent: number
  excused: number
  percent: number
}

export interface SummaryReport {
  held: number
  averagePercent: number
  newInjuries: number
  rows: AttendanceRow[]
}

export interface AthleteAttendance {
  present: number
  total: number
  percent: number
  history: { workoutId: number; title: string; start: string; status: 'present' | 'absent' | 'excused' }[]
}

export interface DashboardStats {
  activeAthletes: number
  activeInjuries: number
  upcoming: number
}
