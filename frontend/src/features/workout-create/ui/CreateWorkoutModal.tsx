import { Alert, App, DatePicker, Form, Input, Modal, TimePicker } from 'antd'
import type { Dayjs } from 'dayjs'
import { ActiveAthleteSelect } from '@/entities/athlete'
import { workoutApi, type Workout } from '@/entities/workout'
import { atTime, conflictToField, rules, useAction } from '@/shared'

interface FormValues {
  title: string
  date: Dayjs
  time: [Dayjs, Dayjs]
  location?: string
  athleteIds?: number[]
}

interface Props {
  open: boolean
  initialDate: Dayjs
  onClose: () => void
  onCreated: (workout: Workout) => void
}

export function CreateWorkoutModal({ open, initialDate, onClose, onCreated }: Props) {
  const { message } = App.useApp()
  const [form] = Form.useForm<FormValues>()
  const { run, pending, error, clearError } = useAction(async ({ title, date, time: [from, to], location, athleteIds }: FormValues) => {
    const workout = await workoutApi.create({
      title,
      start: atTime(date, from),
      end: atTime(date, to),
      location,
      athleteIds: athleteIds ?? [],
    })
    message.success('Тренировка добавлена')
    onCreated(workout)
  }, conflictToField(form, 'time'))

  return (
    <Modal
      title="Новая тренировка"
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      okText="Добавить"
      cancelText="Отмена"
      confirmLoading={pending}
      destroyOnHidden
      afterClose={clearError}
    >
      <Form form={form} layout="vertical" onFinish={run} initialValues={{ date: initialDate }} preserve={false}>
        {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} />}
        <Form.Item label="Название" name="title" rules={rules.text('название')}>
          <Input autoFocus />
        </Form.Item>
        <Form.Item label="Дата" name="date" rules={rules.required('Выберите дату')}>
          <DatePicker style={{ width: '100%' }} format="DD.MM.YYYY" />
        </Form.Item>
        <Form.Item label="Время" name="time" rules={rules.timeRange}>
          <TimePicker.RangePicker format="HH:mm" minuteStep={5} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item label="Место" name="location" rules={rules.optionalText(255)}>
          <Input />
        </Form.Item>
        <Form.Item label="Участники" name="athleteIds">
          <ActiveAthleteSelect />
        </Form.Item>
      </Form>
    </Modal>
  )
}
