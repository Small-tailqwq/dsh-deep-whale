// @vitest-environment node
/**
 * Host drawer presentation (dsh-deep-whale#247).
 *
 * Below `SIDEBAR_DRAWER_BREAKPOINT` (768px, web and macOS) DSH 0.2.2 runs the
 * sidebar column as its own drawer: the frame carries `data-sidebar-drawer`,
 * the collapsed column is `visibility: hidden` and `inert`, the sidebar root
 * gains `role="dialog"` + `aria-modal`, and the only way back in is the opener
 * in the frame's `shell.leading` seat.
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const CSS = readFileSync(resolve(process.cwd(), 'src/client/maid-atelier.module.css'), 'utf8')
  .replaceAll('\r\n', '\n')

function declarations(selector: string): string {
  const start = CSS.indexOf(`${selector} {`)
  if (start < 0) return ''
  const open = CSS.indexOf('{', start)
  return CSS.slice(open + 1, CSS.indexOf('}', open))
}

describe('Maid Atelier host drawer', () => {
  it('keeps the navy chrome palette on the drawer root instead of treating it as an overlay', () => {
    const overlayLists = CSS.match(/:is\(dialog, \[role='dialog'\][^,]*,/g) ?? []
    expect(overlayLists.length).toBeGreaterThanOrEqual(4)
    for (const list of overlayLists) {
      expect(list).toContain("[role='dialog']:not([data-maid-sidebar-root])")
    }
    const exclusions = CSS.match(/\[data-slot='sidebar'\] \[class\*='(?:sectionHeader|searchInput)'\]:not\(:where\(.*$/gm) ?? []
    expect(exclusions.length).toBeGreaterThanOrEqual(7)
    for (const exclusion of exclusions) {
      expect(exclusion).toContain("[role='dialog']:not([data-maid-sidebar-root]) *")
    }
    // No parallel ink rebind for the drawer: the chrome palette already covers it.
    expect(CSS).not.toMatch(/\[data-maid-sidebar-footer\]:not\(\s*:has\(/)
  })

  it('drops the dead collapsed column only while the host runs its drawer', () => {
    const rule = declarations("  body[data-dsh-maid-atelier]\n    div[class*='frame'][data-sidebar-drawer][data-sidebar-collapsed]\n    [class*='sidebarCol']")
    expect(rule).toContain('display: none !important')
    expect(CSS).not.toMatch(/div\[data-sidebar-collapsed\]\s*\[class\*='sidebarCol'\] \{\s*display: none/)
  })

  it('dresses only the web drawer opener and publishes its clearance', () => {
    const frame = declarations("html:not([data-platform]) body[data-dsh-maid-atelier]\n  [id='root'] > div[data-slot='root'] > div[class*='frame'][data-sidebar-drawer]")
    expect(frame).toContain('--dsh-frame-leading-clearance: 64px')
    const opener = declarations("html:not([data-platform]) body[data-dsh-maid-atelier]\n  div[class*='frame'][data-sidebar-drawer] [data-shell-leading] button")
    expect(opener).toMatch(/width: 44px;\s*height: 44px;/)
    // Desktop seats (macOS traffic-light row) keep the native opener untouched.
    expect(CSS).not.toContain('data-sidebar-opener')
  })

  it('leaves the session list scroll handoff to the host', () => {
    expect(CSS).not.toMatch(/\[class\*='listArea'\][^{]*\{[^}]*overflow-y: auto/)
  })
})
