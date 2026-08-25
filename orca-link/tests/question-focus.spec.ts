import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const css = readFileSync(
  new URL('../src/client/orca-link.module.css', import.meta.url),
  'utf8',
).replaceAll('\r\n', '\n')

describe('question composer focus styling', () => {
  it('keeps the global accessibility outline while exempting question inputs', () => {
    expect(css).toContain("body[data-dsh-orca-link] :focus-visible:not(")
    expect(css).toContain('outline: 2px solid var(--orca-blue)')
    expect(css).toContain("[data-question-key] :is(input, textarea):focus-visible {\n  outline: none;")
  })

  it('moves question focus to a muted rectilinear row indicator', () => {
    expect(css).toContain("[data-question-key] :has(> input:focus)")
    expect(css).toContain('border-color: var(--orca-question-focus)')
    expect(css).toContain('inset 3px 0 0 var(--orca-question-focus)')
    expect(css).toContain('--orca-question-focus: #4a473f')
  })

  it('keeps question recommendation text readable in dark mode', () => {
    expect(css).toContain('--dsw-alias-button-info-fill: #4d91ff !important;')
  })

  it('anchors every status bubble tail on the left', () => {
    expect(css).toContain('.statusCharacterBubble::after {')
    expect(css).toContain('right: auto;\n  left: 8px;')
    expect(css).toContain('border-left: 1px solid color-mix')
    expect(css).toContain('transform: skewY(-45deg);')
  })
})
