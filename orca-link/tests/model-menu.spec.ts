import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const css = readFileSync(
  new URL('../src/client/orca-link.module.css', import.meta.url),
  'utf8',
)

describe('composer model menu styling', () => {
  it('scopes the equipment-list surface to the composer model menu', () => {
    expect(css).toContain("[role='menu'][class$='_menu']:has([class$='_cell'], [class$='_groupTitle'], [role='menuitemradio'] [class$='_modelName'])")
    expect(css).toContain('width: min(276px, calc(100vw - 32px))')
  })

  it('uses the provider-style marker for the selected model or effort', () => {
    expect(css).toContain("[role='menuitemradio'][aria-checked='true'] [class$='_check']::before")
    expect(css).toContain('clip-path: polygon(0 0, 100% 0, 100% 100%, 58% 100%, 58% 42%, 0 42%)')
  })
})
