import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, ArrowRight, User, Mail, Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react'
import { createUser, setAppMeta, getAppMeta } from '@/db/queries/users'
import { hashPin, verifyPin } from '@/lib/utils/pin'
import { useStore } from '@/store'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

type Mode = 'loading' | 'unlock' | 'register-identity' | 'register-pin'

export default function Login() {
  const navigate = useNavigate()
  const { setCurrentUser, unlock, currentUser, sessionReady } = useStore()

  const [mode, setMode] = useState<Mode>('loading')
  const [pinHash, setPinHash] = useState<string | null>(null)

  // Registration state
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [newPin, setNewPin] = useState('')
  const [newPinConfirm, setNewPinConfirm] = useState('')
  const [showPin, setShowPin] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // PIN unlock state
  const [digits, setDigits] = useState(['', '', '', ''])
  const [pinError, setPinError] = useState(false)
  const [shaking, setShaking] = useState(false)
  const inputsRef = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (!sessionReady) return
    // session already loaded by main.tsx — just read pin_hash
    if (currentUser) {
      getAppMeta('pin_hash').then(ph => {
        setPinHash(ph)
        setMode(ph ? 'unlock' : 'register-identity')
      })
    } else {
      setMode('register-identity')
    }
  }, [sessionReady, currentUser])

  // Focus first PIN input when unlock mode appears
  useEffect(() => {
    if (mode === 'unlock') {
      setTimeout(() => inputsRef.current[0]?.focus(), 50)
    }
  }, [mode])

  async function handlePinDigit(idx: number, val: string) {
    if (!/^\d?$/.test(val)) return
    const next = [...digits]
    next[idx] = val
    setDigits(next)
    setPinError(false)
    if (val && idx < 3) inputsRef.current[idx + 1]?.focus()
    if (next.every(d => d !== '')) {
      const ok = await verifyPin(next.join(''), pinHash!)
      if (ok) {
        unlock()
        navigate('/ui', { replace: true })
      } else {
        setShaking(true)
        setPinError(true)
        setTimeout(() => {
          setDigits(['', '', '', ''])
          setShaking(false)
          inputsRef.current[0]?.focus()
        }, 600)
      }
    }
  }

  function handlePinKeyDown(idx: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) {
      const next = [...digits]
      next[idx - 1] = ''
      setDigits(next)
      inputsRef.current[idx - 1]?.focus()
    }
  }

  async function handleIdentity(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !email.trim()) { setError('Name and email are required'); return }
    setError('')
    setMode('register-pin')
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    if (newPin.length < 4) { setError('PIN must be at least 4 digits'); return }
    if (!/^\d+$/.test(newPin)) { setError('Digits only'); return }
    if (newPin !== newPinConfirm) { setError('PINs do not match'); return }
    setLoading(true); setError('')
    try {
      const user = await createUser({ name: name.trim(), email: email.trim(), role: 'admin' })
      const h = await hashPin(newPin)
      await Promise.all([setAppMeta('active_user_id', user.id), setAppMeta('pin_hash', h)])
      setCurrentUser(user)
      unlock()
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

  // ── Returning user: PIN only ──────────────────────────
  if (mode === 'unlock') return shell(
    <>
      <div className="mb-8 text-center">
        <div className="w-14 h-14 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mx-auto mb-4">
          <Lock size={24} className="text-violet-400" strokeWidth={1.8} />
        </div>
        <h1 className="text-[24px] font-bold text-white">
          Welcome back, {currentUser?.name.split(' ')[0]}
        </h1>
        <p className="text-[13px] text-white/40 mt-1.5">Enter your PIN to continue</p>
      </div>

      <div className={`flex justify-center gap-3 ${shaking ? 'animate-shake' : ''}`}>
        {digits.map((d, i) => (
          <input
            key={i}
            ref={el => { inputsRef.current[i] = el }}
            type="password"
            inputMode="numeric"
            maxLength={1}
            value={d}
            onChange={e => handlePinDigit(i, e.target.value)}
            onKeyDown={e => handlePinKeyDown(i, e)}
            className={[
              'w-14 h-14 text-center text-xl font-bold rounded-xl border-2 transition-all outline-none bg-white/[0.05] text-white',
              pinError ? 'border-red-500 bg-red-500/10' : d ? 'border-violet-500 bg-violet-500/10' : 'border-white/[0.12] focus:border-violet-500',
            ].join(' ')}
          />
        ))}
      </div>

      {pinError && <p className="text-center text-xs text-red-400 mt-3">Incorrect PIN — try again</p>}

      <p className="text-center text-[11px] text-white/[0.15] mt-8 flex items-center justify-center gap-1">
        <ShieldCheck size={11} /> PIN stored locally, never sent anywhere
      </p>
    </>
  )

  // ── New user step 1: identity ─────────────────────────
  if (mode === 'register-identity') return shell(
    <>
      <div className="flex items-center justify-center gap-2 mb-8">
        {[1, 2].map((n, i) => (
          <div key={n} className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${i === 0 ? 'bg-violet-600 text-white' : 'bg-white/[0.06] text-white/25'}`}>{n}</div>
            {i === 0 && <div className="w-8 h-px bg-white/[0.1]" />}
          </div>
        ))}
      </div>
      <div className="mb-8 text-center">
        <h1 className="text-[26px] font-bold text-white tracking-tight">Welcome</h1>
        <p className="text-[13px] text-white/40 mt-2">Tell us who you are</p>
      </div>
      <form onSubmit={handleIdentity} className="bg-[#111113] border border-white/[0.08] rounded-2xl p-6 shadow-2xl shadow-black/60 space-y-4">
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
        <Button type="submit" className="w-full gap-2 mt-1">Next <ArrowRight size={14} /></Button>
        <p className="text-center text-[11px] text-white/20 pt-1">All data stays on your device</p>
      </form>
    </>
  )

  // ── New user step 2: set PIN ──────────────────────────
  return shell(
    <>
      <div className="flex items-center justify-center gap-2 mb-8">
        {[1, 2].map((n, i) => (
          <div key={n} className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${i === 1 ? 'bg-violet-600 text-white' : 'bg-violet-600/30 text-violet-400'}`}>{n}</div>
            {i === 0 && <div className="w-8 h-px bg-violet-500/30" />}
          </div>
        ))}
      </div>
      <div className="mb-8 text-center">
        <div className="w-14 h-14 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mx-auto mb-4">
          <Lock size={24} className="text-violet-400" strokeWidth={1.8} />
        </div>
        <h1 className="text-[26px] font-bold text-white tracking-tight">Set your PIN</h1>
        <p className="text-[13px] text-white/40 mt-2">Used to unlock on return visits</p>
      </div>
      <form onSubmit={handleRegister} className="bg-[#111113] border border-white/[0.08] rounded-2xl p-6 shadow-2xl shadow-black/60 space-y-4">
        <div className="space-y-1">
          <label className="block text-[11px] font-medium text-white/35 uppercase tracking-wider">PIN (4–8 digits)</label>
          <div className="relative">
            <Lock size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25 pointer-events-none" />
            <Input type={showPin ? 'text' : 'password'} inputMode="numeric" maxLength={8}
              value={newPin} onChange={e => setNewPin(e.target.value.replace(/\D/g, ''))}
              placeholder="••••" className="pl-8 pr-9 font-mono tracking-widest" autoFocus />
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
            <Input type={showPin ? 'text' : 'password'} inputMode="numeric" maxLength={8}
              value={newPinConfirm} onChange={e => setNewPinConfirm(e.target.value.replace(/\D/g, ''))}
              placeholder="••••" className="pl-8 font-mono tracking-widest" />
          </div>
        </div>
        {error && <p className="text-red-400 text-[12px]">{error}</p>}
        <Button type="submit" disabled={loading} className="w-full gap-2 mt-1">
          {loading ? 'Setting up…' : 'Get started'} {!loading && <ArrowRight size={14} />}
        </Button>
        <button type="button" onClick={() => { setMode('register-identity'); setError('') }}
          className="w-full text-center text-[12px] text-white/25 hover:text-white/50 transition-colors">
          ← Back
        </button>
        <p className="text-center text-[11px] text-white/20 flex items-center justify-center gap-1">
          <ShieldCheck size={10} /> PIN is hashed locally, never sent anywhere
        </p>
      </form>
    </>
  )
}
