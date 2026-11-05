import { Alert, App, Button, Form, Input, Space, Typography } from 'antd'
import { athleteApi, type Athlete } from '@/entities/athlete'
import { rules, useAction } from '@/shared'

interface Props {
  athlete: Athlete
  onSaved: (athlete: Athlete) => void
}

interface FormValues {
  plan?: string
}

export function NutritionForm({ athlete, onSaved }: Props) {
  const { message } = App.useApp()
  const [form] = Form.useForm<FormValues>()
  const plan = Form.useWatch('plan', form) ?? athlete.nutritionPlan
  const dirty = plan !== athlete.nutritionPlan
  const { run, pending, error } = useAction(async ({ plan: value }: FormValues) => {
    const updated = await athleteApi.update(athlete.id, { nutritionPlan: value ?? '' })
    message.success('План питания сохранён')
    onSaved(updated)
  })

  return (
    <Form form={form} layout="vertical" onFinish={run} initialValues={{ plan: athlete.nutritionPlan }}>
      <Typography.Paragraph type="secondary">Общий план питания спортсмена.</Typography.Paragraph>
      {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} />}
      <Form.Item name="plan" rules={rules.optionalText(5000)}>
        <Input.TextArea rows={8} showCount maxLength={5000} placeholder="Опишите рацион, режим и ограничения" />
      </Form.Item>
      <Space>
        <Button type="primary" htmlType="submit" loading={pending} disabled={!dirty}>
          Сохранить план
        </Button>
        <Button disabled={!dirty || pending} onClick={() => form.resetFields()}>
          Отменить изменения
        </Button>
      </Space>
    </Form>
  )
}
