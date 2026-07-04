import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from '@electric-sql/pglite-react'
import { ChevronDown, Plus, LayoutGrid } from 'lucide-react'
import type { DbProject } from '@/types/db'
import { useProject } from '@/hooks/useProject'
import { cn } from '@/lib/utils/cn'

export function ProjectSwitcher() {
  const [open, setOpen] = useState(false)
  const { project } = useProject()
  const navigate = useNavigate()
  const result = useLiveQuery<DbProject>(`SELECT * FROM projects WHERE archived = FALSE ORDER BY created_at DESC`)
  const projects = result?.rows ?? []

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className={cn(
          'flex items-center gap-2 h-7 pl-1.5 pr-2.5 rounded-md text-sm transition-all',
          'hover:bg-white/[0.06]',
          open && 'bg-white/[0.06]',
        )}
      >
        {project
          ? <div className="w-4 h-4 rounded-[4px] shrink-0" style={{ backgroundColor: project.color ?? '#7c3aed' }} />
          : <LayoutGrid size={14} className="text-white/30" />
        }
        <span className="font-medium text-[13px] text-white max-w-[150px] truncate leading-none">
          {project?.name ?? 'Projects'}
        </span>
        <ChevronDown size={12} className={cn('text-white/30 transition-transform duration-150', open && 'rotate-180')} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-1.5 w-56 rounded-xl border border-white/[0.08] shadow-2xl shadow-black/60 z-50 overflow-hidden animate-fade-in"
            style={{ background: '#16161a' }}>

            <div className="p-1 max-h-60 overflow-y-auto">
              {projects.map(p => (
                <button
                  key={p.id}
                  onClick={() => { navigate(`/projects/${p.id}/board`); setOpen(false) }}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] transition-colors',
                    p.id === project?.id ? 'bg-white/[0.07] text-white' : 'text-white/50 hover:text-white hover:bg-white/[0.04]',
                  )}
                >
                  <div className="w-3.5 h-3.5 rounded-[3px] shrink-0" style={{ backgroundColor: p.color ?? '#7c3aed' }} />
                  <span className="truncate flex-1 text-left">{p.name}</span>
                  <span className="text-[10px] text-white/20 font-mono">{p.key}</span>
                </button>
              ))}
              {projects.length === 0 && (
                <p className="text-[12px] text-white/25 text-center py-4">No projects yet</p>
              )}
            </div>

            <div className="border-t border-white/[0.06] p-1">
              <button
                onClick={() => { navigate('/ui'); setOpen(false) }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[12px] text-white/40 hover:text-white hover:bg-white/[0.04] transition-colors"
              >
                <LayoutGrid size={12} />All projects
              </button>
              <button
                onClick={() => { navigate('/?new=1'); setOpen(false) }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[12px] text-violet-400 hover:text-violet-300 hover:bg-violet-500/10 transition-colors"
              >
                <Plus size={12} />New project
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
