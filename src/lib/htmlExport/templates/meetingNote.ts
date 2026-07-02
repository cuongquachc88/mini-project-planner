import type { DbMeetingNote } from '@/types/db'

export function renderMeetingNote(note: DbMeetingNote): string {
  let attendees: string[] = []
  try { attendees = note.attendees ? JSON.parse(note.attendees) : [] } catch { /* ignore */ }

  let bodyHtml = ''
  if (note.body) {
    try {
      bodyHtml = tipTapJsonToHtml(JSON.parse(note.body))
    } catch {
      bodyHtml = `<p>${escHtml(note.body)}</p>`
    }
  }

  return /* html */`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${escHtml(note.title)}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0f172a;color:#cbd5e1;padding:2rem}
  .wrap{max-width:720px;margin:0 auto}
  .header{border-bottom:1px solid #334155;padding-bottom:1.25rem;margin-bottom:1.5rem}
  h1{font-size:1.4rem;font-weight:700;color:#f1f5f9;margin-bottom:.5rem}
  .meta{display:flex;gap:1.5rem;flex-wrap:wrap;font-size:13px;color:#64748b}
  .attendees{display:flex;gap:.4rem;flex-wrap:wrap;margin-top:.75rem}
  .attendee{background:#1e3a5f;color:#93c5fd;border-radius:9999px;padding:2px 10px;font-size:12px}
  .body h2{font-size:1rem;font-weight:700;color:#e2e8f0;margin:1.25rem 0 .5rem}
  .body h3{font-size:.9rem;font-weight:600;color:#cbd5e1;margin:1rem 0 .4rem}
  .body p{font-size:14px;line-height:1.75;color:#94a3b8;margin-bottom:.75rem}
  .body ul,.body ol{padding-left:1.5rem;margin-bottom:.75rem}
  .body li{font-size:14px;line-height:1.75;color:#94a3b8;margin-bottom:.2rem}
  .body code{background:#1e293b;color:#a5b4fc;padding:1px 5px;border-radius:4px;font-family:monospace;font-size:13px}
  .body pre{background:#1e293b;border-radius:8px;padding:1rem;margin-bottom:.75rem;overflow:auto}
  .body pre code{background:none;padding:0;font-size:13px;color:#86efac}
  .body strong{color:#e2e8f0;font-weight:600}
  .body em{font-style:italic}
  .task-list{list-style:none;padding-left:.25rem}
  .task-list li{display:flex;align-items:flex-start;gap:.5rem}
  .task-list input[type=checkbox]{margin-top:3px;accent-color:#6366f1}
</style>
</head>
<body>
<div class="wrap">
  <div class="header">
    <h1>${escHtml(note.title)}</h1>
    <div class="meta">
      <span>📅 ${escHtml(note.meeting_date)}</span>
    </div>
    ${attendees.length > 0 ? `
    <div class="attendees">
      ${attendees.map((a) => `<span class="attendee">${escHtml(String(a))}</span>`).join('')}
    </div>` : ''}
  </div>
  ${bodyHtml ? `<div class="body">${bodyHtml}</div>` : '<p style="color:#475569;font-style:italic">No notes recorded.</p>'}
</div>
</body>
</html>`
}

function tipTapJsonToHtml(doc: { type: string; content?: unknown[] }): string {
  if (!doc?.content) return ''
  return doc.content.map((node) => nodeToHtml(node as TipTapNode)).join('')
}

interface TipTapNode {
  type: string
  text?: string
  content?: TipTapNode[]
  marks?: { type: string }[]
  attrs?: Record<string, unknown>
  checked?: boolean
}

function nodeToHtml(node: TipTapNode): string {
  const inner = () => node.content?.map(nodeToHtml).join('') ?? ''
  switch (node.type) {
    case 'paragraph': return `<p>${inner() || '&nbsp;'}</p>`
    case 'heading': return `<h${node.attrs?.level ?? 2}>${inner()}</h${node.attrs?.level ?? 2}>`
    case 'bulletList': return `<ul>${inner()}</ul>`
    case 'orderedList': return `<ol>${inner()}</ol>`
    case 'taskList': return `<ul class="task-list">${inner()}</ul>`
    case 'listItem': return `<li>${inner()}</li>`
    case 'taskItem': return `<li><input type="checkbox" disabled ${node.attrs?.checked ? 'checked' : ''} /><span>${inner()}</span></li>`
    case 'codeBlock': return `<pre><code>${escHtml(node.content?.[0]?.text ?? '')}</code></pre>`
    case 'blockquote': return `<blockquote style="border-left:3px solid #6366f1;padding-left:1rem;margin-bottom:.75rem">${inner()}</blockquote>`
    case 'hardBreak': return `<br>`
    case 'text': {
      let t = escHtml(node.text ?? '')
      if (node.marks) {
        for (const m of node.marks) {
          if (m.type === 'bold') t = `<strong>${t}</strong>`
          if (m.type === 'italic') t = `<em>${t}</em>`
          if (m.type === 'code') t = `<code>${t}</code>`
        }
      }
      return t
    }
    default: return inner()
  }
}

function escHtml(s: string): string {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
