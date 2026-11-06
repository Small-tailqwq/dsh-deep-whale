// @vitest-environment jsdom
import { Context } from '@deepseek-ai/cordis'
import { installPanelPageState, type PanelContext } from '../../shared/panel-page-state.ts'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { installOrcaSettingsOverlay } from '../src/client/settings-overlay.ts'
import { installOrcaWorkspaceMarks } from '../src/client/workspace-marks.ts'

const flush = async (): Promise<void> => { await Promise.resolve(); await Promise.resolve() }

describe('ORCA relational state projected as attributes (no :has() probes)', () => {
  afterEach(() => { document.body.innerHTML = ''; for (const a of [...document.body.attributes]) document.body.removeAttribute(a.name) })

  it('projects the keyed panel page from official selection', async () => {
    const ctx = new Context()
    let activePanelId: string | null = null
    const listeners = new Set<() => void>()
    ctx.reflect.provide('layout', { panelInfo: {
      getSnapshot: () => ({ activePanelId }),
      subscribe: (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener) } },
    } })
    const fiber = ctx.plugin({ apply: (ctx: PanelContext) => installPanelPageState(ctx, document.body, 'data-orca-panel-page') })
    await fiber.await()
    expect(document.body.hasAttribute('data-orca-panel-page')).toBe(false)
    activePanelId = 'plugins'
    for (const listener of listeners) listener()
    expect(document.body.hasAttribute('data-orca-panel-page')).toBe(true)
    activePanelId = null
    for (const listener of listeners) listener()
    expect(document.body.hasAttribute('data-orca-panel-page')).toBe(false)
    activePanelId = 'plugins'
    for (const listener of listeners) listener()
    await fiber.dispose()
    expect(document.body.hasAttribute('data-orca-panel-page')).toBe(false)
    expect(listeners.size).toBe(0)
  })

  it('tags only the settings portal mask, and removes the tag with the dialog and on dispose', async () => {
    const dispose = installOrcaSettingsOverlay(document.body)
    const mask = document.createElement('div')
    mask.setAttribute('role', 'presentation')
    mask.innerHTML = '<div role="dialog" aria-modal="true" data-shortcut-modal="settings"></div>'
    const unrelated = document.createElement('div')
    unrelated.setAttribute('role', 'presentation')
    unrelated.innerHTML = '<div role="dialog" aria-modal="true" data-shortcut-modal="shortcuts"></div>'
    document.body.append(mask, unrelated)
    await flush()
    expect(mask.hasAttribute('data-orca-settings-overlay')).toBe(true)
    expect(unrelated.hasAttribute('data-orca-settings-overlay')).toBe(false)

    mask.remove()
    await flush()
    expect(document.querySelector('[data-orca-settings-overlay]')).toBeNull()

    document.body.append(mask)
    await flush()
    expect(mask.hasAttribute('data-orca-settings-overlay')).toBe(true)
    dispose()
    expect(mask.hasAttribute('data-orca-settings-overlay')).toBe(false)
  })

  it('tags the sidebar root and its children that hold a tooltip, dialog or cordis panel', async () => {
    document.body.innerHTML = `
      <div data-slot="sidebar" style="display: contents">
        <div class="root">
          <div class="logoRow"></div>
          <div class="foot"></div>
          <div class="other"></div>
        </div>
      </div>
    `
    const dispose = installOrcaSettingsOverlay(document.body)
    const root = document.querySelector<HTMLElement>('.root')!
    const logoRow = document.querySelector<HTMLElement>('.logoRow')!
    const foot = document.querySelector<HTMLElement>('.foot')!
    const other = document.querySelector<HTMLElement>('.other')!
    expect(document.querySelector('[data-orca-tooltip-carrier], [data-orca-tooltip-root], [data-orca-dialog-carrier], [data-orca-cordis-carrier]')).toBeNull()

    const tip = document.createElement('div')
    tip.setAttribute('role', 'tooltip')
    logoRow.append(tip)
    const dialog = document.createElement('div')
    dialog.setAttribute('role', 'dialog')
    foot.append(dialog)
    const cordis = document.createElement('div')
    cordis.setAttribute('data-cordis-panel', '')
    other.append(cordis)
    await flush()

    expect(root.hasAttribute('data-orca-tooltip-root')).toBe(true)
    expect(logoRow.hasAttribute('data-orca-tooltip-carrier')).toBe(true)
    expect(foot.hasAttribute('data-orca-tooltip-carrier')).toBe(false)
    expect(foot.hasAttribute('data-orca-dialog-carrier')).toBe(true)
    expect(other.hasAttribute('data-orca-cordis-carrier')).toBe(true)

    tip.remove()
    dialog.remove()
    await flush()
    expect(root.hasAttribute('data-orca-tooltip-root')).toBe(false)
    expect(logoRow.hasAttribute('data-orca-tooltip-carrier')).toBe(false)
    expect(foot.hasAttribute('data-orca-dialog-carrier')).toBe(false)

    logoRow.append(tip)
    await flush()
    dispose()
    expect(document.querySelector('[data-orca-tooltip-carrier], [data-orca-tooltip-root], [data-orca-dialog-carrier], [data-orca-cordis-carrier]')).toBeNull()
  })

  it('assigns sessions to their own workspace section across nested folders and tooltips', async () => {
    document.body.innerHTML = `
      <div data-slot="sidebar">
        <div role="tree">
          <div class="groupSection g1" style="--dsh-workspace-indent: 0px">
            <span class="tooltip"><div role="treeitem" aria-expanded="true"></div></span>
            <div role="group">
              <div class="groupSection g2" style="--dsh-workspace-indent: 12px">
                <span class="tooltip"><div role="treeitem" aria-expanded="false"></div></span>
              </div>
            </div>
            <span class="tooltip"><div role="treeitem" aria-selected="true"></div></span>
          </div>
          <div class="g3"><span></span></div>
        </div>
      </div>
    `
    const originalRows = [...document.querySelectorAll('[role="treeitem"]')]
    const dispose = installOrcaWorkspaceMarks(document.body)
    const [g1, g2, g3] = ['.g1', '.g2', '.g3'].map(s => document.querySelector<HTMLElement>(s)!)
    expect(g1.hasAttribute('data-orca-workspace-group')).toBe(true)
    expect(g1.hasAttribute('data-orca-workspace-selectable')).toBe(true)
    expect(g1.hasAttribute('data-orca-workspace-children')).toBe(true)
    expect(g2.hasAttribute('data-orca-workspace-group')).toBe(true)
    expect(g2.hasAttribute('data-orca-workspace-selectable')).toBe(false)
    expect(g2.hasAttribute('data-orca-workspace-children')).toBe(false)
    expect(g1.hasAttribute('data-orca-workspace-overflow')).toBe(false)
    expect(g2.hasAttribute('data-orca-workspace-overflow')).toBe(false)
    expect([...document.querySelectorAll('[role="treeitem"]')]).toEqual(originalRows)
    expect([...g3.attributes].some(a => a.name.startsWith('data-orca-workspace'))).toBe(false)

    const parentSession = g1.querySelector('[aria-selected]')!.parentElement!
    g2.append(parentSession)
    await flush()
    expect(g1.hasAttribute('data-orca-workspace-selectable')).toBe(false)
    expect(g2.hasAttribute('data-orca-workspace-selectable')).toBe(true)

    const overflow = document.createElement('button')
    overflow.className = 'sessionOverflowButton'
    g2.append(overflow)
    await flush()
    expect(g1.hasAttribute('data-orca-workspace-overflow')).toBe(false)
    expect(g2.hasAttribute('data-orca-workspace-overflow')).toBe(true)
    overflow.remove()
    await flush()
    expect(g2.hasAttribute('data-orca-workspace-overflow')).toBe(false)
    g2.append(overflow)
    await flush()

    g1.querySelector('[role="group"]')!.remove()
    await flush()
    expect(g1.hasAttribute('data-orca-workspace-children')).toBe(false)
    expect([...g2.attributes].some(a => a.name.startsWith('data-orca-workspace'))).toBe(false)

    dispose()
    expect(document.querySelector('[data-orca-workspace-group], [data-orca-workspace-selectable], [data-orca-workspace-children], [data-orca-workspace-overflow]')).toBeNull()
  })

  it('cancels queued tree updates when disposed and restores original attribute values', async () => {
    document.body.innerHTML = '<div data-slot="sidebar"><div role="tree"><div class="groupSection" data-orca-workspace-selectable="original"><span><div role="treeitem" aria-expanded="true"></div></span></div></div></div>'
    const original = document.body.innerHTML
    const dispose = installOrcaWorkspaceMarks(document.body)
    const section = document.querySelector('.groupSection')!
    expect(section.hasAttribute('data-orca-workspace-selectable')).toBe(false)
    section.append(document.createElement('span'))
    // The observer has queued its reconciliation, but it has not run yet.
    await Promise.resolve()
    dispose()
    section.lastElementChild!.remove()
    await flush()
    expect(document.body.innerHTML).toBe(original)
    const disposeAgain = installOrcaWorkspaceMarks(document.body)
    disposeAgain()
    expect(document.body.innerHTML).toBe(original)
  })

  it('restores partial workspace marks if initialization fails', () => {
    document.body.innerHTML = '<div data-slot="sidebar"><div role="tree"><div class="groupSection"><div role="treeitem" aria-expanded="true"></div><div role="treeitem" aria-selected="false"></div></div></div></div>'
    const original = document.body.innerHTML
    const section = document.querySelector('.groupSection')!
    const setAttribute = section.setAttribute.bind(section)
    const spy = vi.spyOn(section, 'setAttribute').mockImplementation((name, value) => {
      if (name === 'data-orca-workspace-selectable') throw new Error('Cannot decorate section')
      setAttribute(name, value)
    })
    expect(() => installOrcaWorkspaceMarks(document.body)).toThrow('Cannot decorate section')
    spy.mockRestore()
    expect(document.body.innerHTML).toBe(original)
  })
})
