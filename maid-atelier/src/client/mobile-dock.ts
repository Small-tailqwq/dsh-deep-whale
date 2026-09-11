/**
 * Phone dock geometry: keep the floating brand dock clear of the composer.
 *
 * The phone-chrome block in the stylesheet turns the collapsed sidebar column
 * into a fixed 48px target at the bottom-left, sitting above the composer. CSS
 * cannot express where the composer ends, and the distance changes when the
 * composer grows past one line, when the shell swaps the hero for an active
 * conversation, and when the software keyboard pins the shell to a shorter band
 * — so this module measures the composer's top edge and publishes it as
 * `--maid-dock-offset`, the `bottom` distance the dock consumes.
 *
 * The composer's *seat* is the observed element, not the card: the card keeps
 * its size across the hero-to-conversation swap while the seat that holds it
 * does not, and an observer beats a scroll listener that would force layout on
 * every transcript scroll.
 *
 * The distance is measured from `innerHeight` because a fixed box resolves
 * against the layout viewport: a fixed ancestor does not establish a containing
 * block for a fixed descendant (only transform, filter, contain, will-change and
 * container-type do), so the shell pinning itself to the keyboard does not move
 * the dock's reference frame.
 */

/** `bottom` distance that keeps the phone dock above the composer. */
const DOCK_PROPERTY = '--maid-dock-offset'
/** The composer's seat; its size changes when the shell swaps hero for conversation. */
const COMPOSER_SEAT_SELECTOR = '[data-composer-seat]'
/** The seat's card: the composer while a prompt is being drafted. */
const COMPOSER_CARD_SELECTOR = '[data-composer-card]'
/** The takeover card that replaces the composer while a question or plan pends. */
const TAKEOVER_CARD_SELECTOR = ":is([data-question-key], [data-plan-review-key]) > section"
/** The host marks the conversation phase the skin already keys several rules off. */
const PHASE_HERO_SELECTOR = "[data-phase='hero']"
/** Phone widths own the dock; above them the host's own rail is in charge. */
const PHONE_MAX_WIDTH = 700
/** Breathing room between the dock's top edge and the composer's. */
const DOCK_GAP = 10
/** In the hero phase a 28px workspace chip row and its 8px gap sit above the input bar. */
const HERO_STACK_CLEARANCE = 36
/** Never let the dock sink into the home indicator area. */
const DOCK_MIN_BOTTOM = 64
/** Never let the dock ride over the top edge of the shell. */
const DOCK_MIN_TOP = 10
/** The dock's own edge length, mirrored from the stylesheet. */
const DOCK_SIZE = 48
/** The composer mounts with the shell; a few settle passes cover the rest. */
const SETTLE_DELAYS = [250, 1000, 3000]

/**
 * Publish the `bottom` distance that keeps the phone dock above the composer.
 * @param body - skin owning element (document.body); supplies the document and view.
 * @returns disposer removing the observer, the listeners and the published variable.
 */
export function installMaidMobileDock(body: HTMLElement): () => void {
  const doc = body.ownerDocument
  const defaultView = doc.defaultView
  if (defaultView === null) return () => {}
  const view = defaultView
  const root = doc.documentElement
  const visual = view.visualViewport ?? null
  const ResizeObserverCtor = (globalThis as { ResizeObserver?: typeof ResizeObserver }).ResizeObserver
  const raf = view.requestAnimationFrame?.bind(view)
  const caf = view.cancelAnimationFrame?.bind(view)

  let frame: number | null = null
  let pending = false
  let disposed = false
  let written: string | null = null
  let observed: Element | null = null
  let seatObserver: ResizeObserver | null = null
  const settleTimers: Array<ReturnType<typeof setTimeout>> = []

  /** The card the dock must clear: the composer, or whatever took its seat over. */
  const resolveAnchor = (): Element | null => doc.querySelector(COMPOSER_CARD_SELECTOR)
    ?? doc.querySelector(TAKEOVER_CARD_SELECTOR)

  function watchSeat(): void {
    const next = doc.querySelector(COMPOSER_SEAT_SELECTOR) ?? resolveAnchor()
    if (next === observed) return
    observed = next
    seatObserver?.disconnect()
    if (next === null || ResizeObserverCtor === undefined) return
    seatObserver ??= new ResizeObserverCtor(() => { schedule() })
    seatObserver.observe(next)
  }

  const withdraw = (): void => {
    if (written === null) return
    root.style.removeProperty(DOCK_PROPERTY)
    written = null
  }

  function update(): void {
    if (disposed) return
    watchSeat()
    const anchor = resolveAnchor()
    if (view.innerWidth > PHONE_MAX_WIDTH || anchor === null) {
      withdraw()
      return
    }
    const box = anchor.getBoundingClientRect()
    if (box.width === 0) {
      withdraw()
      return
    }
    // The hero phase stacks its workspace chip row above the input bar, so the
    // dock must clear that row too or it lands on the workspace picker.
    const hero = anchor.closest(PHASE_HERO_SELECTOR) !== null
    const clearance = DOCK_GAP + (hero ? HERO_STACK_CLEARANCE : 0)
    const ceiling = Math.max(view.innerHeight - DOCK_MIN_TOP - DOCK_SIZE, DOCK_MIN_BOTTOM)
    const distance = Math.min(
      Math.max(view.innerHeight - box.top + clearance, DOCK_MIN_BOTTOM),
      ceiling,
    )
    const next = `${Math.round(distance)}px`
    if (next === written) return
    root.style.setProperty(DOCK_PROPERTY, next)
    written = next
  }

  function schedule(): void {
    if (pending || disposed) return
    pending = true
    if (raf === undefined) {
      pending = false
      update()
      return
    }
    frame = raf(() => {
      frame = null
      pending = false
      update()
    })
  }

  // The keyboard pins the shell, which moves the composer up with a shorter
  // band; focus and typing catch the rest of the layout changes.
  const onViewportChange = (): void => { schedule() }

  view.addEventListener('resize', onViewportChange)
  doc.addEventListener('focusin', onViewportChange, true)
  doc.addEventListener('keydown', onViewportChange, true)
  visual?.addEventListener('resize', onViewportChange)
  visual?.addEventListener('scroll', onViewportChange)

  schedule()
  for (const delay of SETTLE_DELAYS) {
    settleTimers.push(setTimeout(() => {
      if (observed === null) schedule()
    }, delay))
  }

  return () => {
    disposed = true
    if (frame !== null && caf !== undefined) caf(frame)
    frame = null
    pending = false
    for (const timer of settleTimers) clearTimeout(timer)
    settleTimers.length = 0
    seatObserver?.disconnect()
    seatObserver = null
    observed = null
    view.removeEventListener('resize', onViewportChange)
    doc.removeEventListener('focusin', onViewportChange, true)
    doc.removeEventListener('keydown', onViewportChange, true)
    visual?.removeEventListener('resize', onViewportChange)
    visual?.removeEventListener('scroll', onViewportChange)
    withdraw()
  }
}
