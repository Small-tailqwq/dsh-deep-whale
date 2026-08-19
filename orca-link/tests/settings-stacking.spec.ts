// @vitest-environment node
/**
 * ORCA LINK settings-overlay stacking contract.
 *
 * SettingsPanel is not a document-root portal: the host mounts it inside the
 * sidebar content root and it reaches the viewport with `position: fixed`. Any
 * stacking context the skin adds along that ancestor chain is a context the
 * product itself never had, and a fixed panel that cannot paint out of one is
 * the Safari/WebKit failure reported against maid-atelier in #40 and against
 * this skin in #53. These specs pin the shape of the fix so it cannot silently
 * regress: the contexts the skin created are released, and the one promotion
 * that is load bearing is kept.
 *
 * Rule blocks are matched with `\s*` between selector parts so the specs hold
 * under both LF and CRLF checkouts, and every block is asserted non-empty — an
 * empty block would satisfy every `not.toContain` silently (see PR #45).
 */
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const CSS = readFileSync(new URL('../src/client/orca-link.module.css', import.meta.url), 'utf8')

/** The declaration block of the first rule whose selector matches. */
function block(pattern: RegExp): string {
  return CSS.match(pattern)?.[1] ?? ''
}

/** `[data-orca-settings-open]` release rules. */
const SETTINGS_ROOT_RULE = block(
  /\[data-orca-settings-open\]\s*\[id='root'\]\s*\{([^}]*)\}/,
)
const SETTINGS_SIDEBAR_RULE = block(
  /\[data-orca-settings-open\]\s*:is\(\[data-pane='sidebar'\],\s*\[data-slot='sidebar'\]\s*>\s*:first-child\)\s*\{([^}]*)\}/,
)
const SETTINGS_COLUMN_RULE = block(
  /\[class\*='sidebarCol'\]:has\(\[data-slot='sidebar\.settings'\]\s*\[role='dialog'\]\)\s*\{([^}]*)\}/,
)
const SETTINGS_CARRIER_RULE = block(
  /\[data-slot='sidebar'\]\s*>\s*:first-child\s*>\s*:has\(\[role='dialog'\]\)\s*\{([^}]*)\}/,
)

/** Always-on sidebar layering the release rules have to neutralise. */
const SIDEBAR_BASE_RULE = block(
  /body\[data-dsh-orca-link\]\s*:is\(\[data-pane='sidebar'\],\s*\[data-slot='sidebar'\]\s*>\s*:first-child\)\s*\{([^}]*)\}/,
)
const SIDEBAR_CHILDREN_RULE = block(
  /body\[data-dsh-orca-link\]\s*:is\(\[data-pane='sidebar'\],\s*\[data-slot='sidebar'\]\s*>\s*:first-child\)\s*>\s*:not\(\[role='tooltip'\]\)\s*\{([^}]*)\}/,
)

/** The fixed overlay itself, and the body-level scene layers #root must outrank. */
const OVERLAY_RULE = block(
  /\[data-slot='sidebar\.settings'\]\s*>\s*\[role='presentation'\]:has\(>\s*\[role='dialog'\]\)\s*\{([^}]*)\}/,
)
const LIGHT_SCENE_RULE = block(/\.lightScene\s*\{([^}]*)\}/)
const DARK_SCENE_RULE = block(/\.darkScene\s*\{([^}]*)\}/)

