import { hasMutationOutsideTerminal } from './mutation-filter.ts'

const TERMINAL_SELECTOR = '[data-dsh-better-sidebar] .xterm'
const TERMINAL_WIDTH_LOCK_ATTRIBUTE = 'data-orca-terminal-width-locked'
const TERMINAL_WIDTH_PROPERTY = '--orca-terminal-locked-width'
const RESPONSIVE_SURFACE_SELECTOR = '[data-produced-files-row]'
const RESPONSIVE_WIDTH_LOCK_ATTRIBUTE = 'data-orca-responsive-width-locked'
const RESPONSIVE_WIDTH_PROPERTY = '--orca-responsive-locked-width'
const APP_FRAME_SELECTOR = "[id='root'] > div[data-slot='root'] > div"
const TRANSITION_FALLBACK_MS = 380

interface ResponsiveSurfaceLock {
  surface: HTMLElement
  hadAttribute: boolean
  originalWidth: string
  lockedWidth: string
}

/**
 * During an AppFrame track transition, hold resize-sensitive surfaces at their
 * current width and release them at transition end. Locking produced-file rows
 * individually avoids invalidating the entire AppFrame subtree before its
 * first animated frame can paint.
 */
export function installOrcaTerminalPerformance(body: HTMLElement): () => void {
  const view = body.ownerDocument.defaultView
  let frame: HTMLElement | null = null
  let lockedHost: HTMLElement | null = null
  let responsiveSurfaceLocks: ResponsiveSurfaceLock[] = []
  let unlockTimer: number | undefined

  const unlockTerminal = (): void => {
    if (unlockTimer !== undefined) view?.clearTimeout(unlockTimer)
    unlockTimer = undefined
    lockedHost?.removeAttribute(TERMINAL_WIDTH_LOCK_ATTRIBUTE)
    lockedHost?.style.removeProperty(TERMINAL_WIDTH_PROPERTY)
    lockedHost = null
  }

  const unlockResponsiveSurfaces = (): void => {
    const locks = responsiveSurfaceLocks
    responsiveSurfaceLocks = []
    for (const { surface, hadAttribute, originalWidth, lockedWidth } of locks) {
      // A later activation may have taken over the row and replaced the
      // locked width. If the property is no longer ours, leave both the
      // property and the attribute alone — the attribute removal below is
      // gated on the same ownership check, otherwise the unconditional
      // removal would disable the successor's lock.
      if (surface.style.getPropertyValue(RESPONSIVE_WIDTH_PROPERTY) !== lockedWidth) continue
      if (originalWidth === '') surface.style.removeProperty(RESPONSIVE_WIDTH_PROPERTY)
      else surface.style.setProperty(RESPONSIVE_WIDTH_PROPERTY, originalWidth)
      if (!hadAttribute && surface.hasAttribute(RESPONSIVE_WIDTH_LOCK_ATTRIBUTE)) {
        surface.removeAttribute(RESPONSIVE_WIDTH_LOCK_ATTRIBUTE)
      }
    }
  }

  const unlockTransitionSurfaces = (): void => {
    unlockTerminal()
    unlockResponsiveSurfaces()
  }

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

  const lockResponsiveSurfaces = (): void => {
    if (responsiveSurfaceLocks.length > 0) return
    for (const surface of body.querySelectorAll<HTMLElement>(RESPONSIVE_SURFACE_SELECTOR)) {
      const width = surface.getBoundingClientRect().width
      if (width <= 0) continue
      const lockedWidth = `${width}px`
      responsiveSurfaceLocks.push({
        surface,
        hadAttribute: surface.hasAttribute(RESPONSIVE_WIDTH_LOCK_ATTRIBUTE),
        originalWidth: surface.style.getPropertyValue(RESPONSIVE_WIDTH_PROPERTY),
        lockedWidth,
      })
      surface.style.setProperty(RESPONSIVE_WIDTH_PROPERTY, lockedWidth)
      surface.setAttribute(RESPONSIVE_WIDTH_LOCK_ATTRIBUTE, '')
    }
  }

  const lockTransitionSurfaces = (): void => {
    if (frame?.hasAttribute('data-dragging') === true) {
      unlockTransitionSurfaces()
      return
    }
    lockTerminal()
    lockResponsiveSurfaces()
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
          'data-details-collapsed',
          'data-dragging',
        ],
      })
    }
  }

  const synchronize = (): void => {
    mountFrame()
  }

  const observer = new MutationObserver((records) => {
    if (hasMutationOutsideTerminal(records)) synchronize()
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
