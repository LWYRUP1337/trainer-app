import type { ReactNode } from 'react'
import { Button, Empty, Result, Skeleton } from 'antd'

interface AsyncStateProps<T> {
  loading: boolean
  error?: string
  data?: T
  onRetry: () => void
  isEmpty?: (data: T) => boolean
  emptyText?: ReactNode
  children: (data: T) => ReactNode
}

export function AsyncState<T>({ loading, error, data, onRetry, isEmpty, emptyText, children }: AsyncStateProps<T>) {
  if (error && data === undefined) {
    return (
      <Result
        status="warning"
        title="Не удалось загрузить данные"
        subTitle={error}
        extra={
          <Button type="primary" onClick={onRetry}>
            Повторить
          </Button>
        }
      />
    )
  }
  if (data === undefined) return loading ? <Skeleton active paragraph={{ rows: 5 }} /> : null
  if (isEmpty?.(data)) return <Empty description={emptyText ?? 'Нет данных'} style={{ padding: 24 }} />
  return <div className="fade-in">{children(data)}</div>
}
