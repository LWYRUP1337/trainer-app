export interface Coach {
  fullName: string
  email: string
  phone: string
  club: string
}

export type CoachFormValues = Pick<Coach, 'fullName' | 'phone' | 'club'>
