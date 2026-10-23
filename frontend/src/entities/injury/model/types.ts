export type Severity = 'light' | 'medium' | 'severe'

export interface Injury {
  id: number
  athleteId: number
  title: string
  bodyPart: string
  severity: Severity
  startedAt: string
  recoveredAt: string | null
  notes: string
}

export interface InjuryFormValues {
  title: string
  bodyPart: string
  severity: Severity
  startedAt: string
  notes?: string
}

export const severityLabel: Record<Severity, string> = { light: 'Лёгкая', medium: 'Средняя', severe: 'Тяжёлая' }
export const severityColor: Record<Severity, string> = { light: '#b8b6ff', medium: '#f2a0ff', severe: '#ff7590' }
