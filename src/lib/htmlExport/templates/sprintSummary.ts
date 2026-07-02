import type { DbSprint, DbWorkItem, DbCustomStage } from '@/types/db'

export function renderSprintSummary(
  sprint: DbSprint,
  items: DbWorkItem[],
  stages: DbCustomStage[],
  velocity: number,
): string {
  const done = items.filter((i) => stages.find((s) => s.id === i.stage_id)?.is_done)
  const totalPoints = items.reduce((acc, i) => acc + (i.story_points ?? 0), 0)
  const donePoints = done.reduce((acc, i) => acc + (i.story_points ?? 0), 0)

  const byStage = stages.map((s) => ({
    stage: s,
    items: items.filter((i) => i.stage_id === s.id),
  }))

  return /* html */`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Sprint Summary: ${escHtml(sprint.name)}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0f172a;color:#cbd5e1;padding:2rem}
  .wrap{max-width:800px;margin:0 auto}
  .header{background:#1e293b;border:1px solid #334155;border-radius:12px;padding:1.5rem;margin-bottom:1.5rem}
  h1{font-size:1.4rem;font-weight:700;color:#f1f5f9;margin-bottom:.5rem}
  .goal{font-size:14px;color:#94a3b8;font-style:italic}
  .stats{display:flex;gap:1.5rem;margin-top:1rem;flex-wrap:wrap}
  .stat{background:#0f172a;border-radius:8px;padding:.75rem 1rem;min-width:120px}
  .stat-label{font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:#64748b;font-weight:600;margin-bottom:4px}
  .stat-value{font-size:1.5rem;font-weight:700;color:#e2e8f0}
  .section{margin-bottom:1.5rem}
  h2{font-size:.8rem;font-weight:600;text-transform:uppercase;letter-spacing:.08em;color:#64748b;margin-bottom:.75rem;padding-left:.25rem}
  .col-header{display:flex;align-items:center;gap:.5rem;margin-bottom:.5rem}
  .dot{width:8px;height:8px;border-radius:50%}
  .col-name{font-size:13px;font-weight:600;color:#cbd5e1}
  .col-count{font-size:11px;color:#64748b;margin-left:auto}
  table{width:100%;border-collapse:collapse;font-size:13px;background:#1e293b;border-radius:8px;overflow:hidden}
  td,th{padding:.6rem .75rem;text-align:left;border-bottom:1px solid #1e293b}
  th{background:#0f172a;color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:.04em;font-weight:600}
  tr:last-child td{border-bottom:none}
  .badge{display:inline-flex;align-items:center;padding:1px 6px;border-radius:9999px;font-size:10px;font-weight:700;text-transform:uppercase}
  .priority-critical{background:#450a0a;color:#fca5a5}.priority-high{background:#431407;color:#fdba74}
  .priority-medium{background:#1c1917;color:#d6d3d1}.priority-low{background:#0c1a0e;color:#86efac}
  .pts{color:#93c5fd;font-family:monospace;font-size:12px}
</style>
</head>
<body>
<div class="wrap">
  <div class="header">
    <h1>${escHtml(sprint.name)}</h1>
    ${sprint.goal ? `<p class="goal">${escHtml(sprint.goal)}</p>` : ''}
    ${sprint.start_date && sprint.end_date ? `<p style="font-size:12px;color:#64748b;margin-top:.5rem">${sprint.start_date} → ${sprint.end_date}</p>` : ''}
    <div class="stats">
      <div class="stat"><div class="stat-label">Total items</div><div class="stat-value">${items.length}</div></div>
      <div class="stat"><div class="stat-label">Completed</div><div class="stat-value">${done.length}</div></div>
      <div class="stat"><div class="stat-label">Points done</div><div class="stat-value">${donePoints}/${totalPoints}</div></div>
      ${velocity > 0 ? `<div class="stat"><div class="stat-label">Velocity</div><div class="stat-value">${velocity}</div></div>` : ''}
    </div>
  </div>

  ${byStage.filter((g) => g.items.length > 0).map((g) => /* html */`
  <div class="section">
    <div class="col-header">
      <div class="dot" style="background:${g.stage.color ?? '#6366f1'}"></div>
      <span class="col-name">${escHtml(g.stage.name)}</span>
      <span class="col-count">${g.items.length} item${g.items.length !== 1 ? 's' : ''}</span>
    </div>
    <table>
      <thead><tr><th>Title</th><th>Type</th><th>Priority</th><th>Points</th></tr></thead>
      <tbody>
        ${g.items.map((item) => `
        <tr>
          <td>${escHtml(item.title)}</td>
          <td style="font-family:monospace;font-size:11px;color:#64748b">${escHtml(item.type)}</td>
          <td><span class="badge priority-${item.priority}">${item.priority}</span></td>
          <td class="pts">${item.story_points ?? '—'}</td>
        </tr>`).join('')}
      </tbody>
    </table>
  </div>`).join('')}
</div>
</body>
</html>`
}

function escHtml(s: string): string {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
