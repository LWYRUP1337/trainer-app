import { useState } from 'react'
import { Alert, App, Button, Popconfirm, Progress, Segmented, Space, Table, Tag } from 'antd'
import { CloseOutlined } from '@ant-design/icons'
import { Link } from 'react-router-dom'
import { workoutApi, statusLabel, type AttendanceStatus, type ParticipantView, type WorkoutDetails } from '@/entities/workout'
import { errorMessage, routes, useAction } from '@/shared'

interface Props {
  workout: WorkoutDetails
  onChanged: (workout: WorkoutDetails) => void
}

const statuses: AttendanceStatus[] = ['planned', 'present', 'absent', 'excused']

export function AttendanceTable({ workout, onChanged }: Props) {
  const { message } = App.useApp()
  const [draft, setDraft] = useState<Record<number, AttendanceStatus>>({})
  const rows = workout.participants.map((p) => ({ ...p, status: draft[p.athleteId] ?? p.status }))
  const dirty = rows.some((r, i) => r.status !== workout.participants[i].status)
  const present = rows.filter((r) => r.status === 'present').length
  const marked = rows.filter((r) => r.status !== 'planned').length

  const setStatus = (athleteId: number, status: AttendanceStatus) => setDraft((prev) => ({ ...prev, [athleteId]: status }))
  const markAllPresent = () => setDraft(Object.fromEntries(rows.map((r) => [r.athleteId, 'present' as const])))

  const save = useAction(async () => {
    const updated = await workoutApi.saveAttendance(
      workout.id,
      rows.map(({ athleteId, status }) => ({ athleteId, status })),
    )
    message.success('Посещаемость сохранена')
    setDraft({})
    onChanged(updated)
  })

  const removeParticipant = async (athleteId: number) => {
    try {
      const updated = await workoutApi.removeParticipant(workout.id, athleteId)
      message.success('Спортсмен убран из тренировки')
      onChanged(updated)
    } catch (e) {
      message.error(errorMessage(e))
    }
  }

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="middle">
      <Space wrap>
        <Tag color="purple">Был: {present}</Tag>
        <Tag>
          Отмечено {marked} из {rows.length}
        </Tag>
        <Button size="small" onClick={markAllPresent} disabled={rows.length === 0}>
          Отметить всех: был
        </Button>
        <Button size="small" onClick={() => setDraft({})} disabled={!dirty}>
          Отменить изменения
        </Button>
      </Space>
      <Progress percent={rows.length ? Math.round((marked * 100) / rows.length) : 0} size="small" format={(p) => `${p}% отмечено`} />
      {save.error && <Alert type="error" showIcon message={save.error} />}
      <Table<ParticipantView>
        rowKey="athleteId"
        dataSource={rows}
        pagination={false}
        scroll={{ x: 520 }}
        locale={{ emptyText: 'К тренировке не привязаны спортсмены. Добавьте их кнопкой выше.' }}
        columns={[
          { title: 'Спортсмен', render: (_, r) => <Link to={routes.athlete(r.athleteId)}>{r.athleteName}</Link> },
          {
            title: 'Отметка',
            render: (_, r) => (
              <Segmented<AttendanceStatus>
                value={r.status}
                onChange={(v) => setStatus(r.athleteId, v)}
                options={statuses.map((s) => ({ value: s, label: s === 'excused' ? 'Уваж.' : statusLabel[s] }))}
              />
            ),
          },
          {
            title: '',
            width: 56,
            align: 'right',
            render: (_, r) => (
              <Popconfirm
                title={`Убрать «${r.athleteName}» из тренировки?`}
                okText="Убрать"
                cancelText="Отмена"
                okButtonProps={{ danger: true }}
                onConfirm={() => removeParticipant(r.athleteId)}
              >
                <Button type="text" danger icon={<CloseOutlined />} aria-label="Убрать из тренировки" />
              </Popconfirm>
            ),
          },
        ]}
      />
      <Space>
        <Button type="primary" onClick={() => save.run()} loading={save.pending} disabled={!dirty}>
          Сохранить посещаемость
        </Button>
        {dirty && <Tag color="default">Есть несохранённые изменения</Tag>}
      </Space>
    </Space>
  )
}
