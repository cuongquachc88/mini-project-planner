import { format, formatDistanceToNow, parseISO } from 'date-fns'

function toDate(date: string | Date | null | undefined): Date | null {
  if (!date) return null
  return date instanceof Date ? date : parseISO(date)
}

export function fmtDate(date: string | Date | null | undefined): string {
  const d = toDate(date)
  if (!d) return '—'
  return format(d, 'MMM d, yyyy')
}

export function fmtDateShort(date: string | Date | null | undefined): string {
  const d = toDate(date)
  if (!d) return '—'
  return format(d, 'MMM d')
}

export function fmtRelative(date: string | Date | null | undefined): string {
  const d = toDate(date)
  if (!d) return '—'
  return formatDistanceToNow(d, { addSuffix: true })
}

export function todayIso(): string {
  return format(new Date(), 'yyyy-MM-dd')
}
