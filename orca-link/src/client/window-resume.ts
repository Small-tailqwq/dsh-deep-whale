const WINDOW_RESUMING_ATTRIBUTE = 'data-orca-window-resuming'
const POINTER_RELEASE_DISTANCE_PX = 2

/**
 * Suppress sidebar tooltips restored by WebApp window activation until a new
 * user gesture proves that the pointer or keyboard focus is intentional.
 */
export function installOrcaWindowResume(body: HTMLElement): () => void {
  const doc = body.ownerDocument
  const view = doc.defaultView
  const originallyResuming = body.hasAttribute(WINDOW_RESUMING_ATTRIBUTE)
  let lastPointer: { x: number, y: number } | null = null

  const suppress = (): void => {
    body.setAttribute(WINDOW_RESUMING_ATTRIBUTE, '')
  }
  const release = (): void => {
    body.removeAttribute(WINDOW_RESUMING_ATTRIBUTE)
  }
  const onPointerMove = (event: PointerEvent): void => {
    const previous = lastPointer
    lastPointer = { x: event.clientX, y: event.clientY }
    if (!body.hasAttribute(WINDOW_RESUMING_ATTRIBUTE) || previous === null) return
    const distance = Math.abs(event.clientX - previous.x) + Math.abs(event.clientY - previous.y)
    if (distance >= POINTER_RELEASE_DISTANCE_PX) release()
  }
  const onVisibilityChange = (): void => {
    suppress()
  }

  doc.addEventListener('pointermove', onPointerMove, { capture: true, passive: true })
  doc.addEventListener('pointerdown', release, true)
  doc.addEventListener('keydown', release, true)
  doc.addEventListener('visibilitychange', onVisibilityChange)
  view?.addEventListener('blur', suppress)
  view?.addEventListener('focus', suppress)

  return () => {
    doc.removeEventListener('pointermove', onPointerMove, true)
    doc.removeEventListener('pointerdown', release, true)
    doc.removeEventListener('keydown', release, true)
    doc.removeEventListener('visibilitychange', onVisibilityChange)
    view?.removeEventListener('blur', suppress)
    view?.removeEventListener('focus', suppress)
    body.toggleAttribute(WINDOW_RESUMING_ATTRIBUTE, originallyResuming)
  }
}
