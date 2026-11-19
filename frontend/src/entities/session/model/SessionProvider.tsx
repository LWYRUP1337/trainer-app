import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { setUnauthorizedHandler } from '@/shared/api'
import { sessionApi } from '../api/sessionApi'
import { SessionContext } from './context'
import type { Session, SessionStatus } from './types'

export function SessionProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<SessionStatus>('checking')

  useEffect(() => {
    let active = true
    setUnauthorizedHandler(() => setStatus('anonymous'))
    sessionApi.restore().then((restored) => {
      if (active) setStatus(restored ? 'authenticated' : 'anonymous')
    })
    return () => {
      active = false
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    await sessionApi.login(email, password)
    setStatus('authenticated')
  }, [])

  const logout = useCallback(async () => {
    try {
      await sessionApi.logout()
    } finally {
      setStatus('anonymous')
    }
  }, [])

  const session = useMemo<Session>(() => ({ status, login, logout }), [status, login, logout])
  return <SessionContext.Provider value={session}>{children}</SessionContext.Provider>
}
