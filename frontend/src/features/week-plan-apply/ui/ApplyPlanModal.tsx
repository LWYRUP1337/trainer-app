import { useState } from 'react'
import { Alert, Button, DatePicker, Form, InputNumber, List, Modal } from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import { weekPlanApi, type ApplyPlanResult } from '@/entities/week-plan'
import { DATE_API, errorMessage, rules } from '@/shared'

interface FormValues {
  startDate: Dayjs
  weeks: number
}

interface Props {
  open: boolean
  onClose: () => void
}

const nextMonday = () => {
  const today = dayjs()
  const offset = (8 - (today.day() === 0 ? 7 : today.day())) % 7 || 7
  return today.add(offset, 'day')
}

export function ApplyPlanModal({ open, onClose }: Props) {
  const [form] = Form.useForm<FormValues>()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string>()
  const [result, setResult] = useState<ApplyPlanResult>()

  const submit = async (values: FormValues) => {
    setSubmitting(true)
    setError(undefined)
    try {
      setResult(await weekPlanApi.apply({ startDate: values.startDate.format(DATE_API), weeks: values.weeks }))
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      title="Применить шаблон недели"
      open={open}
      onCancel={onClose}
      afterClose={() => {
        setResult(undefined)
        setError(undefined)
        form.resetFields()
      }}
      footer={
        result ? (
          <Button type="primary" onClick={onClose}>
            Готово
          </Button>
        ) : (
          [
            <Button key="c" onClick={onClose}>
              Отмена
            </Button>,
            <Button key="o" type="primary" loading={submitting} onClick={() => form.submit()}>
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
        <Form form={form} layout="vertical" onFinish={submit} initialValues={{ weeks: 4, startDate: nextMonday() }}>
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
