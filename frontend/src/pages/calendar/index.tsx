import { useState } from 'react'
import { Alert, Badge, Button, Calendar, Card, Grid, List, Spin } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import dayjs, { type Dayjs } from 'dayjs'
import { Link } from 'react-router-dom'
import { workoutApi } from '@/entities/workout'
import { CreateWorkoutModal } from '@/features/workout-create'
import { PageHeader, formatTimeRange, routes, useQuery } from '@/shared'

export default function CalendarPage() {
  const screens = Grid.useBreakpoint()
  const [value, setValue] = useState<Dayjs>(dayjs())
  const [open, setOpen] = useState(false)
  const { data, loading, error, refetch } = useQuery(
    () => workoutApi.listByMonth(value.year(), value.month()),
    [value.year(), value.month()],
  )
  const workouts = data ?? []
  const byDay = (d: Dayjs) => workouts.filter((w) => dayjs(w.start).isSame(d, 'day'))
  const dayList = byDay(value)

  return (
    <>
      <PageHeader
        title="Календарь"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>
            Добавить тренировку
          </Button>
        }
      />
      {error && (
        <Alert
          className="fade-in"
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
          message="Не удалось загрузить тренировки"
          description={error}
          action={<Button onClick={refetch}>Повторить</Button>}
        />
      )}
      <Spin spinning={loading}>
        <Card styles={{ body: { padding: screens.md ? 16 : 8 } }}>
          <Calendar
            value={value}
            onChange={setValue}
            fullscreen={!!screens.md}
            cellRender={(current, info) => {
              if (info.type !== 'date') return info.originNode
              return (
                <ul className="cal-cell">
                  {byDay(current).map((w) => (
                    <li key={w.id}>
                      <Link to={routes.workout(w.id)}>
                        <Badge status={dayjs(w.end).isBefore(dayjs()) ? 'default' : 'success'} />
                        {dayjs(w.start).format('HH:mm')} {w.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              )
            }}
          />
        </Card>
      </Spin>
      <Card title={`Тренировки: ${value.format('D MMMM YYYY')}`} style={{ marginTop: 16 }}>
        <List
          key={value.format('YYYY-MM-DD')}
          className="fade-in"
          dataSource={dayList}
          locale={{ emptyText: 'В этот день тренировок нет.' }}
          renderItem={(w) => (
            <List.Item actions={[<Link key="o" to={routes.workout(w.id)}>Открыть и отметить посещаемость</Link>]}>
              <List.Item.Meta title={w.title} description={`${formatTimeRange(w.start, w.end)} · ${w.location || 'место не указано'}`} />
            </List.Item>
          )}
        />
      </Card>
      <CreateWorkoutModal
        open={open}
        initialDate={value}
        onClose={() => setOpen(false)}
        onCreated={(w) => {
          setOpen(false)
          setValue(dayjs(w.start))
          refetch()
        }}
      />
    </>
  )
}
