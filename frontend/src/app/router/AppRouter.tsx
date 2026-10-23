import { Navigate, Route, Routes } from 'react-router-dom'
import { routes } from '@/shared'
import { AppLayout } from '../layouts/AppLayout'
import LoginPage from '@/pages/login'
import DashboardPage from '@/pages/dashboard'
import AthletesPage from '@/pages/athletes'
import AthleteDetailsPage from '@/pages/athlete-details'
import CalendarPage from '@/pages/calendar'
import WorkoutDetailsPage from '@/pages/workout-details'
import WeekPlansPage from '@/pages/week-plans'
import ReportsPage from '@/pages/reports'

export function AppRouter() {
  return (
    <Routes>
      <Route path={routes.login} element={<LoginPage />} />
      <Route element={<AppLayout />}>
        <Route path={routes.dashboard} element={<DashboardPage />} />
        <Route path={routes.athletes} element={<AthletesPage />} />
        <Route path="/athletes/:id" element={<AthleteDetailsPage />} />
        <Route path={routes.calendar} element={<CalendarPage />} />
        <Route path="/workouts/:id" element={<WorkoutDetailsPage />} />
        <Route path={routes.weekPlans} element={<WeekPlansPage />} />
        <Route path={routes.reports} element={<ReportsPage />} />
      </Route>
      <Route path="*" element={<Navigate to={routes.dashboard} replace />} />
    </Routes>
  )
}
