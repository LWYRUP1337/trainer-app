import { mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { chromium, request } from 'playwright'

const baseUrl = process.env.BASE_URL ?? 'http://localhost:5173'
const outDir = process.env.OUT_DIR ?? fileURLToPath(new URL('../../docs/screenshots/', import.meta.url))
const demo = { email: process.env.DEMO_EMAIL ?? 'demo@example.com', password: process.env.DEMO_PASSWORD ?? 'demo12345', fullName: 'Клаус Тренер' }
const desktop = { width: 1440, height: 900 }
const mobile = { width: 390, height: 844 }
const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone

const day = (offset) => {
  const date = new Date()
  date.setDate(date.getDate() + offset)
  return date.toISOString().slice(0, 10)
}

const athletes = [
  { full_name: 'Мария Орлова', birth_date: '2003-04-12', height_cm: 171, weight_kg: 62, phone: '+7 901 111-22-33', nutrition_plan: 'Завтрак: овсянка, яйца, фрукты.\nОбед: курица, гречка, овощи.\nВоды не менее 2 л в день.' },
  { full_name: 'Игорь Беляев', birth_date: '2001-09-30', height_cm: 184, weight_kg: 81, phone: '+7 902 222-33-44', nutrition_plan: 'Белок 2 г на кг веса.\n5 приёмов пищи в день.' },
  { full_name: 'Анна Соколова', birth_date: '2004-01-18', height_cm: 165, weight_kg: 56, phone: '+7 903 333-44-55', notes: 'Возвращается после травмы колена.' },
  { full_name: 'Дмитрий Захаров', birth_date: '2000-06-05', height_cm: 178, weight_kg: 74, phone: '+7 904 444-55-66', notes: 'Марафонская подготовка.' },
  { full_name: 'Елена Руднева', birth_date: '2005-11-22', height_cm: 168, weight_kg: 59, phone: '+7 905 555-66-77' },
  { full_name: 'Павел Крылов', birth_date: '1999-02-14', height_cm: 190, weight_kg: 88, phone: '+7 906 666-77-88', is_active: false },
]

const slots = [
  { weekday: 1, start_time: '18:00', end_time: '19:30', title: 'Силовая' },
  { weekday: 2, start_time: '07:00', end_time: '08:00', title: 'Кардио' },
  { weekday: 3, start_time: '18:00', end_time: '19:30', title: 'Силовая' },
  { weekday: 4, start_time: '07:00', end_time: '08:00', title: 'Кардио' },
  { weekday: 5, start_time: '17:00', end_time: '18:30', title: 'Техника' },
]

async function seed() {
  const api = await request.newContext({ baseURL: baseUrl })
  const registered = await api.post('/api/v1/auth/register', { data: { email: demo.email, password: demo.password, full_name: demo.fullName } })
  const login = await api.post('/api/v1/auth/login', { form: { username: demo.email, password: demo.password } })
  const { access_token: token } = await login.json()
  const call = async (method, path, data) => {
    const response = await api.fetch(`/api/v1${path}`, { method, data, headers: { Authorization: `Bearer ${token}` } })
    if (!response.ok()) throw new Error(`${method} ${path}: ${response.status()} ${await response.text()}`)
    return response.status() === 204 ? null : response.json()
  }

  if (registered.ok()) {
    const created = []
    for (const athlete of athletes) created.push(await call('POST', '/athletes', athlete))
    const byName = Object.fromEntries(created.map((a) => [a.full_name, a]))
    await call('POST', `/athletes/${byName['Анна Соколова'].id}/injuries`, { title: 'Растяжение связок колена', body_part: 'Колено', severity: 'medium', started_at: day(-20) })
    const old = await call('POST', `/athletes/${byName['Игорь Беляев'].id}/injuries`, { title: 'Ушиб плеча', body_part: 'Плечо', severity: 'light', started_at: day(-60) })
    await call('PATCH', `/injuries/${old.id}`, { recovered_at: day(-45) })

    const plan = await call('POST', '/week-plans', { title: 'Шаблон недели', items: slots })
    const monday = new Date()
    monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7) - 21)
    const activeIds = created.filter((a) => a.is_active).map((a) => a.id)
    await call('POST', `/week-plans/${plan.id}/apply`, { start_date: monday.toISOString().slice(0, 10), weeks: 6, athlete_ids: activeIds, timezone })

    const past = await call('GET', `/workouts?date_to=${encodeURIComponent(new Date().toISOString())}&limit=500`)
    for (const [index, workout] of past.entries()) {
      const items = workout.participants.map((p, i) => ({
        athlete_id: p.athlete_id,
        status: (index + i) % 7 === 0 ? 'absent' : (index + i) % 9 === 0 ? 'excused' : 'present',
      }))
      await call('PUT', `/workouts/${workout.id}/attendance`, { items })
    }
  }

  const list = await call('GET', '/athletes?limit=100')
  const anna = list.items.find((a) => a.full_name === 'Анна Соколова')
  const past = await call('GET', `/workouts?date_to=${encodeURIComponent(new Date().toISOString())}&limit=500`)
  await api.dispose()
  return { annaId: anna.id, workoutId: past.at(-1).id }
}

