import type { ReactNode } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { App, ConfigProvider } from 'antd'
import ruRU from 'antd/locale/ru_RU'
import dayjs from 'dayjs'
import 'dayjs/locale/ru'
import { theme } from '../theme'

dayjs.locale('ru')

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ConfigProvider locale={ruRU} theme={theme}>
      <App>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>{children}</BrowserRouter>
      </App>
    </ConfigProvider>
  )
}
