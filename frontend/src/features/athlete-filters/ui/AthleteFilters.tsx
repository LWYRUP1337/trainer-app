import { Input, Segmented, Space } from 'antd'
import type { AthleteFilter } from '@/entities/athlete'

interface Props {
  search: string
  filter: AthleteFilter
  onSearchChange: (value: string) => void
  onFilterChange: (value: AthleteFilter) => void
}

export function AthleteFilters({ search, filter, onSearchChange, onFilterChange }: Props) {
  return (
    <Space wrap>
      <Input.Search
        placeholder="Поиск по имени"
        allowClear
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        style={{ width: 240 }}
      />
      <Segmented<AthleteFilter>
        value={filter}
        onChange={onFilterChange}
        options={[
          { label: 'Активные', value: 'active' },
          { label: 'С травмой', value: 'injured' },
          { label: 'Все', value: 'all' },
        ]}
      />
    </Space>
  )
}
