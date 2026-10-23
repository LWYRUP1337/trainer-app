import { useState } from 'react'
import { Button, Card, Space, Table } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { Link } from 'react-router-dom'
import { athleteApi, AthleteStatusTags, type AthleteFilter, type AthleteListItem } from '@/entities/athlete'
import { AddAthleteModal } from '@/features/athlete-create'
import { AthleteFilters } from '@/features/athlete-filters'
import { AsyncState, PageHeader, ageFrom, routes, useDebounced, useQuery } from '@/shared'

export default function AthletesPage() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<AthleteFilter>('active')
  const debounced = useDebounced(search, 300)
  const { data, loading, error, refetch } = useQuery(
    () => athleteApi.list({ search: debounced, filter }),
    [debounced, filter],
  )
  const [open, setOpen] = useState(false)
  const [newId, setNewId] = useState<number>()
  const filtered = search !== '' || filter !== 'all'

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
            emptyText={filtered ? 'Ничего не найдено. Измените поиск или фильтр.' : 'Пока нет спортсменов. Добавьте первого.'}
          >
            {(items) => (
              <Table<AthleteListItem>
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
