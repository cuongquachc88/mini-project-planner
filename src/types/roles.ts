import type { DbUser } from './db'

export type Permission =
  | 'project:create'
  | 'project:archive'
  | 'project:settings'
  | 'member:invite'
  | 'member:remove'
  | 'stage:manage'
  | 'sprint:manage'
  | 'workitem:create'
  | 'workitem:delete'
  | 'vault:write'
  | 'cost:manage'
  | 'drive:sync'

const ADMIN_PERMISSIONS: Permission[] = [
  'project:create', 'project:archive', 'project:settings',
  'member:invite', 'member:remove', 'stage:manage', 'sprint:manage',
  'workitem:create', 'workitem:delete', 'vault:write', 'cost:manage', 'drive:sync',
]

const TEAMMATE_PERMISSIONS: Permission[] = [
  'workitem:create', 'vault:write',
]

export function can(user: DbUser | null, permission: Permission): boolean {
  if (!user) return false
  const allowed = user.role === 'admin' ? ADMIN_PERMISSIONS : TEAMMATE_PERMISSIONS
  return allowed.includes(permission)
}
