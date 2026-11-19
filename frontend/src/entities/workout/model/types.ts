export type AttendanceStatus = 'planned' | 'present' | 'absent' | 'excused'

export interface Participant {
  athleteId: number
  athleteName: string
  status: AttendanceStatus
}

export interface Workout {
  id: number
  title: string
  description: string
  location: string
  start: string
  end: string
  participants: Participant[]
}

export interface WorkoutFormValues {
  title: string
  start: string
  end: string
  location?: string
  athleteIds: number[]
}

export type WorkoutPatch = Pick<Workout, 'title' | 'description' | 'location' | 'start' | 'end'>

export interface AttendanceMark {
  athleteId: number
  status: AttendanceStatus
}

export const statusLabel: Record<AttendanceStatus, string> = {
  planned: 'Не отмечен',
  present: 'Был',
  absent: 'Не был',
  excused: 'Уважительная причина',
}

export const statusColor: Record<AttendanceStatus, string> = {
  planned: 'default',
  present: '#9fecff',
  absent: '#ff9baf',
  excused: '#ddab6e',
}
