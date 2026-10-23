export const routes = {
  login: '/login',
  dashboard: '/',
  athletes: '/athletes',
  athlete: (id: number | string) => `/athletes/${id}`,
  calendar: '/calendar',
  workout: (id: number | string) => `/workouts/${id}`,
  weekPlans: '/week-plans',
  reports: '/reports',
} as const

export const weekdayNames = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье']
