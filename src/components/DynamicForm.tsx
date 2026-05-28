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
      if (field.required && (v === '' || v === null || v === undefined)) {
        newErrors[field.name] = `${field.label} is required`
      }
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setLoading(true)
    try {
      await onSubmit(values)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {collection.fields.map(field => (
        <div key={field.name}>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5">
            {field.label}
            {field.required && <span className="text-red-400 ml-1">*</span>}
          </label>

          {field.type === 'textarea' && (
            <textarea
              value={values[field.name] as string}
              onChange={e => setValue(field.name, e.target.value)}
              placeholder={field.placeholder ?? ''}
              rows={3}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-violet-500 transition-colors resize-none"
            />
          )}

          {field.type === 'select' && (
            <select
              value={values[field.name] as string}
              onChange={e => setValue(field.name, e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-violet-500 transition-colors"
            >
              <option value="">Select...</option>
              {field.options?.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          )}

          {field.type === 'boolean' && (
            <label className="flex items-center gap-2 cursor-pointer">
              <div
                onClick={() => setValue(field.name, !values[field.name])}
                className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                  values[field.name] ? 'bg-violet-600' : 'bg-zinc-700'
                }`}
              >
                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                  values[field.name] ? 'translate-x-5' : 'translate-x-0.5'
                }`} />
              </div>
              <span className="text-sm text-zinc-300">
                {values[field.name] ? 'Yes' : 'No'}
              </span>
            </label>
          )}

          {['text', 'email', 'number', 'date'].includes(field.type) && (
            <input
              type={field.type}
              value={values[field.name] as string}
              onChange={e => setValue(field.name, e.target.value)}
              placeholder={field.placeholder ?? ''}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm outline-none focus:border-violet-500 transition-colors"
            />
          )}

          {errors[field.name] && (
            <p className="text-red-400 text-xs mt-1">{errors[field.name]}</p>
          )}
        </div>
      ))}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="bg-violet-600 hover:bg-violet-500 disabled:opacity-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          {loading ? 'Saving...' : 'Save record'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="text-zinc-400 hover:text-white text-sm transition-colors px-4 py-2"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}