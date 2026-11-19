import { Alert, Button, Form, Input } from 'antd'
import { sessionApi, useSession, type RegisterValues } from '@/entities/session'
import { rules, useAction } from '@/shared'

interface FormValues extends RegisterValues {
  confirm: string
}

export function RegisterForm() {
  const { login } = useSession()
  const { run, pending, error } = useAction(async ({ fullName, email, password }: FormValues) => {
    await sessionApi.register({ fullName, email, password })
    await login(email, password)
  })

  return (
    <Form<FormValues> layout="vertical" onFinish={run} requiredMark={false}>
      {error && <Alert className="fade-in" type="error" showIcon message={error} style={{ marginBottom: 16 }} />}
      <Form.Item label="Имя" name="fullName" rules={rules.text('имя')}>
        <Input autoComplete="name" />
      </Form.Item>
      <Form.Item label="Email" name="email" rules={rules.email}>
        <Input autoComplete="email" />
      </Form.Item>
      <Form.Item label="Пароль" name="password" rules={rules.password}>
        <Input.Password autoComplete="new-password" />
      </Form.Item>
      <Form.Item
        label="Повторите пароль"
        name="confirm"
        dependencies={['password']}
        rules={[
          { required: true, message: 'Повторите пароль' },
          ({ getFieldValue }) => ({
            validator: (_, value?: string) =>
              !value || value === getFieldValue('password')
                ? Promise.resolve()
                : Promise.reject(new Error('Пароли не совпадают')),
          }),
        ]}
      >
        <Input.Password autoComplete="new-password" />
      </Form.Item>
      <Button type="primary" htmlType="submit" block loading={pending}>
        Зарегистрироваться
      </Button>
    </Form>
  )
}
