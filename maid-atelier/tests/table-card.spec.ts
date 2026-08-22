// @vitest-environment jsdom
/**
 * Wide-table preview/expand lifecycle: the installer measures embedded tables,
 * injects only skin-owned controls, opens a cloned large view, and restores
 * every touched attribute on dispose.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { installMaidTableCards } from '../src/client/table-card.ts'

describe('installMaidTableCards', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    document.body.innerHTML = ''
  })

  it('starts inert under jsdom and releases cleanly', () => {
    const card = document.createElement('div')
    card.className = 'md-table-wide'
    document.body.append(card)
    const runtime = installMaidTableCards({} as never)
    runtime.dispose()
    // jsdom lacks ResizeObserver, so no inline geometry was written and the
    // disposer must not throw or leave the node modified.
    expect(card.style.width).toBe('')
    expect(card.style.marginLeft).toBe('')
  })

  it('marks overflowing tables as expandable and opens a cloned lightbox', () => {
    let resize: ResizeObserverCallback | undefined
    vi.stubGlobal('ResizeObserver', class {
      constructor(callback: ResizeObserverCallback) {
        resize = callback
      }

      observe(): void {}
      unobserve(): void {}
      disconnect(): void {}
    })

    const bubble = document.createElement('div')
    bubble.className = 'fixture_markdown'
    Object.defineProperty(bubble, 'clientWidth', { configurable: true, value: 680 })
    const card = document.createElement('div')
    card.className = 'md-table-wide'
    card.innerHTML = '<table><tbody><tr><td>wide</td></tr></tbody></table>'
    const table = card.querySelector('table')!
    Object.defineProperty(card, 'clientWidth', { configurable: true, value: 680 })
    Object.defineProperty(card, 'scrollWidth', { configurable: true, value: 960 })
    Object.defineProperty(table, 'scrollWidth', { configurable: true, value: 960 })
    bubble.append(card)
    document.body.append(bubble)

    const runtime = installMaidTableCards({} as never)
    resize?.([{ target: card } as ResizeObserverEntry], {} as ResizeObserver)

    expect(card.hasAttribute('data-maid-table-expandable')).toBe(true)
    const frame = card.closest<HTMLElement>('[data-maid-table-frame]')
    expect(frame?.hasAttribute('data-maid-table-expandable')).toBe(true)
    const button = frame?.querySelector<HTMLButtonElement>('[data-maid-table-expand]')
    expect(button?.dataset.skinOwner).toBe('maid-atelier')
    expect(button?.getAttribute('aria-label')).toBe('展开表格预览')
    expect(button?.title).toBe('展开表格预览')

    card.dispatchEvent(new Event('scroll'))
    expect(frame?.hasAttribute('data-maid-table-scroll-suppressed')).toBe(true)
    card.dispatchEvent(new Event('pointerleave'))
    expect(frame?.hasAttribute('data-maid-table-scroll-suppressed')).toBe(false)

    button?.click()
    const lightbox = document.querySelector('[data-maid-table-lightbox]')
    const panel = lightbox?.querySelector<HTMLElement>('[data-maid-table-panel]')
    expect(lightbox).not.toBeNull()
    expect(panel?.style.getPropertyValue('--maid-table-expanded-width')).toBe('968px')
    expect(card.hasAttribute('data-maid-table-open')).toBe(true)
    expect(lightbox?.querySelector('[data-maid-table-expanded] table')).not.toBeNull()
    expect(lightbox?.querySelector('[data-maid-table-expand]')).toBeNull()

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(card.hasAttribute('data-maid-table-open')).toBe(false)

    runtime.dispose()
  })

  it('removes injected controls and overlays on dispose', () => {
    vi.useFakeTimers()
    try {
      vi.stubGlobal('ResizeObserver', class {
        constructor() {}
        observe(): void {}
        unobserve(): void {}
        disconnect(): void {}
      })

      const bubble = document.createElement('div')
      bubble.className = 'fixture_markdown'
      Object.defineProperty(bubble, 'clientWidth', { configurable: true, value: 680 })
      const card = document.createElement('div')
      card.className = 'md-table-wide'
      Object.defineProperty(card, 'clientWidth', { configurable: true, value: 680 })
      Object.defineProperty(card, 'scrollWidth', { configurable: true, value: 960 })
      bubble.append(card)
      document.body.append(bubble)

      const runtime = installMaidTableCards({} as never)
      card.closest<HTMLElement>('[data-maid-table-frame]')
        ?.querySelector<HTMLButtonElement>('[data-maid-table-expand]')
        ?.click()
      expect(document.querySelector('[data-maid-table-lightbox]')).not.toBeNull()

      runtime.dispose()
      vi.runAllTimers()

      expect(card.closest('[data-maid-table-frame]')).toBeNull()
      expect(card.querySelector('[data-maid-table-expand]')).toBeNull()
      expect(card.hasAttribute('data-maid-table-expandable')).toBe(false)
      expect(card.hasAttribute('data-maid-table-open')).toBe(false)
      expect(document.querySelector('[data-maid-table-lightbox]')).toBeNull()
    } finally {
      vi.useRealTimers()
    }
  })

  it('preserves a pre-existing table tabindex while toggling expandability', () => {
    let resize: ResizeObserverCallback | undefined
    vi.stubGlobal('ResizeObserver', class {
      constructor(callback: ResizeObserverCallback) {
        resize = callback
      }

      observe(): void {}
      unobserve(): void {}
      disconnect(): void {}
    })

    const bubble = document.createElement('div')
    bubble.className = 'fixture_markdown'
    Object.defineProperty(bubble, 'clientWidth', { configurable: true, value: 680 })
    const card = document.createElement('div')
    card.className = 'md-table-wide'
    card.setAttribute('tabindex', '-1')
    Object.defineProperty(card, 'clientWidth', { configurable: true, value: 680 })
    Object.defineProperty(card, 'scrollWidth', { configurable: true, value: 640 })
    bubble.append(card)
    document.body.append(bubble)

    const runtime = installMaidTableCards({} as never)
    resize?.([{ target: card } as ResizeObserverEntry], {} as ResizeObserver)
    const frame = card.closest<HTMLElement>('[data-maid-table-frame]')
    const button = frame?.querySelector<HTMLButtonElement>('[data-maid-table-expand]')

    expect(card.getAttribute('tabindex')).toBe('-1')
    expect(card.hasAttribute('data-maid-table-expandable')).toBe(false)
    expect(frame?.hasAttribute('data-maid-table-expandable')).toBe(false)
    expect(button?.hidden).toBe(true)

    Object.defineProperty(card, 'scrollWidth', { configurable: true, value: 960 })
    resize?.([{ target: card } as ResizeObserverEntry], {} as ResizeObserver)
    expect(card.getAttribute('tabindex')).toBe('0')
    expect(frame?.hasAttribute('data-maid-table-expandable')).toBe(true)
    expect(button?.hidden).toBe(false)

    runtime.dispose()
    expect(card.getAttribute('tabindex')).toBe('-1')
  })

  it('does not open the table lightbox while a native modal dialog is present', () => {
    let resize: ResizeObserverCallback | undefined
    vi.stubGlobal('ResizeObserver', class {
      constructor(callback: ResizeObserverCallback) {
        resize = callback
      }

      observe(): void {}
      unobserve(): void {}
      disconnect(): void {}
    })

    const card = document.createElement('div')
    card.className = 'md-table-wide'
    card.innerHTML = '<table><tbody><tr><td>wide</td></tr></tbody></table>'
    const table = card.querySelector('table')!
    Object.defineProperty(card, 'clientWidth', { configurable: true, value: 680 })
    Object.defineProperty(table, 'scrollWidth', { configurable: true, value: 960 })
    document.body.append(card)

    const runtime = installMaidTableCards({} as never)
    resize?.([{ target: card } as ResizeObserverEntry], {} as ResizeObserver)

    const nativeModal = document.createElement('div')
    nativeModal.setAttribute('role', 'dialog')
    nativeModal.setAttribute('aria-modal', 'true')
    document.body.append(nativeModal)

    card.closest<HTMLElement>('[data-maid-table-frame]')
      ?.querySelector<HTMLButtonElement>('[data-maid-table-expand]')
      ?.click()

    expect(document.querySelector('[data-maid-table-lightbox]')).toBeNull()
    expect(card.hasAttribute('data-maid-table-open')).toBe(false)

    runtime.dispose()
  })

  it('closes the table lightbox when a native modal dialog mounts above it', async () => {
    let resize: ResizeObserverCallback | undefined
    vi.stubGlobal('ResizeObserver', class {
      constructor(callback: ResizeObserverCallback) {
        resize = callback
      }

      observe(): void {}
      unobserve(): void {}
      disconnect(): void {}
    })

    const card = document.createElement('div')
    card.className = 'md-table-wide'
    card.innerHTML = '<table><tbody><tr><td>wide</td></tr></tbody></table>'
    const table = card.querySelector('table')!
    Object.defineProperty(card, 'clientWidth', { configurable: true, value: 680 })
    Object.defineProperty(table, 'scrollWidth', { configurable: true, value: 960 })
    document.body.append(card)

    const runtime = installMaidTableCards({} as never)
    resize?.([{ target: card } as ResizeObserverEntry], {} as ResizeObserver)
    card.closest<HTMLElement>('[data-maid-table-frame]')
      ?.querySelector<HTMLButtonElement>('[data-maid-table-expand]')
      ?.click()
    expect(document.querySelector('[data-maid-table-lightbox]')).not.toBeNull()

    const nativeModal = document.createElement('div')
    nativeModal.setAttribute('role', 'dialog')
    nativeModal.setAttribute('aria-modal', 'true')
    document.body.append(nativeModal)
    await Promise.resolve()

    expect(document.querySelector('[data-maid-table-lightbox]')).toBeNull()
    expect(card.hasAttribute('data-maid-table-open')).toBe(false)

    runtime.dispose()
  })
})
