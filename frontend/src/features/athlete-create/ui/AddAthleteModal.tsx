import { useState } from 'react'
import { Alert, DatePicker, Form, Input, InputNumber, Modal, Space, message } from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import { athleteApi, type Athlete } from '@/entities/athlete'
import { DATE_API, errorMessage, rules } from '@/shared'

interface FormValues {
  fullName: string
  birthDate?: Dayjs
  heightCm?: number
  weightKg?: number
  phone?: string
}

interface Props {
  open: boolean
  onClose: () => void
  onCreated: (athlete: Athlete) => void
}

export function AddAthleteModal({ open, onClose, onCreated }: Props) {
  const [form] = Form.useForm<FormValues>()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string>()

  const submit = async (values: FormValues) => {
    setSubmitting(true)
    setError(undefined)
    try {
      const athlete = await athleteApi.create({
        ...values,
        birthDate: values.birthDate?.format(DATE_API),
      })
      message.success('Спортсмен добавлен')
      onCreated(athlete)
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      title="Новый спортсмен"
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
      <Form form={form} layout="vertical" onFinish={submit} requiredMark="optional">
        {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} />}
        <Form.Item label="Полное имя" name="fullName" rules={rules.text('имя')}>
          <Input autoFocus />
        </Form.Item>
        <Form.Item label="Дата рождения" name="birthDate">
          <DatePicker style={{ width: '100%' }} format="DD.MM.YYYY" disabledDate={(d) => d.isAfter(dayjs())} />
        </Form.Item>
        <Space align="start" wrap>
          <Form.Item
            label="Рост, см"
            name="heightCm"
            rules={[{ type: 'number', min: 50, max: 250, message: 'От 50 до 250 см' }]}
          >
            <InputNumber precision={0} />
          </Form.Item>
          <Form.Item
            label="Вес, кг"
            name="weightKg"
            rules={[{ type: 'number', min: 20, max: 300, message: 'От 20 до 300 кг' }]}
          >
            <InputNumber precision={1} />
          </Form.Item>
        </Space>
        <Form.Item label="Телефон" name="phone" rules={rules.phone}>
          <Input placeholder="+7 900 000-00-00" />
        </Form.Item>
      </Form>
    </Modal>
  )
}
