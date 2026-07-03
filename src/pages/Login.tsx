import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, ArrowRight, User, Mail } from 'lucide-react'
import { createUser, setAppMeta } from '@/db/queries/users'
import { useStore } from '@/store'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

export default function Login() {
  const navigate = useNavigate()
  const { setCurrentUser } = useStore()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !email.trim()) { setError('Name and email are required'); return }
    setLoading(true); setError('')
    try {
      const user = await createUser({ name: name.trim(), email: email.trim(), role: 'admin' })
      await setAppMeta('active_user_id', user.id)
      setCurrentUser(user)
      navigate('/')
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0d0d0f] flex flex-col">
      {/* Subtle grid background */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />
      {/* Glow */}
      <div className="fixed top-[-20%] left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, rgba(124,58,237,0.12) 0%, transparent 70%)' }} />

      {/* Top bar */}
      <header className="relative z-10 flex items-center gap-2.5 px-8 pt-6">
        <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-900/40">
          <Box size={15} className="text-white" strokeWidth={2} />
        </div>
        <span className="text-[15px] font-semibold text-white tracking-tight">Planner</span>
      </header>

      {/* Card */}
      <main className="relative z-10 flex flex-1 items-center justify-center px-4 pb-16">
        <div className="w-full max-w-sm">

          <div className="mb-8 text-center">
            <h1 className="text-[26px] font-bold text-white tracking-tight leading-tight">
              Welcome
            </h1>
            <p className="text-[13px] text-white/40 mt-2">
              Your offline-first project workspace
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="bg-[#111113] border border-white/[0.08] rounded-2xl p-6 shadow-2xl shadow-black/60 space-y-4"
          >
            <div className="space-y-1">
              <label className="block text-[11px] font-medium text-white/35 uppercase tracking-wider">
                Display name
              </label>
              <div className="relative">
                <User size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none" />
                <Input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your name"
                  className="pl-8"
                  autoFocus
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-medium text-white/35 uppercase tracking-wider">
                Email
              </label>
              <div className="relative">
                <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none" />
                <Input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="pl-8"
                />
              </div>
            </div>

            {error && (
              <p className="text-red-400 text-[12px]">{error}</p>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full gap-2 mt-1"
            >
              {loading ? 'Setting up…' : 'Get started'}
              {!loading && <ArrowRight size={14} />}
            </Button>

            <p className="text-center text-[11px] text-white/20 pt-1">
              All data stays on your device — no account required
            </p>
          </form>
        </div>
      </main>
    </div>
  )
}
