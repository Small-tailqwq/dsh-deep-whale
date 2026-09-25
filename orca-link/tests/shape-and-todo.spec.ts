// @vitest-environment node
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const CSS = readFileSync(resolve(process.cwd(), 'src/client/orca-link.module.css'), 'utf8').replaceAll('\r\n', '\n')
const ICONS = readFileSync(resolve(process.cwd(), 'src/client/icons.ts'), 'utf8')

describe('ORCA LINK shape contract at the token level', () => {
  it('zeroes the host radius scale so token-drawn divs square up too', () => {
    const rule = CSS.match(/body\[data-dsh-orca-link\] \{\n  --dsw-radius-xs: 0px;([^}]*)\}/)?.[0] ?? ''
    for (const token of ['xs', 'sm', 'md', 'lg', 'xl', 'panel']) expect(rule).toContain(`--dsw-radius-${token}: 0px`)
  })

  it('hands the host scale back to the hands-off seats', () => {
    const rule = CSS.match(/\[data-slot='settings\.section'\]\n\) \{([^}]*)\}/)?.[1] ?? ''
    expect(rule).toContain('--dsw-radius-md: 12px')
    expect(rule).toContain('--dsw-radius-xl: 20px')
  })
})

describe('ORCA LINK todo glyphs (DSH 0.1.7 StateDot markup)', () => {
  const glyph = "[data-testid='todo-panel'] li[data-status"
  it('hides the host StateDot and paints one glyph per status', () => {
    expect(CSS).toContain(`${glyph}] > [class*='_glyph'] > * {\n  display: none;`)
    for (const status of ['completed', 'in_progress']) expect(CSS).toContain(`${glyph}='${status}'] > [class*='_glyph']::before`)
  })

  it('fills the in-progress pixel field on a stepped cycle and stills it for reduced motion', () => {
    expect(CSS).toMatch(/li\[data-status='in_progress'\] > \[class\*='_glyph'\]::after \{[^}]*animation: orcaTodoFill 2\.4s step-end infinite/)
    expect(CSS).toMatch(/@keyframes orcaTodoFill \{[^@]*72% \{ clip-path: polygon\(3\.5px 12\.5px, 12\.5px 12\.5px, 12\.5px 3\.5px/)
    expect(CSS).toMatch(/prefers-reduced-motion: reduce\)[^@]*li\[data-status='in_progress'\] > \[class\*='_glyph'\]::after \{\s*animation: none;/)
  })
})

describe('ORCA LINK icon matchers for DSH 0.1.7 artwork', () => {
  it('keeps the redraws for the clock, user and users icons', () => {
    expect(ICONS).toContain(`["d=\\"M8 4.31V8.46L11 10.08", 'clock']`)
    expect(ICONS).toContain(`["d=\\"M8 8.25C9.51878 8.25 10.75 7.01878 10.75", 'user']`)
    expect(ICONS).toContain(`["d=\\"M6 8.25C7.51878 8.25 8.75 7.01878 8.75", 'users']`)
    expect(ICONS).toMatch(/\n  users: \[/)
  })
})
