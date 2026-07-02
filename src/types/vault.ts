import type { DbMeetingNote, DbDecision, DbRetrospective, DbRunSheet, DbWikiPage, DbCost } from './db'

export type VaultSection = 'notes' | 'decisions' | 'retros' | 'runsheets' | 'wiki' | 'costs'

export type VaultEntry =
  | { section: 'notes'; data: DbMeetingNote }
  | { section: 'decisions'; data: DbDecision }
  | { section: 'retros'; data: DbRetrospective }
  | { section: 'runsheets'; data: DbRunSheet }
  | { section: 'wiki'; data: DbWikiPage }
  | { section: 'costs'; data: DbCost }

export interface VaultNavItem {
  section: VaultSection
  label: string
  icon: string
}
