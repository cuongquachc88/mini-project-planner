import { useState } from 'react'
import { useLiveQuery } from '@electric-sql/pglite-react'
import { Plus, ChevronRight, BookOpen, Trash2 } from 'lucide-react'
import { useProject } from '@/hooks/useProject'
import { saveWikiPage, deleteWikiPage } from '@/db/queries/vault'
import type { DbWikiPage } from '@/types/db'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { cn } from '@/lib/utils/cn'

function buildTree(pages: DbWikiPage[], parentId: string | null = null): DbWikiPage[] {
  return pages.filter((p) => p.parent_id === parentId)
}

function TreeNode({ page, all, selected, onSelect }: { page: DbWikiPage; all: DbWikiPage[]; selected: string | null; onSelect: (p: DbWikiPage) => void }) {
  const children = buildTree(all, page.id)
  return (
    <div>
      <button
        onClick={() => onSelect(page)}
        className={cn(
          'w-full flex items-center gap-1.5 px-2.5 py-[6px] rounded-md text-[13px] text-left transition-all',
          selected === page.id
            ? 'bg-white/[0.08] text-white font-medium'
            : 'text-white/40 hover:text-white/80 hover:bg-white/[0.04]',
        )}
      >
        {children.length > 0 && <ChevronRight size={11} className="shrink-0 text-white/25" />}
        <span className="truncate">{page.title}</span>
      </button>
      {children.length > 0 && (
        <div className="pl-3 mt-0.5">
          {children.map((child) => <TreeNode key={child.id} page={child} all={all} selected={selected} onSelect={onSelect} />)}
        </div>
      )}
    </div>
  )
}

export default function WikiPage() {
  const { projectId } = useProject()
  const [selectedPage, setSelectedPage] = useState<DbWikiPage | null>(null)
  const [editing, setEditing] = useState(false)
  const [body, setBody] = useState('')
  const [newTitle, setNewTitle] = useState('')
  const [creatingPage, setCreatingPage] = useState(false)

  const result = useLiveQuery<DbWikiPage>(`SELECT * FROM wiki_pages WHERE project_id = $1 ORDER BY parent_id NULLS FIRST, position`, [projectId ?? ''])
  const pages = result?.rows ?? []
  const roots = buildTree(pages, null)

  function selectPage(page: DbWikiPage) {
    setSelectedPage(page)
    setBody(page.body ?? '')
    setEditing(false)
  }

  async function handleSaveBody() {
    if (!selectedPage || !projectId) return
    await saveWikiPage({ id: selectedPage.id, project_id: selectedPage.project_id, parent_id: selectedPage.parent_id, title: selectedPage.title, body, position: selectedPage.position })
    setEditing(false)
  }

  async function handleCreatePage() {
    if (!newTitle.trim() || !projectId) return
    const page = await saveWikiPage({ id: crypto.randomUUID(), project_id: projectId, parent_id: selectedPage?.id ?? null, title: newTitle.trim(), body: '', position: pages.length })
    setNewTitle(''); setCreatingPage(false); setSelectedPage(page); setBody('')
  }

  return (
    <div className="flex h-full">
      {/* Wiki tree sidebar */}
      <div className="w-48 shrink-0 border-r border-white/[0.06] flex flex-col">
        <div className="flex items-center justify-between px-3 py-3 border-b border-white/[0.06] bg-white/[0.03]">
          <span className="text-[11px] font-semibold text-white/60 uppercase tracking-widest">Pages</span>
          <button
            onClick={() => setCreatingPage(true)}
            aria-label="New page"
            className="w-5 h-5 flex items-center justify-center rounded text-white/25 hover:text-violet-400 hover:bg-white/[0.06] transition-all"
          >
            <Plus size={13} />
          </button>
        </div>
        <div className="flex flex-col gap-0.5 p-2 mt-1">

        {creatingPage && (
          <div className="mb-2 space-y-1 px-1">
            <Input
              autoFocus
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Page title"
              className="text-xs h-7"
              onKeyDown={(e) => e.key === 'Enter' && handleCreatePage()}
            />
            <div className="flex gap-1">
              <Button size="sm" onClick={handleCreatePage} className="text-xs h-6 px-2 flex-1">Add</Button>
              <Button variant="ghost" size="sm" onClick={() => setCreatingPage(false)} className="text-xs h-6 px-2">✕</Button>
            </div>
          </div>
        )}

        {roots.map((page) => (
          <TreeNode key={page.id} page={page} all={pages} selected={selectedPage?.id ?? null} onSelect={selectPage} />
        ))}
        </div>
      </div>

      {/* Wiki content */}
      <div className="flex-1 p-6 overflow-auto">
        {!selectedPage ? (
          <div className="text-center py-24 text-white/20">
            <BookOpen size={36} className="mx-auto mb-3 text-white/[0.08]" />
            <p className="text-sm">Select a page or create a new one</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[13px] font-semibold text-white/60 uppercase tracking-wider">{selectedPage.title}</h2>
              <div className="flex items-center gap-2">
                {editing ? (
                  <>
                    <Button size="sm" onClick={handleSaveBody}>Save</Button>
                    <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>Cancel</Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" size="sm" onClick={() => setEditing(true)}>Edit</Button>
                    <button
                      onClick={() => { deleteWikiPage(selectedPage.id); setSelectedPage(null) }}
                      className="w-7 h-7 flex items-center justify-center rounded text-white/20 hover:text-red-400 hover:bg-white/[0.06] transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </>
                )}
              </div>
            </div>

            {editing ? (
              <Textarea
                rows={22}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write markdown content…"
                className="font-mono text-[13px]"
              />
            ) : (
              <div className="text-[13px] text-white/70 whitespace-pre-wrap leading-relaxed">
                {body || <span className="text-white/20 italic">No content yet. Click Edit to write.</span>}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
