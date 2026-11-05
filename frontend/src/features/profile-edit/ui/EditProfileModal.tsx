import { Alert, App, Form, Input, Modal } from 'antd'
import { coachApi, type Coach, type CoachFormValues } from '@/entities/coach'
import { rules, useAction } from '@/shared'

interface Props {
  open: boolean
  coach: Coach
  onClose: () => void
  onSaved: (coach: Coach) => void
}

export function EditProfileModal({ open, coach, onClose, onSaved }: Props) {
  const { message } = App.useApp()
  const [form] = Form.useForm<CoachFormValues>()
  const { run, pending, error, clearError } = useAction(async (values: CoachFormValues) => {
    const updated = await coachApi.update(values)
    message.success('Профиль обновлён')
    onSaved(updated)
  })

  return (
    <Modal
      title="Редактировать профиль"
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      okText="Сохранить"
      cancelText="Отмена"
      confirmLoading={pending}
      destroyOnHidden
      afterClose={clearError}
    >
      <Form form={form} layout="vertical" onFinish={run} initialValues={coach} preserve={false}>
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
