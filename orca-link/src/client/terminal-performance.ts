import { hasMutationOutsideTranscript } from './mutation-filter.ts'

const TERMINAL_SELECTOR = '[data-dsh-better-sidebar] .xterm'
const TERMINAL_WIDTH_LOCK_ATTRIBUTE = 'data-orca-terminal-width-locked'
const TERMINAL_WIDTH_PROPERTY = '--orca-terminal-locked-width'
const APP_FRAME_SELECTOR = "[id='root'] > div[data-slot='root'] > div"
const TRANSITION_FALLBACK_MS = 380

/**
 * During an AppFrame track transition, hold the plugin terminal at its current
 * width and release it at transition end, so the resize does not reflow xterm
 * before the first animated frame can paint.
 */
export function installOrcaTerminalPerformance(body: HTMLElement): () => void {
  const view = body.ownerDocument.defaultView
  let frame: HTMLElement | null = null
  let lockedHost: HTMLElement | null = null
  let unlockTimer: number | undefined

  const unlockTerminal = (): void => {
    if (unlockTimer !== undefined) view?.clearTimeout(unlockTimer)
    unlockTimer = undefined
    lockedHost?.removeAttribute(TERMINAL_WIDTH_LOCK_ATTRIBUTE)
    lockedHost?.style.removeProperty(TERMINAL_WIDTH_PROPERTY)
    lockedHost = null
  }

  const unlockTransitionSurfaces = unlockTerminal

  const scheduleUnlock = (): void => {
    if (unlockTimer !== undefined) view?.clearTimeout(unlockTimer)
    unlockTimer = view?.setTimeout(unlockTransitionSurfaces, TRANSITION_FALLBACK_MS)
  }

  const lockTerminal = (): void => {
    if (frame?.hasAttribute('data-dragging') === true) {
      unlockTransitionSurfaces()
      return
    }
    const terminal = body.querySelector<HTMLElement>(TERMINAL_SELECTOR)
    const host = terminal?.parentElement
    if (!(host instanceof HTMLElement)) return
    if (host !== lockedHost) {
      unlockTerminal()
      const width = host.getBoundingClientRect().width
      if (width <= 0) return
      lockedHost = host
      host.style.setProperty(TERMINAL_WIDTH_PROPERTY, `${width}px`)
      host.setAttribute(TERMINAL_WIDTH_LOCK_ATTRIBUTE, '')
    }
  }

  const lockTransitionSurfaces = (): void => {
    if (frame?.hasAttribute('data-dragging') === true) {
      unlockTransitionSurfaces()
      return
    }
    lockTerminal()
    scheduleUnlock()
  }

  const onTransitionEnd = (event: TransitionEvent): void => {
    if (event.target === frame && event.propertyName === 'grid-template-columns') unlockTransitionSurfaces()
  }

  const frameObserver = new MutationObserver((records) => {
    if (frame?.hasAttribute('data-dragging') === true) {
      unlockTransitionSurfaces()
      return
    }
    if (records.some(record => record.attributeName !== 'data-dragging')) lockTransitionSurfaces()
  })
  const mountFrame = (): void => {
    const next = body.querySelector<HTMLElement>(APP_FRAME_SELECTOR)
    if (next === frame) return
    frameObserver.disconnect()
    frame?.removeEventListener('transitionend', onTransitionEnd)
    unlockTransitionSurfaces()
    frame = next
    frame?.addEventListener('transitionend', onTransitionEnd)
    if (frame !== null) {
      frameObserver.observe(frame, {
        attributes: true,
        attributeFilter: [
          'style',
          'data-sidebar-collapsed',
          'data-rightbar-collapsed',
          'data-dragging',
        ],
      })
    }
  }

  const synchronize = (): void => {
    mountFrame()
  }

  const observer = new MutationObserver((records) => {
    if (hasMutationOutsideTranscript(records)) synchronize()
  })
  observer.observe(body, { childList: true, subtree: true })
  synchronize()

  return () => {
    observer.disconnect()
    frameObserver.disconnect()
    frame?.removeEventListener('transitionend', onTransitionEnd)
    unlockTransitionSurfaces()
  }
}
