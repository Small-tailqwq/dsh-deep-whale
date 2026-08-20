// @vitest-environment node
/**
 * ORCA LINK cordis panel stacking contract.
 *
 * The cordis plugin panel (host package dsh-client-ui-cordis) is a fixed
 * popover mounted inside the sidebar footer slot. The skin's sidebar layering
 * block wraps the footer in a stacking context (`position: relative;
 * z-index: 1`) and isolates the content root, so the panel's overflow over
 * the center column paints and hit-tests below the column — clicks on that
 * region fall through to the blank conversation surface. These specs pin the
 * release rules so they cannot silently regress, mirroring the settings
 * overlay contract in settings-stacking.spec.ts.
 *
 * Rule blocks are matched with `\s*` between selector parts so the specs hold
 * under both LF and CRLF checkouts, and every block is asserted non-empty — an
 * empty block would satisfy every `not.toContain` silently.
 */
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const CSS = readFileSync(new URL('../src/client/orca-link.module.css', import.meta.url), 'utf8')
const OVERLAY_SOURCE = readFileSync(new URL('../src/client/settings-overlay.ts', import.meta.url), 'utf8')

/** The declaration block of the first rule whose selector matches. */
function block(pattern: RegExp): string {
  return CSS.match(pattern)?.[1] ?? ''
}

/** The cordis-panel release rules, keyed on the body state maintained by JS. */
const CORDIS_SIDEBAR_RULE = block(
  /\[data-orca-cordis-panel-open\]\s*:is\(\[data-pane='sidebar'\],\s*\[data-slot='sidebar'\]\s*>\s*:first-child\)\s*\{([^}]*)\}/,
)
const CORDIS_CARRIER_RULE = block(
  /\[data-orca-cordis-panel-open\]\s*\[data-slot='sidebar'\]\s*>\s*:first-child\s*>\s*:has\(\[data-cordis-panel\]\)\s*\{([^}]*)\}/,
)
const CORDIS_PANEL_RULE = block(
  /\[data-orca-cordis-panel-open\]\s*\[data-cordis-panel\]\s*\{([^}]*)\}/,
)
const CORDIS_ROOT_RULE = block(
  /\[data-orca-cordis-panel-open\]\s*\[id='root'\]\s*\{([^}]*)\}/,
)

/** Always-on sidebar layering the release rules have to neutralise. */
const SIDEBAR_BASE_RULE = block(
  /body\[data-dsh-orca-link\]\s*:is\(\[data-pane='sidebar'\],\s*\[data-slot='sidebar'\]\s*>\s*:first-child\)\s*\{([^}]*)\}/,
)
const SIDEBAR_CHILDREN_RULE = block(
  /body\[data-dsh-orca-link\]\s*:is\(\[data-pane='sidebar'\],\s*\[data-slot='sidebar'\]\s*>\s*:first-child\)\s*>\s*:not\(\[role='tooltip'\]\)\s*\{([^}]*)\}/,
)

describe('ORCA LINK cordis panel stacking', () => {
  it('parses every rule this contract depends on', () => {
    for (const rule of [
      CORDIS_SIDEBAR_RULE, CORDIS_CARRIER_RULE,
      CORDIS_PANEL_RULE, CORDIS_ROOT_RULE, SIDEBAR_BASE_RULE, SIDEBAR_CHILDREN_RULE,
    ]) expect(rule).not.toBe('')
  })

  it('keeps the always-on sidebar layering that makes the release necessary', () => {
    expect(SIDEBAR_BASE_RULE).toContain('isolation: isolate')
    expect(SIDEBAR_BASE_RULE).toContain('position: relative')
    expect(SIDEBAR_CHILDREN_RULE).toContain('position: relative')
    expect(SIDEBAR_CHILDREN_RULE).toContain('z-index: 1')
  })

  it('retires the sidebar stacking contexts while the cordis panel is open', () => {
    expect(CORDIS_SIDEBAR_RULE).toContain('z-index: auto')
    expect(CORDIS_SIDEBAR_RULE).toContain('isolation: auto')
    expect(CORDIS_CARRIER_RULE).toContain('z-index: auto')
    expect(CORDIS_CARRIER_RULE).toContain('position: relative')
  })

  it('never drops those ancestors to position: static', () => {
    expect(CORDIS_CARRIER_RULE).toContain('position: relative')
    expect(CORDIS_CARRIER_RULE).not.toContain('position: static')
    expect(CORDIS_SIDEBAR_RULE).not.toContain('position: static')
  })

  it('places the panel above skin chrome and below the official modal ceiling', () => {
    const z = Object.fromEntries(
      [...CSS.matchAll(/--orca-z-([\w-]+):\s*(\d+)/g)].map(match => [match[1], Number(match[2])]),
    )
    expect(CORDIS_PANEL_RULE).toContain('z-index: var(--orca-z-cordis)')
    expect(CORDIS_ROOT_RULE).toContain('z-index: var(--orca-z-cordis) !important')
    expect(z.cordis).toBeGreaterThan(z.ghost)
    expect(z.cordis).toBeGreaterThan(z.seam)
    expect(z.cordis).toBeLessThan(z.settings)
    expect(z.cordis).toBeLessThan(1000)
  })

  it('keys the release on the host panel attribute under the footer slot', () => {
    // JS owns the expensive structural lookup and mirrors it to a cheap body
    // attribute consumed by the CSS release rules.
    expect(OVERLAY_SOURCE).toContain("[data-slot='sidebar.footer.action'] [data-cordis-panel]")
    expect(OVERLAY_SOURCE).toContain('data-orca-cordis-panel-open')
    expect(CSS).toContain('body[data-dsh-orca-link][data-orca-cordis-panel-open]')
  })
})
