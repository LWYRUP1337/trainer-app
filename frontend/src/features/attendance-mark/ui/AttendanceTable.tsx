import { useEffect, useState } from 'react'
import { Alert, Button, Popconfirm, Progress, Segmented, Space, Table, Tag, message } from 'antd'
import { CloseOutlined } from '@ant-design/icons'
import { Link } from 'react-router-dom'
import { workoutApi, statusLabel, type AttendanceStatus, type ParticipantView, type WorkoutDetails } from '@/entities/workout'
import { errorMessage, routes } from '@/shared'

interface Props {
  workout: WorkoutDetails
  /** Вызывается после сохранения отметок и после удаления участника: передаёт обновлённую тренировку */
  onSaved: (workout: WorkoutDetails) => void
}

export function AttendanceTable({ workout, onSaved }: Props) {
  const [rows, setRows] = useState<ParticipantView[]>(workout.participants)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string>()

  // Состав изменился (добавили или убрали спортсмена): берём новый список,
  // но сохраняем уже выставленные, ещё не сохранённые отметки остальных.
  useEffect(() => {
    setRows((prev) =>
      workout.participants.map((p) => ({
        ...p,
        status: prev.find((r) => r.athleteId === p.athleteId)?.status ?? p.status,
      })),
    )
  }, [workout])

  const dirty = rows.some(
    (r) => r.status !== workout.participants.find((p) => p.athleteId === r.athleteId)?.status,
  )
  const present = rows.filter((r) => r.status === 'present').length
  const marked = rows.filter((r) => r.status !== 'planned').length
  const setStatus = (athleteId: number, status: AttendanceStatus) =>
    setRows((prev) => prev.map((r) => (r.athleteId === athleteId ? { ...r, status } : r)))

  const save = async () => {
    setSaving(true)
    setError(undefined)
    try {
      const updated = await workoutApi.saveAttendance(
        workout.id,
        rows.map(({ athleteId, status }) => ({ athleteId, status })),
      )
      message.success('Посещаемость сохранена')
      onSaved(updated)
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  const removeParticipant = async (athleteId: number) => {
    try {
      const updated = await workoutApi.removeParticipant(workout.id, athleteId)
      message.success('Спортсмен убран из тренировки')
      onSaved(updated)
    } catch (e) {
      message.error(errorMessage(e))
    }
  }

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="middle">
      <Space wrap>
        <Tag color="purple">Был: {present}</Tag>
        <Tag>Отмечено {marked} из {rows.length}</Tag>
        <Button size="small" onClick={() => setRows((prev) => prev.map((r) => ({ ...r, status: 'present' as const })))}>
          Отметить всех: был
        </Button>
        <Button size="small" onClick={() => setRows((prev) => prev.map((r) => ({ ...r, status: 'planned' as const })))}>
          Сбросить
        </Button>
      </Space>
      <Progress percent={rows.length ? Math.round((marked * 100) / rows.length) : 0} size="small" format={(p) => `${p}% отмечено`} />
      {error && <Alert type="error" showIcon message={error} />}
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
                options={(['planned', 'present', 'absent', 'excused'] as const).map((s) => ({
                  value: s,
                  label: s === 'excused' ? 'Уваж.' : statusLabel[s],
                }))}
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
        <Button type="primary" onClick={save} loading={saving} disabled={!dirty}>
          Сохранить посещаемость
        </Button>
        {dirty && <Tag color="default">Есть несохранённые изменения</Tag>}
      </Space>
    </Space>
  )
}
