import { Space, Tag } from 'antd'

export function AthleteStatusTags({ isActive, hasActiveInjury }: { isActive: boolean; hasActiveInjury: boolean }) {
  return (
    <Space size={4}>
      <Tag color={isActive ? '#79a3e1' : 'default'}>{isActive ? 'Активен' : 'В архиве'}</Tag>
      {hasActiveInjury && <Tag color="#c87183">Травма</Tag>}
    </Space>
  )
}
