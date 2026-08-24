// @vitest-environment jsdom
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { hasMutationOutsideTerminal } from '../src/client/mutation-filter.ts'
import { installOrcaSettingsOverlay } from '../src/client/settings-overlay.ts'
import { installOrcaTerminalPerformance } from '../src/client/terminal-performance.ts'

const css = readFileSync(
  'src/client/orca-link.module.css',
  'utf8',
)

describe('ORCA LINK performance guards', () => {
  it('does not apply the shape contract to every descendant and pseudo-element', () => {
    expect(css).not.toContain('body[data-dsh-orca-link] *,')
    expect(css).not.toContain('body[data-dsh-orca-link] *::before')
    expect(css).not.toContain('body[data-dsh-orca-link] *::after')
  })

  it('uses the stable scene attribute instead of a body-wide phase query', () => {
    expect(css).toContain("body[data-dsh-orca-link][data-orca-scene='hero'] .standby")
    expect(css).not.toContain("body[data-dsh-orca-link]:has([data-phase='hero'])")
  })

  it('contains terminal paint and locks only its measured width during layout motion', () => {
    expect(css).toContain('[data-dsh-better-sidebar] :global(.xterm)')
    expect(css).toContain('contain: layout paint style;')
    expect(css).toContain("[data-dsh-better-sidebar] [class*='_bottomPanel']")
    expect(css).toContain('[data-orca-terminal-width-locked]')
    expect(css).toContain('width: var(--orca-terminal-locked-width) !important;')
    expect(css).not.toContain('#root >')
    expect(css).not.toContain('[data-orca-terminal-mounted]')
  })

  it('locks produced-file rows without disabling the AppFrame transition', () => {
    expect(css).toContain('[data-produced-files-row][data-orca-responsive-width-locked]')
    expect(css).toContain('flex: 0 0 var(--orca-responsive-locked-width) !important;')
    expect(css).toContain('width: var(--orca-responsive-locked-width) !important;')
    expect(css).not.toContain("> div[data-slot='root']\n    > div {\n    transition: none !important;")
  })

  it('filters mutations generated inside xterm while retaining host changes', async () => {
    const terminal = document.createElement('div')
    terminal.className = 'xterm'
    const rows = document.createElement('div')
    terminal.append(rows)
    document.body.append(terminal)

    const batches: MutationRecord[][] = []
    const observer = new MutationObserver(records => { batches.push(records) })
    observer.observe(document.body, { childList: true, subtree: true })

    rows.append(document.createElement('span'))
    await Promise.resolve()
    expect(hasMutationOutsideTerminal(batches.pop() ?? [])).toBe(false)

    document.body.append(document.createElement('main'))
    await Promise.resolve()
    expect(hasMutationOutsideTerminal(batches.pop() ?? [])).toBe(true)
    observer.disconnect()
  })

  it('filters both backdrop contents and whole backdrop replacements', async () => {
    const composer = document.createElement('div')
    const backdrop = document.createElement('div')
    backdrop.setAttribute('data-input-backdrop', '')
    composer.append(backdrop)
    document.body.append(composer)

    const batches: MutationRecord[][] = []
    const observer = new MutationObserver(records => { batches.push(records) })
    observer.observe(document.body, { childList: true, subtree: true })

    backdrop.textContent = 'draft'
    await Promise.resolve()
    expect(hasMutationOutsideTerminal(batches.pop() ?? [])).toBe(false)

    const replacement = document.createElement('div')
    replacement.setAttribute('data-input-backdrop', '')
    replacement.textContent = 'next draft'
    backdrop.replaceWith(replacement)
    await Promise.resolve()
    expect(hasMutationOutsideTerminal(batches.pop() ?? [])).toBe(false)

    composer.append(document.createElement('button'))
    await Promise.resolve()
    expect(hasMutationOutsideTerminal(batches.pop() ?? [])).toBe(true)

    const hostText = document.createTextNode('host text')
    composer.append(hostText)
    await Promise.resolve()
    batches.pop()
    hostText.remove()
    await Promise.resolve()
    expect(hasMutationOutsideTerminal(batches.pop() ?? [])).toBe(true)
    observer.disconnect()
  })

  it('holds the terminal width until the AppFrame track transition ends', async () => {
    document.body.innerHTML = `
      <div id="root"><div data-slot="root"><div style="grid-template-columns: 280px 1fr 0px"></div></div></div>
      <div data-dsh-better-sidebar><div class="terminal"><div class="xterm"></div></div></div>
    `
    const host = document.querySelector<HTMLElement>('.terminal')!
    host.getBoundingClientRect = () => ({ width: 640 } as DOMRect)
    const frame = document.querySelector<HTMLElement>("[id='root'] > div[data-slot='root'] > div")!
    const dispose = installOrcaTerminalPerformance(document.body)

    frame.style.gridTemplateColumns = '72px 1fr 320px'
    await Promise.resolve()
    expect(host.hasAttribute('data-orca-terminal-width-locked')).toBe(true)
    expect(host.style.getPropertyValue('--orca-terminal-locked-width')).toBe('640px')

    const transitionEnd = new Event('transitionend')
    Object.defineProperty(transitionEnd, 'propertyName', { value: 'grid-template-columns' })
    frame.dispatchEvent(transitionEnd)
    expect(host.hasAttribute('data-orca-terminal-width-locked')).toBe(false)
    dispose()
  })

  it('holds each produced-file row at its own width and restores owned state exactly', async () => {
    document.body.innerHTML = `
      <div id="root"><div data-slot="root"><div style="grid-template-columns: 280px 1fr 0px">
        <div data-produced-files-row></div>
        <div data-produced-files-row data-orca-responsive-width-locked style="--orca-responsive-locked-width: 12px"></div>
      </div></div></div>
    `
    const frame = document.querySelector<HTMLElement>("[id='root'] > div[data-slot='root'] > div")!
    const rows = Array.from(document.querySelectorAll<HTMLElement>('[data-produced-files-row]'))
    rows[0].getBoundingClientRect = () => ({ width: 420 } as DOMRect)
    rows[1].getBoundingClientRect = () => ({ width: 260 } as DOMRect)
    const dispose = installOrcaTerminalPerformance(document.body)

    frame.style.gridTemplateColumns = '72px 1fr 320px'
    await Promise.resolve()
    expect(rows[0].hasAttribute('data-orca-responsive-width-locked')).toBe(true)
    expect(rows[0].style.getPropertyValue('--orca-responsive-locked-width')).toBe('420px')
    expect(rows[1].style.getPropertyValue('--orca-responsive-locked-width')).toBe('260px')
    expect(frame.hasAttribute('data-orca-responsive-width-locked')).toBe(false)

    const transitionEnd = new Event('transitionend')
    Object.defineProperty(transitionEnd, 'propertyName', { value: 'grid-template-columns' })
    frame.dispatchEvent(transitionEnd)
    expect(rows[0].hasAttribute('data-orca-responsive-width-locked')).toBe(false)
    expect(rows[0].style.getPropertyValue('--orca-responsive-locked-width')).toBe('')
    expect(rows[1].hasAttribute('data-orca-responsive-width-locked')).toBe(true)
    expect(rows[1].style.getPropertyValue('--orca-responsive-locked-width')).toBe('12px')

    frame.style.gridTemplateColumns = '280px 1fr 0px'
    await Promise.resolve()
    rows[0].style.setProperty('--orca-responsive-locked-width', '999px')
    rows[0].removeAttribute('data-orca-responsive-width-locked')
    dispose()
    expect(rows[0].hasAttribute('data-orca-responsive-width-locked')).toBe(false)
    expect(rows[0].style.getPropertyValue('--orca-responsive-locked-width')).toBe('999px')
    expect(rows[1].hasAttribute('data-orca-responsive-width-locked')).toBe(true)
    expect(rows[1].style.getPropertyValue('--orca-responsive-locked-width')).toBe('12px')
  })

  it('leaves a successor activation lock intact when the first disposer runs', async () => {
    document.body.innerHTML = `
      <div id="root"><div data-slot="root"><div style="grid-template-columns: 280px 1fr 0px">
        <div data-produced-files-row></div>
      </div></div></div>
    `
    const frame = document.querySelector<HTMLElement>("[id='root'] > div[data-slot='root'] > div")!
    const row = document.querySelector<HTMLElement>('[data-produced-files-row]')!
    row.getBoundingClientRect = () => ({ width: 320 } as DOMRect)

    const disposeFirst = installOrcaTerminalPerformance(document.body)
    frame.style.gridTemplateColumns = '72px 1fr 320px'
    await Promise.resolve()
    expect(row.hasAttribute('data-orca-responsive-width-locked')).toBe(true)
    expect(row.style.getPropertyValue('--orca-responsive-locked-width')).toBe('320px')

    // A second activation takes over the row and replaces the locked width.
    row.getBoundingClientRect = () => ({ width: 280 } as DOMRect)
    const disposeSecond = installOrcaTerminalPerformance(document.body)
    frame.style.gridTemplateColumns = '96px 1fr 320px'
    await Promise.resolve()
    expect(row.style.getPropertyValue('--orca-responsive-locked-width')).toBe('280px')

    // The first disposer must not remove the attribute a successor owns.
    disposeFirst()
    expect(row.hasAttribute('data-orca-responsive-width-locked')).toBe(true)
    expect(row.style.getPropertyValue('--orca-responsive-locked-width')).toBe('280px')

    // The successor restores to the state the first activation left behind.
    disposeSecond()
    expect(row.hasAttribute('data-orca-responsive-width-locked')).toBe(true)
    expect(row.style.getPropertyValue('--orca-responsive-locked-width')).toBe('320px')
  })

  it('raises the app root only while the settings dialog is open', async () => {
    expect(css).toContain("body[data-dsh-orca-link][data-orca-settings-open] [id='root']")
    expect(css).not.toContain("body[data-dsh-orca-link]:has([data-slot='sidebar.settings']")
    document.body.innerHTML = '<div id="root"><div data-slot="sidebar.settings"></div></div>'
    const dispose = installOrcaSettingsOverlay(document.body)
    const settings = document.querySelector<HTMLElement>("[data-slot='sidebar.settings']")!
    expect(document.body.hasAttribute('data-orca-settings-open')).toBe(false)

    const dialog = document.createElement('div')
    dialog.setAttribute('role', 'dialog')
    settings.append(dialog)
    await Promise.resolve()
    expect(document.body.hasAttribute('data-orca-settings-open')).toBe(true)

    dialog.remove()
    await Promise.resolve()
    expect(document.body.hasAttribute('data-orca-settings-open')).toBe(false)
    dispose()
  })
})
