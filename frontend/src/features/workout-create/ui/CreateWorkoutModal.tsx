import { useState } from 'react'
import { Alert, DatePicker, Form, Input, Modal, Select, TimePicker, message } from 'antd'
import type { Dayjs } from 'dayjs'
import { athleteApi } from '@/entities/athlete'
import { workoutApi, type Workout } from '@/entities/workout'
import { ApiError, errorMessage, rules, useQuery } from '@/shared'

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
  const [form] = Form.useForm<FormValues>()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string>()
  const athletes = useQuery(
    () => (open ? athleteApi.list({ search: '', filter: 'active' }) : Promise.resolve([])),
    [open],
  )

  const submit = async (values: FormValues) => {
    const [from, to] = values.time
    const start = values.date.hour(from.hour()).minute(from.minute()).second(0)
    const end = values.date.hour(to.hour()).minute(to.minute()).second(0)
    setSubmitting(true)
    setError(undefined)
    try {
      const workout = await workoutApi.create({
        title: values.title,
        start: start.format(),
        end: end.format(),
        location: values.location,
        athleteIds: values.athleteIds ?? [],
      })
      message.success('Тренировка добавлена')
      onCreated(workout)
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
      title="Новая тренировка"
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      okText="Добавить"
      cancelText="Отмена"
      confirmLoading={submitting}
      afterClose={() => {
        form.resetFields()
        setError(undefined)
      }}
    >
      <Form form={form} layout="vertical" onFinish={submit} initialValues={{ date: initialDate }} key={initialDate.format('YYYY-MM-DD')}>
        {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} />}
        <Form.Item label="Название" name="title" rules={rules.text('название')}>
          <Input autoFocus />
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
        <Form.Item label="Участники" name="athleteIds">
          <Select
            mode="multiple"
            placeholder="Выберите спортсменов"
            loading={athletes.loading}
            optionFilterProp="label"
            options={(athletes.data ?? []).map((a) => ({ value: a.id, label: a.fullName }))}
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}
