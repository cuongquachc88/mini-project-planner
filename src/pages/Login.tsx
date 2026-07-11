import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, ArrowRight, User, Mail, ShieldCheck, Lock } from 'lucide-react'
import { createUser, setAppMeta, getAppMeta } from '@/db/queries/users'
import { hashPin, verifyPin } from '@/lib/utils/pin'
import { useStore } from '@/store'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

type Mode = 'loading' | 'unlock' | 'register' | 'reset-pin'

// Single hidden input + 6 display boxes
function PinInput({
  value,
  onChange,
  onComplete,
  error,
  shaking,
  autoFocus,
}: {
  value: string
  onChange: (v: string) => void
  onComplete?: (pin: string) => void
  error?: boolean
  shaking?: boolean
  autoFocus?: boolean
}) {
  const hiddenRef = useRef<HTMLInputElement>(null)
  const digits = value.split('').concat(Array(6).fill('')).slice(0, 6)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value.replace(/\D/g, '').slice(0, 6)
    onChange(v)
    if (v.length === 6 && onComplete) onComplete(v)
  }

  return (
    <div
      className={`flex justify-center gap-2 ${shaking ? 'animate-shake' : ''}`}
      onClick={() => hiddenRef.current?.focus()}
    >
      <input
        ref={hiddenRef}
        type="tel"
        inputMode="numeric"
        autoComplete="one-time-code"
        autoFocus={autoFocus}
        value={value}
        onChange={handleChange}
        className="absolute opacity-0 w-0 h-0 pointer-events-none"
        maxLength={6}
      />
      {digits.map((d, i) => (
        <div
          key={i}
          className={[
            'w-12 h-12 rounded-xl border-2 transition-all flex items-center justify-center text-xl font-bold text-white select-none',
            error
              ? 'border-red-500 bg-red-500/10'
              : d
              ? 'border-violet-500 bg-violet-500/10'
              : i === value.length
              ? 'border-violet-400/60 bg-white/[0.05]'
              : 'border-white/[0.12] bg-white/[0.05]',
          ].join(' ')}
        >
          {d ? '●' : ''}
        </div>
      ))}
    </div>
  )
}

