import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const css = readFileSync(
  new URL('../src/client/orca-link.module.css', import.meta.url),
  'utf8',
).replaceAll('\r\n', '\n')

describe('ORCA LINK sidebar motion', () => {
  it('moves the wordmark in a stable sidebar coordinate system', () => {
    const rule = css.match(/body\[data-dsh-orca-link\] \.dshWordmark\s*\{([^}]*)\}/s)?.[1] ?? ''
    expect(rule).toContain('top: 21px;')
    expect(rule).toContain('left: 0;')
    expect(rule).toContain('transform-origin: center;')
    expect(rule).not.toMatch(/(?:top|left) 260ms/)
  })

  it('centers the collapsed wordmark using the final sidebar track width', () => {
    expect(css).toContain('translateX(calc((var(--orca-sidebar-width, 56px) - 118px) / 2)) scale(0.28)')
    expect(css).toContain('transform: translateX(16px) scale(1);')
  })

  it('keeps the character stage width stable and wipes it horizontally', () => {
    expect(css).toContain('width: calc(var(--orca-sidebar-art-width, 280px) - 30px);')
    expect(css).toContain('clip-path: inset(0 100% 0 0);')
    expect(css).toContain('will-change: clip-path, transform, opacity;')
  })

  it('hides stale sidebar tooltips during WebApp window resume', () => {
    expect(css).toContain("[data-orca-window-resuming] [data-slot='sidebar'] [role='tooltip']")
    expect(css).toContain('display: none;')
  })

  // Issue #116: a plugin may inject a portalled host plus its own button instead
  // of a direct-child button. The host must be lifted out of the stage and out
  // of the native-button takeover, the region margin reset must fire for it, and
  // the takeover's own selectors must stay intact.
  it('treats a portalled plugin entry host as a sidebar entry', () => {
    const lifted = css.match(
      /body\[data-dsh-orca-link\]\[data-orca-sidebar-wide\]\s*\[data-slot='sidebar'\]\s*>\s*:first-child\s*>\s*:is\((?<selector>[^{]*)\)\s*\{/,
    )?.groups?.selector ?? ''
    expect(lifted).toContain("button[data-dsh-part='sidebar-entry']")
    expect(lifted).toContain('[data-plugin-entry]')
    expect(css).toContain("> :first-child:has(> :is(button[data-dsh-part='sidebar-entry'], [data-plugin-entry]))")
    expect(css).toContain('> :not([role=\'tooltip\'], [data-orca-link-wordmark], [data-plugin-entry])')
    expect(css).toContain(
      "button:not([data-dsh-part='sidebar-entry'], [data-plugin-entry] *) > *",
    )
    // The narrow-viewport block retires the stage, so the entry offset must
    // retire with it for both marker shapes.
    const narrow = css.match(
      /@media \(max-width: 900px\) \{[\s\S]*?\n\}/,
    )?.[0] ?? ''
    expect(narrow).not.toBe('')
    expect(narrow).toMatch(/:is\(button\[data-dsh-part='sidebar-entry'\], \[data-plugin-entry\]\)/)
  })

})
