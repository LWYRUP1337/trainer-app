import { refreshAccessToken, request, setAccessToken } from '@/shared/api'
import type { RegisterValues } from '../model/types'

interface TokenDto {
  access_token: string
}

export const sessionApi = {
  login: async (email: string, password: string) => {
    const { access_token } = await request<TokenDto>('/auth/login', {
      method: 'POST',
      form: { username: email, password },
      anonymous: true,
    })
    setAccessToken(access_token)
  },

  register: ({ fullName, email, password }: RegisterValues) =>
    request<unknown>('/auth/register', {
      method: 'POST',
      json: { full_name: fullName, email, password },
      anonymous: true,
    }),

  logout: async () => {
    try {
      await request<void>('/auth/logout', { method: 'POST', anonymous: true })
    } finally {
      setAccessToken(null)
    }
  },

  restore: () => refreshAccessToken(),
}
