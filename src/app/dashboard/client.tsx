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
    if (!confirm('Delete this app and all its data?')) return
    setDeleting(id)
    await fetch(`/api/apps/${id}`, { method: 'DELETE' })
    setApps(apps.filter(a => a.id !== id))
    setDeleting(null)
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Navbar */}
      <nav className="sticky top-0 z-10 px-6 py-3.5 flex items-center justify-between border-b"
        style={{ background: 'rgba(250,249,246,0.85)', backdropFilter: 'blur(12px)', borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-2.5">
          <img src="/icon-192.png" alt="AppForge" className="w-7 h-7 rounded-lg" />
          <span className="font-semibold tracking-tight" style={{ color: 'var(--text)' }}>AppForge</span>
        </div>
        <div className="flex items-center gap-5">
          <span className="text-sm hidden sm:block" style={{ color: 'var(--text-muted)' }}>
            {user.name || user.email}
          </span>
          <button onClick={() => signOut({ callbackUrl: '/login' })}
            className="text-sm transition-colors" style={{ color: 'var(--text-muted)' }}>
            Sign out
          </button>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold" style={{ color: 'var(--text)' }}>
              {user.name ? `Hey, ${user.name.split(' ')[0]} 👋` : 'Your Apps'}
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              {apps.length === 0 ? 'No apps yet — create your first one' : `${apps.length} app${apps.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <button onClick={() => router.push('/apps/new')} className="btn-primary px-4 py-2 text-sm flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New App
          </button>
        </div>

        {apps.length === 0 ? (
          <div className="card p-16 text-center">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5 text-2xl"
              style={{ background: 'linear-gradient(135deg, #E0F2FE, #BAE6FD)' }}>
              ⚡
            </div>
            <h2 className="font-semibold text-lg mb-2" style={{ color: 'var(--text)' }}>Build your first app</h2>
            <p className="text-sm mb-6 max-w-xs mx-auto" style={{ color: 'var(--text-muted)' }}>
              Define a JSON config and AppForge generates the UI, APIs, and database — instantly.
            </p>
            <button onClick={() => router.push('/apps/new')} className="btn-primary px-5 py-2.5 text-sm">
              Create app →
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {apps.map(app => (
              <div key={app.id}
                className="card p-5 group hover:shadow-md transition-all duration-200 cursor-pointer"
                style={{ '--tw-shadow': '0 4px 20px rgba(0,0,0,0.06)' } as any}
                onClick={() => router.push(`/apps/${app.id}`)}>
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white"
                    style={{ background: stringToGradient(app.name) }}>
                    {app.name[0].toUpperCase()}
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); deleteApp(app.id) }}
                    disabled={deleting === app.id}
                    className="opacity-0 group-hover:opacity-100 text-xs px-2 py-1 rounded-md transition-all"
                    style={{ color: '#EF4444', background: '#FEF2F2' }}>
                    {deleting === app.id ? '...' : 'Delete'}
                  </button>
                </div>
                <h3 className="font-semibold text-sm mb-1" style={{ color: 'var(--text)' }}>{app.name}</h3>
                {app.description && (
                  <p className="text-xs line-clamp-2 mb-3" style={{ color: 'var(--text-muted)' }}>{app.description}</p>
                )}
                <div className="flex items-center justify-between mt-4 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
                  <div className="flex gap-1.5">
                    {app.collections.slice(0, 3).map(c => (
                      <span key={c.id} className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ background: 'var(--accent-light)', color: 'var(--accent-dark)' }}>
                        {c.name}
                      </span>
                    ))}
                    {app.collections.length > 3 && (
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ color: 'var(--text-subtle)', background: 'var(--surface-2)' }}>
                        +{app.collections.length - 3}
                      </span>
                    )}
                  </div>
                  <span className="text-xs" style={{ color: 'var(--accent)' }}>Open →</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

function stringToGradient(str: string) {
  const gradients = [
    'linear-gradient(135deg, #38BDF8, #6366F1)',
    'linear-gradient(135deg, #34D399, #0EA5E9)',
    'linear-gradient(135deg, #F472B6, #8B5CF6)',
    'linear-gradient(135deg, #FB923C, #F43F5E)',
    'linear-gradient(135deg, #A78BFA, #38BDF8)',
    'linear-gradient(135deg, #4ADE80, #06B6D4)',
  ]
  let hash = 0
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash)
  return gradients[Math.abs(hash) % gradients.length]
}