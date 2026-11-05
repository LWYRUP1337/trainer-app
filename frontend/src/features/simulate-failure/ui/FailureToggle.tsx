import { Space, Switch, Tooltip, Typography } from 'antd'
import { setSimulateFailure } from '@/shared'

export function FailureToggle() {
  if (!import.meta.env.DEV) return null
  return (
    <Tooltip title="Демо: включите, чтобы увидеть состояние ошибки загрузки, затем нажмите «Повторить»">
      <Space size={8}>
        <Switch size="small" onChange={setSimulateFailure} aria-label="Имитировать сбой сети" />
        <Typography.Text type="secondary" style={{ fontSize: 13 }}>
          Сбой сети
        </Typography.Text>
      </Space>
    </Tooltip>
  )
}
