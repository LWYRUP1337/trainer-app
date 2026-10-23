import { useState } from 'react'
import { Button, Card, Descriptions, Space } from 'antd'
import dayjs from 'dayjs'
import { useNavigate, useParams } from 'react-router-dom'
import { workoutApi, type WorkoutDetails } from '@/entities/workout'
import { AttendanceTable } from '@/features/attendance-mark'
import { AddParticipantsModal } from '@/features/workout-participants'
import { DeleteWorkoutButton } from '@/features/workout-delete'
import { EditWorkoutModal } from '@/features/workout-edit'
import { AsyncState, PageHeader, formatTimeRange, routes, useQuery } from '@/shared'

export default function WorkoutDetailsPage() {
  const { id } = useParams()
  const workoutId = Number(id)
  const navigate = useNavigate()
  const { data, loading, error, refetch } = useQuery(() => workoutApi.get(workoutId), [workoutId])
  const [saved, setSaved] = useState<WorkoutDetails>()
  const [editing, setEditing] = useState(false)
  const [adding, setAdding] = useState(false)
  const workout = saved?.id === workoutId ? saved : data

  return (
    <>
      <PageHeader
        title={workout?.title ?? 'Тренировка'}
        back={{ to: routes.calendar, label: 'Календарь' }}
        extra={
          workout && (
            <Space wrap>
              <Button onClick={() => setEditing(true)}>Редактировать</Button>
              <Button onClick={() => setAdding(true)}>Добавить спортсменов</Button>
              <DeleteWorkoutButton workoutId={workout.id} onDeleted={() => navigate(routes.calendar)} />
            </Space>
          )
        }
      />
      <AsyncState loading={loading} error={error} data={workout} onRetry={refetch}>
        {(w) => (
          <>
            <Card style={{ marginBottom: 16 }}>
              <Descriptions column={{ xs: 1, md: 2 }} size="small">
                <Descriptions.Item label="Дата">{dayjs(w.start).format('dddd, D MMMM YYYY')}</Descriptions.Item>
                <Descriptions.Item label="Время">{formatTimeRange(w.start, w.end)}</Descriptions.Item>
                <Descriptions.Item label="Место">{w.location || '—'}</Descriptions.Item>
                <Descriptions.Item label="План">{w.description || '—'}</Descriptions.Item>
              </Descriptions>
            </Card>
            <Card title="Посещаемость">
              <AttendanceTable workout={w} onSaved={setSaved} />
            </Card>
            <EditWorkoutModal
              open={editing}
              workout={w}
              onClose={() => setEditing(false)}
              onSaved={() => {
                setEditing(false)
                setSaved(undefined)
                refetch()
              }}
            />
            <AddParticipantsModal
              open={adding}
              workout={w}
              onClose={() => setAdding(false)}
              onAdded={(updated) => {
                setAdding(false)
                setSaved(updated)
              }}
            />
          </>
        )}
      </AsyncState>
    </>
  )
}
