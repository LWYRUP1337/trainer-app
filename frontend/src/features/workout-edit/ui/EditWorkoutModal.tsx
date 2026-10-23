import { useState } from 'react'
import { Alert, DatePicker, Form, Input, Modal, TimePicker, message } from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import { workoutApi, type WorkoutDetails } from '@/entities/workout'
import { ApiError, errorMessage, rules } from '@/shared'

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
  onSaved: () => void
}

export function EditWorkoutModal({ open, workout, onClose, onSaved }: Props) {
  const [form] = Form.useForm<FormValues>()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string>()

  const submit = async (values: FormValues) => {
    const [from, to] = values.time
    const start = values.date.hour(from.hour()).minute(from.minute()).second(0)
    const end = values.date.hour(to.hour()).minute(to.minute()).second(0)
    setSubmitting(true)
    setError(undefined)
    try {
      await workoutApi.update(workout.id, {
        title: values.title.trim(),
        location: values.location?.trim() ?? '',
        description: values.description?.trim() ?? '',
        start: start.format(),
        end: end.format(),
      })
      message.success('Тренировка обновлена')
      onSaved()
    } catch (e) {
      if (e instanceof ApiError && e.code === 'time_conflict') {
        form.setFields([{ name: 'time', errors: [e.message] }])
      } else {
        setError(errorMessage(e))
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      title="Редактировать тренировку"
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      okText="Сохранить"
      cancelText="Отмена"
      confirmLoading={submitting}
      afterClose={() => setError(undefined)}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={submit}
        key={`${workout.id}-${workout.start}-${workout.end}-${workout.title}-${workout.location}-${workout.description}`}
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
        <Form.Item
          label="Время"
          name="time"
          rules={[
            ...rules.required('Укажите время начала и конца'),
            {
              validator: (_, value?: [Dayjs, Dayjs]) =>
                !value || value[1].isAfter(value[0], 'minute')
                  ? Promise.resolve()
                  : Promise.reject(new Error('Конец должен быть позже начала')),
            },
          ]}
        >
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
