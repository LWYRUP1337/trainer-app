import { useState } from 'react'
import { Alert, Form, Input, Modal, message } from 'antd'
import { coachApi, type Coach, type CoachFormValues } from '@/entities/coach'
import { errorMessage, rules } from '@/shared'

interface Props {
  open: boolean
  coach: Coach
  onClose: () => void
  onSaved: () => void
}

export function EditProfileModal({ open, coach, onClose, onSaved }: Props) {
  const [form] = Form.useForm<CoachFormValues>()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string>()

  const submit = async (values: CoachFormValues) => {
    setSubmitting(true)
    setError(undefined)
    try {
      await coachApi.update(values)
      message.success('Профиль обновлён')
      onSaved()
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      title="Редактировать профиль"
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      okText="Сохранить"
      cancelText="Отмена"
      confirmLoading={submitting}
      afterClose={() => {
        form.resetFields()
        setError(undefined)
      }}
    >
      <Form form={form} layout="vertical" onFinish={submit} initialValues={coach} key={coach.fullName + coach.phone + coach.club}>
        {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} />}
        <Form.Item label="Имя" name="fullName" rules={rules.text('имя')}>
          <Input />
        </Form.Item>
        <Form.Item label="Телефон" name="phone" rules={rules.phone}>
          <Input />
        </Form.Item>
        <Form.Item label="Клуб" name="club" rules={rules.optionalText(255)}>
          <Input />
        </Form.Item>
      </Form>
    </Modal>
  )
}
