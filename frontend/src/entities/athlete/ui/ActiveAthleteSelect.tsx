import { Select } from 'antd'
import { useQuery } from '@/shared'
import { athleteApi } from '../api/athleteApi'

interface Props {
  value?: number[]
  onChange?: (value: number[]) => void
}

export function ActiveAthleteSelect({ value, onChange }: Props) {
  const { data, loading } = useQuery(() => athleteApi.list({ search: '', filter: 'active' }), [])
  return (
    <Select
      mode="multiple"
      value={value}
      onChange={onChange}
      placeholder="Выберите спортсменов"
      loading={loading}
      optionFilterProp="label"
      options={data?.map((a) => ({ value: a.id, label: a.fullName }))}
    />
  )
}
