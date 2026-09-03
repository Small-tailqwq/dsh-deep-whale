import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const css = readFileSync(new URL('../src/client/maid-atelier.module.css', import.meta.url), 'utf8')

describe('skin-manager stylesheet contract', () => {
  it('supports artwork visibility and all requested model exits', () => {
    expect(css).toContain("data-dsh-whale-maid-art='hidden'")
    expect(css).toContain("data-dsh-whale-model='pro'")
    expect(css).toContain("data-maid-character='right'")
    expect(css).toContain("data-dsh-whale-model='flash'")
    expect(css).toContain("data-maid-character='left'")
    expect(css).toContain("data-dsh-whale-model='flash-vision'")
    expect(css).toContain("data-maid-character='vision'")
  })

  it('keeps the #22 serif choice opt-in', () => {
    expect(css).toContain("data-dsh-whale-maid-font='serif'")
    expect(css).toContain("Georgia, 'Times New Roman', 'Songti SC'")
    expect(css.indexOf("'Noto Serif SC'")).toBeLessThan(css.indexOf("'Noto Serif CJK SC'"))
    expect(css.indexOf("'Noto Serif SC'")).toBeLessThan(css.indexOf('SimSun'))
  })

  it('covers the full #22 prose element list', () => {
    expect(css).toContain(':is(h1, h2, h3, h4, h5, h6, p, li, blockquote, td, th)')
  })

  it('styles the scroll-intent seat states', () => {
    expect(css).toContain('[data-maid-composer-hidden]')
  })

  it('styles the empty-state capsule and keeps its hint copy', () => {
    expect(css).toContain('[data-maid-composer-capsule]')
    expect(css).toContain('✎ 给智能体发消息')
    expect(css).toContain('[data-maid-composer-expanding]')
    // Fold/unfold animates compositor-friendly properties only: no layout
    // transitions (max-width/min-height/padding/border-radius) may appear
    // in the card rules used by the capsule states.
    expect(css).not.toMatch(/\[data-composer-card\]\s*\{[^}]*transition:[^}]*max-width/s)
  })

  it('applies the optional typeface to the Lexical composer surface', () => {
    const composerTypography = css.match(
      /\[data-composer-card\]\s+:is\(([\s\S]*?)\)\s*\{\s*font-family: Georgia/,
    )?.[1] ?? ''
    expect(composerTypography).toContain('[data-composer-input]')
    expect(composerTypography).not.toContain('[data-input-backdrop]')
    expect(composerTypography).not.toContain('[data-input-mirror]')
  })
})
