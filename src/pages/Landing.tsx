import { useNavigate } from 'react-router-dom'
import { Box, Kanban, Zap, Archive, BarChart2, Shield, ArrowRight, CheckCircle } from 'lucide-react'

const FEATURES = [
  { icon: Kanban,   title: 'Kanban Board',    desc: 'Drag-and-drop cards across custom stages. Filter by type, priority, and assignee.' },
  { icon: Zap,      title: 'Sprint Planning',  desc: 'Create sprints, move backlog items in, start and complete sprints with one click.' },
  { icon: Archive,  title: 'Project Vault',    desc: 'Meeting notes, decisions, retrospectives, run sheets, wiki, and cost tracking.' },
  { icon: BarChart2,title: 'Reports',          desc: 'Velocity charts and burndown graphs built from your real sprint history.' },
  { icon: Shield,   title: 'Fully Offline',    desc: 'PostgreSQL runs in your browser via PGlite + IndexedDB. Zero backend, zero account.' },
]

const BULLETS = [
  'No signup, no server, no data leaves your device',
  'Installs as a PWA — works offline',
  'Optional Google Drive backup',
]

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[#0d0d0f] text-white overflow-x-hidden">

      {/* Grid + glow */}
      <div className="fixed inset-0 pointer-events-none"
        style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.018) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.018) 1px,transparent 1px)', backgroundSize: '48px 48px' }} />
      <div className="fixed top-[-15%] left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(ellipse,rgba(124,58,237,0.14) 0%,transparent 70%)' }} />

      {/* Nav */}
      <header className="relative z-10 border-b border-white/[0.06] bg-[#0d0d0f]/80 backdrop-blur-sm sticky top-0">
        <div className="max-w-5xl mx-auto px-6 h-13 flex items-center justify-between py-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-900/50">
              <Box size={14} className="text-white" strokeWidth={2} />
            </div>
            <span className="text-[15px] font-semibold tracking-tight">Planner</span>
          </div>
          <div className="flex items-center gap-2">
            <a href="/docs/" target="_blank" className="text-[13px] text-white/40 hover:text-white/70 transition-colors px-3 py-1.5">
              Docs
            </a>
            <button
              onClick={() => navigate('/login')}
              className="text-[13px] text-white/60 hover:text-white transition-colors px-3 py-1.5"
            >
              Sign in
            </button>
            <button
              onClick={() => navigate('/login')}
              className="flex items-center gap-1.5 text-[13px] font-medium bg-violet-600 hover:bg-violet-500 text-white px-4 py-1.5 rounded-lg transition-colors"
            >
              Get started <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 text-[11px] font-medium text-violet-400 bg-violet-500/10 border border-violet-500/20 rounded-full px-3 py-1 mb-7">
          <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
          Offline-first · No backend · No account
        </div>

        <h1 className="text-[42px] sm:text-[56px] font-bold tracking-tight leading-[1.08] mb-6">
          Project management
          <br />
          <span className="text-violet-400">that lives in your browser</span>
        </h1>

        <p className="text-[16px] text-white/45 leading-relaxed max-w-xl mx-auto mb-10">
          Kanban boards, sprints, epics, vault, and reports — all powered by
          PostgreSQL running locally via PGlite. Your data never leaves your device.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => navigate('/login')}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-semibold px-6 py-3 rounded-xl text-[14px] transition-all shadow-lg shadow-violet-900/40 hover:shadow-violet-900/60 hover:-translate-y-0.5"
          >
            Open the app <ArrowRight size={15} />
          </button>
          <a
            href="/docs/"
            target="_blank"
            className="flex items-center gap-2 bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] text-white/70 hover:text-white font-medium px-6 py-3 rounded-xl text-[14px] transition-all"
          >
            Read the docs
          </a>
        </div>

        <ul className="flex flex-col sm:flex-row items-center justify-center gap-x-6 gap-y-2 mt-8">
          {BULLETS.map(b => (
            <li key={b} className="flex items-center gap-1.5 text-[12px] text-white/30">
              <CheckCircle size={12} className="text-emerald-500 shrink-0" />{b}
            </li>
          ))}
        </ul>
      </section>

      {/* Features */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 pb-24">
        <h2 className="text-[11px] font-semibold text-white/25 uppercase tracking-widest text-center mb-8">
          Everything you need
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-[#111113] border border-white/[0.07] rounded-xl p-5 hover:border-white/[0.13] hover:bg-[#161618] transition-all group">
              <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mb-4 group-hover:bg-violet-500/15 transition-colors">
                <Icon size={15} className="text-violet-400" strokeWidth={1.8} />
              </div>
              <h3 className="text-[14px] font-semibold text-white mb-1.5">{title}</h3>
              <p className="text-[12px] text-white/40 leading-relaxed">{desc}</p>
            </div>
          ))}

          {/* CTA card */}
          <div
            onClick={() => navigate('/login')}
            className="bg-violet-600/10 border border-violet-500/20 rounded-xl p-5 hover:bg-violet-600/15 hover:border-violet-500/35 transition-all cursor-pointer flex flex-col justify-between group"
          >
            <div>
              <h3 className="text-[14px] font-semibold text-white mb-1.5">Start now</h3>
              <p className="text-[12px] text-white/40 leading-relaxed">No sign-up required. Your workspace is ready instantly.</p>
            </div>
            <div className="flex items-center gap-1.5 text-[13px] font-medium text-violet-400 mt-5 group-hover:gap-2.5 transition-all">
              Open the app <ArrowRight size={13} />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/[0.05] py-6">
        <div className="max-w-5xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-violet-600 flex items-center justify-center">
              <Box size={11} className="text-white" strokeWidth={2} />
            </div>
            <span className="text-[12px] text-white/30">Planner</span>
          </div>
          <div className="flex items-center gap-5">
            <a href="/docs/" target="_blank" className="text-[11px] text-white/20 hover:text-white/45 transition-colors">Docs</a>
            <a href="/docs/sad.html" target="_blank" className="text-[11px] text-white/20 hover:text-white/45 transition-colors">Architecture</a>
            <span className="text-[11px] text-white/15">Local · Offline · No server</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
