'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { AppConfig, CollectionConfig } from '@/lib/config-schema'
import { DynamicForm } from '@/components/DynamicForm'
import { TableSkeleton } from '@/components/Skeleton'

interface Props {
  appId: string
  config: AppConfig
  collections: { id: string; name: string }[]
}

interface RecordData {
  id: string
  data: Record<string, unknown>
  createdAt: string
}

export function AppRuntime({ appId, config, collections }: Props) {
  const router = useRouter()
  const [activeCollection, setActiveCollection] = useState(config.collections[0])
  const [records, setRecords] = useState<RecordData[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [formError, setFormError] = useState('')

  const fetchRecords = useCallback(async (col: CollectionConfig) => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/apps/${appId}/${col.name}`)
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setRecords(data.records ?? [])
      setTotal(data.total ?? 0)
    } catch {
      setError('Failed to load records')
    } finally {
      setLoading(false)
    }
  }, [appId])

  useEffect(() => {
    fetchRecords(activeCollection)
    setShowForm(false)
    setFormError('')
  }, [activeCollection, fetchRecords])

  async function handleCreate(data: Record<string, unknown>) {
    setFormError('')
    const res = await fetch(`/api/apps/${appId}/${activeCollection.name}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const err = await res.json()
      setFormError(err.details?.join(', ') ?? err.error)
      throw new Error(formError)
    }
    setShowForm(false)
    fetchRecords(activeCollection)
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this record?')) return
    setDeleting(id)
    await fetch(`/api/apps/${appId}/${activeCollection.name}?id=${id}`, { method: 'DELETE' })
    setRecords(prev => prev.filter(r => r.id !== id))
    setDeleting(null)
  }

  const fields = activeCollection.fields

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>
      {/* Top nav */}
      <nav className="sticky top-0 z-10 border-b px-6 py-3 flex items-center gap-3 shrink-0"
        style={{ background: 'rgba(250,249,246,0.9)', backdropFilter: 'blur(12px)', borderColor: 'var(--border)' }}>
        <button onClick={() => router.push('/dashboard')}
          className="text-sm transition-colors flex items-center gap-1"
          style={{ color: 'var(--text-muted)' }}>
          ← Dashboard
        </button>
        <span style={{ color: 'var(--border-strong)' }}>/</span>
        <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{config.name}</span>
        {config.description && (
          <span className="text-xs hidden md:block" style={{ color: 'var(--text-subtle)' }}>
            — {config.description}
          </span>
        )}
      </nav>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-52 border-r p-3 shrink-0"
          style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
          <p className="text-xs font-semibold uppercase tracking-wider px-3 mb-2 mt-1"
            style={{ color: 'var(--text-subtle)' }}>
            Collections
          </p>
          <nav className="space-y-0.5">
            {config.collections.map(col => (
              <button
                key={col.name}
                onClick={() => setActiveCollection(col)}
                className="w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center justify-between"
                style={activeCollection.name === col.name
                  ? { background: 'var(--accent-light)', color: 'var(--accent-dark)', fontWeight: 500 }
                  : { color: 'var(--text-muted)' }
                }>
                <span>{col.label}</span>
                <span className="text-xs" style={{
                  color: activeCollection.name === col.name ? 'var(--accent)' : 'var(--text-subtle)'
                }}>
                  {col.fields.length}f
                </span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Main */}
        <main className="flex-1 overflow-auto p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-semibold text-lg" style={{ color: 'var(--text)' }}>
                {activeCollection.label}
              </h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                {loading ? 'Loading...' : `${total} record${total !== 1 ? 's' : ''}`}
              </p>
            </div>
            {!showForm && (
              <div className="flex items-center gap-2">
                <CSVImport appId={appId} collection={activeCollection} onImport={() => fetchRecords(activeCollection)} />
                <button onClick={() => setShowForm(true)} className="btn-primary px-3 py-2 text-sm flex items-center gap-2">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add record
                </button>
              </div>
            )}
          </div>

          {/* Inline form */}
          {showForm && (
            <div className="card p-6 mb-6">
              <h3 className="font-semibold text-sm mb-4" style={{ color: 'var(--text)' }}>
                New {activeCollection.label} record
              </h3>
              {formError && (
                <p className="text-sm mb-3 p-3 rounded-lg" style={{ color: 'var(--danger)', background: 'var(--danger-light)' }}>
                  {formError}
                </p>
              )}
              <DynamicForm
                collection={activeCollection}
                onSubmit={handleCreate}
                onCancel={() => { setShowForm(false); setFormError('') }}
              />
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="p-4 rounded-xl mb-4 text-sm border" style={{ color: 'var(--danger)', background: 'var(--danger-light)', borderColor: '#FCA5A5' }}>
              {error}
            </div>
          )}

          {/* Loading skeleton */}
          {loading && <TableSkeleton rows={5} cols={fields.length} />}

          {/* Empty state */}
          {!loading && records.length === 0 && !showForm && !error && (
            <div className="card p-12 text-center">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 text-xl"
                style={{ background: 'var(--accent-light)' }}>
                📋
              </div>
              <p className="text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>No records yet</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Add a record manually or import from CSV
              </p>
            </div>
          )}

          {/* Table */}
          {!loading && records.length > 0 && (
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b" style={{ borderColor: 'var(--border)', background: 'var(--surface-2)' }}>
                      {fields.map(f => (
                        <th key={f.name}
                          className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider whitespace-nowrap"
                          style={{ color: 'var(--text-muted)' }}>
                          {f.label}
                        </th>
                      ))}
                      <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-right"
                        style={{ color: 'var(--text-muted)' }}>
                        Created
                      </th>
                      <th className="w-10" />
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((record, i) => (
                      <tr key={record.id}
                        className="border-b last:border-0 transition-colors"
                        style={{ borderColor: 'var(--border)' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        {fields.map(f => (
                          <td key={f.name} className="px-4 py-3" style={{ color: 'var(--text)' }}>
                            <CellValue value={record.data[f.name]} field={f} />
                          </td>
                        ))}
                        <td className="px-4 py-3 text-xs text-right whitespace-nowrap" style={{ color: 'var(--text-subtle)' }}>
                          {new Date(record.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleDelete(record.id)}
                            disabled={deleting === record.id}
                            className="text-xs px-2 py-1 rounded-md transition-all opacity-0 hover:opacity-100 group-hover:opacity-100"
                            style={{ color: 'var(--danger)', background: 'var(--danger-light)' }}
                            onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                          >
                            {deleting === record.id ? '...' : '✕'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

function CellValue({ value, field }: { value: unknown; field: any }) {
  if (value === null || value === undefined || value === '')
    return <span style={{ color: 'var(--text-subtle)' }}>—</span>

  if (field.type === 'boolean') {
    return (
      <span className="text-xs px-2 py-0.5 rounded-full font-medium"
        style={value
          ? { background: '#D1FAE5', color: '#065F46' }
          : { background: 'var(--surface-2)', color: 'var(--text-muted)' }
        }>
        {value ? 'Yes' : 'No'}
      </span>
    )
  }

  if (field.type === 'select') {
    return (
      <span className="text-xs px-2 py-0.5 rounded-full font-medium"
        style={{ background: 'var(--accent-light)', color: 'var(--accent-dark)' }}>
        {String(value)}
      </span>
    )
  }

  if (field.type === 'email') {
    return (
      <a href={`mailto:${value}`} className="hover:underline" style={{ color: 'var(--accent)' }}>
        {String(value)}
      </a>
    )
  }

  const str = String(value)
  return <span className="truncate block max-w-[200px]" title={str}>{str}</span>
}

function CSVImport({ appId, collection, onImport }: {
  appId: string
  collection: CollectionConfig
  onImport: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ imported: number; skipped: number } | null>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true)
    setResult(null)
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch(`/api/apps/${appId}/${collection.name}/import`, {
      method: 'POST', body: fd,
    })
    const data = await res.json()
    setResult(data)
    setLoading(false)
    if (data.imported > 0) onImport()
    e.target.value = ''
  }

  return (
    <div className="relative">
      <label className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm border cursor-pointer transition-all"
        style={{ border: '1.5px solid var(--border)', color: 'var(--text-muted)', background: 'var(--surface)' }}>
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
        {loading ? 'Importing...' : 'Import CSV'}
        <input type="file" accept=".csv" onChange={handleFile} className="hidden" disabled={loading} />
      </label>
      {result && (
        <div className="absolute right-0 top-11 z-10 card p-3 text-xs whitespace-nowrap shadow-lg">
          <p style={{ color: 'var(--success)' }}>✓ {result.imported} imported</p>
          {result.skipped > 0 && <p style={{ color: 'var(--warning)' }}>⚠ {result.skipped} skipped</p>}
          <button onClick={() => setResult(null)} className="mt-1" style={{ color: 'var(--text-subtle)' }}>dismiss</button>
        </div>
      )}
    </div>
  )
}