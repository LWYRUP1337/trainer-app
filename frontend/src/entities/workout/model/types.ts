export type AttendanceStatus = 'planned' | 'present' | 'absent' | 'excused'

export interface Participant {
  athleteId: number
  status: AttendanceStatus
}

export interface ParticipantView extends Participant {
  athleteName: string
}

export interface Workout {
  id: number
  title: string
  description: string
  location: string
  start: string // ISO с часовым поясом
  end: string
  participants: Participant[]
}

export interface WorkoutDetails extends Omit<Workout, 'participants'> {
  participants: ParticipantView[]
}

export interface WorkoutFormValues {
  title: string
  start: string
  end: string
  location?: string
  athleteIds: number[]
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

export type WorkoutPatch = Partial<Pick<Workout, 'title' | 'description' | 'location' | 'start' | 'end'>>
