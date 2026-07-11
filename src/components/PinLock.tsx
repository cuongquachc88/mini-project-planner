import { useState, useRef } from 'react'
import { Lock, ShieldCheck } from 'lucide-react'
import { verifyPin } from '@/lib/utils/pin'

interface Props {
  pinHash: string
  onUnlock: () => void
  userName?: string
}

export function PinLock({ pinHash, onUnlock, userName }: Props) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)
  const [shaking, setShaking] = useState(false)
  const hiddenRef = useRef<HTMLInputElement>(null)

  const digits = pin.split('').concat(Array(6).fill('')).slice(0, 6)

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value.replace(/\D/g, '').slice(0, 6)
    setPin(v)
    setError(false)
    if (v.length === 6) {
      const ok = await verifyPin(v, pinHash)
      if (ok) {
        onUnlock()
      } else {
        setShaking(true)
        setError(true)
        setTimeout(() => {
          setPin('')
          setShaking(false)
          setError(false)
          hiddenRef.current?.focus()
        }, 600)
      }
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

        <div
          className={`flex justify-center gap-3 mb-3 cursor-text ${shaking ? 'animate-shake' : ''}`}
          onClick={() => hiddenRef.current?.focus()}
        >
          <input
            ref={hiddenRef}
            type="tel"
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus
            value={pin}
            onChange={handleChange}
            className="absolute opacity-0 w-0 h-0 pointer-events-none"
            maxLength={6}
          />
          {digits.map((d, i) => (
            <div
              key={i}
              className={[
                'w-14 h-14 rounded-xl border-2 transition-all flex items-center justify-center text-2xl font-bold text-white select-none',
                error
                  ? 'border-red-500 bg-red-500/10'
                  : d
                  ? 'border-violet-500 bg-violet-500/10'
                  : i === pin.length
                  ? 'border-violet-400/60 bg-white/[0.05]'
                  : 'border-white/[0.12] bg-white/[0.05]',
              ].join(' ')}
            >
              {d ? '●' : ''}
            </div>
          ))}
        </div>

        {error && (
          <p className="text-xs text-red-400 mb-3">Incorrect PIN — try again</p>
        )}

        <p className="text-[11px] text-white/[0.15] mt-8 flex items-center justify-center gap-1">
          <ShieldCheck size={11} />
          PIN is stored locally, never sent anywhere
        </p>
      </div>
    </div>
  )
}
