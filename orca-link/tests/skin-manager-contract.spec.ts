import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const css = readFileSync(new URL('../src/client/orca-link.module.css', import.meta.url), 'utf8')

describe('skin-manager stylesheet contract', () => {
  it('supports each ORCA presentation toggle', () => {
    expect(css).toContain("data-dsh-whale-orca-character='hidden'")
    expect(css).toContain("data-dsh-whale-orca-character-mirror='mirrored'")
    expect(css).toContain("data-dsh-whale-orca-background='hidden'")
    expect(css).toContain("data-dsh-whale-orca-pricing='hidden'")
    expect(css).toContain("data-dsh-whale-orca-settings-layout='centered'")
  })

  it('lets the shared timer hide only illustration layers', () => {
    expect(css).toContain("data-dsh-whale-orca-art='hidden'")
    expect(css).toContain(':is(.lightSceneLayer, .darkSceneLayer)')
  })
})
