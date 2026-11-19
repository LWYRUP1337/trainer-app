export type SessionStatus = 'checking' | 'authenticated' | 'anonymous'

export interface RegisterValues {
  fullName: string
  email: string
  password: string
}

export interface Session {
  status: SessionStatus
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}
