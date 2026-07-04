import { useState } from 'react'
import * as LucideIcons from 'lucide-react'
import type { LucideProps } from 'lucide-react'
import { Check, ChevronDown, Ban } from 'lucide-react'
import { PROJECT_ICONS, ProjectAvatar } from './ProjectAvatar'
import { cn } from '@/lib/utils/cn'

const COLORS = [
  // purples / blues
  '#7c3aed','#6d28d9','#9333ea','#a855f7','#6366f1','#4f46e5','#3730a3',
  // blues / cyans
  '#2563eb','#1d4ed8','#0ea5e9','#0891b2','#0e7490','#06b6d4','#0d9488',
  // greens
  '#059669','#047857','#10b981','#65a30d','#4d7c0f','#16a34a','#15803d',
  // warm
  '#d97706','#b45309','#f59e0b','#ea580c','#c2410c','#f97316','#fb923c',
  // reds / pinks
  '#dc2626','#b91c1c','#e11d48','#db2777','#be185d','#ec4899','#f43f5e',
  // neutrals
  '#64748b','#475569','#374151','#1f2937','#6b7280','#9ca3af','#334155',
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
    <div className="rounded-lg border border-white/[0.08] overflow-hidden bg-[#111113]">
      {/* Tabs */}
      <div className="flex border-b border-white/[0.06]">
        {(['color', 'icon'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'flex-1 py-1.5 text-[10px] font-medium uppercase tracking-wider transition-colors',
              tab === t ? 'text-white bg-white/[0.04]' : 'text-white/25 hover:text-white/55',
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'color' && (
        <div className="p-1.5 grid grid-cols-7 gap-0.5">
          {COLORS.map(c => (
            <button
              key={c}
              onClick={() => onColor(c)}
              className="w-4 h-4 rounded transition-all hover:scale-110 flex items-center justify-center"
              style={{ backgroundColor: c }}
            >
              {color === c && <Check size={8} className="text-white" strokeWidth={3} />}
            </button>
          ))}
        </div>
      )}

      {tab === 'icon' && (
        <div className="p-1.5 space-y-1.5 max-h-44 overflow-y-auto">
          <button
            onClick={() => onIcon(null)}
            className={cn(
              'flex items-center gap-1 px-1 py-0.5 rounded text-[9px] transition-colors',
              !icon ? 'bg-white/[0.08] text-white' : 'text-white/25 hover:text-white/55 hover:bg-white/[0.04]',
            )}
          >
            <Ban size={8} strokeWidth={1.5} /> None
          </button>
          {Object.entries(PROJECT_ICONS).map(([category, names]) => (
            <div key={category}>
              <p className="text-[7px] font-semibold text-white/20 uppercase tracking-widest mb-0.5">{category}</p>
              <div className="grid grid-cols-10 gap-0.5">
                {names.map(name => {
                  const Icon = (LucideIcons as unknown as Record<string, React.ComponentType<LucideProps>>)[name]
                  if (!Icon) return null
                  return (
                    <button
                      key={name}
                      onClick={() => onIcon(name)}
                      title={name}
                      className={cn(
                        'w-4 h-4 rounded flex items-center justify-center transition-all hover:scale-110',
                        icon === name ? 'bg-white/[0.14] text-white' : 'text-white/35 hover:text-white/80 hover:bg-white/[0.06]',
                      )}
                    >
                      <Icon size={10} strokeWidth={1.6} />
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
        <div className="absolute top-full left-0 mt-1.5 z-50 w-48 animate-fade-in shadow-2xl shadow-black/60">
          <ProjectAppearancePicker color={color} icon={icon} onColor={onColor} onIcon={onIcon} />
        </div>
      )}
    </div>
  )
}
