import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const css = readFileSync(
  new URL('../src/client/orca-link.module.css', import.meta.url),
  'utf8',
).replace(/\r\n/g, '\n')

// The `main` outlet renders the conversation inside the host's own
// `main.conversation` slot, or a keyed panel page as its direct child. That
// split is the one seat test every panel-page rule shares.
const PAGE = "[data-slot='main'] > :not([data-slot='main.conversation'])"
const COLUMN = `[class*='centerCol']:has(> [data-slot='main'] > :not([data-slot='main.conversation']))`
const escape = (text: string): string => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const block = (selector: string): string =>
  css.match(new RegExp(`${escape(selector)}\\s*\\{([^}]*)\\}`))?.[1] ?? ''

describe('ORCA panel pages', () => {
  it('reads on one frosted sheet hung on the column, in both themes', () => {
    const sheet = block(`body[data-dsh-orca-link]\n  ${COLUMN}::before`)
    expect(sheet).toContain('background: var(--orca-reading-surface)')
    expect(sheet).toMatch(/backdrop-filter: blur\(\d+px\)/)
    expect(sheet).toContain('pointer-events: none')
    expect(block(`body[data-dsh-orca-link]\n  ${COLUMN}`)).toContain('position: relative')
    expect(css).toMatch(/--orca-reading-surface: rgba\(251, 247, 239, [\d.]+\);/)
    expect(css).toMatch(/\[data-ds-dark-theme\] \{[\s\S]*?--orca-reading-surface: rgba\(14, 20, 30, [\d.]+\);/)
  })

  it('keeps the filter off the page root and lifts it above the sheet', () => {
    const root = block(`body[data-dsh-orca-link] ${PAGE}`)
    expect(root).toContain('position: relative')
    expect(root).toContain('z-index: 2')
    expect(root).toContain('--dsw-alias-bg-base: var(--orca-surface)')
    expect(root).not.toContain('backdrop-filter')
  })

  it('squares the whole page subtree, whatever plugin draws it', () => {
    const rule = css.match(
      new RegExp(`(body\\[data-dsh-orca-link\\] \\[data-tone\\],[\\s\\S]*?)\\{\\s*border-radius: 0 !important;`),
    )?.[1] ?? ''
    for (const selector of [PAGE, `${PAGE} *`, `${PAGE} *::before`, `${PAGE} *::after`]) {
      expect(rule).toContain(`body[data-dsh-orca-link] ${selector}`)
    }
  })

  it('does not scan the transcript to tell a panel page from the conversation', () => {
    expect(css).not.toMatch(/:not\(:has\(\[data-phase\]\)\)/)
  })

  it('leaves the plugin manager without an opaque floor of its own', () => {
    const manager = block("body[data-dsh-orca-link] [data-plugin-panel]")
    expect(manager).toContain('color: var(--orca-ink)')
    expect(manager).not.toContain('background')
  })

  it('keeps disabled controls readable on the sheet', () => {
    const disabled = block(`body[data-dsh-orca-link]\n  ${PAGE}\n  :where(button, [role='button']):disabled`)
    expect(disabled).toContain('opacity: 0.55')
  })
})
