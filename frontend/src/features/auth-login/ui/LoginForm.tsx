import { Alert, Button, Form, Input } from 'antd'
import { coachApi } from '@/entities/coach'
import { rules, useAction } from '@/shared'

interface LoginValues {
  email: string
  password: string
}

export function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const { run, pending, error } = useAction(async (values: LoginValues) => {
    await coachApi.login(values)
    onSuccess()
  })

  return (
    <Form<LoginValues>
      layout="vertical"
      onFinish={run}
      initialValues={{ email: 'coach@example.com', password: 'demo1234' }}
      requiredMark={false}
    >
      {error && <Alert className="fade-in" type="error" showIcon message={error} style={{ marginBottom: 16 }} />}
      <Form.Item label="Email" name="email" rules={rules.email}>
        <Input autoComplete="email" />
      </Form.Item>
      <Form.Item
        label="Пароль"
        name="password"
        rules={[
          { required: true, message: 'Введите пароль' },
          { min: 8, message: 'Пароль не короче 8 символов' },
        ]}
      >
        <Input.Password autoComplete="current-password" />
      </Form.Item>
      <Button type="primary" htmlType="submit" block loading={pending}>
        Войти
      </Button>
    </Form>
  )
}