const settle = (page) => page.waitForTimeout(700)

async function open(page, path) {
  await page.goto(new URL(path, baseUrl).href)
  await page.waitForLoadState('networkidle')
  await settle(page)
}

async function shot(page, name, options = {}) {
  await page.screenshot({ path: `${outDir}/${name}.png`, fullPage: true, ...options })
  console.log(`saved ${name}.png`)
}

async function signedIn(browser, options) {
  const context = await browser.newContext({ colorScheme: 'dark', locale: 'ru-RU', ...options })
  const page = await context.newPage()
  await open(page, '/login')
  await page.getByLabel('Email').fill(demo.email)
  await page.getByLabel('Пароль').fill(demo.password)
  await page.getByRole('button', { name: 'Войти' }).click()
  await page.waitForURL(new URL('/', baseUrl).href)
  await page.close()
  return context
}

await mkdir(outDir, { recursive: true })
const { annaId, workoutId } = await seed()
const browser = await chromium.launch()
try {
  const guest = await browser.newContext({ viewport: desktop, colorScheme: 'dark', locale: 'ru-RU' })
  for (const [name, path] of [['01-login', '/login'], ['15-register', '/register']]) {
    const page = await guest.newPage()
    await open(page, path)
    await shot(page, name)
    await page.close()
  }

  const context = await signedIn(browser, { viewport: desktop })
  const scenarios = [
    ['02-dashboard', async (page) => open(page, '/')],
    ['03-athletes', async (page) => {
      await open(page, '/athletes')
      await page.getByText('Все', { exact: true }).click()
      await settle(page)
    }],
    ['04-athlete-profile', async (page) => open(page, `/athletes/${annaId}`)],
    ['05-calendar', async (page) => open(page, '/calendar')],
    ['06-workout-attendance', async (page) => open(page, `/workouts/${workoutId}`)],
    ['07-week-plans', async (page) => open(page, '/week-plans')],
    ['08-reports', async (page) => open(page, '/reports')],
    ['11-form-validation', async (page) => {
      await open(page, '/athletes')
      await page.getByRole('button', { name: /Добавить спортсмена/ }).click()
      await page.getByRole('dialog').getByRole('button', { name: 'Добавить', exact: true }).click()
      await settle(page)
    }],
    ['12-state-empty', async (page) => {
      await open(page, '/athletes')
      await page.getByPlaceholder('Поиск по имени').fill('несуществующее имя')
      await settle(page)
    }],
    ['13-state-error', async (page) => {
      await open(page, '/athletes')
      await page.route('**/api/v1/athletes?**', (route) => route.abort())
      await page.getByPlaceholder('Поиск по имени').fill('а')
      await settle(page)
    }],
    ['14-injury-form-expanded', async (page) => {
      await open(page, `/athletes/${annaId}`)
      await page.getByRole('tab', { name: 'Травмы' }).click()
      await page.getByRole('button', { name: /Добавить травму/ }).click()
      await settle(page)
    }],
    ['10-state-loading', async (page) => {
      await page.route('**/api/v1/athletes?**', async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 5000))
        await route.continue().catch(() => {})
      })
      await page.goto(new URL('/athletes', baseUrl).href)
      await page.locator('.ant-skeleton').first().waitFor()
    }],
  ]
  for (const [name, run] of scenarios) {
    const page = await context.newPage()
    await run(page)
    await shot(page, name, name === '10-state-loading' ? { fullPage: false, animations: 'disabled' } : {})
    await page.close()
  }

  const phone = await signedIn(browser, { viewport: mobile, isMobile: true, hasTouch: true })
  const mobilePage = await phone.newPage()
  await open(mobilePage, '/athletes')
  await shot(mobilePage, '09-mobile-athletes')
} finally {
  await browser.close()
}
