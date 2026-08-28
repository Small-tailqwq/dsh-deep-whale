// @vitest-environment jsdom
/**
 * Orca Link skin apply spec — the template contract: the body
 * attribute the stylesheet is scoped on is set on apply and retracted on
 * dispose, and every injected chrome element (marked data-skin-chrome) is
 * removed. Extend with assertions specific to your surface.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Context, type Fiber } from '@deepseek-ai/cordis'
import { apply } from '../src/client/index.ts'

let fiber: Fiber | undefined

async function mount(): Promise<Fiber> {
  const f = new Context().plugin({ apply })
  await f.await()
  return f
}

afterEach(async () => {
  await fiber?.dispose()
  fiber = undefined
  document.body.innerHTML = ''
  document.title = ''
  document.documentElement.lang = ''
  vi.unstubAllGlobals()
})

describe('Orca Link skin apply', () => {
  it('sets the body attribute and retracts it on dispose', async () => {
    fiber = await mount()
    expect(document.body.hasAttribute('data-dsh-orca-link')).toBe(true)
    await fiber.dispose()
    expect(document.body.hasAttribute('data-dsh-orca-link')).toBe(false)
  })

  it('injects chrome and retracts every element on dispose', async () => {
    fiber = await mount()
    expect(document.body.querySelectorAll('[data-skin-chrome]')).toHaveLength(4)
    expect(document.body.querySelectorAll('[data-skin-chrome="light-scene"] > div')).toHaveLength(2)
    expect(document.body.querySelectorAll('[data-skin-chrome="dark-scene"] > div')).toHaveLength(2)
    expect(document.body.textContent).toContain('ORCA LINK')
    expect(document.body.style.getPropertyValue('--orca-link-light-hero-art')).toContain('data:image/webp')
    expect(document.body.style.getPropertyValue('--orca-link-light-active-art')).toContain('data:image/webp')
    expect(document.body.style.getPropertyValue('--orca-link-dark-hero-art')).toContain('data:image/webp')
    expect(document.body.style.getPropertyValue('--orca-link-dark-active-art')).toContain('data:image/webp')
    expect(document.body.style.getPropertyValue('--orca-link-sidebar-art')).toBe('')
    const favicon = document.head.querySelector<HTMLLinkElement>('link[rel="icon"]')
    expect(favicon).not.toBeNull()
    expect(decodeURIComponent(favicon?.href ?? '')).not.toContain('rx="16"')
    expect(decodeURIComponent(favicon?.href ?? '')).toContain('<rect x="43" y="26" width="4" height="4"')
    await fiber.dispose()
    expect(document.body.querySelectorAll('[data-skin-chrome]').length).toBe(0)
    expect(document.body.style.getPropertyValue('--orca-link-light-hero-art')).toBe('')
    expect(document.body.style.getPropertyValue('--orca-link-light-active-art')).toBe('')
    expect(document.body.style.getPropertyValue('--orca-link-dark-hero-art')).toBe('')
    expect(document.body.style.getPropertyValue('--orca-link-dark-active-art')).toBe('')
    expect(document.head.querySelector('link[rel="icon"]')).toBeNull()
  })

  it('replaces the production sidebar wordmark with DSH vector paths', async () => {
    document.body.innerHTML = `
      <div data-slot="sidebar">
        <div><div><button type="button"><svg data-original-wordmark></svg></button></div></div>
      </div>
    `
    const pane = document.querySelector("[data-slot='sidebar'] > :first-child") as HTMLElement
    pane.getBoundingClientRect = () => ({ width: 336 } as DOMRect)
    fiber = await mount()
    const replacement = document.querySelector('[data-orca-link-wordmark]')
    expect(replacement).toBeInstanceOf(SVGElement)
    expect(replacement?.querySelectorAll('path')).toHaveLength(3)
    expect(replacement?.parentElement).toBe(document.querySelector("[data-slot='sidebar'] > :first-child > :first-child"))
    const chip = document.querySelector('[data-orca-link-signal]')
    expect(chip?.textContent).toContain('LINK ACTIVE')
    expect(chip?.parentElement).toBe(document.querySelector("[data-slot='sidebar'] > :first-child > :first-child"))
    const character = document.querySelector<HTMLElement>('[data-orca-link-character]')
    expect(character?.parentElement).toBe(pane)
    expect(character?.dataset.orcaLinkStatus).toBe('standby')
    expect(character?.querySelector<HTMLElement>('[data-orca-link-character-sprite]')?.style.getPropertyValue('--orca-link-status-atlas'))
      .toContain('data:image/webp')
    expect(document.body.style.getPropertyValue('--orca-sidebar-width')).toBe('336px')
    expect(document.body.style.getPropertyValue('--orca-sidebar-art-width')).toBe('336px')
    expect(document.body.hasAttribute('data-orca-sidebar-wide')).toBe(true)
    await fiber.dispose()
    expect(document.querySelector('[data-orca-link-wordmark]')).toBeNull()
    expect(document.querySelector('[data-orca-link-signal]')).toBeNull()
    expect(document.querySelector('[data-orca-link-character]')).toBeNull()
    expect(document.querySelector('[data-original-wordmark]')).not.toBeNull()
    expect(document.body.style.getPropertyValue('--orca-sidebar-width')).toBe('')
    expect(document.body.style.getPropertyValue('--orca-sidebar-art-width')).toBe('')
    expect(document.body.hasAttribute('data-orca-sidebar-wide')).toBe(false)
  })

  it('commits the AppFrame target width only once across intermediate resize notifications', async () => {
    let notifyResize = (): void => {}
    class ResizeObserverStub {
      constructor(callback: ResizeObserverCallback) { notifyResize = () => callback([], this as unknown as ResizeObserver) }
      observe(): void {}
      disconnect(): void {}
      unobserve(): void {}
    }
    vi.stubGlobal('ResizeObserver', ResizeObserverStub)
    document.body.innerHTML = `
      <div id="root"><div data-slot="root"><div style="grid-template-columns: 56px minmax(0px, 1fr) 0px"></div></div></div>
      <div data-slot="sidebar"><div><div><button type="button"><svg></svg></button></div></div></div>
    `
    const pane = document.querySelector<HTMLElement>("[data-slot='sidebar'] > :first-child")!
    const frame = document.querySelector<HTMLElement>("[id='root'] > div[data-slot='root'] > div")!
    let measuredWidth = 55
    pane.getBoundingClientRect = () => ({ width: measuredWidth } as DOMRect)
    fiber = await mount()
    expect(document.body.style.getPropertyValue('--orca-sidebar-width')).toBe('56px')

    const setProperty = vi.spyOn(document.body.style, 'setProperty')
    frame.style.gridTemplateColumns = '280px minmax(0px, 1fr) 0px'
    for (const intermediate of [72, 164, 238, 280]) {
      measuredWidth = intermediate
      notifyResize()
    }
    const widthWrites = setProperty.mock.calls.filter(([property]) => property === '--orca-sidebar-width')
    expect(widthWrites).toEqual([['--orca-sidebar-width', '280px']])
    expect(document.body.hasAttribute('data-orca-sidebar-wide')).toBe(true)
  })

  it('tracks only the current conversation in the sidebar link signal', async () => {
    document.body.innerHTML = `
      <div data-slot="sidebar">
        <div>
          <div><button type="button"><svg></svg></button></div>
          <div role="tree">
            <div role="treeitem" aria-selected="true">current</div>
            <div role="treeitem" aria-selected="false"><span data-state="running">background</span></div>
          </div>
        </div>
      </div>
      <div data-phase="hero">
        <div data-conversation-scroll>
          <div data-composer-seat><div data-composer-input contenteditable="true" data-phase="plain"></div></div>
        </div>
      </div>
    `
    const root = document.querySelector<HTMLElement>('[data-phase="hero"]')!
    const scroll = document.querySelector<HTMLElement>('[data-conversation-scroll]')!

    fiber = await mount()
    const signal = document.querySelector<HTMLElement>('[data-orca-link-signal]')!
    const label = signal.querySelector<HTMLElement>('[data-orca-link-signal-label]')!
    expect(signal.dataset.orcaLinkStatus).toBe('standby')
    expect(document.body.dataset.orcaLinkStatus).toBe('standby')
    expect(label.textContent).toBe('LINK ACTIVE')

    root.dataset.phase = 'active'
    scroll.innerHTML = `
      <div data-chat-flow>
        <div data-chat-flow-kind="assistant-step"><div data-state="ok"></div></div>
        <div data-chat-flow-kind="turn-tail"></div>
      </div>
      <div data-composer-seat><div data-composer-input contenteditable="true" data-phase="plain"></div></div>
    `
    await new Promise(resolve => { setTimeout(resolve, 0) })
    expect(signal.dataset.orcaLinkStatus).toBe('complete')
    expect(document.body.dataset.orcaLinkStatus).toBe('complete')
    expect(label.textContent).toBe('TASK COMPLETE')

    scroll.querySelector('[data-chat-flow]')?.append(Object.assign(document.createElement('div'), { innerHTML: '<span data-state="running"></span>' }))
    await new Promise(resolve => { setTimeout(resolve, 0) })
    expect(label.textContent).toBe('TASK RUNNING')

    scroll.querySelector("[data-state='running']")?.remove()
    scroll.append(Object.assign(document.createElement('div'), { innerHTML: '<div data-approval-key="approval"></div>' }))
    await new Promise(resolve => { setTimeout(resolve, 0) })
    expect(label.textContent).toBe('AUTH REQUEST')

    scroll.querySelector('[data-approval-key]')?.parentElement?.remove()
    scroll.append(Object.assign(document.createElement('div'), { innerHTML: '<div data-question-key="question"></div>' }))
    await new Promise(resolve => { setTimeout(resolve, 0) })
    expect(label.textContent).toBe('INPUT REQUIRED')

    scroll.querySelector('[data-question-key]')?.parentElement?.remove()
    scroll.append(Object.assign(document.createElement('div'), { innerHTML: '<div data-plan-review-key="review"></div>' }))
    await new Promise(resolve => { setTimeout(resolve, 0) })
    expect(label.textContent).toBe('PLAN REVIEW')

    scroll.querySelector('[data-plan-review-key]')?.parentElement?.remove()
    scroll.querySelector('[data-chat-flow]')!.innerHTML = `
      <div data-chat-flow-kind="assistant-step"><div data-state="error"></div></div>
      <div data-chat-flow-kind="turn-tail"></div>
    `
    await new Promise(resolve => { setTimeout(resolve, 0) })
    expect(label.textContent).toBe('LINK FAULT')

    scroll.querySelector('[data-chat-flow]')!.innerHTML = '<div data-chat-flow-kind="user"></div>'
    await new Promise(resolve => { setTimeout(resolve, 0) })
    expect(label.textContent).toBe('SESSION READY')

    const composerInput = scroll.querySelector<HTMLElement>('[data-composer-input]')!
    composerInput.dataset.phase = 'submitting'
    await new Promise(resolve => { setTimeout(resolve, 0) })
    expect(label.textContent).toBe('LINK SYNC')
    composerInput.dataset.phase = 'plain'
    composerInput.setAttribute('aria-disabled', 'true')
    await new Promise(resolve => { setTimeout(resolve, 0) })
    expect(label.textContent).toBe('LINK OFFLINE')

    root.dataset.phase = 'hero'
    await new Promise(resolve => { setTimeout(resolve, 0) })
    expect(label.textContent).toBe('LINK ACTIVE')
  })

  it('pins the skin title and restores the original on dispose', async () => {
    document.title = 'original'
    fiber = await mount()
    expect(document.title).not.toBe('original')
    await fiber.dispose()
    expect(document.title).toBe('original')
  })

  it('redraws matched host icons in place and retracts them on dispose', async () => {
    document.body.innerHTML = `
      <button type="button" aria-label="发送消息"><svg viewBox="0 0 16 16"><path d="M8.3125 0.980183C8.66767 1.0531 8.97902 1.20418 9.2627 1.43233"></path></svg></button>
      <button type="button" aria-label="关闭"><svg viewBox="0 0 14 14"><path d="M10.6074 4.40278L8.00975 6.99973"></path></svg></button>
      <svg viewBox="0 0 16 16"><path d="M0 0h16v16H0z"></path></svg>
    `
    const send = document.querySelector<SVGElement>('[aria-label="发送消息"] svg')!
    const close = document.querySelector<SVGElement>('[aria-label="关闭"] svg')!
    const unknown = document.querySelectorAll('svg')[2]!
    fiber = await mount()
    expect(send.hasAttribute('data-orca-link-icon')).toBe(true)
    expect(send.getAttribute('data-orca-link-icon')).toBe('send')
    const sendArt = send.querySelector('g[data-orca-link-icon-art]')
    expect(sendArt).not.toBeNull()
    expect(sendArt?.getAttribute('stroke-linejoin')).toBe('miter')
    expect(sendArt?.querySelectorAll('path').length).toBeGreaterThan(0)
    expect(close.getAttribute('data-orca-link-icon')).toBe('close')
    // 14-unit viewBox scales the 16-unit design grid down.
    expect(close.querySelector('g[data-orca-link-icon-art]')?.getAttribute('transform')).toBe('translate(0 0) scale(0.875)')
    expect(unknown.hasAttribute('data-orca-link-icon')).toBe(false)
    await fiber.dispose()
    expect(document.querySelector('[data-orca-link-icon]')).toBeNull()
    expect(document.querySelector('[data-orca-link-icon-art]')).toBeNull()
    expect(send.querySelector('path')?.getAttribute('d')).toContain('M8.3125 0.980183')
  })

  it('distinguishes all permission and workspace folder icons', async () => {
    document.body.innerHTML = `
      <svg data-test="read" viewBox="0 0 16 16"><path d="M12.1654 5.7552L8.9447"></path></svg>
      <svg data-test="write" viewBox="0 0 16 16"><path d="M8.08887 0.251709C8.20479"></path></svg>
      <svg data-test="full" viewBox="0 0 16 16"><path d="M9.10094 4.5V8.75939"></path></svg>
      <svg data-test="open" viewBox="0 0 16 16"><path d="M5.19629 1.57104C5.81144"></path></svg>
      <svg data-test="closed" viewBox="0 0 16 16"><path d="M5.05582 0.518756L4.50669 0.86654"></path></svg>
    `
    fiber = await mount()
    const icon = (name: string): string | null => document.querySelector(`[data-test="${name}"]`)?.getAttribute('data-orca-link-icon') ?? null
    expect(icon('read')).toBe('permission-read')
    expect(icon('write')).toBe('permission-write')
    expect(icon('full')).toBe('permission-full')
    expect(icon('open')).toBe('folder-open')
    expect(icon('closed')).toBe('folder-closed')
  })

  it('redraws the agent-protocol glyphs: queue send, todo, question, goal, delete', async () => {
    document.body.innerHTML = `
      <button type="button" aria-label="发送"><svg viewBox="0 0 14 14"><path d="M7.24707 1.01771C7.52897 1.07653"></path></svg></button>
      <button type="button" aria-label="编辑"><svg viewBox="0 0 16 16"><path d="M9.94076 1.34942C10.7047 0.90231"></path></svg></button>
      <button type="button" aria-label="删除"><svg viewBox="0 0 16 16"><path d="M14.4782 4.84067L14.2138 10.1152"></path></svg></button>
      <svg viewBox="0 0 14 14"><path d="M13.3277 9.69629V10.976H7.28086"></path></svg>
      <svg viewBox="0 0 14 14"><path d="M12.5757 7.00012C12.5757 3.92085"></path></svg>
      <svg viewBox="0 0 16 16"><path d="M8 0C8.31451 0 8.62464 0.019379"></path></svg>
      <svg viewBox="0 0 16 16"><path d="M5.05582 0.518756L4.50669 0.86654"></path></svg>
      <svg viewBox="0 0 14 14"><path d="M5.5 2.15137L5.92383 2.57617"></path></svg>
    `
    fiber = await mount()
    const names = Array.from(document.querySelectorAll('[data-orca-link-icon]'))
      .map((el) => el.getAttribute('data-orca-link-icon'))
    expect(names).toEqual(['send', 'edit', 'trash', 'checklist', 'question', 'goal', 'folder-closed', 'chevron-right'])
    for (const el of document.querySelectorAll('[data-orca-link-icon]')) {
      expect(el.querySelector('g[data-orca-link-icon-art]')).not.toBeNull()
    }
    await fiber.dispose()
    expect(document.querySelectorAll('[data-orca-link-icon]').length).toBe(0)
  })

  it('redraws every todo state as rectilinear status art', async () => {
    document.body.innerHTML = `
      <svg viewBox="0 0 14 14"><circle cx="7" cy="7" r="6.4" stroke="currentColor" stroke-dasharray="2.4 2.4"></circle></svg>
      <svg viewBox="0 0 14 14"><defs><linearGradient id="todo-progress" x1="2.5" y1="12" x2="10.5" y2="3.5"></linearGradient></defs><circle cx="7" cy="7" r="6.4" stroke="url(#todo-progress)"></circle></svg>
      <svg viewBox="0 0 14 14"><circle cx="7" cy="7" r="6.4"></circle><path d="M10.9631 5.71411L7.70154 8.97571"></path></svg>
    `
    fiber = await mount()
    const states = Array.from(document.querySelectorAll<SVGElement>('[data-orca-link-icon]'))
    expect(states.map(svg => svg.getAttribute('data-orca-link-icon')))
      .toEqual(['todo-pending', 'todo-progress', 'todo-completed'])
    for (const svg of states) {
      const art = svg.querySelector('g[data-orca-link-icon-art]')
      expect(art?.getAttribute('stroke-linejoin')).toBe('miter')
      expect(art?.querySelector('circle')).toBeNull()
    }
    const progressCells = states[1]?.querySelectorAll('rect[data-orca-link-todo-progress-cell]')
    expect(progressCells).toHaveLength(9)
    expect(Array.from(progressCells ?? []).map(cell => cell.getAttribute('data-orca-link-todo-progress-cell')))
      .toEqual(['0', '1', '2', '3', '4', '5', '6', '7', '8'])
    await fiber.dispose()
  })

  it('re-matches a retained composer svg when send changes to stop', async () => {
    document.body.innerHTML = `
      <button type="button" aria-label="发送消息">
        <svg viewBox="0 0 16 16"><path d="M8.3125 0.980183C8.66767 1.08443"></path></svg>
      </button>
    `
    const svg = document.querySelector<SVGElement>('svg')!
    fiber = await mount()
    expect(svg.getAttribute('data-orca-link-icon')).toBe('send')

    svg.querySelector(':scope > path')?.remove()
    const stop = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
    for (const [name, value] of Object.entries({ x: '3', y: '3', width: '10', height: '10', rx: '3', fill: 'currentColor' })) {
      stop.setAttribute(name, value)
    }
    svg.prepend(stop)
    await new Promise(resolve => { setTimeout(resolve, 0) })

    expect(svg.getAttribute('data-orca-link-icon')).toBe('stop')
    expect(svg.querySelectorAll('g[data-orca-link-icon-art]')).toHaveLength(1)
    expect(svg.querySelector('g[data-orca-link-icon-art] path')?.getAttribute('d')).toContain('M3.75 3.75')
    await fiber.dispose()
  })

  it('reconciles only SVGs inside the changed subtree', async () => {
    document.body.innerHTML = `
      <svg viewBox="0 0 16 16"><path d="M8.3125 0.980183C8.66767 1.08443"></path></svg>
    `
    const existing = document.querySelector<SVGElement>('svg')!
    fiber = await mount()
    await new Promise(resolve => { setTimeout(resolve, 0) })
    const clone = vi.spyOn(existing, 'cloneNode')
    clone.mockClear()

    const added = document.createElement('div')
    added.innerHTML = `
      <svg viewBox="0 0 16 16"><path d="M9.94076 1.34942C10.7047 0.90231"></path></svg>
    `
    document.body.append(added)
    await new Promise(resolve => { setTimeout(resolve, 0) })

    expect(clone).not.toHaveBeenCalled()
    expect(added.querySelector('svg')?.getAttribute('data-orca-link-icon')).toBe('edit')
  })

  it('centers art on a portrait viewBox with a uniform fit scale', async () => {
    document.body.innerHTML = `
      <svg viewBox="0 0 8 14"><path d="M6.54199 8.62824C6.54199 8.44193"></path></svg>
    `
    fiber = await mount()
    const art = document.querySelector('g[data-orca-link-icon-art]')!
    expect(art.getAttribute('transform')).toBe('translate(0 3) scale(0.5)')
    await fiber.dispose()
  })

  it('mirrors the context-usage ring as a bottom-up pixel gauge', async () => {
    document.body.innerHTML = `
      <svg viewBox="0 0 14 14" aria-label="上下文已用 50%">
        <circle class="JObwrW_track" cx="7" cy="7" r="5.5"></circle>
        <circle class="JObwrW_fill" cx="7" cy="7" r="5.5" stroke-dasharray="17.28 17.28" transform="rotate(-90 7 7)"></circle>
      </svg>
    `
    const gauge = document.querySelector('svg')!
    fiber = await mount()
    expect(gauge.getAttribute('data-orca-link-icon')).toBe('usage')
    const cells = Array.from(gauge.querySelectorAll<SVGElement>('rect[data-orca-link-usage-cell]'))
    expect(cells).toHaveLength(36)
    // 50%: eighteen solid cells, the rest a faint grid.
    expect(cells[17]?.getAttribute('opacity')).toBe('1')
    expect(cells[18]?.getAttribute('opacity')).toBe('0.12')
    const ring = gauge.querySelector('circle.JObwrW_fill')!
    // 15%: five solid cells and the boundary cell fading in at 0.4.
    ring.setAttribute('stroke-dasharray', '5.184 29.376')
    await new Promise(resolve => { setTimeout(resolve, 0) })
    expect(cells[4]?.getAttribute('opacity')).toBe('1')
    expect(cells[5]?.getAttribute('opacity')).toBe('0.4')
    expect(cells[6]?.getAttribute('opacity')).toBe('0.12')
    // 100%: the full field is lit.
    ring.setAttribute('stroke-dasharray', '34.56 0')
    await new Promise(resolve => { setTimeout(resolve, 0) })
    expect(cells[35]?.getAttribute('opacity')).toBe('1')
    await fiber.dispose()
    expect(gauge.querySelector('[data-orca-link-icon-art]')).toBeNull()
  })

  it('completes the rail search open when the row lands focused but collapsed', async () => {
    document.body.innerHTML = `
      <div data-slot="sidebar">
        <div>
          <div class="qDHVXG_search">
            <button type="button" class="qDHVXG_searchButton" aria-label="搜索会话" aria-expanded="false"></button>
            <input class="qDHVXG_searchInput" type="text" placeholder="搜索会话…">
          </div>
        </div>
      </div>
    `
    const button = document.querySelector<HTMLButtonElement>('button.qDHVXG_searchButton')!
    const input = document.querySelector<HTMLInputElement>('input.qDHVXG_searchInput')!
    let clicks = 0
    // The host row opens on click (aria-expanded flips); the fixture mirrors
    // that so duplicate completions are absorbed like production.
    button.addEventListener('click', () => {
      clicks += 1
      button.setAttribute('aria-expanded', 'true')
    })
    fiber = await mount()
    // Sidebar already expanded by the rail click; the row landed collapsed.
    // jsdom does not synthesize focus events for programmatic focus, so the
    // event a real browser fires is dispatched explicitly.
    document.body.setAttribute('data-orca-sidebar-wide', '')
    input.focus()
    input.dispatchEvent(new FocusEvent('focusin', { bubbles: true }))
    await new Promise(resolve => { setTimeout(resolve, 460) })
    expect(clicks).toBe(1)
    // An already-open row is never re-clicked.
    button.setAttribute('aria-expanded', 'true')
    input.focus()
    input.dispatchEvent(new FocusEvent('focusin', { bubbles: true }))
    await new Promise(resolve => { setTimeout(resolve, 460) })
    expect(clicks).toBe(1)
    // A collapsed row that lost focus before the recheck stays untouched.
    button.setAttribute('aria-expanded', 'false')
    input.focus()
    input.dispatchEvent(new FocusEvent('focusin', { bubbles: true }))
    input.blur()
    await new Promise(resolve => { setTimeout(resolve, 460) })
    expect(clicks).toBe(1)
    await fiber.dispose()
  })

  it('redraws the orbiting-dot busy spinner as a square edge tracer', async () => {
    document.body.innerHTML = `
      <svg viewBox="0 0 10 10">
        <rect class="_cell_10orb_54" x="0" y="0" width="2" height="2" style="animation-delay: -1000ms;"></rect>
        <rect class="_cell_10orb_54" x="4" y="0" width="2" height="2" style="animation-delay: -750ms;"></rect>
      </svg>
    `
    const spinner = document.querySelector('svg')!
    fiber = await mount()
    expect(spinner.getAttribute('data-orca-link-icon')).toBe('spinner')
    const edges = Array.from(spinner.querySelectorAll('rect[data-orca-link-spinner-seq]'))
    expect(edges).toHaveLength(4)
    expect(edges.map((edge) => edge.getAttribute('data-orca-link-spinner-seq'))).toEqual(['0', '1', '2', '3'])
    await fiber.dispose()
    expect(spinner.querySelector('[data-orca-link-icon-art]')).toBeNull()
  })

  it('does not clobber a session title during teardown', async () => {
    fiber = await mount()
    document.title = 'active session · ORCA LINK'
    await fiber.dispose()
    fiber = undefined
    expect(document.title).toBe('active session · ORCA LINK')
  })

  it('crossfades the hero composer into the active dock without submitting itself', async () => {
    document.body.innerHTML = `
      <div data-phase="hero">
        <div data-conversation-scroll>
          <div data-chat-flow></div>
          <div data-composer-seat>
            <div data-composer-card>
              <div data-composer-input contenteditable="true">launch</div>
              <button type="button">send</button>
            </div>
          </div>
        </div>
      </div>
    `
    const root = document.querySelector<HTMLElement>('[data-phase]')!
    const seat = document.querySelector<HTMLElement>('[data-composer-seat]')!
    const card = document.querySelector<HTMLElement>('[data-composer-card]')!
    const input = document.querySelector<HTMLElement>('[data-composer-input]')!
    card.getBoundingClientRect = () => ({ left: 100, top: 200, width: 600, height: 120 } as DOMRect)

    fiber = await mount()
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }))
    expect(seat.hasAttribute('data-orca-composer-exiting')).toBe(true)
    expect(document.querySelectorAll('[data-orca-composer-ghost]')).toHaveLength(1)

    root.dataset.phase = 'active'
    await new Promise(resolve => { setTimeout(resolve, 0) })
    expect(seat.hasAttribute('data-orca-composer-exiting')).toBe(false)
    expect(seat.hasAttribute('data-orca-composer-entering')).toBe(true)

    await fiber.dispose()
    fiber = undefined
    expect(document.querySelector('[data-orca-composer-ghost]')).toBeNull()
    expect(seat.hasAttribute('data-orca-composer-entering')).toBe(false)
  })

  it('hides the active composer on upward scroll and restores it downward or at bottom', async () => {
    document.body.innerHTML = `
      <div data-phase="active">
        <div data-conversation-scroll>
          <div data-chat-flow></div>
          <div role="listbox"><div data-model-option>model option</div></div>
          <div data-composer-seat><div data-composer-card><div data-composer-input contenteditable="true"></div></div></div>
        </div>
      </div>
    `
    const scrollport = document.querySelector<HTMLElement>('[data-conversation-scroll]')!
    const seat = document.querySelector<HTMLElement>('[data-composer-seat]')!
    let scrollTop = 600
    let scrollTopReads = 0
    Object.defineProperties(scrollport, {
      scrollTop: {
        configurable: true,
        get: () => {
          scrollTopReads += 1
          return scrollTop
        },
        set: (value: number) => { scrollTop = value },
      },
      scrollHeight: { configurable: true, value: 1_400 },
      clientHeight: { configurable: true, value: 400 },
    })

    fiber = await mount()
    expect(scrollTopReads).toBe(0)
    const modelOption = document.querySelector<HTMLElement>('[data-model-option]')!
    modelOption.dispatchEvent(new WheelEvent('wheel', { bubbles: true, deltaY: -100 }))
    expect(seat.hasAttribute('data-orca-composer-hidden')).toBe(false)
    expect(scrollTopReads).toBe(0)

    scrollport.dispatchEvent(new WheelEvent('wheel', { bubbles: true, deltaY: -6 }))
    expect(seat.hasAttribute('data-orca-composer-hidden')).toBe(false)
    expect(scrollTopReads).toBe(1)
    scrollport.dispatchEvent(new WheelEvent('wheel', { bubbles: true, deltaY: -100 }))
    expect(seat.hasAttribute('data-orca-composer-hidden')).toBe(true)
    scrollport.dispatchEvent(new WheelEvent('wheel', { bubbles: true, deltaY: 100 }))
    expect(seat.hasAttribute('data-orca-composer-hidden')).toBe(false)

    const input = document.querySelector<HTMLElement>('[data-composer-input]')!
    input.focus()
    scrollTop = 500
    scrollport.dispatchEvent(new Event('scroll'))
    expect(seat.hasAttribute('data-orca-composer-hidden')).toBe(true)
    expect(document.activeElement).not.toBe(input)

    scrollTop = 540
    scrollport.dispatchEvent(new Event('scroll'))
    expect(seat.hasAttribute('data-orca-composer-hidden')).toBe(false)

    input.focus()
    expect(seat.hasAttribute('data-orca-composer-interactive')).toBe(true)
    input.blur()
    await new Promise(resolve => { queueMicrotask(resolve) })
    expect(seat.hasAttribute('data-orca-composer-interactive')).toBe(false)

    scrollTop = 420
    scrollport.dispatchEvent(new Event('scroll'))
    expect(seat.hasAttribute('data-orca-composer-hidden')).toBe(true)
    scrollTop = 1_000
    scrollport.dispatchEvent(new Event('scroll'))
    expect(seat.hasAttribute('data-orca-composer-hidden')).toBe(false)
  })

  it('wheeling a long draft at its edge never hides the composer', async () => {
    document.body.innerHTML = `
      <div data-phase="active">
        <div data-conversation-scroll>
          <div data-chat-flow></div>
          <div data-composer-seat>
            <div data-composer-card>
              <div class="draft-scroll"><div data-composer-input contenteditable="true"></div></div>
            </div>
          </div>
        </div>
      </div>
    `
    const scrollport = document.querySelector<HTMLElement>('[data-conversation-scroll]')!
    const seat = document.querySelector<HTMLElement>('[data-composer-seat]')!
    const draft = document.querySelector<HTMLElement>('.draft-scroll')!
    const input = document.querySelector<HTMLElement>('[data-composer-input]')!
    draft.style.overflowY = 'auto'
    Object.defineProperties(draft, {
      clientHeight: { configurable: true, value: 300 },
      scrollHeight: { configurable: true, value: 700 },
    })
    let scrollTop = 600
    Object.defineProperties(scrollport, {
      scrollTop: { configurable: true, get: () => scrollTop, set: (value: number) => { scrollTop = value } },
      scrollHeight: { configurable: true, value: 1_400 },
      clientHeight: { configurable: true, value: 400 },
    })

    fiber = await mount()

    // draft scroller at its edge; the host forwards the delta to the transcript
    input.dispatchEvent(new WheelEvent('wheel', { bubbles: true, deltaY: -120 }))
    scrollTop = 480
    scrollport.dispatchEvent(new Event('scroll')) // forwarded transcript scroll
    expect(seat.hasAttribute('data-orca-composer-hidden')).toBe(false)

    // inertia tails (small deltas) refresh the same gesture window
    input.dispatchEvent(new WheelEvent('wheel', { bubbles: true, deltaY: -6 }))
    scrollTop = 420
    scrollport.dispatchEvent(new Event('scroll'))
    expect(seat.hasAttribute('data-orca-composer-hidden')).toBe(false)

    // once the window closes, transcript scroll-intent steers the seat again
    vi.useFakeTimers()
    vi.setSystemTime(Date.now() + 250)
    try {
      scrollTop = 360
      scrollport.dispatchEvent(new Event('scroll'))
    } finally {
      vi.useRealTimers()
    }
    expect(seat.hasAttribute('data-orca-composer-hidden')).toBe(true)
  })

  it('collapses the composer from either inward handle and keeps it manually locked', async () => {
    document.documentElement.lang = 'zh-CN'
    document.body.innerHTML = `
      <div data-phase="active">
        <div data-conversation-scroll>
          <div data-chat-flow></div>
          <div data-composer-seat>
            <div data-composer-card><div data-composer-input contenteditable="true">保留这段草稿</div></div>
          </div>
        </div>
      </div>
    `
    const root = document.querySelector<HTMLElement>('[data-phase]')!
    const scrollport = document.querySelector<HTMLElement>('[data-conversation-scroll]')!
    const seat = document.querySelector<HTMLElement>('[data-composer-seat]')!
    const card = document.querySelector<HTMLElement>('[data-composer-card]')!
    root.getBoundingClientRect = () => ({ left: 0, top: 0, right: 800, bottom: 600, width: 800, height: 600 } as DOMRect)
    card.getBoundingClientRect = () => ({ left: 100, top: 400, right: 700, bottom: 520, width: 600, height: 120 } as DOMRect)
    Object.defineProperties(scrollport, {
      scrollTop: { configurable: true, value: 500, writable: true },
      scrollHeight: { configurable: true, value: 1_400 },
      clientHeight: { configurable: true, value: 400 },
    })

    const pointer = (type: string, clientX: number, pointerId = 7): Event => {
      const buttons = type === 'pointerup' || type === 'pointercancel' ? 0 : 1
      const event = new MouseEvent(type, { bubbles: true, cancelable: true, button: 0, buttons, clientX })
      Object.defineProperties(event, {
        pointerId: { value: pointerId },
        isPrimary: { value: true },
        pointerType: { value: 'mouse' },
      })
      return event
    }

    fiber = await mount()
    const handles = Array.from(card.querySelectorAll<HTMLButtonElement>('[data-orca-composer-handle]'))
    expect(handles.map(handle => handle.dataset.orcaComposerHandle)).toEqual(['left', 'right'])
    expect(handles[0]?.getAttribute('aria-label')).toContain('向右')
    expect(handles[1]?.getAttribute('aria-label')).toContain('向左')
    expect(handles[0]?.hasAttribute('title')).toBe(false)

    handles[0]!.dispatchEvent(pointer('pointerdown', 100))
    document.dispatchEvent(pointer('pointermove', 220))
    document.dispatchEvent(pointer('pointerup', 220))

    expect(seat.hasAttribute('data-orca-composer-manual-hidden')).toBe(true)
    expect(seat.hasAttribute('inert')).toBe(true)
    expect(document.querySelector<HTMLElement>('[data-composer-input]')?.textContent).toBe('保留这段草稿')
    const restore = document.querySelector<HTMLButtonElement>('[data-orca-composer-restore]')!
    expect(restore).not.toBeNull()
    expect(restore.style.left).toBe('656px')
    expect(restore.style.top).toBe('364px')
    expect(restore.hasAttribute('title')).toBe(false)

    const toBottom = document.createElement('button')
    toBottom.className = 'Md3f7G_toBottom'
    toBottom.setAttribute('aria-label', '回到底部')
    toBottom.getBoundingClientRect = () => ({ left: 650, top: 330, right: 684, bottom: 364, width: 34, height: 34 } as DOMRect)
    scrollport.append(toBottom)
    await new Promise(resolve => { setTimeout(resolve, 0) })
    expect(restore.style.left).toBe('653px')
    expect(restore.style.top).toBe('372px')

    scrollport.dispatchEvent(new WheelEvent('wheel', { bubbles: true, deltaY: -100 }))
    scrollport.dispatchEvent(new WheelEvent('wheel', { bubbles: true, deltaY: 100 }))
    expect(seat.hasAttribute('data-orca-composer-manual-hidden')).toBe(true)
    expect(seat.hasAttribute('data-orca-composer-hidden')).toBe(false)

    restore.click()
    expect(seat.hasAttribute('data-orca-composer-manual-hidden')).toBe(false)
    expect(seat.hasAttribute('inert')).toBe(false)
    expect(seat.hasAttribute('data-orca-composer-restoring')).toBe(true)
  })

  it('rebounds a short composer-handle drag without hiding the draft', async () => {
    document.body.innerHTML = `
      <div data-phase="active">
        <div data-conversation-scroll>
          <div data-chat-flow></div>
          <div data-composer-seat><div data-composer-card><div data-composer-input contenteditable="true">draft</div></div></div>
        </div>
      </div>
    `
    const root = document.querySelector<HTMLElement>('[data-phase]')!
    const seat = document.querySelector<HTMLElement>('[data-composer-seat]')!
    const card = document.querySelector<HTMLElement>('[data-composer-card]')!
    root.getBoundingClientRect = () => ({ left: 0, top: 0, right: 800, bottom: 600, width: 800, height: 600 } as DOMRect)
    card.getBoundingClientRect = () => ({ left: 100, top: 300, right: 700, bottom: 420, width: 600, height: 120 } as DOMRect)
    const pointer = (type: string, clientX: number, buttons = type === 'pointerup' ? 0 : 1): Event => {
      const event = new MouseEvent(type, { bubbles: true, cancelable: true, button: 0, buttons, clientX })
      Object.defineProperties(event, {
        pointerId: { value: 11 },
        isPrimary: { value: true },
        pointerType: { value: 'mouse' },
      })
      return event
    }

    fiber = await mount()
    const right = card.querySelector<HTMLButtonElement>("[data-orca-composer-handle='right']")!
    right.dispatchEvent(pointer('pointerdown', 700))
    expect(seat.hasAttribute('data-orca-composer-collapse-dragging')).toBe(false)
    expect(seat.style.getPropertyValue('--orca-composer-drag-width')).toBe('')
    document.dispatchEvent(pointer('pointermove', 695))
    expect(seat.hasAttribute('data-orca-composer-collapse-dragging')).toBe(false)
    expect(seat.style.getPropertyValue('--orca-composer-drag-width')).toBe('')
    document.dispatchEvent(pointer('pointermove', 620, 0))
    expect(seat.hasAttribute('data-orca-composer-collapse-dragging')).toBe(false)
    document.dispatchEvent(pointer('pointerup', 695))
    expect(seat.hasAttribute('data-orca-composer-collapse-rebounding')).toBe(false)

    right.dispatchEvent(pointer('pointerdown', 700))
    document.dispatchEvent(pointer('pointermove', 620))
    expect(Number.parseFloat(seat.style.getPropertyValue('--orca-composer-drag-width'))).toBeLessThan(600)
    expect(seat.hasAttribute('data-orca-composer-collapse-dragging')).toBe(true)
    expect(seat.getAttribute('data-orca-composer-collapse-stage')).toBeNull()
    document.dispatchEvent(pointer('pointerup', 620))

    expect(seat.hasAttribute('data-orca-composer-manual-hidden')).toBe(false)
    expect(seat.hasAttribute('data-orca-composer-collapse-rebounding')).toBe(true)
    expect(document.querySelector('[data-orca-composer-restore]')).toBeNull()

    right.dispatchEvent(pointer('pointerdown', 700))
    document.dispatchEvent(pointer('pointermove', 620))
    expect(seat.hasAttribute('data-orca-composer-collapse-dragging')).toBe(true)
    document.dispatchEvent(pointer('pointermove', 615, 0))
    expect(seat.hasAttribute('data-orca-composer-collapse-dragging')).toBe(false)
    expect(seat.hasAttribute('data-orca-composer-collapse-rebounding')).toBe(true)

    right.dispatchEvent(pointer('pointerdown', 700))
    document.dispatchEvent(pointer('pointermove', 620))
    expect(seat.hasAttribute('data-orca-composer-collapse-dragging')).toBe(true)
    window.dispatchEvent(new Event('blur'))
    expect(seat.hasAttribute('data-orca-composer-collapse-dragging')).toBe(false)
    expect(seat.hasAttribute('data-orca-composer-collapse-rebounding')).toBe(true)

    right.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }))
    expect(seat.hasAttribute('data-orca-composer-manual-hidden')).toBe(true)
    expect(document.querySelector('[data-orca-composer-restore]')).not.toBeNull()
  })

  it('does not mount composer collapse handles on the new-session hero', async () => {
    document.body.innerHTML = `
      <div data-phase="hero">
        <div data-conversation-scroll>
          <div data-composer-seat><div data-composer-card><div data-composer-input contenteditable="true"></div></div></div>
        </div>
      </div>
    `

    fiber = await mount()
    expect(document.querySelector('[data-orca-composer-handle]')).toBeNull()
    expect(document.querySelector('[data-orca-composer-restore]')).toBeNull()
  })

  it('shows the composer only for hero and chat surfaces', async () => {
    document.body.innerHTML = `
      <div data-phase="active">
        <div data-conversation-scroll>
          <div data-slot="conversation.session">
            <div data-slot="conversation.view"><div data-chat-flow></div></div>
          </div>
          <div data-composer-seat><div data-composer-card><div data-composer-input contenteditable="true"></div></div></div>
        </div>
      </div>
    `
    const view = document.querySelector<HTMLElement>("[data-slot='conversation.view']")!
    const seat = document.querySelector<HTMLElement>('[data-composer-seat]')!

    fiber = await mount()
    expect(seat.hasAttribute('data-orca-composer-outside-chat')).toBe(false)

    view.innerHTML = '<div data-plugin-surface="timeline"></div>'
    await new Promise(resolve => { setTimeout(resolve, 0) })
    expect(seat.hasAttribute('data-orca-composer-outside-chat')).toBe(true)

    view.innerHTML = '<div data-plugin-surface="future-view"></div>'
    await new Promise(resolve => { setTimeout(resolve, 0) })
    expect(seat.hasAttribute('data-orca-composer-outside-chat')).toBe(true)

    view.innerHTML = '<div data-chat-flow></div>'
    await new Promise(resolve => { setTimeout(resolve, 0) })
    expect(seat.hasAttribute('data-orca-composer-outside-chat')).toBe(false)
    expect(seat.hasAttribute('data-orca-composer-entering')).toBe(true)

    await fiber.dispose()
    fiber = undefined
    expect(seat.hasAttribute('data-orca-composer-outside-chat')).toBe(false)
  })
})
