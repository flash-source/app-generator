'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    if (!res.ok) {
      const data = await res.json()
      setError(data.error)
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-violet-500 rounded-lg flex items-center justify-center text-sm font-bold">A</div>
            <span className="text-xl font-semibold tracking-tight">AppForge</span>
          </div>
          <p className="text-zinc-400 text-sm">Reset your password</p>
        </div>

        {sent ? (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-6 text-center">
            <div className="text-2xl mb-3">📬</div>
            <p className="text-emerald-400 font-medium text-sm mb-1">Check your email</p>
            <p className="text-zinc-400 text-xs">
              If <span className="text-white">{email}</span> has an account, a reset link is on its way.
            </p>
            <p className="text-zinc-600 text-xs mt-3">
              (Dev mode: check your terminal for the reset URL)
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="email"
              placeholder="Your email address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-violet-500 transition-colors"
            />
            {error && <p className="text-red-400 text-xs">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors"
            >
              {loading ? 'Sending...' : 'Send reset link'}
            </button>
          </form>
        )}

        <p className="text-center text-zinc-500 text-xs mt-4">
          <button onClick={() => router.push('/login')} className="text-violet-400 hover:text-violet-300">
            ← Back to login
          </button>
        </p>
      </div>
    </div>
  )
}