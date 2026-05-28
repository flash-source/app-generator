'use client'
import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { TEMPLATES } from '@/lib/templates'
import { parseConfig } from '@/lib/config-schema'

const PLACEHOLDER = JSON.stringify(TEMPLATES[0].config, null, 2)

export function AppCreator() {
  const router = useRouter()
  const [json, setJson] = useState(PLACEHOLDER)
  const [errors, setErrors] = useState<string[]>([])
  const [isValid, setIsValid] = useState(true)
  const [loading, setLoading] = useState(false)
  const [activeTemplate, setActiveTemplate] = useState(0)

  const validate = useCallback((value: string) => {
    try {
      const parsed = JSON.parse(value)
      const { errors } = parseConfig(parsed)
      setErrors(errors)
      setIsValid(errors.length === 0)
    } catch {
      setErrors(['Invalid JSON syntax'])
      setIsValid(false)
    }
  }, [])

  function handleChange(value: string) {
    setJson(value)
    validate(value)
  }

  function applyTemplate(idx: number) {
    const t = TEMPLATES[idx]
    const str = JSON.stringify(t.config, null, 2)
    setActiveTemplate(idx)
    setJson(str)
    validate(str)
  }

  async function handleCreate() {
    if (!isValid) return
    setLoading(true)
    try {
      const config = JSON.parse(json)
      const res = await fetch('/api/apps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config }),
      })
      if (!res.ok) {
        const data = await res.json()
        setErrors(data.details ?? [data.error])
        setLoading(false)
        return
      }
      const app = await res.json()
      router.push(`/apps/${app.id}`)
    } catch {
      setErrors(['Something went wrong'])
      setLoading(false)
    }
  }

  let preview: any = null
  try { preview = JSON.parse(json) } catch {}

  return (
    <div className="min-h-screen">
      <nav className="border-b border-zinc-800 px-6 py-4 flex items-center gap-4">
        <button
          onClick={() => router.push('/dashboard')}
          className="text-zinc-400 hover:text-white text-sm transition-colors"
        >
          ← Dashboard
        </button>
        <span className="text-zinc-600">/</span>
        <span className="text-sm font-medium">New App</span>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight">Create App</h1>
          <p className="text-zinc-400 text-sm mt-1">
            Define your app structure in JSON. AppForge generates the UI and APIs automatically.
          </p>
        </div>

        <div className="flex gap-2 mb-6">
          {TEMPLATES.map((t, i) => (
            <button
              key={i}
              onClick={() => applyTemplate(i)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                activeTemplate === i
                  ? 'bg-violet-600 border-violet-500 text-white'
                  : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-500'
              }`}
            >
              {t.name}
            </button>
          ))}
          <span className="text-zinc-600 text-xs self-center ml-2">← start with a template</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                Config JSON
              </label>
              <div className="flex items-center gap-2">
                {isValid ? (
                  <span className="text-emerald-400 text-xs flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                    Valid
                  </span>
                ) : (
                  <span className="text-red-400 text-xs flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" />
                    {errors.length} error{errors.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
            <textarea
              value={json}
              onChange={e => handleChange(e.target.value)}
              spellCheck={false}
              className="w-full h-[480px] bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-4 text-sm font-mono outline-none focus:border-violet-500 transition-colors resize-none text-zinc-100 leading-relaxed"
            />
            {errors.length > 0 && (
              <div className="mt-2 space-y-1">
                {errors.map((e, i) => (
                  <p key={i} className="text-red-400 text-xs font-mono">⚠ {e}</p>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center mb-2">
              <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                Preview
              </label>
            </div>
            <div className="h-[480px] bg-zinc-900 border border-zinc-700 rounded-xl p-5 overflow-y-auto">
              {!preview ? (
                <p className="text-zinc-500 text-sm">Fix JSON syntax to see preview</p>
              ) : (
                <div className="space-y-5">
                  <div>
                    <h2 className="font-semibold text-lg">{preview.name || 'Untitled App'}</h2>
                    {preview.description && (
                      <p className="text-zinc-400 text-sm mt-1">{preview.description}</p>
                    )}
                  </div>
                  {Array.isArray(preview.collections) && preview.collections.map((col: any, i: number) => (
                    <div key={i} className="bg-zinc-800 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-2 h-2 rounded-full bg-violet-400" />
                        <h3 className="font-medium text-sm">{col.label || col.name}</h3>
                        <span className="text-zinc-500 text-xs ml-auto">
                          {Array.isArray(col.fields) ? col.fields.length : 0} fields
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        {Array.isArray(col.fields) && col.fields.map((f: any, j: number) => (
                          <div key={j} className="flex items-center gap-2 text-xs">
                            <span className={`px-1.5 py-0.5 rounded font-mono ${typeColor(f.type)}`}>
                              {f.type || '?'}
                            </span>
                            <span className="text-zinc-300">{f.label || f.name}</span>
                            {f.required && (
                              <span className="text-red-400 ml-auto">required</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mt-6">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-zinc-400 hover:text-white text-sm transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!isValid || loading}
            className="bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed px-6 py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            {loading ? 'Creating...' : 'Create App →'}
          </button>
        </div>
      </div>
    </div>
  )
}

function typeColor(type: string) {
  const map: Record<string, string> = {
    text: 'bg-blue-500/20 text-blue-300',
    email: 'bg-cyan-500/20 text-cyan-300',
    number: 'bg-amber-500/20 text-amber-300',
    boolean: 'bg-emerald-500/20 text-emerald-300',
    date: 'bg-purple-500/20 text-purple-300',
    select: 'bg-pink-500/20 text-pink-300',
    textarea: 'bg-zinc-500/20 text-zinc-300',
  }
  return map[type] ?? 'bg-zinc-700 text-zinc-400'
}