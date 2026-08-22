// @vitest-environment node
/**
 * ORCA LINK settings radius contract.
 *
 * The host settings surface renders its inner cards, tag chips, badges,
 * status dots and toggle knobs as divs/spans that miss the shape contract
 * (which only covers interactive elements), so the settings dialog subtree
 * gets the same universal rectilinear zeroing as the chat flow. These specs
 * pin that rule and its scope so it cannot silently regress.
 *
 * Rule blocks are matched with `\s*` between selector parts so the specs hold
 * under both LF and CRLF checkouts, and every block is asserted non-empty — an
 * empty block would satisfy every `not.toContain` silently.
 */
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const CSS = readFileSync(new URL('../src/client/orca-link.module.css', import.meta.url), 'utf8')
  .replaceAll('\r\n', '\n')

/** The declaration block of the first rule whose selector matches. */
function block(pattern: RegExp): string {
  return CSS.match(pattern)?.[1] ?? ''
}

/** The universal zeroing rules scoped to the settings dialog subtree. */
const SETTINGS_RULE = block(
  /\[data-slot='sidebar\.settings'\]\s*\[role='dialog'\]\s*\*[^{]*\{([^}]*)\}/,
)

/** The chat-flow universal zeroing this rule mirrors. */
const CHAT_FLOW_RULE = block(
  /\[data-chat-flow\]\s*\*[^{]*\{([^}]*)\}/,
)

describe('ORCA LINK settings radius', () => {
  it('parses every rule this contract depends on', () => {
    for (const rule of [SETTINGS_RULE, CHAT_FLOW_RULE]) {
      expect(rule).not.toBe('')
    }
  })

  it('zeroes every element and its pseudo-elements inside the settings dialog', () => {
    expect(SETTINGS_RULE).toContain('border-radius: 0 !important')
    expect(CSS).toContain("[role='dialog'] *::before")
    expect(CSS).toContain("[role='dialog'] *::after")
  })

  it('keeps the rule scoped to the settings dialog, not the whole page', () => {
    // The rule must not leak onto the settings mask or the application at
    // large: only the dialog subtree is an owned rectilinear surface.
    expect(CSS).toMatch(/\[data-slot='sidebar\.settings'\]\s*\[role='dialog'\]\s*\*[,:]/)
    expect(CSS).not.toMatch(/\[data-slot='sidebar\.settings'\]\s*>\s*\[role='presentation'\]\s*\*\s*\{/)
  })

  it('mirrors the chat-flow universal zeroing for the same reason', () => {
    expect(CHAT_FLOW_RULE).toContain('border-radius: 0 !important')
  })
})
