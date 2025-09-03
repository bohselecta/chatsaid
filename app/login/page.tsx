'use client';

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // If already logged in, redirect away
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) router.replace('/canopy')
    })
  }, [router])

  const handleMagic = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)
    try {
      const redirectTo = `${window.location.origin}`
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: redirectTo },
      })
      if (error) throw error
      setMessage('Check your email for a magic link to sign in.')
    } catch (err: any) {
      setError(err?.message || 'Failed to send magic link')
    } finally {
      setLoading(false)
    }
  }

  const handlePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })
      if (error) throw error
      router.replace('/canopy')
    } catch (err: any) {
      setError(err?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleOAuth = async (provider: 'google' | 'github') => {
    setLoading(true)
    setError(null)
    setMessage(null)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${window.location.origin}` },
      })
      if (error) throw error
      // Browser will redirect
    } catch (err: any) {
      setError(err?.message || 'OAuth failed')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-[var(--card)] border border-white/10 rounded-2xl p-6 shadow-card">
        <h1 className="text-2xl font-semibold text-[var(--fg)] mb-1">Log in</h1>
        <p className="text-[var(--muted)] mb-6">Use a magic link, password, or OAuth.</p>

        <form className="space-y-4" onSubmit={handleMagic}>
          <div>
            <label htmlFor="email" className="block text-sm text-[var(--fg)] mb-1">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-[var(--fg)] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              placeholder="you@example.com"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading || !email}
              className="flex-1 px-4 py-2 bg-[var(--accent)] text-white rounded-lg disabled:opacity-50"
            >
              Send Magic Link
            </button>
            <button
              type="button"
              onClick={handlePassword}
              disabled={loading || !email || !password}
              className="px-4 py-2 bg-white/10 text-[var(--fg)] rounded-lg disabled:opacity-50"
            >
              Password
            </button>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm text-[var(--fg)] mb-1">Password (optional)</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-[var(--fg)] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              placeholder="••••••••"
            />
          </div>
        </form>

        <div className="mt-6">
          <div className="flex gap-2">
            <button onClick={() => handleOAuth('google')} disabled={loading} className="flex-1 px-4 py-2 bg-white text-black rounded-lg disabled:opacity-50">Google</button>
            <button onClick={() => handleOAuth('github')} disabled={loading} className="flex-1 px-4 py-2 bg-black text-white rounded-lg disabled:opacity-50">GitHub</button>
          </div>
        </div>

        {message && <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-sm">{message}</div>}
        {error && <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">{error}</div>}
      </div>
    </div>
  )
}

