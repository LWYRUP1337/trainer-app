import { useState } from 'react'
import { Button, Card, Col, Descriptions, List, Row, Statistic, Tag } from 'antd'
import dayjs from 'dayjs'
import { Link } from 'react-router-dom'
import { coachApi } from '@/entities/coach'
import { reportApi } from '@/entities/report'
import { workoutApi } from '@/entities/workout'
import { EditProfileModal } from '@/features/profile-edit'
import { AsyncState, PageHeader, formatTimeRange, routes, useQuery } from '@/shared'

export default function DashboardPage() {
  const { data, loading, error, refetch } = useQuery(
    async () => {
      const [coach, stats, upcoming] = await Promise.all([coachApi.get(), reportApi.dashboard(), workoutApi.upcoming(5)])
      return { coach, stats, upcoming }
    },
    [],
  )
  const [editing, setEditing] = useState(false)

  return (
    <>
      <PageHeader title="Личный кабинет" />
      <AsyncState loading={loading} error={error} data={data} onRetry={refetch}>
        {({ coach, stats, upcoming }) => (
          <>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={8}>
                <Card className="hover-card"><Statistic title="Активных спортсменов" value={stats.activeAthletes} /></Card>
              </Col>
              <Col xs={24} sm={8}>
                <Card className="hover-card"><Statistic title="Незакрытых травм" value={stats.activeInjuries} /></Card>
              </Col>
              <Col xs={24} sm={8}>
                <Card className="hover-card"><Statistic title="Тренировок впереди" value={stats.upcoming} /></Card>
              </Col>
              <Col xs={24} lg={10}>
                <Card title="Профиль тренера" extra={<Button size="small" onClick={() => setEditing(true)}>Изменить</Button>}>
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="Имя">{coach.fullName}</Descriptions.Item>
                    <Descriptions.Item label="Email">{coach.email}</Descriptions.Item>
                    <Descriptions.Item label="Телефон">{coach.phone || '—'}</Descriptions.Item>
                    <Descriptions.Item label="Клуб">{coach.club || '—'}</Descriptions.Item>
                  </Descriptions>
                </Card>
                <EditProfileModal
                  open={editing}
                  coach={coach}
                  onClose={() => setEditing(false)}
                  onSaved={() => {
                    setEditing(false)
                    refetch()
                  }}
                />
              </Col>
              <Col xs={24} lg={14}>
                <Card title="Ближайшие тренировки" extra={<Link to={routes.calendar}>Открыть календарь</Link>}>
                  <List
                    dataSource={upcoming}
                    locale={{ emptyText: 'Тренировок пока нет. Добавьте их в календаре.' }}
                    renderItem={(w) => (
                      <List.Item actions={[<Link key="o" to={routes.workout(w.id)}>Открыть</Link>]}>
                        <List.Item.Meta
                          title={w.title}
                          description={`${dayjs(w.start).format('dd, D MMMM')}, ${formatTimeRange(w.start, w.end)} · ${w.location || 'место не указано'}`}
                        />
                        <Tag>{w.participants.length} спортсменов</Tag>
                      </List.Item>
                    )}
                  />
                </Card>
              </Col>
            </Row>
          </>
        )}
      </AsyncState>
    </>
  )
}
