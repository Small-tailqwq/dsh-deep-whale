// @vitest-environment jsdom
/**
 * Orca Link skin apply spec — the template contract: the body
 * attribute the stylesheet is scoped on is set on apply and retracted on
 * dispose, and every injected chrome element (marked data-skin-chrome) is
 * removed. Extend with assertions specific to your surface.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Context, type Fiber } from '@deepseek-ai/cordis'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { apply } from '../src/client/index.ts'
import { installOrcaPageIcons } from '../src/client/page-icons.ts'

// Complete SVGs rendered from the pinned official source; no host checkout is needed at test time.
const HOST_ICONS: Array<{ component: string; name: string; svg: string }> = JSON.parse(
  readFileSync(resolve(process.cwd(), 'tests/fixtures/dsh-0.1.7-alpha.1-icons.json'), 'utf8'),
).icons
function hostIcon(component: string, attributes = ''): string {
  const fixture = HOST_ICONS.find(icon => icon.component === component)
  if (!fixture) throw new Error(`Missing host fixture: ${component}`)
  return fixture.svg.replace('<svg ', `<svg ${attributes} `)
}

const CSS = readFileSync(resolve(process.cwd(), 'src/client/orca-link.module.css'), 'utf8')
const TURN_MARK_SELECTOR = "[data-phase='active'] :has(+ * > * > [data-chat-flow]) > nav button[type='button'][aria-label]"

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

// Transcript-only batches reach the link signal on one coalesced trailing
// pass (link-status.ts), so waits cover that window.
const settleLinkStatus = (): Promise<void> => new Promise(resolve => { setTimeout(resolve, 140) })

describe('Orca Link skin apply', () => {
  it('keeps the upstream RC1 wide-table gutter stable across interaction states', () => {
    const rule = CSS.match(
      /\[data-chat-flow-kind='assistant-step'\] :global\(\.md-table-wide\)\s*\{([^}]*)\}/s,
    )?.[1] ?? ''

    expect(rule).toContain('padding-bottom: var(--dsh-scrollbar-width, 8px)')
    expect(rule).not.toContain('overflow-x:')
  })

  it('targets the alpha2 turn rail outside the transcript in every locale and follow state', async () => {
    document.body.innerHTML = `
      <div data-phase="active">
        <div>
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
    `

    fiber = await mount()
    expect(document.querySelectorAll(TURN_MARK_SELECTOR)).toHaveLength(3)
    document.querySelector('[data-chat-following-tail]')!.removeAttribute('data-chat-following-tail')
    expect(document.querySelectorAll(TURN_MARK_SELECTOR)).toHaveLength(3)
    expect(CSS).toContain(TURN_MARK_SELECTOR)
    expect(CSS).not.toContain("nav[aria-label='轮次导航']")
    expect(CSS).not.toContain("[aria-label^='跳转到第']")
  })

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
    expect(document.body.style.getPropertyValue('--orca-link-light-hero-art')).toContain('/skin-assets/orca-link/')
    expect(document.body.style.getPropertyValue('--orca-link-light-active-art')).toContain('/skin-assets/orca-link/')
    expect(document.body.style.getPropertyValue('--orca-link-dark-hero-art')).toContain('/skin-assets/orca-link/')
    expect(document.body.style.getPropertyValue('--orca-link-dark-active-art')).toContain('/skin-assets/orca-link/')
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

  it('replaces the host tab icon and Web-app manifest with the skin web icon', async () => {
    // The host declares both links statically in its boot HTML, and a browser
    // honours the first usable declaration: an appended skin link would never
    // be reached, so the icon and the manifest are replaced instead.
    document.head.innerHTML = `
      <meta name="fixture-before" />
      <link rel="manifest" href="./manifest.webmanifest" />
      <link rel="icon" type="image/svg+xml" href="./favicon.svg" />
      <meta name="fixture-after" />
    `
    const shape = (): string[] => Array.from(document.head.children)
      .filter(node => !(node instanceof HTMLTitleElement))
      .map(node => (
        node instanceof HTMLLinkElement
          ? `${node.tagName}[${node.getAttribute('rel')}]`
          : `${node.tagName}[${node.getAttribute('name')}]`
      ))
    fiber = await mount()

    expect(shape()).toEqual(['META[fixture-before]', 'META[fixture-after]', 'LINK[icon]', 'LINK[manifest]'])
    const favicon = document.head.querySelector<HTMLLinkElement>('link[data-skin-chrome="favicon"]')!
    expect(favicon.getAttribute('type')).toBe('image/svg+xml')
    const iconHref = favicon.getAttribute('href') ?? ''
    expect(iconHref.startsWith('data:image/svg+xml;utf8,')).toBe(true)
    expect(decodeURIComponent(iconHref)).toContain('<rect x="43" y="26" width="4" height="4"')

    const manifestLink = document.head.querySelector<HTMLLinkElement>('link[data-skin-chrome="manifest"]')!
    expect(manifestLink.getAttribute('type')).toBe('application/manifest+json')
    const manifestHref = manifestLink.getAttribute('href') ?? ''
    const manifestPrefix = 'data:application/manifest+json,'
    expect(manifestHref.startsWith(manifestPrefix)).toBe(true)
    const manifest = JSON.parse(decodeURIComponent(manifestHref.slice(manifestPrefix.length)))
    // Relative URLs cannot resolve against a data: manifest, so identity and
    // scope are absolute while the host's name and display mode are kept.
    const root = new URL('/', document.location.href).href
    expect(manifest).toEqual({
      id: root,
      name: 'DeepSeek Harness',
      short_name: 'DSH',
      start_url: root,
      scope: root,
      display: 'fullscreen',
      // Bitmap icons only: Windows rasterises the installed app, taskbar and
      // start-menu icons from them, and a `sizes: "any"` SVG entry lets the
      // update path pick an icon it cannot rasterise.
      icons: [
        { src: expect.stringMatching(/^http:\/\/localhost:3000\/skin-assets\/orca-link\/[a-f0-9]{64}\.png$/), sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: expect.stringMatching(/^http:\/\/localhost:3000\/skin-assets\/orca-link\/[a-f0-9]{64}\.png$/), sizes: '512x512', type: 'image/png', purpose: 'any' },
      ],
    })

    await fiber.dispose()
    expect(document.head.querySelectorAll('link[data-skin-chrome]')).toHaveLength(0)
    expect(shape()).toEqual(['META[fixture-before]', 'LINK[manifest]', 'LINK[icon]', 'META[fixture-after]'])
    document.head.innerHTML = ''
  })

  it('keeps the skin page icons until the last overlapping activation is disposed', async () => {
    document.head.innerHTML = '<link rel="icon" type="image/svg+xml" href="./favicon.svg" />'
    const first = await mount()
    const second = await mount()

    // Leaving the first installation in place: the second activation must not
    // capture the skin's own links as if they were the host's.
    await first.dispose()
    expect(document.head.querySelector('link[data-skin-chrome="favicon"]')).not.toBeNull()
    expect(document.head.querySelector('link[href="./favicon.svg"]')).toBeNull()

    await second.dispose()
    expect(document.head.querySelectorAll('link[data-skin-chrome]')).toHaveLength(0)
    expect(document.head.querySelector('link[href="./favicon.svg"]')).not.toBeNull()
    document.head.innerHTML = ''
    fiber = undefined
  })

  it('restores the host page icons when the replacement manifest cannot be built', async () => {
    document.head.innerHTML = `
      <link rel="manifest" href="./manifest.webmanifest" />
      <link rel="icon" type="image/svg+xml" href="./favicon.svg" />
    `
    vi.stubGlobal('URL', class {
      constructor() {
        throw new Error('fixture URL failure')
      }
    })

    expect(() => installOrcaPageIcons()).toThrow('fixture URL failure')
    expect(document.head.querySelectorAll('*')).toHaveLength(2)
    expect(document.head.querySelector('link[href="./favicon.svg"]')).not.toBeNull()
    expect(document.head.querySelector('link[href="./manifest.webmanifest"]')).not.toBeNull()
    expect(document.head.querySelectorAll('link[data-skin-chrome]')).toHaveLength(0)

    vi.unstubAllGlobals()
    fiber = await mount()
    expect(document.head.querySelector('link[data-skin-chrome="favicon"]')).not.toBeNull()
    await fiber.dispose()
    expect(document.head.querySelector('link[href="./favicon.svg"]')).not.toBeNull()
    document.head.innerHTML = ''
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
    expect(replacement?.parentElement === pane).toBe(true)
    const chip = document.querySelector('[data-orca-link-signal]')
    expect(chip?.textContent).toContain('LINK ACTIVE')
    expect(chip?.parentElement).toBe(document.querySelector("[data-slot='sidebar'] > :first-child > :first-child"))
    const character = document.querySelector<HTMLElement>('[data-orca-link-character]')
    expect(character?.parentElement).toBe(pane)
    expect(character?.dataset.orcaLinkStatus).toBe('standby')
    expect(character?.querySelector<HTMLElement>('[data-orca-link-character-sprite]')?.style.getPropertyValue('--orca-link-status-atlas'))
      .toContain('/skin-assets/orca-link/')
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

  it('seats the signal chip in the logo row behind the macOS top strip', async () => {
    document.body.innerHTML = `
      <div data-slot="sidebar">
        <div class="root">
          <div class="x_topStrip"><button type="button" aria-label="Collapse sidebar"></button></div>
          <div class="x_logoRow"><span class="x_brand"></span></div>
        </div>
      </div>
    `
    const pane = document.querySelector("[data-slot='sidebar'] > :first-child") as HTMLElement
    pane.getBoundingClientRect = () => ({ width: 336 } as DOMRect)
    fiber = await mount()
    const chips = document.querySelectorAll('[data-orca-link-signal]')
    expect(chips).toHaveLength(1)
    expect(chips[0]!.parentElement).toBe(document.querySelector('.x_logoRow'))
    // The window-button strip keeps only its own toggle.
    expect(document.querySelector('.x_topStrip [data-orca-link-signal]')).toBeNull()
    expect(document.querySelector('[data-orca-link-brand]')).toBeNull()
    await fiber.dispose()
    expect(document.querySelector('[data-orca-link-signal]')).toBeNull()
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
        <div class="fixture_conversationBody">
          <div data-conversation-scroll>
            <div data-composer-seat><div data-composer-input contenteditable="true" data-phase="plain"></div></div>
          </div>
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
    await settleLinkStatus()
    expect(signal.dataset.orcaLinkStatus).toBe('complete')
    expect(document.body.dataset.orcaLinkStatus).toBe('complete')
    expect(label.textContent).toBe('TASK COMPLETE')

    scroll.querySelector('[data-chat-flow]')?.append(Object.assign(document.createElement('div'), { innerHTML: '<span data-state="running"></span>' }))
    await settleLinkStatus()
    expect(label.textContent).toBe('TASK RUNNING')

    scroll.querySelector("[data-state='running']")?.remove()
    scroll.append(Object.assign(document.createElement('div'), { innerHTML: '<div data-approval-key="approval"></div>' }))
    await settleLinkStatus()
    expect(label.textContent).toBe('AUTH REQUEST')

    scroll.querySelector('[data-approval-key]')?.parentElement?.remove()
    scroll.append(Object.assign(document.createElement('div'), { innerHTML: '<div data-question-key="question"></div>' }))
    await settleLinkStatus()
    expect(label.textContent).toBe('INPUT REQUIRED')

    scroll.querySelector('[data-question-key]')?.parentElement?.remove()
    scroll.append(Object.assign(document.createElement('div'), { innerHTML: '<div data-plan-review-key="review"></div>' }))
    await settleLinkStatus()
    expect(label.textContent).toBe('PLAN REVIEW')

    scroll.querySelector('[data-plan-review-key]')?.parentElement?.remove()
    scroll.querySelector('[data-chat-flow]')!.innerHTML = `
      <div data-step-process data-chat-group-key="process">
        <div><button data-process-activity="tools" aria-expanded="false"></button></div>
        <div data-step-process-body hidden="until-found"><div data-step-process-content data-chat-flow>
          <div data-chat-flow-kind="assistant-step"><div data-state="error"></div></div>
        </div></div>
      </div>
      <div data-chat-flow-kind="turn-tail"></div>
    `
    await settleLinkStatus()
    expect(label.textContent).toBe('LINK FAULT')

    scroll.querySelector('[data-chat-flow]')!.innerHTML = ''
    await settleLinkStatus()
    expect(label.textContent).toBe('SESSION READY')

    scroll.querySelector('[data-chat-flow]')!.innerHTML = '<div data-chat-flow-kind="user"></div>'
    await settleLinkStatus()
    expect(label.textContent).toBe('SESSION READY')

    const composerInput = scroll.querySelector<HTMLElement>('[data-composer-input]')!
    composerInput.dataset.phase = 'submitting'
    await settleLinkStatus()
    expect(label.textContent).toBe('LINK SYNC')
    composerInput.dataset.phase = 'plain'
    composerInput.setAttribute('aria-disabled', 'true')
    await settleLinkStatus()
    expect(label.textContent).toBe('LINK OFFLINE')

    root.dataset.phase = 'hero'
    await settleLinkStatus()
    expect(label.textContent).toBe('LINK ACTIVE')
  })

  it('pins the skin title and restores the original on dispose', async () => {
    document.title = 'original'
    fiber = await mount()
    expect(document.title).not.toBe('original')
    await fiber.dispose()
    expect(document.title).toBe('original')
  })

  it('redraws all target host glyphs without changing their owned SVG children', async () => {
    document.body.innerHTML = HOST_ICONS.map((icon, index) => `<span data-target-icon="${index}">${icon.svg}</span>`).join('')
    const svgs = Array.from(document.querySelectorAll<SVGElement>('[data-target-icon] > svg'))
    const originals = svgs.map(svg => svg.innerHTML)
    fiber = await mount()
    for (const [index, svg] of svgs.entries()) {
      const fixture = HOST_ICONS[index]!
      expect(svg.getAttribute('data-orca-link-icon'), fixture.component).toBe(fixture.name)
      const art = svg.querySelector('g[data-orca-link-icon-art]')!
      expect(art?.querySelectorAll('path, rect').length, fixture.component).toBeGreaterThan(0)
      expect(svg.querySelectorAll(':scope > g[data-orca-link-icon-art]')).toHaveLength(1)
    }
    await fiber.dispose()
    svgs.forEach((svg, index) => { expect(svg.innerHTML, HOST_ICONS[index]!.component).toBe(originals[index]) })
    expect(document.querySelector('[data-orca-link-icon]')).toBeNull()
  })

  it('updates a retained pin after an attribute change and releases an unrecognized replacement', async () => {
    document.body.innerHTML = hostIcon('IconPinOutlineRegular')
    const svg = document.querySelector<SVGElement>('svg')!
    const hostPaths = Array.from(svg.querySelectorAll('path'))
    fiber = await mount()
    expect(svg.getAttribute('data-orca-link-icon')).toBe('pin')
    hostPaths[0]!.setAttribute('fill', 'currentColor')
    await new Promise(resolve => { setTimeout(resolve, 0) })
    expect(svg.getAttribute('data-orca-link-icon')).toBe('pin-filled')
    hostPaths.forEach(path => { path.setAttribute('d', 'M0 0h1') })
    await new Promise(resolve => { setTimeout(resolve, 0) })
    expect(svg.hasAttribute('data-orca-link-icon')).toBe(false)
    expect(svg.querySelector('[data-orca-link-icon-art]')).toBeNull()
    expect(Array.from(svg.querySelectorAll('path'))).toEqual(hostPaths)
  })

  it('redraws matched host icons in place and retracts them on dispose', async () => {
    document.body.innerHTML = `
      <button type="button" aria-label="发送消息">${hostIcon('ComposerSend')}</button>
      <button type="button" aria-label="关闭">${hostIcon('IconCloseFillRegular')}</button>
      <button type="button" aria-label="添加文件">${hostIcon('IconPaperclipOutlineRegular')}</button>
      <svg viewBox="0 0 16 16"><path d="M0 0h16v16H0z"></path></svg>
    `
    const send = document.querySelector<SVGElement>('[aria-label="发送消息"] svg')!
    const close = document.querySelector<SVGElement>('[aria-label="关闭"] svg')!
    const paperclip = document.querySelector<SVGElement>('[aria-label="添加文件"] svg')!
    const unknown = document.querySelectorAll('svg')[3]!
    fiber = await mount()
    expect(send.hasAttribute('data-orca-link-icon')).toBe(true)
    expect(send.getAttribute('data-orca-link-icon')).toBe('send')
    const sendArt = send.querySelector('g[data-orca-link-icon-art]')
    expect(sendArt).not.toBeNull()
    expect(sendArt?.getAttribute('stroke-linejoin')).toBe('miter')
    expect(sendArt?.querySelectorAll('path').length).toBeGreaterThan(0)
    expect(close.getAttribute('data-orca-link-icon')).toBe('close')
    // The current close glyph uses the same 16-unit art grid.
    expect(close.querySelector('g[data-orca-link-icon-art]')?.getAttribute('transform')).toBeNull()
    // Keep the two-loop clip tilted for separation at its small display size.
    expect(paperclip.getAttribute('data-orca-link-icon')).toBe('paperclip')
    const clipPath = paperclip.querySelector('g[data-orca-link-icon-art] path')!
    expect(clipPath.getAttribute('d')).toContain('a2.75 2.75')
    expect(clipPath.getAttribute('transform')).toBe('rotate(-45 8 8)')
    expect(unknown.hasAttribute('data-orca-link-icon')).toBe(false)
    await fiber.dispose()
    expect(document.querySelector('[data-orca-link-icon]')).toBeNull()
    expect(document.querySelector('[data-orca-link-icon-art]')).toBeNull()
    expect(send.querySelector('path')?.getAttribute('d')).toContain('M8.3125 0.980183')
  })

  it('redraws the composer command button as a prompt while other plus icons stay plus', async () => {
    // The command trigger shares its host glyph with other plus controls.
    document.body.innerHTML = `
      <div data-composer-seat>
        <button type="button" aria-label="指令" aria-haspopup="listbox">${hostIcon('IconPlusOutlineMedium')}</button>
      </div>
      <button type="button" aria-label="新建会话">${hostIcon('IconPlusOutlineMedium')}</button>
    `
    fiber = await mount()
    const command = document.querySelector<SVGElement>('[data-composer-seat] svg')!
    const plus = document.querySelector<SVGElement>('[aria-label="新建会话"] svg')!
    expect(command.getAttribute('data-orca-link-icon')).toBe('command')
    expect(command.querySelector('g[data-orca-link-icon-art] path')?.getAttribute('d')).toContain('M4.5 4.5 8 8')
    expect(plus.getAttribute('data-orca-link-icon')).toBe('plus')
  })

  it('redraws the generic tool row as a diagonal wrench and leaves other sparkles alone', async () => {
    // Every tool row carries `data-tool` (dsh-client-ui-tool's ToolRow) and the
    // unmapped tools take the sparkle glyph as their icon, while the trajectory
    // view uses that same glyph for assistant messages — and the host itself
    // draws a wrench for tool kinds.
    document.body.innerHTML = `
      <div data-variant="code" data-tool="unknown-tool" data-state="done">
        ${hostIcon('IconSparkleRegular')}
      </div>
      <div data-chat-flow-kind="assistant-step">
        ${hostIcon('IconSparkleRegular')}
      </div>
    `
    fiber = await mount()
    const svgs = Array.from(document.querySelectorAll<SVGElement>('svg'))
    expect(svgs.map(svg => svg.getAttribute('data-orca-link-icon'))).toEqual(['wrench', 'sparkle'])

    const art = svgs[0]!.querySelector('g[data-orca-link-icon-art]')!
    expect(art.querySelector('g')?.getAttribute('transform')).toBe('rotate(-45 8 8)')
    expect(Array.from(art.querySelectorAll('path')).map(path => path.getAttribute('d'))).toEqual([
      'M8 4.75v6.5',
      'M6 2.5v2.25h4V2.5',
      'M6 13.5v-2.25h4V13.5',
    ])

    await fiber.dispose()
    expect(document.querySelectorAll('[data-orca-link-icon]').length).toBe(0)
  })

  it('redraws the target globe', async () => {
    document.body.innerHTML = `
      ${hostIcon('IconGlobeOutlineRegular')}
    `
    fiber = await mount()
    const globe = document.querySelector('svg')!
    expect(globe.getAttribute('data-orca-link-icon')).toBe('globe')
    expect(globe.querySelector('g[data-orca-link-icon-art]')).not.toBeNull()
  })

  it('distinguishes all permission and workspace folder icons', async () => {
    document.body.innerHTML = `
      ${hostIcon('PermissionIconReadOnlyRegular', 'data-test="read"')}
      ${hostIcon('PermissionIconWorkspaceWriteRegular', 'data-test="write"')}
      ${hostIcon('PermissionIconFullAccessRegular', 'data-test="full"')}
      ${hostIcon('IconFolderOpenRegular', 'data-test="open"')}
      ${hostIcon('IconFolderCloseRegular', 'data-test="closed"')}
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
      <button type="button" aria-label="发送">${hostIcon('IconSendOutlineRegular')}</button>
      <button type="button" aria-label="编辑">${hostIcon('IconEditOutlineRegular')}</button>
      <button type="button" aria-label="删除">${hostIcon('IconTrashOutlineRegular')}</button>
      ${hostIcon('IconChecklistOutlineRegular')}
      ${hostIcon('IconQuestionOutlineRegular')}
      ${hostIcon('IconGoalOutlineRegular')}
      ${hostIcon('IconFolderCloseRegular')}
      ${hostIcon('IconChevronRightOutlineRegular')}
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

  it('redraws the thought row as a tailed balloon and the context-injection row as a syringe', async () => {
    document.body.innerHTML = `
      ${hostIcon('IconThinkOutlineRegular')}
      ${hostIcon('IconContextInjectionOutlineRegular')}
      ${hostIcon('IconThinkOutlineMedium')}
    `
    fiber = await mount()
    const svgs = Array.from(document.querySelectorAll<SVGElement>('svg'))
    expect(svgs.map(svg => svg.getAttribute('data-orca-link-icon')))
      .toEqual(['think', 'context-injection', 'think'])

    const think = svgs[0]!
    const thinkArt = think.querySelector('g[data-orca-link-icon-art]')!
    expect(Array.from(thinkArt.querySelectorAll('path')).map(path => path.getAttribute('d'))).toEqual([
      'M2.25 2.75h11.5v8.25H6.75L4 13.75V11H2.25z',
      'M4 6h2v2H4zM7 6h2v2H7zM10 6h2v2h-2z',
    ])
    // The host drawing stays in place; the stylesheet hides it while the skin
    // is active, so the redraw must not replace the host node.
    expect(think.querySelector(':scope > path')?.getAttribute('d')).toBe(new DOMParser().parseFromString(hostIcon('IconThinkOutlineRegular'), 'image/svg+xml').querySelector('path')?.getAttribute('d'))

    const injection = svgs[1]!
    const injectionArt = injection.querySelector('g[data-orca-link-icon-art]')!
    expect(Array.from(injectionArt.querySelectorAll('path')).map(path => path.getAttribute('d'))).toEqual([
      'M5.25 2.5h5.5',
      'M8 2.5v2.25',
      'M5 4.75h6v7.5H5z',
      'M6.25 10.5h3.5v1.75h-3.5z',
      'M8 12.25v2.25',
    ])

    await fiber.dispose()
    expect(document.querySelectorAll('[data-orca-link-icon]').length).toBe(0)
  })

  it('redraws the token-usage cylinder and the session-stats dial as rectilinear art', async () => {
    document.body.innerHTML = `
      ${hostIcon('IconDatabaseOutlineRegular')}
      ${hostIcon('IconGaugeOutlineRegular')}
    `
    fiber = await mount()
    const svgs = Array.from(document.querySelectorAll<SVGElement>('svg'))
    expect(svgs.map(svg => svg.getAttribute('data-orca-link-icon'))).toEqual(['database', 'gauge'])

    const databaseArt = svgs[0]!.querySelector('g[data-orca-link-icon-art]')!
    expect(Array.from(databaseArt.querySelectorAll('path')).map(path => path.getAttribute('d'))).toEqual([
      'M3.5 2h9v12h-9z',
      'M3.5 6h9M3.5 10h9',
    ])
    // The host's elliptical head must not survive inside the redraw.
    expect(databaseArt.querySelector('ellipse')).toBeNull()

    const gaugeArt = svgs[1]!.querySelector('g[data-orca-link-icon-art]')!
    expect(Array.from(gaugeArt.querySelectorAll('path')).map(path => path.getAttribute('d'))).toEqual([
      'M2.5 12.25V2.75h11v9.5',
      'M8 9 11.25 5.75',
      'M7 8h2v2H7z',
    ])
    expect(gaugeArt.querySelector('circle')).toBeNull()

    await fiber.dispose()
    expect(document.querySelectorAll('[data-orca-link-icon]').length).toBe(0)
  })

  it('redraws the timestamp clock and keeps every theme icon drawn', async () => {
    document.body.innerHTML = `
      ${hostIcon('IconClockOutlineRegular')}
      ${hostIcon('IconLightOutlineRegular')}
      ${hostIcon('IconDarkOutlineRegular')}
      ${hostIcon('IconFollowsystemOutlineRegular')}
    `
    fiber = await mount()
    const svgs = Array.from(document.querySelectorAll<SVGElement>('svg'))
    expect(svgs.map(svg => svg.getAttribute('data-orca-link-icon')))
      .toEqual(['clock', 'sun', 'moon', 'monitor'])
    for (const svg of svgs) {
      // A key without art hides the host glyph and draws nothing in its place.
      const art = svg.querySelector('g[data-orca-link-icon-art]')
      expect(art).not.toBeNull()
      expect(art?.querySelectorAll('path').length).toBeGreaterThan(0)
    }
    // Register contract for the theme pair: the light glyph fills nothing, the
    // dark glyph is a filled block, so ink coverage itself carries the reading
    // and the two never drift back into two look-alike outlines.
    const lightArt = svgs[1]!.querySelector('g[data-orca-link-icon-art]')!
    expect(lightArt.querySelectorAll('path[fill]')).toHaveLength(0)
    // One closed outline: the lobes belong to the same path, so the glyph has no
    // inner edges at all.
    expect(Array.from(lightArt.querySelectorAll('path')).map(path => path.getAttribute('d'))).toEqual([
      'M6.5 1.5h3v2h3v3h2v3h-2v3h-3v2h-3v-2h-3v-3h-2v-3h2v-3h3z',
    ])
    const darkArt = svgs[2]!.querySelector('g[data-orca-link-icon-art]')!
    expect(darkArt.querySelector('path[fill="currentColor"]')).not.toBeNull()
    expect(darkArt.querySelector('path')?.getAttribute('fill-rule')).toBe('evenodd')
    expect(Array.from(svgs[0]!.querySelectorAll('g[data-orca-link-icon-art] path')).map(path => path.getAttribute('d')))
      .toEqual(['M2.25 2.25h11.5v11.5H2.25z', 'M8 8V4.5M8 8h3.5'])

    await fiber.dispose()
    expect(document.querySelectorAll('[data-orca-link-icon]').length).toBe(0)
  })

  it('re-matches a retained composer svg when send changes to stop', async () => {
    document.body.innerHTML = `
      <button type="button" aria-label="发送消息">
        ${hostIcon('ComposerSend')}
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
      ${hostIcon('ComposerSend')}
    `
    const existing = document.querySelector<SVGElement>('svg')!
    fiber = await mount()
    await new Promise(resolve => { setTimeout(resolve, 0) })
    const clone = vi.spyOn(existing, 'cloneNode')
    clone.mockClear()

    const added = document.createElement('div')
    added.innerHTML = `
      ${hostIcon('IconEditOutlineRegular')}
    `
    document.body.append(added)
    await new Promise(resolve => { setTimeout(resolve, 0) })

    expect(clone).not.toHaveBeenCalled()
    expect(added.querySelector('svg')?.getAttribute('data-orca-link-icon')).toBe('edit')
  })

  it('fits the target large check glyph with a uniform scale', async () => {
    document.body.innerHTML = `
      ${hostIcon('IconCheckCircleFillRegular')}
    `
    fiber = await mount()
    const art = document.querySelector('g[data-orca-link-icon-art]')!
    expect(art.getAttribute('transform')).toBe('translate(0 0) scale(2.25)')
    await fiber.dispose()
  })

  it('mirrors the context-usage ring as a bottom-up pixel gauge', async () => {
    // Neutral class names: the ring's real classes are CSS-module hashes that
    // move with the host build, so the matcher must key off the drawing.
    document.body.innerHTML = `
      <svg viewBox="0 0 14 14" aria-label="上下文已用 50%">
        <circle class="host_track" cx="7" cy="7" r="5.5"></circle>
        <circle class="host_fill" cx="7" cy="7" r="5.5" stroke-dasharray="17.28 34.56" transform="rotate(-90 7 7)"></circle>
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
    const ring = gauge.querySelector('circle[stroke-dasharray]')!
    // 15%: five solid cells and the boundary cell fading in at 0.4.
    ring.setAttribute('stroke-dasharray', '5.184 34.56')
    await new Promise(resolve => { setTimeout(resolve, 0) })
    expect(cells[4]?.getAttribute('opacity')).toBe('1')
    expect(cells[5]?.getAttribute('opacity')).toBe('0.4')
    expect(cells[6]?.getAttribute('opacity')).toBe('0.12')
    // 100%: the full field is lit.
    ring.setAttribute('stroke-dasharray', '34.56 34.56')
    await new Promise(resolve => { setTimeout(resolve, 0) })
    expect(cells[35]?.getAttribute('opacity')).toBe('1')
    await fiber.dispose()
    expect(gauge.querySelector('[data-orca-link-icon-art]')).toBeNull()
  })

  it('completes the rail search open when the row lands focused but collapsed', async () => {
    document.body.innerHTML = `
      <div data-slot="sidebar">
        <div>
          <div class="fixture_search">
            <button type="button" class="fixture_searchButton" aria-label="搜索会话" aria-expanded="false"></button>
            <input class="fixture_searchInput" type="text" placeholder="搜索会话…">
          </div>
        </div>
      </div>
    `
    const button = document.querySelector<HTMLButtonElement>('button.fixture_searchButton')!
    const input = document.querySelector<HTMLInputElement>('input.fixture_searchInput')!
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

  it('does not clobber a session title during teardown', async () => {
    fiber = await mount()
    document.title = 'active session · ORCA LINK'
    await fiber.dispose()
    fiber = undefined
    expect(document.title).toBe('active session · ORCA LINK')
  })

  it('plays the hero exit ghost only once the host leaves the hero phase', async () => {
    document.body.innerHTML = `
      <div data-phase="hero">
        <div class="fixture_conversationBody">
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
      </div>
    `
    const root = document.querySelector<HTMLElement>('[data-phase]')!
    const seat = document.querySelector<HTMLElement>('[data-composer-seat]')!
    const card = document.querySelector<HTMLElement>('[data-composer-card]')!
    const input = document.querySelector<HTMLElement>('[data-composer-input]')!
    card.getBoundingClientRect = () => ({ left: 100, top: 200, width: 600, height: 120 } as DOMRect)

    fiber = await mount()
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }))
    // The press only arms a snapshot of the card: nothing is hidden yet.
    expect(seat.style.cssText).toBe('')
    expect(seat.hasAttribute('data-orca-composer-entering')).toBe(false)
    expect(document.querySelectorAll('[data-orca-composer-ghost]')).toHaveLength(0)

    root.dataset.phase = 'active'
    await new Promise(resolve => { setTimeout(resolve, 0) })
    expect(document.querySelectorAll('[data-orca-composer-ghost]')).toHaveLength(1)
    expect(seat.hasAttribute('data-orca-composer-entering')).toBe(true)
    expect(Number.parseFloat(seat.style.getPropertyValue('--orca-composer-enter-distance'))).toBe(window.innerHeight - 200 + 32)
    input.dispatchEvent(new FocusEvent('focusin', { bubbles: true }))
    expect(seat.hasAttribute('data-orca-composer-entering')).toBe(true)

    await fiber.dispose()
    fiber = undefined
    expect(document.querySelector('[data-orca-composer-ghost]')).toBeNull()
    expect(seat.hasAttribute('data-orca-composer-entering')).toBe(false)
  })

  it('leaves the hero composer untouched when a candidate menu takes the Enter', async () => {
    // A candidate menu rendered into the composer card answers Enter with its
    // own pick, so the phase stays hero: the exit must never hide the seat on a
    // press the host did not treat as a submit.
    document.body.innerHTML = `
      <div data-phase="hero">
        <div class="fixture_conversationBody">
          <div data-conversation-scroll>
            <div data-chat-flow></div>
            <div data-composer-seat>
              <div data-composer-card>
                <div data-trigger-menu>
                  <div role="listbox" aria-activedescendant="dsh-slash-option-command-0">
                    <button id="dsh-slash-option-command-0" type="button" role="option" aria-selected="true">/plan</button>
                  </div>
                </div>
                <div data-composer-input contenteditable="true">/pl</div>
                <button type="button">send</button>
              </div>
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
    // The press arms a snapshot, but the host's menu consumed the key: nothing
    // may be mounted or hidden in that same turn.
    expect(document.querySelectorAll('[data-orca-composer-ghost]')).toHaveLength(0)
    expect(seat.style.cssText).toBe('')
    // Past the snapshot window the unconsumed press must have left no trace.
    await new Promise(resolve => { setTimeout(resolve, 850) })
    expect(document.querySelectorAll('[data-orca-composer-ghost]')).toHaveLength(0)
    expect(seat.hasAttribute('data-orca-composer-hidden')).toBe(false)
    expect(seat.hasAttribute('data-orca-composer-entering')).toBe(false)
    expect(seat.hasAttribute('data-orca-composer-exiting')).toBe(false)
    expect(seat.style.cssText).toBe('')
    expect(CSS).not.toContain('data-orca-composer-exiting')

    // An expired snapshot stays unclaimable: a later phase change must not
    // replay a press the host already spent.
    root.dataset.phase = 'active'
    await new Promise(resolve => { setTimeout(resolve, 0) })
    expect(document.querySelectorAll('[data-orca-composer-ghost]')).toHaveLength(0)
    expect(seat.hasAttribute('data-orca-composer-entering')).toBe(true)

    await fiber.dispose()
  })

  it('arms the same snapshot when the hero submit button is clicked', async () => {
    document.body.innerHTML = `
      <div data-phase="hero">
        <div class="fixture_conversationBody">
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
      </div>
    `
    const root = document.querySelector<HTMLElement>('[data-phase]')!
    const seat = document.querySelector<HTMLElement>('[data-composer-seat]')!
    const card = document.querySelector<HTMLElement>('[data-composer-card]')!
    const button = card.querySelector<HTMLButtonElement>('button')!
    card.getBoundingClientRect = () => ({ left: 100, top: 200, width: 600, height: 120 } as DOMRect)

    fiber = await mount()
    button.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
    expect(seat.style.cssText).toBe('')
    expect(document.querySelectorAll('[data-orca-composer-ghost]')).toHaveLength(0)

    root.dataset.phase = 'active'
    await new Promise(resolve => { setTimeout(resolve, 0) })
    expect(document.querySelectorAll('[data-orca-composer-ghost]')).toHaveLength(1)
    expect(seat.hasAttribute('data-orca-composer-entering')).toBe(true)

    await fiber.dispose()
  })

  it('plays the exit ghost as soon as the host leaves hero, settling included', async () => {
    document.body.innerHTML = `
      <div data-phase="hero">
        <div class="fixture_conversationBody">
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
      </div>
    `
    const root = document.querySelector<HTMLElement>('[data-phase]')!
    const seat = document.querySelector<HTMLElement>('[data-composer-seat]')!
    const card = document.querySelector<HTMLElement>('[data-composer-card]')!
    const input = document.querySelector<HTMLElement>('[data-composer-input]')!
    card.getBoundingClientRect = () => ({ left: 100, top: 200, width: 600, height: 120 } as DOMRect)

    fiber = await mount()
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }))

    // A submit may run through settling while the session is created: the ghost
    // belongs to leaving hero, not to reaching active.
    root.dataset.phase = 'settling'
    await new Promise(resolve => { setTimeout(resolve, 0) })
    expect(document.querySelectorAll('[data-orca-composer-ghost]')).toHaveLength(1)
    expect(seat.hasAttribute('data-orca-composer-entering')).toBe(false)

    root.dataset.phase = 'active'
    await new Promise(resolve => { setTimeout(resolve, 0) })
    expect(document.querySelectorAll('[data-orca-composer-ghost]')).toHaveLength(1)
    expect(seat.hasAttribute('data-orca-composer-entering')).toBe(true)

    await fiber.dispose()
  })

  it('still plays the exit ghost when the started session replaces the conversation root', async () => {
    document.body.innerHTML = `
      <div data-phase="hero">
        <div class="fixture_conversationBody">
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
      </div>
    `
    const oldRoot = document.querySelector<HTMLElement>('[data-phase]')!
    const seat = document.querySelector<HTMLElement>('[data-composer-seat]')!
    const card = document.querySelector<HTMLElement>('[data-composer-card]')!
    const input = document.querySelector<HTMLElement>('[data-composer-input]')!
    card.getBoundingClientRect = () => ({ left: 100, top: 200, width: 600, height: 120 } as DOMRect)

    fiber = await mount()
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }))

    // The started session swaps the conversation root while the adopted seat
    // node survives: the new root has no phase history to compare against.
    const newRoot = document.createElement('div')
    newRoot.dataset.phase = 'active'
    const scrollport = document.createElement('div')
    scrollport.setAttribute('data-conversation-scroll', '')
    const chatFlow = document.createElement('div')
    chatFlow.setAttribute('data-chat-flow', '')
    scrollport.append(chatFlow, seat)
    newRoot.append(scrollport)
    document.body.replaceChild(newRoot, oldRoot)

    await new Promise(resolve => { setTimeout(resolve, 0) })
    expect(document.querySelectorAll('[data-orca-composer-ghost]')).toHaveLength(1)
    expect(seat.hasAttribute('data-orca-composer-entering')).toBe(true)

    await fiber.dispose()
  })

  it('hides the active composer on upward scroll and restores it downward or at bottom', async () => {
    document.body.innerHTML = `
      <div data-phase="active">
        <div data-conversation-scroll>
          <div data-chat-flow></div>
          <div role="listbox"><div data-fixture-model-option>model option</div></div>
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
    const modelOption = document.querySelector<HTMLElement>('[data-fixture-model-option]')!
    modelOption.dispatchEvent(new WheelEvent('wheel', { bubbles: true, deltaY: -100 }))
    expect(seat.hasAttribute('data-orca-composer-hidden')).toBe(false)
    expect(scrollTopReads).toBe(0)

    scrollport.dispatchEvent(new WheelEvent('wheel', { bubbles: true, deltaY: -6 }))
    expect(seat.hasAttribute('data-orca-composer-hidden')).toBe(false)
    expect(scrollTopReads).toBe(1)
    scrollport.dispatchEvent(new WheelEvent('wheel', { bubbles: true, deltaY: -100 }))
    expect(seat.hasAttribute('data-orca-composer-hidden')).toBe(true)
    expect(seat.hasAttribute('data-orca-composer-motion')).toBe(true)
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

    // The promotion hint must outlive the transition and then release.
    await new Promise(resolve => { setTimeout(resolve, 400) })
    expect(seat.hasAttribute('data-orca-composer-motion')).toBe(false)
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
        <div class="fixture_conversationBody">
          <div data-conversation-scroll>
            <div data-chat-flow></div>
            <div data-composer-seat>
              <div data-composer-card><div data-composer-input contenteditable="true">保留这段草稿</div></div>
            </div>
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
    // Parked inside the band the card vacated, below the host's back-to-bottom
    // lane (16px above the composer) instead of 36px above the card.
    expect(restore.style.left).toBe('653px')
    expect(restore.style.top).toBe('412px')
    expect(restore.hasAttribute('title')).toBe(false)

    const toBottom = document.createElement('button')
    // Neutral class ending in the host's local name: the real class carries a
    // build-specific hash, so the fixture must not freeze one.
    toBottom.className = 'fixture_toBottom'
    toBottom.setAttribute('aria-label', '回到底部')
    // Host geometry: 34px, its right edge 16px inside the card (the card is
    // 32px wider than the chat column), its bottom 16px above the composer.
    // The chip was predicted onto the same centre line (667px).
    toBottom.getBoundingClientRect = () => ({ left: 650, top: 350, right: 684, bottom: 384, width: 34, height: 34 } as DOMRect)
    scrollport.append(toBottom)
    await new Promise(resolve => { setTimeout(resolve, 0) })
    // Its arrival does not move the chip: the anchor never followed it.
    expect(restore.style.left).toBe('653px')
    expect(restore.style.top).toBe('412px')

    // A host that drops the button into the chip's band still cannot stack
    // them: the chip steps below it (bottom + 8px clearance).
    toBottom.getBoundingClientRect = () => ({ left: 650, top: 396, right: 684, bottom: 430, width: 34, height: 34 } as DOMRect)
    window.dispatchEvent(new Event('resize'))
    expect(restore.style.left).toBe('653px')
    expect(restore.style.top).toBe('438px')
    toBottom.getBoundingClientRect = () => ({ left: 650, top: 350, right: 684, bottom: 384, width: 34, height: 34 } as DOMRect)
    window.dispatchEvent(new Event('resize'))
    expect(restore.style.top).toBe('412px')

    // Where the column padding wins (narrow stages) the button sits elsewhere;
    // the chip follows its measured centre line instead of the prediction.
    toBottom.getBoundingClientRect = () => ({ left: 640, top: 350, right: 674, bottom: 384, width: 34, height: 34 } as DOMRect)
    window.dispatchEvent(new Event('resize'))
    expect(restore.style.left).toBe('643px')
    expect(restore.style.top).toBe('412px')
    toBottom.getBoundingClientRect = () => ({ left: 650, top: 350, right: 684, bottom: 384, width: 34, height: 34 } as DOMRect)
    window.dispatchEvent(new Event('resize'))

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
    expect(seat.style.getPropertyValue('--orca-composer-scale')).toBe('')
    document.dispatchEvent(pointer('pointermove', 695))
    expect(seat.hasAttribute('data-orca-composer-collapse-dragging')).toBe(false)
    expect(seat.style.getPropertyValue('--orca-composer-scale')).toBe('')
    document.dispatchEvent(pointer('pointermove', 620, 0))
    expect(seat.hasAttribute('data-orca-composer-collapse-dragging')).toBe(false)
    document.dispatchEvent(pointer('pointerup', 695))
    expect(seat.hasAttribute('data-orca-composer-collapse-rebounding')).toBe(false)

    right.dispatchEvent(pointer('pointerdown', 700))
    document.dispatchEvent(pointer('pointermove', 620))
    expect(Number.parseFloat(seat.style.getPropertyValue('--orca-composer-scale'))).toBeLessThan(1)
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

    view.innerHTML = '<div data-fixture-plugin-surface="timeline"></div>'
    await new Promise(resolve => { setTimeout(resolve, 0) })
    expect(seat.hasAttribute('data-orca-composer-outside-chat')).toBe(true)

    view.innerHTML = '<div data-fixture-plugin-surface="future-view"></div>'
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
