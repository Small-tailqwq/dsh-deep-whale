import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const css = readFileSync(
  new URL('../src/client/orca-link.module.css', import.meta.url),
  'utf8',
)

describe('composer model menu styling', () => {
  it('scopes the equipment-list surface to the composer model menu', () => {
    // 0.2.0-rc.2 keeps the menu surface on `role='group'` and moves `role='menu'`
    // onto the inner scroll list, so the marker class alone identifies it.
    expect(css).toContain("[class$='_menu'][data-orca-model-menu]")
    expect(css).toContain('width: min(276px, calc(100vw - 32px))')
  })

  it('draws the provider title for the host MenuGroup heading and the older title', () => {
    expect(css).toContain("[data-orca-menu-groups] :is([class$='_groupTitle'], [data-menu-group-heading])")
  })

  it('uses the provider-style marker for the selected model or effort', () => {
    expect(css).toContain("[role='menuitemradio'][aria-checked='true'] [class$='_check']::before")
    expect(css).toContain('clip-path: polygon(0 0, 100% 0, 100% 100%, 58% 100%, 58% 42%, 0 42%)')
  })
})
