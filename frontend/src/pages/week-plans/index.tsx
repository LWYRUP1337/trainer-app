import { useState } from 'react'
import { Button, Card, Space, Typography } from 'antd'
import { weekPlanApi } from '@/entities/week-plan'
import { ApplyPlanModal } from '@/features/week-plan-apply'
import { CreatePlanButton } from '@/features/week-plan-create'
import { WeekBoard } from '@/features/week-plan-slots'
import { AsyncState, PageHeader, useQuery } from '@/shared'

export default function WeekPlansPage() {
  const { data, loading, error, refetch, setData } = useQuery(() => weekPlanApi.current(), [])
  const [applying, setApplying] = useState(false)

  return (
    <>
      <PageHeader
        title="Планы недель"
        extra={
          <Button type="primary" onClick={() => setApplying(true)} disabled={!data || data.items.length === 0}>
            Повторить на несколько недель
          </Button>
        }
      />
      <Typography.Paragraph type="secondary">
        Шаблон недели: тренировки по дням и времени. Его можно применить на нужное число недель вперёд, пересекающиеся тренировки будут пропущены.
      </Typography.Paragraph>
      <Card>
        <AsyncState
          loading={loading}
          error={error}
          data={data}
          onRetry={refetch}
          isEmpty={(plan) => plan === null}
          emptyText={
            <Space direction="vertical" size="middle">
              Шаблон недели ещё не создан.
              <CreatePlanButton onCreated={setData} />
            </Space>
          }
        >
          {(plan) => plan && <WeekBoard plan={plan} onChanged={setData} />}
        </AsyncState>
      </Card>
      {data && <ApplyPlanModal planId={data.id} open={applying} onClose={() => setApplying(false)} />}
    </>
  )
}
