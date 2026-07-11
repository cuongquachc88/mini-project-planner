import { useState, useEffect, useRef } from 'react'
import { Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react'
import { verifyPin } from '@/lib/utils/pin'

interface Props {
  pinHash: string
  onUnlock: () => void
  userName?: string
}

export function PinLock({ pinHash, onUnlock, userName }: Props) {
  const [digits, setDigits] = useState(['', '', '', '', '', ''])
  const [error, setError] = useState(false)
  const [show, setShow] = useState(false)
  const [shaking, setShaking] = useState(false)
  const inputsRef = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    inputsRef.current[0]?.focus()
  }, [])

  async function handleInput(idx: number, val: string) {
    if (!/^\d?$/.test(val)) return
    const next = [...digits]
    next[idx] = val
    setDigits(next)
    setError(false)

    if (val && idx < 5) {
      inputsRef.current[idx + 1]?.focus()
    }

    if (next.every((d) => d !== '')) {
      const pin = next.join('')
      const ok = await verifyPin(pin, pinHash)
      if (ok) {
        onUnlock()
      } else {
        setShaking(true)
        setError(true)
        setTimeout(() => {
          setDigits(['', '', '', '', '', ''])
          setShaking(false)
          inputsRef.current[0]?.focus()
        }, 600)
      }
    }
  }

  function handleKeyDown(idx: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) {
      const next = [...digits]
      next[idx - 1] = ''
      setDigits(next)
      inputsRef.current[idx - 1]?.focus()
    }
  }

  return (
    <div className="min-h-screen bg-[#0d0d0f] flex items-center justify-center p-4">
      <div className="w-full max-w-xs text-center">
        <div className="w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mx-auto mb-6">
          <Lock size={28} className="text-violet-400" />
        </div>

        <h1 className="text-[20px] font-bold text-white mb-1">
          {userName ? `Welcome back, ${userName.split(' ')[0]}` : 'Enter your PIN'}
        </h1>
        <p className="text-[13px] text-white/35 mb-8">Enter your PIN to unlock</p>

        <div className={cn('flex justify-center gap-3 mb-3', shaking && 'animate-shake')}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => { inputsRef.current[i] = el }}
              type={show ? 'text' : 'password'}
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={(e) => handleInput(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className={cn(
                'w-14 h-14 text-center text-xl font-bold rounded-xl border-2 transition-all outline-none',
                'bg-white/[0.05] text-white',
                error
                  ? 'border-red-500 bg-red-500/10'
                  : d
                  ? 'border-violet-500 bg-violet-500/10'
                  : 'border-white/[0.12] focus:border-violet-500',
              )}
            />
          ))}
        </div>

        {error && (
          <p className="text-xs text-red-400 mb-3">Incorrect PIN — try again</p>
        )}

        <button
          onClick={() => setShow(!show)}
          className="flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition-colors mx-auto"
        >
          {show ? <EyeOff size={12} /> : <Eye size={12} />}
          {show ? 'Hide' : 'Show'} PIN
        </button>

        <p className="text-[11px] text-white/[0.15] mt-8 flex items-center justify-center gap-1">
          <ShieldCheck size={11} />
          PIN is stored locally, never sent anywhere
        </p>
      </div>
    </div>
  )
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}
