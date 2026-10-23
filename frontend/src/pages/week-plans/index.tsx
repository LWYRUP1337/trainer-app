import { useState } from 'react'
import { Button, Card, Typography } from 'antd'
import { weekPlanApi } from '@/entities/week-plan'
import { ApplyPlanModal } from '@/features/week-plan-apply'
import { WeekBoard } from '@/features/week-plan-slots'
import { AsyncState, PageHeader, useQuery } from '@/shared'

export default function WeekPlansPage() {
  const { data, loading, error, refetch } = useQuery(() => weekPlanApi.get(), [])
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
        <AsyncState loading={loading} error={error} data={data} onRetry={refetch}>
          {(plan) => <WeekBoard plan={plan} onChanged={refetch} />}
        </AsyncState>
      </Card>
      <ApplyPlanModal open={applying} onClose={() => setApplying(false)} />
    </>
  )
}
