import type { Rule } from 'antd/es/form'

export const rules = {
  text: (label: string, max = 255): Rule[] => [
    { required: true, whitespace: true, message: `Введите ${label}` },
    { max, message: `Не длиннее ${max} символов` },
  ],
  optionalText: (max: number): Rule[] => [{ max, message: `Не длиннее ${max} символов` }],
  phone: [
    {
      pattern: /^\+?[0-9\s()-]{7,20}$/,
      message: 'Телефон: 7–20 символов, цифры, пробелы, скобки, дефис, можно + в начале',
    },
  ] as Rule[],
  email: [
    { required: true, message: 'Введите email' },
    { type: 'email', message: 'Введите корректный email, например name@example.com' },
  ] as Rule[],
  required: (message: string): Rule[] => [{ required: true, message }],
}
