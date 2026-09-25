// @vitest-environment node
/**
 * Windows desktop caption controls.
 *
 * With `html[data-windows-titlebar]` a collapsed sidebar is zero wide and the
 * host pins its toggle and New Session button into the caption row as two 28px
 * icons (DSH 0.1.7-rc.2 ui-sidebar `.collapsed .toggle` / `.collapsed
 * .newSession`). The skin's sidebar-size flag keeps its last non-zero value
 * there, so the caption treatment must key on the host's collapse state, not
 * on `data-maid-sidebar-size`.
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const CSS = readFileSync(resolve(process.cwd(), 'src/client/maid-atelier.module.css'), 'utf8')
  .replaceAll('\r\n', '\n')

const SCOPE = /html\[data-windows-titlebar\] body\[data-dsh-maid-atelier\] \[data-sidebar-collapsed\]\s*:is\(\[data-pane='sidebar'\], \[class\*='sidebarCol'\]\) \[class\*='root'\]\[class\*='collapsed'\]\s*:is\(\[class\*='logoRow'\] button\[class\*='toggle'\], button\[class\*='newSession'\]\)/.source

function block(suffix: string): string {
  return CSS.match(new RegExp(`${SCOPE}${suffix}\\s*\\{([^}]*)\\}`))?.[1] ?? ''
}

describe('Maid Atelier Windows caption controls', () => {
  it('resets the ribbon and medallion faces to one 28px caption icon', () => {
    const rule = block('')
    expect(rule).not.toBe('')
    for (const declaration of [
      'width: 28px', 'height: 28px', 'min-height: 28px', 'margin: 0', 'padding: 0',
      'border: 0', 'border-image: none', 'border-radius: 50%', 'background: transparent',
      'filter: none', 'transform: none', 'color: var(--dsw-alias-label-secondary)',
    ]) expect(rule).toContain(declaration)
  })

  it('lets the glyph follow the button instead of the ribbon navy', () => {
    expect(block(' svg')).toContain('color: inherit')
  })

  it('keeps hover a round wash of the caption icon, not a lifted ribbon', () => {
    const hover = block(':is\\(:hover, :focus-visible\\)')
    expect(hover).toContain('background: rgba(255, 252, 243, 0.12)')
    expect(hover).toContain('transform: none')
  })

  it('does not key the caption treatment on the stale sidebar-size flag', () => {
    expect(CSS).not.toMatch(/data-windows-titlebar\][^{]*data-maid-sidebar-size/)
  })
})
