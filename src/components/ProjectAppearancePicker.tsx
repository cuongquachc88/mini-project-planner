import { useState } from 'react'
import * as LucideIcons from 'lucide-react'
import type { LucideProps } from 'lucide-react'
import { Check, ChevronDown, Ban } from 'lucide-react'
import { PROJECT_ICONS, ProjectAvatar } from './ProjectAvatar'
import { cn } from '@/lib/utils/cn'

const COLORS = [
  '#7c3aed','#6366f1','#2563eb','#0891b2','#0d9488',
  '#059669','#65a30d','#d97706','#ea580c','#dc2626',
  '#db2777','#9333ea','#475569','#374151',
]

interface Props {
  color: string
  icon: string | null
  onColor: (c: string) => void
  onIcon: (i: string | null) => void
}

export function ProjectAppearancePicker({ color, icon, onColor, onIcon }: Props) {
  const [tab, setTab] = useState<'color' | 'icon'>('color')

  return (
    <div className="rounded-xl border border-white/[0.08] overflow-hidden bg-[#111113]">
      {/* Tabs */}
      <div className="flex border-b border-white/[0.06]">
        {(['color', 'icon'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'flex-1 py-2 text-[11px] font-medium uppercase tracking-wider transition-colors',
              tab === t ? 'text-white bg-white/[0.04]' : 'text-white/30 hover:text-white/60',
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'color' && (
        <div className="p-3 grid grid-cols-7 gap-1.5">
          {COLORS.map(c => (
            <button
              key={c}
              onClick={() => onColor(c)}
              className="w-7 h-7 rounded-lg transition-all hover:scale-110 flex items-center justify-center"
              style={{ backgroundColor: c }}
            >
              {color === c && <Check size={11} className="text-white" strokeWidth={2.5} />}
            </button>
          ))}
        </div>
      )}

      {tab === 'icon' && (
        <div className="p-3 space-y-3 max-h-52 overflow-y-auto">
          {/* No icon option */}
          <button
            onClick={() => onIcon(null)}
            className={cn(
              'flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] transition-colors',
              !icon ? 'bg-white/[0.08] text-white' : 'text-white/30 hover:text-white/60 hover:bg-white/[0.04]',
            )}
          >
            <Ban size={11} strokeWidth={1.5} /> None
          </button>
          {Object.entries(PROJECT_ICONS).map(([category, names]) => (
            <div key={category}>
              <p className="text-[9px] font-semibold text-white/20 uppercase tracking-widest mb-1.5">{category}</p>
              <div className="grid grid-cols-8 gap-1">
                {names.map(name => {
                  const Icon = (LucideIcons as unknown as Record<string, React.ComponentType<LucideProps>>)[name]
                  if (!Icon) return null
                  return (
                    <button
                      key={name}
                      onClick={() => onIcon(name)}
                      title={name}
                      className={cn(
                        'w-7 h-7 rounded-md flex items-center justify-center transition-all hover:scale-110',
                        icon === name ? 'bg-white/[0.12] text-white' : 'text-white/40 hover:text-white/80 hover:bg-white/[0.06]',
                      )}
                    >
                      <Icon size={13} strokeWidth={1.6} />
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Compact inline trigger + popover for use in forms
export function ProjectAppearanceButton({ color, icon, onColor, onIcon }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 h-8 px-2.5 rounded-lg bg-white/[0.04] border border-white/[0.09] hover:bg-white/[0.07] transition-all"
      >
        <ProjectAvatar color={color} icon={icon} size="xs" />
        <span className="text-[11px] text-white/50">Appearance</span>
        <ChevronDown size={11} className="text-white/30" />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1.5 z-50 w-64 animate-fade-in shadow-2xl shadow-black/60">
          <ProjectAppearancePicker color={color} icon={icon} onColor={onColor} onIcon={onIcon} />
        </div>
      )}
    </div>
  )
}
