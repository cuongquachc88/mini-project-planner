import type { DbWorkItem, DbUser, DbLabel } from '@/types/db'

export function renderTaskCard(
  item: DbWorkItem,
  opts: { assignee?: DbUser | null; labels?: DbLabel[]; comments?: { body: string; author_name: string; created_at: string }[] },
): string {
  const labels = opts.labels ?? []
  const comments = opts.comments ?? []
  const assignee = opts.assignee

  return /* html */`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${escHtml(item.title)}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0f172a;color:#cbd5e1;padding:2rem;min-height:100vh}
  .card{background:#1e293b;border:1px solid #334155;border-radius:12px;padding:1.5rem;max-width:640px;margin:0 auto}
  .badge{display:inline-flex;align-items:center;padding:2px 8px;border-radius:9999px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.04em}
  .type{background:#312e81;color:#a5b4fc}.priority-critical{background:#450a0a;color:#fca5a5}
  .priority-high{background:#431407;color:#fdba74}.priority-medium{background:#1c1917;color:#d6d3d1}
  .priority-low{background:#0c1a0e;color:#86efac}.label{border:1px solid #475569;color:#94a3b8}
  .points{background:#1e3a5f;color:#93c5fd;font-family:monospace}
  .meta{display:grid;grid-template-columns:1fr 1fr;gap:.75rem;margin:1rem 0;font-size:13px}
  .meta dt{color:#64748b;font-size:11px;font-weight:600;text-transform:uppercase;margin-bottom:2px}
  .meta dd{color:#e2e8f0}
  .divider{border:none;border-top:1px solid #334155;margin:1.25rem 0}
  .desc{font-size:14px;line-height:1.7;color:#94a3b8;white-space:pre-wrap}
  .comment{display:flex;gap:.75rem;margin-bottom:1rem}
  .avatar{width:32px;height:32px;border-radius:50%;background:#1d4ed8;color:#bfdbfe;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0}
  .comment-body{font-size:13px;line-height:1.6;color:#cbd5e1;white-space:pre-wrap}
  .comment-meta{font-size:11px;color:#64748b;margin-bottom:2px}
  h1{font-size:1.25rem;font-weight:700;color:#f1f5f9;margin-bottom:.75rem;line-height:1.4}
  h2{font-size:.875rem;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:.06em;margin-bottom:.75rem}
</style>
</head>
<body>
<div class="card">
  <div style="display:flex;align-items:center;gap:.5rem;flex-wrap:wrap;margin-bottom:.75rem">
    <span class="badge type">${escHtml(item.type)}</span>
    <span class="badge priority-${escHtml(item.priority)}">${escHtml(item.priority)}</span>
    ${item.story_points != null ? `<span class="badge points">${item.story_points} pts</span>` : ''}
    ${labels.map((l) => `<span class="badge label" style="border-color:${escHtml(l.color)};color:${escHtml(l.color)}">${escHtml(l.name)}</span>`).join('')}
  </div>
  <h1>${escHtml(item.title)}</h1>
  <dl class="meta">
    ${assignee ? `<div><dt>Assignee</dt><dd>${escHtml(assignee.name)}</dd></div>` : ''}
    ${item.due_date ? `<div><dt>Due date</dt><dd>${escHtml(item.due_date)}</dd></div>` : ''}
    <div><dt>Created</dt><dd>${new Date(item.created_at).toLocaleDateString()}</dd></div>
    <div><dt>Updated</dt><dd>${new Date(item.updated_at).toLocaleDateString()}</dd></div>
  </dl>
  ${item.description ? `<hr class="divider"><p class="desc">${escHtml(item.description)}</p>` : ''}
  ${comments.length > 0 ? `
  <hr class="divider">
  <h2>Comments (${comments.length})</h2>
  ${comments.map((c) => `
  <div class="comment">
    <div class="avatar">${(c.author_name ?? '?')[0].toUpperCase()}</div>
    <div>
      <div class="comment-meta">${escHtml(c.author_name ?? 'Unknown')} · ${new Date(c.created_at).toLocaleString()}</div>
      <div class="comment-body">${escHtml(c.body)}</div>
    </div>
  </div>`).join('')}` : ''}
</div>
</body>
</html>`
}

function escHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
