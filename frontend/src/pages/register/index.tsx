import { Card, Typography } from 'antd'
import { Link, useLocation } from 'react-router-dom'
import { RegisterForm } from '@/features/auth-register'
import { routes } from '@/shared'

export default function RegisterPage() {
  const location = useLocation()
  return (
    <div className="login-wrap">
      <Card className="page-enter" style={{ width: '100%', maxWidth: 380 }}>
        <Typography.Title level={3} style={{ marginTop: 0 }}>
          Регистрация тренера
        </Typography.Title>
        <RegisterForm />
        <Typography.Paragraph type="secondary" style={{ margin: '16px 0 0', textAlign: 'center' }}>
          Уже есть аккаунт? <Link to={routes.login} state={location.state}>Войдите</Link>
        </Typography.Paragraph>
      </Card>
    </div>
  )
}
