import { App, Button } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { weekPlanApi, type WeekPlan } from '@/entities/week-plan'
import { errorMessage, useAction } from '@/shared'

export function CreatePlanButton({ onCreated }: { onCreated: (plan: WeekPlan) => void }) {
  const { message } = App.useApp()
  const { run, pending } = useAction(
    async () => {
      onCreated(await weekPlanApi.create())
      message.success('Шаблон недели создан')
    },
    (error) => {
      message.error(errorMessage(error))
      return true
    },
  )

  return (
    <Button type="primary" icon={<PlusOutlined />} loading={pending} onClick={() => run()}>
      Создать шаблон недели
    </Button>
  )
}
