import { z } from 'zod'

export const FieldSchema = z.object({
  name: z.string().min(1),
  label: z.string().min(1),
  type: z.enum(['text', 'email', 'number', 'boolean', 'date', 'select', 'textarea']),
  required: z.boolean().default(false),
  options: z.array(z.string()).optional(), // for select fields
  placeholder: z.string().optional(),
  defaultValue: z.any().optional(),
})

export const WorkflowActionSchema = z.object({
  type: z.enum(['set_field', 'notify']),
  field: z.string().optional(),
  value: z.string().optional(),
  message: z.string().optional(),
})

export const WorkflowSchema = z.object({
  name: z.string(),
  trigger: z.enum(['on_create', 'on_update']),
  conditions: z.array(z.object({
    field: z.string(),
    operator: z.enum(['equals', 'not_equals', 'contains', 'greater_than', 'less_than']),
    value: z.string(),
  })).default([]),
  actions: z.array(WorkflowActionSchema).min(1),
})

export const CollectionSchema = z.object({
  name: z.string().min(1),
  label: z.string().min(1),
  fields: z.array(FieldSchema).min(1),
  workflows: z.array(WorkflowSchema).optional().default([]),
})

export const AppConfigSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  collections: z.array(CollectionSchema).min(1),
})

export type FieldConfig = z.infer<typeof FieldSchema>
export type CollectionConfig = z.infer<typeof CollectionSchema>
export type AppConfig = z.infer<typeof AppConfigSchema>

export function parseConfig(raw: unknown): {
  config: AppConfig | null
  errors: string[]
} {
  const result = AppConfigSchema.safeParse(raw)
  if (result.success) return { config: result.data, errors: [] }

  const errors = result.error.issues.map(
    (e) => `${e.path.join('.')}: ${e.message}`
  )
  return { config: null, errors }
}

export function validateRecord(
  data: Record<string, unknown>,
  collection: CollectionConfig
): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  for (const field of collection.fields) {
    const value = data[field.name]

    if (field.required && (value === undefined || value === null || value === '')) {
      errors.push(`${field.label} is required`)
      continue
    }

    if (value === undefined || value === null || value === '') continue

    switch (field.type) {
      case 'email':
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value)))
          errors.push(`${field.label} must be a valid email`)
        break
      case 'number':
        if (isNaN(Number(value)))
          errors.push(`${field.label} must be a number`)
        break
      case 'select':
        if (field.options && !field.options.includes(String(value)))
          errors.push(`${field.label} must be one of: ${field.options.join(', ')}`)
        break
    }
  }

  return { valid: errors.length === 0, errors }
}

export type WorkflowConfig = z.infer<typeof WorkflowSchema>