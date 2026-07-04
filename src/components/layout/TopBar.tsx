import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, User, LogOut } from 'lucide-react'
import { useStore } from '@/store'
import { getAppMeta } from '@/db/queries/users'
import { ProjectSwitcher } from './ProjectSwitcher'
import { SyncStatusBar } from '@/components/SyncStatusBar'

function UserMenu({ initials, name, onProfile, onLock, onLogout, showLock }: {
  initials: string; name: string
  onProfile: () => void; onLock: () => void; onLogout: () => void
  showLock: boolean
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold bg-violet-600 text-white hover:bg-violet-500 transition-colors shrink-0"
        title={name}
      >
        {initials}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-44 bg-[#18181b] border border-white/[0.08] rounded-xl shadow-2xl shadow-black/60 overflow-hidden z-50 animate-fade-in">
          {/* User info */}
          <div className="px-3 py-2.5 border-b border-white/[0.06]">
            <p className="text-[12px] font-medium text-white truncate">{name || 'Unknown user'}</p>
          </div>

          {/* Actions */}
          <div className="p-1">
            <button
              onClick={() => { setOpen(false); onProfile() }}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[12px] text-white/60 hover:text-white hover:bg-white/[0.06] transition-all text-left"
            >
              <User size={13} strokeWidth={1.8} />
              Profile & Settings
            </button>

            {showLock && (
              <button
                onClick={() => { setOpen(false); onLock() }}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[12px] text-white/60 hover:text-white hover:bg-white/[0.06] transition-all text-left"
              >
                <Lock size={13} strokeWidth={1.8} />
                Lock screen
              </button>
            )}

            <div className="my-1 border-t border-white/[0.06]" />

            <button
              onClick={() => { setOpen(false); onLogout() }}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[12px] text-red-400/80 hover:text-red-400 hover:bg-red-500/[0.08] transition-all text-left"
            >
              <LogOut size={13} strokeWidth={1.8} />
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export function TopBar() {
  const navigate = useNavigate()
  const { currentUser, lock, setCurrentUser } = useStore()
  const [hasPinHash, setHasPinHash] = useState(false)
  const initials = currentUser?.name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) ?? '?'

  useEffect(() => {
    getAppMeta('pin_hash').then((h) => setHasPinHash(!!h))
  }, [])

  function handleLogout() {
    setCurrentUser(null)
    navigate('/ui')
  }

  return (
    <header className="h-12 flex items-center px-4 gap-3 shrink-0 border-b border-white/[0.06] bg-[#0d0d0f]/90 backdrop-blur-sm z-20">
      <ProjectSwitcher />
      <div className="flex-1" />
      <SyncStatusBar />

      <UserMenu
        initials={initials}
        name={currentUser?.name ?? ''}
        onProfile={() => navigate('/profile')}
        onLock={lock}
        onLogout={handleLogout}
        showLock={hasPinHash}
      />
    </header>
  )
}
