import dayjs from 'dayjs'

export const DATE_API = 'YYYY-MM-DD'

export const formatDate = (value: string | null | undefined) =>
  value ? dayjs(value).format('D MMMM YYYY') : '—'

export const formatTimeRange = (start: string, end: string) =>
  `${dayjs(start).format('HH:mm')} – ${dayjs(end).format('HH:mm')}`

export const ageFrom = (birthDate: string | null) => (birthDate ? dayjs().diff(birthDate, 'year') : null)
