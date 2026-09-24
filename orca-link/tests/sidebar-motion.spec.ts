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
    expect(css).toContain("> :first-child:has(> :is(button[data-dsh-part='sidebar-entry'], [data-plugin-entry], nav[class*='panelList']))")
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
    expect(narrow).toMatch(/:is\(button\[data-dsh-part='sidebar-entry'\], \[data-plugin-entry\], nav\[class\*='panelList'\]\)/)
  })

  // 0.1.6 registers the first `sidebar.panellist` entry, so the official
  // `nav.panelList` row renders between New Session and the browsing region for
  // the first time. Left alone it landed on the portrait stage inside the
  // transparent New Session hit plane (z-index 2), which both misplaced the row
  // and swallowed its clicks; the injected-entry offsets also inherit a flow
  // anchor one row lower.
  it('lifts the official panel row out of the stage and above the hit plane', () => {
    const lifted = css.match(
      /body\[data-dsh-orca-link\]\[data-orca-sidebar-wide\]\s*\[data-slot='sidebar'\]\s*>\s*:first-child\s*>\s*:is\((?<selector>[^{]*)\)\s*\{/,
    )?.groups?.selector ?? ''
    expect(lifted).toContain("nav[class*='panelList']")
    // The declaration block that follows the first `nav[class*=…]` selector.
    const fromSelector = css.slice(css.indexOf("nav[class*='panelList']"))
    const declarations = fromSelector.slice(fromSelector.indexOf('{') + 1, fromSelector.indexOf('}'))
    expect(declarations).toContain('z-index: 3;')
    expect(declarations).toContain('margin-top: calc(var(--orca-stage, 300px) - 116px);')
    // A row following the official one must not pay the stage offset twice.
    expect(css).toContain(
      "> nav[class*='panelList']\n  ~ :is(button[data-dsh-part='sidebar-entry'], [data-plugin-entry]) {",
    )
    // The New Session hit plane stays on the rung below the lifted rows.
    expect(css).toContain('> button:not([data-dsh-part=\'sidebar-entry\'], [data-plugin-entry] *) {')
  })

})
