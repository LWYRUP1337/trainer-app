import { Button, Dropdown, Layout, Menu, Space, Typography } from 'antd'
import {
  BarChartOutlined,
  CalendarOutlined,
  HomeOutlined,
  ScheduleOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { FailureToggle } from '@/features/simulate-failure'
import { routes } from '@/shared'

const items = [
  { key: routes.dashboard, icon: <HomeOutlined />, label: <Link to={routes.dashboard}>Кабинет</Link> },
  { key: routes.athletes, icon: <TeamOutlined />, label: <Link to={routes.athletes}>Спортсмены</Link> },
  { key: routes.calendar, icon: <CalendarOutlined />, label: <Link to={routes.calendar}>Календарь</Link> },
  { key: routes.weekPlans, icon: <ScheduleOutlined />, label: <Link to={routes.weekPlans}>Планы недель</Link> },
  { key: routes.reports, icon: <BarChartOutlined />, label: <Link to={routes.reports}>Отчёты</Link> },
]

function activeKey(pathname: string): string {
  if (pathname.startsWith('/athletes')) return routes.athletes
  if (pathname.startsWith('/calendar') || pathname.startsWith('/workouts')) return routes.calendar
  if (pathname.startsWith('/week-plans')) return routes.weekPlans
  if (pathname.startsWith('/reports')) return routes.reports
  return routes.dashboard
}

export function AppLayout() {
  const { pathname } = useLocation()
  const navigate = useNavigate()

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Layout.Sider breakpoint="lg" collapsedWidth={0} width={230}>
        <Typography.Title level={4} style={{ color: '#fff', margin: 0, padding: '24px 28px 20px', letterSpacing: 0.3 }}>
          COACHIE
        </Typography.Title>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[activeKey(pathname)]}
          items={items}
          style={{ background: 'transparent', borderInlineEnd: 'none', padding: '0 12px' }}
        />
      </Layout.Sider>
      <Layout>
        <Layout.Header style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 24, padding: '0 24px' }}>
          <FailureToggle />
          <Dropdown menu={{ items: [{ key: 'out', label: 'Выйти' }], onClick: () => navigate(routes.login) }}>
            <Button type="text">
              <Space>
                <UserOutlined />
                Мой кабинет
              </Space>
            </Button>
          </Dropdown>
        </Layout.Header>
        <Layout.Content style={{ padding: 24 }}>
          <div className="page page-enter" key={pathname}>
            <Outlet />
          </div>
        </Layout.Content>
      </Layout>
    </Layout>
  )
}
