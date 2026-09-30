import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const css = readFileSync(
  new URL('../src/client/orca-link.module.css', import.meta.url),
  'utf8',
)

// DSH 0.1.7-rc.1 mounts the settings panel inside its slot; rc.2 portals it to
// <body>. Every settings selector accepts both mounts through these forms.
const SETTINGS_OVERLAY = ":is([data-slot='sidebar.settings'] > [role='presentation'], :where(body) > [role='presentation'][data-orca-settings-overlay])"
const SETTINGS_DIALOG = ":is([data-slot='sidebar.settings'] [role='dialog'], [role='dialog'][data-shortcut-modal='settings'])"
const escape = (text: string): string => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

describe('ORCA modal style boundaries', () => {
  it('limits settings layout and animation to the settings host', () => {
    const settingsHost = `body[data-dsh-orca-link][data-orca-settings-open] ${SETTINGS_OVERLAY}`
    const unscopedDialogHost = /body\[data-dsh-orca-link\](?:\[[^\n]+\])?\s+(?!\[data-slot='sidebar\.settings'\])\[role='presentation'\]:has\(> \[role='dialog'\]\)/

    expect(css).toContain(settingsHost)
    expect(css).not.toMatch(unscopedDialogHost)
    expect(css).not.toContain(":has([data-slot='sidebar'] [role='dialog'])")
  })

  it('restores the centered desktop layout only through its customization attribute', () => {
    const centeredRule = css.match(
      new RegExp(`data-dsh-whale-orca-settings-layout='centered'[\\s\\S]*?${escape(SETTINGS_OVERLAY)}\\s*\\{([^}]*)\\}`),
    )?.[1] ?? ''
    expect(centeredRule).toContain('justify-content: center')
    expect(centeredRule).toContain('align-items: center')
    expect(css).toContain('transform-origin: center')
  })

  it('keeps every settings layout below the desktop window strip', () => {
    // Windows paints caption buttons over the shell titlebar and macOS keeps
    // its traffic-light band; the web shell has neither.
    expect(css).toMatch(/html\[data-windows-titlebar\] body\[data-dsh-orca-link\]\s*\{[^}]*--orca-window-strip: var\(--dsh-windows-titlebar-height, 40px\)/)
    expect(css).toMatch(/html\[data-platform='darwin'\] body\[data-dsh-orca-link\]\s*\{[^}]*--orca-window-strip: var\(--dsh-frame-top-clearance, 0px\)/)

    const dialog = escape(`${SETTINGS_OVERLAY} > [role='dialog']`)
    const workspace = css.match(
      new RegExp(`@media \\(max-width: 1099px\\), \\(max-height: 680px\\) \\{[\\s\\S]*?${dialog}\\s*\\{([^}]*)\\}`),
    )?.[1] ?? ''
    expect(workspace).toContain('height: calc(100dvh - var(--orca-window-strip, 0px))')
    expect(workspace).toContain('margin-top: var(--orca-window-strip, 0px)')
    expect(workspace).not.toMatch(/height: 100d?vh;/)

    const docked = css.match(
      new RegExp(`@media \\(min-width: 1100px\\) and \\(min-height: 681px\\) \\{[\\s\\S]*?${dialog}\\s*\\{([^}]*)\\}`),
    )?.[1] ?? ''
    expect(docked).toContain('height: min(680px, calc(100vh - 36px - var(--orca-window-strip, 0px)))')

    const centeredHost = css.match(
      new RegExp(`data-dsh-whale-orca-settings-layout='centered'[\\s\\S]*?${escape(SETTINGS_OVERLAY)}\\s*\\{([^}]*)\\}`),
    )?.[1] ?? ''
    expect(centeredHost).toContain('padding: calc(24px + var(--orca-window-strip, 0px)) 24px 24px')
    expect(css).toContain('height: min(760px, calc(100vh - 48px - var(--orca-window-strip, 0px)))')
  })

  it('leaves native modal and portal-menu layering to the host contract', () => {
    expect(css).not.toContain('--orca-z-settings-menu')
    expect(css).not.toMatch(/\[data-orca-settings-open\][^{]*:is\(\[role='menu'\], \[role='listbox'\]\)/)
  })

  it('keeps non-settings animations disabled for reduced-motion users', () => {
    expect(css).toContain("body[data-dsh-orca-link] [data-phase='hero'] [class*='titleGroup'] > span:not([class*='previewBadge'])::after")
    expect(css).toContain("body[data-dsh-orca-link] [data-composer-seat][data-orca-composer-entering]")
    expect(css).not.toContain("[data-orca-settings-open] [data-phase='hero']")
    expect(css).not.toContain("[data-orca-settings-open] [data-composer-seat]")
  })

  it('keeps the settings provider picker out of generic dialogs', () => {
    expect(css).toContain(`${SETTINGS_DIALOG} select`)
    expect(css).not.toContain("body[data-dsh-orca-link] [role='dialog'] select")
  })

  it('releases the tooltip carrier so fixed bubbles clear the conversation header', () => {
    const carrierRule = css.match(
      /\[data-slot='sidebar'\]\s*> :first-child\s*> \[data-orca-tooltip-carrier\]\s*\{([^}]*)\}/s,
    )?.[1] ?? ''
    // The tag must sit on the SAME element as the :is() match (no
    // descendant space) — with a space it releases the root's child and
    // leaves the root context intact.
    const rootRule = css.match(
      /:is\(\[data-slot='sidebar'\]\s*> :first-child\)\[data-orca-tooltip-root\]\s*\{([^}]*)\}/s,
    )?.[1] ?? ''
    expect(carrierRule).not.toBe('')
    expect(carrierRule).toContain('z-index: auto')
    expect(carrierRule).not.toContain('position: static')
    expect(carrierRule).not.toContain('z-index: 1')
    // The sidebar root is isolation: isolate (a stacking context on its own):
    // without releasing it the carrier release alone cannot free the bubble.
    expect(rootRule).not.toBe('')
    expect(rootRule).toContain('z-index: auto')
    expect(rootRule).toContain('isolation: auto')
    expect(css).not.toMatch(/\]\s*> :first-child\)\s+:has\(\[role='tooltip'\]\)/)
  })

  it('centers appearance choices and gives the active theme a provider-style marker', () => {
    expect(css).toContain("[class$='_cubeRow'] > button[class*='_themeCube']")
    expect(css).toContain("button[class*='_themeCube'][aria-pressed='true']::after")
    expect(css).toContain('clip-path: polygon(0 0, 100% 0, 100% 100%, 58% 100%, 58% 42%, 0 42%)')
  })

  it('centers model provider select content and pushes its picker icon to the edge', () => {
    expect(css).toContain("select[class$='_selectInput']")
    expect(css).toContain("select[class$='_selectInput']::picker-icon")
    expect(css).toContain('margin-left: auto')
  })

  it('lifts every settings select into a flex row so bare picker icons center', () => {
    const baseSelectRule = css.match(
      new RegExp(`@supports \\(appearance: base-select\\)\\s*\\{[\\s\\S]*?${escape(SETTINGS_DIALOG)} select\\s*\\{([^}]*)\\}`, 's'),
    )?.[1] ?? ''
    const pickerIconRule = css.match(
      new RegExp(`${escape(SETTINGS_DIALOG)} select::picker-icon\\s*\\{([^}]*)\\}`, 's'),
    )?.[1] ?? ''
    const optionRule = css.match(
      new RegExp(`${escape(SETTINGS_DIALOG)} select option\\s*\\{([^}]*)\\}`, 's'),
    )?.[1] ?? ''
    // Bare selects (customization card, hour/minute pickers) are display:
    // contents-free flex rows; without it ::picker-icon aligns to the text
    // baseline and floats below the label.
    expect(baseSelectRule).toContain('display: flex')
    expect(baseSelectRule).toContain('align-items: center')
    expect(baseSelectRule).toContain('white-space: nowrap')
    expect(pickerIconRule).toContain('flex: none')
    expect(optionRule).toContain('white-space: nowrap')
  })
})
