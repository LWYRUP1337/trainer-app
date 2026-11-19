import { request, type Page } from '@/shared/api'
import type { Athlete, AthleteFormValues, AthleteListParams, AthletePatch } from '../model/types'

interface AthleteDto {
  id: number
  full_name: string
  birth_date: string | null
  height_cm: number | null
  weight_kg: number | null
  phone: string | null
  notes: string | null
  nutrition_plan: string | null
  is_active: boolean
  has_active_injury: boolean
}

const MAX_PAGE_SIZE = 100

const toAthlete = (dto: AthleteDto): Athlete => ({
  id: dto.id,
  fullName: dto.full_name,
  birthDate: dto.birth_date,
  heightCm: dto.height_cm,
  weightKg: dto.weight_kg,
  phone: dto.phone ?? '',
  notes: dto.notes ?? '',
  nutritionPlan: dto.nutrition_plan ?? '',
  isActive: dto.is_active,
  hasActiveInjury: dto.has_active_injury,
})

async function list({ search, filter, page, pageSize }: AthleteListParams): Promise<Page<Athlete>> {
  const data = await request<Page<AthleteDto>>('/athletes', {
    query: {
      search: search.trim(),
      is_active: filter === 'active' ? true : undefined,
      has_active_injury: filter === 'injured' ? true : undefined,
      limit: pageSize,
      offset: (page - 1) * pageSize,
    },
  })
  return { items: data.items.map(toAthlete), total: data.total }
}

export const athleteApi = {
  list,

  active: async () => (await list({ search: '', filter: 'active', page: 1, pageSize: MAX_PAGE_SIZE })).items,

  get: async (id: number) => toAthlete(await request<AthleteDto>(`/athletes/${id}`)),

  create: async ({ fullName, birthDate, heightCm, weightKg, phone }: AthleteFormValues) =>
    toAthlete(
      await request<AthleteDto>('/athletes', {
        method: 'POST',
        json: {
          full_name: fullName,
          birth_date: birthDate ?? null,
          height_cm: heightCm ?? null,
          weight_kg: weightKg ?? null,
          phone: phone?.trim() || null,
        },
      }),
    ),

  update: async (id: number, { nutritionPlan, isActive }: AthletePatch) =>
    toAthlete(
      await request<AthleteDto>(`/athletes/${id}`, {
        method: 'PATCH',
        json: { nutrition_plan: nutritionPlan, is_active: isActive },
      }),
    ),

  remove: (id: number) => request<void>(`/athletes/${id}`, { method: 'DELETE' }),
}
