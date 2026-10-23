import dayjs from 'dayjs'
import type { Athlete } from '@/entities/athlete/model/types'
import type { Coach } from '@/entities/coach/model/types'
import type { Injury } from '@/entities/injury/model/types'
import type { WeekPlan } from '@/entities/week-plan/model/types'
import type { AttendanceStatus, Workout } from '@/entities/workout/model/types'

const athletes: Athlete[] = [
  { id: 1, fullName: 'Мария Орлова', birthDate: '2003-04-12', heightCm: 171, weightKg: 62, phone: '+7 901 111-22-33', isActive: true, notes: 'Бегунья на средние дистанции, цель — 800 м до 2:05.', nutritionPlan: 'Завтрак: овсянка, яйца, фрукты.\nОбед: курица, гречка, овощи.\nПеред тренировкой: банан и орехи.\nВоды не менее 2 л в день.' },
  { id: 2, fullName: 'Игорь Беляев', birthDate: '2001-09-30', heightCm: 184, weightKg: 81, phone: '+7 902 222-33-44', isActive: true, notes: 'Набор мышечной массы, упор на силовые.', nutritionPlan: 'Белок 2 г на кг веса.\n5 приёмов пищи в день.\nПосле тренировки — творог и рис.' },
  { id: 3, fullName: 'Анна Соколова', birthDate: '2004-01-18', heightCm: 165, weightKg: 56, phone: '+7 903 333-44-55', isActive: true, notes: 'Возвращается после травмы колена.', nutritionPlan: 'Больше омега-3 и кальция.\nУжин не позже 20:00.' },
  { id: 4, fullName: 'Дмитрий Захаров', birthDate: '2000-06-05', heightCm: 178, weightKg: 74, phone: '+7 904 444-55-66', isActive: true, notes: 'Марафонская подготовка.', nutritionPlan: 'Углеводная загрузка за 2 дня до старта.\nИзотоник на длинных тренировках.' },
  { id: 5, fullName: 'Елена Руднева', birthDate: '2005-11-22', heightCm: 168, weightKg: 59, phone: '+7 905 555-66-77', isActive: true, notes: 'Новичок, осваивает технику.', nutritionPlan: 'Три основных приёма пищи и два перекуса.\nМинимум сладких напитков.' },
  { id: 6, fullName: 'Павел Крылов', birthDate: '1999-02-14', heightCm: 190, weightKg: 88, phone: '+7 906 666-77-88', isActive: false, notes: 'В архиве: завершил подготовку.', nutritionPlan: '' },
]

const injuries: Injury[] = [
  { id: 1, athleteId: 3, title: 'Растяжение связок колена', bodyPart: 'Колено', severity: 'medium', startedAt: '2026-09-10', recoveredAt: null, notes: '' },
  { id: 2, athleteId: 2, title: 'Ушиб плеча', bodyPart: 'Плечо', severity: 'light', startedAt: '2026-08-02', recoveredAt: '2026-08-20', notes: '' },
  { id: 3, athleteId: 1, title: 'Воспаление ахиллова сухожилия', bodyPart: 'Голеностоп', severity: 'severe', startedAt: '2026-10-01', recoveredAt: null, notes: 'Нужна консультация врача.' },
  { id: 4, athleteId: 4, title: 'Мышечный спазм', bodyPart: 'Бедро', severity: 'light', startedAt: '2026-07-14', recoveredAt: '2026-07-21', notes: '' },
]

const weekPlan: WeekPlan = {
  id: 1,
  title: 'Базовая неделя',
  items: [
    { id: 1, weekday: 1, startTime: '18:00', endTime: '19:30', title: 'Силовая' },
    { id: 2, weekday: 2, startTime: '07:00', endTime: '08:00', title: 'Кардио' },
    { id: 3, weekday: 3, startTime: '18:00', endTime: '19:30', title: 'Силовая' },
    { id: 4, weekday: 4, startTime: '07:00', endTime: '08:00', title: 'Кардио' },
    { id: 5, weekday: 5, startTime: '17:00', endTime: '18:30', title: 'Техника' },
  ],
}

function buildWorkouts(): Workout[] {
  const result: Workout[] = []
  const now = dayjs()
  const from = now.subtract(1, 'month').startOf('month')
  const to = now.add(1, 'month').endOf('month')
  const group = athletes.filter((a) => a.isActive).map((a) => a.id)
  let id = 1
  for (let d = from; d.isBefore(to); d = d.add(1, 'day')) {
    const weekday = d.day() === 0 ? 7 : d.day()
    const item = weekPlan.items.find((p) => p.weekday === weekday)
    if (!item) continue
    const [sh, sm] = item.startTime.split(':').map(Number)
    const [eh, em] = item.endTime.split(':').map(Number)
    const start = d.hour(sh).minute(sm).second(0)
    const end = d.hour(eh).minute(em).second(0)
    const past = end.isBefore(now)
    result.push({
      id,
      title: item.title,
      description: 'Разминка 15 минут, основная часть по плану недели, заминка и растяжка.',
      location: 'Манеж, зал 2',
      start: start.format(),
      end: end.format(),
      participants: group.map((athleteId, i) => {
        let status: AttendanceStatus = 'planned'
        if (past) status = (id + i) % 5 === 0 ? 'absent' : (id + i) % 7 === 0 ? 'excused' : 'present'
        return { athleteId, status }
      }),
    })
    id++
  }
  return result
}

const workouts = buildWorkouts()

export const db = {
  coach: { fullName: 'Klaus', email: 'coach@example.com', phone: '+7 900 123-45-67', club: 'bayern' } as Coach,
  athletes,
  injuries,
  weekPlan,
  workouts,
  seq: {
    athlete: athletes.length + 1,
    injury: injuries.length + 1,
    workout: workouts.length + 1,
    slot: weekPlan.items.length + 1,
  },
}
