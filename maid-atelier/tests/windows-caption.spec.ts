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
      'border: 0', 'border-image: none', 'border-radius: var(--maid-caption-control-radius)', 'background: transparent',
      'filter: none', 'transform: none', 'color: var(--dsw-alias-label-secondary)',
    ]) expect(rule).toContain(declaration)
  })

  it('lets the glyph follow the button instead of the ribbon navy', () => {
    expect(block(' svg')).toContain('color: inherit')
  })

  it('keeps hover a flat caption wash, not a lifted ribbon', () => {
    const hover = block(':is\\(:hover, :focus-visible\\)')
    expect(hover).toContain('background: var(--maid-caption-hover)')
    expect(hover).toContain('transform: none')
  })

  it('shares one corner and palette with the desktop menubar', () => {
    const tokens = CSS.match(/html\[data-windows-titlebar\] body\[data-dsh-maid-atelier\]\s*\{([^}]*)\}/)?.[1] ?? ''
    // The shell menubar's buttons are 6px rounded inside its shadow root.
    expect(tokens).toContain('--maid-caption-control-radius: 6px')
    expect(tokens).toContain('--maid-caption-hover: rgba(255, 252, 243, 0.12)')
    const menu = CSS.match(/body\[data-dsh-maid-atelier\] > \[data-windows-menu\]\s*\{([^}]*)\}/)?.[1] ?? ''
    // Resting ink, hover ink and hover wash are inherited tokens in the shadow
    // root; the body-level porcelain palette made hovered labels navy on navy.
    expect(menu).toContain('--dsw-alias-label-secondary: var(--maid-caption-ink)')
    expect(menu).toContain('--dsw-alias-label-primary: var(--maid-caption-ink-hover)')
    expect(menu).toContain('--dsw-alias-interactive-bg-hover: var(--maid-caption-hover)')
    const expandedToggle = CSS.match(
      /\[class\*='root'\]:not\(\[class\*='collapsed'\]\)\s*> \[class\*='logoRow'\] > button\[class\*='toggle'\]\s*\{([^}]*)\}/,
    )?.[1] ?? ''
    expect(expandedToggle).toContain('border-radius: var(--maid-caption-control-radius)')
  })

  it('hands the native window controls a light glyph through the preload probe', () => {
    const probe = CSS.match(
      /body\[data-dsh-maid-atelier\]\s*> span\[style\*='--dsw-specific-sidebar-fill'\]\[style\*='--dsw-alias-label-primary'\]\s*\{([^}]*)\}/,
    )?.[1] ?? ''
    expect(probe).toContain('--dsw-alias-label-primary: var(--maid-caption-ink-hover)')
  })

  it('drops the Windows frame corner on the conversation column', () => {
    expect(CSS).toMatch(
      /html\[data-windows-titlebar\] body\[data-dsh-maid-atelier\] :is\(\[data-pane='conversation'\], \[class\*='centerCol'\]\)\s*\{\s*border-radius: 0;/,
    )
  })

  it('lets the new-session shortcut hint make room instead of masking the label', () => {
    const shortcut = CSS.match(/button\[class\*='newSession'\] \[class\*='newSessionShortcut'\]\s*\{([^}]*)\}/)?.[1] ?? ''
    expect(shortcut).toContain('max-width: 0')
    const hovered = CSS.match(
      /button\[class\*='newSession'\]:is\(:hover, :focus-visible\) \[class\*='newSessionShortcut'\]\s*\{([^}]*)\}/,
    )?.[1] ?? ''
    expect(hovered).toContain('max-width: 10em')
    const mask = CSS.match(
      /button\[class\*='newSession'\]:is\(:hover, :focus-visible\) \[class\*='newSessionLabelMask'\]\s*\{([^}]*)\}/,
    )?.[1] ?? ''
    expect(mask).toContain('mask-image: none')
    expect(CSS).toMatch(/button\[class\*='newSession'\] \[class\*='newSessionContent'\]\s*\{\s*width: 100%;/)
  })

  it('keeps the expanded brand plate inside the sidebar frame', () => {
    const rule = CSS.match(
      /html\[data-windows-titlebar\] body\[data-dsh-maid-atelier\]\s*\[class\*='root'\]:not\(\[class\*='collapsed'\]\) > \[class\*='logoRow'\]\s*\{([^}]*)\}/,
    )?.[1] ?? ''
    expect(rule).toContain('height: 60px')
    expect(rule).toContain('margin: 8px 8px 0')
    expect(rule).toContain('padding: 8px 8px 10px')
  })

  it('runs the slot-containment workarounds only for the in-sidebar settings mount', () => {
    // Releasing the frame's overflow against the rc.2 body portal shifted the
    // Windows layout while settings was open.
    expect(CSS).not.toMatch(/\[data-maid-settings-open\][^{]*\[class\*='frame'\]:has\(\[data-slot='sidebar\.settings'\]\)/)
    expect(CSS).toMatch(/\[data-maid-settings-in-sidebar\] \[class\*='frame'\]:has\(\[data-slot='sidebar\.settings'\]\)/)
    expect(CSS).toMatch(/\[data-maid-settings-in-sidebar\]\s*:is\(\[data-pane='sidebar'\], \[class\*='sidebarCol'\]\)\s*> div\s*> :not\(/)
  })

  it('does not key the caption treatment on the stale sidebar-size flag', () => {
    expect(CSS).not.toMatch(/data-windows-titlebar\][^{]*data-maid-sidebar-size/)
  })
})
