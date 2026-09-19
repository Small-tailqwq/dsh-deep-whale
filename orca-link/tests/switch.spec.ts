// @vitest-environment node
/**
 * ORCA LINK switch contract.
 *
 * The host switch is a capsule with a round thumb. The shape contract squares
 * the track but never reaches the thumb, so an ORCA surface showed a round
 * white ball floating in a hard rectangle, and in the light palette — whose
 * accent IS graphite — the ON state was a dark block that read like the OFF
 * one. These specs pin the replacement form: rectilinear in both parts, the
 * host's 36x20 geometry and 16px travel unchanged, ON carried by the accent
 * fill of track and thumb, and state read from `aria-checked` rather than any
 * parallel class. Rule blocks are matched loosely so the specs hold under both
 * LF and CRLF checkouts, and every block is asserted non-empty.
 */
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const CSS = readFileSync(new URL('../src/client/orca-link.module.css', import.meta.url), 'utf8')
  .replaceAll('\r\n', '\n')

/** Every flat rule whose selector mentions the switch, minus the shape contract's entries. */
const RULES = [...CSS.matchAll(/([^{}]*\[role='switch'\][^{}]*)\{([^}]*)\}/g)]
  .map(match => ({
    selector: (match[1] ?? '').trim().replace(/\s+/g, ' '),
    body: (match[2] ?? '').trim(),
  }))
  .filter(rule => !rule.selector.startsWith('@'))
  .filter(rule => rule.body.replace(/\s/g, '') !== 'border-radius:0!important;')

const find = (checked: boolean, thumb: boolean) => RULES.find(rule => rule.selector.includes("aria-checked='true'") === checked
  && rule.selector.includes("[class*='thumb']") === thumb)

const TRACK = find(false, false)
const TRACK_ON = find(true, false)
const THUMB = find(false, true)
const THUMB_ON = find(true, true)

describe('ORCA LINK switch', () => {
  it('parses all four switch rules', () => {
    for (const rule of [TRACK, TRACK_ON, THUMB, THUMB_ON]) {
      expect(rule?.selector ?? '').not.toBe('')
      expect(rule?.body ?? '').not.toBe('')
    }
  })

  it('keeps the host geometry, so travel, hit box and layout are unchanged', () => {
    expect(TRACK?.body).toContain('width: 36px;')
    expect(TRACK?.body).toContain('height: 20px;')
    expect(TRACK?.body).toContain('padding: 1px;')
    expect(TRACK?.body).toContain('border: 1px solid var(--orca-line);')
    expect(THUMB?.body).toContain('width: 16px;')
    expect(THUMB?.body).toContain('height: 16px;')
    // 36 - 2x(1px frame + 1px inset) - 16px thumb = the host's own 16px travel.
    expect(THUMB_ON?.body).toContain('transform: translateX(16px);')
  })

  it('rectifies both parts instead of leaving the host thumb round', () => {
    expect(TRACK?.body).toContain('border-radius: 0 !important;')
    expect(THUMB?.body).toContain('border-radius: 0 !important;')
    expect(THUMB?.body).toContain('border: 1px solid var(--orca-muted);')
  })

  it('lights both the slot and the block from the accent when on', () => {
    expect(TRACK_ON?.body).toContain('background: color-mix(in srgb, var(--orca-blue) 18%, var(--dsw-input-solid));')
    expect(TRACK_ON?.body).toContain('border-color: color-mix(in srgb, var(--orca-blue) 62%, transparent);')
    expect(THUMB_ON?.body).toContain('background: var(--orca-blue);')
    // OFF is a recessed slot with a hollow block, never the same fill as ON.
    expect(TRACK?.body).toContain('background: color-mix(in srgb, var(--orca-ink) 7%, var(--dsw-input-solid));')
    expect(THUMB?.body).toContain('background: var(--orca-surface-strong);')
  })

  it('reads the state from aria-checked, the same source assistive technology uses', () => {
    expect(TRACK_ON?.selector).toContain("[role='switch'][aria-checked='true']")
    expect(THUMB_ON?.selector).toContain("[role='switch'][aria-checked='true']")
    expect(CSS).not.toMatch(/\[role='switch'\]\[data-(?:checked|state)/)
  })

  it('reaches the settings dialog but keeps the hands-off seats native', () => {
    // The settings dialog already zeroes every radius inside it, so excluding
    // the section would give one control two different designs.
    expect(TRACK?.selector).not.toContain("[data-slot='settings.section'] *")
    for (const seat of [
      "[data-slot='conversation.input.left'] *",
      "[data-slot='conversation.input.right'] *",
      "[data-slot='sidebar.footer.action'] *",
    ]) {
      expect(TRACK?.selector).toContain(seat)
      expect(TRACK_ON?.selector).toContain(seat)
      expect(THUMB?.selector).toContain(seat)
      expect(THUMB_ON?.selector).toContain(seat)
    }
  })

  it('disables the thumb transition under reduced motion', () => {
    const reduced = CSS.slice(CSS.indexOf('@media (prefers-reduced-motion: reduce)'))
    expect(reduced).toContain("body[data-dsh-orca-link] [role='switch'] > [class*='thumb'],")
  })
})
