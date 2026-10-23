import { Button, Popconfirm, message } from 'antd'
import { workoutApi } from '@/entities/workout'
import { errorMessage } from '@/shared'

export function DeleteWorkoutButton({ workoutId, onDeleted }: { workoutId: number; onDeleted: () => void }) {
  const remove = async () => {
    try {
      await workoutApi.remove(workoutId)
      message.success('Тренировка удалена')
      onDeleted()
    } catch (e) {
      message.error(errorMessage(e))
    }
  }

  return (
    <Popconfirm
      title="Удалить тренировку?"
      description="Вместе с ней удалятся отметки посещаемости."
      okText="Удалить"
      cancelText="Отмена"
      okButtonProps={{ danger: true }}
      onConfirm={remove}
    >
      <Button danger>Удалить</Button>
    </Popconfirm>
  )
}
