export interface Athlete {
  id: number
  fullName: string
  birthDate: string | null
  heightCm: number | null
  weightKg: number | null
  phone: string
  isActive: boolean
  notes: string
  nutritionPlan: string
  hasActiveInjury: boolean
}

export type AthletePatch = Partial<Pick<Athlete, 'nutritionPlan' | 'isActive'>>

export interface AthleteFormValues {
  fullName: string
  birthDate?: string
  heightCm?: number
  weightKg?: number
  phone?: string
}

export type AthleteFilter = 'active' | 'injured' | 'all'
