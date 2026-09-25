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

/**
 * The settings dialog in both mounts: inside its slot through DSH 0.1.7-rc.1,
 * portaled to <body> with `data-shortcut-modal='settings'` from rc.2. The rc.2
 * portal left the slot-only form matching nothing, and every settings card
 * came back with the host's rounded radius tokens.
 */
const SETTINGS_DIALOG = /:is\(\[data-slot='sidebar\.settings'\] \[role='dialog'\], \[role='dialog'\]\[data-shortcut-modal='settings'\]\)/.source

/** The universal zeroing rules scoped to the settings dialog subtree. */
const SETTINGS_RULE = block(new RegExp(`${SETTINGS_DIALOG}\\s*\\*[^{]*\\{([^}]*)\\}`))

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
    expect(CSS).toMatch(new RegExp(`${SETTINGS_DIALOG} \\*::before`))
    expect(CSS).toMatch(new RegExp(`${SETTINGS_DIALOG} \\*::after`))
  })

  it('keeps the rule scoped to the settings dialog, not the whole page', () => {
    // The rule must not leak onto the settings mask or the application at
    // large: only the dialog subtree is an owned rectilinear surface.
    expect(CSS).toMatch(new RegExp(`${SETTINGS_DIALOG}\\s*\\*[,:]`))
    expect(CSS).not.toMatch(/\[data-slot='sidebar\.settings'\]\s*>\s*\[role='presentation'\]\s*\*\s*\{/)
  })

  it('reaches the rc.2 body-portaled panel, not only the slot-mounted one', () => {
    // Without the portal branch the rule still parses but matches no element
    // on DSH 0.1.7-rc.2, which is how the rounded settings shipped.
    const selector = CSS.match(new RegExp(`[^{}]*${SETTINGS_DIALOG}\\s*\\*[^{]*\\{`))?.[0] ?? ''
    expect(selector).toContain("[role='dialog'][data-shortcut-modal='settings']) *,")
    expect(selector).toContain("[role='dialog'][data-shortcut-modal='settings']) *::before")
    expect(selector).toContain("[role='dialog'][data-shortcut-modal='settings']) *::after")
  })

  it('mirrors the chat-flow universal zeroing for the same reason', () => {
    expect(CHAT_FLOW_RULE).toContain('border-radius: 0 !important')
  })
})
