import { useState } from 'react'
import { Alert, App, Button, Form, Input, List, Modal, Space, Tag, TimePicker } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import type { Dayjs } from 'dayjs'
import { weekPlanApi, type WeekPlan } from '@/entities/week-plan'
import { conflictToField, errorMessage, rules, useAction, weekdayNames } from '@/shared'

interface SlotValues {
  title: string
  time: [Dayjs, Dayjs]
}

interface Props {
  plan: WeekPlan
  onChanged: (plan: WeekPlan) => void
}

export function WeekBoard({ plan, onChanged }: Props) {
  const { message } = App.useApp()
  const [weekday, setWeekday] = useState<number>()
  const [form] = Form.useForm<SlotValues>()
  const days = weekdayNames.map((name, i) => ({ name, day: i + 1, items: plan.items.filter((p) => p.weekday === i + 1) }))

  const add = useAction(async ({ title, time: [from, to] }: SlotValues) => {
    if (!weekday) return
    const updated = await weekPlanApi.addSlot({ weekday, title, startTime: from.format('HH:mm'), endTime: to.format('HH:mm') })
    message.success('Слот добавлен')
    setWeekday(undefined)
    onChanged(updated)
  }, conflictToField(form, 'time'))

  const remove = async (id: number) => {
    try {
      onChanged(await weekPlanApi.removeSlot(id))
      message.success('Слот удалён')
    } catch (e) {
      message.error(errorMessage(e))
    }
  }

  return (
    <>
      <List
        dataSource={days}
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
        confirmLoading={add.pending}
        destroyOnHidden
        afterClose={add.clearError}
      >
        <Form form={form} layout="vertical" onFinish={add.run} preserve={false}>
          {add.error && <Alert type="error" showIcon message={add.error} style={{ marginBottom: 16 }} />}
          <Form.Item label="Название" name="title" rules={rules.text('название')}>
            <Input autoFocus />
          </Form.Item>
          <Form.Item label="Время" name="time" rules={rules.timeRange}>
            <TimePicker.RangePicker format="HH:mm" minuteStep={5} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}
