'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'

interface App {
  id: string
  name: string
  description: string | null
  createdAt: Date
  collections: { id: string; name: string }[]
}

export function DashboardClient({ apps: initial, user }: {
  apps: App[]
  user: { name?: string | null; email?: string | null }
}) {
  const router = useRouter()
  const [apps, setApps] = useState(initial)
  const [deleting, setDeleting] = useState<string | null>(null)

  async function deleteApp(id: string) {
    if (!confirm('Delete this app?')) return
    setDeleting(id)
    await fetch(`/api/apps/${id}`, { method: 'DELETE' })
    setApps(apps.filter(a => a.id !== id))
    setDeleting(null)
  }

  return (
    <div className="min-h-screen">
      <nav className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/icon-192.png" alt="AppForge" className="w-7 h-7 rounded-md object-cover" />
          <span className="font-semibold tracking-tight">AppForge</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-zinc-400 text-sm">{user.email}</span>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="text-zinc-400 hover:text-white text-sm transition-colors"
          >
            Sign out
          </button>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Your Apps</h1>
            <p className="text-zinc-400 text-sm mt-1">
              {apps.length === 0 ? 'No apps yet' : `${apps.length} app${apps.length > 1 ? 's' : ''}`}
            </p>
          </div>
          <button
            onClick={() => router.push('/apps/new')}
            className="bg-violet-600 hover:bg-violet-500 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            <span>+</span> New App
          </button>
        </div>

        {apps.length === 0 && (
          <div className="border border-dashed border-zinc-700 rounded-xl p-16 text-center">
            <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center mx-auto mb-4 text-2xl">⚡</div>
            <h2 className="font-medium mb-2">Build your first app</h2>
            <p className="text-zinc-400 text-sm mb-6 max-w-sm mx-auto">
              Define a JSON config and AppForge generates the UI, APIs, and database automatically.
            </p>
            <button
              onClick={() => router.push('/apps/new')}
              className="bg-violet-600 hover:bg-violet-500 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Create app
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {apps.map(app => (
            <div
              key={app.id}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-zinc-600 transition-colors group"
            >
              <div className="flex items-start justify-between mb-3">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold"
                  style={{ background: stringToColor(app.name) }}
                >
                  {app.name[0].toUpperCase()}
                </div>
                <button
                  onClick={() => deleteApp(app.id)}
                  disabled={deleting === app.id}
                  className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-400 text-xs transition-all"
                >
                  {deleting === app.id ? '...' : 'Delete'}
                </button>
              </div>
              <h3 className="font-medium text-sm mb-1">{app.name}</h3>
              {app.description && (
                <p className="text-zinc-400 text-xs mb-3 line-clamp-2">{app.description}</p>
              )}
              <div className="flex items-center justify-between mt-4">
                <span className="text-zinc-500 text-xs">
                  {app.collections.length} collection{app.collections.length !== 1 ? 's' : ''}
                </span>
                <button
                  onClick={() => router.push(`/apps/${app.id}`)}
                  className="text-violet-400 hover:text-violet-300 text-xs font-medium transition-colors"
                >
                  Open →
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}

function stringToColor(str: string) {
  const colors = [
    '#7c3aed', '#2563eb', '#059669', '#d97706',
    '#dc2626', '#db2777', '#0891b2', '#65a30d'
  ]
  let hash = 0
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}