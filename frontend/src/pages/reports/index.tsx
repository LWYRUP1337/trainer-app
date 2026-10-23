import { useState } from 'react'
import { Card, Col, DatePicker, Progress, Row, Statistic, Table } from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import { Link } from 'react-router-dom'
import { reportApi, type AttendanceRow } from '@/entities/report'
import { AsyncState, PageHeader, routes, useQuery } from '@/shared'

export default function ReportsPage() {
  const [range, setRange] = useState<[Dayjs, Dayjs]>([dayjs().startOf('month'), dayjs().endOf('month')])
  const { data, loading, error, refetch } = useQuery(
    () => reportApi.summary(range[0], range[1]),
    [range[0].valueOf(), range[1].valueOf()],
  )

  return (
    <>
      <PageHeader
        title="Отчёты"
        extra={
          <DatePicker.RangePicker
            value={range}
            format="DD.MM.YYYY"
            allowClear={false}
            onChange={(v) => v?.[0] && v[1] && setRange([v[0], v[1]])}
          />
        }
      />
      <AsyncState
        loading={loading}
        error={error}
        data={data}
        onRetry={refetch}
        isEmpty={(d) => d.rows.length === 0 && d.held === 0}
        emptyText="За выбранный период нет данных. Попробуйте другой период."
      >
        {(d) => (
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={8}><Card className="hover-card"><Statistic title="Проведено тренировок" value={d.held} /></Card></Col>
            <Col xs={24} sm={8}><Card className="hover-card"><Statistic title="Средняя посещаемость" value={d.averagePercent} suffix="%" /></Card></Col>
            <Col xs={24} sm={8}><Card className="hover-card"><Statistic title="Новых травм за период" value={d.newInjuries} /></Card></Col>
            <Col span={24}>
              <Card title="Посещаемость по спортсменам">
                <Table<AttendanceRow>
                  rowKey="athleteId"
                  dataSource={d.rows}
                  loading={loading}
                  pagination={false}
                  scroll={{ x: 560 }}
                  locale={{ emptyText: 'Отметок посещаемости за период нет.' }}
                  columns={[
                    { title: 'Спортсмен', render: (_, r) => <Link to={routes.athlete(r.athleteId)}>{r.fullName}</Link> },
                    { title: 'Был', dataIndex: 'present', sorter: (a, b) => a.present - b.present },
                    { title: 'Не был', dataIndex: 'absent' },
                    { title: 'Уваж.', dataIndex: 'excused' },
                    { title: 'Посещаемость', sorter: (a, b) => a.percent - b.percent, render: (_, r) => <Progress percent={r.percent} size="small" style={{ minWidth: 140 }} /> },
                  ]}
                />
              </Card>
            </Col>
          </Row>
        )}
      </AsyncState>
    </>
  )
}
