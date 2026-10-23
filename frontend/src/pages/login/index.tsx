import { Card, Typography } from 'antd'
import { useNavigate } from 'react-router-dom'
import { LoginForm } from '@/features/auth-login'
import { routes } from '@/shared'

export default function LoginPage() {
  const navigate = useNavigate()
  return (
    <div className="login-wrap">
      <Card className="page-enter" style={{ width: '100%', maxWidth: 380 }}>
        <Typography.Title level={3} style={{ marginTop: 0 }}>
          Вход для тренера
        </Typography.Title>
        <Typography.Paragraph type="secondary">Демо-режим: пароль demo1234.</Typography.Paragraph>
        <LoginForm onSuccess={() => navigate(routes.dashboard)} />
      </Card>
    </div>
  )
}
