import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const css = readFileSync(new URL('../src/client/orca-link.module.css', import.meta.url), 'utf8')
  .replace(/\r\n/g, '\n')

const escape = (text: string): string => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const block = (selector: string): string =>
  css.match(new RegExp(`${escape(selector)}\\s*\\{([^}]*)\\}`))?.[1] ?? ''

describe('ORCA readability switch', () => {
  const READABLE = "html[data-dsh-whale-orca-readability='on']\n  body[data-dsh-orca-link]:not([data-ds-dark-theme])[data-orca-scene='active']\n  .lightSceneActive"
  const READABLE_DARK = "html[data-dsh-whale-orca-readability='on']\n  body[data-dsh-orca-link][data-ds-dark-theme][data-orca-scene='active']\n  .darkSceneActive"

  it('steps the active scene back only while the switch is on', () => {
    expect(block(READABLE).trim()).toBe('opacity: 0.45;')
    expect(block(READABLE_DARK).trim()).toBe('opacity: 0.6;')
    expect(block("body[data-dsh-orca-link][data-ds-dark-theme][data-orca-scene='active'] .darkSceneActive"))
      .toContain('opacity: 0.94')
    // The default resting opacity stays as it was without the switch.
    expect(block("body[data-dsh-orca-link]:not([data-ds-dark-theme])[data-orca-scene='active'] .lightSceneActive"))
      .toContain('opacity: 0.94')
  })

  it('leaves the hero welcome and the crossfade timing alone', () => {
    expect(css).not.toMatch(/data-dsh-whale-orca-readability[^{]*SceneHero/)
    for (const rule of [READABLE, READABLE_DARK]) expect(block(rule)).not.toMatch(/transition|transform|filter/)
  })
})
