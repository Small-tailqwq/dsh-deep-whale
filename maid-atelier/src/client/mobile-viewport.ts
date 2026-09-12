/**
 * Phone viewport: keep the host shell and the composer inside the band the
 * software keyboard leaves visible.
 *
 * `html`, `body` and `#root` are height-locked to the layout viewport, and the
 * layout viewport does not shrink for the software keyboard — iOS never does,
 * Android only when the page opts in through the `interactive-widget` viewport
 * hint. A focused composer therefore stays behind the keyboard, and the
 * height-locked page has no scroll range to bring it back.
 *
 * This module appends that hint where the engine accepts it and, when the
 * keyboard still shrinks only the visual viewport, publishes `--maid-vv-height`
 * and `--maid-vv-top` and marks the root so the stylesheet can pin the
 * application to the band `VisualViewport` reports. It also brings the composer
 * back into the band once per keyboard opening, which is what a landscape phone
 * needs: the hero stack is centred and taller than the band, so the composer
 * would otherwise sit below the fold.
 *
 * Every write is idempotent and remembered, so a viewport that stops changing
 * stops writing; the disposer removes the listeners, the published variables and
 * the viewport hint the module appended — and nothing else.
 */

/** Root attribute that tells the stylesheet the shell is pinned to the keyboard. */
const KEYBOARD_ATTRIBUTE = 'data-maid-keyboard'
/** The visual viewport's height, published for the shell and the takeover cards. */
const HEIGHT_PROPERTY = '--maid-vv-height'
/** The visual viewport's offset from the layout viewport's top edge. */
const TOP_PROPERTY = '--maid-vv-top'
/** The seat's card: the composer while a prompt is being drafted. */
const COMPOSER_CARD_SELECTOR = '[data-composer-card]'
/** The takeover card that replaces the composer while a question or plan pends. */
const TAKEOVER_CARD_SELECTOR = ":is([data-question-key], [data-plan-review-key]) > section"
/** Phone widths own the bar-less layout; above them the host's own rail is in charge. */
const PHONE_MAX_WIDTH = 700
/** A touch pointer owns the keyboard shell even in landscape, where the shell is wide. */
const COARSE_QUERY = '(pointer: coarse)'
/** A visual viewport this much shorter than the layout viewport is a keyboard. */
const KEYBOARD_MIN_GAP = 120
/** The composer mounts with the shell; a few settle passes cover the rest. */
const SETTLE_DELAYS = [250, 1000, 3000]

/**
 * Keep the phone shell inside the visual viewport while the software keyboard is
 * open.
 * @param body - skin owning element (document.body); supplies the document and view.
 * @returns disposer restoring the meta hint and removing every listener and variable.
 */
