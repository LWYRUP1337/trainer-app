import { request } from '@/shared/api'
import type { Coach, CoachFormValues } from '../model/types'

interface CoachDto {
  id: number
  email: string
  full_name: string
}

const toCoach = (dto: CoachDto): Coach => ({ id: dto.id, fullName: dto.full_name, email: dto.email })

export const coachApi = {
  get: async () => toCoach(await request<CoachDto>('/auth/me')),

  update: async ({ fullName }: CoachFormValues) =>
    toCoach(await request<CoachDto>('/auth/me', { method: 'PATCH', json: { full_name: fullName } })),
}
