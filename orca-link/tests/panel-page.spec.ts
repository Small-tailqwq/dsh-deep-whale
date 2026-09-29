import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const css = readFileSync(
  new URL('../src/client/orca-link.module.css', import.meta.url),
  'utf8',
).replace(/\r\n/g, '\n')

// The `main` outlet renders the conversation inside the host's own
// `main.conversation` slot, or a keyed panel page as its direct child. That
// split is the one seat test every panel-page rule shares.
// State the client projects from the `main` outlet; every panel-page rule is gated on it, so a
// whole-subtree `*` rule is fast-rejected by the ancestor filter while no panel page is open.
const GATE = 'body[data-dsh-orca-link][data-orca-panel-page]'
const PAGE = "[data-slot='main'] > :not([data-slot='main.conversation'])"
const COLUMN = "[class*='centerCol']"
const escape = (text: string): string => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const block = (selector: string): string =>
  css.match(new RegExp(`${escape(selector)}\\s*\\{([^}]*)\\}`))?.[1] ?? ''

describe('ORCA panel pages', () => {
  it('reads on one frosted sheet hung on the column, in both themes', () => {
    const sheet = block(`${GATE}\n  ${COLUMN}::before`)
    expect(sheet).toContain('background: var(--orca-reading-surface)')
    expect(sheet).toMatch(/backdrop-filter: blur\(\d+px\)/)
    expect(sheet).toContain('pointer-events: none')
    expect(block(`${GATE}\n  ${COLUMN}`)).toContain('position: relative')
    expect(css).toMatch(/--orca-reading-surface: rgba\(251, 247, 239, [\d.]+\);/)
    expect(css).toMatch(/\[data-ds-dark-theme\] \{[\s\S]*?--orca-reading-surface: rgba\(14, 20, 30, [\d.]+\);/)
  })

  it('keeps the filter off the page root and lifts it above the sheet', () => {
    const root = block(`${GATE} ${PAGE}`)
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
      expect(rule).toContain(`${GATE} ${selector}`)
    }
  })

  it('does not scan the transcript to tell a panel page from the conversation', () => {
    expect(css).not.toMatch(/:not\(:has\(\[data-phase\]\)\)/)
    expect(css).not.toContain(":has(> [data-slot='main'] >")
  })

  it('gates every whole-subtree rule on state that exists only while it applies', () => {
    // A rule whose rightmost compound is `*` is evaluated on every element in the
    // document; Chromium's ancestor filter rejects it in one step only when an
    // ancestor compound names an attribute that is absent. Measured over six
    // right-panel toggles on a 4000-row page: 155ms ungated, 6.6ms gated.
    const ungated = css.match(
      /^body\[data-dsh-orca-link\](?!\[data-orca-panel-page\])\s+\[data-slot='main'\] > :not\(\[data-slot='main\.conversation'\]\) \*/m,
    )
    expect(ungated).toBeNull()
    const settings = css.match(/^body\[data-dsh-orca-link\](\[[^\]]+\])? :is\(\[data-slot='sidebar\.settings'\] \[role='dialog'\], \[role='dialog'\]\[data-shortcut-modal='settings'\]\) \*/gm) ?? []
    expect(settings.length).toBeGreaterThanOrEqual(3)
    for (const selector of settings) expect(selector).toContain('[data-orca-settings-open]')
  })

  it('styles ::selection on the body so it inherits, not on every element', () => {
    expect(css).toContain('body[data-dsh-orca-link]::selection {')
    expect(css).not.toContain('body[data-dsh-orca-link] ::selection')
  })

  it('leaves the plugin manager without an opaque floor of its own', () => {
    const manager = block("body[data-dsh-orca-link] [data-plugin-panel]")
    expect(manager).toContain('color: var(--orca-ink)')
    expect(manager).not.toContain('background')
  })

  it('keeps disabled controls readable on the sheet', () => {
    const disabled = block(`${GATE}\n  ${PAGE}\n  :where(button, [role='button']):disabled`)
    expect(disabled).toContain('opacity: 0.55')
  })
})

describe('ORCA right panel', () => {
  const RIGHT = 'body[data-dsh-orca-link] [data-sidebar-right-panel]'
  const DOCK = ":is([data-dockkit-host='dock'], [data-dockkit-empty])"
  const NOT_FULLSCREEN = ":not([data-sidebar-right-panel='fullscreen'])"

  it('paints no floor on the panel box, which the host leaves untransformed', () => {
    const box = block(RIGHT)
    expect(box).toContain('color: var(--orca-ink)')
    expect(box).not.toContain('background')
    // The old rule that painted the box while it was open must be gone.
    expect(css).not.toContain('[data-sidebar-right-panel][data-sidebar-right-open]')
  })

  it('hangs the frosted sheet on the sliding docked items so it travels with them', () => {
    const sheet = block(`${RIGHT}${NOT_FULLSCREEN}\n  ${DOCK}`)
    expect(sheet).toContain('background: var(--orca-reading-surface)')
    expect(sheet).toMatch(/backdrop-filter: blur\(\d+px\)/)
    expect(sheet).toContain('border-radius: 0 !important')
  })

  it('slides the panel without a per-frame backdrop blur and eases the blur in once settled', () => {
    const settled = block(`${RIGHT}${NOT_FULLSCREEN}
  ${DOCK}`)
    expect(settled).toContain('transition: backdrop-filter 120ms ease-out')
    const sliding = block(`body[data-dsh-orca-link] [data-animating] [data-sidebar-right-panel]${NOT_FULLSCREEN}
  ${DOCK}`)
    expect(sliding).toContain('backdrop-filter: none')
    expect(sliding).toContain('transition: none')
  })

  it('keeps an opaque floor for fullscreen and floating panels', () => {
    const solid = block(
      `body[data-dsh-orca-link] [data-sidebar-right-panel='fullscreen']\n  ${DOCK},\n${RIGHT} [data-dockkit-float]`,
    )
    expect(solid).toContain('background: var(--dsw-input-solid)')
  })

  it('tints the tab strip over whatever floor is behind it instead of painting its own', () => {
    const strip = block(`${RIGHT} [data-dockkit-strip],\n${RIGHT} [data-dockkit-float-grip]`)
    expect(strip).toContain('color-mix(in srgb, var(--orca-blue) 5%, transparent)')
  })
})
