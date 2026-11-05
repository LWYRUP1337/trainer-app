import { useState } from 'react'
import { Alert, Button, DatePicker, Form, InputNumber, List, Modal } from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import { weekPlanApi, type ApplyPlanResult } from '@/entities/week-plan'
import { DATE_API, rules, useAction } from '@/shared'

interface FormValues {
  startDate: Dayjs
  weeks: number
}

interface Props {
  open: boolean
  onClose: () => void
}

const nextMonday = () => dayjs().startOf('day').add(7 - ((dayjs().day() + 6) % 7), 'day')

export function ApplyPlanModal({ open, onClose }: Props) {
  const [form] = Form.useForm<FormValues>()
  const [result, setResult] = useState<ApplyPlanResult>()
  const { run, pending, error, clearError } = useAction(async (values: FormValues) => {
    setResult(await weekPlanApi.apply({ startDate: values.startDate.format(DATE_API), weeks: values.weeks }))
  })

  return (
    <Modal
      title="Применить шаблон недели"
      open={open}
      onCancel={onClose}
      destroyOnHidden
      afterClose={() => {
        setResult(undefined)
        clearError()
      }}
      footer={
        result ? (
          <Button type="primary" onClick={onClose}>
            Готово
          </Button>
        ) : (
          [
            <Button key="cancel" onClick={onClose}>
              Отмена
            </Button>,
            <Button key="ok" type="primary" loading={pending} onClick={() => form.submit()}>
              Создать тренировки
            </Button>,
          ]
        )
      }
    >
      {result ? (
        <div className="fade-in">
          <Alert
            type={result.created ? 'success' : 'warning'}
            showIcon
            message={`Создано тренировок: ${result.created}, пропущено: ${result.skipped.length}`}
          />
          {result.skipped.length > 0 && (
            <List
              size="small"
              header="Пропущено из-за пересечений"
              dataSource={result.skipped}
              renderItem={(s) => (
                <List.Item>
                  {dayjs(s.date).format('DD.MM.YYYY')} {s.startTime} · {s.title}
                </List.Item>
              )}
            />
          )}
        </div>
      ) : (
        <Form form={form} layout="vertical" onFinish={run} initialValues={{ weeks: 4, startDate: nextMonday() }} preserve={false}>
          {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} />}
          <Form.Item label="Начиная с даты" name="startDate" rules={rules.required('Выберите дату')}>
            <DatePicker style={{ width: '100%' }} format="DD.MM.YYYY" />
          </Form.Item>
          <Form.Item
            label="Количество недель"
            name="weeks"
            rules={[
              { required: true, message: 'Укажите количество недель' },
              { type: 'number', min: 1, max: 26, message: 'От 1 до 26 недель' },
            ]}
          >
            <InputNumber precision={0} />
          </Form.Item>
        </Form>
      )}
    </Modal>
  )
}
