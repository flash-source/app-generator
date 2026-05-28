'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { AppConfig, CollectionConfig } from '@/lib/config-schema'
import { DynamicForm } from '@/components/DynamicForm'

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
  }, [activeCollection, fetchRecords])

  async function handleCreate(data: Record<string, unknown>) {
    const res = await fetch(`/api/apps/${appId}/${activeCollection.name}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.details?.join(', ') ?? err.error)
    }
    setShowForm(false)
    fetchRecords(activeCollection)
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this record?')) return
    setDeleting(id)
    await fetch(`/api/apps/${appId}/${activeCollection.name}?id=${id}`, {
      method: 'DELETE',
    })
    setRecords(prev => prev.filter(r => r.id !== id))
    setDeleting(null)
  }

  const fields = activeCollection.fields

  return (
    <div className="min-h-screen flex flex-col">

      <nav className="border-b border-zinc-800 px-6 py-3 flex items-center gap-4 shrink-0">
        <button
          onClick={() => router.push('/dashboard')}
          className="text-zinc-400 hover:text-white text-sm transition-colors"
        >
          ← Dashboard
        </button>
        <span className="text-zinc-600">/</span>
        <span className="text-sm font-semibold">{config.name}</span>
        {config.description && (
          <span className="text-zinc-500 text-xs hidden md:block">— {config.description}</span>
        )}
      </nav>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-52 border-r border-zinc-800 p-4 shrink-0">
          <p className="text-zinc-500 text-xs uppercase tracking-wider font-medium mb-3 px-2">
            Collections
          </p>
          <nav className="space-y-0.5">
            {config.collections.map(col => (
              <button
                key={col.name}
                onClick={() => setActiveCollection(col)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between group ${
                  activeCollection.name === col.name
                    ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                }`}
              >
                <span>{col.label}</span>
                <span className={`text-xs ${
                  activeCollection.name === col.name ? 'text-violet-400' : 'text-zinc-600'
                }`}>
                  {col.fields.length}f
                </span>
              </button>
            ))}
          </nav>
        </aside>

        <main className="flex-1 overflow-auto p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-semibold text-lg">{activeCollection.label}</h2>
              <p className="text-zinc-500 text-xs mt-0.5">
                {loading ? 'Loading...' : `${total} record${total !== 1 ? 's' : ''}`}
              </p>
            </div>
            {!showForm && (
              <div className="flex items-center gap-2">
                <CSVImport
                  appId={appId}
                  collection={activeCollection}
                  onImport={() => fetchRecords(activeCollection)}
                />
                <button
                  onClick={() => setShowForm(true)}
                  className="bg-violet-600 hover:bg-violet-500 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                >
                  <span>+</span> Add record
                </button>
              </div>
            )}
          </div>

          {showForm && (
            <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 mb-6">
              <h3 className="font-medium text-sm mb-4">
                New {activeCollection.label} record
              </h3>
              <DynamicForm
                collection={activeCollection}
                onSubmit={handleCreate}
                onCancel={() => setShowForm(false)}
              />
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm mb-4">
              {error}
            </div>
          )}

          {!loading && records.length === 0 && !showForm && (
            <div className="border border-dashed border-zinc-700 rounded-xl p-12 text-center">
              <p className="text-zinc-400 text-sm mb-1">No records yet</p>
              <p className="text-zinc-600 text-xs">Click "Add record" to get started</p>
            </div>
          )}

          {records.length > 0 && (
            <div className="border border-zinc-800 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-800 bg-zinc-900/50">
                      {fields.map(f => (
                        <th
                          key={f.name}
                          className="text-left px-4 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider whitespace-nowrap"
                        >
                          {f.label}
                        </th>
                      ))}
                      <th className="px-4 py-3 text-xs font-medium text-zinc-400 uppercase tracking-wider text-right">
                        Created
                      </th>
                      <th className="w-10" />
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((record, i) => (
                      <tr
                        key={record.id}
                        className={`border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors ${
                          i === records.length - 1 ? 'border-0' : ''
                        }`}
                      >
                        {fields.map(f => (
                          <td key={f.name} className="px-4 py-3 text-zinc-300 max-w-[200px]">
                            <CellValue value={record.data[f.name]} field={f} />
                          </td>
                        ))}
                        <td className="px-4 py-3 text-zinc-500 text-xs text-right whitespace-nowrap">
                          {new Date(record.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleDelete(record.id)}
                            disabled={deleting === record.id}
                            className="text-zinc-600 hover:text-red-400 transition-colors text-xs"
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
  if (value === null || value === undefined || value === '') {
    return <span className="text-zinc-600">—</span>
  }

  if (field.type === 'boolean') {
    return (
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
        value ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-700 text-zinc-400'
      }`}>
        {value ? 'Yes' : 'No'}
      </span>
    )
  }

  if (field.type === 'select') {
    return (
      <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 font-medium">
        {String(value)}
      </span>
    )
  }

  if (field.type === 'email') {
    return (
      <a href={`mailto:${value}`} className="text-violet-400 hover:underline">
        {String(value)}
      </a>
    )
  }

  const str = String(value)
  return (
    <span className="truncate block max-w-[180px]" title={str}>
      {str}
    </span>
  )
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
      method: 'POST',
      body: fd,
    })
    const data = await res.json()
    setResult(data)
    setLoading(false)
    if (data.imported > 0) onImport()
    e.target.value = ''
  }

  return (
    <div className="relative">
      <label className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm border border-zinc-700 cursor-pointer transition-colors ${
        loading ? 'opacity-50 cursor-not-allowed' : 'hover:border-zinc-500 text-zinc-400 hover:text-white'
      }`}>
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
        {loading ? 'Importing...' : 'Import CSV'}
        <input type="file" accept=".csv" onChange={handleFile} className="hidden" disabled={loading} />
      </label>
      {result && (
        <div className="absolute right-0 top-10 z-10 bg-zinc-800 border border-zinc-700 rounded-lg p-3 text-xs whitespace-nowrap shadow-xl">
          <p className="text-emerald-400">✓ {result.imported} imported</p>
          {result.skipped > 0 && <p className="text-amber-400">⚠ {result.skipped} skipped</p>}
          <button onClick={() => setResult(null)} className="text-zinc-500 mt-1">dismiss</button>
        </div>
      )}
    </div>
  )
}