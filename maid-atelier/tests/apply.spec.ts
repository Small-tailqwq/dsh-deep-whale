// @vitest-environment jsdom
/**
 * Maid Atelier skin apply spec — the template contract: the body
 * attribute the stylesheet is scoped on is set on apply and retracted on
 * dispose, and every injected chrome element (marked data-skin-chrome) is
 * removed. Extend with assertions specific to your surface.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Context, type Fiber } from '@deepseek-ai/cordis'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { apply } from '../src/client/index.ts'

const CSS = readFileSync(resolve(process.cwd(), 'src/client/maid-atelier.module.css'), 'utf8')
const TURN_MARK_SELECTOR = "[data-phase='active'] :has(+ * > * > [data-chat-flow]) > nav button[type='button'][aria-label]"

function unpairedFullRoundRules(css: string): string[] {
  const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, ' ')
  return [...withoutComments.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
    .filter(([, , declarations = '']) => /border-radius:\s*(?:50%|100%|(?:99\d|\d{4,})px)\s*;/.test(declarations))
    .filter(([, , declarations = '']) => !/corner-shape:\s*round\b/.test(declarations))
    .map(([, selectors = '']) => selectors.trim())
}

/**
 * Selector/declaration pairs of every flat rule in the stylesheet, comments and
 * at-rule preludes excluded. Specs that must survive an equivalent rewrite run
 * these selectors against a real DOM fixture instead of matching source text.
 */
function flatCssRules(css: string): Array<{ selector: string, body: string }> {
  return [...css.replace(/\/\*[\s\S]*?\*\//g, ' ').matchAll(/([^{}]+)\{([^{}]*)\}/g)]
    .map((match) => ({
      selector: (match[1] ?? '').trim().replace(/\s+/g, ' '),
      body: match[2] ?? '',
    }))
    .filter((rule) => !rule.selector.startsWith('@'))
}

/**
 * Declarations of every flat rule whose selector matches `target` in the given
 * theme. Pseudo-element rules match on their originating element, so a sheet
 * painted by `::before` can be asserted through the element that owns it.
 */
function declarations(target: HTMLElement, dark: boolean): string {
  document.body.toggleAttribute('data-ds-dark-theme', dark)
  return flatCssRules(CSS)
    .filter((rule) => rule.selector.startsWith('body[data-dsh-maid-atelier]'))
    .filter((rule) => {
      try {
        return target.matches(rule.selector.replace(/::(before|after)\b/g, ''))
      } catch {
        return false
      }
    })
    .map((rule) => rule.body)
    .join('\n')
}

/** The stylesheet without its `prefers-reduced-motion` override blocks. */
function withoutReducedMotion(css: string): string {
  let rest = css
  for (;;) {
    const start = rest.indexOf('@media (prefers-reduced-motion: reduce)')
    if (start < 0) return rest
    const open = rest.indexOf('{', start)
    if (open < 0) return rest
    let depth = 0
    let end = open
    for (; end < rest.length; end += 1) {
      if (rest[end] === '{') depth += 1
      else if (rest[end] === '}') {
        depth -= 1
        if (depth === 0) break
      }
    }
    rest = rest.slice(0, start) + rest.slice(end + 1)
  }
}

/**
 * Declarations of the settings-open rule governing the sidebar content root's
 * stacking context — the one seat two specs below both read.
 *
 * Matched with `\s*` between the selector parts rather than literal newlines:
 * a Windows checkout carries CRLF, so a hard-coded `\n` finds nothing and the
 * lookup degrades to an empty block, which passes every `not.toContain`
 * silently. Specs assert this is non-empty for the same reason.
 */
const SETTINGS_ROOT_STACKING_RULE = CSS.match(
  /\[class\*='sidebarCol'\]\s*> div\s*> \[data-maid-dialog-root\]\s*\{([^}]*)\}/s,
)?.[1] ?? ''

/**
 * Declarations of the settings-dialog carrier fade/rail-in suppression: the
 * official sidebar toggles `railIn`/`fading` classes on the SidebarRoot
 * element, whose `.footArea` (the dialog's carrier) then animates opacity.
 * The carrier sits one layer deeper than the root release above: the
 * sidebar column's direct `div` is the display:contents slot anchor, its
 * direct child is the SidebarRoot, and the carrier is that root's direct
 * child containing the dialog.
 */
const SETTINGS_CARRIER_FADE_RULE = CSS.match(
  /\[class\*='sidebarCol'\]\s*> div\s*> :not\([\s\S]*?\)\s*> \[data-maid-dialog-carrier\]\s*\{([^}]*)\}/s,
)?.[1] ?? ''

let fiber: Fiber | undefined

async function mount(): Promise<Fiber> {
  const f = new Context().plugin({ apply })
  await f.await()
  return f
}

/** Let jsdom deliver the current MutationObserver checkpoint. */
async function flushMutations(): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 0))
}

afterEach(async () => {
  await fiber?.dispose()
  fiber = undefined
  vi.unstubAllGlobals()
  document.body.innerHTML = ''
  document.title = ''
})