function PinInputSmall({
  value,
  onChange,
  onComplete,
  autoFocus,
  label,
}: {
  value: string
  onChange: (v: string) => void
  onComplete?: (pin: string) => void
  autoFocus?: boolean
  label: string
}) {
  const hiddenRef = useRef<HTMLInputElement>(null)
  const digits = value.split('').concat(Array(6).fill('')).slice(0, 6)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value.replace(/\D/g, '').slice(0, 6)
    onChange(v)
    if (v.length === 6 && onComplete) onComplete(v)
  }

  return (
    <div className="space-y-2">
      <label className="block text-[11px] font-medium text-white/35 uppercase tracking-wider">{label}</label>
      <div
        className="flex justify-between gap-1.5"
        onClick={() => hiddenRef.current?.focus()}
      >
        <input
          ref={hiddenRef}
          type="tel"
          inputMode="numeric"
          autoComplete="one-time-code"
          autoFocus={autoFocus}
          value={value}
          onChange={handleChange}
          className="absolute opacity-0 w-0 h-0 pointer-events-none"
          maxLength={6}
        />
        {digits.map((d, i) => (
          <div
            key={i}
            className={[
              'w-10 h-10 rounded-lg border-2 transition-all flex items-center justify-center text-lg font-bold text-white select-none',
              d
                ? 'border-violet-500 bg-violet-500/10'
                : i === value.length
                ? 'border-violet-400/60 bg-white/[0.05]'
                : 'border-white/[0.12] bg-white/[0.05]',
            ].join(' ')}
          >
            {d ? '●' : ''}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Login() {
  const navigate = useNavigate()
  const { setCurrentUser, currentUser, sessionReady } = useStore()

  const [mode, setMode] = useState<Mode>('loading')
  const [pinHash, setPinHash] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [pinError, setPinError] = useState(false)
  const [shaking, setShaking] = useState(false)

  useEffect(() => {
    if (!sessionReady) return
    if (currentUser) {
      getAppMeta('pin_hash').then(ph => {
        const validHash = ph && ph.length === 64 ? ph : null
        setPinHash(validHash)
        setMode(validHash ? 'unlock' : 'reset-pin')
      })
    } else {
      setMode('register')
    }
  }, [sessionReady, currentUser])

  async function handleUnlock(p: string) {
    const ok = await verifyPin(p, pinHash!)
    if (ok) {
      sessionStorage.setItem('planner_unlocked', '1')
      navigate('/ui', { replace: true })
    } else {
      setShaking(true)
      setPinError(true)
      setTimeout(() => {
        setPin('')
        setShaking(false)
        setPinError(false)
      }, 600)
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !email.trim()) { setError('Name and email are required'); return }
    if (pin.length !== 6) { setError('Enter all 6 PIN digits'); return }
    if (pin !== confirmPin) { setError('PINs do not match'); return }
    setLoading(true); setError('')
    try {
      const h = await hashPin(pin)
      const user = await createUser({ name: name.trim(), email: email.trim(), role: 'admin' })
      await Promise.all([setAppMeta('active_user_id', user.id), setAppMeta('pin_hash', h)])
      setCurrentUser(user)
      sessionStorage.setItem('planner_unlocked', '1')
      navigate('/ui', { replace: true })
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }

  async function handleResetPin(e: React.FormEvent) {
    e.preventDefault()
    if (pin.length !== 6) { setError('Enter all 6 PIN digits'); return }
    if (pin !== confirmPin) { setError('PINs do not match'); return }
    setLoading(true); setError('')
    try {
      const h = await hashPin(pin)
      await setAppMeta('pin_hash', h)
      sessionStorage.setItem('planner_unlocked', '1')
      navigate('/ui', { replace: true })
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }

  const shell = (children: React.ReactNode) => (
    <div className="min-h-screen bg-[#0d0d0f] flex flex-col">
      <div className="fixed inset-0 pointer-events-none"
        style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.015) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.015) 1px,transparent 1px)', backgroundSize: '48px 48px' }} />
      <div className="fixed top-[-20%] left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(ellipse,rgba(124,58,237,0.12) 0%,transparent 70%)' }} />
      <header className="relative z-10 flex items-center gap-2.5 px-8 pt-6">
        <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-900/40">
          <Box size={15} className="text-white" strokeWidth={2} />
        </div>
        <span className="text-[15px] font-semibold text-white tracking-tight">Planner</span>
      </header>
      <main className="relative z-10 flex flex-1 items-center justify-center px-4 pb-16">
        <div className="w-full max-w-sm">{children}</div>
      </main>
    </div>
  )

  if (mode === 'loading') return shell(null)

  // ── Returning user: unlock ───────────────────────────────
  if (mode === 'unlock') return shell(
    <>
      <div className="mb-8 text-center">
        <div className="w-14 h-14 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mx-auto mb-4">
          <Lock size={24} className="text-violet-400" strokeWidth={1.8} />
        </div>
        <h1 className="text-[24px] font-bold text-white">
          Welcome back, {currentUser?.name.split(' ')[0]}
        </h1>
        <p className="text-[13px] text-white/40 mt-1.5">Enter your 6-digit PIN to continue</p>
      </div>

      <PinInput
        value={pin}
        onChange={setPin}
        onComplete={handleUnlock}
        error={pinError}
        shaking={shaking}
        autoFocus
      />

      {pinError && <p className="text-center text-xs text-red-400 mt-3">Incorrect PIN — try again</p>}

      <p className="text-center text-[11px] text-white/[0.15] mt-8 flex items-center justify-center gap-1">
        <ShieldCheck size={11} /> PIN stored locally, never sent anywhere
      </p>
    </>
  )

  // ── New user: register ───────────────────────────────────
  if (mode === 'register') return shell(
    <>
      <div className="mb-8 text-center">
        <h1 className="text-[26px] font-bold text-white tracking-tight">Welcome</h1>
        <p className="text-[13px] text-white/40 mt-2">Set up your account</p>
      </div>
      <form onSubmit={handleRegister} className="bg-[#111113] border border-white/[0.08] rounded-2xl p-6 shadow-2xl shadow-black/60 space-y-4">
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

        <div className="border-t border-white/[0.06] pt-4 space-y-4">
          <PinInputSmall label="PIN (6 digits)" value={pin} onChange={setPin}
            onComplete={() => {}} />
          <PinInputSmall label="Confirm PIN" value={confirmPin} onChange={setConfirmPin} />
        </div>

        {error && <p className="text-red-400 text-[12px]">{error}</p>}
        <Button type="submit" disabled={loading} className="w-full gap-2 mt-1">
          {loading ? 'Setting up…' : 'Get started'} {!loading && <ArrowRight size={14} />}
        </Button>
        <p className="text-center text-[11px] text-white/20 flex items-center justify-center gap-1">
          <ShieldCheck size={10} /> All data stays on your device
        </p>
      </form>
    </>
  )

  // ── Existing user PIN reset ──────────────────────────────
  return shell(
    <>
      <div className="mb-8 text-center">
        <div className="w-14 h-14 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mx-auto mb-4">
          <Lock size={24} className="text-violet-400" strokeWidth={1.8} />
        </div>
        <h1 className="text-[26px] font-bold text-white tracking-tight">Reset your PIN</h1>
        <p className="text-[13px] text-white/40 mt-2">
          Welcome back, {currentUser?.name.split(' ')[0]} — set a new 6-digit PIN
        </p>
      </div>
      <form onSubmit={handleResetPin} className="bg-[#111113] border border-white/[0.08] rounded-2xl p-6 shadow-2xl shadow-black/60 space-y-4">
        <PinInputSmall label="New PIN (6 digits)" value={pin} onChange={setPin}
          onComplete={() => {}} autoFocus />
        <PinInputSmall label="Confirm PIN" value={confirmPin} onChange={setConfirmPin} />
        {error && <p className="text-red-400 text-[12px]">{error}</p>}
        <Button type="submit" disabled={loading} className="w-full gap-2 mt-1">
          {loading ? 'Saving…' : 'Set PIN'} {!loading && <ArrowRight size={14} />}
        </Button>
        <p className="text-center text-[11px] text-white/20 flex items-center justify-center gap-1">
          <ShieldCheck size={10} /> PIN is hashed locally, never sent anywhere
        </p>
      </form>
    </>
  )
}
