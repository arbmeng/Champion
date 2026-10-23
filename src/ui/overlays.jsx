import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, Info, TriangleAlert, X } from 'lucide-react'
import { Button, IconButton, cx } from './primitives'
import { tr } from '../lib/i18n'

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

// One overlay primitive. `side="bottom"` is a bottom sheet on phones and a centred modal on larger
// screens; `side="right"` is a drawer; `Modal` and `Drawer` below are just named presets.
export function Sheet({ open, onClose, title, children, footer, side = 'bottom', size = 'md', label }) {
  const ref = useRef(null)
  const lastFocus = useRef(null)
  useEffect(() => {
    if (!open) return undefined
    lastFocus.current = document.activeElement
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const node = ref.current
    const first = node?.querySelector('[data-autofocus]') || node?.querySelector(FOCUSABLE)
    ;(first || node)?.focus({ preventScroll: true })
    const onKey = (e) => {
      if (e.key === 'Escape') { e.stopPropagation(); onClose() }
      if (e.key !== 'Tab' || !node) return
      const items = [...node.querySelectorAll(FOCUSABLE)].filter((el) => el.offsetParent !== null)
      if (!items.length) return
      const [a, z] = [items[0], items[items.length - 1]]
      if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus() }
      else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus() }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
      lastFocus.current?.focus?.({ preventScroll: true })
    }
  }, [open, onClose])
  if (!open) return null
  return createPortal(
    <div className="overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div ref={ref} className={cx('sheet', `sheet-${side}`, `sheet-${size}`)} role="dialog" aria-modal="true" aria-label={label || title} tabIndex={-1}>
        <div className="sheet-grip" aria-hidden="true" />
        {title && (
          <div className="sheet-head">
            <h2>{title}</h2>
            <IconButton label={tr("Close")} icon={X} size="sm" onClick={onClose} />
          </div>
        )}
        <div className="sheet-body">{children}</div>
        {footer && <div className="sheet-foot">{footer}</div>}
      </div>
    </div>,
    document.body,
  )
}
export const Modal = (props) => <Sheet size="sm" {...props} />
export const Drawer = (props) => <Sheet side="right" {...props} />

export function ConfirmSheet({ open, onClose, onConfirm, title, body, confirmLabel = 'Confirm', tone = 'primary', cancelLabel = 'Cancel' }) {
  return (
    <Modal open={open} onClose={onClose} title={title} footer={<div className="row gap-2"><Button block onClick={onClose}>{cancelLabel}</Button><Button block variant={tone === 'danger' ? 'danger' : 'primary'} onClick={() => { onConfirm(); onClose() }} data-autofocus>{confirmLabel}</Button></div>}>
      <p className="muted">{body}</p>
    </Modal>
  )
}

/* ---------- Toasts ---------- */
const ToastContext = createContext(null)
let toastId = 0
export function ToastProvider({ children }) {
  const [items, setItems] = useState([])
  const remove = useCallback((id) => setItems((list) => list.filter((t) => t.id !== id)), [])
  const toast = useCallback((t) => {
    const id = ++toastId
    setItems((list) => [...list.slice(-2), { id, tone: 'neutral', ...(typeof t === 'string' ? { title: t } : t) }])
    setTimeout(() => remove(id), 3800)
  }, [remove])
  const value = useMemo(() => toast, [toast])
  const Icon = { success: Check, danger: TriangleAlert, neutral: Info, info: Info, warning: TriangleAlert }
  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {items.map((t) => {
          const I = Icon[t.tone] || Info
          return <div key={t.id} className={`toast toast-${t.tone}`}><I size={16} aria-hidden="true" /><div className="grow"><b>{t.title}</b>{t.body && <span>{t.body}</span>}</div><button type="button" className="toast-x" aria-label={tr("Dismiss")} onClick={() => remove(t.id)}><X size={14} /></button></div>
        })}
      </div>
    </ToastContext.Provider>
  )
}
export const useToast = () => useContext(ToastContext)
