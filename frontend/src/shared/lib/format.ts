import dayjs, { type Dayjs } from 'dayjs'

export const DATE_API = 'YYYY-MM-DD'

export const atTime = (date: Dayjs, time: Dayjs): string =>
  date.hour(time.hour()).minute(time.minute()).second(0).millisecond(0).format()

export const formatDate = (value: string | null | undefined) =>
  value ? dayjs(value).format('D MMMM YYYY') : '—'

export const formatTimeRange = (start: string, end: string) =>
  `${dayjs(start).format('HH:mm')} – ${dayjs(end).format('HH:mm')}`

export const ageFrom = (birthDate: string | null) => (birthDate ? dayjs().diff(birthDate, 'year') : null)
