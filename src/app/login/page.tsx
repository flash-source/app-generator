'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [isRegister, setIsRegister] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (isRegister) {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error)
        setLoading(false)
        return
      }
    }

    const result = await signIn('credentials', { email, password, redirect: false })
    if (result?.error) {
      setError('Invalid email or password')
      setLoading(false)
      return
    }
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg)' }}>
      <div
        className="hidden lg:flex flex-col justify-between w-[420px] shrink-0 p-10"
        style={{ background: 'linear-gradient(160deg, #0EA5E9 0%, #6366F1 100%)' }}
      >
        <div className="flex items-center gap-2.5">
          <img src="/icon-192.png" alt="AppForge" className="w-8 h-8 rounded-lg" />
          <span className="text-blue-700 lg:text-white font-semibold text-2xl tracking-tight">AppForge</span>
        </div>
        <div>
          <blockquote className="text-white/90 text-2xl font-light leading-relaxed mb-6">
            "Define your data.<br />We generate the rest."
          </blockquote>
          <div className="flex flex-col gap-3">
            {['JSON config → live app in seconds', 'Dynamic CRUD APIs, auto-generated', 'Your schema, your rules'].map(f => (
              <div key={f} className="flex items-center gap-2.5 text-white/80 text-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-white/60" />
                {f}
              </div>
            ))}
          </div>
        </div>
        <p className="text-white/40 text-xs">AppForge © 2026</p>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <img src="/icon-192.png" alt="AppForge" className="w-8 h-8 rounded-lg" />
            <span className="font-semibold text-3xl text-sky-600">AppForge</span>
          </div>

          <h1 className="text-2xl font-semibold mb-1 text-center" style={{ color: 'var(--text)' }}>
            {isRegister ? 'Create account' : 'Welcome back'}
          </h1>
          <p className="text-sm mb-7 text-center" style={{ color: 'var(--text-muted)' }}>
            {isRegister ? 'Start building in seconds' : 'Sign in to your workspace'}
          </p>

          <div className="flex flex-col gap-2 mb-5">
            <button
              onClick={() => { setOauthLoading('github'); signIn('github', { callbackUrl: '/dashboard' }) }}
              disabled={!!oauthLoading}
              className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-lg text-sm font-medium border transition-all"
              style={{ border: '1.5px solid var(--border)', color: 'var(--text)', background: 'var(--surface)' }}
            >
              {oauthLoading === 'github' ? <Spinner /> : (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.342-3.369-1.342-.454-1.155-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.741 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
                </svg>
              )}
              Continue with GitHub
            </button>
            <button
              onClick={() => { setOauthLoading('google'); signIn('google', { callbackUrl: '/dashboard' }) }}
              disabled={!!oauthLoading}
              className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-lg text-sm font-medium border transition-all"
              style={{ border: '1.5px solid var(--border)', color: 'var(--text)', background: 'var(--surface)' }}
            >
              {oauthLoading === 'google' ? <Spinner /> : (
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              Continue with Google
            </button>
          </div>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
            <span className="text-xs" style={{ color: 'var(--text-subtle)' }}>or continue with email</span>
            <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {isRegister && (
              <input className="input-base" type="text" placeholder="Your name" value={name} onChange={e => setName(e.target.value)} />
            )}
            <input className="input-base" type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} required />
            <input className="input-base" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />

            {!isRegister && (
              <div className="text-right">
                <button type="button" onClick={() => router.push('/forgot-password')}
                  className="text-xs transition-colors" style={{ color: 'var(--text-muted)' }}>
                  Forgot password?
                </button>
              </div>
            )}

            {error && (
              <p className="text-sm px-3 py-2 rounded-lg" style={{ color: 'var(--danger)', background: 'var(--danger-light)' }}>
                {error}
              </p>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full px-4 py-2.5 text-sm">
              {loading ? <span className="flex items-center justify-center gap-2"><Spinner light /> Please wait...</span>
                : isRegister ? 'Create account' : 'Sign in'}
            </button>
          </form>

          <p className="text-center text-xs mt-5" style={{ color: 'var(--text-muted)' }}>
            {isRegister ? 'Already have an account? ' : "Don't have an account? "}
            <button onClick={() => { setIsRegister(!isRegister); setError('') }}
              className="font-medium transition-colors" style={{ color: 'var(--accent)' }}>
              {isRegister ? 'Sign in' : 'Sign up'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

function Spinner({ light = false }: { light?: boolean }) {
  return (
    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke={light ? 'white' : 'currentColor'} strokeWidth="4" />
      <path className="opacity-75" fill={light ? 'white' : 'currentColor'} d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}