export type UserRole = 'admin' | 'teammate'

export interface DbUser {
  id: string
  email: string
  name: string
  avatar_url: string | null
  role: UserRole
  created_at: string
}

export interface DbProject {
  id: string
  name: string
  description: string | null
  key: string
  owner_id: string | null
  color: string | null
  icon: string | null
  archived: boolean
  created_at: string
}

export interface DbProjectMember {
  project_id: string
  user_id: string
  role: UserRole
}

export interface DbCustomStage {
  id: string
  project_id: string
  name: string
  color: string | null
  position: number
  is_done: boolean
  created_at: string
}

export interface DbLabel {
  id: string
  project_id: string
  name: string
  color: string
}

export interface DbEpic {
  id: string
  project_id: string
  title: string
  description: string | null
  color: string | null
  status: 'active' | 'done' | 'archived'
  start_date: string | null
  target_date: string | null
  created_at: string
}

export interface DbMilestone {
  id: string
  project_id: string
  title: string
  description: string | null
  target_date: string | null
  status: 'upcoming' | 'achieved' | 'missed'
  created_at: string
}

export interface DbSprint {
  id: string
  project_id: string
  name: string
  goal: string | null
  status: 'planning' | 'active' | 'completed'
  start_date: string | null
  end_date: string | null
  created_at: string
}

export type WorkItemType = 'story' | 'bug' | 'spike' | 'task' | 'action' | 'request'
export type Priority = 'critical' | 'high' | 'medium' | 'low'

export interface DbWorkItem {
  id: string
  project_id: string
  sprint_id: string | null
  epic_id: string | null
  milestone_id: string | null
  stage_id: string | null
  parent_id: string | null
  type: WorkItemType
  title: string
  description: string | null
  priority: Priority
  story_points: number | null
  assignee_id: string | null
  reporter_id: string | null
  due_date: string | null
  acceptance_criteria: string | null
  tech_notes: string | null
  wiki_page_id: string | null
  position: number
  backlog_pos: number
  created_at: string
  updated_at: string
}

export interface DbWorkItemAttachment {
  id: string
  work_item_id: string
  filename: string
  mime_type: string
  size_bytes: number
  data: string
  created_at: string
}

export interface DbComment {
  id: string
  work_item_id: string
  author_id: string | null
  body: string
  created_at: string
  updated_at: string
}

export interface DbMeetingNote {
  id: string
  project_id: string
  title: string
  meeting_date: string
  attendees: string | null
  body: string | null
  created_at: string
  updated_at: string
}

export interface DbDecision {
  id: string
  project_id: string
  title: string
  decision: string
  rationale: string | null
  owner_id: string | null
  decided_at: string
  created_at: string
}

export interface DbRetrospective {
  id: string
  project_id: string
  sprint_id: string | null
  went_well: string | null
  to_improve: string | null
  actions: string | null
  held_at: string
  created_at: string
}

export interface DbRunSheet {
  id: string
  project_id: string
  title: string
  description: string | null
  created_at: string
}

export interface DbRunSheetItem {
  id: string
  run_sheet_id: string
  label: string
  notes: string | null
  checked: boolean
  position: number
}

export interface DbWikiPage {
  id: string
  project_id: string
  parent_id: string | null
  title: string
  body: string | null
  position: number
  created_at: string
  updated_at: string
}

export interface DbCost {
  id: string
  project_id: string
  name: string
  category: 'saas' | 'infra' | 'tooling' | 'other' | null
  cadence: 'monthly' | 'annual' | 'one-off' | null
  amount: number
  currency: string
  budget: number | null
  active: boolean
  notes: string | null
  start_date: string | null
  created_at: string
}

export interface DbAppMeta {
  key: string
  value: string
}
