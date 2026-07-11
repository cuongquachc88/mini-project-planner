import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '@/store'
import { updateUser, getUserById, getAppMeta, setAppMeta } from '@/db/queries/users'
import { useGoogleDrive } from '@/hooks/useGoogleDrive'
import { hashPin, verifyPin } from '@/lib/utils/pin'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import {
  User, ArrowLeft, Cloud, CloudOff, RefreshCw,
  Check, Lock, LockOpen, ShieldCheck, Eye, EyeOff,
} from 'lucide-react'
import { fmtRelative } from '@/lib/utils/dates'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#141416] border border-white/[0.07] rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-white/[0.06] bg-white/[0.02]">
        <span className="text-[11px] font-semibold text-white/50 uppercase tracking-widest">{title}</span>
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  )
}

function LabelRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-white/35 uppercase tracking-wider mb-1.5">{label}</label>
      {children}
    </div>
  )
}

export default function Profile() {
  const navigate = useNavigate()
  const { currentUser, setCurrentUser, syncStatus, lastSyncedAt, syncError, isDriveConnected } = useStore()
  const { connect, disconnect, sync, isConfigured } = useGoogleDrive()
  const [name, setName] = useState(currentUser?.name ?? '')
  const [email, setEmail] = useState(currentUser?.email ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const [hasPinHash, setHasPinHash] = useState<string | null>(null)
  const [pinMode, setPinMode] = useState<'idle' | 'set' | 'change' | 'remove'>('idle')
  const [pinCurrent, setPinCurrent] = useState('')
  const [pinNew, setPinNew] = useState('')
  const [pinConfirm, setPinConfirm] = useState('')
  const [pinError, setPinError] = useState('')
  const [pinSuccess, setPinSuccess] = useState('')
  const [showPin, setShowPin] = useState(false)

  useEffect(() => {
    async function load() {
      const userId = await getAppMeta('active_user_id')
      if (userId) {
        const user = await getUserById(userId)
        if (user) { setCurrentUser(user); setName(user.name); setEmail(user.email) }
        else navigate('/login')
      } else {
        navigate('/login')
      }
      const ph = await getAppMeta('pin_hash')
      setHasPinHash(ph)
    }
    if (!currentUser) load()
    else {
      setName(currentUser.name)
      setEmail(currentUser.email)
      getAppMeta('pin_hash').then(setHasPinHash)
    }
  }, [currentUser, navigate, setCurrentUser])

  async function handleSave() {
    if (!name.trim() || !email.trim()) { setError('Name and email are required'); return }
    if (!currentUser) return
    setSaving(true); setError('')
    try {
      const updated = await updateUser(currentUser.id, { name: name.trim(), email: email.trim() })
      setCurrentUser(updated)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (e) {
      setError(String(e))
    } finally {
      setSaving(false)
    }
  }

  async function handleSetPin() {
    setPinError('')
    if (pinNew.length !== 6) { setPinError('PIN must be exactly 6 digits'); return }
    if (!/^\d+$/.test(pinNew)) { setPinError('Digits only'); return }
    if (pinNew !== pinConfirm) { setPinError('PINs do not match'); return }
    if (pinMode === 'change' && hasPinHash) {
      const ok = await verifyPin(pinCurrent, hasPinHash)
      if (!ok) { setPinError('Current PIN is incorrect'); return }
    }
    const h = await hashPin(pinNew)
    await setAppMeta('pin_hash', h)
    setHasPinHash(h)
    setPinMode('idle')
    setPinNew(''); setPinConfirm(''); setPinCurrent('')
    setPinSuccess(hasPinHash ? 'PIN changed' : 'PIN set')
    setTimeout(() => setPinSuccess(''), 3000)
  }

  async function handleRemovePin() {
    setPinError('')
    if (hasPinHash) {
      const ok = await verifyPin(pinCurrent, hasPinHash)
      if (!ok) { setPinError('Current PIN is incorrect'); return }
    }
    await setAppMeta('pin_hash', '')
    setHasPinHash(null)
    setPinMode('idle'); setPinCurrent('')
    setPinSuccess('PIN removed')
    setTimeout(() => setPinSuccess(''), 3000)
  }

  return (
    <div className="min-h-screen bg-[#0d0d0f] flex items-start justify-center p-8">
      <div className="w-full max-w-lg space-y-4">

        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/ui')}
            className="flex items-center gap-1.5 text-[12px] text-white/30 hover:text-white/60 transition-colors mb-4"
          >
            <ArrowLeft size={13} strokeWidth={1.8} />
            Back
          </button>
          <h1 className="font-display text-[22px] font-bold text-white tracking-tight">Profile</h1>
          <p className="text-[12px] text-white/35 mt-1">Manage your account and preferences</p>
        </div>

        {/* Identity */}
        <Section title="Identity">
          <LabelRow label="Display name">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
            />
          </LabelRow>
          <LabelRow label="Email">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </LabelRow>

          {error && <p className="text-red-400 text-[11px]">{error}</p>}

          <div className="flex items-center gap-2 pt-1">
            <Button onClick={handleSave} disabled={saving} size="sm" className="gap-1.5">
              {saving ? <RefreshCw size={12} className="animate-spin" /> : saved ? <Check size={12} /> : <User size={12} />}
              {saving ? 'Saving…' : saved ? 'Saved' : 'Save changes'}
            </Button>
          </div>
        </Section>

        {/* PIN Lock */}
        <Section title="PIN Lock">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center border ${hasPinHash ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-white/[0.04] border-white/[0.08]'}`}>
                {hasPinHash
                  ? <Lock size={16} className="text-emerald-400" strokeWidth={1.8} />
                  : <LockOpen size={16} className="text-white/30" strokeWidth={1.8} />}
              </div>
              <div>
                <p className="text-[13px] font-medium text-white">
                  {hasPinHash ? 'PIN protected' : 'No PIN set'}
                </p>
                <p className="text-[11px] text-white/35">
                  {hasPinHash ? 'App locks on startup' : 'App opens without a lock screen'}
                </p>
              </div>
            </div>
            {hasPinHash && (
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full px-2 py-0.5 font-medium flex items-center gap-1">
                <ShieldCheck size={9} />Active
              </span>
            )}
          </div>

          {pinSuccess && (
            <div className="flex items-center gap-2 text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
              <Check size={12} />{pinSuccess}
            </div>
          )}

          {pinMode === 'idle' && (
            <div className="flex gap-2">
              {!hasPinHash ? (
                <Button size="sm" variant="outline" onClick={() => { setPinMode('set'); setPinError('') }} className="gap-1.5">
                  <Lock size={12} />Set PIN
                </Button>
              ) : (
                <>
                  <Button size="sm" variant="outline" onClick={() => { setPinMode('change'); setPinError('') }} className="gap-1.5">
                    <Lock size={12} />Change PIN
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => { setPinMode('remove'); setPinError('') }} className="text-red-400 hover:text-red-300">
                    Remove
                  </Button>
                </>
              )}
            </div>
          )}

          {pinMode !== 'idle' && (
            <div className="space-y-3">
              {(pinMode === 'change' || pinMode === 'remove') && (
                <LabelRow label="Current PIN">
                  <div className="relative">
                    <Input
                      type={showPin ? 'text' : 'password'}
                      inputMode="numeric"
                      maxLength={6}
                      value={pinCurrent}
                      onChange={(e) => setPinCurrent(e.target.value.replace(/\D/g, ''))}
                      placeholder="••••"
                      className="pr-9 font-mono tracking-widest"
                    />
                    <button type="button" onClick={() => setShowPin(!showPin)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/60 transition-colors">
                      {showPin ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                  </div>
                </LabelRow>
              )}
              {pinMode !== 'remove' && (
                <>
                  <LabelRow label={pinMode === 'set' ? 'New PIN' : 'New PIN'}>
                    <Input type={showPin ? 'text' : 'password'} inputMode="numeric" maxLength={6}
                      value={pinNew} onChange={(e) => setPinNew(e.target.value.replace(/\D/g, ''))}
                      placeholder="6 digits" className="font-mono tracking-widest" />
                  </LabelRow>
                  <LabelRow label="Confirm PIN">
                    <Input type={showPin ? 'text' : 'password'} inputMode="numeric" maxLength={6}
                      value={pinConfirm} onChange={(e) => setPinConfirm(e.target.value.replace(/\D/g, ''))}
                      placeholder="Repeat PIN" className="font-mono tracking-widest" />
                  </LabelRow>
                </>
              )}

              {pinError && <p className="text-red-400 text-[11px]">{pinError}</p>}

              <div className="flex gap-2 pt-1">
                {pinMode === 'remove' ? (
                  <Button size="sm" variant="destructive" onClick={handleRemovePin}>Remove PIN</Button>
                ) : (
                  <Button size="sm" onClick={handleSetPin}>{pinMode === 'set' ? 'Set PIN' : 'Update PIN'}</Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => { setPinMode('idle'); setPinError(''); setPinCurrent(''); setPinNew(''); setPinConfirm('') }}>
                  Cancel
                </Button>
              </div>

              <p className="text-[10px] text-white/20 flex items-center gap-1">
                <ShieldCheck size={10} />PIN is hashed with SHA-256 — never leaves your device
              </p>
            </div>
          )}
        </Section>

        {/* Google Drive */}
        {isConfigured && (
          <Section title="Google Drive Sync">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center border ${isDriveConnected ? 'bg-blue-500/10 border-blue-500/20' : 'bg-white/[0.04] border-white/[0.08]'}`}>
                {isDriveConnected
                  ? <Cloud size={16} className="text-blue-400" strokeWidth={1.8} />
                  : <CloudOff size={16} className="text-white/30" strokeWidth={1.8} />}
              </div>
              <div>
                <p className="text-[13px] font-medium text-white">
                  {isDriveConnected ? 'Drive connected' : 'Not connected'}
                </p>
                <p className="text-[11px] text-white/35">
                  {isDriveConnected
                    ? syncStatus === 'syncing' ? 'Syncing…'
                      : syncStatus === 'error' ? (syncError ?? 'Sync failed')
                      : lastSyncedAt ? `Synced ${fmtRelative(lastSyncedAt)}`
                      : 'Never synced'
                    : "Backup to Drive’s private AppData folder"}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              {isDriveConnected ? (
                <>
                  <Button size="sm" variant="outline" onClick={sync} disabled={syncStatus === 'syncing'} className="gap-1.5">
                    <RefreshCw size={12} className={syncStatus === 'syncing' ? 'animate-spin' : ''} />Sync now
                  </Button>
                  <Button size="sm" variant="ghost" onClick={disconnect} className="gap-1.5 text-red-400 hover:text-red-300">
                    <CloudOff size={12} />Disconnect
                  </Button>
                </>
              ) : (
                <Button size="sm" onClick={connect} className="gap-1.5">
                  <Cloud size={12} />Connect Google Drive
                </Button>
              )}
            </div>
          </Section>
        )}

        <p className="text-center text-[11px] text-white/15 pb-4">
          All data stored locally — nothing leaves your device without Drive sync
        </p>
      </div>
    </div>
  )
}
