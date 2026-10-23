import type { ReactNode } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import ruRU from 'antd/locale/ru_RU'
import dayjs from 'dayjs'
import 'dayjs/locale/ru'
import { theme } from '../theme'

dayjs.locale('ru')

const themeConfig = { ...theme, token: { ...theme.token, motion: false } }

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ConfigProvider locale={ruRU} theme={themeConfig}>
      <BrowserRouter>{children}</BrowserRouter>
    </ConfigProvider>
  )
}
