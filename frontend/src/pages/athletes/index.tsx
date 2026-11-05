import { useState } from 'react'
import { Button, Card, Space, Table } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { Link } from 'react-router-dom'
import { athleteApi, AthleteStatusTags, type Athlete, type AthleteFilter } from '@/entities/athlete'
import { AddAthleteModal } from '@/features/athlete-create'
import { AthleteFilters } from '@/features/athlete-filters'
import { AsyncState, PageHeader, ageFrom, routes, useDebounced, useQuery } from '@/shared'

const emptyText: Record<AthleteFilter, string> = {
  active: 'Активных спортсменов нет. Добавьте спортсмена или откройте «Все».',
  injured: 'Спортсменов с незакрытыми травмами нет.',
  all: 'Пока нет спортсменов. Добавьте первого.',
}

export default function AthletesPage() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<AthleteFilter>('active')
  const debounced = useDebounced(search, 300)
  const { data, loading, error, refetch } = useQuery(() => athleteApi.list({ search: debounced, filter }), [debounced, filter])
  const [open, setOpen] = useState(false)
  const [newId, setNewId] = useState<number>()

  return (
    <>
      <PageHeader
        title="Спортсмены"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)}>
            Добавить спортсмена
          </Button>
        }
      />
      <Card>
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <AthleteFilters search={search} filter={filter} onSearchChange={setSearch} onFilterChange={setFilter} />
          <AsyncState
            loading={loading}
            error={error}
            data={data}
            onRetry={refetch}
            isEmpty={(items) => items.length === 0}
            emptyText={search.trim() ? 'Ничего не найдено. Измените поиск или фильтр.' : emptyText[filter]}
          >
            {(items) => (
              <Table<Athlete>
                rowKey="id"
                dataSource={items}
                loading={loading}
                pagination={{ pageSize: 8, hideOnSinglePage: true }}
                scroll={{ x: 640 }}
                rowClassName={(r) => (r.id === newId ? 'row-new' : '')}
                columns={[
                  { title: 'Имя', dataIndex: 'fullName', render: (v: string, r) => <Link to={routes.athlete(r.id)}>{v}</Link> },
                  { title: 'Возраст', dataIndex: 'birthDate', render: (v: string | null) => ageFrom(v) ?? '—' },
                  { title: 'Рост / вес', render: (_, r) => (r.heightCm ? `${r.heightCm} см / ${r.weightKg ?? '—'} кг` : '—') },
                  { title: 'Телефон', dataIndex: 'phone', render: (v: string) => v || '—' },
                  { title: 'Статус', render: (_, r) => <AthleteStatusTags isActive={r.isActive} hasActiveInjury={r.hasActiveInjury} /> },
                ]}
              />
            )}
          </AsyncState>
        </Space>
      </Card>
      <AddAthleteModal
        open={open}
        onClose={() => setOpen(false)}
        onCreated={(athlete) => {
          setOpen(false)
          setSearch('')
          setFilter('active')
          setNewId(athlete.id)
          refetch()
        }}
      />
    </>
  )
}
