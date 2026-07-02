import { useLiveQuery } from '@electric-sql/pglite-react'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'
import { useProject } from '@/hooks/useProject'
import { calcVelocity } from '@/lib/utils/points'
import type { SprintWithStats } from '@/types/domain'

export default function Reports() {
  const { projectId } = useProject()

  const sprintHistoryResult = useLiveQuery<SprintWithStats>(
    `SELECT s.*,
      COALESCE(SUM(wi.story_points), 0)::int as "plannedPoints",
      COALESCE(SUM(wi.story_points) FILTER (WHERE cs.is_done = TRUE), 0)::int as "completedPoints",
      COUNT(wi.id)::int as "totalItems",
      COUNT(wi.id) FILTER (WHERE cs.is_done = TRUE)::int as "doneItems"
     FROM sprints s
     LEFT JOIN work_items wi ON wi.sprint_id = s.id
     LEFT JOIN custom_stages cs ON cs.id = wi.stage_id
     WHERE s.project_id = $1 AND s.status = 'completed'
     GROUP BY s.id ORDER BY s.end_date`,
    [projectId ?? ''],
  )
  const history = sprintHistoryResult?.rows ?? []
  const velocity = calcVelocity([...history].reverse())

  const velocityData = history.map((s) => ({
    name: s.name,
    Planned: s.plannedPoints,
    Completed: s.completedPoints,
  }))

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="shrink-0 px-6 pt-5 pb-4 border-b border-white/[0.05]">
        <div className="flex items-center gap-4">
          <h1 className="text-[13px] font-semibold text-white/60 uppercase tracking-wider">Reports</h1>
          <div className="flex items-center gap-1.5 bg-white/[0.05] border border-white/[0.07] rounded-lg px-3 py-1.5">
            <span className="text-[12px] text-white/35">3-sprint velocity</span>
            <span className="text-[13px] text-violet-400 font-semibold">{velocity} pts</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto px-6 py-5 space-y-5">
        {history.length === 0 ? (
          <div className="bg-[#141416] border border-white/[0.07] rounded-xl p-16 text-center text-[13px] text-white/25">
            Complete a sprint to see velocity reports
          </div>
        ) : (
          <>
            <div className="bg-[#141416] border border-white/[0.07] rounded-xl p-5">
              <h2 className="text-[13px] font-semibold text-white/60 uppercase tracking-wider mb-5">Sprint Velocity</h2>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={velocityData} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.2)" tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.35)' }} />
                  <YAxis stroke="rgba(255,255,255,0.2)" tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.35)' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#1a1a1e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }} />
                  <Bar dataKey="Planned" fill="#4c1d95" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="Completed" fill="#7c3aed" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-[#141416] border border-white/[0.07] rounded-xl p-5">
              <h2 className="text-[13px] font-semibold text-white/60 uppercase tracking-wider mb-5">Completion Rate</h2>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={velocityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.2)" tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.35)' }} />
                  <YAxis stroke="rgba(255,255,255,0.2)" tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.35)' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#1a1a1e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, fontSize: 12 }} />
                  <Line type="monotone" dataKey="Completed" stroke="#10b981" strokeWidth={2} dot={{ r: 3, fill: '#10b981' }} />
                  <Line type="monotone" dataKey="Planned" stroke="#7c3aed" strokeWidth={2} strokeDasharray="4 2" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
