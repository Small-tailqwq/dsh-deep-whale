import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const css = readFileSync(
  new URL('../src/client/orca-link.module.css', import.meta.url),
  'utf8',
)

describe('ORCA modal style boundaries', () => {
  it('limits settings layout and animation to the settings host', () => {
    const settingsHost = "body[data-dsh-orca-link][data-orca-settings-open] [data-slot='sidebar.settings'] > [role='presentation']"
    const unscopedDialogHost = /body\[data-dsh-orca-link\](?:\[[^\n]+\])?\s+(?!\[data-slot='sidebar\.settings'\])\[role='presentation'\]:has\(> \[role='dialog'\]\)/

    expect(css).toContain(settingsHost)
    expect(css).not.toMatch(unscopedDialogHost)
    expect(css).not.toContain(":has([data-slot='sidebar'] [role='dialog'])")
  })

  it('restores the centered desktop layout only through its customization attribute', () => {
    const centeredRule = css.match(
      /data-dsh-whale-orca-settings-layout='centered'[\s\S]*?\[role='presentation'\]\s*\{([^}]*)\}/,
    )?.[1] ?? ''
    expect(centeredRule).toContain('justify-content: center')
    expect(centeredRule).toContain('align-items: center')
    expect(css).toContain('transform-origin: center')
  })

  it('leaves native modal and portal-menu layering to the host contract', () => {
    expect(css).not.toContain('--orca-z-settings-menu')
    expect(css).not.toMatch(/\[data-orca-settings-open\][^{]*:is\(\[role='menu'\], \[role='listbox'\]\)/)
  })

  it('keeps non-settings animations disabled for reduced-motion users', () => {
    expect(css).toContain("body[data-dsh-orca-link] [data-phase='hero'] [class*='headlineText']::after")
    expect(css).toContain("body[data-dsh-orca-link] [data-composer-seat][data-orca-composer-entering]")
    expect(css).not.toContain("[data-orca-settings-open] [data-phase='hero']")
    expect(css).not.toContain("[data-orca-settings-open] [data-composer-seat]")
  })

  it('keeps the settings provider picker out of generic dialogs', () => {
    expect(css).toContain("[data-slot='sidebar.settings'] [role='dialog'] select")
    expect(css).not.toContain("body[data-dsh-orca-link] [role='dialog'] select")
  })

  it('releases the tooltip carrier so fixed bubbles clear the conversation header', () => {
    const carrierRule = css.match(
      /\[data-slot='sidebar'\]\s*> :first-child\s*> :has\(\[role='tooltip'\]\)\s*\{([^}]*)\}/s,
    )?.[1] ?? ''
    // The :has() must sit on the SAME element as the :is() match (no
    // descendant space) — with a space it releases the root's child and
    // leaves the root context intact.
    const rootRule = css.match(
      /:is\(\[data-pane='sidebar'\], \[data-slot='sidebar'\]\s*> :first-child\):has\(\[role='tooltip'\]\)\s*\{([^}]*)\}/s,
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
      /@supports \(appearance: base-select\)\s*\{[\s\S]*?\[data-slot='sidebar\.settings'\] \[role='dialog'\] select\s*\{([^}]*)\}/s,
    )?.[1] ?? ''
    const pickerIconRule = css.match(
      /\[data-slot='sidebar\.settings'\] \[role='dialog'\] select::picker-icon\s*\{([^}]*)\}/s,
    )?.[1] ?? ''
    const optionRule = css.match(
      /\[data-slot='sidebar\.settings'\] \[role='dialog'\] select option\s*\{([^}]*)\}/s,
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
