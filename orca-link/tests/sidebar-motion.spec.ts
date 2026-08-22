import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const css = readFileSync(
  new URL('../src/client/orca-link.module.css', import.meta.url),
  'utf8',
).replaceAll('\r\n', '\n')

describe('ORCA LINK sidebar motion', () => {
  it('collapses the DSH wordmark with one top-anchored compositor transform', () => {
    expect(css).toContain('transform: scale(0.28);\n  transform-origin: left top;')
    expect(css).toContain('will-change: transform, opacity, filter;')
    expect(css).not.toContain('will-change: top, left, width, height, transform, filter;')
  })

  it('centers the collapsed wordmark inside the shrunk logo row', () => {
    // The rail logo row is ~35px wide while the scaled mark is 33x8.4px;
    // the wide-state anchor (left 4px / top 15px) pushes it right of center
    // and clips the H at the row's overflow edge.
    const rule = css.match(
      /body\[data-dsh-orca-link\]:not\(\[data-orca-sidebar-wide\]\) \.dshWordmark\s*\{([^}]*)\}/s,
    )?.[1] ?? ''
    expect(rule).not.toBe('')
    expect(rule).toContain('left: calc((100% - 33px) / 2)')
    expect(rule).toContain('top: calc((100% - 8.4px) / 2)')
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

})
