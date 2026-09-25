/**
 * Test double for the host's ui-primitives platform module, reproducing the
 * markup of DSH 0.1.7-rc.2 `Switch` and `Button` (the real package is supplied
 * by the shell at runtime and drags in the whole markdown/highlighter stack).
 */
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'

export function Switch({ checked, onChange, label, disabled = false, title, className }: {
  checked: boolean
  onChange(checked: boolean): void
  label: string
  disabled?: boolean
  title?: string
  className?: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      title={title}
      disabled={disabled}
      className={['primitives_switch', className].filter(Boolean).join(' ')}
      onClick={() => onChange(!checked)}
    >
      <span className="primitives_thumb" />
    </button>
  )
}

export const Button = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: string
  size?: string
  icon?: ReactNode
}>(function Button({ variant = 'ghost', size = 'md', icon, className, children, ...rest }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      className={['primitives_button', `primitives_${variant}`, `primitives_${size}`, className].filter(Boolean).join(' ')}
      {...rest}
    >
      {icon != null && <span className="primitives_icon">{icon}</span>}
      {children}
    </button>
  )
})
