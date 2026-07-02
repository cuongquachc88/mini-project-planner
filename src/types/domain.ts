import type { DbWorkItem, DbCustomStage, DbUser, DbLabel, DbEpic, DbSprint, DbMilestone } from './db'

export interface WorkItemEnriched extends DbWorkItem {
  stage: DbCustomStage | null
  assignee: DbUser | null
  labels: DbLabel[]
  epic: DbEpic | null
  sprint: DbSprint | null
  milestone: DbMilestone | null
  commentCount: number
}

export interface EpicWithProgress extends DbEpic {
  totalItems: number
  doneItems: number
  totalPoints: number
  donePoints: number
  completionPct: number
}

export interface MilestoneWithHealth extends DbMilestone {
  linkedItems: number
  doneItems: number
  health: 'green' | 'amber' | 'red'
}

export interface SprintWithStats extends DbSprint {
  plannedPoints: number
  completedPoints: number
  totalItems: number
  doneItems: number
}

export interface BoardColumn {
  stage: DbCustomStage
  items: DbWorkItem[]
}
