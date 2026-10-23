import { Button, Card, Descriptions, Popconfirm, Progress, Space, Table, Tabs, Typography, message } from 'antd'
import { Link, useNavigate, useParams } from 'react-router-dom'
import dayjs from 'dayjs'
import { athleteApi, AthleteStatusTags } from '@/entities/athlete'
import { reportApi } from '@/entities/report'
import { AttendanceTag } from '@/entities/workout'
import { NutritionForm } from '@/features/athlete-nutrition'
import { InjuriesPanel } from '@/features/injury-manage'
import { AsyncState, PageHeader, errorMessage, formatDate, routes, useQuery } from '@/shared'

function AttendanceTab({ athleteId }: { athleteId: number }) {
  const { data, loading, error, refetch } = useQuery(() => reportApi.athleteAttendance(athleteId), [athleteId])
  return (
    <AsyncState
      loading={loading}
      error={error}
      data={data}
      onRetry={refetch}
      isEmpty={(d) => d.total === 0}
      emptyText="Отметок посещаемости пока нет."
    >
      {(d) => (
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <div>
            <Typography.Text>Посещаемость: {d.present} из {d.total} тренировок</Typography.Text>
            <Progress percent={d.percent} />
          </div>
          <Table
            rowKey="workoutId"
            dataSource={d.history}
            pagination={false}
            size="small"
            scroll={{ x: 480 }}
            columns={[
              { title: 'Дата', render: (_, r) => dayjs(r.start).format('DD.MM.YYYY HH:mm') },
              { title: 'Тренировка', render: (_, r) => <Link to={routes.workout(r.workoutId)}>{r.title}</Link> },
              { title: 'Отметка', render: (_, r) => <AttendanceTag status={r.status} /> },
            ]}
          />
        </Space>
      )}
    </AsyncState>
  )
}

export default function AthleteDetailsPage() {
  const { id } = useParams()
  const athleteId = Number(id)
  const navigate = useNavigate()
  const { data: athlete, loading, error, refetch } = useQuery(() => athleteApi.get(athleteId), [athleteId])

  const toggleArchive = async () => {
    if (!athlete) return
    try {
      await athleteApi.update(athlete.id, { isActive: !athlete.isActive })
      message.success(athlete.isActive ? 'Спортсмен перенесён в архив' : 'Спортсмен возвращён в активные')
      refetch()
    } catch (e) {
      message.error(errorMessage(e))
    }
  }

  const remove = async () => {
    try {
      await athleteApi.remove(athleteId)
      message.success('Спортсмен удалён')
      navigate(routes.athletes)
    } catch (e) {
      message.error(errorMessage(e))
    }
  }

  return (
    <>
      <PageHeader
        title={athlete?.fullName ?? 'Спортсмен'}
        back={{ to: routes.athletes, label: 'Спортсмены' }}
        extra={
          athlete && (
            <Space wrap>
              <Button onClick={toggleArchive}>{athlete.isActive ? 'В архив' : 'Вернуть из архива'}</Button>
              <Popconfirm
                title="Удалить спортсмена?"
                description="Вместе с ним удалятся травмы и отметки посещаемости."
                okText="Удалить"
                cancelText="Отмена"
                okButtonProps={{ danger: true }}
                onConfirm={remove}
              >
                <Button danger>Удалить</Button>
              </Popconfirm>
            </Space>
          )
        }
      />
      <Card>
        <AsyncState loading={loading} error={error} data={athlete} onRetry={refetch}>
          {(a) => (
            <Tabs
              items={[
                {
                  key: 'profile',
                  label: 'Профиль',
                  children: (
                    <Descriptions column={{ xs: 1, md: 2 }} bordered size="small">
                      <Descriptions.Item label="Дата рождения">{formatDate(a.birthDate)}</Descriptions.Item>
                      <Descriptions.Item label="Телефон">{a.phone || '—'}</Descriptions.Item>
                      <Descriptions.Item label="Рост">{a.heightCm ? `${a.heightCm} см` : '—'}</Descriptions.Item>
                      <Descriptions.Item label="Вес">{a.weightKg ? `${a.weightKg} кг` : '—'}</Descriptions.Item>
                      <Descriptions.Item label="Статус"><AthleteStatusTags isActive={a.isActive} hasActiveInjury={false} /></Descriptions.Item>
                      <Descriptions.Item label="Заметки" span={2}>{a.notes || '—'}</Descriptions.Item>
                    </Descriptions>
                  ),
                },
                {
                  key: 'nutrition',
                  label: 'Питание',
                  children: <NutritionForm key={a.nutritionPlan} athlete={a} onSaved={refetch} />,
                },
                { key: 'injuries', label: 'Травмы', children: <InjuriesPanel athleteId={a.id} /> },
                { key: 'attendance', label: 'Посещаемость', children: <AttendanceTab athleteId={a.id} /> },
              ]}
            />
          )}
        </AsyncState>
      </Card>
    </>
  )
}
