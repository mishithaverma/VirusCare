import {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
  useEffect,
  useRef,
} from 'react'
import { X } from 'lucide-react'

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ')

/* ----------------------------------------------------------------- Button */
type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type BtnSize = 'sm' | 'md'
interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: BtnVariant
  size?: BtnSize
  icon?: ReactNode
}
export function Button({ variant = 'primary', size = 'md', icon, className, children, ...rest }: BtnProps) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed'
  const sizes: Record<BtnSize, string> = { sm: 'px-2.5 py-1.5 text-xs', md: 'px-3.5 py-2 text-sm' }
  const variants: Record<BtnVariant, string> = {
    primary: 'bg-navy text-white hover:bg-navy-700',
    secondary: 'border border-navy/25 text-navy hover:bg-navy-50',
    ghost: 'text-navy hover:bg-navy-50',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  }
  return (
    <button className={cx(base, sizes[size], variants[variant], className)} {...rest}>
      {icon}
      {children}
    </button>
  )
}

/* ------------------------------------------------------------------- Card */
export function Card({
  title,
  description,
  right,
  className,
  children,
}: {
  title?: ReactNode
  description?: ReactNode
  right?: ReactNode
  className?: string
  children: ReactNode
}) {
  return (
    <section className={cx('bg-white rounded-2xl shadow-card border border-slate-200/70 p-5', className)}>
      {(title || right) && (
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            {title && <h2 className="font-semibold text-navy">{title}</h2>}
            {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
          </div>
          {right}
        </div>
      )}
      {children}
    </section>
  )
}

/* ------------------------------------------------------------------ Badge */
type Tone = 'green' | 'orange' | 'red' | 'blue' | 'slate'
const toneMap: Record<Tone, string> = {
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  orange: 'bg-orange-50 text-orange-700 ring-orange-600/20',
  red: 'bg-red-50 text-red-700 ring-red-600/20',
  blue: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  slate: 'bg-slate-100 text-slate-600 ring-slate-500/20',
}
export function Badge({ tone = 'slate', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span className={cx('inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ring-1 ring-inset', toneMap[tone])}>
      {children}
    </span>
  )
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, Tone> = {
    active: 'blue',
    approved: 'green',
    discharged: 'slate',
    deceased: 'red',
  }
  return <Badge tone={map[status] ?? 'slate'}>{status}</Badge>
}

/* ------------------------------------------------------------------ Field */
export function Field({
  label,
  hint,
  error,
  children,
}: {
  label?: string
  hint?: string
  error?: string
  children: ReactNode
}) {
  return (
    <label className="block">
      {label && <span className="block text-xs font-medium text-slate-600 mb-1">{label}</span>}
      {children}
      {error ? (
        <span className="block text-xs text-red-600 mt-1">{error}</span>
      ) : (
        hint && <span className="block text-xs text-slate-400 mt-1">{hint}</span>
      )}
    </label>
  )
}

const controlCls =
  'w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white placeholder:text-slate-400 focus:border-brand'

export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cx(controlCls, className)} {...rest} />
}
export function Select({ className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cx(controlCls, className)} {...rest}>
      {children}
    </select>
  )
}
export function Textarea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cx(controlCls, 'min-h-[76px]', className)} {...rest} />
}

/* ------------------------------------------------------------------- Stat */
export function Stat({
  label,
  value,
  tone = 'navy',
  sub,
  icon,
}: {
  label: string
  value: ReactNode
  tone?: 'navy' | 'orange' | 'emerald' | 'red'
  sub?: ReactNode
  icon?: ReactNode
}) {
  const colors = {
    navy: 'text-navy',
    orange: 'text-orange-600',
    emerald: 'text-emerald-600',
    red: 'text-red-600',
  }
  return (
    <div className="bg-white rounded-2xl border border-slate-200/70 shadow-card p-4">
      <div className="flex items-center justify-between">
        <div className="text-xs text-slate-500">{label}</div>
        {icon && <span className="text-slate-300">{icon}</span>}
      </div>
      <div className={cx('text-2xl font-bold mt-1', colors[tone])}>{value}</div>
      {sub && <div className="text-xs text-slate-400 mt-0.5">{sub}</div>}
    </div>
  )
}

/* ------------------------------------------------------------- EmptyState */
export function EmptyState({ icon, title, hint }: { icon?: ReactNode; title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-10 text-slate-400">
      {icon && <div className="mb-2 text-slate-300">{icon}</div>}
      <p className="text-sm font-medium text-slate-500">{title}</p>
      {hint && <p className="text-xs mt-1 max-w-xs">{hint}</p>}
    </div>
  )
}

/* -------------------------------------------------------------- Skeleton */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cx('animate-pulse rounded-md bg-slate-200/70', className)} />
}

/* ---------------------------------------------------------------- Spinner */
export function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={cx('inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-navy', className)}
      role="status"
      aria-label="Loading"
    />
  )
}

/* ------------------------------------------------------------------ Modal */
export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = 'md',
}: {
  open: boolean
  onClose: () => void
  title?: ReactNode
  children: ReactNode
  footer?: ReactNode
  size?: 'md' | 'lg'
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    ref.current?.focus()
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-900/40 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        ref={ref}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className={cx(
          'bg-white rounded-2xl shadow-pop w-full max-h-[88vh] overflow-auto scrollbar-thin outline-none',
          size === 'lg' ? 'max-w-2xl' : 'max-w-md',
        )}
      >
        {title && (
          <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-100 sticky top-0 bg-white">
            <h3 className="font-semibold text-navy">{title}</h3>
            <button onClick={onClose} aria-label="Close" className="text-slate-400 hover:text-slate-600">
              <X size={18} />
            </button>
          </div>
        )}
        <div className="p-5">{children}</div>
        {footer && <div className="px-5 py-4 border-t border-slate-100 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------- PageHeader */
export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
      <div>
        <h1 className="text-xl font-bold text-navy">{title}</h1>
        {description && <p className="text-sm text-slate-500 mt-0.5">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}
