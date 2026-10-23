import { useState } from 'react'
import { Alert, Button, DatePicker, Form, Input, Popconfirm, Select, Space, Table, Tag, message } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import dayjs, { type Dayjs } from 'dayjs'
import { injuryApi, SeverityTag, severityLabel, type Injury, type Severity } from '@/entities/injury'
import { AsyncState, DATE_API, Expandable, errorMessage, formatDate, rules, useQuery } from '@/shared'

interface FormValues {
  title: string
  bodyPart: string
  severity: Severity
  startedAt: Dayjs
  notes?: string
}

/** Список травм спортсмена + встроенная форма добавления. */
export function InjuriesPanel({ athleteId }: { athleteId: number }) {
  const { data, loading, error, refetch } = useQuery(() => injuryApi.list(athleteId), [athleteId])
  const [formOpen, setFormOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string>()
  const [newId, setNewId] = useState<number>()
  const [form] = Form.useForm<FormValues>()

  const add = async (values: FormValues) => {
    setSubmitting(true)
    setFormError(undefined)
    try {
      const injury = await injuryApi.create(athleteId, { ...values, startedAt: values.startedAt.format(DATE_API) })
      message.success('Травма добавлена')
      form.resetFields()
      setFormOpen(false)
      setNewId(injury.id)
      refetch()
    } catch (e) {
      setFormError(errorMessage(e))
    } finally {
      setSubmitting(false)
    }
  }

  const act = async (action: () => Promise<unknown>, success: string) => {
    try {
      await action()
      message.success(success)
      refetch()
    } catch (e) {
      message.error(errorMessage(e))
    }
  }

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="middle">
      <Button icon={<PlusOutlined />} onClick={() => setFormOpen((v) => !v)}>
        {formOpen ? 'Скрыть форму' : 'Добавить травму'}
      </Button>

      <Expandable open={formOpen}>
        <Form
          form={form}
          layout="vertical"
          onFinish={add}
          initialValues={{ severity: 'light', startedAt: dayjs() }}
          style={{ padding: '4px 4px 16px' }}
        >
          {formError && <Alert type="error" showIcon message={formError} style={{ marginBottom: 16 }} />}
          <Space wrap align="start" size="large">
            <Form.Item label="Название" name="title" rules={rules.text('название травмы')}>
              <Input style={{ width: 260 }} tabIndex={formOpen ? 0 : -1} />
            </Form.Item>
            <Form.Item label="Область тела" name="bodyPart" rules={rules.text('область', 100)}>
              <Input style={{ width: 180 }} tabIndex={formOpen ? 0 : -1} />
            </Form.Item>
            <Form.Item label="Тяжесть" name="severity" rules={rules.required('Выберите тяжесть')}>
              <Select
                style={{ width: 140 }}
                options={(Object.keys(severityLabel) as Severity[]).map((s) => ({ value: s, label: severityLabel[s] }))}
              />
            </Form.Item>
            <Form.Item label="Дата травмы" name="startedAt" rules={rules.required('Укажите дату')}>
              <DatePicker format="DD.MM.YYYY" disabledDate={(d) => d.isAfter(dayjs())} />
            </Form.Item>
          </Space>
          <Form.Item label="Заметки" name="notes" rules={rules.optionalText(5000)}>
            <Input.TextArea rows={2} tabIndex={formOpen ? 0 : -1} />
          </Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={submitting}>
              Сохранить травму
            </Button>
            <Button onClick={() => setFormOpen(false)}>Отмена</Button>
          </Space>
        </Form>
      </Expandable>

      <AsyncState
        loading={loading}
        error={error}
        data={data}
        onRetry={refetch}
        isEmpty={(items) => items.length === 0}
        emptyText="Травм не зафиксировано."
      >
        {(items) => (
          <Table<Injury>
            rowKey="id"
            dataSource={items}
            pagination={false}
            scroll={{ x: 640 }}
            rowClassName={(r) => (r.id === newId ? 'row-new' : '')}
            columns={[
              { title: 'Травма', dataIndex: 'title' },
              { title: 'Область', dataIndex: 'bodyPart' },
              { title: 'Тяжесть', dataIndex: 'severity', render: (s: Severity) => <SeverityTag severity={s} /> },
              { title: 'С', dataIndex: 'startedAt', render: (v: string) => formatDate(v) },
              {
                title: 'Статус',
                render: (_, r) =>
                  r.recoveredAt ? <Tag color="#9fd7ff">Восстановлен {dayjs(r.recoveredAt).format('DD.MM')}</Tag> : <Tag color="#ffcbbe">Активна</Tag>,
              },
              {
                title: '',
                render: (_, r) => (
                  <Space>
                    {!r.recoveredAt && (
                      <Popconfirm title="Отметить, что спортсмен восстановился?" okText="Да" cancelText="Нет" onConfirm={() => act(() => injuryApi.markRecovered(r.id), 'Травма закрыта')}>
                        <Button size="small">Выздоровел</Button>
                      </Popconfirm>
                    )}
                    <Popconfirm title="Удалить запись о травме?" okText="Удалить" cancelText="Отмена" okButtonProps={{ danger: true }} onConfirm={() => act(() => injuryApi.remove(r.id), 'Запись удалена')}>
                      <Button size="small" danger>
                        Удалить
                      </Button>
                    </Popconfirm>
                  </Space>
                ),
              },
            ]}
          />
        )}
      </AsyncState>
    </Space>
  )
}
