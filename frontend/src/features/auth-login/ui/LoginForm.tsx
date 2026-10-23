import { useState } from 'react'
import { Alert, Button, Form, Input } from 'antd'
import { coachApi } from '@/entities/coach'
import { errorMessage, rules } from '@/shared'

interface LoginValues {
  email: string
  password: string
}

export function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>()

  const submit = async (values: LoginValues) => {
    setLoading(true)
    setError(undefined)
    try {
      await coachApi.login(values)
      onSuccess()
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Form<LoginValues>
      layout="vertical"
      onFinish={submit}
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
      <Button type="primary" htmlType="submit" block loading={loading}>
        Войти
      </Button>
    </Form>
  )
}
