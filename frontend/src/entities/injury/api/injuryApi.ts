import dayjs from 'dayjs'
import { DATE_API } from '@/shared'
import { request } from '@/shared/api'
import type { Injury, InjuryFormValues, Severity } from '../model/types'

interface InjuryDto {
  id: number
  athlete_id: number
  title: string
  body_part: string
  severity: Severity
  started_at: string
  recovered_at: string | null
  notes: string | null
}

const toInjury = (dto: InjuryDto): Injury => ({
  id: dto.id,
  athleteId: dto.athlete_id,
  title: dto.title,
  bodyPart: dto.body_part,
  severity: dto.severity,
  startedAt: dto.started_at,
  recoveredAt: dto.recovered_at,
  notes: dto.notes ?? '',
})

export const injuryApi = {
  list: async (athleteId: number) => (await request<InjuryDto[]>(`/athletes/${athleteId}/injuries`)).map(toInjury),

  create: async (athleteId: number, { title, bodyPart, severity, startedAt, notes }: InjuryFormValues) =>
    toInjury(
      await request<InjuryDto>(`/athletes/${athleteId}/injuries`, {
        method: 'POST',
        json: { title, body_part: bodyPart, severity, started_at: startedAt, notes: notes?.trim() || null },
      }),
    ),

  markRecovered: async (id: number) =>
    toInjury(
      await request<InjuryDto>(`/injuries/${id}`, {
        method: 'PATCH',
        json: { recovered_at: dayjs().format(DATE_API) },
      }),
    ),

  remove: (id: number) => request<void>(`/injuries/${id}`, { method: 'DELETE' }),
}
