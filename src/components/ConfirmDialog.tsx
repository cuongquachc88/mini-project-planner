import { Button } from './ui/Button'

interface Props {
  title: string
  message: string
  confirmLabel?: string
  onConfirm: () => void
  onCancel: () => void
  danger?: boolean
}

export function ConfirmDialog({ title, message, confirmLabel = 'Confirm', onConfirm, onCancel, danger = false }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="card w-full max-w-sm p-6 space-y-4">
        <h3 className="text-base font-semibold text-slate-100">{title}</h3>
        <p className="text-sm text-slate-400">{message}</p>
        <div className="flex gap-2 pt-2">
          <Button
            variant={danger ? 'destructive' : 'default'}
            onClick={onConfirm}
            className="flex-1"
          >
            {confirmLabel}
          </Button>
          <Button variant="ghost" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}