describe('ORCA LINK settings overlay stacking', () => {
  it('parses every rule this contract depends on', () => {
    // A drifted selector yields an empty block, and an empty block makes all of
    // the negative assertions below pass for the wrong reason.
    for (const rule of [
      SETTINGS_ROOT_RULE, SETTINGS_SIDEBAR_RULE, SETTINGS_COLUMN_RULE, SETTINGS_CARRIER_RULE,
      SIDEBAR_BASE_RULE, SIDEBAR_CHILDREN_RULE, OVERLAY_RULE, LIGHT_SCENE_RULE, DARK_SCENE_RULE,
    ]) expect(rule).not.toBe('')
  })

  it('keeps the always-on sidebar layering that makes the release necessary', () => {
    // The content root is a stacking context for the whole session because of
    // isolation, and every direct child of it — the dialog carrier included —
    // is one because of relative + z-index. If either ever stops being true the
    // release rules below turn into dead weight and should be revisited.
    expect(SIDEBAR_BASE_RULE).toContain('isolation: isolate')
    expect(SIDEBAR_BASE_RULE).toContain('position: relative')
    expect(SIDEBAR_CHILDREN_RULE).toContain('position: relative')
    expect(SIDEBAR_CHILDREN_RULE).toContain('z-index: 1')
  })

  it('retires the sidebar stacking contexts while the settings dialog is open', () => {
    // Releasing the context is the reliable half of the fix: relative +
    // z-index auto creates no stacking context, so the fixed overlay's own
    // z-index competes at page level exactly like a portaled dialog. Promoting
    // these ancestors (what these rules used to do) raises the context but
    // never removes it, which is why it never helped WebKit.
    expect(SETTINGS_SIDEBAR_RULE).toContain('z-index: auto')
    expect(SETTINGS_SIDEBAR_RULE).toContain('isolation: auto')
    expect(SETTINGS_SIDEBAR_RULE).not.toContain('var(--orca-settings-overlay-z)')

    expect(SETTINGS_COLUMN_RULE).toContain('z-index: auto')
    expect(SETTINGS_COLUMN_RULE).toContain('overflow: visible')
    expect(SETTINGS_COLUMN_RULE).not.toContain('var(--orca-settings-overlay-z)')

    expect(SETTINGS_CARRIER_RULE).toContain('z-index: auto')
    expect(SETTINGS_CARRIER_RULE).toContain('opacity: 1 !important')
    expect(SETTINGS_CARRIER_RULE).not.toContain('var(--orca-settings-overlay-z)')
  })

  it('never drops those ancestors to position: static', () => {
    // maid-atelier shipped `position: static` first and had to walk it back in
    // 4d3e346: static re-homes absolutely positioned descendants and tripped
    // Chromium into compositing a filtered layer over the mask's
    // backdrop-filter. Keeping `relative` costs the fix nothing, because
    // relative alone forms no stacking context.
    expect(SETTINGS_COLUMN_RULE).toContain('position: relative')
    expect(SETTINGS_COLUMN_RULE).not.toContain('position: static')
    expect(SETTINGS_CARRIER_RULE).toContain('position: relative')
    expect(SETTINGS_CARRIER_RULE).not.toContain('position: static')
    expect(SETTINGS_SIDEBAR_RULE).not.toContain('position: static')
  })

  it('keeps #root promoted above the opaque body-level scene layers', () => {
    // The one promotion that is load bearing. index.ts appends the scene
    // layers to <body> AFTER #root, so #root's positive z-index is the only
    // thing holding those opaque fixed backdrops behind the application;
    // releasing it paints a flat colour over the whole app while settings is
    // open, on WebKit and on Blink alike. Everything the panel must cover
    // lives inside #root, so this context does not obstruct the fix.
    expect(SETTINGS_ROOT_RULE).toContain('z-index: var(--orca-settings-overlay-z)')
    expect(LIGHT_SCENE_RULE).toContain('position: fixed')
    expect(LIGHT_SCENE_RULE).toContain('z-index: 0')
    expect(DARK_SCENE_RULE).toContain('position: fixed')
    expect(DARK_SCENE_RULE).toContain('z-index: 0')
  })

  it('leaves the overlay itself at the top of the page stacking order', () => {
    expect(OVERLAY_RULE).toContain('position: fixed')
    expect(OVERLAY_RULE).toContain('z-index: var(--orca-settings-overlay-z)')
    expect(CSS).toContain('--orca-settings-overlay-z: 2147483000')
  })

  it('does not reset will-change on the sidebar art pseudo-element', () => {
    // Issue #53 proposed this as a belt-and-suspenders measure, on the premise
    // that the pseudo's `will-change` makes its originating element a
    // containing block for fixed descendants. It does not: will-change applies
    // to the pseudo-element's own box, and `will-change: opacity` never forms a
    // containing block for fixed positioning in the first place. Adding it
    // would only tear down a live compositing hint mid-interaction.
    expect(CSS).not.toMatch(/\[data-orca-settings-open\][^{]*::before\s*\{[^}]*will-change:\s*auto/)
  })
})
