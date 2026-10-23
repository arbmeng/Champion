import { forwardRef, useId, useRef } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { AlertTriangle, RotateCcw, Search as SearchIcon, X } from 'lucide-react'

export const cx = (...parts) => parts.filter(Boolean).join(' ')

/* ---------- Button ---------- */
export const Button = forwardRef(function Button({ variant = 'secondary', size = 'md', block, icon: Icon, iconRight: IconR, to, href, className, children, type = 'button', ...rest }, ref) {
  const cls = cx('btn', `btn-${variant}`, `btn-${size}`, block && 'btn-block', className)
  const inner = <>{Icon && <Icon size={size === 'sm' ? 15 : 18} aria-hidden="true" />}{children && <span>{children}</span>}{IconR && <IconR size={size === 'sm' ? 15 : 18} aria-hidden="true" />}</>
  if (to) return <Link ref={ref} to={to} className={cls} {...rest}>{inner}</Link>
  if (href) return <a ref={ref} href={href} className={cls} {...rest}>{inner}</a>
  return <button ref={ref} type={type} className={cls} {...rest}>{inner}</button>
})

export const IconButton = forwardRef(function IconButton({ label, icon: Icon, size = 'md', active, badge, to, className, ...rest }, ref) {
  const cls = cx('icon-btn', `icon-btn-${size}`, active && 'is-active', className)
  const inner = <><Icon size={size === 'sm' ? 16 : 19} aria-hidden="true" />{badge ? <span className="icon-btn-badge" aria-hidden="true">{badge > 9 ? '9+' : badge}</span> : null}</>
  if (to) return <Link ref={ref} to={to} className={cls} aria-label={label} title={label} {...rest}>{inner}</Link>
  return <button ref={ref} type="button" className={cls} aria-label={label} title={label} {...rest}>{inner}</button>
})

/* ---------- Surfaces ---------- */
export function Card({ as: Tag = 'div', pad = true, interactive, tone, className, children, ...rest }) {
  return <Tag className={cx('card', pad && 'card-pad', interactive && 'card-interactive', tone && `card-${tone}`, className)} {...rest}>{children}</Tag>
}

export function Badge({ tone = 'neutral', icon: Icon, children, className }) {
  return <span className={cx('badge', `badge-${tone}`, className)}>{Icon && <Icon size={12} aria-hidden="true" />}{children}</span>
}

export function Avatar({ name = '?', hue = 18, size = 40, className }) {
  const initials = name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
  return <span className={cx('avatar', className)} style={{ width: size, height: size, fontSize: size * 0.38, background: `linear-gradient(145deg, hsl(${hue} 55% 42%), hsl(${(hue + 30) % 360} 45% 26%))` }} aria-hidden="true">{initials}</span>
}

/* ---------- Progress ---------- */
export function ProgressBar({ value = 0, tone = 'accent', label, height = 8, className }) {
  const v = Math.max(0, Math.min(100, value))
  return (
    <div className={cx('pbar', `pbar-${tone}`, className)} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(v)} aria-label={label} style={{ height }}>
      <span style={{ width: `${v}%` }} />
    </div>
  )
}

export function ProgressRing({ value = 0, size = 96, stroke = 8, tone = 'accent', label, children }) {
  const v = Math.max(0, Math.min(100, value))
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  return (
    <div className="ring" style={{ width: size, height: size }} role="img" aria-label={label || `${Math.round(v)} percent`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-3)" strokeWidth={stroke} />
        <circle className={`ring-${tone}`} cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c - (c * v) / 100} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      </svg>
      <div className="ring-center">{children}</div>
    </div>
  )
}

/* ---------- Navigation controls ---------- */
export function Tabs({ items, value, onChange, label, className }) {
  const refs = useRef([])
  const onKey = (e, i) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
    e.preventDefault()
    const next = (i + (e.key === 'ArrowRight' ? 1 : items.length - 1)) % items.length
    refs.current[next]?.focus()
    onChange(items[next].id)
  }
  return (
    <div className={cx('tabs', className)} role="tablist" aria-label={label}>
      {items.map((t, i) => (
        <button key={t.id} ref={(el) => { refs.current[i] = el }} role="tab" type="button" aria-selected={value === t.id} tabIndex={value === t.id ? 0 : -1} className={cx('tab', value === t.id && 'is-active')} onClick={() => onChange(t.id)} onKeyDown={(e) => onKey(e, i)}>
          {t.label}{t.count != null && <span className="tab-count">{t.count}</span>}
        </button>
      ))}
    </div>
  )
}

export function SegmentedControl({ items, value, onChange, label, size = 'md', className }) {
  return (
    <div className={cx('seg', `seg-${size}`, className)} role="radiogroup" aria-label={label}>
      {items.map((t) => (
        <button key={t.id} type="button" role="radio" aria-checked={value === t.id} className={cx('seg-item', value === t.id && 'is-active')} onClick={() => onChange(t.id)}>{t.label}</button>
      ))}
    </div>
  )
}

