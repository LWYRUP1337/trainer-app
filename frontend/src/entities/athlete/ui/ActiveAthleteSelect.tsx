import { Select, type SelectProps } from 'antd'
import { useQuery } from '@/shared'
import { athleteApi } from '../api/athleteApi'

type Props = Omit<SelectProps<number[]>, 'mode' | 'options' | 'loading'>

export function ActiveAthleteSelect(props: Props) {
  const { data, loading } = useQuery(() => athleteApi.active(), [])
  return (
    <Select
      placeholder="Выберите спортсменов"
      optionFilterProp="label"
      {...props}
      mode="multiple"
      loading={loading}
      options={data?.map((a) => ({ value: a.id, label: a.fullName }))}
    />
  )
}
