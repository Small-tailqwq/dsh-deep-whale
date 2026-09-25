// @vitest-environment node
/**
 * Windows desktop caption controls.
 *
 * With `html[data-windows-titlebar]` a collapsed sidebar is zero wide and the
 * host pins its toggle and New Session button into the caption row
 * (DSH 0.1.7-rc.2 ui-sidebar `.collapsed .newSession { position: fixed }`).
 * New Session is a direct child of the sidebar root, so the stage rule that
 * makes every root child `position: relative` pulled it back into the clipped
 * zero-wide column; the wide stage also made its glyph transparent.
 */
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const CSS = readFileSync(new URL('../src/client/orca-link.module.css', import.meta.url), 'utf8')
  .replaceAll('\r\n', '\n')

const ROOT = /html\[data-windows-titlebar\] body\[data-dsh-orca-link\] \[data-sidebar-collapsed\]\s*\[data-slot='sidebar'\] > \[class\*='root'\]\[class\*='collapsed'\]/.source
const NEW_SESSION = `${ROOT} > button\\[class\\*='newSession'\\]`
const TOGGLE = `${ROOT} > \\[class\\*='logoRow'\\] > button\\[class\\*='toggle'\\]`

function block(selector: string): string {
  return CSS.match(new RegExp(`${selector}\\s*\\{([^}]*)\\}`))?.[1] ?? ''
}

describe('ORCA LINK Windows caption controls', () => {
  it('returns New Session to the host fixed caption seat', () => {
    const rule = block(NEW_SESSION)
    expect(rule).toContain('position: fixed')
    expect(rule).toContain('z-index: 30')
    expect(rule).toContain('clip-path: none')
    expect(rule).toContain('color: var(--dsw-alias-label-secondary)')
  })

  it('outranks the stage rule that makes every sidebar-root child relative', () => {
    // The stage rule is `body :is(pane, [data-slot] > :first-child) > :not(...)`;
    // the caption rule carries html, the frame flag and the root's own classes.
    expect(CSS).toMatch(/:is\(\[data-pane='sidebar'\], \[data-slot='sidebar'\] > :first-child\) > :not\(\[role='tooltip'\]/)
    expect(CSS).toContain("html[data-windows-titlebar] body[data-dsh-orca-link] [data-sidebar-collapsed]\n    [data-slot='sidebar'] > [class*='root'][class*='collapsed'] > button[class*='newSession'] {")
  })

  it('drops the wide stage hit plane and its scan line', () => {
    expect(CSS).toMatch(new RegExp(`${NEW_SESSION}::before,\\s*${NEW_SESSION}::after\\s*\\{\\s*content: none;`))
  })

  it('shows both glyphs in every sidebar-size state', () => {
    expect(CSS).toMatch(new RegExp(`${TOGGLE} > svg,\\s*${NEW_SESSION} svg\\s*\\{[^}]*opacity: 1`))
    expect(block(`${NEW_SESSION} > \\*`)).toContain('opacity: 1')
  })
})
