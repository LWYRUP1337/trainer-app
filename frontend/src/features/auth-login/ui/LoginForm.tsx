import { Alert, Button, Form, Input } from 'antd'
import { useSession } from '@/entities/session'
import { rules, useAction } from '@/shared'

interface LoginValues {
  email: string
  password: string
}

export function LoginForm() {
  const { login } = useSession()
  const { run, pending, error } = useAction(({ email, password }: LoginValues) => login(email, password))

  return (
    <Form<LoginValues> layout="vertical" onFinish={run} requiredMark={false}>
      {error && <Alert className="fade-in" type="error" showIcon message={error} style={{ marginBottom: 16 }} />}
      <Form.Item label="Email" name="email" rules={rules.email}>
        <Input autoComplete="email" />
      </Form.Item>
      <Form.Item label="Пароль" name="password" rules={rules.required('Введите пароль')}>
        <Input.Password autoComplete="current-password" />
      </Form.Item>
      <Button type="primary" htmlType="submit" block loading={pending}>
        Войти
      </Button>
    </Form>
  )
}
