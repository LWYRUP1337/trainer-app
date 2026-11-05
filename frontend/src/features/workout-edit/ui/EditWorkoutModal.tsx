import { Alert, App, DatePicker, Form, Input, Modal, TimePicker } from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import { workoutApi, type WorkoutDetails } from '@/entities/workout'
import { atTime, conflictToField, rules, useAction } from '@/shared'

interface FormValues {
  title: string
  date: Dayjs
  time: [Dayjs, Dayjs]
  location?: string
  description?: string
}

interface Props {
  open: boolean
  workout: WorkoutDetails
  onClose: () => void
  onSaved: (workout: WorkoutDetails) => void
}

export function EditWorkoutModal({ open, workout, onClose, onSaved }: Props) {
  const { message } = App.useApp()
  const [form] = Form.useForm<FormValues>()
  const { run, pending, error, clearError } = useAction(async ({ title, date, time: [from, to], location, description }: FormValues) => {
    const updated = await workoutApi.update(workout.id, {
      title: title.trim(),
      location: location?.trim() ?? '',
      description: description?.trim() ?? '',
      start: atTime(date, from),
      end: atTime(date, to),
    })
    message.success('Тренировка обновлена')
    onSaved(updated)
  }, conflictToField(form, 'time'))

  return (
    <Modal
      title="Редактировать тренировку"
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      okText="Сохранить"
      cancelText="Отмена"
      confirmLoading={pending}
      destroyOnHidden
      afterClose={clearError}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={run}
        preserve={false}
        initialValues={{
          title: workout.title,
          date: dayjs(workout.start),
          time: [dayjs(workout.start), dayjs(workout.end)],
          location: workout.location,
          description: workout.description,
        }}
      >
        {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} />}
        <Form.Item label="Название" name="title" rules={rules.text('название')}>
          <Input />
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
        <Form.Item label="План тренировки" name="description" rules={rules.optionalText(5000)}>
          <Input.TextArea rows={3} />
        </Form.Item>
      </Form>
    </Modal>
  )
}
