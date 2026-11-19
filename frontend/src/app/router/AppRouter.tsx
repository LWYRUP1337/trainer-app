import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { Skeleton } from 'antd'
import { routes } from '@/shared'
import { AppLayout } from '../layouts/AppLayout'
import { GuestOnly, RequireAuth } from './guards'

const LoginPage = lazy(() => import('@/pages/login'))
const RegisterPage = lazy(() => import('@/pages/register'))
const DashboardPage = lazy(() => import('@/pages/dashboard'))
const AthletesPage = lazy(() => import('@/pages/athletes'))
const AthleteDetailsPage = lazy(() => import('@/pages/athlete-details'))
const CalendarPage = lazy(() => import('@/pages/calendar'))
const WorkoutDetailsPage = lazy(() => import('@/pages/workout-details'))
const WeekPlansPage = lazy(() => import('@/pages/week-plans'))
const ReportsPage = lazy(() => import('@/pages/reports'))

export function AppRouter() {
  return (
    <Suspense fallback={<Skeleton active style={{ padding: 24 }} />}>
      <Routes>
        <Route element={<GuestOnly />}>
          <Route path={routes.login} element={<LoginPage />} />
          <Route path={routes.register} element={<RegisterPage />} />
        </Route>
        <Route element={<RequireAuth />}>
          <Route element={<AppLayout />}>
            <Route path={routes.dashboard} element={<DashboardPage />} />
            <Route path={routes.athletes} element={<AthletesPage />} />
            <Route path={routes.athlete(':id')} element={<AthleteDetailsPage />} />
            <Route path={routes.calendar} element={<CalendarPage />} />
            <Route path={routes.workout(':id')} element={<WorkoutDetailsPage />} />
            <Route path={routes.weekPlans} element={<WeekPlansPage />} />
            <Route path={routes.reports} element={<ReportsPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to={routes.dashboard} replace />} />
      </Routes>
    </Suspense>
  )
}