export function SectionTabs({ items, className }) {
  return (
    <nav className={cx('tabs section-tabs', className)} aria-label="Section">
      {items.map((t) => <NavLink key={t.to} to={t.to} end={t.end} className={({ isActive }) => cx('tab', isActive && 'is-active')}>{t.label}</NavLink>)}
    </nav>
  )
}

export function FilterChips({ options, value, onChange, all = 'All', label }) {
  return (
    <div className="chips" role="group" aria-label={label}>
      <button type="button" className={cx('chip', !value && 'is-active')} aria-pressed={!value} onClick={() => onChange(null)}>{all}</button>
      {options.map((o) => <button key={o} type="button" className={cx('chip', value === o && 'is-active')} aria-pressed={value === o} onClick={() => onChange(value === o ? null : o)}>{o}</button>)}
    </div>
  )
}

/* ---------- Inputs ---------- */
export const Input = forwardRef(function Input({ label, hint, error, className, ...rest }, ref) {
  const id = useId()
  return (
    <div className={cx('field', className)}>
      {label && <label htmlFor={id} className="field-label">{label}</label>}
      <input ref={ref} id={id} className="input" aria-invalid={error ? true : undefined} aria-describedby={hint || error ? `${id}-d` : undefined} {...rest} />
      {(hint || error) && <p id={`${id}-d`} className={cx('field-hint', error && 'is-error')}>{error || hint}</p>}
    </div>
  )
})

export function Select({ label, options, value, onChange, className, ...rest }) {
  const id = useId()
  return (
    <div className={cx('field', className)}>
      {label && <label htmlFor={id} className="field-label">{label}</label>}
      <select id={id} className="input select" value={value} onChange={(e) => onChange(e.target.value)} {...rest}>
        {options.map((o) => { const v = typeof o === 'string' ? o : o.value; const l = typeof o === 'string' ? o : o.label; return <option key={v} value={v}>{l}</option> })}
      </select>
    </div>
  )
}

export function SearchField({ value, onChange, placeholder = 'Search', onSubmit, className, autoFocus }) {
  return (
    <form className={cx('search', className)} role="search" onSubmit={(e) => { e.preventDefault(); onSubmit?.(value) }}>
      <SearchIcon size={18} aria-hidden="true" />
      <input data-search type="search" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={placeholder} autoFocus={autoFocus} enterKeyHint="search" />
      {value ? <button type="button" className="search-clear" aria-label="Clear search" onClick={() => onChange('')}><X size={16} /></button> : <kbd className="kbd hide-mobile" aria-hidden="true">/</kbd>}
    </form>
  )
}

export function Toggle({ checked, onChange, label, description }) {
  return (
    <label className="toggle-row">
      <span className="grow"><span className="toggle-label">{label}</span>{description && <span className="caption toggle-desc">{description}</span>}</span>
      <input type="checkbox" role="switch" className="toggle" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  )
}

/* ---------- Feedback & states ---------- */
export function Skeleton({ h = 16, w = '100%', r = 8, className }) {
  return <span className={cx('skeleton', className)} style={{ height: h, width: w, borderRadius: r }} aria-hidden="true" />
}

export function EmptyState({ icon: Icon, title, body, action, compact }) {
  return (
    <div className={cx('empty', compact && 'empty-compact')}>
      {Icon && <span className="empty-icon"><Icon size={22} aria-hidden="true" /></span>}
      <h3>{title}</h3>
      {body && <p className="muted">{body}</p>}
      {action}
    </div>
  )
}

export function ErrorState({ title = 'Something went wrong', body = 'We could not load this view. Your data is safe on this device.', onRetry }) {
  return (
    <div className="empty empty-error" role="alert">
      <span className="empty-icon is-danger"><AlertTriangle size={22} aria-hidden="true" /></span>
      <h3>{title}</h3>
      <p className="muted">{body}</p>
      {onRetry && <Button icon={RotateCcw} onClick={onRetry}>Try again</Button>}
    </div>
  )
}

export function PageHeader({ eyebrow, title, subtitle, actions, back }) {
  return (
    <header className="page-header">
      <div className="grow">
        {back}
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        {subtitle && <p className="muted page-sub">{subtitle}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </header>
  )
}

export function Section({ title, eyebrow, action, children, className }) {
  return (
    <section className={cx('section', className)}>
      {(title || action) && (
        <div className="section-head">
          <div>{eyebrow && <div className="eyebrow">{eyebrow}</div>}{title && <h2 className="section-title">{title}</h2>}</div>
          {action}
        </div>
      )}
      {children}
    </section>
  )
}

export function BackLink({ to, children }) {
  return <Link to={to} className="back-link">← {children}</Link>
}
