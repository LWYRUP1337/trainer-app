import { useState } from 'react'
import { Alert, Button, Empty, Modal, Skeleton, Space, Tag, Typography, message } from 'antd'
import { athleteApi } from '@/entities/athlete'
import { workoutApi, type WorkoutDetails } from '@/entities/workout'
import { errorMessage, useQuery } from '@/shared'

interface Props {
  open: boolean
  workout: WorkoutDetails
  onClose: () => void
  onAdded: (workout: WorkoutDetails) => void
}

export function AddParticipantsModal({ open, workout, onClose, onAdded }: Props) {
  const [selected, setSelected] = useState<number[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string>()
  const athletes = useQuery(
    () => (open ? athleteApi.list({ search: '', filter: 'active' }) : Promise.resolve([])),
    [open],
  )

  // только активные спортсмены, которых ещё нет в тренировке
  const inWorkout = new Set(workout.participants.map((p) => p.athleteId))
  const available = (athletes.data ?? []).filter((a) => !inWorkout.has(a.id))

  const toggle = (id: number, checked: boolean) =>
    setSelected((prev) => (checked ? [...prev, id] : prev.filter((x) => x !== id)))

  const close = () => {
    setSelected([])
    setError(undefined)
    onClose()
  }

  const submit = async () => {
    setSubmitting(true)
    setError(undefined)
    try {
      const updated = await workoutApi.addParticipants(workout.id, selected)
      message.success(`Добавлено спортсменов: ${selected.length}`)
      setSelected([])
      onAdded(updated)
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      title="Добавить спортсменов"
      open={open}
      onCancel={close}
      footer={[
        <Button key="cancel" onClick={close}>
          Отмена
        </Button>,
        <Button key="ok" type="primary" loading={submitting} disabled={selected.length === 0} onClick={submit}>
          {selected.length ? `Добавить (${selected.length})` : 'Добавить'}
        </Button>,
      ]}
    >
      {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} />}
      {athletes.error ? (
        <Alert
          type="error"
          showIcon
          message="Не удалось загрузить спортсменов"
          description={athletes.error}
          action={<Button onClick={athletes.refetch}>Повторить</Button>}
        />
      ) : athletes.data === undefined ? (
        <Skeleton active paragraph={{ rows: 3 }} />
      ) : available.length === 0 ? (
        <Empty description="Все активные спортсмены уже в этой тренировке" />
      ) : (
        <>
          <Typography.Paragraph type="secondary">Нажмите на спортсменов, которых нужно добавить.</Typography.Paragraph>
          <Space size={[8, 12]} wrap>
            {available.map((a) => (
              <Tag.CheckableTag
                key={a.id}
                checked={selected.includes(a.id)}
                onChange={(checked) => toggle(a.id, checked)}
                style={{ padding: '6px 14px', fontSize: 14, border: '1px solid rgba(255,255,255,0.3)' }}
              >
                {selected.includes(a.id) ? '✓ ' : ''}
                {a.fullName}
              </Tag.CheckableTag>
            ))}
          </Space>
        </>
      )}
    </Modal>
  )
}