describe('Maid Atelier skin apply', () => {
  it('styles the resident alpha1 header and its session fragment without styling nested panel headers', () => {
    document.body.setAttribute('data-dsh-maid-atelier', '')
    document.body.innerHTML = `
      <div data-slot="conversation.header"><header id="chrome">
        <div data-conversation-header-leading></div>
        <div data-slot="conversation.session.header">
          <div><span>Current session</span><div role="dialog"><header id="nested"></header></div></div>
          <div role="tablist" data-conversation-tabs><button role="tab" aria-selected="true" id="tab"></button></div>
        </div>
      </header></div>
    `
    const rules = flatCssRules(CSS)
    const chrome = rules.find(rule => rule.body.includes('--dsw-alias-bg-base: rgba(5, 14, 43, 0.96)'))!
    expect(document.querySelector('#chrome')!.matches(chrome.selector)).toBe(true)
    expect(document.querySelector('#nested')!.matches(chrome.selector)).toBe(false)
    const selected = rules.find(rule => rule.selector.includes("[aria-selected='true']") && rule.body.includes('color: #fff7e6'))!
    expect(document.querySelector('#tab')!.matches(selected.selector)).toBe(true)
  })

  it('keeps a closed alpha1 right panel transparent while its floating tab retains a reading floor', () => {
    document.body.setAttribute('data-dsh-maid-atelier', '')
    document.body.innerHTML = `
      <div data-sidebar-right-panel="fullscreen" id="panel">
        <div data-dockkit-host="float"><section data-dockkit-float="files" id="float"></section></div>
      </div>
    `
    const rules = flatCssRules(CSS)
    const floor = rules.find(rule => rule.selector.includes("[data-sidebar-right-panel='fullscreen']") && rule.body.includes('background: #ebf0fa'))!
    const panel = document.querySelector('#panel')!
    expect(panel.matches(floor.selector)).toBe(false)
    panel.setAttribute('data-sidebar-right-open', '')
    expect(panel.matches(floor.selector)).toBe(true)
    const floating = rules.find(rule => rule.body.includes('--dsw-alias-bg-base: #ebf0fa'))!
    expect(document.querySelector('#float')!.matches(floating.selector)).toBe(true)
  })

  it('targets the alpha2 turn rail outside the transcript in every locale and follow state', async () => {
    document.body.innerHTML = `
      <div data-phase="active">
        <div>
          <div data-conversation-scroll>
            <div class="chat-frame">
              <div class="turn-slot">
                <nav aria-label="Turn navigation">
                  <div><div>
                    <div><button type="button" aria-label="Jump to turn 1" aria-current="true"></button></div>
                    <div><button type="button" aria-label="Load and jump to turn 2" aria-busy="true"></button></div>
                    <div><button type="button" aria-label="Load and jump to turn 3"></button></div>
                  </div></div>
                </nav>
              </div>
              <div data-chat-following-tail><div class="chat-scroll"><div data-chat-flow></div></div></div>
              <div><button type="button" aria-label="Return to bottom"></button></div>
            </div>
          </div>
          <div data-width-handle="left" data-side="left"></div>
          <div data-width-handle="right" data-side="right"></div>
        </div>
      </div>
    `

    fiber = await mount()
    expect(document.querySelectorAll(TURN_MARK_SELECTOR)).toHaveLength(3)
    document.querySelector('[data-chat-following-tail]')!.removeAttribute('data-chat-following-tail')
    expect(document.querySelectorAll(TURN_MARK_SELECTOR)).toHaveLength(3)
    expect(CSS).toContain(TURN_MARK_SELECTOR)
    expect(CSS).not.toContain("nav[aria-label='轮次导航']")
    expect(CSS).not.toContain("[aria-label^='跳转到第']")
    expect(CSS).toMatch(
      /\[data-phase='active'\]\s*>\s*:has\(> \[data-conversation-scroll\]\)\s*>\s*\[data-width-handle='left'\]\[data-side='left'\]::after\s*,/s,
    )
    expect(CSS).not.toMatch(
      /\[data-phase='active'\]\s*>\s*\[data-width-handle=(?:'left'|'right')\]/,
    )
  })

  it('keeps every full-round Maid shape circular under the Alpha corner token', () => {
    expect(unpairedFullRoundRules(CSS)).toEqual([])
  })

  it('declares only the public rc.6 client manifest', () => {
    const manifest = JSON.parse(readFileSync(resolve(process.cwd(), 'package.json'), 'utf8'))
    expect(manifest.dsh.client).toEqual({ inject: [], platform: 'web' })
    expect(manifest).not.toHaveProperty('dshClient')
    expect(manifest.peerDependencies).toHaveProperty('@deepseek-ai/cordis', '^4.0.1')
  })

  it('sets the body attribute and retracts it on dispose', async () => {
    fiber = await mount()
    expect(document.body.hasAttribute('data-dsh-maid-atelier')).toBe(true)
    await fiber.dispose()
    expect(document.body.hasAttribute('data-dsh-maid-atelier')).toBe(false)
  })

  it('registers cleanup before a later CSSOM initialization failure', () => {
    const disposers: Array<() => void> = []
    const ctx = {
      effect(factory: () => () => void): void {
        disposers.push(factory())
      },
    } as unknown as Context
    const insertRule = vi.spyOn(CSSStyleSheet.prototype, 'insertRule')
      .mockImplementationOnce(() => {
        throw new Error('fixture CSSOM failure')
      })

    expect(() => apply(ctx)).toThrow('fixture CSSOM failure')
    expect(disposers.length).toBeGreaterThan(0)
    for (const dispose of disposers.reverse()) dispose()

    expect(document.body.hasAttribute('data-dsh-maid-atelier')).toBe(false)
    expect(document.querySelector("[data-skin-owner='maid-atelier']")).toBeNull()
    insertRule.mockRestore()
  })

  it('colors the installed Web-app system controls navy and restores the presenter color', async () => {
    const meta = document.createElement('meta')
    meta.name = 'theme-color'
    meta.content = '#ffffff'
    document.head.append(meta)

    fiber = await mount()
    expect(document.head.querySelectorAll('meta[name="theme-color"]')).toHaveLength(1)
    expect(meta.content).toBe('#0b193f')

    meta.content = '#dce6f5'
    await flushMutations()
    expect(meta.content).toBe('#0b193f')

    await fiber.dispose()
    expect(meta.content).toBe('#ffffff')
    meta.remove()
  })

  it('injects chrome and retracts every element on dispose', async () => {
    document.body.innerHTML = '<div class="fixture_centerCol"></div>'
    fiber = await mount()
    expect(document.body.querySelectorAll('[data-skin-chrome]').length).toBeGreaterThan(0)
    expect(document.body.querySelectorAll('[data-skin-trim-layer]')).toHaveLength(2)
    await fiber.dispose()
    expect(document.body.querySelectorAll('[data-skin-chrome]').length).toBe(0)
    expect(document.body.querySelectorAll('[data-skin-trim-layer]')).toHaveLength(0)
  })

  it('does not remove a foreign node that happens to reuse the owner marker', async () => {
    fiber = await mount()
    const foreign = document.createElement('div')
    foreign.dataset.skinOwner = 'maid-atelier'
    document.body.append(foreign)

    await fiber.dispose()
    expect(foreign.isConnected).toBe(true)
    foreign.remove()
  })

  it('keeps the mascot independent and leaves the native vector brand intact', async () => {
    document.body.innerHTML = `
      <div class="AppFrame_sidebarCol">
        <div>
          <div class="fixture_logoRow">
            <button class="fixture_brand"><svg aria-hidden="true"></svg></button>
          </div>
        </div>
      </div>
    `
    fiber = await mount()

    const mascot = document.querySelector<HTMLImageElement>("[data-skin-chrome='sidebar-mascot']")
    expect(mascot?.src).toContain('/skin-assets/maid-atelier/')
    const corners = document.querySelector("[data-skin-chrome='sidebar-corners']")
    expect(corners?.querySelectorAll('[data-skin-corner]')).toHaveLength(4)
    const brand = document.querySelector("button[class*='brand'] > svg")
    expect(brand).not.toBeNull()
    expect(document.querySelector("[data-skin-chrome='brand-lockup']")).toBeNull()

    await fiber.dispose()
    expect(document.querySelector("[data-skin-owner='maid-atelier']")).toBeNull()
  })

  it('decorates a sidebar mounted after the skin', async () => {
    fiber = await mount()
    document.body.insertAdjacentHTML(
      'beforeend',
      '<div class="AppFrame_sidebarCol"><div><button class="fixture_brand"><svg></svg></button></div></div>',
    )
    await flushMutations()

    expect(document.querySelector("[data-skin-chrome='sidebar-mascot']")).not.toBeNull()
    expect(document.querySelector("button[class*='brand'] > svg")).not.toBeNull()
    expect(document.querySelector("[data-skin-chrome='brand-lockup']")).toBeNull()
  })

  it('does not rescan the sidebar when ordinary conversation content changes', async () => {
    document.body.innerHTML = `
      <div class="AppFrame_sidebarCol"><div></div></div>
      <main data-phase="active"></main>
    `
    fiber = await mount()
    const sidebar = document.querySelector<HTMLElement>("[class*='sidebarCol']")!
    const querySelectorAll = vi.spyOn(sidebar, 'querySelectorAll')
    const querySelector = vi.spyOn(document, 'querySelector')

    document.querySelector('main')!.append(document.createElement('article'))
    await flushMutations()

    expect(querySelectorAll).not.toHaveBeenCalled()
    expect(querySelector).not.toHaveBeenCalledWith(
      "[data-slot='sidebar.settings'] > :is(button, [role='button'])[aria-expanded='true']",
    )
  })

  it('projects relational page state onto skin-owned attributes', async () => {
    document.body.innerHTML = `
      <header><div role="tablist"></div></header>
      <main data-phase="active"><div data-chat-flow></div></main>
      <div data-cordis-panel></div>
      <div data-slot="sidebar.settings"><div role="dialog" aria-modal="true"></div></div>
    `
    fiber = await mount()

    expect(document.body.hasAttribute('data-maid-chat-active')).toBe(true)
    expect(document.body.hasAttribute('data-maid-conversation-active')).toBe(true)
    expect(document.body.hasAttribute('data-maid-workspace')).toBe(true)
    expect(document.body.hasAttribute('data-maid-cordis-panel-open')).toBe(true)
    expect(document.body.hasAttribute('data-maid-settings-open')).toBe(true)

    document.querySelector('header')!.remove()
    document.querySelector('main')!.remove()
    document.querySelector('[data-cordis-panel]')!.remove()
    document.querySelector('[data-slot="sidebar.settings"] [role="dialog"]')!.remove()
    await flushMutations()

    expect(document.body.hasAttribute('data-maid-chat-active')).toBe(false)
    expect(document.body.hasAttribute('data-maid-conversation-active')).toBe(false)
    expect(document.body.hasAttribute('data-maid-workspace')).toBe(false)
    expect(document.body.hasAttribute('data-maid-cordis-panel-open')).toBe(false)
    expect(document.body.hasAttribute('data-maid-settings-open')).toBe(false)

    await fiber.dispose()
  })

  it('projects the keyed panel page and tags the settings portal mask without :has()', async () => {
    document.body.innerHTML = `
      <div data-slot="main" style="display: contents">
        <div data-slot="main.conversation" style="display: contents"><main data-phase="hero"></main></div>
      </div>
    `
    fiber = await mount()
    const main = document.querySelector<HTMLElement>("[data-slot='main']")!
    expect(document.body.hasAttribute('data-maid-panel-page')).toBe(false)

    // A keyed panel page is the outlet's direct child, beside no conversation slot.
    main.innerHTML = '<section data-plugin-panel></section>'
    await flushMutations()
    expect(document.body.hasAttribute('data-maid-panel-page')).toBe(true)

    main.innerHTML = '<div data-slot="main.conversation" style="display: contents"><main data-phase="active"></main></div>'
    await flushMutations()
    expect(document.body.hasAttribute('data-maid-panel-page')).toBe(false)

    // rc.2 portals the settings dialog to <body> inside a presentation mask; only
    // that direct body child is tagged, and the tag leaves with the dialog.
    const mask = document.createElement('div')
    mask.setAttribute('role', 'presentation')
    mask.innerHTML = '<div role="dialog" aria-modal="true" data-shortcut-modal="settings"></div>'
    document.body.append(mask)
    const unrelated = document.createElement('div')
    unrelated.setAttribute('role', 'presentation')
    unrelated.innerHTML = '<div role="dialog" aria-modal="true" data-shortcut-modal="shortcuts"></div>'
    document.body.append(unrelated)
    await flushMutations()
    expect(mask.hasAttribute('data-maid-settings-overlay')).toBe(true)
    expect(unrelated.hasAttribute('data-maid-settings-overlay')).toBe(false)

    mask.remove()
    await flushMutations()
    expect(document.querySelector('[data-maid-settings-overlay]')).toBeNull()

    document.body.append(mask)
    await flushMutations()
    expect(mask.hasAttribute('data-maid-settings-overlay')).toBe(true)
    await fiber.dispose()
    expect(mask.hasAttribute('data-maid-settings-overlay')).toBe(false)
    expect(document.body.hasAttribute('data-maid-panel-page')).toBe(false)
  })

  it('keeps :has() probes out of the settings portal and panel-page rules', () => {
    // Each of these was a :has() evaluated on every style pass; measured on a
    // 1500-row transcript they cost ~40ms of style recalculation on one
    // right-panel open. State now arrives as attributes the client projects.
    expect(CSS).not.toContain(":where(:has(> [role='dialog'][data-shortcut-modal='settings']))")
    expect(CSS).not.toContain(":not(:has([data-phase])):not(:has([data-slot^='conversation.']))")
  })

  it('restores pre-existing projected state attributes on dispose', async () => {
    document.body.setAttribute('data-maid-workspace', 'presenter')
    fiber = await mount()
    expect(document.body.hasAttribute('data-maid-workspace')).toBe(false)

    await fiber.dispose()
    expect(document.body.getAttribute('data-maid-workspace')).toBe('presenter')
    document.body.removeAttribute('data-maid-workspace')
  })

  it('ignores better-sidebar terminal row mutations', async () => {
    document.body.innerHTML = `
      <div data-dsh-better-sidebar><div class="xterm"><span data-terminal-row></span></div></div>
    `
    fiber = await mount()
    await flushMutations()
    // The viewport watcher's first frame is scheduled at mount; let it land
    // before measuring so only the terminal mutation is observed.
    await new Promise(resolve => requestAnimationFrame(resolve))
    const querySelector = vi.spyOn(document, 'querySelector')

    document.querySelector('[data-terminal-row]')!.textContent = 'x'.repeat(32)
    querySelector.mockClear()
    await flushMutations()

    expect(querySelector).not.toHaveBeenCalled()
  })

  it('uses the public desktop frame marker without a private window global', async () => {
    document.body.innerHTML = '<div class="fixture_frame" data-desktop></div>'
    fiber = await mount()

    const sheet = document.querySelector<HTMLStyleElement>(
      "style[data-skin-chrome='sidebar-width-rule']",
    )!.sheet!
    const variables = sheet.cssRules[1] as CSSStyleRule
    expect(variables.style.getPropertyValue('--maid-titlebar-height')).toBe('32px')
  })

  it('seats a sidebar frame copy beneath the open settings mask', async () => {
    document.body.innerHTML = `
      <div class="AppFrame_sidebarCol">
        <div>
          <div><div data-slot="sidebar.settings"><button aria-expanded="false">Settings</button></div></div>
        </div>
      </div>
    `
    fiber = await mount()
    const settingsSlot = document.querySelector<HTMLElement>("[data-slot='sidebar.settings']")!
    // DSH 0.1.7-rc.1 SettingsPanel: the overlay mounts inside the settings slot,
    // holding the mask and the dialog as siblings.
    const overlay = document.createElement('div')
    overlay.setAttribute('role', 'presentation')
    const mask = document.createElement('div')
    mask.className = 'fixture_mask'
    const dialog = document.createElement('div')
    dialog.setAttribute('role', 'dialog')
    dialog.setAttribute('aria-modal', 'true')
    overlay.append(mask, dialog)
    settingsSlot.append(overlay)
    await flushMutations()

    const copy = document.querySelector<HTMLElement>('[data-maid-settings-backdrop-frame]')
    expect(copy?.parentElement).toBe(overlay)
    expect(copy?.nextElementSibling).toBe(mask)
    expect(copy?.querySelectorAll('[data-skin-corner]')).toHaveLength(4)
    expect(document.body.hasAttribute('data-maid-settings-in-sidebar')).toBe(true)

    overlay.remove()
    await flushMutations()
    expect(document.querySelector('[data-maid-settings-backdrop-frame]')).toBeNull()
    expect(document.body.hasAttribute('data-maid-settings-in-sidebar')).toBe(false)
  })

  it('follows the DSH 0.1.7-rc.2 settings panel portaled beside #root without slot workarounds', async () => {
    document.body.innerHTML = `
      <div class="AppFrame_sidebarCol">
        <div>
          <div><div data-slot="sidebar.settings"><button aria-expanded="false">Settings</button></div></div>
        </div>
      </div>
    `
    fiber = await mount()
    // A body-level modal of the same shape opened first must not take the frame.
    const shortcuts = document.createElement('div')
    shortcuts.setAttribute('role', 'presentation')
    shortcuts.innerHTML = '<div class="fixture_mask"></div><div role="dialog" aria-modal="true" data-shortcut-modal="shortcuts"></div>'
    document.body.append(shortcuts)
    // rc.2 SettingsRoot: createPortal(overlay, document.body) with the panel
    // named by `data-shortcut-modal="settings"`.
    const overlay = document.createElement('div')
    overlay.setAttribute('role', 'presentation')
    const mask = document.createElement('div')
    mask.className = 'fixture_mask'
    const dialog = document.createElement('div')
    dialog.setAttribute('role', 'dialog')
    dialog.setAttribute('aria-modal', 'true')
    dialog.dataset.shortcutModal = 'settings'
    overlay.append(mask, dialog)
    document.body.append(overlay)
    await flushMutations()

    expect(document.body.hasAttribute('data-maid-settings-open')).toBe(true)
    // The portal is outside the sidebar tree: none of the slot-containment
    // workarounds (frame copy, overflow and stacking releases) apply. A
    // viewport-anchored copy drew a second frame above the Windows caption.
    expect(document.body.hasAttribute('data-maid-settings-in-sidebar')).toBe(false)
    expect(document.querySelector('[data-maid-settings-backdrop-frame]')).toBeNull()

    overlay.remove()
    await flushMutations()
    expect(document.body.hasAttribute('data-maid-settings-open')).toBe(false)
    shortcuts.remove()
  })

  it('anchors the public rc.6 settings slot to the real sidebar footer', async () => {
    document.body.innerHTML = `
      <div class="AppFrame_sidebarCol">
        <div>
          <div class="fixture_footArea fixture_header"></div>
          <div class="fixture_footer">
            <div data-slot="sidebar.footer.action"></div>
            <div><div data-slot="sidebar.settings" style="display: contents">
              <button><div data-slot="settings.trigger">设置</div></button>
            </div></div>
          </div>
        </div>
      </div>
    `
    fiber = await mount()

    expect(document.querySelector('.fixture_header')?.hasAttribute('data-maid-sidebar-footer')).toBe(false)
    expect(document.querySelector('.fixture_footer')?.hasAttribute('data-maid-sidebar-footer')).toBe(true)

    await fiber.dispose()
    expect(document.querySelector('[data-maid-sidebar-footer]')).toBeNull()
  })

  it('marks the active workspace group and its session tree, then retracts every hook', async () => {
    document.body.innerHTML = `
      <div class="AppFrame_sidebarCol">
        <div>
          <div role="tree">
            <div role="treeitem" aria-expanded="false"><span class="fixture_folder"></span></div>
            <div role="treeitem" aria-expanded="true"><span class="fixture_folder"></span></div>
            <div role="treeitem" aria-selected="true"><span class="fixture_title">Current</span></div>
            <div role="treeitem" aria-selected="false"><span class="fixture_title">Other</span></div>
          </div>
        </div>
      </div>
    `
    fiber = await mount()

    const workspace = document.querySelectorAll<HTMLElement>("[role='treeitem'][aria-expanded]")[1]!
    const group = workspace.parentElement!
    const sessions = group.querySelectorAll<HTMLElement>("[role='treeitem'][aria-selected]")
    expect(group.hasAttribute('data-maid-workspace-group')).toBe(true)
    expect(workspace.hasAttribute('data-maid-workspace-row')).toBe(true)
    expect(workspace.hasAttribute('data-maid-workspace-active')).toBe(true)
    expect([...sessions].every(session => session.hasAttribute('data-maid-session-row'))).toBe(true)
    expect(sessions[0]!.hasAttribute('data-maid-session-first')).toBe(true)
    expect(sessions[1]!.hasAttribute('data-maid-session-last')).toBe(true)

    sessions[0]!.setAttribute('aria-selected', 'false')
    await flushMutations()
    expect(workspace.hasAttribute('data-maid-workspace-active')).toBe(false)

    await fiber.dispose()
    expect(document.querySelector('[data-maid-workspace-group]')).toBeNull()
    expect(document.querySelector('[data-maid-workspace-row]')).toBeNull()
    expect(document.querySelector('[data-maid-session-row]')).toBeNull()
    expect(document.querySelector('[data-maid-session-first]')).toBeNull()
    expect(document.querySelector('[data-maid-session-last]')).toBeNull()
  })

  it('marks every Session row in the flat list without inventing a Workspace group', async () => {
    document.body.innerHTML = `
      <div class="AppFrame_sidebarCol">
        <div class="fixture_flatList" role="tree" aria-label="Sessions">
          <div role="treeitem" aria-selected="true"><span class="fixture_title">Current</span></div>
          <div role="treeitem" aria-selected="false"><span class="fixture_title">Other</span></div>
        </div>
      </div>
    `
    fiber = await mount()

    const sessions = document.querySelectorAll<HTMLElement>("[role='treeitem'][aria-selected]")
    expect([...sessions].every(session => session.hasAttribute('data-maid-session-row'))).toBe(true)
    expect([...sessions].every(session => session.hasAttribute('data-maid-session-flat'))).toBe(true)
    expect(document.querySelector('[data-maid-workspace-row]')).toBeNull()

    await fiber.dispose()
    expect(document.querySelector('[data-maid-session-flat]')).toBeNull()
  })

  it('pins the skin title and restores the original on dispose', async () => {
    document.title = 'original'
    fiber = await mount()
    expect(document.title).not.toBe('original')
    await fiber.dispose()
    expect(document.title).toBe('original')
  })

  it('installs the palace through a skin-owned variable and restores prior body styles', async () => {
    document.body.style.setProperty('--maid-palace-art', 'legacy')
    fiber = await mount()
    expect(document.body.style.getPropertyValue('--maid-palace-art')).toContain('/skin-assets/maid-atelier/')
    expect(document.body.style.getPropertyValue('--maid-palace-art')).not.toContain('linear-gradient')
    // The palace is no longer painted on body: the conversation-column stage
    // owns it (see the character-stage rule), so body carries only the custom
    // property consumed by that stage.
    expect(document.body.style.backgroundImage).toBe('')
    await fiber.dispose()
    expect(document.body.style.getPropertyValue('--maid-palace-art')).toBe('legacy')
  })

  it('seats the character stage inside the conversation column', async () => {
    document.body.innerHTML = '<div class="fixture_centerCol"></div>'
    fiber = await mount()
    const stage = document.querySelector<HTMLElement>("[data-skin-chrome='character-stage']")
    const topTrim = document.querySelector<HTMLElement>("[data-skin-chrome='top-trim']")
    const bottomTrim = document.querySelector<HTMLElement>("[data-skin-chrome='bottom-trim']")
    expect(stage?.parentElement?.className).toBe('fixture_centerCol')
    expect(topTrim?.parentElement?.className).toBe('fixture_centerCol')
    expect(bottomTrim?.parentElement?.className).toBe('fixture_centerCol')
    // Palace + maids are one owned layer retracted on dispose.
    await fiber.dispose()
    expect(document.querySelector("[data-skin-chrome='character-stage']")).toBeNull()
    expect(document.querySelector("[data-skin-chrome='top-trim']")).toBeNull()
    expect(document.querySelector("[data-skin-chrome='bottom-trim']")).toBeNull()
  })

  it('retries seating the character stage when the conversation column mounts later', async () => {
    fiber = await mount()
    expect(document.querySelector("[data-skin-chrome='character-stage']")).toBeNull()

    document.body.insertAdjacentHTML('beforeend', '<div class="fixture_centerCol"></div>')
    await flushMutations()

    const stage = document.querySelector<HTMLElement>("[data-skin-chrome='character-stage']")
    const topTrim = document.querySelector<HTMLElement>("[data-skin-chrome='top-trim']")
    const bottomTrim = document.querySelector<HTMLElement>("[data-skin-chrome='bottom-trim']")
    expect(stage?.parentElement?.className).toBe('fixture_centerCol')
    expect(topTrim?.parentElement?.className).toBe('fixture_centerCol')
    expect(bottomTrim?.parentElement?.className).toBe('fixture_centerCol')
  })

  it('keeps each overlapping activation in ownership of its own character stage', async () => {
    const originalBodyStyle = document.body.getAttribute('style')
    document.body.innerHTML = '<div class="fixture_centerCol"></div>'
    const first = await mount()
    const second = await mount()
    try {
      expect(document.querySelectorAll("[data-skin-chrome='character-stage']")).toHaveLength(2)

      await first.dispose()
      const stage = document.querySelector<HTMLElement>("[data-skin-chrome='character-stage']")
      expect(stage?.parentElement?.className).toBe('fixture_centerCol')
      expect(document.querySelectorAll("[data-skin-chrome='character-stage']")).toHaveLength(1)
    } finally {
      await first.dispose()
      await second.dispose()
      if (originalBodyStyle === null) document.body.removeAttribute('style')
      else document.body.setAttribute('style', originalBodyStyle)
    }
  })

  it('keeps all original-resolution character variants independent from the palace backdrop', async () => {
    document.body.innerHTML = '<div class="fixture_centerCol"></div>'
    fiber = await mount()
    const stage = document.querySelector("[data-skin-chrome='character-stage']")
    const characters = stage?.querySelectorAll<HTMLImageElement>('[data-maid-character]')
    expect(characters).toHaveLength(3)
    expect(characters?.[0]?.dataset.maidCharacter).toBe('left')
    expect(characters?.[1]?.dataset.maidCharacter).toBe('right')
    expect(characters?.[2]?.dataset.maidCharacter).toBe('vision')
    expect([...characters ?? []].every(character => character.src.includes('/skin-assets/maid-atelier/'))).toBe(true)
    await fiber.dispose()
    expect(document.querySelector("[data-skin-chrome='character-stage']")).toBeNull()
  }, 10_000)

  it('follows live viewport resizing without transition lag and restores the marker', async () => {
    fiber = await mount()
    const resizeRule = CSS.match(
      /\[data-maid-layout-resizing\]\s*\[data-maid-character\]\s*\{([^}]*)\}/s,
    )?.[1] ?? ''
    expect(resizeRule).toContain('transition: none')
    // The filters stay through the resize: the sidebar toggle holds this
    // marker, and dropping them flashed the dark grade and the light halo.
    expect(resizeRule).not.toContain('filter')

    vi.useFakeTimers()
    try {
      window.dispatchEvent(new Event('resize'))
      expect(document.body.hasAttribute('data-maid-layout-resizing')).toBe(true)
      vi.advanceTimersByTime(120)
      expect(document.body.hasAttribute('data-maid-layout-resizing')).toBe(false)

      window.dispatchEvent(new Event('resize'))
      await fiber.dispose()
      fiber = undefined
      expect(document.body.hasAttribute('data-maid-layout-resizing')).toBe(false)
      window.dispatchEvent(new Event('resize'))
      expect(document.body.hasAttribute('data-maid-layout-resizing')).toBe(false)
    } finally {
      vi.useRealTimers()
    }
  })

  it('tracks conversation-column resizes (panel push) through the layout lease', async () => {
    let resize: ResizeObserverCallback | undefined
    const observed = new Set<Element>()
    vi.stubGlobal('ResizeObserver', class {
      constructor(callback: ResizeObserverCallback) {
        resize = callback
      }

      observe(target: Element): void { observed.add(target) }
      unobserve(target: Element): void { observed.delete(target) }
      disconnect(): void { observed.clear() }
    })
    document.body.innerHTML = '<div class="fixture_centerCol"></div>'

    vi.useFakeTimers()
    try {
      fiber = await mount()
      const chat = document.querySelector<HTMLElement>('.fixture_centerCol')!
      expect(observed.has(chat)).toBe(true)
      // The layout lease must also fire when only the chat area moves —
      // workbench panels push it without a window resize.
      resize?.([
        { target: chat, contentRect: { width: 800, height: 600 } } as ResizeObserverEntry,
      ], {} as ResizeObserver)
      await Promise.resolve()
      expect(document.body.hasAttribute('data-maid-layout-resizing')).toBe(true)
      vi.advanceTimersByTime(120)
      expect(document.body.hasAttribute('data-maid-layout-resizing')).toBe(false)
    } finally {
      vi.useRealTimers()
    }
  })

  it('uses a CPU-safe character path without accelerated WebGL and restores overrides', async () => {
    fiber = await mount()
    const lowPowerRule = CSS.match(
      /\[data-maid-low-power\]\s*\[data-maid-character\]\s*\{([^}]*)\}/s,
    )?.[1] ?? ''
    expect(document.body.hasAttribute('data-maid-low-power')).toBe(true)
    expect(lowPowerRule).toContain('filter: none')
    expect(lowPowerRule).toContain('transition: opacity 180ms ease')

    await fiber.dispose()
    fiber = undefined
    expect(document.body.hasAttribute('data-maid-low-power')).toBe(false)

    document.body.setAttribute('data-maid-low-power', 'manual')
    fiber = await mount()
    await fiber.dispose()
    fiber = undefined
    expect(document.body.getAttribute('data-maid-low-power')).toBe('manual')
    document.body.removeAttribute('data-maid-low-power')
  })

  it('keeps resize and low-power markers owned across overlapping activations', async () => {
    const originalBodyStyle = document.body.getAttribute('style')
    const first = await mount()
    const second = await mount()
    vi.useFakeTimers()
    try {
      window.dispatchEvent(new Event('resize'))
      expect(document.body.hasAttribute('data-maid-layout-resizing')).toBe(true)
      expect(document.body.hasAttribute('data-maid-low-power')).toBe(true)

      await first.dispose()
      expect(document.body.hasAttribute('data-maid-layout-resizing')).toBe(true)
      expect(document.body.hasAttribute('data-maid-low-power')).toBe(true)

      vi.advanceTimersByTime(120)
      expect(document.body.hasAttribute('data-maid-layout-resizing')).toBe(false)
      expect(document.body.hasAttribute('data-maid-low-power')).toBe(true)

      await second.dispose()
      expect(document.body.hasAttribute('data-maid-low-power')).toBe(false)
    } finally {
      await first.dispose()
      await second.dispose()
      if (originalBodyStyle === null) document.body.removeAttribute('style')
      else document.body.setAttribute('style', originalBodyStyle)
      vi.useRealTimers()
    }
  })

  it('keeps full character effects when accelerated WebGL is available', async () => {
    vi.stubGlobal('WebGLRenderingContext', class WebGLRenderingContext {})
    const loseContext = vi.fn()
    const getContext = vi.spyOn(HTMLCanvasElement.prototype, 'getContext')
      .mockReturnValue({
        getExtension: () => ({ loseContext }),
      } as unknown as WebGL2RenderingContext)
    try {
      fiber = await mount()
      expect(document.body.hasAttribute('data-maid-low-power')).toBe(false)
      expect(getContext).toHaveBeenCalledWith('webgl2', {
        failIfMajorPerformanceCaveat: true,
      })
      expect(loseContext).toHaveBeenCalledOnce()
    } finally {
      getContext.mockRestore()
    }
  })

  it('installs and restores the raster control plates', async () => {
    document.body.innerHTML = '<div data-composer-card></div>'
    document.body.style.setProperty('--maid-new-session-art', 'legacy')
    document.body.style.setProperty('--maid-workspace-ribbon-art', 'legacy-ribbon')
    fiber = await mount()
    expect(document.body.style.getPropertyValue('--maid-top-trim-art')).toContain('/skin-assets/maid-atelier/')
    expect(document.body.style.getPropertyValue('--maid-bottom-trim-art')).toContain('/skin-assets/maid-atelier/')
    expect(document.body.style.getPropertyValue('--maid-bottom-crest-art')).toContain('/skin-assets/maid-atelier/')
    expect(document.body.style.getPropertyValue('--maid-bow-art')).toContain('/skin-assets/maid-atelier/')
    expect(document.body.style.getPropertyValue('--maid-new-session-art')).toContain('/skin-assets/maid-atelier/')
    expect(document.body.style.getPropertyValue('--maid-sidebar-swag-art')).toContain('/skin-assets/maid-atelier/')
    expect(document.body.style.getPropertyValue('--maid-sidebar-corner-art')).toContain('/skin-assets/maid-atelier/')
    expect(document.body.style.getPropertyValue('--maid-composer-frame-art')).toContain('/skin-assets/maid-atelier/')
    expect(document.body.style.getPropertyValue('--maid-composer-ribbon-left-cap-art')).toContain('/skin-assets/maid-atelier/')
    expect(document.body.style.getPropertyValue('--maid-composer-ribbon-left-fill-art')).toContain('/skin-assets/maid-atelier/')
    expect(document.body.style.getPropertyValue('--maid-composer-ribbon-right-fill-art')).toContain('/skin-assets/maid-atelier/')
    expect(document.body.style.getPropertyValue('--maid-composer-ribbon-right-cap-art')).toContain('/skin-assets/maid-atelier/')
    expect(document.body.style.getPropertyValue('--maid-composer-lace-art')).toContain('/skin-assets/maid-atelier/')
    expect(document.querySelector("[data-composer-card] > [data-skin-chrome='composer-lace']")).not.toBeNull()
    expect(document.querySelector('[data-maid-composer-lace-center]')).not.toBeNull()
    expect(document.body.style.getPropertyValue('--maid-settings-frame-art')).toContain('/skin-assets/maid-atelier/')
    expect(document.body.style.getPropertyValue('--maid-workspace-crest-art')).toContain('/skin-assets/maid-atelier/')
    expect(document.body.style.getPropertyValue('--maid-workspace-ribbon-art')).toContain('/skin-assets/maid-atelier/')
    expect(document.querySelector("[data-skin-ornament='crest']")).toBeNull()
    await fiber.dispose()
    expect(document.body.style.getPropertyValue('--maid-top-trim-art')).toBe('')
    expect(document.body.style.getPropertyValue('--maid-bottom-trim-art')).toBe('')
    expect(document.body.style.getPropertyValue('--maid-bottom-crest-art')).toBe('')
    expect(document.body.style.getPropertyValue('--maid-bow-art')).toBe('')
    expect(document.body.style.getPropertyValue('--maid-new-session-art')).toBe('legacy')
    expect(document.body.style.getPropertyValue('--maid-sidebar-swag-art')).toBe('')
    expect(document.body.style.getPropertyValue('--maid-sidebar-corner-art')).toBe('')
    expect(document.body.style.getPropertyValue('--maid-composer-frame-art')).toBe('')
    expect(document.body.style.getPropertyValue('--maid-composer-ribbon-left-cap-art')).toBe('')
    expect(document.body.style.getPropertyValue('--maid-composer-ribbon-left-fill-art')).toBe('')
    expect(document.body.style.getPropertyValue('--maid-composer-ribbon-right-fill-art')).toBe('')
    expect(document.body.style.getPropertyValue('--maid-composer-ribbon-right-cap-art')).toBe('')
    expect(document.body.style.getPropertyValue('--maid-composer-lace-art')).toBe('')
    expect(document.querySelector("[data-skin-chrome='composer-lace']")).toBeNull()
    expect(document.querySelector('[data-maid-composer-lace-center]')).toBeNull()
    expect(document.body.style.getPropertyValue('--maid-settings-frame-art')).toBe('')
    expect(document.body.style.getPropertyValue('--maid-workspace-crest-art')).toBe('')
    expect(document.body.style.getPropertyValue('--maid-workspace-ribbon-art')).toBe('legacy-ribbon')
  })

  it('overlaps the composer backing plate beneath the hollow raster frame', () => {
    const backingRule = [...CSS.matchAll(/\[data-composer-card\]::after\s*\{([^}]*)\}/g)]
      .map(match => match[1] ?? '')
      .find(rule => rule.includes("content: ''")) ?? ''
    expect(backingRule).toContain("content: ''")
    expect(backingRule).toContain('inset: 4px -8px -10px')
    expect(backingRule).toContain('background: var(--maid-composer-surface)')
    expect(backingRule).toContain('pointer-events: none')
    // The plate must stay behind in-flow children: the attachments slot is
    // display: contents (no box to lift), so its rail only wins if the plate
    // is a negative layer, not z-index: 0.
    expect(backingRule).toContain('z-index: -1')
    expect(backingRule).not.toContain('z-index: 0')
  })

  it('lifts the attachments slot content above the composer decorations', () => {
    const slotRule = CSS.match(
      /\[data-composer-card\]\s*> \[data-slot='conversation\.input\.attachments'\]\s*> :not\(\[class\*='mask'\]\)\s*\{([^}]*)\}/s,
    )?.[1] ?? ''
    const childLiftRule = CSS.match(
      /\[data-composer-card\] > \*\s*\{([^}]*)\}/s,
    )?.[1] ?? ''
    expect(childLiftRule).toContain('z-index: 2')
    // The slot emits no box (display: contents), so its rail must be lifted
    // explicitly to the same tier as the editor/toolbar row.
    expect(slotRule).toContain('position: relative')
    expect(slotRule).toContain('z-index: 2')
    // The drag overlay is position: fixed; the lift must not reach it.
    expect(CSS).toMatch(
      /\[data-composer-card\]\s*> \[data-slot='conversation\.input\.attachments'\]\s*> :not\(\[class\*='mask'\]\)\s*\{[^}]*z-index: 2/s,
    )
  })

  it('masks transcript content without duplicating character art', () => {
    const seatRule = CSS.match(
      /\[data-phase='active'\]\s*\[data-composer-seat\]\s*\{([^}]*)\}/s,
    )?.[1] ?? ''
    expect(seatRule).toContain('--dsw-alias-bg-base: transparent')
    expect(seatRule).toContain('background: none')
    expect(CSS).not.toContain("[data-skin-chrome='character-stage']::before")
    expect(CSS).toMatch(/\[data-maid-character\]\s*\{[^}]*z-index: 1/s)
    expect(CSS).not.toContain('left: -82px')
    expect(CSS).not.toContain('right: -82px')
    expect(CSS).not.toContain('--maid-character-left-art')
    expect(CSS).not.toContain('--maid-character-right-art')
    expect(CSS).not.toContain('maidAtelierComposerBackdropDock')
    expect(CSS).not.toContain('[data-composer-seat]::before')
  })

  it('recolors the native vector wordmark without replacing it with raster art', () => {
    expect(CSS).toMatch(/button\[class\*='brand'\]\s*\{[^}]*color: #f3e3c0/s)
    expect(CSS).toMatch(/button\[class\*='brand'\]\s*\{[^}]*--dsw-alias-label-primary-inverted: #10204d/s)
    expect(CSS).toMatch(/button\[class\*='brand'\] > svg\s*\{[^}]*width: min\(182px, 100%\)/s)
    expect(CSS).toMatch(/button\[class\*='brand'\] > svg > rect\s*\{[^}]*fill: #d7b46a/s)
    expect(CSS).not.toContain("[data-skin-chrome='brand-lockup']")
  })

  it('keeps question and todo copy paired with readable skin surfaces', () => {
    expect(CSS).toMatch(/\[data-question-key\]\s*\{[^}]*--dsw-alias-label-primary: #142044/s)
    expect(CSS).toMatch(/\[data-question-key\] > section\s*\{[^}]*rgba\(255, 254, 250, 0\.97\)/s)
    expect(CSS).toMatch(/\[data-question-key\] \[aria-checked='true'\]\s*\{[^}]*background: linear-gradient/s)
    expect(CSS).toMatch(/\[data-ds-dark-theme\] \[data-question-key\]\s*\{[^}]*--dsw-alias-label-primary: #edf1fa/s)
    expect(CSS).toMatch(/\[data-ds-dark-theme\] \[data-question-key\] > section\s*\{[^}]*rgba\(19, 35, 76, 0\.98\)/s)
    expect(CSS).toMatch(/\[data-ds-dark-theme\] \[data-question-key\] \[aria-checked='true'\]\s*\{[^}]*rgba\(74, 99, 163, 0\.5\)/s)
    expect(CSS).toMatch(/:is\(\[data-testid='todo-panel'\], \[data-goal-bar\] > div, \[data-queue-dock\] > div\)\s*\{[^}]*--dsw-alias-label-primary: #172347/s)
    expect(CSS).toMatch(/\[data-ds-dark-theme\] :is\(\[data-testid='todo-panel'\], \[data-goal-bar\] > div, \[data-queue-dock\] > div\)\s*\{[^}]*--dsw-alias-label-primary: #f4ead3/s)
  })

  it('aligns docked composer controls and paints context usage gold over blue', () => {
    expect(CSS).toMatch(/\[data-phase='active'\] \[data-composer-card\] > \[class\*='row'\]\s*\{[^}]*padding: 2px 14px 10px/s)
    expect(CSS).toMatch(/button\[class\*='add'\][\s\S]*?width: 38px[\s\S]*?border-radius: 50%/)
    expect(CSS).toMatch(/\[class\*='modes'\] button\[class\*='trigger'\]:has\(\[class\*='triggerIcon'\]\)/)
    expect(CSS).toMatch(/button\[class\$='_trigger'\]\[aria-haspopup='dialog'\]:has\(> svg circle\[class\$='_fill'\]\)\s*circle\[class\$='_track'\]\s*\{[^}]*stroke: #4d6bab/s)
    expect(CSS).toMatch(/button\[class\$='_trigger'\]\[aria-haspopup='dialog'\]:has\(> svg circle\[class\$='_track'\]\)\s*circle\[class\$='_fill'\]\s*\{[^}]*stroke: #d3a957/s)
    expect(CSS).toMatch(/\[role='dialog'\] \[class\$='_header'\][\s\S]*?color: #172347/)
    expect(CSS).toMatch(/\[class\*='triggerEffort'\]\s*\{[^}]*color: #a77c36/s)
  })

  it('anchors the model-menu rules to the native input.model seat', () => {
    expect(CSS).toMatch(/\[data-composer-card\]:has\(\s*\[data-slot='conversation\.input\.model'\][\s\S]*?\[aria-expanded='true'\]\s*\+ \[role='menu'\]\[class\$='_menu'\]\s*\)\s*\{[^}]*backdrop-filter: none/s)
    expect(CSS).toMatch(/\[data-composer-card\]\s*\[data-slot='conversation\.input\.model'\]\s*\[class\$='_root'\]:has\(> button\[class\$='_trigger'\]\[aria-haspopup='menu'\]\)\s*> \[role='menu'\]\[class\$='_menu'\]\s*\{[^}]*backdrop-filter: none/s)
  })

  it('composes one scale-owned composer frame across hero and workspace widths', () => {
    const frameRule = CSS.match(/\[data-composer-card\]::before\s*\{([^}]*)\}/s)?.[1] ?? ''
    const activeCardRule = CSS.match(
      /\[data-phase='active'\] \[data-composer-card\]\s*\{([^}]*)\}/s,
    )?.[1] ?? ''
    expect(activeCardRule).toContain(
      'max-width: min(100%, max(720px, var(--dsh-composer-card-max-width)))',
    )
    expect(frameRule).toContain('inset: -20px -14px -18px')
    expect(frameRule).toContain('z-index: 1')
    expect(frameRule).toContain('var(--maid-bow-art)')
    expect(frameRule).toContain('var(--maid-composer-ribbon-left-cap-art)')
    expect(frameRule).toContain('var(--maid-composer-ribbon-left-fill-art)')
    expect(frameRule).toContain('var(--maid-composer-ribbon-right-fill-art)')
    expect(frameRule).toContain('var(--maid-composer-ribbon-right-cap-art)')
    expect(frameRule).not.toContain('var(--maid-composer-lace-art)')
    expect(frameRule).toContain('left 54px top')
    expect(frameRule).toContain('right 54px top')
    expect(frameRule).toContain('left 156px top')
    expect(frameRule).toContain('right 156px top')
    expect(frameRule).toContain('max(0px, calc(50% - 186px)) 32px')
    expect(frameRule).toContain('background-repeat: no-repeat')
    expect(frameRule).toContain('border-width: 72px 54px 52px')
    expect(frameRule).toContain('border-image-source: var(--maid-composer-frame-art)')
    expect(frameRule).toContain('border-image-slice: 170 120 115 120')
    expect(frameRule).toContain('border-image-width: 72px 54px 52px 54px')
    expect(frameRule).toContain('border-image-repeat: stretch')
    expect(frameRule).not.toContain('100% 100%')
    expect(CSS).toMatch(
      /\[data-skin-chrome='composer-lace'\]::before\s*\{[^}]*left: 54px[^}]*var\(--maid-composer-lace-art\)[^}]*background-position: left top/s,
    )
    expect(CSS).toMatch(
      /\[data-skin-chrome='composer-lace'\]::after\s*\{[^}]*right: 54px[^}]*var\(--maid-composer-lace-art\)[^}]*background-position: right top/s,
    )
    expect(CSS).toMatch(
      /\[data-skin-chrome='composer-lace'\]::before,[\s\S]*?\[data-skin-chrome='composer-lace'\]::after\s*\{[^}]*width: max\(0px, calc\(50% - 81px\)\)/s,
    )
    expect(CSS).toMatch(
      /\[data-maid-composer-lace-center\]\s*\{[^}]*left: calc\(50% - 27px\)[^}]*width: 54px[^}]*var\(--maid-composer-lace-art\)[^}]*background-position: center top[^}]*background-repeat: no-repeat/s,
    )
    expect(CSS).toMatch(
      /\[data-skin-chrome='composer-lace'\]::before,[\s\S]*?\[data-maid-composer-lace-center\]\s*\{[^}]*background-size: 54px 33px[^}]*background-repeat: repeat-x/s,
    )
    expect(CSS).not.toContain('max-width: min(100%, 720px)')
  })

  it('three-slices the new-session plate without stretching its ornamental ends', () => {
    const plateRule = CSS.match(/button\[class\*='newSession'\]\s*\{([^}]*)\}/s)?.[1] ?? ''
    const hoverRule = CSS.match(
      /button\[class\*='newSession'\]:hover\s*\{([^}]*)\}/s,
    )?.[1] ?? ''
    const collapsedRule = [...CSS.matchAll(/button\[class\*='newSession'\]\s*\{([^}]*)\}/g)]
      .map((match) => match[1] ?? '')
      .find((rule) => rule.includes('border-image: none')) ?? ''
    const narrowRule = [...CSS.matchAll(/button\[class\*='newSession'\]\s*\{([^}]*)\}/g)]
      .map((match) => match[1] ?? '')
      .find((rule) => rule.includes('border-image-width: 0 32px')) ?? ''
    expect(plateRule).toContain('border-image-source: var(--maid-new-session-art)')
    expect(plateRule).toContain('border-image-slice: 0 210 0 210 fill')
    expect(plateRule).toContain('border-image-width: 0 40px')
    expect(plateRule).toContain('border-image-repeat: stretch')
    expect(plateRule).not.toContain('100% 100%')
    expect(hoverRule).not.toContain('background:')
    expect(narrowRule).toContain('padding-inline: 0')
    expect(narrowRule).toContain('border-width: 0 32px')
    expect(collapsedRule).toContain('border-image: none')
  })

  it('uses dedicated circular controls on the collapsed sidebar rail', () => {
    const toggleRule = CSS.match(
      /\[class\*='logoRow'\] \[class\*='toggle'\]\s*\{([^}]*)\}/s,
    )?.[1] ?? ''
    const collapsedSessionIconRule = [...CSS.matchAll(
      /button\[class\*='newSession'\] svg\s*\{([^}]*)\}/g,
    )].map(match => match[1] ?? '').find(rule => rule.includes('#efd7a1')) ?? ''
    const collapsedFootRule = [...CSS.matchAll(
      /\[data-slot='sidebar\.settings'\][\s\S]*?button\[aria-haspopup='dialog'\]:has\(> \[data-slot='settings\.trigger'\]\)\s*\{([^}]*)\}/g,
    )].map(match => match[1] ?? '').find(rule => rule.includes('border-image: none')) ?? ''
    const collapsedSessionRule = [...CSS.matchAll(/button\[class\*='newSession'\]\s*\{([^}]*)\}/g)]
      .map(match => match[1] ?? '').find(rule => rule.includes('border-image: none')) ?? ''
    const collapsedFootAreaRule = [...CSS.matchAll(/\[data-maid-sidebar-footer\]\s*\{([^}]*)\}/g)]
      .map(match => match[1] ?? '').find(rule => rule.includes('display: flex')) ?? ''
    const sharedRailRule = CSS.match(
      /:is\(\s*\[class\*='logoRow'\] \[class\*='toggle'\],[\s\S]*?\[data-slot='sidebar\.settings'\] button\[aria-haspopup='dialog'\]:has\(> \[data-slot='settings\.trigger'\]\)\s*\)\s*\{([^}]*)\}/s,
    )?.[1] ?? ''
    const sharedRailHoverRule = CSS.match(
      /:is\(\s*\[class\*='logoRow'\] \[class\*='toggle'\],[\s\S]*?\[data-slot='sidebar\.settings'\] button\[aria-haspopup='dialog'\]:has\(> \[data-slot='settings\.trigger'\]\)\s*\):is\(:hover, :focus-visible\)\s*\{([^}]*)\}/s,
    )?.[1] ?? ''
    expect(toggleRule).toContain('border-radius: 50%')
    expect(sharedRailRule).toContain('width: var(--maid-rail-control-size)')
    expect(sharedRailRule).toContain('height: var(--maid-rail-control-size)')
    expect(sharedRailRule).toContain('flex: 0 0 var(--maid-rail-control-size)')
    expect(sharedRailRule).toContain('border-image: none')
    expect(sharedRailRule).toContain('overflow: visible')
    expect(sharedRailHoverRule).toContain('transform: none')
    expect(collapsedSessionIconRule).toContain('color: #efd7a1')
    expect(collapsedSessionRule).toContain('align-self: center')
    expect(collapsedSessionRule).toContain('margin: 6px 0 10px')
    expect(collapsedFootAreaRule).toContain('justify-content: center')
    expect(collapsedFootRule).toContain('width: 38px')
    expect(collapsedFootRule).toContain('margin: 0')
    expect(collapsedFootRule).toContain('border-radius: 50%')
    expect(CSS).toMatch(/\[data-maid-sidebar-size='rail'\] \[class\*='sectionHeader'\]\s*\{[^}]*justify-content: center/)
    expect(CSS).toMatch(/\[class\*='search'\]:has\(> \[class\*='searchButton'\]\)\s*\{[^}]*justify-content: center/)
    expect(CSS).toMatch(/\[class\*='regionArea'\]\)\s*\{[^}]*overflow: visible/)
  })

  it('keeps settings content independent from collapsed sidebar icon chrome', () => {
    const railIconSelectors = [...CSS.matchAll(
      /body\[data-dsh-maid-atelier\]\[data-maid-sidebar-size='rail'\][^{]+:is\(\[class\*='iconButton'\], \[class\*='searchButton'\]\)[^{]+\{/g,
    )].map(match => match[0] ?? '')
    const centeredSettingsContentRule = CSS.match(
      /:not\(\[data-maid-sidebar-size='rail'\]\)[\s\S]*?\[data-slot='sidebar\.settings'\][\s\S]*?button\[aria-haspopup='dialog'\]:has\(> \[data-slot='settings\.trigger'\]\)\s*\{([^}]*)\}/s,
    )?.[1] ?? ''
    const centeredSettingsLabelRule = CSS.match(
      /\[data-slot='settings\.trigger'\]\s*\{([^}]*)\}/s,
    )?.[1] ?? ''
    const constrainedSettingsRule = [...CSS.matchAll(
      /button\[aria-haspopup='dialog'\]:has\(> \[data-slot='settings\.trigger'\]\)\s*\{([^}]*)\}/g,
    )].map(match => match[1] ?? '').find(rule => rule.includes('flex: 1 1 112px')) ?? ''
    const connectionRule = CSS.match(
      /> :is\(button\[data-phase\], \[role='status'\]\)\s*\{([^}]*)\}/s,
    )?.[1] ?? ''
    const connectionLabelRule = CSS.match(
      /> :is\(button\[data-phase\], \[role='status'\]\)[\s\S]*?> span\[aria-hidden='true'\] \+ span > span\s*\{([^}]*)\}/s,
    )?.[1] ?? ''
    expect(railIconSelectors.length).toBeGreaterThan(0)
    expect(railIconSelectors.every(selector => selector.includes(":not([role='dialog'] *)"))).toBe(true)
    // The icon and label travel as one pair: a fixed gap binds them (like the
    // New Session button) and the pair stays centered, so resizing the sidebar
    // never stretches the space between the gear and the text.
    expect(centeredSettingsContentRule).toContain('position: relative')
    expect(centeredSettingsContentRule).toContain('flex: 1 1 auto')
    expect(centeredSettingsContentRule).toContain('justify-content: center')
    expect(centeredSettingsContentRule).toContain('gap: 8px')
    expect(centeredSettingsLabelRule).not.toContain('position: absolute')
    expect(centeredSettingsLabelRule).not.toContain('left: 50%')
    expect(centeredSettingsLabelRule).toContain('line-height: normal')
    expect(constrainedSettingsRule).toContain('width: auto')
    expect(constrainedSettingsRule).toContain('padding-inline: 8px')
    expect(constrainedSettingsRule).toContain('border-width: 0 28px')
    expect(constrainedSettingsRule).toContain('gap: 4px')
    expect(connectionRule).toContain('flex: 0 1 96px')
    expect(connectionRule).toContain('grid-template-columns: 14px minmax(0, 1fr)')
    expect(connectionRule).toContain('max-width: 96px')
    expect(connectionRule).toContain('border: 1px solid rgba(225, 191, 124, 0.76)')
    expect(connectionLabelRule).toContain('text-overflow: ellipsis')
    expect(CSS).toMatch(/> \[role='status'\]\s*\{[^}]*color: #c8e4c7/s)
  })

  it('hides the duplicated title-bar menu button in frameless surfaces', () => {
    const titlebarMenuRule = CSS.match(
      /\[class\*='titlebar'\] > \[class\*='button'\]:first-of-type\s*\{([^}]*)\}/s,
    )?.[1] ?? ''
    expect(titlebarMenuRule).toContain('display: none')
    expect(CSS).toMatch(/\[class\*='titlebar'\] > \[class\*='button'\]:first-of-type/)
  })

  it('places the whale-free wordmark at the left of the frameless title bar', async () => {
    fiber = await mount()
    document.body.insertAdjacentHTML('beforeend', '<div class="fixture_titlebar"></div>')
    await flushMutations()
    const titlebar = document.querySelector<HTMLElement>("[class*='titlebar']")
    const brand = titlebar?.querySelector<HTMLElement>("[data-skin-chrome='titlebar-brand']")
    expect(brand).not.toBeNull()
    const svg = brand?.querySelector('svg')
    expect(svg?.getAttribute('viewBox')).toBe('26 4.2 155.6 17.6')
    expect(svg?.innerHTML ?? '').toContain('maid-titlebar-brand-clip')
    expect(svg?.innerHTML ?? '').not.toContain('whale-clip')
    expect(svg?.innerHTML ?? '').not.toContain('M23.0584')
    await fiber.dispose()
    expect(document.querySelector("[data-skin-chrome='titlebar-brand']")).toBeNull()
  })

  it('styles the title-bar wordmark centered on the window, always visible', () => {
    expect(CSS).toMatch(/\[data-skin-chrome='titlebar-brand'\]\s*\{[^}]*left: 50%/s)
    expect(CSS).toMatch(/\[data-skin-chrome='titlebar-brand'\]\s*\{[^}]*transform: translate\(-50%, -50%\)/s)
    expect(CSS).toMatch(/\[data-skin-chrome='titlebar-brand'\]\s*\{[^}]*pointer-events: none/s)
    expect(CSS).toMatch(/\[data-skin-chrome='titlebar-brand'\] svg\s*\{[^}]*height: 18px/s)
    // The wordmark must not hide with the rail: it is decorative and centered.
    expect(CSS).not.toMatch(/\[data-maid-sidebar-size='rail'\]\s*\[data-skin-chrome='titlebar-brand'\]\s*\{[^}]*display: none/s)
  })

  it('re-asserts the frameless frame rows through CSSOM env(), bypassing the module pipeline', async () => {
    fiber = await mount()
    const sheet = document.querySelector<HTMLStyleElement>("[data-skin-chrome='sidebar-width-rule']")
    const cssText = [...(sheet?.sheet?.cssRules ?? [])].map(rule => rule.cssText).join(' ')
    // jsdom's CSS parser drops the env() declaration body (the real browser
    // keeps `grid-template-rows: env(titlebar-area-height, 40px) 1fr`), so
    // assert the repaired selectors and the handle boundary instead.
    expect(cssText).toContain('[data-wco]')
    expect(cssText).toContain('[data-desktop]')
    expect(cssText).toContain('handle"]')
    expect(cssText).toContain('top: var(--maid-titlebar-height, 0px)')
  })

  it('starts the top curtain below the frameless title-bar row', () => {
    // The offset height must come from the runtime variable, never from env():
    // the CSS-modules pipeline rewrites env() identifiers, so a hardcoded
    // env() rule would silently fall back to 0 and paint over the title bar.
    const trimOffsetRule = CSS.match(
      /\[data-skin-chrome='top-trim'\]\s*\{\s*top: var\(--maid-titlebar-height, 0px\)/s,
    )?.[1] ?? ''
    expect(trimOffsetRule).not.toBeNull()
    expect(CSS).not.toMatch(/env\(titlebar-area-height/)
  })

  it('falls back to zero title-bar height when no sidebar column is laid out', async () => {
    fiber = await mount()
    const sheet = document.querySelector<HTMLStyleElement>("[data-skin-chrome='sidebar-width-rule']")
    expect(sheet?.sheet?.cssRules[1]?.cssText ?? '').toMatch(/--maid-titlebar-height\s*:\s*0px/)
    await fiber.dispose()
    expect(document.querySelector("[data-skin-chrome='sidebar-width-rule']")).toBeNull()
  })

  it('mirrors the sidebar column top as the curtain offset when a column exists', async () => {
    document.body.innerHTML = `
      <div class="AppFrame_sidebarCol">
        <div class="fixture_logoRow"><button class="fixture_brand"><svg></svg></button></div>
      </div>
    `
    const column = document.querySelector<HTMLElement>("[class*='sidebarCol']")!
    // jsdom has no layout; pretend the column sits 40px below the viewport top.
    vi.spyOn(column, 'getBoundingClientRect').mockReturnValue({
      top: 40, left: 0, right: 280, bottom: 760, width: 280, height: 720,
      x: 0, y: 40, toJSON: () => ({}),
    })
    fiber = await mount()
    const sheet = document.querySelector<HTMLStyleElement>("[data-skin-chrome='sidebar-width-rule']")
    expect(sheet?.sheet?.cssRules[1]?.cssText ?? '').toContain('--maid-titlebar-height: 40px')
    await fiber.dispose()
  })

  it('slides the phone drawer in for every nav mode, not just rail', () => {
    // Every phone mode drops the host's grid track before opening it, so none of
    // them inherits the host's grid-column transition; without a shared entrance
    // the column snapped from the 48px bar/button box to the full-height drawer
    // inside a single frame (measured in the browser: only two distinct widths
    // across the whole transition, no tween at all).
    //
    // The file holds three near-identical `div:not([data-sidebar-collapsed])`
    // rules per mode (two layout, one entrance), so match on the declaration
    // instead: only the entrance rules carry the animation.
    const DRAWER_ANIM = 'animation: maidAtelierPhoneDrawerIn'
    const rulesWith = (decl: string): { selector: string; body: string }[] => {
      const out: { selector: string; body: string }[] = []
      let at = -1
      while ((at = CSS.indexOf('{', at + 1)) !== -1) {
        const close = CSS.indexOf('}', at)
        if (close === -1) break
        if (!CSS.slice(at, close).includes(decl)) continue
        // Back up past the previous block to recover this rule's selector; the
        // `{` at `at` itself must be excluded, so scan from `at - 1`.
        const head = Math.max(CSS.lastIndexOf('}', at - 1), CSS.lastIndexOf('{', at - 1)) + 1
        out.push({
          selector: CSS.slice(head, at).replace(/\s+/g, ' ').trim(),
          body: CSS.slice(at + 1, close).replace(/\s+/g, ' ').trim(),
        })
      }
      return out
    }

    // The drawer keeps the horizontal slide it always had.
    const entranceRules = rulesWith(DRAWER_ANIM)
    const shared = entranceRules[0]?.body ?? ''
    const rail = entranceRules[1]?.body ?? ''
    const keyframe = (name: string): string =>
      CSS.match(new RegExp(`@keyframes ${name}\\s*\\{([\\s\\S]*?)\\n\\}`))?.[1] ?? ''
    const drawerIn = keyframe('maidAtelierPhoneDrawerIn')

    for (const [name, rule] of [['shared', shared], ['rail', rail]] as const) {
      expect(rule, `${name} drawer entrance rule`).toContain(DRAWER_ANIM)
    }
    expect(drawerIn).toContain('translateX(-100%)')
    expect(drawerIn).not.toContain('translateY')

    // The collapsed bar must not animate at all. It hosts the settings overlay's
    // subtree, and every animatable property was measured to break that panel:
    // `transform` makes this column the overlay's containing block (the fixed
    // panel centred against the 390x48 bar and landed off-screen), `clip-path`
    // clips fixed descendants (the panel was cut to the bar and only its tab
    // strip survived), and `opacity` installs a stacking context. Verified in the
    // browser by toggling each one: the panel's probes were unreachable while any
    // of them were live on this rule.
    const barRule = rulesWith('animation: none').find((rule) =>
      rule.selector.includes("data-maid-nav-mode='topbar'")
      && rule.selector.includes('data-sidebar-collapsed'))?.body ?? ''
    expect(barRule, 'collapsed topbar rule').toContain('animation: none')
    for (const offender of ['transform', 'translate', 'clip-path', 'scale(', 'opacity']) {
      expect(barRule, `collapsed topbar rule must not declare ${offender}`).not.toContain(offender)
    }
    expect(CSS).not.toContain('@keyframes maidAtelierPhoneTopbarDrop')
  })

  it('keeps the expanded sidebar entries out of the collapsed phone box', () => {
    // The host does not unmount its expanded content at the collapse: `wide`
    // stays true for its 150ms fade, SidebarRoot keeps the wide layout, and the
    // host's own `collapsed` class only arrives with the rail swap. Corner and
    // the top bar have already replaced the host's clipped column with a 48px
    // box, so during that window the surviving wide entries (the brand button
    // and the portalled plugin entries) are laid out by the collapsed geometry
    // and paint a clipped row across the bar on every close.
    //
    // Match the whole rule text: the selector may span the comment above it, so
    // the assertions below read the captured selector, not the declaration body.
    const windowRules = [
      ...CSS.matchAll(
        /html:not\(\[data-maid-nav-mode='rail'\]\) body\[data-dsh-maid-atelier\][^{}]*?div\[data-sidebar-collapsed\][^{}]*?\{([^{}]*)\}/g,
      ),
    ]
      .map((match) => ({
        selector: match[0].slice(0, match[0].indexOf('{')).replace(/\s+/g, ' ').trim(),
        body: match[1] ?? '',
      }))
      .filter((rule) => rule.body.includes('display: none !important'))

    expect(windowRules.length).toBeGreaterThan(0)
    const selectors = windowRules.map((rule) => rule.selector).join(' | ')
    // Only the collapse window (the host has not swapped the rail in yet).
    expect(selectors).toContain("div:not([class*='collapsed'])")
    // The expanded brand button, and everything but the rail's own controls.
    expect(selectors).toContain("[class*='logoRow']")
    expect(selectors).toContain("[class*='newSession']")
    expect(selectors).toContain("[class*='footArea']")
    // Portalled plugin entries are direct children of the SidebarRoot.
    expect(selectors).toContain('[data-plugin-entry]')
    expect(selectors).toContain("button[data-dsh-part='sidebar-entry']")
    // The plugin action row above the settings seat is expanded content too,
    // while the seat itself stays because the settings dialog mounts inside it.
    expect(selectors).toContain("[class*='footerActions']")
    // `rail` keeps the host's own clipped column and must stay untouched.
    for (const rule of windowRules) {
      expect(rule.selector, 'collapse-window rule').toContain(":not([data-maid-nav-mode='rail'])")
    }

    // Run those selectors against the host's own sidebar tree (the rc.2 shape:
    // logoRow / newSession / nav.panelList / regionArea / footArea), so the
    // window is proven to hide the expanded entries — including the panel list
    // that carries the plugin entries — and to leave the rail controls alone.
    // The list rows are `nav.panelList`'s children, not portalled buttons, so a
    // selector-only assertion above would not prove this.
    document.documentElement.removeAttribute('data-maid-nav-mode')
    document.body.setAttribute('data-dsh-maid-atelier', '')
    document.body.innerHTML = `
      <div class="fixture_frame" data-sidebar-collapsed>
        <div class="fixture_sidebarCol">
          <div data-slot="sidebar" style="display: contents">
            <div class="fixture_root fixture_fading fixture_quietBars">
              <div class="fixture_logoRow">
                <button class="fixture_brand" data-fixture="brand"></button>
                <button class="fixture_iconButton fixture_toggle" data-fixture="toggle"></button>
              </div>
              <button class="fixture_newSession" data-fixture="newSession"></button>
              <nav class="fixture_panelList" data-fixture="panelList">
                <button class="fixture_panelRow" data-fixture="panelRow"></button>
              </nav>
              <div class="fixture_regionArea" data-fixture="regionArea"></div>
              <div class="fixture_footArea" data-fixture="footArea">
                <div class="fixture_footerActions" data-fixture="footerActions"></div>
                <div class="fixture_settingsArea" data-fixture="settingsArea"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `
    const hiddenFixtures = (): string[] => [...new Set(
      windowRules
        .flatMap((rule) => [...document.querySelectorAll(rule.selector)])
        .map((element) => element.getAttribute('data-fixture') ?? element.tagName),
    )].sort()
    expect(hiddenFixtures()).toEqual(['brand', 'footerActions', 'panelList'])
    // At settle the host adds its `collapsed` class: the window is over and the
    // rail keeps every control.
    document.querySelector('.fixture_root')!.className = 'fixture_root fixture_collapsed fixture_railIn'
    expect(hiddenFixtures()).toEqual([])
    document.body.removeAttribute('data-dsh-maid-atelier')
  })

  it('dresses the frameless title bar with the sidebar navy gradient', () => {
    const titlebarRule = CSS.match(/\[class\*='titlebar'\]\s*\{([^}]*)\}/s)?.[1] ?? ''
    expect(titlebarRule).toContain('linear-gradient')
    // Vertical gradient, deepest at the bottom where it meets the sidebar and
    // the trim band, lightening toward the top edge.
    expect(titlebarRule).toContain('to top')
    expect(titlebarRule).toContain('rgba(197, 164, 104, 0.42)')
    expect(CSS).toMatch(/\[data-ds-dark-theme\] \[class\*='titlebar'\]\s*\{[^}]*to top/s)
    expect(CSS).toMatch(/\[class\*='titlebar'\] \[class\*='button'\]\s*\{[^}]*color: #d9bd83/s)
  })

  it('keeps delayed sidebar tooltips out of the rail flex layout', () => {
    const sidebarLayerSelector = CSS.match(
      /body\[data-dsh-maid-atelier\] \[class\*='sidebarCol'\] > div > :not\(([\s\S]*?)\)\s*\{/,
    )?.[1] ?? ''
    expect(sidebarLayerSelector).toContain("[role='tooltip']")
  })

  it('releases a tooltip carrier without demoting the gold sidebar frame', () => {
    const tooltipCarrierRule = CSS.match(
      /\[class\*='sidebarCol'\]\s*> div\s*> \[data-maid-tooltip-carrier\]\s*\{([^}]*)\}/s,
    )?.[1] ?? ''
    const frameRule = CSS.match(
      /\[data-skin-chrome='sidebar-corners'\]\s*\{([^}]*)\}/s,
    )?.[1] ?? ''
    expect(tooltipCarrierRule).not.toBe('')
    expect(tooltipCarrierRule).toContain('z-index: auto')
    expect(tooltipCarrierRule).not.toContain('position: static')
    expect(frameRule).toContain('z-index: 4')
  })

  it('keeps the host tooltip pair readable inside decorated message rows', () => {
    // The host tooltip is not portalled: it mounts inside the user row, and its
    // class name shares the `bubble` substring with the user bubble. Every
    // surface written for that bubble must exclude it, and the overlay boundary
    // restores the host's white-on-dark pair for whatever decoration still
    // reaches the bubble.
    const bubbleGuards = [
      ...CSS.matchAll(/\[class\*='userRow'\] \[class\*='bubble'\]([^{]*)\{/g),
    ].map(([, guard = '']) => guard)
    const tooltipRule = CSS.match(
      /\[role='tooltip'\]\[data-side\]\s*\{([^}]*)\}/s,
    )?.[1] ?? ''
    expect(bubbleGuards.length).toBeGreaterThan(0)
    for (const guard of bubbleGuards) {
      expect(guard).toContain(":not([role='tooltip'])")
    }
    expect(tooltipRule).toContain('background: var(--dsw-alias-tooltip-bg')
    expect(tooltipRule).toContain('color: var(--dsw-static-neutral-bluish-00')
    expect(tooltipRule).toContain('border: 0')
    expect(tooltipRule).toContain('box-shadow: none')
  })

  it('paints the sidebar double rule without shrinking the collapsed rail', () => {
    const sidebarRule = CSS.match(
      /\[class\*='sidebarCol'\]\s*\{([^}]*)\}/s,
    )?.[1] ?? ''
    expect(sidebarRule).toContain('border-right: 0')
    expect(sidebarRule).toContain('inset -1px 0 rgba(255, 245, 215, 0.82)')
    expect(sidebarRule).toContain('inset -3px 0 rgba(226, 207, 166, 0.72)')
  })

  it('pins the rail toggle to its resting whale on touch', () => {
    // The host dresses the rail toggle on hover:
    // `.collapsed .toggle:hover .panelIcon { display: inline }` hides the whale
    // mark and shows the panel glyph, and `.iconButton:hover` adds its wash. A
    // touch screen latches that hover on the control it tapped, so the glyph
    // appeared to change whenever the drawer was toggled and changed back on the
    // next tap elsewhere. Touch pins the resting state; pointer devices keep the
    // host's reveal.
    const touchBlock = CSS.match(
      /@media \(hover: none\)\s*\{\s*body\[data-dsh-maid-atelier\][\s\S]*?\n\}/,
    )?.[0] ?? ''
    expect(touchBlock).toContain("[class*='panelIcon']")
    expect(touchBlock).toContain('display: none')
    expect(touchBlock).toContain("[class*='railMark']")
    expect(touchBlock).toContain('display: inline-flex')
    expect(touchBlock).toContain("[class*='toggle']:hover {")
    expect(touchBlock).toContain('background: transparent')
  })

  it('restores the large hero text floor without fixing the workspace height', () => {
    const inputRule = CSS.match(/\[data-composer-input\]\s*\{([^}]*)\}/s)?.[1] ?? ''
    const heroInputRule = CSS.match(
      /\[data-phase='hero'\] \[data-composer-input\]\s*\{([^}]*)\}/s,
    )?.[1] ?? ''
    expect(inputRule).toContain('min-height: 0')
    expect(heroInputRule).toContain('min-height: clamp(72px, 9vh, 118px)')
    expect(inputRule).toContain('transition: min-height 520ms')
    expect(CSS).not.toMatch(/\[data-phase='hero'\] \[data-composer-card\][^{]*\{[^}]*min-height/s)
  })

  it('scales and translucently backs the landing composer through official width hooks', () => {
    const heroRule = CSS.match(/\[data-phase='hero'\]\s*\{([^}]*)\}/s)?.[1] ?? ''
    const heroCardRule = CSS.match(
      /\[data-phase='hero'\] \[data-composer-card\]\s*\{([^}]*)\}/s,
    )?.[1] ?? ''
    const backingRule = CSS.match(/\[data-composer-card\]::after\s*\{([^}]*)\}/s)?.[1] ?? ''
    expect(heroRule).toContain('--dsh-chat-content-width: clamp(560px, 41vw, 740px)')
    expect(heroRule).toContain('--dsh-composer-card-max-width')
    expect(heroCardRule).toContain('rgba(255, 254, 250, 0.54)')
    expect(heroCardRule).toContain('backdrop-filter: blur(2.5px)')
    expect(backingRule).toContain('background: var(--maid-composer-surface)')
    expect(backingRule).toContain('backdrop-filter: var(--maid-composer-backdrop-filter)')
  })

  it('keeps hero workspace, permission, and model controls in the official composer flow', () => {
    const permissionRule = CSS.match(
      /\[class\*='modes'\] button\[class\*='trigger'\]\s*\{([^}]*)\}/s,
    )?.[1] ?? ''
    const modelRule = CSS.match(
      /\[class\*='trailing'\] button\[class\*='trigger'\]\s*\{([^}]*)\}/s,
    )?.[1] ?? ''
    expect(CSS).not.toMatch(
      /\[data-phase='hero'\]\s*:has\(> \[data-composer-card\]\)\s*\{[^}]*transform/s,
    )
    expect(permissionRule).toContain('justify-content: center')
    expect(permissionRule).toContain('gap: 0')
    expect(modelRule).toContain('width: auto')
    expect(modelRule).toContain('max-width: 220px')
    expect(modelRule).toContain('padding: 0 4px 0 8px')
    expect(CSS).not.toMatch(
      /\[class\*='trailing'\][\s\S]*?:is\(\[class\*='triggerLabel'\], \[class\*='triggerEffort'\]\)\s*\{[^}]*display: none/s,
    )
  })

  it('rebuilds the hero logo surround, caption rule, and embedded circular controls', () => {
    const headlineRule = CSS.match(
      /\[class\*='headline'\]:has\(> \[class\*='fish'\]\)\s*\{([^}]*)\}/s,
    )?.[1] ?? ''
    const medallionRule = CSS.match(
      /\[class\*='headline'\]:has\(> \[class\*='fish'\]\) > \[class\*='fish'\]\s*\{([^}]*)\}/s,
    )?.[1] ?? ''
    const captionRule = CSS.match(
      /\[class\*='headline'\]:has\(> \[class\*='fish'\]\)::after\s*\{([^}]*)\}/s,
    )?.[1] ?? ''
    const addRule = CSS.match(
      /\[data-composer-card\] button\[class\*='add'\]\s*\{([^}]*)\}/s,
    )?.[1] ?? ''
    const sendRule = CSS.match(
      /\[data-composer-card\] button\[class\*='primary'\]\s*\{([^}]*)\}/s,
    )?.[1] ?? ''
    const titleGroupRule = CSS.match(
      /\[class\*='headline'\]:has\(> \[class\*='fish'\]\) > \[class\*='titleGroup'\]\s*\{([^}]*)\}/s,
    )?.[1] ?? ''
    const titleRule = CSS.match(
      /body\[data-dsh-maid-atelier\]\s*\[data-phase='hero'\]\s*\[class\*='titleGroup'\] > span:not\(\[class\*='previewBadge'\]\)\s*\{([^}]*)\}/s,
    )?.[1] ?? ''
    const previewRule = CSS.match(
      /\[data-phase='hero'\] \[class\*='previewBadge'\]\s*\{([^}]*)\}/s,
    )?.[1] ?? ''
    expect(headlineRule).toContain('grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr)')
    // 0.1.5-alpha.1 wrapped the title text and the preview badge in one
    // `.titleGroup` unit; the grid only owns the middle column if that
    // wrapper stops generating a box. The retired `headlineText` span must
    // not survive as a second path, or the next host swap passes unnoticed.
    expect(titleGroupRule).toContain('display: contents')
    expect(CSS).not.toContain('headlineText')
    expect(titleRule).toContain('grid-column: 2')
    expect(previewRule).toContain('grid-column: 3')
    expect(previewRule).toContain('justify-self: start')
    expect(medallionRule).toContain('width: 70px')
    expect(medallionRule).toContain('outline: 1px solid')
    expect(captionRule).toContain('linear-gradient(45deg')
    expect(addRule).toContain('width: 42px')
    expect(addRule).toContain('border-radius: 50%')
    expect(sendRule).toContain('width: 44px')
    expect(sendRule).toContain('linear-gradient(145deg, #6079b5, #294587)')
  })

  it('keeps the dark hero title and preview badge legible over the night palace', () => {
    const titleRule = CSS.match(
      /body\[data-dsh-maid-atelier\]\[data-ds-dark-theme\]\s*\[data-phase='hero'\] \[class\*='titleGroup'\] > span:not\(\[class\*='previewBadge'\]\)\s*\{([^}]*)\}/s,
    )?.[1] ?? ''
    const badgeRule = CSS.match(
      /body\[data-dsh-maid-atelier\]\[data-ds-dark-theme\]\s*\[data-phase='hero'\] \[class\*='previewBadge'\]\s*\{([^}]*)\}/s,
    )?.[1] ?? ''
    expect(titleRule).toContain('color: #fffaf0')
    // A stroke traces the overlapping contours inside CJK glyphs and greys
    // the fill; legibility comes from the shadow stack only.
    expect(titleRule).not.toContain('-webkit-text-stroke:')
    expect(titleRule).toContain('0 1px 0 rgba(4, 11, 34, 0.96)')
    expect(titleRule).toContain('0 3px 7px rgba(0, 0, 0, 0.86)')
    expect(badgeRule).toContain('color: #f0dfba')
    expect(badgeRule).toContain('rgba(7, 18, 52, 0.58)')
  })

  it('keeps the character stage scoped to the conversation column with maids at its bottom corners', () => {
    const stageRule = CSS.match(
      /\[data-skin-chrome='character-stage'\]\s*\{([^}]*)\}/s,
    )?.[1] ?? ''
    const chatLeftRule = CSS.match(
      /\[data-maid-chat-active\]\s*\[data-maid-character='left'\]\s*\{([^}]*)\}/s,
    )?.[1] ?? ''
    const chatRightRule = CSS.match(
      /\[data-maid-chat-active\]\s*:is\(\[data-maid-character='right'\], \[data-maid-character='vision'\]\)\s*\{([^}]*)\}/s,
    )?.[1] ?? ''
    const sharedRule = CSS.match(
      /\[data-maid-character\]\s*\{([^}]*)\}/s,
    )?.[1] ?? ''
    const baseLeftRule = CSS.match(
      /\[data-maid-character='left'\]\s*\{([^}]*)\}/s,
    )?.[1] ?? ''
    const baseRightRule = CSS.match(
      /:is\(\[data-maid-character='right'\], \[data-maid-character='vision'\]\)\s*\{([^}]*)\}/s,
    )?.[1] ?? ''
    // The stage is inside the chat area (positioned by the conversation
    // column's box), not fixed to the viewport.
    expect(stageRule).toContain('position: absolute')
    expect(stageRule).toContain('inset: 0')
    expect(stageRule).toContain('z-index: 0')
    expect(stageRule).toContain('contain: strict')
    // cover + center: wide chat crops the vertical overflow centered (top and
    // bottom together); a chat narrower than the art keeps it full-height and
    // crops horizontally centered — never shrink-to-width.
    expect(stageRule).toContain('background: var(--maid-palace-art) center / cover no-repeat')
    expect(sharedRule).toContain('translate 620ms')
    expect(sharedRule).not.toContain('left 620ms')
    expect(sharedRule).not.toContain('right 620ms')
    expect(sharedRule).not.toContain('filter 420ms')
    // The ConversationRoot paints above the stage via position: relative
    // (no z-index — no new stacking context).
    const conversationRootRule = CSS.match(
      /\[class\*='centerCol'\]\s*:is\(\[data-phase='hero'\], \[data-phase='active'\], \[data-phase='settling'\]\)\s*\{([^}]*)\}/s,
    )?.[1] ?? ''
    expect(conversationRootRule).toContain('position: relative')
    expect(conversationRootRule).not.toContain('z-index')
    // Left maid at chat-area bottom-left, right maid at chat-area bottom-right,
    // both sized against the chat area's height (percentages of the stage).
    expect(baseLeftRule).toContain('left: clamp(8px, 1.5%, 24px)')
    expect(baseLeftRule).toContain('bottom: 0')
    expect(baseLeftRule).toContain('height: 96%')
    expect(baseRightRule).toContain('right: clamp(8px, 1.5%, 24px)')
    expect(baseRightRule).toContain('bottom: 0')
    expect(baseRightRule).toContain('height: 92%')
    // Left and right maids share the same corner layout: no asymmetric
    // sidebar-offset translate, no viewport units in the edge offsets.
    expect(baseLeftRule).not.toContain('var(--maid-sidebar-width)')
    expect(baseLeftRule).not.toContain('vw')
    expect(baseRightRule).not.toContain('var(--maid-sidebar-width)')
    expect(baseRightRule).not.toContain('vw')
    expect(chatLeftRule).toContain('height: 64%')
    expect(chatRightRule).toContain('height: 62%')
    expect(chatLeftRule).not.toContain('translate:')
    expect(chatRightRule).not.toContain('translate:')
    expect(CSS).not.toMatch(/\[data-maid-character='(?:left|right)'\]\s*\{[^}]*(?:left|right):\s*-/s)
    expect(CSS).not.toMatch(/\[data-maid-conversation-active\]\s*\[data-maid-character/s)
    // The better-sidebar fixed-indent adaptation is gone: the artwork follows
    // the chat area, so no panel-state projection survives in the character rules.
    expect(CSS).not.toMatch(/\[data-maid-character='right'\][^{]*\{[^}]*clamp\(-460px/s)
    expect(CSS).not.toContain('data-maid-better-sidebar-open')
  })

  it('recovers the rc.6 rail search after its stale click collapses the wide field', async () => {
    document.body.innerHTML = `
      <div class="AppFrame_sidebarCol">
        <div class="fixture_search">
          <button class="fixture_searchButton" type="button">search</button>
        </div>
      </div>
    `
    fiber = await mount()
    document.querySelector<HTMLButtonElement>('.fixture_searchButton')!.click()

    const sidebar = document.querySelector<HTMLElement>("[class*='sidebarCol']")!
    sidebar.innerHTML = `
      <div class="fixture_search">
        <input class="fixture_searchInput" />
      </div>
    `
    const searchRoot = sidebar.querySelector<HTMLElement>('.fixture_search')!
    const input = sidebar.querySelector<HTMLInputElement>('.fixture_searchInput')!
    let reopened = 0
    searchRoot.addEventListener('click', () => { reopened += 1 })

    await new Promise<void>(resolve => requestAnimationFrame(() => { resolve() }))

    expect(reopened).toBe(1)
    expect(document.activeElement).toBe(input)
  })

  it('themes Cordis footer actions and approval panels without displacing settings', () => {
    expect(CSS).toMatch(
      /:not\(\[data-maid-sidebar-size='rail'\]\)[\s\S]*?\[data-slot='sidebar\.settings'\][\s\S]*?button\[aria-haspopup='dialog'\]:has\(> \[data-slot='settings\.trigger'\]\)\s*\{[^}]*margin-inline: 0/s,
    )
    expect(CSS).toMatch(
      /\[data-maid-sidebar-footer\]\s*\{[^}]*flex: 0 0 auto[^}]*min-height: calc\(var\(--maid-sidebar-swag-height\) \+ 82px\)/s,
    )
    expect(CSS).toMatch(
      /\[data-maid-sidebar-size='rail'\] \[data-maid-sidebar-footer\]\s*\{[^}]*flex-basis: auto[^}]*padding: 5px 5px max\(12px, env\(safe-area-inset-bottom, 0px\)\)/s,
    )
    expect(CSS).toMatch(
      /\[data-maid-cordis-panel-open\][\s\S]*?> \[data-maid-cordis-carrier\]\s*\{[^}]*z-index: 40/s,
    )
    expect(CSS).toMatch(/\[data-cordis-badge\]\s*\{[^}]*border: 1px solid[^}]*linear-gradient/s)
    expect(CSS).toMatch(
      /\[data-cordis-panel\]\s*\{[^}]*left: calc\(var\(--maid-sidebar-width\) \+ 12px\)[^}]*--dsw-alias-bg-base: rgba\(230, 237, 250, 0\.96\)[^}]*backdrop-filter: blur\(16px\)/s,
    )
    expect(CSS).toMatch(/\[data-cordis-row\]\s*\{[^}]*rgba\(247, 249, 254, 0\.72\)/s)
    expect(CSS).toContain('[data-cordis-approve-plugin]')
    expect(CSS).toMatch(
      /\[data-ds-dark-theme\] \[data-cordis-panel\]\s*\{[^}]*--dsw-alias-bg-base: rgba\(10, 22, 54, 0\.96\)/s,
    )
  })

  it('isolates dsh-better-sidebar from transparent skin tokens', () => {
    expect(CSS).toMatch(
      /\[data-dsh-better-sidebar\]\s*\{[^}]*--dsw-specific-sidebar-fill: rgba\(230, 237, 250, 0\.96\)/s,
    )
    expect(CSS).toMatch(
      /\[data-ds-dark-theme\] \[data-dsh-better-sidebar\]\s*\{[^}]*--dsw-specific-sidebar-fill: rgba\(10, 22, 54, 0\.96\)/s,
    )
  })

  it('keeps root-level relational selectors out of the skin scope', () => {
    expect(CSS).not.toMatch(
      /body\[data-dsh-maid-atelier\](?:\[[^\]]+\]|:not\([^)]*\))*:has\(/,
    )
  })

  it('coordinates composer docking and rising with the curtain duration', () => {
    expect(CSS).toContain("data-maid-composer-motion='dock'")
    expect(CSS).toContain("data-maid-composer-motion='rise'")
    expect(CSS).toContain('animation: maidAtelierComposerDock 520ms')
    expect(CSS).toContain('animation: maidAtelierComposerRise 520ms')
    expect(CSS).toContain('@keyframes maidAtelierComposerDock')
    expect(CSS).toContain('@keyframes maidAtelierComposerRise')
    expect(CSS).toMatch(/\[data-maid-composer-motion\][^{]*\{[^}]*will-change: transform, opacity/s)
  })

  it('styles assistant Markdown blocks through the stable flow-kind hook', () => {
    const bubbleRule = CSS.match(
      /\[data-chat-flow-kind='assistant-step'\] > \* > \* > \* > div\[class\*='markdown'\]\s*\{([^}]*)\}/s,
    )?.[1] ?? ''
    expect(bubbleRule).toContain('max-width: min(100%, calc(var(--dsh-chat-content-width, 680px) - 32px))')
    expect(bubbleRule).toContain('padding: 14px 18px')
    expect(bubbleRule).toContain('border-radius: 18px 18px 18px 7px')
    expect(bubbleRule).not.toContain('backdrop-filter')
    expect(CSS).not.toContain("div:not([data-variant])")
    expect(CSS).toContain("[data-variant='think']")
  })

  it('styles only genuinely overflowing wide tables with an explicit expand affordance', () => {
    const nativeRule = CSS.match(
      /\[data-chat-flow-kind='assistant-step'\] :global\(\.md-table-wide\):not\(\[data-maid-table-frame\]\)\s*\{([^}]*)\}/s,
    )?.[1] ?? ''
    const frameRule = CSS.match(
      /\[data-chat-flow-kind='assistant-step'\] \[data-maid-table-frame\]\s*\{([^}]*)\}/s,
    )?.[1] ?? ''
    const expandRule = CSS.match(
      /\[data-chat-flow-kind='assistant-step'\] \[data-maid-table-frame\] > \[data-maid-table-expand\]\s*\{([^}]*)\}/s,
    )?.[1] ?? ''
    const lightboxRule = CSS.match(/\[data-maid-table-lightbox\]\s*\{([^}]*)\}/s)?.[1] ?? ''
    const panelRule = CSS.match(/\[data-maid-table-panel\]\s*\{([^}]*)\}/s)?.[1] ?? ''
    const expandedRule = CSS.match(/\[data-maid-table-expanded\]\s*\{([^}]*)\}/s)?.[1] ?? ''
    // Fitting .md-table-wide wrappers keep the host's layout. table-card.ts
    // adds this attribute and control in place only after measured overflow;
    // The host owns scrollbar reservation across hover states.
    expect(nativeRule).not.toContain('padding-bottom:')
    expect(nativeRule).not.toContain('overflow-x:')
    expect(frameRule).toContain('width: max-content')
    expect(frameRule).toContain('max-width: 100%')
    expect(frameRule).toContain('margin-inline: auto')
    expect(frameRule).toContain('border-radius: 8px')
    expect(frameRule).toContain('background:')
    expect(frameRule).toContain('overflow-x: auto')
    expect(frameRule).toContain('box-sizing: border-box')
    expect(frameRule).toContain('padding: 3px 4px 4px 8px')
    expect(frameRule).toContain('scrollbar-color')
    expect(frameRule).not.toContain('background-size:')
    expect(frameRule).not.toContain('width: min(max-content')
    expect(frameRule).not.toContain('transform:')
    expect(frameRule).not.toContain('left: 50%')
    expect(CSS).not.toContain('[data-maid-table-frame] > :global(.md-table-wide)')
    expect(CSS).not.toContain('@keyframes maidAtelierTableLiquidBorder')
    expect(CSS).toContain('[data-maid-table-scroll-suppressed]')
    expect(CSS).toContain('[data-maid-table-expand]:focus-visible')
    expect(CSS).not.toContain('[data-maid-table-frame]:focus-within')
    expect(expandRule).toContain('position: absolute')
    expect(expandRule).toContain('right: 8px')
    expect(expandRule).toContain('width: 32px')
    expect(expandRule).toContain('border-radius: 7px')
    expect(expandRule).toContain('cursor: zoom-in')
    expect(CSS).toContain("[data-maid-table-expand]::before")
    expect(CSS).toContain("content: '⤢'")
    expect(CSS).toMatch(/\[data-maid-table-frame\]\[data-maid-table-expandable\][^,{]*:hover > \[data-maid-table-expand\]/)
    expect(lightboxRule).toContain('position: fixed')
    expect(lightboxRule).toContain('z-index: 940')
    expect(panelRule).toContain('width: min(var(--maid-table-expanded-width, 1180px), 100%)')
    expect(expandedRule).toContain('width: 100%')
    expect(expandedRule).toContain('min-width: 0')
    // Touch gets no expand control: the panel cannot show more of a wide table
    // than the bubble already does on a phone, so the frame stays as the
    // scrolling box and the table pans horizontally inside it instead.
    const touchTableBlock = CSS.match(
      /@media \(hover: none\), \(pointer: coarse\)\s*\{([\s\S]*?)\n\}/,
    )?.[1] ?? ''
    expect(touchTableBlock).toContain('[data-maid-table-expand]')
    expect(touchTableBlock).toContain('display: none')
    expect(touchTableBlock).toContain('overscroll-behavior-x: contain')
    expect(touchTableBlock).not.toContain('opacity')
    // `md-table-wide` is a bare class the renderer emits through clsx; a CSS
    // Modules build hashes selector classes, which silently disabled the rule
    // (the breakout kept painting). The :global() guard is the contract.
    expect(CSS).toContain(":global(.md-table-wide table)")
    // A phone page never gives the sidebar a column of its own, but the
    // collapsed bar spans the viewport and publishes that whole width as
    // `--maid-sidebar-width`: the desktop inset above then left the lightbox
    // with no width behind the bar and a ~90px sliver under the open drawer.
    const phoneLightboxRule = CSS.match(
      /@media \(max-width: 700px\)\s*\{\s*body\[data-dsh-maid-atelier\] \[data-maid-table-lightbox\]\s*\{([^{}]*)\}/s,
    )?.[1] ?? ''
    expect(phoneLightboxRule).toContain('left: 0')
    // The panel owns the remaining width, so the table keeps its natural width
    // and pans inside the panel scroller instead of squeezing every column.
    expect(CSS).toMatch(
      /@media \(max-width: 700px\)\s*\{[\s\S]*?\[data-maid-table-expanded\]\s*\{[^{}]*width: max-content/s,
    )
    expect(CSS).toMatch(
      /@media \(max-width: 700px\)\s*\{[\s\S]*?\[data-maid-table-expanded\] table\s*\{[^{}]*width: max-content/s,
    )
  })

  it('keeps reasoning and command-style assistant blocks outside Markdown bubbles', () => {
    document.body.innerHTML = `
      <div data-chat-flow-kind="assistant-step">
        <div class="renderer-seat">
          <div class="assistant-root">
            <div class="assistant-body">
              <div class="hash_markdown_hash" data-fixture="markdown"></div>
              <div data-variant="think" data-fixture="think"></div>
              <div data-variant="others" data-fixture="command"></div>
            </div>
          </div>
        </div>
      </div>
    `
    const matches = document.querySelectorAll(
      "[data-chat-flow-kind='assistant-step'] > * > * > * > div[class*='markdown']",
    )
    expect([...matches].map((element) => element.getAttribute('data-fixture'))).toEqual(['markdown'])
  })

  it('stabilizes light-theme disclosure text over the illustrated backdrop', () => {
    const variantRule = CSS.match(
      /:not\(\[data-ds-dark-theme\]\)\s+:is\(\[data-variant\], \[data-chat-flow-kind='context'\]\)\s*\{([^}]*)\}/s,
    )?.[1] ?? ''
    const rowRule = CSS.match(
      /:not\(\[data-ds-dark-theme\]\)[\s\S]*?:is\(\[data-variant\], \[data-chat-flow-kind='context'\]\) \[data-disclosure-row\]\s*\{([^}]*)\}/s,
    )?.[1] ?? ''
    expect(variantRule).toContain('--dsw-alias-label-secondary: #2f4778')
    expect(variantRule).toContain('--dsw-alias-label-tertiary: #405273')
    expect(rowRule).toContain('rgba(248, 250, 255, 0.32)')
    expect(rowRule).not.toContain('backdrop-filter')
    expect(CSS).toContain(":is([data-variant], [data-chat-flow-kind='context'])")
    expect(CSS).toContain("[data-chat-flow-kind='context'] > [data-slot='conversation.chat.node'] > [data-open='true']")
    expect(CSS).toMatch(/:is\(\s*\[data-variant\](?::not\(\[data-variant='think'\]\))? > \[data-open='true'\],[\s\S]*?\)\s*\{[^}]*rgba\(248, 250, 255, 0\.5\)/)
    expect(CSS).not.toMatch(/\[data-variant\] > \[data-open='true'\][^{}]*backdrop-filter: blur\(3px\)/)
    expect(CSS).toMatch(/:is\([\s\S]*?\) > \[data-disclosure-row\]\s*\{[^}]*background: transparent[^}]*backdrop-filter: none/s)
    expect(CSS).toMatch(/\[data-variant='think'\][^{]*\[data-disclosure-row\] \+ \*\s*\{[^}]*color: #34486f[^}]*line-height: 1\.65/s)
    expect(CSS).toMatch(/\[data-ds-dark-theme\]\s+:is\(\[data-variant\], \[data-chat-flow-kind='context'\]\)\s*\{[^}]*#d3ddf2[^}]*#b8c5e1/s)
    expect(CSS).toMatch(/\[data-ds-dark-theme\][\s\S]*?:is\(\[data-variant\], \[data-chat-flow-kind='context'\]\) \[data-disclosure-row\]\s*\{[^}]*rgba\(10, 20, 48, 0\.58\)/s)
    expect(CSS).toMatch(/\[data-ds-dark-theme\][\s\S]*?\[data-variant='think'\][^{]*\+ \*\s*\{[^}]*color: #c7d2e9/s)
  })

  it('seats the running line on a liquid glass capsule with a compositor-only hover', () => {
    const capsule = "body[data-dsh-maid-atelier] [data-chat-running] > [class*='runningContent']"
    const rule = (suffix: string): string => CSS.match(
      new RegExp(`${capsule.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}${suffix}\\s*\\{([^}]*)\\}`),
    )?.[1] ?? ''
    expect(rule('')).toContain('backdrop-filter: blur(10px) saturate(1.25)')
    expect(rule('')).toContain('border-radius: 999px')
    expect(rule('')).toContain('isolation: isolate')
    expect(rule('')).toContain('overflow: hidden')
    expect(rule('::before')).toContain('pointer-events: none')
    expect(rule('::after')).toContain('pointer-events: none')
    // The hover band animates transform only.
    expect(rule(':hover::after')).toMatch(/transition: transform \d+ms/)
    expect(rule(':hover::after')).not.toMatch(/\b(left|width|background-position):/)
    expect(CSS).toMatch(/\[data-ds-dark-theme\] \[data-chat-running\] > \[class\*='runningContent'\]\s*\{[^}]*--maid-glass-tint: rgba\(28, 44, 90, 0\.62\)/)
    expect(CSS).toMatch(/@media \(prefers-reduced-motion: reduce\) \{[^@]*\[data-chat-running\] > \[class\*='runningContent'\]::after\s*\{\s*display: none;/)
  })

  it('seats the full-workspace settings shell below the desktop window strip', () => {
    // Windows paints caption buttons over the shell titlebar and macOS keeps
    // its traffic-light band; the web shell has neither.
    expect(CSS).toMatch(/html\[data-windows-titlebar\] body\[data-dsh-maid-atelier\]\s*\{[^}]*--maid-window-strip: var\(--dsh-windows-titlebar-height, 40px\)/)
    expect(CSS).toMatch(/html\[data-platform='darwin'\] body\[data-dsh-maid-atelier\]\s*\{[^}]*--maid-window-strip: var\(--dsh-frame-top-clearance, 0px\)/)
    const workspace = CSS.match(
      /@media \(max-width: 1099px\), \(max-height: 680px\) \{[\s\S]*?> \[role='dialog'\]\s*\{([^}]*)\}/,
    )?.[1] ?? ''
    expect(workspace).toContain('width: 100dvw')
    expect(workspace).toContain('height: calc(100dvh - var(--maid-window-strip, 0px))')
    expect(workspace).toContain('margin-top: var(--maid-window-strip, 0px)')
    expect(workspace).not.toMatch(/height: 100d?vh;/)
    // The host panel only clears the macOS strip at desktop size.
    const desktop = CSS.match(
      /@media \(min-width: 1100px\) and \(min-height: 681px\) \{\s*html\[data-windows-titlebar\][^{]*> \[role='dialog'\]\s*\{([^}]*)\}/,
    )?.[1] ?? ''
    expect(desktop).toContain('height: min(800px, calc(100vh - 48px - var(--maid-window-strip, 0px)))')
    expect(desktop).toContain('margin-top: var(--maid-window-strip, 0px)')
  })

  it('frosts masked process groups from outside their Backdrop Root', () => {
    // A scrollable process group fades its edges with mask-image, so blurs on
    // its members sample nothing. The pane must sit beside the masked body,
    // and the body itself must stay filter-free for non-portaled tooltips.
    // Collapsing the group hides only the body and leaves stale scroll edges,
    // so a hidden body must not keep the pane alive as a zero-height bar.
    const masked = String.raw`\[data-step-process\]:not\(\[hidden\], \[data-group-expanded-mode\]\):has\(\s*> \[data-step-process-body\]:not\(\[hidden\]\):is\(\[data-scroll-up\], \[data-scroll-down\]\)\s*\)`
    const rootRule = CSS.match(new RegExp(`body\\[data-dsh-maid-atelier\\]\\s+${masked}\\s*\\{([^}]*)\\}`))?.[1] ?? ''
    const paneRule = CSS.match(new RegExp(`body\\[data-dsh-maid-atelier\\]\\s+${masked}::before\\s*\\{([^}]*)\\}`))?.[1] ?? ''
    const bodyRule = CSS.match(
      /\[data-group-expanded-mode\]\)\s*> \[data-step-process-body\]:not\(\[hidden\]\):is\(\[data-scroll-up\], \[data-scroll-down\]\)\s*\{([^}]*)\}/,
    )?.[1] ?? ''
    expect(rootRule).toContain('display: grid')
    expect(paneRule).toContain('grid-row: 2')
    expect(paneRule).toContain('backdrop-filter: blur(12px)')
    expect(paneRule).toContain('pointer-events: none')
    expect(bodyRule).toContain('grid-row: 2')
    expect(bodyRule).not.toMatch(/filter|transform|contain/)
    expect(CSS).toMatch(new RegExp(`\\[data-ds-dark-theme\\]\\s+${masked}::before\\s*\\{[^}]*rgba\\(10, 20, 48, 0\\.64\\)`))
    // The pane is the only glass layer: expanded members lie flat on it.
    const flatRule = CSS.match(
      /\[data-step-process-body\]:not\(\[hidden\]\):is\(\[data-scroll-up\], \[data-scroll-down\]\)\s*:is\(([^{]*)\)\s*\{([^}]*)\}/,
    )
    expect(flatRule?.[1]).toContain("[data-variant='think'] > [data-open='true'] > [data-disclosure-row] + *")
    expect(flatRule?.[1]).toContain("[data-variant]:not([data-variant='think']) > [data-open='true']")
    expect(flatRule?.[2]).toMatch(/background: transparent[^}]*box-shadow: none[^}]*backdrop-filter: none/s)
    // A padded max-content body must stay inside its column, or the process
    // group's scroll body grows a horizontal scrollbar.
    const thinkBodies = [...CSS.matchAll(/\[data-variant='think'\] > \[data-open='true'\] > \[data-disclosure-row\] \+ \* \{([^}]*)\}/g)]
    expect(thinkBodies).toHaveLength(2)
    for (const [, rule] of thinkBodies) {
      expect(rule).toContain('box-sizing: border-box')
      expect(rule).toContain('max-width: 100%')
    }
    // The chip padding drops the host's gap under an open group title.
    expect(CSS).toMatch(/button\[data-process-activity\]\[aria-expanded='true'\]\s*\{[^}]*margin-bottom: 10px/)

    document.body.innerHTML = `
      <div data-step-process data-fixture="masked">
        <div><button data-process-activity="thinking"></button></div>
        <div data-step-process-body data-scroll-down="true"></div>
      </div>
      <div data-step-process data-fixture="fits">
        <div><button data-process-activity="thinking"></button></div>
        <div data-step-process-body></div>
      </div>
      <div data-step-process data-group-expanded-mode="true" data-fixture="expanded">
        <div hidden></div>
        <div data-step-process-body data-scroll-down="true"></div>
      </div>
      <div data-step-process data-fixture="collapsed">
        <div><button data-process-activity="thinking" aria-expanded="false"></button></div>
        <div data-step-process-body hidden="until-found" data-scroll-down="true"></div>
      </div>
      <div data-step-process hidden="until-found" data-fixture="hidden">
        <div><button data-process-activity="thinking"></button></div>
        <div data-step-process-body data-scroll-up="true"></div>
      </div>
    `
    const matches = document.querySelectorAll(
      '[data-step-process]:not([hidden], [data-group-expanded-mode]):has(> [data-step-process-body]:not([hidden]):is([data-scroll-up], [data-scroll-down]))',
    )
    expect([...matches].map((element) => element.getAttribute('data-fixture'))).toEqual(['masked'])
  })

  it('keeps the light-theme composer statistics legible over the backdrop', () => {
    const dockRule = CSS.match(
      /body\[data-dsh-maid-atelier\] \[data-composer-card\] \+ div\[class\*='dock'\]\s*\{([^}]*)\}/s,
    )?.[1] ?? ''
    const glassRule = CSS.match(
      /body\[data-dsh-maid-atelier\] \[data-composer-card\] \+ div\[class\*='dock'\]::before\s*\{([^}]*)\}/s,
    )?.[1] ?? ''
    expect(dockRule).toContain('color: #4a5d82')
    expect(dockRule).toContain('--maid-dock-tint: rgba(248, 250, 255, 0.3)')
    expect(glassRule).toContain('var(--maid-dock-tint) 10%')
    expect(glassRule).toContain('backdrop-filter: blur(2px)')
    expect(glassRule).toContain('pointer-events: none')
    // The dock's own context confines the ContextMeter tooltip; it must stack
    // above the composer card or the card covers the bubble.
    const cardZ = Number(CSS.match(/body\[data-dsh-maid-atelier\] \[data-composer-card\] \{[^}]*z-index: (\d+)/)?.[1])
    const dockZ = Number(dockRule.match(/z-index: (\d+)/)?.[1])
    expect(dockZ).toBeGreaterThan(cardZ)
    expect(CSS).toMatch(/\[data-slot='conversation\.composer\.dock'\] > \* \[class\*='sep'\]\s*\{[^}]*rgba\(74, 93, 130, 0\.55\)/s)
    expect(CSS).toMatch(/\[data-ds-dark-theme\]\s*\[data-composer-card\] \+ div\[class\*='dock'\]\s*\{[^}]*--maid-dock-tint: rgba\(10, 20, 48, 0\.48\)[^}]*color: #aebdde/s)
  })

  it('keeps the ContextMeter dock from trapping its fixed tooltip (issue #151)', () => {
    // The host tooltip is a non-portalled position: fixed bubble placed from
    // viewport coordinates. Any containing-block property on the dock drops
    // it a viewport lower inside the sticky seat and stretches the scrollport.
    const dockRules = [...CSS.matchAll(/([^{}]*\[data-composer-card\] \+ div\[class\*='dock'\])\s*\{([^}]*)\}/g)]
    expect(dockRules.length).toBeGreaterThanOrEqual(2)
    for (const [, , body] of dockRules) {
      expect(body).not.toMatch(/(?:^|[\s;])(?:backdrop-filter|filter|transform|perspective|contain|will-change|container-type)\s*:/)
    }
  })

  it('resets the light-theme subagent catalog inherited from the navy header', () => {
    const catalogRule = CSS.match(
      /:not\(\[data-ds-dark-theme\]\)[\s\S]*?\[data-slot='conversation\.session\.header\.actions'\] \[role='tree'\]\s*\{([^}]*)\}/s,
    )?.[1] ?? ''
    expect(catalogRule).toContain('--dsw-alias-label-primary: #233763')
    expect(catalogRule).toContain('--dsw-alias-label-tertiary: #596b8e')
    expect(catalogRule).toContain('rgba(248, 250, 255, 0.93)')
    expect(catalogRule).toContain('text-shadow: none')
    expect(catalogRule).toContain('backdrop-filter: blur(8px) saturate(0.92)')
    expect(CSS).toMatch(/\[role='tree'\][^{]*:is\(\[role='treeitem'\], \[class\*='label'\]\)\s*\{[^}]*color: #233763/s)
    expect(CSS).toMatch(/\[role='tree'\][^{]*:is\(\[class\*='summary'\], \[class\*='metrics'\], \[class\*='notice'\]\)\s*\{[^}]*color: #596b8e/s)
    expect(CSS).toMatch(/\[data-ds-dark-theme\][\s\S]*?\[data-slot='conversation\.session\.header\.actions'\] \[role='tree'\]\s*\{[^}]*rgba\(10, 20, 48, 0\.93\)[^}]*rgba\(18, 31, 67, 0\.89\)[^}]*backdrop-filter: blur\(8px\) saturate\(0\.92\)/s)
    expect(CSS).toMatch(/\[data-ds-dark-theme\][\s\S]*?\[role='tree'\][^{]*:is\(\[class\*='summary'\], \[class\*='metrics'\], \[class\*='notice'\]\)\s*\{[^}]*color: #b8c5e1/s)
  })

  it('marks only phase changes for composer motion', async () => {
    document.body.innerHTML = `
      <div data-phase="hero"><div><div data-conversation-scroll></div></div></div>
      <button data-phase="disconnected">Retry</button>
    `
    fiber = await mount()
    expect(document.body.hasAttribute('data-maid-composer-motion')).toBe(false)

    document.querySelector<HTMLElement>('button[data-phase]')!.dataset.phase = 'connecting'
    await flushMutations()
    expect(document.body.hasAttribute('data-maid-composer-motion')).toBe(false)

    const phaseRoot = document.querySelector<HTMLElement>('[data-phase]')!
    phaseRoot.dataset.phase = 'active'
    await flushMutations()
    expect(document.body.dataset.maidComposerMotion).toBe('dock')

    document.querySelector<HTMLElement>('[data-phase]')!.dataset.phase = 'hero'
    await flushMutations()
    expect(document.body.dataset.maidComposerMotion).toBe('rise')
    await fiber.dispose()
    expect(document.body.hasAttribute('data-maid-composer-motion')).toBe(false)
  })

  it('preserves editor-driven composer sizing and clears the statistics dock', () => {
    const cardRule = CSS.match(/\[data-composer-card\]\s*\{([^}]*)\}/s)?.[1] ?? ''
    const inputRule = CSS.match(/\[data-composer-card\] \[data-composer-input\]\s*\{([^}]*)\}/s)?.[1] ?? ''
    const footerClearanceRule = CSS.match(
      /\[data-phase='active'\] \[data-composer-card\]:has\(\+ \*\)\s*\{([^}]*)\}/s,
    )?.[1] ?? ''
    expect(cardRule).toContain('min-height: 0')
    expect(cardRule).not.toContain('min-height: 210px')
    expect(inputRule).not.toContain('min-height: 112px')
    expect(footerClearanceRule).toContain('margin-block-end: 12px')
  })

  it('keeps the composer caret legible in dark mode without washing out light mode', () => {
    expect(CSS).toMatch(
      /\[data-composer-card\] \[data-composer-input\]\s*\{[^}]*caret-color: #405a99/s,
    )
    expect(CSS).toMatch(
      /\[data-ds-dark-theme\] \[data-composer-card\] \[data-composer-input\]\s*\{[^}]*caret-color: #bcd2ff/s,
    )
  })

  it('gives inspect-only overlay views the full canvas without the composer seat', () => {
    const hideRules = flatCssRules(CSS).filter(rule =>
      rule.selector.includes('[data-conversation-scroll]')
      && rule.selector.endsWith('> [data-composer-seat]')
      && /display:\s*none/.test(rule.body),
    )
    expect(hideRules.length).toBeGreaterThan(0)
    document.body.setAttribute('data-dsh-maid-atelier', '')
    document.body.innerHTML = `<section data-phase="active">
      <div data-conversation-scroll><div data-composer-seat></div></div>
    </section>`
    const scroll = document.querySelector('[data-conversation-scroll]')!
    const seat = scroll.querySelector('[data-composer-seat]')!
    const hidden = () => hideRules.some(rule => seat.matches(rule.selector))
    expect(hidden()).toBe(true)

    const view = document.createElement('div')
    scroll.prepend(view)
    view.setAttribute('data-chat-flow', '')
    expect(hidden()).toBe(false)

    view.removeAttribute('data-chat-flow')
    view.setAttribute('data-dsh-better-display', '0.1.1')
    expect(hidden()).toBe(false) // Reader loading/empty state has no turns.
    view.innerHTML = '<section data-reader-turn="1"></section>'
    expect(hidden()).toBe(false)
    view.setAttribute('data-chat-flow', '')
    expect(hidden()).toBe(false) // Newer Reader also publishes the native hook.

    view.remove()
    expect(hidden()).toBe(true) // Switching back to an inspect-only view.
    document.querySelector('[data-phase]')!.setAttribute('data-phase', 'hero')
    expect(hidden()).toBe(false)
  })

  it('plates Better Display reader answers and user text like native bubbles', () => {
    const plateRules = flatCssRules(CSS).filter(rule =>
      rule.selector.includes('[data-dsh-better-display]')
      && /background:\s*rgba/.test(rule.body),
    )
    const plated = (element: Element) => plateRules.some(rule => element.matches(rule.selector))
    document.body.setAttribute('data-dsh-maid-atelier', '')
    // Markup and CSS-module class names follow dsh-better-display 0.3.0 Reader.tsx.
    document.body.innerHTML = `<div data-dsh-better-display="0.3.0"><div data-chat-flow="">
      <section data-reader-turn="1">
        <div class="fQyGsq_userCluster" data-reader-anchor data-reader-key="u1">
          <div class="fQyGsq_userImages"></div>
          <div class="fQyGsq_user"><p>question</p></div>
          <div class="fQyGsq_userActions"></div>
        </div>
        <article class="fQyGsq_answer" data-reader-answer data-reader-anchor data-reader-key="a1"><p>answer</p></article>
        <article class="fQyGsq_processCommentary"><p>step</p></article>
      </section>
      <div class="fQyGsq_userCluster" data-reader-pending-submission>
        <div class="fQyGsq_user" id="pending"><div class="fQyGsq_blocks">sending</div></div>
      </div>
    </div></div>`
    const cluster = document.querySelector('[data-reader-key="u1"]')!
    expect(plated(document.querySelector('.fQyGsq_user')!)).toBe(true)
    expect(plated(document.getElementById('pending')!)).toBe(true)
    expect(plated(document.querySelector('[data-reader-answer]')!)).toBe(true)
    expect(plated(cluster)).toBe(false)
    expect(plated(document.querySelector('.fQyGsq_userImages')!)).toBe(false)
    expect(plated(document.querySelector('.fQyGsq_userActions')!)).toBe(false)
    expect(plated(document.querySelector('.fQyGsq_processCommentary')!)).toBe(false)

    document.body.setAttribute('data-ds-dark-theme', '')
    const darkAnswer = plateRules.filter(rule =>
      rule.selector.includes('[data-ds-dark-theme]')
      && document.querySelector('[data-reader-answer]')!.matches(rule.selector))
    expect(darkAnswer.map(rule => rule.body).join(' ')).toContain('rgba(18, 31, 67, 0.94)')
    document.body.removeAttribute('data-ds-dark-theme')

    document.body.removeAttribute('data-dsh-maid-atelier')
    expect(plated(document.querySelector('[data-reader-answer]')!)).toBe(false)
  })

  it('lets the lower sidebar swag own the bottom boundary without a rectangular tint seam', () => {
    const innerFrameRule = CSS.match(/\[class\*='sidebarCol'\] > div::before\s*\{([^}]*)\}/s)?.[1] ?? ''
    const fadeRule = CSS.match(/\[class\*='sidebarCol'\] \[class\*='fade'\]\s*\{([^}]*)\}/s)?.[1] ?? ''
    expect(innerFrameRule).toContain('inset: 9px 7px 0')
    expect(innerFrameRule).toContain('border: 0')
    expect(innerFrameRule).not.toContain('box-shadow')
    expect(fadeRule).toContain('background: none')
  })

  it('keeps internal tool-card headers out of the navy page-header treatment', () => {
    const pageHeaderRule = CSS.match(
      /\[data-slot='conversation.header'\] > header\s*\{([^}]*)\}/s,
    )?.[1] ?? ''
    const terminalRule = CSS.match(/\[data-terminal\]\s*\{([^}]*)\}/s)?.[1] ?? ''
    const darkTerminalRule = CSS.match(
      /\[data-ds-dark-theme\] \[data-terminal\]\s*\{([^}]*)\}/s,
    )?.[1] ?? ''
    expect(pageHeaderRule).toContain('color: #f8f3e8')
    expect(CSS).not.toMatch(
      /\[class\*='centerCol'\] \[class\*='header'\]\s*\{/,
    )
    expect(terminalRule).toContain('--dsw-alias-markdown-code-block: rgba(249, 250, 253, 0.97)')
    expect(terminalRule).toContain('--dsw-alias-label-primary: #172347')
    expect(terminalRule).toContain('text-shadow: none')
    expect(darkTerminalRule).toContain('--dsw-alias-markdown-code-block: rgba(10, 20, 48, 0.97)')
    expect(darkTerminalRule).toContain('--dsw-alias-label-primary: #edf1fa')
  })

  it('scales the lower sidebar swag at its source aspect ratio', () => {
    const sidebarInnerRule = CSS.match(
      /\[class\*='sidebarCol'\] > div\s*\{([^}]*)\}/s,
    )?.[1] ?? ''
    const footRule = CSS.match(/\[data-maid-sidebar-footer\]\s*\{([^}]*)\}/s)?.[1] ?? ''
    const swagRule = CSS.match(/\[data-maid-sidebar-footer\]::before\s*\{([^}]*)\}/s)?.[1] ?? ''
    expect(sidebarInnerRule).not.toContain('container-type')
    expect(footRule).toContain('box-sizing: border-box')
    expect(footRule).toContain('position: relative')
    expect(footRule).toContain('flex: 0 0 auto')
    expect(footRule).toContain('min-height: calc(var(--maid-sidebar-swag-height) + 82px)')
    expect(footRule).toContain('padding: calc(var(--maid-sidebar-swag-height) + 2px) 18px 22px')
    expect(swagRule).toContain('height: var(--maid-sidebar-swag-height)')
    expect(swagRule).toContain('background: var(--maid-sidebar-swag-art) center top / 100% 100% no-repeat')
    expect(swagRule).toContain('brightness(1.1)')
  })

  it('keeps generated corner ornaments fixed while the sidebar frame can resize', () => {
    const frameRule = CSS.match(
      /\[data-skin-chrome='sidebar-corners'\]\s*\{([^}]*)\}/s,
    )?.[1] ?? ''
    const cornerRule = CSS.match(
      /\[data-skin-chrome='sidebar-corners'\] > \[data-skin-corner\]\s*\{([^}]*)\}/s,
    )?.[1] ?? ''
    expect(CSS).toContain('--maid-sidebar-corner-art')
    expect(frameRule).toContain('--maid-sidebar-frame-line-x: 1.35px')
    expect(frameRule).toContain('--maid-sidebar-frame-line-y: 1.25px')
    expect(frameRule).toContain('left 62px top 8.875px / calc(100% - 124px) var(--maid-sidebar-frame-line-y) no-repeat')
    expect(frameRule).toContain('left 62px bottom 8.875px / calc(100% - 124px) var(--maid-sidebar-frame-line-y) no-repeat')
    expect(frameRule).toContain('left 8.05px top 62px / var(--maid-sidebar-frame-line-x) calc(100% - 124px) no-repeat')
    expect(frameRule).toContain('right 8.05px top 62px / var(--maid-sidebar-frame-line-x) calc(100% - 124px) no-repeat')
    expect(cornerRule).toContain('width: 62px')
    expect(cornerRule).toContain('height: 62px')
    expect(cornerRule).toContain('background: var(--maid-sidebar-corner-art) top right / 130px 130px no-repeat')
    expect(CSS).toContain("[data-skin-corner='bottom-left']")
    expect(CSS).toContain('transform: scale(-1)')
  })

  it('styles the workspace heading, search field, and settings surround in antique gold', () => {
    const headingRule = CSS.match(/\[class\*='sectionHeader'\]\s*\{([^}]*)\}/s)?.[1] ?? ''
    const searchRule = CSS.match(
      /\[class\*='search'\]\[class\*='searchExpanded'\]:has\(> input\[class\*='searchInput'\]\)\s*\{([^}]*)\}/s,
    )?.[1] ?? ''
    const expandedHeaderRule = CSS.match(
      /\[class\*='sectionHeader'\]:has\(\[class\*='searchSlotExpanded'\]\)\s*\{([^}]*)\}/s,
    )?.[1] ?? ''
    const settingsRule = CSS.match(
      /\[data-slot='sidebar\.settings'\][\s\S]*?button\[aria-haspopup='dialog'\]:has\(> \[data-slot='settings\.trigger'\]\)\s*\{([^}]*)\}/s,
    )?.[1] ?? ''
    expect(headingRule).toContain('color: #d9bd83')
    expect(searchRule).toContain('border: 1px solid rgba(225, 191, 124, 0.72)')
    expect(searchRule).toContain('margin: 0 2px')
    expect(expandedHeaderRule).toContain('height: 46px')
    expect(expandedHeaderRule).toContain('overflow: visible')
    expect(CSS).not.toMatch(/\[class\*='search'\]:has\(> input\[class\*='searchInput'\]\)\s*\{/)
    expect(settingsRule).toContain('min-height: 50px')
    expect(settingsRule).toContain('border-image-source: var(--maid-settings-frame-art)')
    expect(settingsRule).toContain('border-image-slice: 0 220 0 220 fill')
    expect(settingsRule).toContain('border-image-width: 0 34px')
  })

  it('retires the sidebar stacking context while the settings dialog is open', () => {
    // SettingsPanel is a position:fixed layer mounted inside the sidebar
    // content root, not in a document portal. The root carries
    // `position: relative; z-index: 2`, which makes it a stacking context, and
    // that ancestor context paints the fixed panel differently under WebKit
    // than under the Blink builds this skin was developed against: on Safari
    // 26.6 the panel laid out at its correct size and hit-tested as the
    // topmost element, yet never appeared. Raising the root's z-index keeps
    // the context and does not help; removing the context does — relative +
    // z-index auto creates no stacking context, so position must stay
    // relative (position: static re-homes the mask's containing block and
    // trips Chromium's compositor into painting the mascot over the mask).
    expect(SETTINGS_ROOT_STACKING_RULE).not.toBe('')
    expect(SETTINGS_ROOT_STACKING_RULE).toContain('z-index: auto')
    expect(SETTINGS_ROOT_STACKING_RULE).not.toContain('z-index: 1000')
    expect(SETTINGS_ROOT_STACKING_RULE).not.toContain('position: static')
    // The root release is only about stacking; the fade suppression below
    // lives on the dialog carrier one layer deeper.
    expect(SETTINGS_ROOT_STACKING_RULE).not.toContain('opacity')
    expect(SETTINGS_ROOT_STACKING_RULE).not.toContain('animation')
  })

  it('keeps the settings dialog carrier opaque across the sidebar auto-collapse', () => {
    // The official sidebar toggles its 1024px auto-collapse with class phases
    // on the SidebarRoot element: `railIn` runs a rail-fade-in animation on
    // the root's .footArea (0% opacity: 0, backwards fill — the fixed
    // settings overlay is mounted inside .footArea, so the whole panel fades
    // from transparent), and `fading` fades every root child to 0. The same
    // defect hit orca-link, which suppressed it on the .footArea carrier.
    expect(SETTINGS_CARRIER_FADE_RULE).not.toBe('')
    expect(SETTINGS_CARRIER_FADE_RULE).toContain('opacity: 1 !important')
    expect(SETTINGS_CARRIER_FADE_RULE).toContain('transition: none !important')
    expect(SETTINGS_CARRIER_FADE_RULE).toContain('animation: none !important')
  })

  it('ends the drawer entrance without disabling it around the settings dialog', () => {
    // The entrance must use `backwards`. With `both` the finished animation
    // stayed applied, which kept this column a containing block for the fixed
    // settings overlay mounted inside it — that forced an `animation: none`
    // release while the dialog was open, and the release replayed the entrance
    // the instant the dialog closed, because the property came back on the same
    // column and the browser treated it as a new animation. Measured on a phone
    // viewport (393x844, topbar): animationend at 3981ms when the drawer opened,
    // then a fresh animationstart at 6732ms right after settings closed.
    const source = withoutReducedMotion(CSS.replace(/\/\*[\s\S]*?\*\//g, ' '))
    const entrances = [...source.matchAll(
      /([^{}]*?)\{\s*animation: maidAtelierPhoneDrawerIn 220ms cubic-bezier\(0\.22, 0\.78, 0\.2, 1\) (\w+);/g,
    )].map((match) => ({
      selector: (match[1] ?? '').trim().replace(/\s+/g, ' '),
      fill: match[2] ?? '',
    }))
    expect(entrances.length, 'drawer entrance rules').toBeGreaterThanOrEqual(2)
    for (const entrance of entrances) expect(entrance.fill, 'drawer entrance fill mode').toBe('backwards')

    // The dialog-triggered release on this column must not come back: it is what
    // replayed. Every rule that cancels an animation is matched against the real
    // drawer column with the settings dialog inside it, so an equivalent rewrite
    // (a bare column selector, a looser `:has([role='dialog'])`,
    // `animation-name: none`) is caught as well. The carrier rule that keeps the
    // dialog opaque legitimately declares `animation: none` for another element,
    // and the reduced-motion overrides are stripped above — outside those, no
    // rule may cancel this column's entrance.
    document.body.setAttribute('data-dsh-maid-atelier', '')
    document.body.innerHTML = `
      <div id="root"><div data-slot="root"><div class="fixture_frame">
        <div class="fixture_sidebarCol">
          <div data-slot="sidebar" style="display: contents">
            <div class="fixture_root">
              <div class="fixture_footArea">
                <div class="fixture_settingsArea">
                  <div data-slot="sidebar.settings">
                    <button type="button" class="fixture_trigger"></button>
                    <div role="presentation">
                      <div class="fixture_mask"></div>
                      <div role="dialog" aria-modal="true"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div></div></div>
    `
    const column = document.querySelector('.fixture_sidebarCol')!
    const cancellations = flatCssRules(source)
      .filter((rule) => /(?:^|[\s;])animation(?:-name)?\s*:\s*none/.test(rule.body))
    expect(cancellations.length, 'harvested animation cancellations').toBeGreaterThan(0)
    for (const mode of ['topbar', 'rail']) {
      document.documentElement.setAttribute('data-maid-nav-mode', mode)
      // Sanity: this fixture really is the drawer column, or the negative
      // assertion below would pass vacuously.
      expect(
        entrances.filter((entrance) => column.matches(entrance.selector)).length,
        `entrance rules matching the fixture in ${mode} mode`,
      ).toBeGreaterThanOrEqual(1)
      for (const rule of cancellations) {
        let matches = false
        let evaluable = true
        try {
          matches = column.matches(rule.selector)
        } catch {
          evaluable = false
        }
        // A selector this environment cannot evaluate must not pass silently.
        expect(evaluable, `cancellation rule not evaluable: ${rule.selector}`).toBe(true)
        expect(matches, `rule cancels the drawer entrance in ${mode} mode: ${rule.selector}`).toBe(false)
      }
    }
    document.documentElement.removeAttribute('data-maid-nav-mode')
    document.body.removeAttribute('data-dsh-maid-atelier')
  })

  it('tags the official footArea and SidebarRoot as dialog carriers, not the slot anchor', async () => {
    // The slot anchor is a display:contents wrapper, so the column's direct
    // div is NOT the SidebarRoot: the root (z-index release target) and the
    // footArea (fade target) are different layers. The client finds them by
    // structure and tags them, because a `:has()` probe for the same ancestors
    // was evaluated on every element of the document on every style pass.
    document.body.innerHTML = `
      <div class="fixture_sidebarCol">
        <div data-slot="sidebar" style="display: contents">
          <div class="fixture_root">
            <div class="fixture_logoRow"></div>
            <div class="fixture_footArea">
              <div class="fixture_footerActions"></div>
              <div class="fixture_settingsArea">
                <div data-slot="sidebar.settings">
                  <button type="button">Settings</button>
                  <div role="presentation">
                    <div class="fixture_mask"></div>
                    <div role="dialog" aria-modal="true"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `
    const root = document.querySelector<HTMLElement>('.fixture_root')!
    const footArea = document.querySelector<HTMLElement>('.fixture_footArea')!
    fiber = await mount()
    expect(root.hasAttribute('data-maid-dialog-root')).toBe(true)
    expect(footArea.hasAttribute('data-maid-dialog-carrier')).toBe(true)
    expect(root.hasAttribute('data-maid-dialog-carrier')).toBe(false)
    expect(footArea.hasAttribute('data-maid-dialog-root')).toBe(false)

    // The tag follows the dialog out and leaves nothing behind on dispose.
    document.querySelector('[role="dialog"]')!.remove()
    await flushMutations()
    expect(root.hasAttribute('data-maid-dialog-root')).toBe(false)
    expect(footArea.hasAttribute('data-maid-dialog-carrier')).toBe(false)
    const tip = document.createElement('div')
    tip.setAttribute('role', 'tooltip')
    document.querySelector('.fixture_logoRow')!.append(tip)
    await flushMutations()
    expect(root.hasAttribute('data-maid-tooltip-carrier')).toBe(true)
    tip.remove()
    await flushMutations()
    expect(root.hasAttribute('data-maid-tooltip-carrier')).toBe(false)
    document.querySelector('.fixture_logoRow')!.append(tip)
    await flushMutations()
    await fiber.dispose()
    expect(document.querySelector('[data-maid-tooltip-carrier], [data-maid-dialog-root], [data-maid-dialog-carrier], [data-maid-cordis-carrier], [data-maid-badge-carrier]')).toBeNull()
  })

  it('lets the official settings mask blur every skin-owned layer', () => {
    const sidebarRule = CSS.match(
      /\[class\*='sidebarCol'\]\s*\{([^}]*)\}/s,
    )?.[1] ?? ''
    const sidebarInnerRule = CSS.match(
      /\[class\*='sidebarCol'\] > div\s*\{([^}]*)\}/s,
    )?.[1] ?? ''
    const sidebarContentRule = CSS.match(
      /\[class\*='sidebarCol'\]\s*> div > :has\(\[data-maid-sidebar-footer\]\)\s*\{([^}]*)\}/s,
    )?.[1] ?? ''
    const footerRule = CSS.match(
      /\[class\*='sidebarCol'\]\s*> div > \[data-maid-sidebar-footer\]\s*\{([^}]*)\}/s,
    )?.[1] ?? ''
    const topTrimRule = CSS.match(/\[data-skin-chrome='top-trim'\]\s*\{([^}]*)\}/s)?.[1] ?? ''
    const bottomTrimRule = CSS.match(/\[data-skin-chrome='bottom-trim'\]\s*\{([^}]*)\}/s)?.[1] ?? ''
    const conversationHeaderRule = CSS.match(
      /\[data-slot='conversation.header'\] > header\s*\{([^}]*)\}/s,
    )?.[1] ?? ''
    const composerRule = CSS.match(/\[data-composer-card\]\s*\{([^}]*)\}/s)?.[1] ?? ''
    const obscuredComposerRule = CSS.match(
      /\[data-maid-settings-open\] \[data-composer-card\]\s*\{([^}]*)\}/s,
    )?.[1] ?? ''
    const releasedSettingsRowRule = CSS.match(
      /\[class\*='sidebarCol'\]\s*> div\s*> \[data-maid-dialog-root\]\s*\{([^}]*)\}/s,
    )?.[1] ?? ''
    const preservedSidebarFrameRule = CSS.match(
      /:has\(\[role='dialog'\]\[aria-modal='true'\]\) \[data-skin-chrome='sidebar-corners'\]\s*\{([^}]*)\}/s,
    )?.[1] ?? ''
    expect(sidebarRule).toContain('z-index: auto')
    expect(sidebarInnerRule).toContain('isolation: auto')
    expect(sidebarInnerRule).not.toContain('container-type')
    expect(sidebarContentRule).toBe('')
    expect(footerRule).toContain('z-index: auto')
    expect(topTrimRule).toContain('z-index: 1')
    expect(bottomTrimRule).toContain('z-index: 1')
    expect(conversationHeaderRule).toContain('z-index: 21')
    expect(CSS).not.toContain("button[class*='tab']")
    expect(CSS).not.toContain("[class*='tabActive']")
    expect(CSS).toMatch(/button\[role='tab'\]\s*\{[^}]*color: #d7def0/s)
    expect(CSS).toMatch(/button\[role='tab'\]\[aria-selected='true'\]\s*\{[^}]*color: #fff7e6/s)
    expect(composerRule).toContain('z-index: 21')
    // Not a promotion any more: the sidebar row releases its stacking
    // context (z-index: auto, position stays relative) so the settings
    // dialog's native modal layer competes at page level again. Shared with
    // the dedicated spec above so one rule is parsed in one place.
    expect(releasedSettingsRowRule).not.toBe('')
    expect(releasedSettingsRowRule).toContain('z-index: auto')
    expect(releasedSettingsRowRule).not.toContain('position: static')
    expect(releasedSettingsRowRule).not.toContain('z-index: 1000')
    expect(preservedSidebarFrameRule).toBe('')
    expect(obscuredComposerRule).toContain('z-index: 0')
    expect(obscuredComposerRule).toContain('opacity: 0.75')
    expect(obscuredComposerRule).toContain('pointer-events: none')
  })

  it('keeps the settings panel translucent above the dimmed composer', () => {
    // rc.1 mounts the overlay in the settings slot; rc.2 portals it to <body>.
    const overlay = /:is\(\[data-slot='sidebar\.settings'\] \[role='presentation'\], :where\(body\) > \[role='presentation'\]\[data-maid-settings-overlay\]\)/.source
    const settingsSurfaceRule = CSS.match(
      new RegExp(`${overlay}\\s*> \\[role='dialog'\\]\\[aria-modal='true'\\]\\s*\\{([^}]*)\\}`, 's'),
    )?.[1] ?? ''
    const settingsSurfaceBackingRule = CSS.match(
      new RegExp(`${overlay}\\s*> \\[role='dialog'\\]\\[aria-modal='true'\\]::before\\s*\\{([^}]*)\\}`, 's'),
    )?.[1] ?? ''
    const darkSettingsSurfaceRule = CSS.match(
      new RegExp(`\\[data-ds-dark-theme\\]\\s+${overlay}\\s*> \\[role='dialog'\\]\\[aria-modal='true'\\]\\s*\\{([^}]*)\\}`, 's'),
    )?.[1] ?? ''
    expect(settingsSurfaceRule).toContain('--dsw-alias-bg-layer-2: rgba(235, 240, 250, 0.68)')
    expect(settingsSurfaceRule).toContain('background: transparent')
    expect(settingsSurfaceRule).not.toContain('backdrop-filter')
    expect(settingsSurfaceBackingRule).toContain('background: var(--dsw-alias-bg-layer-2)')
    expect(settingsSurfaceBackingRule).toContain('backdrop-filter: blur(6px) saturate(0.9)')
    expect(darkSettingsSurfaceRule).toContain('--dsw-alias-bg-layer-2: rgba(24, 40, 80, 0.82)')
    expect(CSS).not.toMatch(
      /body\[data-dsh-maid-atelier\]\s+\[role='presentation'\]\s*> \[role='dialog'\]\[aria-modal='true'\]/s,
    )
  })

  it('responds to constrained viewports without squeezing settings rows', () => {
    // The settings overlay owns the viewport below the desktop threshold.
    const fullScreenRule = CSS.match(
      /@media \(max-width: 1099px\), \(max-height: 680px\)\s*\{([\s\S]*?)\n\}/,
    )?.[1] ?? ''
    // Its height gives up the desktop window strip (zero on the web shell).
    expect(fullScreenRule).toContain('width: 100vw')
    expect(fullScreenRule).toContain('height: calc(100vh - var(--maid-window-strip, 0px))')
    expect(fullScreenRule).toContain('height: calc(100dvh - var(--maid-window-strip, 0px))')
    expect(fullScreenRule).toContain('border-radius: 0')

    // Phones move the category rail above the content as a 3-across grid.
    const phoneRule = CSS.match(
      /@media \(max-width: 640px\)\s*\{([\s\S]*?)\n\}/,
    )?.[1] ?? ''
    expect(phoneRule).toContain('flex-direction: column')
    expect(phoneRule).toContain('flex-direction: row')
    expect(phoneRule).toContain('grid-template-columns: repeat(3, minmax(0, 1fr))')
    expect(phoneRule).toContain('border-bottom: 1px solid rgba(197, 164, 104, 0.42)')
    expect(phoneRule).toContain('min-height: 0')

    // Narrow panes stack official rows and this skin's customization card.
    const narrowRule = CSS.match(
      /@media \(max-width: 520px\)\s*\{([\s\S]*?)\n\}/,
    )?.[1] ?? ''
    expect(narrowRule).toContain("[class$='_row']:has(> [class$='_rowText'])")
    expect(narrowRule).toContain('flex-direction: column')
    expect(narrowRule).toContain("padding-right: 0")
    expect(narrowRule).toContain("[class$='_selectRow'] select")
    expect(narrowRule).toContain('max-width: none')

    // The default centered opening position is kept: no docked large-screen
    // layout, no baseline size/position overrides on the settings overlay.
    // The only large-screen rule clears the Windows titlebar strip and keeps
    // the host's centering.
    const largeScreenBlocks = [...CSS.matchAll(
      /@media \(min-width: 1100px\) and \(min-height: 681px\) \{([\s\S]*?)\n\}/g,
    )].map(match => match[1] ?? '')
    expect(largeScreenBlocks).toHaveLength(1)
    expect(largeScreenBlocks[0]).toMatch(/^\s*html\[data-windows-titlebar\] body\[data-dsh-maid-atelier\]\[data-maid-settings-open\]/)
    expect(largeScreenBlocks[0]).not.toMatch(/justify-content|align-items|padding/)
    expect(CSS).not.toMatch(
      /data-maid-settings-open[\s\S]*?\[role='presentation'\]\s*\{[^}]*justify-content: flex-start/s,
    )
    const overlayBaselineRule = [...CSS.matchAll(
      /body\[data-dsh-maid-atelier\]\[data-maid-settings-open\]\s+\[data-slot='sidebar\.settings'\]\s*> \[role='presentation'\]\s*\{([^}]*)\}/g,
    )].map(match => match[1] ?? '').join('\n')
    expect(overlayBaselineRule).toBe('')

    // Every rule is scoped to the open settings dialog, never body-level :has.
    expect(CSS).not.toMatch(
      /body\[data-dsh-maid-atelier\](?:\[[^\]]+\]|:not\([^)]*\))*:has\(/,
    )
  })

  it('dresses the settings select popup in the porcelain-and-gold language', () => {
    const baseSelectRule = CSS.match(
      /@supports \(appearance: base-select\)\s*\{[\s\S]*?body\[data-dsh-maid-atelier\] \[role='dialog'\] select\s*\{([^}]*)\}/s,
    )?.[1] ?? ''
    const inputSelectRule = CSS.match(
      /body\[data-dsh-maid-atelier\] \[role='dialog'\] select\[class\$='_selectInput'\]\s*\{([^}]*)\}/s,
    )?.[1] ?? ''
    const pickerIconRule = CSS.match(
      /body\[data-dsh-maid-atelier\] \[role='dialog'\] select::picker-icon\s*\{([^}]*)\}/s,
    )?.[1] ?? ''
    const openIconRule = CSS.match(
      /body\[data-dsh-maid-atelier\] \[role='dialog'\] select:open::picker-icon\s*\{([^}]*)\}/s,
    )?.[1] ?? ''
    const pickerRule = CSS.match(
      /body\[data-dsh-maid-atelier\] \[role='dialog'\] select::picker\(select\)\s*\{([^}]*)\}/s,
    )?.[1] ?? ''
    const optionRule = CSS.match(
      /body\[data-dsh-maid-atelier\] \[role='dialog'\] select option\s*\{([^}]*)\}/s,
    )?.[1] ?? ''
    const hoverRule = CSS.match(
      /body\[data-dsh-maid-atelier\] \[role='dialog'\] select option:hover,\s*body\[data-dsh-maid-atelier\] \[role='dialog'\] select option:focus-visible\s*\{([^}]*)\}/s,
    )?.[1] ?? ''
    const checkedRule = CSS.match(
      /body\[data-dsh-maid-atelier\] \[role='dialog'\] select option:checked\s*\{([^}]*)\}/s,
    )?.[1] ?? ''
    const darkIconRule = CSS.match(
      /body\[data-dsh-maid-atelier\]\[data-ds-dark-theme\] \[role='dialog'\] select::picker-icon\s*\{([^}]*)\}/s,
    )?.[1] ?? ''
    const darkPickerRule = CSS.match(
      /body\[data-dsh-maid-atelier\]\[data-ds-dark-theme\] \[role='dialog'\] select::picker\(select\)\s*\{([^}]*)\}/s,
    )?.[1] ?? ''
    const darkOptionRule = CSS.match(
      /body\[data-dsh-maid-atelier\]\[data-ds-dark-theme\] \[role='dialog'\] select option\s*\{([^}]*)\}/s,
    )?.[1] ?? ''
    const darkCheckedRule = CSS.match(
      /body\[data-dsh-maid-atelier\]\[data-ds-dark-theme\] \[role='dialog'\] select option:checked\s*\{([^}]*)\}/s,
    )?.[1] ?? ''

    // The closed control keeps the product's `_input` geometry (32px, 8px
    // radius, porcelain fill) shared with the text inputs beside it; only the
    // OS arrow is dropped so ::picker-icon can own it. Every select — the
    // official `_selectInput` and the skin's own bare customization card
    // selects — becomes a flex row so the icon is vertically centered, with
    // single-line truncation for long labels.
    expect(baseSelectRule).toContain('appearance: base-select')
    expect(baseSelectRule).toContain('background-image: none')
    expect(baseSelectRule).toContain('display: flex')
    expect(baseSelectRule).toContain('align-items: center')
    expect(baseSelectRule).toContain('white-space: nowrap')
    expect(baseSelectRule).toContain('overflow: hidden')
    expect(inputSelectRule).toContain('box-sizing: border-box')
    expect(inputSelectRule).toContain('display: flex')
    expect(inputSelectRule).toContain('height: 32px')
    expect(inputSelectRule).toContain('padding-inline: 10px')

    // Gold chevron flips while the popup is open.
    expect(pickerIconRule).toContain('background: #c5a468')
    expect(pickerIconRule).toContain('clip-path: polygon(0 0, 100% 0, 50% 100%)')
    expect(pickerIconRule).toContain('transition: transform 140ms ease')
    expect(pickerIconRule).toContain('flex: none')
    expect(openIconRule).toContain('transform: rotate(180deg)')

    // The popup reuses the settings surface's glass porcelain and gold rim.
    expect(pickerRule).toContain('max-height: min(420px, 62vh)')
    expect(pickerRule).toContain('min-width: min(200px, calc(100vw - 24px))')
    expect(pickerRule).toContain('border: 1px solid rgba(197, 164, 104, 0.64)')
    expect(pickerRule).toContain('border-radius: 10px')
    expect(pickerRule).toContain('rgba(252, 250, 245, 0.98)')
    expect(pickerRule).toContain('scrollbar-color')
    expect(optionRule).toContain('min-height: 30px')
    expect(optionRule).toContain('border-left: 2px solid transparent')
    expect(optionRule).toContain('white-space: nowrap')
    expect(hoverRule).toContain('rgba(197, 164, 104, 0.72)')
    expect(checkedRule).toContain('border-left-color: #c5a468')
    expect(checkedRule).toContain('font-weight: 600')

    // Night palette swaps the panel to navy glass with the brighter gold.
    expect(darkIconRule).toContain('background: #d3b477')
    expect(darkPickerRule).toContain('border-color: rgba(211, 180, 119, 0.66)')
    expect(darkPickerRule).toContain('rgba(19, 38, 82, 0.98)')
    expect(darkPickerRule).toContain('color: #e7ecf7')
    expect(darkOptionRule).toContain('color: #bdc9e3')
    expect(darkCheckedRule).toContain('border-left-color: #d3b477')

    // Every rule stays inside a dialog and behind the base-select gate: no
    // body-level select styling, no body-level :has() selector.
    expect(CSS).not.toMatch(
      /body\[data-dsh-maid-atelier\](?:\[[^\]]+\])?\s+select\s*\{[^}]*appearance: base-select/s,
    )
    expect(CSS).not.toMatch(
      /body\[data-dsh-maid-atelier\]\s+(?:\[[^\]]+\]\s+)*:has\([^)]*\)[^{}]*select\s*\{/s,
    )
  })

  it('renders the active workspace as a crested ribbon with a connected session tree', () => {
    const ribbonShapeRule = CSS.match(/\[data-maid-workspace-active\]::before\s*\{([^}]*)\}/s)?.[1] ?? ''
    const shieldRule = CSS.match(
      /\[data-maid-workspace-row\] > \[class\*='folder'\]\s*\{([^}]*)\}/s,
    )?.[1] ?? ''
    const sessionRowRule = CSS.match(
      /\[data-maid-session-row\]\s*\{([^}]*)\}/s,
    )?.[1] ?? ''
    const selectedSessionRule = CSS.match(
      /\[data-maid-session-row\]\[aria-selected='true'\]\s*\{([^}]*)\}/s,
    )?.[1] ?? ''
    const sessionBranchRule = CSS.match(
      /\[data-maid-session-row\]::before\s*\{([^}]*)\}/s,
    )?.[1] ?? ''
    const selectedSessionPlaqueRule = CSS.match(
      /\[data-maid-session-row\]:not\(\[data-maid-session-flat\]\)\[aria-selected='true'\]::after\s*\{([^}]*)\}/s,
    )?.[1] ?? ''
    expect(CSS).toContain('--maid-workspace-crest-art')
    expect(CSS).toContain('--maid-workspace-ribbon-art')
    expect(shieldRule).toContain('background: var(--maid-workspace-crest-art)')
    expect(shieldRule).not.toContain('clip-path')
    expect(ribbonShapeRule).toContain('border-image-source: var(--maid-workspace-ribbon-art)')
    expect(ribbonShapeRule).toContain('border-image-slice: 0 145 0 140 fill')
    expect(ribbonShapeRule).toContain('border-image-width: 0 36px 0 35px')
    expect(ribbonShapeRule).toContain('border-image-repeat: stretch')
    expect(ribbonShapeRule).toContain('inset: -3px 0 -3px -12px')
    // One continuous reveal plus a separate settle: per-stop easing used to
    // stall the reveal at 70% before the swallowtail.
    expect(ribbonShapeRule).toContain('maidAtelierWorkspaceRibbonEnter 440ms cubic-bezier(0.22, 0.78, 0.2, 1) both')
    expect(ribbonShapeRule).toContain('maidAtelierWorkspaceRibbonSettle 440ms')
    expect(ribbonShapeRule).not.toContain('background-size')
    expect(ribbonShapeRule).not.toContain('clip-path')
    expect(CSS).toContain('@keyframes maidAtelierWorkspaceRibbonEnter')
    expect(CSS).toContain('clip-path: inset(0 100% 0 0)')
    expect(CSS).not.toContain('clip-path: inset(0 12% 0 0)')
    expect(CSS).toMatch(/@keyframes maidAtelierWorkspaceRibbonEnter \{\s*from \{[^}]*\}\s*to \{[^}]*\}\s*\}/)
    expect(CSS).toContain('@keyframes maidAtelierWorkspaceRibbonContentEnter')
    expect(sessionRowRule).toContain('box-sizing: border-box')
    expect(sessionRowRule).toContain('width: 100%')
    expect(sessionRowRule).toContain('min-width: 0')
    expect(selectedSessionRule).toContain('background: transparent')
    expect(selectedSessionRule).toContain('color: #fff8e8')
    expect(selectedSessionPlaqueRule).toContain('inset: 0 0 0 18px')
    expect(selectedSessionPlaqueRule).toContain('border-radius: 8px')
    expect(selectedSessionPlaqueRule).toContain('rgba(226, 190, 112, 0.72)')
    expect(selectedSessionPlaqueRule).toContain('rgba(82, 111, 184, 0.74)')
    expect(sessionBranchRule).toContain('repeating-linear-gradient')
    expect(sessionBranchRule).toContain('left: 8px')
    expect(sessionBranchRule).toContain('width: 10px')
    expect(CSS).toMatch(/\[data-maid-session-last\]::before\s*\{[^}]*1px 50% no-repeat/s)
  })

  it('renders the selected flat-list Session as a complete gold-edged plaque', () => {
    const flatRule = CSS.match(/\[data-maid-session-flat\]\s*\{([^}]*)\}/s)?.[1] ?? ''
    const selectedRule = CSS.match(
      /\[data-maid-session-flat\]\[aria-selected='true'\]\s*\{([^}]*)\}/s,
    )?.[1] ?? ''
    const accentRule = CSS.match(
      /\[data-maid-session-flat\]\[aria-selected='true'\]::before\s*\{([^}]*)\}/s,
    )?.[1] ?? ''
    expect(flatRule).toContain('box-sizing: border-box')
    expect(flatRule).toContain('border-radius: 7px')
    expect(selectedRule).toContain('rgba(226, 190, 112, 0.72)')
    expect(selectedRule).toContain('rgba(82, 111, 184, 0.74)')
    expect(accentRule).toContain('linear-gradient(#fff0c5, #d4a951)')
    expect(accentRule).toContain('inset: 7px auto 7px 5px')
  })

  it('keeps the official StateDot circle pair and pauses its arc on phones and reduced motion', () => {
    const runningDotRule = CSS.match(
      /\[data-maid-session-row\] svg\[data-state='ongoing'\]\s*\{([^}]*)\}/s,
    )?.[1] ?? ''
    // StateDot.tsx at c36a83ff: both circles live in the rotating group;
    // animation and arc geometry come from the host's CSS module.
    document.body.innerHTML = `<div data-maid-session-row>
      <svg data-state="ongoing" viewBox="0 0 24 24"><g>
        <circle cx="12" cy="12" r="9.5"/><circle cx="12" cy="12" r="9.5"/>
      </g></svg>
    </div>`
    const runningChildren = "[data-maid-session-row] svg[data-state='ongoing'] > g > circle"
    const phoneRules = [...CSS.matchAll(
      /@media \(max-width: 700px\)\s*\{([\s\S]*?)\n\}/g,
    )].map(match => match[1]).join('\n')
    const reducedMotionRules = [...CSS.matchAll(
      /@media \(prefers-reduced-motion: reduce\)\s*\{([\s\S]*?)\n\}/g,
    )].map(match => match[1]).join('\n')
    expect(runningDotRule).toContain('width: 12px')
    expect(runningDotRule).toContain('radial-gradient')
    expect(runningDotRule).toContain('shape-rendering: geometricPrecision')
    expect(document.querySelectorAll(runningChildren)).toHaveLength(2)
    expect(phoneRules).toContain(runningChildren)
    expect(phoneRules).toContain('animation: maidAtelierSessionJewelPulse')
    expect(reducedMotionRules).toContain(runningChildren)
    expect(reducedMotionRules).toMatch(/svg\[data-state='ongoing'\]\s*\{[^}]*animation: none[^}]*will-change: auto/s)
    expect(reducedMotionRules).toContain('animation: none')
  })

  it('moves the running reasoning sweep on the compositor instead of relayout', () => {
    const sweepRule = CSS.match(
      /\[data-variant='think'\]\[data-state='running'\] \[class\*='row'\]::after\s*\{([^}]*)\}/s,
    )?.[1] ?? ''
    const sweepKeyframes = CSS.match(
      /@keyframes maid-atelier-reasoning-sweep\s*\{([\s\S]*?)\n\}/,
    )?.[1] ?? ''
    expect(sweepRule).toContain('left: -240px')
    expect(sweepRule).toContain('will-change: transform, opacity')
    expect(sweepKeyframes).toContain('transform: translate3d(')
    expect(sweepKeyframes).not.toMatch(/\bleft\s*:/)
  })

  it('keeps the sidebar mascot subordinate to navigation and behind the lower ornament', () => {
    const mascotRule = CSS.match(/\[data-skin-chrome='sidebar-mascot'\]\s*\{([^}]*)\}/s)?.[1] ?? ''
    expect(mascotRule).toContain('bottom: calc(var(--maid-sidebar-swag-height) + 94px)')
    expect(mascotRule).toContain('width: var(--maid-sidebar-mascot-width)')
    expect(mascotRule).toContain('max-height: 38%')
    expect(mascotRule).toContain('z-index: 0')
    expect(mascotRule).toContain('opacity: 0.92')
    expect(mascotRule).toContain('saturate(1)')
    expect(mascotRule).toContain('brightness(1.08)')
  })

  it('keeps independently sized landing and workspace trim layers', () => {
    const topTrimRule = CSS.match(/\[data-skin-chrome='top-trim'\]\s*\{([^}]*)\}/s)?.[1] ?? ''
    const landingTrimRule = CSS.match(/\[data-skin-trim-layer='landing'\]\s*\{([^}]*)\}/s)?.[1] ?? ''
    const workspaceTrimRule = CSS.match(/\[data-skin-trim-layer='workspace'\]\s*\{([^}]*)\}/s)?.[1] ?? ''
    expect(topTrimRule).toContain('height: 76px')
    expect(topTrimRule).toContain('overflow: hidden')
    expect(landingTrimRule).toContain('height: 48px')
    expect(landingTrimRule).toContain('background: var(--maid-top-trim-art) left -2px / auto 51px repeat-x')
    expect(workspaceTrimRule).toContain('height: 76px')
    expect(workspaceTrimRule).toContain('background: var(--maid-top-trim-art) left -4px / auto 149px repeat-x')
    expect(CSS).not.toMatch(/var\(--maid-top-trim-art\)[^;]*100% 100%/)
    expect(topTrimRule).toContain('position: absolute')
    expect(topTrimRule).toContain('inset: 0 0 auto 0')
    expect(topTrimRule).not.toContain('--maid-sidebar-width')
    expect(topTrimRule).not.toContain('box-shadow')
  })

  it('tiles the bottom border while keeping its center crest independently sized', () => {
    const bottomTrimRule = CSS.match(/\[data-skin-chrome='bottom-trim'\]\s*\{([^}]*)\}/s)?.[1] ?? ''
    const crestRule = CSS.match(/\[data-skin-chrome='bottom-trim'\]::after\s*\{([^}]*)\}/s)?.[1] ?? ''
    expect(bottomTrimRule).toContain('position: absolute')
    expect(bottomTrimRule).toContain('inset: auto 0 0 0')
    expect(bottomTrimRule).not.toContain('--maid-sidebar-width')
    expect(bottomTrimRule).toContain('background: var(--maid-bottom-trim-art) left bottom / auto 30px repeat-x')
    expect(bottomTrimRule).not.toContain('100% 100%')
    expect(crestRule).toContain('left: calc((100% - 8px) / 2)')
    expect(crestRule).toContain('transform: translateX(-50%)')
    expect(crestRule).toContain('background: var(--maid-bottom-crest-art) center / contain no-repeat')
  })

  it('moves and hides the bottom embroidery with the composer phase', () => {
    const bottomTrimRule = CSS.match(/\[data-skin-chrome='bottom-trim'\]\s*\{([^}]*)\}/s)?.[1] ?? ''
    const activeTrimRule = CSS.match(
      /\[data-maid-conversation-active\] \[data-skin-chrome='bottom-trim'\]\s*\{([^}]*)\}/s,
    )?.[1] ?? ''
    const movingTrimRule = CSS.match(
      /body\[data-dsh-maid-atelier\]\[data-maid-composer-motion\]\s*\[data-skin-chrome='bottom-trim'\]\s*\{([^}]*)\}/s,
    )?.[1] ?? ''
    expect(bottomTrimRule).not.toContain('--maid-sidebar-width')
    expect(bottomTrimRule).toContain('transform: translateY(0)')
    expect(bottomTrimRule).toContain('opacity: 1')
    expect(bottomTrimRule).toContain('transition:')
    expect(bottomTrimRule).toContain('transform 520ms')
    expect(bottomTrimRule).toContain('opacity 160ms ease-out')
    expect(bottomTrimRule).not.toContain('transition: translate 520ms')
    expect(activeTrimRule).toContain('transform: translateY(100%)')
    expect(activeTrimRule).toContain('opacity: 0')
    expect(activeTrimRule).not.toContain('--maid-sidebar-width')
    expect(movingTrimRule).toContain('will-change: transform')
  })

  it('slides the landing trim upward while the workspace trim drops from above', () => {
    const trimLayerRule = CSS.match(/\[data-skin-trim-layer\]\s*\{([^}]*)\}/s)?.[1] ?? ''
    const landingTrimRule = CSS.match(/\[data-skin-trim-layer='landing'\]\s*\{([^}]*)\}/s)?.[1] ?? ''
    const workspaceTrimRule = CSS.match(/\[data-skin-trim-layer='workspace'\]\s*\{([^}]*)\}/s)?.[1] ?? ''
    const activeLandingRule = CSS.match(
      /\[data-maid-workspace\][\s\S]*?\[data-skin-trim-layer='landing'\]\s*\{([^}]*)\}/s,
    )?.[1] ?? ''
    const activeWorkspaceRule = CSS.match(
      /\[data-maid-workspace\][\s\S]*?\[data-skin-trim-layer='workspace'\]\s*\{([^}]*)\}/s,
    )?.[1] ?? ''
    expect(trimLayerRule).toContain('transition: transform 520ms')
    expect(landingTrimRule).toContain('transform: translateY(0)')
    expect(workspaceTrimRule).toContain('transform: translateY(-100%)')
    expect(activeLandingRule).toContain('transform: translateY(-100%)')
    expect(activeWorkspaceRule).toContain('transform: translateY(0)')
  })

  it('keeps the bow on the landing trim and leaves the workspace band plain', () => {
    const landingBowRule = CSS.match(
      /\[data-skin-trim-layer='landing'\]::after\s*\{([^}]*)\}/s,
    )?.[1] ?? ''
    expect(landingBowRule).toContain("content: ''")
    expect(landingBowRule).toContain('left: calc((100% - 8px) / 2)')
    expect(landingBowRule).toContain('background: var(--maid-bow-art) center / contain no-repeat')
    expect(CSS).not.toMatch(/\[data-skin-trim-layer='workspace'\]::after/)
  })

  it('keeps the animated workspace trim above its tablist without reserving lace space', () => {
    const workspaceHeaderRule = CSS.match(
      /body\[data-dsh-maid-atelier\] header:has\(\[role='tablist'\]\)\s*\{([^}]*)\}/s,
    )?.[1] ?? ''
    expect(workspaceHeaderRule).toContain('position: relative')
    expect(workspaceHeaderRule).toContain('z-index: 21')
    expect(workspaceHeaderRule).not.toContain('padding-bottom')
    expect(workspaceHeaderRule).toContain('border-bottom: 0')
    const rootRule = CSS.match(/\[id='root'\]\s*\{([^}]*)\}/s)?.[1] ?? ''
    expect(rootRule).toContain('position: relative')
    expect(rootRule).not.toContain('z-index')
  })

  it('does not reserve or paint a lace field in active conversation and inspection views', () => {
    expect(CSS).not.toContain('padding-bottom: 66px')
    const conversationRules = [...CSS.matchAll(
      /[^{}]*\[data-phase='active'\][^{}]*\{([^{}]*)\}/g,
    )].map(match => match[1]).join('\n')
    expect(conversationRules).not.toContain('padding-bottom: 28px')
    expect(CSS).not.toMatch(
      /:has\(header \[role='tablist'\]\):not\(:has\(\[data-conversation-scroll\] \[data-chat-flow\]\)\)[\s\S]*?background-color:/s,
    )
    expect(CSS).not.toMatch(
      /:has\(\[role='toolbar'\]\[aria-label='Trajectory toolbar'\]\)[\s\S]*?background-color:/s,
    )
  })

  it('softens workspace entry and disables decorative motion when requested', () => {
    const workspaceHeaderRule = CSS.match(
      /body\[data-dsh-maid-atelier\] header:has\(\[role='tablist'\]\)\s*\{([^}]*)\}/s,
    )?.[1] ?? ''
    const reducedMotionRule = Array.from(
      CSS.matchAll(/@media \(prefers-reduced-motion: reduce\)\s*\{([\s\S]*?)\n\}/g),
      (match) => match[1],
    ).join('\n')
    const workspaceHeaderKeyframes = CSS.match(
      /@keyframes maidAtelierWorkspaceHeaderEnter\s*\{[\s\S]*?\r?\n\}/,
    )?.[0] ?? ''
    expect(workspaceHeaderRule).toContain('animation: maidAtelierWorkspaceHeaderEnter 320ms 110ms backwards')
    expect(workspaceHeaderKeyframes).toContain('@keyframes maidAtelierWorkspaceHeaderEnter')
    // The final keyframe must not hand the header an identity transform, and the
    // fill mode must not go back to `both`: either one leaves a containing block
    // for the fixed descendants mounted in the session header.
    expect(workspaceHeaderKeyframes).toContain('transform: none')
    expect(workspaceHeaderKeyframes).not.toContain('translateY(0)')
    expect(workspaceHeaderKeyframes).not.toContain('padding-bottom:')
    expect(reducedMotionRule).toContain('transition: none')
    expect(reducedMotionRule).toContain('animation: none')
    expect(reducedMotionRule).toContain('[data-maid-workspace-active]::before')
    expect(reducedMotionRule).toContain('[data-maid-table-frame]')
    expect(reducedMotionRule).toContain('[data-maid-table-expand]')
  })

  it('keeps the skin chrome aligned to the live sidebar width and restores the prior value', async () => {
    document.body.style.setProperty('--maid-sidebar-width', 'legacy')
    document.body.innerHTML = '<div class="AppFrame_sidebarCol"><div></div></div>'
    const sidebar = document.querySelector<HTMLElement>("[class*='sidebarCol']")
    sidebar!.getBoundingClientRect = () => ({
      x: 0,
      y: 0,
      width: 312,
      height: 900,
      top: 0,
      right: 312,
      bottom: 900,
      left: 0,
      toJSON: () => ({}),
    })

    fiber = await mount()
    const widthRule = document.head
      .querySelector<HTMLStyleElement>("[data-skin-chrome='sidebar-width-rule']")!
    expect(widthRule.sheet!.cssRules[0].cssText).toContain('--maid-sidebar-width: 312px')
    // The derived sizes follow the animated width inside the rule itself, so a
    // per-frame pass writes one property instead of three.
    expect(widthRule.sheet!.cssRules[0].cssText).toContain('--maid-sidebar-swag-height: clamp(54px,calc(var(--maid-sidebar-width)*0.2575),94px)')
    expect(widthRule.sheet!.cssRules[0].cssText).toContain('--maid-sidebar-mascot-width: min(320px,calc(var(--maid-sidebar-width)*0.82))')
    expect(document.body.dataset.maidSidebarSize).toBe('wide')
    await fiber.dispose()
    expect(document.body.style.getPropertyValue('--maid-sidebar-width')).toBe('legacy')
    expect(document.head.querySelector("[data-skin-chrome='sidebar-width-rule']")).toBeNull()
  })

  it('tracks animated sidebar width without mutating the body style attribute', async () => {
    let resize: ResizeObserverCallback | undefined
    vi.stubGlobal('ResizeObserver', class {
      constructor(callback: ResizeObserverCallback) {
        resize = callback
      }

      observe(): void {}
      unobserve(): void {}
      disconnect(): void {}
    })
    document.body.innerHTML = '<div class="AppFrame_sidebarCol"><div></div></div>'
    const sidebar = document.querySelector<HTMLElement>("[class*='sidebarCol']")!

    fiber = await mount()
    const bodyStyle = document.body.getAttribute('style')
    resize?.([
      { target: sidebar, contentRect: { width: 96 } as DOMRectReadOnly } as ResizeObserverEntry,
    ], {} as ResizeObserver)

    const widthRule = document.head
      .querySelector<HTMLStyleElement>("[data-skin-chrome='sidebar-width-rule']")!
    expect(widthRule.sheet!.cssRules[0].cssText).toContain('--maid-sidebar-width: 96px')
    expect(widthRule.sheet!.cssRules[0].cssText).toContain('--maid-sidebar-swag-height: clamp(54px,calc(var(--maid-sidebar-width)*0.2575),94px)')
    expect(document.body.dataset.maidSidebarSize).toBe('rail')
    expect(document.body.getAttribute('style')).toBe(bodyStyle)
  })

  it('marks narrow and missing sidebars so Chat can reclaim the left gutter', async () => {
    document.body.innerHTML = '<div class="AppFrame_sidebarCol"><div></div></div>'
    const sidebar = document.querySelector<HTMLElement>("[class*='sidebarCol']")!
    sidebar.getBoundingClientRect = () => ({
      x: 0,
      y: 0,
      width: 80,
      height: 900,
      top: 0,
      right: 80,
      bottom: 900,
      left: 0,
      toJSON: () => ({}),
    })

    fiber = await mount()
    expect(document.body.dataset.maidSidebarCompact).toBe('')
    expect(document.body.dataset.maidSidebarSize).toBe('rail')
    const widthRule = document.head
      .querySelector<HTMLStyleElement>("[data-skin-chrome='sidebar-width-rule']")!
    expect(widthRule.sheet!.cssRules[0].cssText).toContain('--maid-sidebar-width: 80px')
    sidebar.remove()
    await flushMutations()
    expect(widthRule.sheet!.cssRules[0].cssText).toContain('--maid-sidebar-width: 0px')
    await fiber.dispose()
    expect(document.body.hasAttribute('data-maid-sidebar-compact')).toBe(false)
    expect(document.body.hasAttribute('data-maid-sidebar-size')).toBe(false)
  })

  it('switches between matched day and night palaces with the base theme', async () => {
    fiber = await mount()
    const light = document.body.style.getPropertyValue('--maid-palace-art')
    document.body.dataset.dsDarkTheme = ''
    await flushMutations()
    const dark = document.body.style.getPropertyValue('--maid-palace-art')
    expect(dark).not.toBe(light)
    expect(dark).toContain('/skin-assets/maid-atelier/')
    expect(dark).not.toContain('linear-gradient')
    delete document.body.dataset.dsDarkTheme
    await flushMutations()
    expect(document.body.style.getPropertyValue('--maid-palace-art')).toBe(light)
  })

  it('lifts every non-conversation main panel onto the column sheet', () => {
    // The plugin manager is a keyed `main` panel: it replaces the conversation
    // inside the chat column, so it carries none of the `[data-phase]` hooks the
    // stage lift relies on, and its static content painted UNDER the skin's two
    // decorated layers in that column (page header, group headings and the whole
    // second-level page were invisible; what did show sat under the trim band).
    // Panels now take both the lift and the frosted sheet from the seat itself,
    // so these rules are collected by matching their selectors against a fixture
    // instead of reading source text: an equivalent rewrite still has to lift
    // above both layers, keep the sheet on the column, keep it off the
    // conversation, and keep the darker label pair for dense card copy.
    document.body.setAttribute('data-dsh-maid-atelier', '')
    // The client projects this from the `main` outlet; the column rules key on it.
    document.body.setAttribute('data-maid-panel-page', '')
    document.body.innerHTML = `
      <div class="fixture_centerCol">
        <div data-skin-chrome="character-stage"></div>
        <div data-slot="main" style="display: contents">
          <section class="fixture_page" data-plugin-panel>
            <header class="fixture_pageHead"></header>
            <section class="fixture_group"></section>
            <div class="fixture_detail" data-plugin-detail="pkg"></div>
          </section>
        </div>
      </div>
    `
    const panel = document.querySelector<HTMLElement>('[data-plugin-panel]')!
    const column = document.querySelector<HTMLElement>('.fixture_centerCol')!
    const pageLight = declarations(panel, false)
    expect(pageLight).toContain('position: relative;')
    // Above the character stage (z 0), the sheet (z 1) and the top curtain
    // (z 1), below the skin's interactive tiers (21 / 40 / 1000).
    expect(pageLight).toContain('z-index: 2;')
    expect(pageLight).toContain('--dsw-alias-label-tertiary: #52658c;')
    expect(declarations(panel, true)).toContain('--dsw-alias-label-tertiary: #96a6c9;')
    // No panel brings its own floor any more: an opaque second floor would cover
    // the sheet again and read as a plain white page.
    expect(pageLight).not.toContain('background: rgba(242, 246, 253, 0.94);')
    // The sheet hangs on the column, so it survives a keyed-panel switch (the
    // page root is replaced, the column is not) and stays under the content.
    const sheetLight = declarations(column, false)
    expect(sheetLight).toContain('background: var(--maid-reading-surface);')
    expect(sheetLight).toContain('backdrop-filter: blur(16px) saturate(0.95);')
    expect(sheetLight).toContain('z-index: 1;')
    expect(declarations(document.body, false)).toContain('--maid-reading-surface: rgba(249, 251, 255, 0.78);')
    expect(declarations(document.body, true)).toContain('--maid-reading-surface: rgba(10, 18, 42, 0.78);')
    // The conversation keeps the artwork to itself: the same column stops
    // matching the sheet as soon as the seat holds the transcript hooks.
    // The host wraps the conversation in its own `main.conversation` slot, and the
    // client drops the panel-page state with it.
    document.querySelector('[data-slot="main"]')!.innerHTML =
      '<div data-slot="main.conversation" style="display: contents"><div data-phase="active"><header data-slot="conversation.header"></header></div></div>'
    document.body.removeAttribute('data-maid-panel-page')
    expect(declarations(column, false)).not.toContain('--maid-reading-surface')
    document.body.removeAttribute('data-ds-dark-theme')
    document.body.removeAttribute('data-maid-panel-page')
    document.body.removeAttribute('data-dsh-maid-atelier')
    document.body.innerHTML = ''
  })

  it('retracts both curtains on a panel page with their own motion', () => {
    // The curtains frame the conversation. A plugin page owns the top and the
    // bottom of the column itself — its page head, its icons, its footer — so
    // the skin cannot reserve room for chrome it was not told about; it retracts
    // the bands instead, sliding the top layer out through the transform
    // transition it already owns and dropping the bottom band with the
    // transform/opacity pair a running turn already uses.
    document.body.setAttribute('data-dsh-maid-atelier', '')
    // The client projects this from the `main` outlet; the column rules key on it.
    document.body.setAttribute('data-maid-panel-page', '')
    document.body.innerHTML = `
      <div class="fixture_centerCol">
        <div data-skin-chrome="character-stage"></div>
        <div data-slot="main" style="display: contents">
          <section class="fixture_page" data-plugin-panel></section>
        </div>
        <div data-skin-chrome="top-trim">
          <div data-skin-trim-layer="landing"></div>
          <div data-skin-trim-layer="workspace"></div>
        </div>
        <div data-skin-chrome="bottom-trim"></div>
      </div>
    `
    const landing = document.querySelector<HTMLElement>('[data-skin-trim-layer="landing"]')!
    const bottom = document.querySelector<HTMLElement>('[data-skin-chrome="bottom-trim"]')!
    // translateY(0) is the resting state, so the retraction is observable here.
    expect(declarations(landing, false)).toContain('transform: translateY(-100%);')
    const band = declarations(bottom, false)
    expect(band).toContain('transform: translateY(100%);')
    expect(band).toContain('opacity: 0;')
    // A conversation keeps its frame: the same column stops matching once the
    // seat holds the transcript hooks.
    document.querySelector('[data-slot="main"]')!.innerHTML =
      '<div data-slot="main.conversation" style="display: contents"><div data-phase="active"></div></div>'
    document.body.removeAttribute('data-maid-panel-page')
    expect(declarations(landing, false)).not.toContain('transform: translateY(-100%);')
    expect(declarations(bottom, false)).not.toContain('transform: translateY(100%);')
    document.body.removeAttribute('data-maid-panel-page')
    document.body.removeAttribute('data-dsh-maid-atelier')
    document.body.innerHTML = ''
  })
})
