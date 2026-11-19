import { useState } from 'react'
import { Button, Card, Space, Table } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { Link } from 'react-router-dom'
import { athleteApi, AthleteStatusTags, type Athlete, type AthleteFilter } from '@/entities/athlete'
import { AddAthleteModal } from '@/features/athlete-create'
import { AthleteFilters } from '@/features/athlete-filters'
import { AsyncState, PageHeader, ageFrom, routes, useDebounced, useQuery } from '@/shared'

const PAGE_SIZE = 8

const emptyText: Record<AthleteFilter, string> = {
  active: 'Активных спортсменов нет. Добавьте спортсмена или откройте «Все».',
  injured: 'Спортсменов с незакрытыми травмами нет.',
  all: 'Пока нет спортсменов. Добавьте первого.',
}

export default function AthletesPage() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<AthleteFilter>('active')
  const [page, setPage] = useState(1)
  const debounced = useDebounced(search, 300)
  const { data, loading, error, refetch } = useQuery(
    () => athleteApi.list({ search: debounced, filter, page, pageSize: PAGE_SIZE }),
    [debounced, filter, page],
  )
  const [open, setOpen] = useState(false)
  const [newId, setNewId] = useState<number>()

  const changeSearch = (value: string) => {
    setSearch(value)
    setPage(1)
  }

  const changeFilter = (value: AthleteFilter) => {
    setFilter(value)
    setPage(1)
  }

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
          <AthleteFilters search={search} filter={filter} onSearchChange={changeSearch} onFilterChange={changeFilter} />
          <AsyncState
            loading={loading}
            error={error}
            data={data}
            onRetry={refetch}
            isEmpty={(result) => result.total === 0}
            emptyText={search.trim() ? 'Ничего не найдено. Измените поиск или фильтр.' : emptyText[filter]}
          >
            {(result) => (
              <Table<Athlete>
                rowKey="id"
                dataSource={result.items}
                loading={loading}
                pagination={{
                  current: page,
                  pageSize: PAGE_SIZE,
                  total: result.total,
                  onChange: setPage,
                  showSizeChanger: false,
                  hideOnSinglePage: true,
                }}
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
          changeSearch('')
          changeFilter('active')
          setNewId(athlete.id)
          refetch()
        }}
      />
    </>
  )
}
