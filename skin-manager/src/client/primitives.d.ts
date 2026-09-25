/**
 * The slice of the host's ui-primitives this panel renders. The module is a
 * platform module: the shell supplies the running host's own instance at load
 * time and the client bundle keeps it external, so nothing is installed here.
 */
declare module '@deepseek-ai/dsh-client-ui-primitives' {
  import type { ButtonHTMLAttributes, ForwardRefExoticComponent, ReactNode, RefAttributes } from 'react'

  export function Switch(props: {
    checked: boolean
    onChange(checked: boolean): void
    label: string
    disabled?: boolean
    title?: string
    className?: string
  }): ReactNode

  export const Button: ForwardRefExoticComponent<
    ButtonHTMLAttributes<HTMLButtonElement> & {
      variant?: 'ghost' | 'primary' | 'outline' | 'toolbar'
      size?: 'md' | 'sm'
      icon?: ReactNode
    } & RefAttributes<HTMLButtonElement>
  >
}
