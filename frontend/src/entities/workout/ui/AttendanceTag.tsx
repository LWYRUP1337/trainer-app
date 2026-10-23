import { Tag } from 'antd'
import { statusColor, statusLabel, type AttendanceStatus } from '../model/types'

export function AttendanceTag({ status }: { status: AttendanceStatus }) {
  return <Tag color={statusColor[status]}>{statusLabel[status]}</Tag>
}
