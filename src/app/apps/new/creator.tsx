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
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')

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
    const str = JSON.stringify(TEMPLATES[idx].config, null, 2)
    setActiveTemplate(idx)
    setJson(str)
    validate(str)
  }

  async function handleGenerate() {
    if (!aiPrompt.trim()) return
    setAiLoading(true)
    setAiError('')
    try {
      const res = await fetch('/api/ai/generate-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt }),
      })
      const data = await res.json()
      if (!res.ok) { setAiError(data.error); return }
      const str = JSON.stringify(data.config, null, 2)
      setJson(str)
      validate(str)
      setActiveTemplate(-1)
    } catch {
      setAiError('Something went wrong')
    } finally {
      setAiLoading(false)
    }
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
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <nav className="sticky top-0 z-10 px-6 py-3.5 flex items-center gap-3 border-b"
        style={{ background: 'rgba(250,249,246,0.85)', backdropFilter: 'blur(12px)', borderColor: 'var(--border)' }}>
        <button onClick={() => router.push('/dashboard')}
          className="text-sm transition-colors flex items-center gap-1.5"
          style={{ color: 'var(--text-muted)' }}>
          ← Dashboard
        </button>
        <span style={{ color: 'var(--border-strong)' }}>/</span>
        <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>New App</span>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold" style={{ color: 'var(--text)' }}>Create App</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Define your app structure in JSON. AppForge generates everything else.
          </p>
        </div>

        {/* AI Generator */}
        <div className="card p-4 mb-6" style={{ background: 'linear-gradient(135deg, #F0F9FF, #E0F2FE)', borderColor: '#BAE6FD' }}>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-base">✨</span>
            <span className="text-sm font-semibold" style={{ color: '#0369A1' }}>Generate from prompt</span>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium ml-1"
              style={{ background: '#DBEAFE', color: '#1D4ED8' }}>AI</span>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={aiPrompt}
              onChange={e => setAiPrompt(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleGenerate()}
              placeholder='e.g. "A CRM to track leads, contacts and deals"'
              className="input-base flex-1 text-sm"
              disabled={aiLoading}
            />
            <button
              onClick={handleGenerate}
              disabled={aiLoading || !aiPrompt.trim()}
              className="btn-primary px-4 py-2 text-sm shrink-0 flex items-center gap-2"
            >
              {aiLoading ? (
                <>
                  <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="white" strokeWidth="4"/>
                    <path className="opacity-75" fill="white" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Generating...
                </>
              ) : 'Generate →'}
            </button>
          </div>
          {aiError && <p className="text-xs mt-2" style={{ color: 'var(--danger)' }}>{aiError}</p>}
          <p className="text-xs mt-2" style={{ color: '#0284C7' }}>
            Describe your app in plain English — AI generates the JSON config automatically
          </p>
        </div>

        {/* Templates */}
        <div className="flex gap-2 mb-6 flex-wrap">
          <span className="text-xs self-center mr-1" style={{ color: 'var(--text-subtle)' }}>Start with:</span>
          {TEMPLATES.map((t, i) => (
            <button key={i} onClick={() => applyTemplate(i)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-all"
              style={activeTemplate === i
                ? { background: 'var(--accent-light)', borderColor: 'var(--accent)', color: 'var(--accent-dark)' }
                : { background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-muted)' }
              }>
              {t.name}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Editor */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                Config JSON
              </label>
              <div className="flex items-center gap-1.5 text-xs">
                <span className="w-1.5 h-1.5 rounded-full inline-block"
                  style={{ background: isValid ? 'var(--success)' : 'var(--danger)' }} />
                <span style={{ color: isValid ? 'var(--success)' : 'var(--danger)' }}>
                  {isValid ? 'Valid config' : `${errors.length} error${errors.length > 1 ? 's' : ''}`}
                </span>
              </div>
            </div>
            <textarea
              value={json}
              onChange={e => handleChange(e.target.value)}
              spellCheck={false}
              className="w-full h-[480px] rounded-xl px-4 py-4 text-sm font-mono outline-none resize-none leading-relaxed border"
              style={{
                background: '#1C1917',
                color: '#E7E5E4',
                borderColor: isValid ? 'var(--border)' : '#FCA5A5',
                caretColor: 'var(--accent)',
              }}
            />
            {errors.length > 0 && (
              <div className="mt-2 p-3 rounded-lg border" style={{ background: 'var(--danger-light)', borderColor: '#FCA5A5' }}>
                {errors.map((e, i) => (
                  <p key={i} className="text-xs font-mono" style={{ color: 'var(--danger)' }}>⚠ {e}</p>
                ))}
              </div>
            )}
          </div>

          {/* Preview */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
              Preview
            </label>
            <div className="card h-[480px] p-5 overflow-y-auto">
              {!preview ? (
                <p className="text-sm" style={{ color: 'var(--text-subtle)' }}>Fix JSON to see preview</p>
              ) : (
                <div className="space-y-4">
                  <div>
                    <h2 className="font-semibold text-lg" style={{ color: 'var(--text)' }}>
                      {preview.name || 'Untitled App'}
                    </h2>
                    {preview.description && (
                      <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{preview.description}</p>
                    )}
                  </div>
                  {Array.isArray(preview.collections) && preview.collections.map((col: any, i: number) => (
                    <div key={i} className="rounded-xl p-4 border" style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-2 h-2 rounded-full" style={{ background: 'var(--accent)' }} />
                        <h3 className="font-semibold text-sm" style={{ color: 'var(--text)' }}>
                          {col.label || col.name}
                        </h3>
                        <span className="text-xs ml-auto" style={{ color: 'var(--text-subtle)' }}>
                          {Array.isArray(col.fields) ? col.fields.length : 0} fields
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        {Array.isArray(col.fields) && col.fields.map((f: any, j: number) => (
                          <div key={j} className="flex items-center gap-2 text-xs">
                            <span className="px-1.5 py-0.5 rounded font-mono font-medium"
                              style={{ background: typeColor(f.type).bg, color: typeColor(f.type).text }}>
                              {f.type || '?'}
                            </span>
                            <span style={{ color: 'var(--text)' }}>{f.label || f.name}</span>
                            {f.required && <span className="ml-auto text-xs" style={{ color: 'var(--danger)' }}>required</span>}
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
          <button onClick={() => router.push('/dashboard')}
            className="text-sm transition-colors" style={{ color: 'var(--text-muted)' }}>
            Cancel
          </button>
          <button onClick={handleCreate} disabled={!isValid || loading} className="btn-primary px-6 py-2.5 text-sm">
            {loading ? 'Creating app...' : 'Create App →'}
          </button>
        </div>
      </div>
    </div>
  )
}

function typeColor(type: string) {
  const map: Record<string, { bg: string; text: string }> = {
    text: { bg: '#DBEAFE', text: '#1D4ED8' },
    email: { bg: '#CFFAFE', text: '#0E7490' },
    number: { bg: '#FEF3C7', text: '#B45309' },
    boolean: { bg: '#D1FAE5', text: '#065F46' },
    date: { bg: '#EDE9FE', text: '#5B21B6' },
    select: { bg: '#FCE7F3', text: '#9D174D' },
    textarea: { bg: '#F1F5F9', text: '#475569' },
  }
  return map[type] ?? { bg: '#F1F5F9', text: '#475569' }
}