import { Spin } from 'antd'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useSession } from '@/entities/session'
import { routes } from '@/shared'

export interface RedirectState {
  from?: string
}

export function RequireAuth() {
  const { status } = useSession()
  const location = useLocation()
  if (status === 'checking') return <Spin fullscreen />
  if (status === 'anonymous') {
    const state: RedirectState = { from: location.pathname + location.search }
    return <Navigate to={routes.login} replace state={state} />
  }
  return <Outlet />
}

export function GuestOnly() {
  const { status } = useSession()
  const location = useLocation()
  if (status === 'checking') return <Spin fullscreen />
  if (status === 'authenticated') {
    const { from } = (location.state ?? {}) as RedirectState
    return <Navigate to={from ?? routes.dashboard} replace />
  }
  return <Outlet />
}
