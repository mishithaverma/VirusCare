import { CheckCircle2, AlertTriangle, Info, XCircle, X } from 'lucide-react'
import { ToastKind, useToast } from '../state/ToastContext'
import { cx } from './ui'

const icons: Record<ToastKind, JSX.Element> = {
  success: <CheckCircle2 size={18} />,
  error: <XCircle size={18} />,
  warning: <AlertTriangle size={18} />,
  info: <Info size={18} />,
}

const styles: Record<ToastKind, string> = {
  success: 'bg-emerald-600 text-white',
  error: 'bg-red-600 text-white',
  warning: 'bg-orange-500 text-white',
  info: 'bg-navy text-white',
}

export function Toaster() {
  const { toasts, dismiss } = useToast()
  return (
    <div
      className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2 w-full max-w-sm no-print"
      aria-live="polite"
      aria-atomic="true"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cx(
            'flex items-start gap-3 rounded-xl px-4 py-3 shadow-pop animate-slide-in',
            styles[t.kind],
          )}
          role={t.kind === 'error' ? 'alert' : 'status'}
        >
          <span className="mt-0.5 shrink-0">{icons[t.kind]}</span>
          <p className="text-sm flex-1">{t.message}</p>
          <button onClick={() => dismiss(t.id)} aria-label="Dismiss" className="opacity-80 hover:opacity-100">
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  )
}
