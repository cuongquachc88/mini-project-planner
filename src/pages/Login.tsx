import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, ArrowRight, User, Mail, Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react'
import { createUser, setAppMeta } from '@/db/queries/users'
import { hashPin } from '@/lib/utils/pin'
import { useStore } from '@/store'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

type Step = 'identity' | 'pin'

export default function Login() {
  const navigate = useNavigate()
  const { setCurrentUser, unlock } = useStore()

  const [step, setStep] = useState<Step>('identity')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [pin, setPin] = useState('')
  const [pinConfirm, setPinConfirm] = useState('')
  const [showPin, setShowPin] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleIdentity(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !email.trim()) { setError('Name and email are required'); return }
    setError('')
    setStep('pin')
  }

  async function handleFinish(e: React.FormEvent) {
    e.preventDefault()
    if (pin.length < 4) { setError('PIN must be at least 4 digits'); return }
    if (!/^\d+$/.test(pin)) { setError('Digits only'); return }
    if (pin !== pinConfirm) { setError('PINs do not match'); return }
    setLoading(true); setError('')
    try {
      const user = await createUser({ name: name.trim(), email: email.trim(), role: 'admin' })
      const h = await hashPin(pin)
      await Promise.all([
        setAppMeta('active_user_id', user.id),
        setAppMeta('pin_hash', h),
      ])
      setCurrentUser(user)
      unlock()
      navigate('/ui')
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0d0d0f] flex flex-col">
      {/* Grid bg */}
      <div className="fixed inset-0 pointer-events-none"
        style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.015) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.015) 1px,transparent 1px)', backgroundSize: '48px 48px' }} />
      <div className="fixed top-[-20%] left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(ellipse,rgba(124,58,237,0.12) 0%,transparent 70%)' }} />

      {/* Nav */}
      <header className="relative z-10 flex items-center gap-2.5 px-8 pt-6">
        <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-900/40">
          <Box size={15} className="text-white" strokeWidth={2} />
        </div>
        <span className="text-[15px] font-semibold text-white tracking-tight">Planner</span>
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-4 pb-16">
        <div className="w-full max-w-sm">

          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {(['identity', 'pin'] as Step[]).map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-all ${
                  step === s ? 'bg-violet-600 text-white' :
                  (step === 'pin' && i === 0) ? 'bg-violet-600/30 text-violet-400' :
                  'bg-white/[0.06] text-white/25'
                }`}>{i + 1}</div>
                {i === 0 && <div className="w-8 h-px bg-white/[0.1]" />}
              </div>
            ))}
          </div>

          {step === 'identity' ? (
            <>
              <div className="mb-8 text-center">
                <h1 className="text-[26px] font-bold text-white tracking-tight">Welcome</h1>
                <p className="text-[13px] text-white/40 mt-2">Tell us who you are</p>
              </div>
              <form onSubmit={handleIdentity}
                className="bg-[#111113] border border-white/[0.08] rounded-2xl p-6 shadow-2xl shadow-black/60 space-y-4">
                <div className="space-y-1">
                  <label className="block text-[11px] font-medium text-white/35 uppercase tracking-wider">Display name</label>
                  <div className="relative">
                    <User size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none" />
                    <Input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" className="pl-8" autoFocus />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] font-medium text-white/35 uppercase tracking-wider">Email</label>
                  <div className="relative">
                    <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none" />
                    <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className="pl-8" />
                  </div>
                </div>
                {error && <p className="text-red-400 text-[12px]">{error}</p>}
                <Button type="submit" className="w-full gap-2 mt-1">
                  Next <ArrowRight size={14} />
                </Button>
                <p className="text-center text-[11px] text-white/20 pt-1">
                  All data stays on your device
                </p>
              </form>
            </>
          ) : (
            <>
              <div className="mb-8 text-center">
                <div className="w-14 h-14 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mx-auto mb-4">
                  <Lock size={24} className="text-violet-400" strokeWidth={1.8} />
                </div>
                <h1 className="text-[26px] font-bold text-white tracking-tight">Set your PIN</h1>
                <p className="text-[13px] text-white/40 mt-2">Used to unlock the app on return visits</p>
              </div>
              <form onSubmit={handleFinish}
                className="bg-[#111113] border border-white/[0.08] rounded-2xl p-6 shadow-2xl shadow-black/60 space-y-4">
                <div className="space-y-1">
                  <label className="block text-[11px] font-medium text-white/35 uppercase tracking-wider">PIN (4–8 digits)</label>
                  <div className="relative">
                    <Lock size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none" />
                    <Input
                      type={showPin ? 'text' : 'password'}
                      inputMode="numeric"
                      maxLength={8}
                      value={pin}
                      onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
                      placeholder="••••"
                      className="pl-8 pr-9 font-mono tracking-widest"
                      autoFocus
                    />
                    <button type="button" onClick={() => setShowPin(v => !v)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 transition-colors">
                      {showPin ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] font-medium text-white/35 uppercase tracking-wider">Confirm PIN</label>
                  <div className="relative">
                    <Lock size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none" />
                    <Input
                      type={showPin ? 'text' : 'password'}
                      inputMode="numeric"
                      maxLength={8}
                      value={pinConfirm}
                      onChange={e => setPinConfirm(e.target.value.replace(/\D/g, ''))}
                      placeholder="••••"
                      className="pl-8 font-mono tracking-widest"
                    />
                  </div>
                </div>
                {error && <p className="text-red-400 text-[12px]">{error}</p>}
                <Button type="submit" disabled={loading} className="w-full gap-2 mt-1">
                  {loading ? 'Setting up…' : 'Get started'} {!loading && <ArrowRight size={14} />}
                </Button>
                <button type="button" onClick={() => { setStep('identity'); setError('') }}
                  className="w-full text-center text-[12px] text-white/25 hover:text-white/50 transition-colors">
                  ← Back
                </button>
                <p className="text-center text-[11px] text-white/20 flex items-center justify-center gap-1">
                  <ShieldCheck size={10} /> PIN is hashed locally, never sent anywhere
                </p>
              </form>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
