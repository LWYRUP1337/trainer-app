import { Tag } from 'antd'
import { severityColor, severityLabel, type Severity } from '../model/types'

export function SeverityTag({ severity }: { severity: Severity }) {
  return <Tag color={severityColor[severity]}>{severityLabel[severity]}</Tag>
}
