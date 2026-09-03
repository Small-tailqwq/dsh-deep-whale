// @vitest-environment jsdom
/**
 * Wide-table preview/expand lifecycle: the installer measures embedded tables,
 * decorates renderer-owned wrappers in place, opens a cloned large view, and
 * restores every touched attribute on dispose.
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
    expect(card.hasAttribute('data-maid-table-frame')).toBe(false)
    expect(card.querySelector('[data-maid-table-expand]')).toBeNull()
    runtime.dispose()
    // jsdom lacks ResizeObserver, so no inline geometry was written and the
    // disposer must not throw or leave the node modified.
    expect(card.style.width).toBe('')
    expect(card.style.marginLeft).toBe('')
  })

  it('marks overflowing tables as expandable and opens a cloned lightbox', async () => {
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
    expect(card.parentElement).toBe(bubble)
    expect(card.hasAttribute('data-maid-table-frame')).toBe(true)
    const button = card.querySelector<HTMLButtonElement>('[data-maid-table-expand]')
    expect(button?.dataset.skinOwner).toBe('maid-atelier')
    expect(button?.getAttribute('aria-label')).toBe('展开表格预览')
    expect(button?.title).toBe('展开表格预览')
    expect(button?.hidden).toBe(false)

    card.dispatchEvent(new Event('scroll'))
    expect(card.hasAttribute('data-maid-table-scroll-suppressed')).toBe(true)
    card.dispatchEvent(new Event('pointerleave'))
    expect(card.hasAttribute('data-maid-table-scroll-suppressed')).toBe(false)

    card.innerHTML = '<table><tbody><tr><td>complete</td></tr></tbody></table>'
    const completedTable = card.querySelector('table')!
    Object.defineProperty(completedTable, 'scrollWidth', { configurable: true, value: 960 })
    await Promise.resolve()
    expect(card.parentElement).toBe(bubble)
    expect(button?.parentElement).toBe(card)

    button?.click()
    const lightbox = document.querySelector('[data-maid-table-lightbox]')
    const panel = lightbox?.querySelector<HTMLElement>('[data-maid-table-panel]')
    expect(lightbox).not.toBeNull()
    expect(panel?.style.getPropertyValue('--maid-table-expanded-width')).toBe('968px')
    expect(card.hasAttribute('data-maid-table-open')).toBe(true)
    expect(lightbox?.querySelector('[data-maid-table-expanded] table')).not.toBeNull()
    expect(lightbox?.querySelector('[data-maid-table-expand]')).toBeNull()
    await Promise.resolve()
    expect(lightbox?.querySelector('[data-maid-table-frame]')).toBeNull()

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(card.hasAttribute('data-maid-table-open')).toBe(false)

    const replacement = installMaidTableCards({} as never)
    runtime.dispose()
    expect(card.hasAttribute('data-maid-table-frame')).toBe(true)
    expect(card.hasAttribute('data-maid-table-expandable')).toBe(true)
    expect(card.querySelectorAll('[data-maid-table-expand]')).toHaveLength(1)
    button?.click()
    expect(document.querySelector('[data-maid-table-lightbox]')).not.toBeNull()

    replacement.dispose()
    expect(card.hasAttribute('data-maid-table-frame')).toBe(false)
    expect(card.querySelector('[data-maid-table-expand]')).toBeNull()
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
      card.querySelector<HTMLButtonElement>('[data-maid-table-expand]')?.click()
      expect(document.querySelector('[data-maid-table-lightbox]')).not.toBeNull()

      const timerBaseline = vi.getTimerCount()
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
      expect(document.querySelector('[data-maid-table-closing]')).not.toBeNull()
      expect(vi.getTimerCount()).toBe(timerBaseline + 1)

      runtime.dispose()
      expect(vi.getTimerCount()).toBe(timerBaseline)
      vi.runAllTimers()

      expect(card.hasAttribute('data-maid-table-frame')).toBe(false)
      expect(card.querySelector('[data-maid-table-expand]')).toBeNull()
      expect(card.hasAttribute('data-maid-table-expandable')).toBe(false)
      expect(card.hasAttribute('data-maid-table-open')).toBe(false)
      expect(document.querySelector('[data-maid-table-lightbox]')).toBeNull()
    } finally {
      vi.useRealTimers()
    }
  })

  it('switches between native and enhanced layout as the bubble width changes', () => {
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
    card.innerHTML = '<table><tbody><tr><td>resizable</td></tr></tbody></table>'
    const table = card.querySelector('table')!
    Object.defineProperty(table, 'scrollWidth', { configurable: true, value: 640 })
    bubble.append(card)
    document.body.append(bubble)

    const runtime = installMaidTableCards({} as never)
    expect(card.getAttribute('tabindex')).toBe('-1')
    expect(card.hasAttribute('data-maid-table-expandable')).toBe(false)
    expect(card.hasAttribute('data-maid-table-frame')).toBe(false)
    expect(card.querySelector('[data-maid-table-expand]')).toBeNull()

    resize?.([{
      target: table,
      borderBoxSize: [{ inlineSize: 960 }],
      contentRect: { width: 960 },
    } as unknown as ResizeObserverEntry], {} as ResizeObserver)
    expect(card.getAttribute('tabindex')).toBe('-1')
    expect(card.hasAttribute('data-maid-table-frame')).toBe(true)
    expect(card.querySelector('[data-maid-table-expand]')).not.toBeNull()
    expect(card.parentElement).toBe(bubble)

    resize?.([{
      target: bubble,
      contentBoxSize: [{ inlineSize: 1000 }],
      contentRect: { width: 1000 },
    } as unknown as ResizeObserverEntry], {} as ResizeObserver)
    expect(card.getAttribute('tabindex')).toBe('-1')
    expect(card.hasAttribute('data-maid-table-frame')).toBe(false)
    expect(card.querySelector('[data-maid-table-expand]')).toBeNull()
    expect(card.parentElement).toBe(bubble)

    resize?.([{
      target: bubble,
      contentBoxSize: [{ inlineSize: 680 }],
      contentRect: { width: 680 },
    } as unknown as ResizeObserverEntry], {} as ResizeObserver)
    expect(card.hasAttribute('data-maid-table-expandable')).toBe(true)
    expect(card.querySelector('[data-maid-table-expand]')).not.toBeNull()

    runtime.dispose()
    expect(card.getAttribute('tabindex')).toBe('-1')
  })

  it('retracts a partially adopted table when installation throws', () => {
    vi.stubGlobal('ResizeObserver', class {
      observe(): void {
        throw new Error('observe failed')
      }
      unobserve(): void {}
      disconnect(): void {}
    })

    const card = document.createElement('div')
    card.className = 'md-table-wide'
    card.setAttribute('tabindex', '-1')
    document.body.append(card)

    expect(() => installMaidTableCards({} as never)).toThrow('observe failed')
    expect(card.parentElement).toBe(document.body)
    expect(card.hasAttribute('data-maid-table-frame')).toBe(false)
    expect(card.getAttribute('tabindex')).toBe('-1')
    expect(card.hasAttribute('data-maid-table-expandable')).toBe(false)
    expect(document.querySelector('[data-maid-table-expand]')).toBeNull()
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

    const bubble = document.createElement('div')
    bubble.className = 'fixture_markdown'
    Object.defineProperty(bubble, 'clientWidth', { configurable: true, value: 680 })
    const card = document.createElement('div')
    card.className = 'md-table-wide'
    card.innerHTML = '<table><tbody><tr><td>wide</td></tr></tbody></table>'
    const table = card.querySelector('table')!
    Object.defineProperty(card, 'clientWidth', { configurable: true, value: 680 })
    Object.defineProperty(table, 'scrollWidth', { configurable: true, value: 960 })
    bubble.append(card)
    document.body.append(bubble)

    const runtime = installMaidTableCards({} as never)
    resize?.([{ target: card } as ResizeObserverEntry], {} as ResizeObserver)

    const nativeModal = document.createElement('div')
    nativeModal.setAttribute('role', 'dialog')
    nativeModal.setAttribute('aria-modal', 'true')
    document.body.append(nativeModal)

    card.querySelector<HTMLButtonElement>('[data-maid-table-expand]')?.click()

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

    const bubble = document.createElement('div')
    bubble.className = 'fixture_markdown'
    Object.defineProperty(bubble, 'clientWidth', { configurable: true, value: 680 })
    const card = document.createElement('div')
    card.className = 'md-table-wide'
    card.innerHTML = '<table><tbody><tr><td>wide</td></tr></tbody></table>'
    const table = card.querySelector('table')!
    Object.defineProperty(card, 'clientWidth', { configurable: true, value: 680 })
    Object.defineProperty(table, 'scrollWidth', { configurable: true, value: 960 })
    bubble.append(card)
    document.body.append(bubble)

    const runtime = installMaidTableCards({} as never)
    resize?.([{ target: card } as ResizeObserverEntry], {} as ResizeObserver)
    card.querySelector<HTMLButtonElement>('[data-maid-table-expand]')?.click()
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
