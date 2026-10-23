import { useState } from 'react'
import { Alert, Button, Form, Input, List, Modal, Space, Tag, TimePicker, message } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import type { Dayjs } from 'dayjs'
import { weekPlanApi, type WeekPlan } from '@/entities/week-plan'
import { ApiError, errorMessage, rules, weekdayNames } from '@/shared'

interface SlotValues {
  title: string
  time: [Dayjs, Dayjs]
}

interface Props {
  plan: WeekPlan
  onChanged: () => void
}

/** Недельная сетка: слоты по дням, добавление и удаление. */
export function WeekBoard({ plan, onChanged }: Props) {
  const [weekday, setWeekday] = useState<number>()
  const [form] = Form.useForm<SlotValues>()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string>()

  const add = async (values: SlotValues) => {
    if (!weekday) return
    setSubmitting(true)
    setError(undefined)
    try {
      await weekPlanApi.addSlot({
        weekday,
        title: values.title,
        startTime: values.time[0].format('HH:mm'),
        endTime: values.time[1].format('HH:mm'),
      })
      message.success('Слот добавлен')
      setWeekday(undefined)
      onChanged()
    } catch (e) {
      if (e instanceof ApiError && e.code === 'time_conflict') {
        form.setFields([{ name: 'time', errors: [e.message] }])
      } else {
        setError(errorMessage(e))
      }
    } finally {
      setSubmitting(false)
    }
  }

  const remove = async (id: number) => {
    try {
      await weekPlanApi.removeSlot(id)
      message.success('Слот удалён')
      onChanged()
    } catch (e) {
      message.error(errorMessage(e))
    }
  }

  return (
    <>
      <List
        dataSource={weekdayNames.map((name, i) => ({ name, day: i + 1, items: plan.items.filter((p) => p.weekday === i + 1) }))}
        renderItem={(d) => (
          <List.Item
            actions={[
              <Button key="add" size="small" icon={<PlusOutlined />} onClick={() => setWeekday(d.day)}>
                Слот
              </Button>,
            ]}
          >
            <List.Item.Meta
              title={d.name}
              description={
                d.items.length ? (
                  <Space wrap>
                    {d.items.map((p) => (
                      <Tag
                        key={p.id}
                        className="fade-in"
                        color="#d2c4ff"
                        closable
                        onClose={(e) => {
                          e.preventDefault()
                          remove(p.id)
                        }}
                      >
                        {p.startTime}–{p.endTime} · {p.title}
                      </Tag>
                    ))}
                  </Space>
                ) : (
                  'Выходной'
                )
              }
            />
          </List.Item>
        )}
      />
      <Modal
        title={`Новый слот: ${weekday ? weekdayNames[weekday - 1] : ''}`}
        open={weekday !== undefined}
        onCancel={() => setWeekday(undefined)}
        onOk={() => form.submit()}
        okText="Добавить"
        cancelText="Отмена"
        confirmLoading={submitting}
        afterClose={() => {
          form.resetFields()
          setError(undefined)
        }}
      >
        <Form form={form} layout="vertical" onFinish={add}>
          {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} />}
          <Form.Item label="Название" name="title" rules={rules.text('название')}>
            <Input autoFocus />
          </Form.Item>
          <Form.Item
            label="Время"
            name="time"
            rules={[
              ...rules.required('Укажите время начала и конца'),
              {
                validator: (_, value?: [Dayjs, Dayjs]) =>
                  !value || value[1].isAfter(value[0], 'minute')
                    ? Promise.resolve()
                    : Promise.reject(new Error('Конец должен быть позже начала')),
              },
            ]}
          >
            <TimePicker.RangePicker format="HH:mm" minuteStep={5} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}
