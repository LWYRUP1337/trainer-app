import { mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const baseUrl = process.env.BASE_URL ?? 'http://localhost:5173'
const outDir = process.env.OUT_DIR ?? fileURLToPath(new URL('../../docs/screenshots/', import.meta.url))
const desktop = { width: 1440, height: 900 }
const mobile = { width: 390, height: 844 }

const settle = (page) => page.waitForTimeout(600)

async function open(page, path) {
  await page.goto(new URL(path, baseUrl).href)
  await page.waitForLoadState('networkidle')
  await settle(page)
}

async function shot(page, name, options = {}) {
  await page.screenshot({ path: `${outDir}/${name}.png`, fullPage: true, ...options })
  console.log(`saved ${name}.png`)
}

const scenarios = [
  ['01-login', async (page) => open(page, '/login')],
  ['02-dashboard', async (page) => open(page, '/')],
  ['03-athletes', async (page) => {
    await open(page, '/athletes')
    await page.getByText('Все', { exact: true }).click()
    await settle(page)
  }],
  ['04-athlete-profile', async (page) => open(page, '/athletes/3')],
  ['05-calendar', async (page) => open(page, '/calendar')],
  ['06-workout-attendance', async (page) => open(page, '/workouts/1')],
  ['07-week-plans', async (page) => open(page, '/week-plans')],
  ['08-reports', async (page) => open(page, '/reports')],
  ['11-form-validation', async (page) => {
    await open(page, '/athletes')
    await page.getByRole('button', { name: 'Добавить спортсмена' }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Добавить' }).click()
    await settle(page)
  }],
  ['12-state-empty', async (page) => {
    await open(page, '/athletes')
    await page.getByPlaceholder('Поиск по имени').fill('несуществующее имя')
    await settle(page)
  }],
  ['13-state-error', async (page) => {
    await open(page, '/athletes')
    await page.getByRole('switch', { name: 'Имитировать сбой сети' }).click()
    await page.getByPlaceholder('Поиск по имени').fill('а')
    await settle(page)
  }],
  ['14-injury-form-expanded', async (page) => {
    await open(page, '/athletes/3')
    await page.getByRole('tab', { name: 'Травмы' }).click()
    await page.getByRole('button', { name: 'Добавить травму' }).click()
    await settle(page)
  }],
]

await mkdir(outDir, { recursive: true })
const browser = await chromium.launch()
try {
  const context = await browser.newContext({ viewport: desktop, colorScheme: 'dark', locale: 'ru-RU' })
  for (const [name, run] of scenarios) {
    const page = await context.newPage()
    await run(page)
    await shot(page, name)
    await page.close()
  }

  const phone = await browser.newContext({ viewport: mobile, colorScheme: 'dark', locale: 'ru-RU', isMobile: true, hasTouch: true })
  const mobilePage = await phone.newPage()
  await open(mobilePage, '/athletes')
  await shot(mobilePage, '09-mobile-athletes')

  const slow = await browser.newContext({ viewport: desktop, colorScheme: 'dark', locale: 'ru-RU' })
  const loadingPage = await slow.newPage()
  const now = Date.now()
  await loadingPage.clock.install({ time: now })
  await loadingPage.clock.pauseAt(now + 1000)
  await loadingPage.goto(new URL('/athletes', baseUrl).href)
  await loadingPage.locator('.ant-skeleton').first().waitFor()
  await shot(loadingPage, '10-state-loading', { fullPage: false, animations: 'disabled' })
} finally {
  await browser.close()
}
