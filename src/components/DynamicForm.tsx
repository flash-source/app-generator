'use client'
import { useState } from 'react'
import { CollectionConfig, FieldConfig } from '@/lib/config-schema'

interface Props {
  collection: CollectionConfig
  onSubmit: (data: Record<string, unknown>) => Promise<void>
  onCancel: () => void
}

function getDefault(field: FieldConfig): string | boolean {
  if (field.defaultValue !== undefined) return field.defaultValue
  if (field.type === 'boolean') return false
  return ''
}

export function DynamicForm({ collection, onSubmit, onCancel }: Props) {
  const [values, setValues] = useState<Record<string, unknown>>(
    Object.fromEntries(collection.fields.map(f => [f.name, getDefault(f)]))
  )
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  function setValue(name: string, value: unknown) {
    setValues(prev => ({ ...prev, [name]: value }))
    setErrors(prev => ({ ...prev, [name]: '' }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const newErrors: Record<string, string> = {}
    for (const field of collection.fields) {
      const v = values[field.name]
      if (field.required && (v === '' || v === null || v === undefined))
        newErrors[field.name] = `${field.label} is required`
    }
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return }
    setLoading(true)
    try { await onSubmit(values) } finally { setLoading(false) }
  }

  const inputClass = 'input-base'

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {collection.fields.map(field => (
          <div key={field.name} className={field.type === 'textarea' ? 'sm:col-span-2' : ''}>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-muted)' }}>
              {field.label}
              {field.required && <span className="ml-1" style={{ color: 'var(--danger)' }}>*</span>}
            </label>

            {field.type === 'textarea' && (
              <textarea
                value={values[field.name] as string}
                onChange={e => setValue(field.name, e.target.value)}
                placeholder={field.placeholder ?? ''}
                rows={3}
                className={inputClass}
                style={{ resize: 'none' }}
              />
            )}

            {field.type === 'select' && (
              <select
                value={values[field.name] as string}
                onChange={e => setValue(field.name, e.target.value)}
                className={inputClass}
              >
                <option value="">Select...</option>
                {field.options?.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            )}

            {field.type === 'boolean' && (
              <div
                onClick={() => setValue(field.name, !values[field.name])}
                className="flex items-center gap-3 cursor-pointer p-2"
              >
                <div className="w-10 h-5.5 rounded-full relative transition-colors"
                  style={{ background: values[field.name] ? 'var(--accent)' : 'var(--border-strong)', height: '22px' }}>
                  <div className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform"
                    style={{ transform: values[field.name] ? 'translateX(22px)' : 'translateX(2px)' }} />
                </div>
                <span className="text-sm" style={{ color: 'var(--text)' }}>
                  {values[field.name] ? 'Yes' : 'No'}
                </span>
              </div>
            )}

            {['text', 'email', 'number', 'date'].includes(field.type) && (
              <input
                type={field.type}
                value={values[field.name] as string}
                onChange={e => setValue(field.name, e.target.value)}
                placeholder={field.placeholder ?? ''}
                className={inputClass}
              />
            )}

            {errors[field.name] && (
              <p className="text-xs mt-1" style={{ color: 'var(--danger)' }}>{errors[field.name]}</p>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={loading} className="btn-primary px-5 py-2 text-sm">
          {loading ? 'Saving...' : 'Save record'}
        </button>
        <button type="button" onClick={onCancel}
          className="px-4 py-2 text-sm rounded-lg border transition-colors"
          style={{ border: '1.5px solid var(--border)', color: 'var(--text-muted)' }}>
          Cancel
        </button>
      </div>
    </form>
  )
}