export function installMaidMobileViewport(body: HTMLElement): () => void {
  const doc = body.ownerDocument
  const defaultView = doc.defaultView
  if (defaultView === null) return () => {}
  // Bound to its own const: TypeScript cannot keep the null-check narrowing of a
  // captured variable inside the hoisted update/schedule closures below.
  const view = defaultView
  const root = doc.documentElement
  const visual = view.visualViewport ?? null

  // The host owns the viewport tag; only the appended hint is ours to remove.
  const meta = doc.querySelector<HTMLMetaElement>("meta[name='viewport']")
  const originalContent = meta?.getAttribute('content') ?? null
  const hinted = meta !== null
    && originalContent !== null
    && !originalContent.includes('interactive-widget')
  if (meta !== null && hinted) {
    meta.setAttribute('content', `${originalContent}, interactive-widget=resizes-content`)
  }

  const raf = view.requestAnimationFrame?.bind(view)
  const caf = view.cancelAnimationFrame?.bind(view)

  let frame: number | null = null
  let nudgeFrame: number | null = null
  let pending = false
  let disposed = false
  let heightWritten: string | null = null
  let topWritten: string | null = null
  let keyboardMarked = false
  const settleTimers: Array<ReturnType<typeof setTimeout>> = []

  /** The card whose top the band must contain: the composer, or its takeover. */
  const resolveAnchor = (): Element | null => doc.querySelector(COMPOSER_CARD_SELECTOR)
    ?? doc.querySelector(TAKEOVER_CARD_SELECTOR)

  const publish = (property: string, value: string, previous: string | null): string | null => {
    if (value === previous) return previous
    root.style.setProperty(property, value)
    return value
  }

  function update(): void {
    if (disposed) return
    const phone = view.innerWidth <= PHONE_MAX_WIDTH
    // A landscape phone is wider than the phone breakpoint, so the keyboard
    // shell keys off the pointer as well as the width.
    const coarse = view.matchMedia?.(COARSE_QUERY)?.matches ?? false
    // A pinch-zoom keeps the layout viewport semantics the host shipped; only a
    // genuine keyboard gap pins the shell to the visual viewport.
    const unscaled = visual === null || Math.abs(visual.scale - 1) <= 0.01
    const height = visual !== null && unscaled ? visual.height : view.innerHeight
    const offset = visual !== null && unscaled ? visual.offsetTop : 0
    const keyboard = (coarse || phone)
      && visual !== null
      && unscaled
      && view.innerHeight - visual.height > KEYBOARD_MIN_GAP
    const opened = keyboard && !keyboardMarked

    heightWritten = publish(HEIGHT_PROPERTY, `${Math.round(height)}px`, heightWritten)
    topWritten = publish(TOP_PROPERTY, `${Math.round(offset)}px`, topWritten)

    if (keyboard !== keyboardMarked) {
      keyboardMarked = keyboard
      if (keyboard) root.setAttribute(KEYBOARD_ATTRIBUTE, 'open')
      else root.removeAttribute(KEYBOARD_ATTRIBUTE)
    }

    // Reading after the attribute write flushes the pinned layout, so the card
    // is measured where the reader will actually see it.
    const anchor = resolveAnchor()
    const box = anchor?.getBoundingClientRect()
    if (!opened || anchor === null || box === undefined || box.bottom <= offset + height + 1) return

    // The hero stack is centred and taller than a landscape band, so it would
    // leave the composer below the fold. Bring it back once per keyboard opening
    // rather than fighting the host on every frame.
    const nudge = (): void => {
      nudgeFrame = null
      if (!disposed) anchor.scrollIntoView?.({ block: 'end', inline: 'nearest' })
    }
    if (raf === undefined) nudge()
    else nudgeFrame = raf(nudge)
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

  const onViewportChange = (): void => { schedule() }

  view.addEventListener('resize', onViewportChange)
  doc.addEventListener('focusin', onViewportChange, true)
  visual?.addEventListener('resize', onViewportChange)
  visual?.addEventListener('scroll', onViewportChange)

  schedule()
  for (const delay of SETTLE_DELAYS) {
    settleTimers.push(setTimeout(() => { schedule() }, delay))
  }

  return () => {
    disposed = true
    if (frame !== null && caf !== undefined) caf(frame)
    if (nudgeFrame !== null && caf !== undefined) caf(nudgeFrame)
    frame = null
    nudgeFrame = null
    pending = false
    for (const timer of settleTimers) clearTimeout(timer)
    settleTimers.length = 0
    view.removeEventListener('resize', onViewportChange)
    doc.removeEventListener('focusin', onViewportChange, true)
    visual?.removeEventListener('resize', onViewportChange)
    visual?.removeEventListener('scroll', onViewportChange)
    if (keyboardMarked) root.removeAttribute(KEYBOARD_ATTRIBUTE)
    keyboardMarked = false
    if (heightWritten !== null) root.style.removeProperty(HEIGHT_PROPERTY)
    if (topWritten !== null) root.style.removeProperty(TOP_PROPERTY)
    heightWritten = null
    topWritten = null
    if (meta !== null && hinted && originalContent !== null) meta.setAttribute('content', originalContent)
  }
}
