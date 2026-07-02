import { useStore } from '@/store'
import { can, type Permission } from '@/types/roles'

export function usePermission(permission: Permission): boolean {
  const currentUser = useStore((s) => s.currentUser)
  return can(currentUser, permission)
}
