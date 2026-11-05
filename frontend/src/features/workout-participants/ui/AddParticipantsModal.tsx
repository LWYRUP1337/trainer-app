import { useState } from 'react'
import { Alert, App, Button, Modal, Space, Tag, Typography } from 'antd'
import { athleteApi } from '@/entities/athlete'
import { workoutApi, type WorkoutDetails } from '@/entities/workout'
import { AsyncState, useAction, useQuery } from '@/shared'

interface Props {
  open: boolean
  workout: WorkoutDetails
  onClose: () => void
  onAdded: (workout: WorkoutDetails) => void
}

interface PickerProps {
  exclude: Set<number>
  selected: number[]
  onToggle: (id: number, checked: boolean) => void
}

function ParticipantPicker({ exclude, selected, onToggle }: PickerProps) {
  const { data, loading, error, refetch } = useQuery(() => athleteApi.list({ search: '', filter: 'active' }), [])
  return (
    <AsyncState
      loading={loading}
      error={error}
      data={data?.filter((a) => !exclude.has(a.id))}
      onRetry={refetch}
      isEmpty={(items) => items.length === 0}
      emptyText="Все активные спортсмены уже в этой тренировке"
    >
      {(items) => (
        <>
          <Typography.Paragraph type="secondary">Нажмите на спортсменов, которых нужно добавить.</Typography.Paragraph>
          <Space size={[8, 12]} wrap>
            {items.map((a) => (
              <Tag.CheckableTag
                key={a.id}
                className="pick-tag"
                checked={selected.includes(a.id)}
                onChange={(checked) => onToggle(a.id, checked)}
              >
                {selected.includes(a.id) ? '✓ ' : ''}
                {a.fullName}
              </Tag.CheckableTag>
            ))}
          </Space>
        </>
      )}
    </AsyncState>
  )
}

export function AddParticipantsModal({ open, workout, onClose, onAdded }: Props) {
  const { message } = App.useApp()
  const [selected, setSelected] = useState<number[]>([])
  const toggle = (id: number, checked: boolean) =>
    setSelected((prev) => (checked ? [...prev, id] : prev.filter((x) => x !== id)))

  const { run, pending, error, clearError } = useAction(async () => {
    const updated = await workoutApi.addParticipants(workout.id, selected)
    message.success(`Добавлено спортсменов: ${selected.length}`)
    onAdded(updated)
  })

  return (
    <Modal
      title="Добавить спортсменов"
      open={open}
      onCancel={onClose}
      destroyOnHidden
      afterClose={() => {
        setSelected([])
        clearError()
      }}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Отмена
        </Button>,
        <Button key="ok" type="primary" loading={pending} disabled={selected.length === 0} onClick={() => run()}>
          {selected.length ? `Добавить (${selected.length})` : 'Добавить'}
        </Button>,
      ]}
    >
      {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} />}
      <ParticipantPicker
        exclude={new Set(workout.participants.map((p) => p.athleteId))}
        selected={selected}
        onToggle={toggle}
      />
    </Modal>
  )
}
