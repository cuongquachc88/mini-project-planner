import type { SprintWithStats } from '@/types/domain'

export function calcVelocity(sprints: SprintWithStats[], window = 3): number {
  const completed = sprints.slice(0, window)
  if (completed.length === 0) return 0
  const total = completed.reduce((sum, s) => sum + (s.completedPoints ?? 0), 0)
  return Math.round(total / completed.length)
}

export interface BurndownPoint {
  day: string
  ideal: number
  actual: number
}

export function buildBurndownSeries(
  totalPoints: number,
  startDate: string,
  endDate: string,
  completedByDay: Record<string, number>,
): BurndownPoint[] {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const totalDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86400000))
  const points: BurndownPoint[] = []
  let remaining = totalPoints

  for (let d = 0; d <= totalDays; d++) {
    const date = new Date(start.getTime() + d * 86400000)
    const day = date.toISOString().split('T')[0]
    const ideal = Math.round(totalPoints - (totalPoints / totalDays) * d)
    remaining -= completedByDay[day] ?? 0
    points.push({ day, ideal, actual: Math.max(0, remaining) })
  }
  return points
}
