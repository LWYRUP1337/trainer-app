import { Card, Typography } from 'antd'
import { Link, useLocation } from 'react-router-dom'
import { LoginForm } from '@/features/auth-login'
import { routes } from '@/shared'

export default function LoginPage() {
  const location = useLocation()
  return (
    <div className="login-wrap">
      <Card className="page-enter" style={{ width: '100%', maxWidth: 380 }}>
        <Typography.Title level={3} style={{ marginTop: 0 }}>
          Вход для тренера
        </Typography.Title>
        <LoginForm />
        <Typography.Paragraph type="secondary" style={{ margin: '16px 0 0', textAlign: 'center' }}>
          Нет аккаунта? <Link to={routes.register} state={location.state}>Зарегистрируйтесь</Link>
        </Typography.Paragraph>
      </Card>
    </div>
  )
}
