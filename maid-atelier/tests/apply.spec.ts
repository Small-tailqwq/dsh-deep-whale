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
const TURN_MARK_SELECTOR = "[data-phase='active'] :has(+ [data-chat-flow]) > nav button[type='button'][aria-label]"

function unpairedFullRoundRules(css: string): string[] {
  const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, ' ')
  return [...withoutComments.matchAll(/([^{}]+)\{([^{}]*)\}/g)]
    .filter(([, , declarations = '']) => /border-radius:\s*(?:50%|100%|(?:99\d|\d{4,})px)\s*;/.test(declarations))
    .filter(([, , declarations = '']) => !/corner-shape:\s*round\b/.test(declarations))
    .map(([, selectors = '']) => selectors.trim())
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
  /:is\(\[data-pane='sidebar'\], \[class\*='sidebarCol'\]\)\s*> div\s*> :has\(\[role='dialog'\]\[aria-modal='true'\]\)\s*\{([^}]*)\}/s,
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
  /:is\(\[data-pane='sidebar'\], \[class\*='sidebarCol'\]\)\s*> div\s*> :not\([\s\S]*?\)\s*> :has\(\[role='dialog'\]\[aria-modal='true'\]\)\s*\{([^}]*)\}/s,
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
  it('targets the Alpha turn rail by its chat-flow relationship in every locale', async () => {
    document.body.innerHTML = `
      <div data-phase="active">
        <div>
          <div data-conversation-scroll>
            <div class="turn-slot">
              <nav aria-label="Turn navigation">
                <div><div>
                  <div><button type="button" aria-label="Jump to turn 1" aria-current="true"></button></div>
                  <div><button type="button" aria-label="Load and jump to turn 2" aria-busy="true"></button></div>
                  <div><button type="button" aria-label="Load and jump to turn 3"></button></div>
                </div></div>
              </nav>
            </div>
            <div data-chat-flow></div>
          </div>
          <div data-width-handle="left" data-side="left"></div>
          <div data-width-handle="right" data-side="right"></div>
        </div>
      </div>
    `

    fiber = await mount()
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
    let dispose: (() => void) | undefined
    const ctx = {
      effect(factory: () => () => void): void {
        dispose = factory()
      },
    } as unknown as Context
    const insertRule = vi.spyOn(CSSStyleSheet.prototype, 'insertRule')
      .mockImplementationOnce(() => {
        throw new Error('fixture CSSOM failure')
      })

    expect(() => apply(ctx)).toThrow('fixture CSSOM failure')
    expect(dispose).toBeTypeOf('function')
    dispose?.()

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
      <div data-pane="sidebar">
        <div>
          <div class="fixture_logoRow">
            <button class="fixture_brand"><svg aria-hidden="true"></svg></button>
          </div>
        </div>
      </div>
    `
    fiber = await mount()

    const mascot = document.querySelector<HTMLImageElement>("[data-skin-chrome='sidebar-mascot']")
    expect(mascot?.src).toContain('data:image/webp;base64,')
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
      '<div data-pane="sidebar"><div><button class="fixture_brand"><svg></svg></button></div></div>',
    )
    await flushMutations()

    expect(document.querySelector("[data-skin-chrome='sidebar-mascot']")).not.toBeNull()
    expect(document.querySelector("button[class*='brand'] > svg")).not.toBeNull()
    expect(document.querySelector("[data-skin-chrome='brand-lockup']")).toBeNull()
  })

  it('does not rescan the sidebar when ordinary conversation content changes', async () => {
    document.body.innerHTML = `
      <div data-pane="sidebar"><div></div></div>
      <main data-phase="active"></main>
    `
    fiber = await mount()
    const sidebar = document.querySelector<HTMLElement>("[data-pane='sidebar']")!
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
    const variables = sheet.cssRules[0] as CSSStyleRule
    expect(variables.style.getPropertyValue('--maid-titlebar-height')).toBe('32px')
  })

  it('seats a sidebar frame copy beneath the open settings mask', async () => {
    document.body.innerHTML = `
      <div data-pane="sidebar">
        <div>
          <div><div data-slot="sidebar.settings"><button aria-expanded="false">Settings</button></div></div>
        </div>
      </div>
    `
    fiber = await mount()
    const settingsSlot = document.querySelector<HTMLElement>("[data-slot='sidebar.settings']")!
    const overlay = document.createElement('div')
    overlay.setAttribute('role', 'presentation')
    const mask = document.createElement('div')
    mask.className = 'fixture_mask'
    overlay.append(mask)
    document.body.append(overlay)
    const dialog = document.createElement('div')
    dialog.setAttribute('role', 'dialog')
    dialog.setAttribute('aria-modal', 'true')
    settingsSlot.append(dialog)
    await flushMutations()

    const copy = document.querySelector<HTMLElement>('[data-maid-settings-backdrop-frame]')
    expect(copy?.parentElement).toBe(overlay)
    expect(copy?.nextElementSibling).toBe(mask)
    expect(copy?.querySelectorAll('[data-skin-corner]')).toHaveLength(4)

    dialog.remove()
    await flushMutations()
    expect(document.querySelector('[data-maid-settings-backdrop-frame]')).toBeNull()
  })

  it('anchors the public rc.6 settings slot to the real sidebar footer', async () => {
    document.body.innerHTML = `
      <div data-pane="sidebar">
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
      <div data-pane="sidebar">
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
      <div data-pane="sidebar">
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
    expect(document.body.style.getPropertyValue('--maid-palace-art')).toContain('data:image/webp;base64,')
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
    expect([...characters ?? []].every(character => character.src.startsWith('data:image/webp;base64,'))).toBe(true)
    await fiber.dispose()
    expect(document.querySelector("[data-skin-chrome='character-stage']")).toBeNull()
  }, 10_000)

  it('follows live viewport resizing without transition lag and restores the marker', async () => {
    fiber = await mount()
    const resizeRule = CSS.match(
      /\[data-maid-layout-resizing\]\s*\[data-maid-character\]\s*\{([^}]*)\}/s,
    )?.[1] ?? ''
    expect(resizeRule).toContain('transition: none')
    expect(resizeRule).toContain('filter: none')

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
    expect(document.body.style.getPropertyValue('--maid-top-trim-art')).toContain('data:image/webp;base64,')
    expect(document.body.style.getPropertyValue('--maid-bottom-trim-art')).toContain('data:image/webp;base64,')
    expect(document.body.style.getPropertyValue('--maid-bottom-crest-art')).toContain('data:image/webp;base64,')
    expect(document.body.style.getPropertyValue('--maid-bow-art')).toContain('data:image/webp;base64,')
    expect(document.body.style.getPropertyValue('--maid-new-session-art')).toContain('data:image/webp;base64,')
    expect(document.body.style.getPropertyValue('--maid-sidebar-swag-art')).toContain('data:image/webp;base64,')
    expect(document.body.style.getPropertyValue('--maid-sidebar-corner-art')).toContain('data:image/webp;base64,')
    expect(document.body.style.getPropertyValue('--maid-composer-frame-art')).toContain('data:image/webp;base64,')
    expect(document.body.style.getPropertyValue('--maid-composer-ribbon-left-cap-art')).toContain('data:image/webp;base64,')
    expect(document.body.style.getPropertyValue('--maid-composer-ribbon-left-fill-art')).toContain('data:image/webp;base64,')
    expect(document.body.style.getPropertyValue('--maid-composer-ribbon-right-fill-art')).toContain('data:image/webp;base64,')
    expect(document.body.style.getPropertyValue('--maid-composer-ribbon-right-cap-art')).toContain('data:image/webp;base64,')
    expect(document.body.style.getPropertyValue('--maid-composer-lace-art')).toContain('data:image/png;base64,')
    expect(document.querySelector("[data-composer-card] > [data-skin-chrome='composer-lace']")).not.toBeNull()
    expect(document.querySelector('[data-maid-composer-lace-center]')).not.toBeNull()
    expect(document.body.style.getPropertyValue('--maid-settings-frame-art')).toContain('data:image/webp;base64,')
    expect(document.body.style.getPropertyValue('--maid-workspace-crest-art')).toContain('data:image/webp;base64,')
    expect(document.body.style.getPropertyValue('--maid-workspace-ribbon-art')).toContain('data:image/webp;base64,')
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
    expect(backingRule).toContain('inset: 0 -0.52% -2%')
    expect(backingRule).toContain('background: inherit')
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
    expect(CSS).toMatch(/\[data-testid='todo-panel'\]\s*\{[^}]*--dsw-alias-label-primary: #172347/s)
    expect(CSS).toMatch(/\[data-ds-dark-theme\] \[data-testid='todo-panel'\]\s*\{[^}]*--dsw-alias-label-primary: #f4ead3/s)
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
    expect(frameRule).toContain('max(0px, calc(50% - 156px)) 32px')
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
      /\[data-skin-chrome='composer-lace'\]::before,[\s\S]*?\[data-skin-chrome='composer-lace'\]::after\s*\{[^}]*width: calc\(50% - 96px\)/s,
    )
    expect(CSS).toMatch(
      /\[data-maid-composer-lace-center\]\s*\{[^}]*left: calc\(50% - 42px\)[^}]*width: 84px[^}]*var\(--maid-composer-lace-art\)[^}]*background-position: left top/s,
    )
    expect(CSS).toMatch(
      /\[data-maid-composer-lace-center\]\s*\{[^}]*background-size: auto 33px[^}]*background-repeat: repeat-x/s,
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
    expect(sheet?.sheet?.cssRules[0]?.cssText ?? '').toMatch(/--maid-titlebar-height\s*:\s*0px/)
    await fiber.dispose()
    expect(document.querySelector("[data-skin-chrome='sidebar-width-rule']")).toBeNull()
  })

  it('mirrors the sidebar column top as the curtain offset when a column exists', async () => {
    document.body.innerHTML = `
      <div data-pane="sidebar">
        <div class="fixture_logoRow"><button class="fixture_brand"><svg></svg></button></div>
      </div>
    `
    const column = document.querySelector<HTMLElement>("[data-pane='sidebar']")!
    // jsdom has no layout; pretend the column sits 40px below the viewport top.
    vi.spyOn(column, 'getBoundingClientRect').mockReturnValue({
      top: 40, left: 0, right: 280, bottom: 760, width: 280, height: 720,
      x: 0, y: 40, toJSON: () => ({}),
    })
    fiber = await mount()
    const sheet = document.querySelector<HTMLStyleElement>("[data-skin-chrome='sidebar-width-rule']")
    expect(sheet?.sheet?.cssRules[0]?.cssText ?? '').toContain('--maid-titlebar-height: 40px')
    await fiber.dispose()
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
      /body\[data-dsh-maid-atelier\] :is\(\[data-pane='sidebar'\], \[class\*='sidebarCol'\]\) > div > :not\(([\s\S]*?)\)\s*\{/,
    )?.[1] ?? ''
    expect(sidebarLayerSelector).toContain("[role='tooltip']")
  })

  it('releases a tooltip carrier without demoting the gold sidebar frame', () => {
    const tooltipCarrierRule = CSS.match(
      /:is\(\[data-pane='sidebar'\], \[class\*='sidebarCol'\]\)\s*> div\s*> :has\(\[role='tooltip'\]\)\s*\{([^}]*)\}/s,
    )?.[1] ?? ''
    const frameRule = CSS.match(
      /\[data-skin-chrome='sidebar-corners'\]\s*\{([^}]*)\}/s,
    )?.[1] ?? ''
    expect(tooltipCarrierRule).not.toBe('')
    expect(tooltipCarrierRule).toContain('z-index: auto')
    expect(tooltipCarrierRule).not.toContain('position: static')
    expect(frameRule).toContain('z-index: 4')
  })

  it('paints the sidebar double rule without shrinking the collapsed rail', () => {
    const sidebarRule = CSS.match(
      /:is\(\[data-pane='sidebar'\], \[class\*='sidebarCol'\]\)\s*\{([^}]*)\}/s,
    )?.[1] ?? ''
    expect(sidebarRule).toContain('border-right: 0')
    expect(sidebarRule).toContain('inset -1px 0 rgba(255, 245, 215, 0.82)')
    expect(sidebarRule).toContain('inset -3px 0 rgba(226, 207, 166, 0.72)')
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
    const heroBackingRule = CSS.match(
      /\[data-phase='hero'\]\s*\[data-composer-card\]::after\s*\{([^}]*)\}/s,
    )?.[1] ?? ''
    expect(heroRule).toContain('--dsh-chat-content-width: clamp(560px, 41vw, 740px)')
    expect(heroRule).toContain('--dsh-composer-card-max-width')
    expect(heroCardRule).toContain('rgba(255, 254, 250, 0.54)')
    expect(heroCardRule).toContain('backdrop-filter: blur(2.5px)')
    expect(heroBackingRule).toContain('rgba(248, 250, 255, 0.2)')
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
    const titleRule = CSS.match(
      /\[data-phase='hero'\] \[class\*='headlineText'\]\s*\{([^}]*)\}/s,
    )?.[1] ?? ''
    const previewRule = CSS.match(
      /\[data-phase='hero'\] \[class\*='previewBadge'\]\s*\{([^}]*)\}/s,
    )?.[1] ?? ''
    expect(headlineRule).toContain('grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr)')
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
      /body\[data-dsh-maid-atelier\]\[data-ds-dark-theme\]\s*\[data-phase='hero'\] \[class\*='headlineText'\]\s*\{([^}]*)\}/s,
    )?.[1] ?? ''
    const badgeRule = CSS.match(
      /body\[data-dsh-maid-atelier\]\[data-ds-dark-theme\]\s*\[data-phase='hero'\] \[class\*='previewBadge'\]\s*\{([^}]*)\}/s,
    )?.[1] ?? ''
    expect(titleRule).toContain('color: #fffaf0')
    expect(titleRule).toContain('-webkit-text-stroke: 0.35px')
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
      /:is\(\[data-pane='conversation'\], \[class\*='centerCol'\]\)\s*:is\(\[data-phase='hero'\], \[data-phase='active'\], \[data-phase='settling'\]\)\s*\{([^}]*)\}/s,
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
      <div data-pane="sidebar">
        <div class="fixture_search">
          <button class="fixture_searchButton" type="button">search</button>
        </div>
      </div>
    `
    fiber = await mount()
    document.querySelector<HTMLButtonElement>('.fixture_searchButton')!.click()

    const sidebar = document.querySelector<HTMLElement>("[data-pane='sidebar']")!
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
      /\[data-maid-sidebar-size='rail'\][\s\S]*?\[data-maid-sidebar-footer\]:has\(\[data-cordis-badge\]\)\s*\{[^}]*flex-basis: 100px/s,
    )
    expect(CSS).toMatch(
      /\[data-maid-cordis-panel-open\][\s\S]*?> :has\(\[data-cordis-panel\]\)\s*\{[^}]*z-index: 40/s,
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
    // the native branch retains a stable gutter across host hover states.
    expect(nativeRule).toContain('padding-bottom: var(--dsh-scrollbar-width, 8px)')
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
    expect(CSS).toMatch(/@media \(hover: none\)[\s\S]*?\[data-maid-table-frame\]\[data-maid-table-expandable\] > \[data-maid-table-expand\]/)
    expect(lightboxRule).toContain('position: fixed')
    expect(lightboxRule).toContain('z-index: 940')
    expect(panelRule).toContain('width: min(var(--maid-table-expanded-width, 1180px), 100%)')
    expect(expandedRule).toContain('width: 100%')
    expect(expandedRule).toContain('min-width: 0')
    expect(CSS).toContain('@media (hover: none)')
    // `md-table-wide` is a bare class the renderer emits through clsx; a CSS
    // Modules build hashes selector classes, which silently disabled the rule
    // (the breakout kept painting). The :global() guard is the contract.
    expect(CSS).toContain(":global(.md-table-wide table)")
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
      /:not\(\[data-ds-dark-theme\]\)[\s\S]*?:is\(\[data-variant\], \[data-chat-flow-kind='context'\]\) \[data-disclosure-row='true'\]\s*\{([^}]*)\}/s,
    )?.[1] ?? ''
    expect(variantRule).toContain('--dsw-alias-label-secondary: #2f4778')
    expect(variantRule).toContain('--dsw-alias-label-tertiary: #405273')
    expect(rowRule).toContain('rgba(248, 250, 255, 0.32)')
    expect(rowRule).not.toContain('backdrop-filter')
    expect(CSS).toContain(":is([data-variant], [data-chat-flow-kind='context'])")
    expect(CSS).toContain("[data-chat-flow-kind='context'] > [data-slot='conversation.chat.node'] > [data-open='true']")
    expect(CSS).toMatch(/:is\(\s*\[data-variant\](?::not\(\[data-variant='think'\]\))? > \[data-open='true'\],[\s\S]*?\)\s*\{[^}]*rgba\(248, 250, 255, 0\.5\)/)
    expect(CSS).not.toMatch(/\[data-variant\] > \[data-open='true'\][^{}]*backdrop-filter: blur\(3px\)/)
    expect(CSS).toMatch(/:is\([\s\S]*?\) > \[data-disclosure-row='true'\]\s*\{[^}]*background: transparent[^}]*backdrop-filter: none/s)
    expect(CSS).toMatch(/\[data-variant='think'\][^{]*\[data-disclosure-row='true'\] \+ \*\s*\{[^}]*color: #34486f[^}]*line-height: 1\.65/s)
    expect(CSS).toMatch(/\[data-ds-dark-theme\]\s+:is\(\[data-variant\], \[data-chat-flow-kind='context'\]\)\s*\{[^}]*#d3ddf2[^}]*#b8c5e1/s)
    expect(CSS).toMatch(/\[data-ds-dark-theme\][\s\S]*?:is\(\[data-variant\], \[data-chat-flow-kind='context'\]\) \[data-disclosure-row='true'\]\s*\{[^}]*rgba\(10, 20, 48, 0\.58\)/s)
    expect(CSS).toMatch(/\[data-ds-dark-theme\][\s\S]*?\[data-variant='think'\][^{]*\+ \*\s*\{[^}]*color: #c7d2e9/s)
  })

  it('keeps the light-theme composer statistics legible over the backdrop', () => {
    const dockRule = CSS.match(
      /:not\(\[data-ds-dark-theme\]\)[\s\S]*?\[data-slot='conversation\.composer\.dock'\] > \*\s*\{([^}]*)\}/s,
    )?.[1] ?? ''
    expect(dockRule).toContain('color: #4a5d82')
    expect(dockRule).toContain('rgba(248, 250, 255, 0.3)')
    expect(dockRule).toContain('backdrop-filter: blur(2px)')
    expect(CSS).toMatch(/\[data-slot='conversation\.composer\.dock'\] > \* \[class\*='sep'\]\s*\{[^}]*rgba\(74, 93, 130, 0\.55\)/s)
    expect(CSS).toMatch(/\[data-ds-dark-theme\][\s\S]*?\[data-slot='conversation\.composer\.dock'\] > \*\s*\{[^}]*color: #aebdde[^}]*rgba\(10, 20, 48, 0\.48\)/s)
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
    const inspectRule = CSS.match(
      /\[data-phase='active'\]\s*\[data-conversation-scroll\]:not\(:has\(\[data-chat-flow\]\)\)\s*> \[data-composer-seat\]\s*\{([^}]*)\}/s,
    )?.[1] ?? ''
    expect(inspectRule).toContain('display: none')
  })

  it('lets the lower sidebar swag own the bottom boundary without a rectangular tint seam', () => {
    const innerFrameRule = CSS.match(/\:is\(\[data-pane='sidebar'\], \[class\*='sidebarCol'\]\) > div::before\s*\{([^}]*)\}/s)?.[1] ?? ''
    const fadeRule = CSS.match(/\:is\(\[data-pane='sidebar'\], \[class\*='sidebarCol'\]\) \[class\*='fade'\]\s*\{([^}]*)\}/s)?.[1] ?? ''
    expect(innerFrameRule).toContain('inset: 9px 7px 0')
    expect(innerFrameRule).toContain('border: 0')
    expect(innerFrameRule).not.toContain('box-shadow')
    expect(fadeRule).toContain('background: none')
  })

  it('keeps internal tool-card headers out of the navy page-header treatment', () => {
    const pageHeaderRule = CSS.match(
      /:is\(\[data-pane='conversation'\], \[class\*='centerCol'\]\) header\[class\*='header'\]\s*\{([^}]*)\}/s,
    )?.[1] ?? ''
    const terminalRule = CSS.match(/\[data-terminal\]\s*\{([^}]*)\}/s)?.[1] ?? ''
    const darkTerminalRule = CSS.match(
      /\[data-ds-dark-theme\] \[data-terminal\]\s*\{([^}]*)\}/s,
    )?.[1] ?? ''
    expect(pageHeaderRule).toContain('color: #f8f3e8')
    expect(CSS).not.toMatch(
      /:is\(\[data-pane='conversation'\], \[class\*='centerCol'\]\) \[class\*='header'\]\s*\{/,
    )
    expect(terminalRule).toContain('--dsw-alias-markdown-code-block: rgba(249, 250, 253, 0.97)')
    expect(terminalRule).toContain('--dsw-alias-label-primary: #172347')
    expect(terminalRule).toContain('text-shadow: none')
    expect(darkTerminalRule).toContain('--dsw-alias-markdown-code-block: rgba(10, 20, 48, 0.97)')
    expect(darkTerminalRule).toContain('--dsw-alias-label-primary: #edf1fa')
  })

  it('scales the lower sidebar swag at its source aspect ratio', () => {
    const sidebarInnerRule = CSS.match(
      /:is\(\[data-pane='sidebar'\], \[class\*='sidebarCol'\]\) > div\s*\{([^}]*)\}/s,
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
    expect(searchRule).toContain('--dsh-search-input-fill: transparent')
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

  it('targets the carrier suppression at the official footArea, not the SidebarRoot', () => {
    // The slot anchor is a display:contents wrapper, so the column's direct
    // div is NOT the SidebarRoot: the root (z-index release target) and the
    // footArea (fade target) are different layers. Guard the selectors
    // against regressing to the wrong element.
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
    const rootRelease = document.querySelector(
      ":is([data-pane='sidebar'], [class*='sidebarCol']) > div > :has([role='dialog'][aria-modal='true'])",
    )
    const carrier = document.querySelector(
      ":is([data-pane='sidebar'], [class*='sidebarCol']) > div > :not([data-skin-chrome='sidebar-mascot'], [data-skin-chrome='sidebar-corners'], [role='tooltip']) > :has([role='dialog'][aria-modal='true'])",
    )
    expect(rootRelease).toBe(root)
    expect(carrier).toBe(footArea)
  })

  it('lets the official settings mask blur every skin-owned layer', () => {
    const sidebarRule = CSS.match(
      /:is\(\[data-pane='sidebar'\], \[class\*='sidebarCol'\]\)\s*\{([^}]*)\}/s,
    )?.[1] ?? ''
    const sidebarInnerRule = CSS.match(
      /:is\(\[data-pane='sidebar'\], \[class\*='sidebarCol'\]\) > div\s*\{([^}]*)\}/s,
    )?.[1] ?? ''
    const sidebarContentRule = CSS.match(
      /:is\(\[data-pane='sidebar'\], \[class\*='sidebarCol'\]\)\s*> div > :has\(\[data-maid-sidebar-footer\]\)\s*\{([^}]*)\}/s,
    )?.[1] ?? ''
    const footerRule = CSS.match(
      /:is\(\[data-pane='sidebar'\], \[class\*='sidebarCol'\]\)\s*> div > \[data-maid-sidebar-footer\]\s*\{([^}]*)\}/s,
    )?.[1] ?? ''
    const topTrimRule = CSS.match(/\[data-skin-chrome='top-trim'\]\s*\{([^}]*)\}/s)?.[1] ?? ''
    const bottomTrimRule = CSS.match(/\[data-skin-chrome='bottom-trim'\]\s*\{([^}]*)\}/s)?.[1] ?? ''
    const conversationHeaderRule = CSS.match(
      /:is\(\[data-pane='conversation'\], \[class\*='centerCol'\]\) header\[class\*='header'\]\s*\{([^}]*)\}/s,
    )?.[1] ?? ''
    const composerRule = CSS.match(/\[data-composer-card\]\s*\{([^}]*)\}/s)?.[1] ?? ''
    const obscuredComposerRule = CSS.match(
      /\[data-maid-settings-open\] \[data-composer-card\]\s*\{([^}]*)\}/s,
    )?.[1] ?? ''
    const releasedSettingsRowRule = CSS.match(
      /:is\(\[data-pane='sidebar'\], \[class\*='sidebarCol'\]\)\s*> div\s*> :has\(\[role='dialog'\]\[aria-modal='true'\]\)\s*\{([^}]*)\}/s,
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
    const settingsSurfaceRule = CSS.match(
      /\[data-slot='sidebar\.settings'\]\s+\[role='presentation'\]\s*> \[role='dialog'\]\[aria-modal='true'\]\s*\{([^}]*)\}/s,
    )?.[1] ?? ''
    const settingsSurfaceBackingRule = CSS.match(
      /\[data-slot='sidebar\.settings'\]\s+\[role='presentation'\]\s*> \[role='dialog'\]\[aria-modal='true'\]::before\s*\{([^}]*)\}/s,
    )?.[1] ?? ''
    const darkSettingsSurfaceRule = CSS.match(
      /\[data-ds-dark-theme\]\s+\[data-slot='sidebar\.settings'\]\s+\[role='presentation'\]\s*> \[role='dialog'\]\[aria-modal='true'\]\s*\{([^}]*)\}/s,
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
    expect(fullScreenRule).toContain('width: 100vw')
    expect(fullScreenRule).toContain('height: 100vh')
    expect(fullScreenRule).toContain('height: 100dvh')
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
    expect(CSS).not.toMatch(/@media \(min-width: 1100px\) and \(min-height: 681px\)/)
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
    expect(ribbonShapeRule).toContain('animation: maidAtelierWorkspaceRibbonEnter 420ms')
    expect(ribbonShapeRule).not.toContain('background-size')
    expect(ribbonShapeRule).not.toContain('clip-path')
    expect(CSS).toContain('@keyframes maidAtelierWorkspaceRibbonEnter')
    expect(CSS).toContain('clip-path: inset(0 100% 0 0)')
    expect(CSS).toContain('clip-path: inset(0 12% 0 0)')
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

  it('skins the official running StateDot as a recognizable atelier jewel chase', () => {
    const runningDotRule = CSS.match(
      /\[data-maid-session-row\] svg\[data-state='ongoing'\]\s*\{([^}]*)\}/s,
    )?.[1] ?? ''
    const runningCellRule = CSS.match(
      /\[data-maid-session-row\] svg\[data-state='ongoing'\] > rect\s*\{([^}]*)\}/s,
    )?.[1] ?? ''
    const reducedMotionRules = [...CSS.matchAll(
      /@media \(prefers-reduced-motion: reduce\)\s*\{([\s\S]*?)\n\}/g,
    )].map(match => match[1]).join('\n')
    expect(runningDotRule).toContain('width: 12px')
    expect(runningDotRule).toContain('radial-gradient')
    expect(runningDotRule).toContain('shape-rendering: geometricPrecision')
    expect(runningCellRule).toContain('fill: currentColor')
    expect(runningCellRule).toContain('animation: maidAtelierSessionJewelChase 1s linear infinite')
    expect(CSS).toContain('@keyframes maidAtelierSessionJewelChase')
    expect(reducedMotionRules).toContain("svg[data-state='ongoing'] > rect")
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
    expect(CSS).not.toContain('padding-bottom: 28px')
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
    expect(workspaceHeaderRule).toContain('animation: maidAtelierWorkspaceHeaderEnter 320ms 110ms both')
    expect(workspaceHeaderKeyframes).toContain('@keyframes maidAtelierWorkspaceHeaderEnter')
    expect(workspaceHeaderKeyframes).not.toContain('padding-bottom:')
    expect(reducedMotionRule).toContain('transition: none')
    expect(reducedMotionRule).toContain('animation: none')
    expect(reducedMotionRule).toContain('[data-maid-workspace-active]::before')
    expect(reducedMotionRule).toContain('[data-maid-table-frame]')
    expect(reducedMotionRule).toContain('[data-maid-table-expand]')
  })

  it('keeps the skin chrome aligned to the live sidebar width and restores the prior value', async () => {
    document.body.style.setProperty('--maid-sidebar-width', 'legacy')
    document.body.innerHTML = '<div data-pane="sidebar"><div></div></div>'
    const sidebar = document.querySelector<HTMLElement>("[data-pane='sidebar']")
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
    expect(widthRule.sheet!.cssRules[0].cssText).toContain('--maid-sidebar-swag-height: 80.34px')
    expect(widthRule.sheet!.cssRules[0].cssText).toContain('--maid-sidebar-mascot-width: 255.84px')
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
    document.body.innerHTML = '<div data-pane="sidebar"><div></div></div>'
    const sidebar = document.querySelector<HTMLElement>("[data-pane='sidebar']")!

    fiber = await mount()
    const bodyStyle = document.body.getAttribute('style')
    resize?.([
      { target: sidebar, contentRect: { width: 96 } as DOMRectReadOnly } as ResizeObserverEntry,
    ], {} as ResizeObserver)

    const widthRule = document.head
      .querySelector<HTMLStyleElement>("[data-skin-chrome='sidebar-width-rule']")!
    expect(widthRule.sheet!.cssRules[0].cssText).toContain('--maid-sidebar-width: 96px')
    expect(widthRule.sheet!.cssRules[0].cssText).toContain('--maid-sidebar-swag-height: 54px')
    expect(document.body.dataset.maidSidebarSize).toBe('rail')
    expect(document.body.getAttribute('style')).toBe(bodyStyle)
  })

  it('marks narrow and missing sidebars so Chat can reclaim the left gutter', async () => {
    document.body.innerHTML = '<div data-pane="sidebar"><div></div></div>'
    const sidebar = document.querySelector<HTMLElement>("[data-pane='sidebar']")!
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
    expect(dark).toContain('data:image/webp;base64,')
    expect(dark).not.toContain('linear-gradient')
    delete document.body.dataset.dsDarkTheme
    await flushMutations()
    expect(document.body.style.getPropertyValue('--maid-palace-art')).toBe(light)
  })
})
