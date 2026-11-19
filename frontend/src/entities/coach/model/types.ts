export interface Coach {
  id: number
  fullName: string
  email: string
}

export type CoachFormValues = Pick<Coach, 'fullName'>
