import { useState } from 'react'
import { Alert, Button, Form, Input, Space, Typography, message } from 'antd'
import { athleteApi, type Athlete } from '@/entities/athlete'
import { errorMessage, rules } from '@/shared'

interface Props {
  athlete: Athlete
  onSaved: (athlete: Athlete) => void
}

export function NutritionForm({ athlete, onSaved }: Props) {
  const [form] = Form.useForm<{ plan: string }>()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string>()
  const plan = Form.useWatch('plan', form) ?? athlete.nutritionPlan
  const dirty = plan !== athlete.nutritionPlan

  const save = async ({ plan: value }: { plan: string }) => {
    setSaving(true)
    setError(undefined)
    try {
      const updated = await athleteApi.update(athlete.id, { nutritionPlan: value ?? '' })
      message.success('План питания сохранён')
      onSaved(updated)
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Form form={form} layout="vertical" onFinish={save} initialValues={{ plan: athlete.nutritionPlan }}>
      <Typography.Paragraph type="secondary">Общий план питания спортсмена.</Typography.Paragraph>
      {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} />}
      <Form.Item name="plan" rules={rules.optionalText(5000)}>
        <Input.TextArea rows={8} showCount maxLength={5000} placeholder="Опишите рацион, режим и ограничения" />
      </Form.Item>
      <Space>
        <Button type="primary" htmlType="submit" loading={saving} disabled={!dirty}>
          Сохранить план
        </Button>
        <Button disabled={!dirty || saving} onClick={() => form.resetFields()}>
          Отменить изменения
        </Button>
      </Space>
    </Form>
  )
}
