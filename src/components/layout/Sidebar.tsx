import { useState } from 'react'
import { NavLink, useParams, useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils/cn'
import {
  Kanban, BarChart2, Settings, Zap, GitBranch, FileText,
  CheckSquare, BookMarked, DollarSign, Layers, BookOpen,
  PanelLeftClose, PanelLeftOpen, Home,
  FileStack,
} from 'lucide-react'

const mainNav = [
  { to: 'board',   label: 'Board',   icon: Kanban },
  { to: 'backlog', label: 'Backlog', icon: Layers },
  { to: 'epics',   label: 'Epics',   icon: GitBranch },
  { to: 'reports', label: 'Reports', icon: BarChart2 },
]

const vaultNav = [
  { to: 'vault/notes',     label: 'Meeting Notes', icon: FileText },
  { to: 'vault/decisions', label: 'Decisions',     icon: BookMarked },
  { to: 'vault/retros',    label: 'Retros',        icon: Zap },
  { to: 'vault/runsheets', label: 'Run Sheets',    icon: CheckSquare },
  { to: 'vault/wiki',      label: 'Wiki',          icon: BookOpen },
  { to: 'vault/costs',     label: 'Costs',         icon: DollarSign },
]

function NavItem({ to, label, icon: Icon, collapsed }: {
  to: string; label: string; icon: React.ElementType; collapsed: boolean
}) {
  const { projectId } = useParams()
  return (
    <NavLink
      to={`/projects/${projectId}/${to}`}
      title={label}
      className={({ isActive }) => cn(
        'flex items-center gap-3 rounded-md text-[13px] transition-all duration-100 group relative',
        collapsed ? 'justify-center p-2' : 'px-2.5 py-[7px]',
        isActive
          ? 'bg-white/[0.08] text-white font-medium'
          : 'text-white/40 hover:text-white/80 hover:bg-white/[0.04]',
      )}
    >
      <Icon size={15} className="shrink-0" strokeWidth={1.8} />
      {!collapsed && <span className="truncate leading-none">{label}</span>}
      {collapsed && (
        <div className="absolute left-full ml-2 px-2 py-1 bg-[#1c1c20] border border-white/10 rounded-md text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-50 shadow-xl transition-opacity">
          {label}
        </div>
      )}
    </NavLink>
  )
}

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()

  return (
    <aside className={cn(
      'shrink-0 flex flex-col border-r border-white/[0.06] bg-[#0d0d0f] transition-[width] duration-200 overflow-hidden',
      collapsed ? 'w-[52px]' : 'w-[220px]',
    )}>

      {/* Top: collapse toggle */}
      <div className={cn(
        'flex items-center h-12 border-b border-white/[0.06] px-2',
        collapsed ? 'justify-center' : 'justify-between px-3',
      )}>
        {!collapsed && (
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-white/40 hover:text-white/80 transition-colors text-[13px]"
          >
            <Home size={14} strokeWidth={1.8} />
            <span>Home</span>
          </button>
        )}
        <button
          onClick={() => setCollapsed(v => !v)}
          className="w-7 h-7 rounded-md flex items-center justify-center text-white/25 hover:text-white/60 hover:bg-white/[0.05] transition-all"
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          {collapsed ? <PanelLeftOpen size={14} strokeWidth={1.8} /> : <PanelLeftClose size={14} strokeWidth={1.8} />}
        </button>
      </div>

      {/* Main nav */}
      <nav className="flex flex-col gap-px p-2 mt-1">
        {mainNav.map(item => <NavItem key={item.to} {...item} collapsed={collapsed} />)}
      </nav>

      {/* Vault divider */}
      {collapsed ? (
        <div className="mx-2 mt-3 mb-1 border-t border-white/[0.06]" />
      ) : (
        <div className="mt-3 mb-1 border-t border-b border-white/[0.06] bg-violet-500/[0.06] px-3 py-1.5 flex items-center gap-1.5">
          <FileStack size={10} className="text-violet-400/60" strokeWidth={2} />
          <span className="text-[10px] font-semibold text-violet-400/70 uppercase tracking-widest">Vault</span>
        </div>
      )}

      <nav className="flex flex-col gap-px px-2 pb-2">
        {vaultNav.map(item => <NavItem key={item.to} {...item} collapsed={collapsed} />)}
      </nav>

      {/* Settings pinned bottom */}
      <div className="mt-auto border-t border-white/[0.06] p-2">
        <NavItem to="settings" label="Settings" icon={Settings} collapsed={collapsed} />
      </div>
    </aside>
  )
}
