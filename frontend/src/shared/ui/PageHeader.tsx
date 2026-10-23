import type { ReactNode } from 'react'
import { Space, Typography } from 'antd'
import { Link } from 'react-router-dom'

interface PageHeaderProps {
  title: string
  back?: { to: string; label: string }
  extra?: ReactNode
}

export function PageHeader({ title, back, extra }: PageHeaderProps) {
  return (
    <div style={{ marginBottom: 16 }}>
      {back && <Link to={back.to}>← {back.label}</Link>}
      <Space style={{ width: '100%', justifyContent: 'space-between' }} wrap>
        <Typography.Title level={2} style={{ margin: '4px 0 0' }}>
          {title}
        </Typography.Title>
        {extra}
      </Space>
    </div>
  )
}
