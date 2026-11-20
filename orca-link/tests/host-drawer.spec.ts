// @vitest-environment node
/**
 * Host drawer presentation (dsh-deep-whale#247).
 *
 * Below `SIDEBAR_DRAWER_BREAKPOINT` (768px, web and macOS) DSH 0.2.2 floats the
 * sidebar column over the conversation as its own drawer, and the sidebar root
 * gains `role="dialog"` + `aria-modal`. ORCA keeps the host's drawer geometry
 * and opener, matching Maid Atelier's contract.
 */
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const css = readFileSync(new URL('../src/client/orca-link.module.css', import.meta.url), 'utf8')
  .replace(/\r\n/g, '\n')

const escape = (text: string): string => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const block = (selector: string): string =>
  css.match(new RegExp(`${escape(selector)}\\s*\\{([^}]*)\\}`))?.[1] ?? ''

describe('ORCA host drawer', () => {
  it('keeps the sidebar tokens on the drawer root instead of the dialog surface', () => {
    expect(block("body[data-dsh-orca-link] :is(dialog, [role='dialog']:not([data-slot='sidebar'] > *), [role='alertdialog'])"))
      .toContain('--dsw-alias-bg-base: var(--orca-surface-strong)')
    expect(block("body[data-dsh-orca-link] [role='dialog']:not([data-slot='sidebar'] > *)")).toContain('--orca-dialog-bg: #fbf7ef')
    expect(block("body[data-dsh-orca-link][data-ds-dark-theme] [role='dialog']:not([data-slot='sidebar'] > *)")).toContain('--orca-dialog-bg: #0f151f')
    expect(css).not.toMatch(/^body\[data-dsh-orca-link\](?:\[data-ds-dark-theme\])? \[role='dialog'\] \{/m)
  })

  it('gives the floating drawer an opaque surface over the transcript', () => {
    expect(block("body[data-dsh-orca-link] div[class*='frame'][data-sidebar-drawer] > [class*='sidebarCol']"))
      .toContain('background-color: var(--dsw-input-solid)')
    expect(css).toMatch(/--dsw-input-solid: #fbf7ef !important;/)
    expect(css).toMatch(/--dsw-input-solid: #0e141e !important;/)
  })
})
