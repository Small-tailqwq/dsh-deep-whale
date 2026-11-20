/**
 * Phone viewport: keep the host shell and the composer inside the band the
 * software keyboard leaves visible.
 *
 * The landing-page shell needs to follow the visual viewport. Active
 * conversations instead keep the host's viewport behavior: the browser pans
 * to the caret, including when a landscape keyboard leaves less room than
 * the composer itself. Resizing that shell would put the editor above its
 * scrollport and behind the conversation header.
 *
 * This module publishes `--maid-vv-height` and `--maid-vv-top` and marks the
 * root so the stylesheet can pin the landing page to the band `VisualViewport`
 * reports. It also brings the landing-page composer
 * back into the band once per keyboard opening, which is what a landscape phone
 * needs: the hero stack is centred and taller than the band, so the composer
 * would otherwise sit below the fold.
 *
 * Every write is idempotent and remembered, so a viewport that stops changing
 * stops writing; the disposer removes the listeners and published state.
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
/** Narrow desktop windows share the phone layout; landscape phones use touch. */
export const MOBILE_QUERY = `(max-width: ${PHONE_MAX_WIDTH}px), ${COARSE_QUERY}`
/** A visual viewport this much shorter than the layout viewport is a keyboard. */
const KEYBOARD_MIN_GAP = 120
/** The composer mounts with the shell; a few settle passes cover the rest. */
const SETTLE_DELAYS = [250, 1000, 3000]

const viewports = new WeakMap<HTMLElement, { owners: number, dispose: () => void }>()

/**
 * Whether the skin's phone layout owns this viewport: a narrow window, or a
 * touch pointer even in landscape. Reads the one media query the stylesheet
 * uses, so the customization toggles and the CSS never disagree.
 * @param view - window whose media query is read.
 * @returns true when the phone layout applies.
 */
export function matchesMobile(view: Window): boolean {
  const media = view.matchMedia?.(MOBILE_QUERY)
  return media === undefined ? view.innerWidth <= PHONE_MAX_WIDTH : media.matches
}

/**
 * Keep the phone shell inside the visual viewport while the software keyboard is
 * open.
 * @param body - skin owning element (document.body); supplies the document and view.
 * @returns disposer removing every owned listener, attribute and variable.
 */
export function installMaidMobileViewport(body: HTMLElement): () => void {
  let state = viewports.get(body)
  if (state === undefined) {
    state = { owners: 0, dispose: installViewportController(body) }
    viewports.set(body, state)
  }
  const owned = state
  owned.owners++
  let released = false
  return () => {
    if (released) return
    released = true
    if (--owned.owners > 0) return
    viewports.delete(body)
    owned.dispose()
  }
}

/** Share one media listener and viewport activation across overlapping applies. */
function installViewportController(body: HTMLElement): () => void {
  const view = body.ownerDocument.defaultView
  const media = view?.matchMedia?.(MOBILE_QUERY)
  if (media === undefined) return () => {}

  let disposeViewport: (() => void) | undefined
  let disposed = false
  const synchronize = (): void => {
    if (disposed) return
    if (media.matches) {
      disposeViewport ??= installMobileViewport(body, media)
    } else {
      disposeViewport?.()
      disposeViewport = undefined
    }
  }
  const dispose = (): void => {
    disposed = true
    media.removeEventListener('change', synchronize)
    disposeViewport?.()
    disposeViewport = undefined
  }

  // A desktop resize within the wide layout never enters the viewport path.
  // The media boundary still activates it when the phone layout becomes visible.
  try {
    media.addEventListener('change', synchronize)
    synchronize()
  } catch (error) {
    dispose()
    throw error
  }
  return dispose
}

/** Install viewport work only while its phone or touch consumers can use it. */
function installMobileViewport(body: HTMLElement, media: MediaQueryList): () => void {
  const doc = body.ownerDocument
  const defaultView = doc.defaultView
  if (defaultView === null) return () => {}
  // Bound to its own const: TypeScript cannot keep the null-check narrowing of a
  // captured variable inside the hoisted update/schedule closures below.
  const view = defaultView
  const root = doc.documentElement
  const visual = view.visualViewport ?? null

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
  const originalHeight = root.style.getPropertyValue(HEIGHT_PROPERTY)
  const originalHeightPriority = root.style.getPropertyPriority(HEIGHT_PROPERTY)
  const originalTop = root.style.getPropertyValue(TOP_PROPERTY)
  const originalTopPriority = root.style.getPropertyPriority(TOP_PROPERTY)
  const originalKeyboard = root.getAttribute(KEYBOARD_ATTRIBUTE)

  const restoreViewport = (): void => {
    if (heightWritten !== null && root.style.getPropertyValue(HEIGHT_PROPERTY) === heightWritten
      && root.style.getPropertyPriority(HEIGHT_PROPERTY) === '') {
      if (originalHeight === '') root.style.removeProperty(HEIGHT_PROPERTY)
      else root.style.setProperty(HEIGHT_PROPERTY, originalHeight, originalHeightPriority)
    }
    if (topWritten !== null && root.style.getPropertyValue(TOP_PROPERTY) === topWritten
      && root.style.getPropertyPriority(TOP_PROPERTY) === '') {
      if (originalTop === '') root.style.removeProperty(TOP_PROPERTY)
      else root.style.setProperty(TOP_PROPERTY, originalTop, originalTopPriority)
    }
    heightWritten = null
    topWritten = null
    if (keyboardMarked && root.getAttribute(KEYBOARD_ATTRIBUTE) === 'open') {
      if (originalKeyboard === null) root.removeAttribute(KEYBOARD_ATTRIBUTE)
      else root.setAttribute(KEYBOARD_ATTRIBUTE, originalKeyboard)
    }
    keyboardMarked = false
  }

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
    // A pinch-zoom keeps the layout viewport semantics the host shipped; only a
    // genuine keyboard gap pins the shell to the visual viewport.
    const unscaled = visual === null || Math.abs(visual.scale - 1) <= 0.01
    const height = visual !== null && unscaled ? visual.height : view.innerHeight
    const offset = visual !== null && unscaled ? visual.offsetTop : 0
    const keyboard = media.matches
      && visual !== null
      && unscaled
      && view.innerHeight - visual.height > KEYBOARD_MIN_GAP
    const opened = keyboard && !keyboardMarked

    // Wide touch screens only consume these properties while the keyboard is up.
    if (!phone && !keyboard) {
      restoreViewport()
      return
    }

    heightWritten = publish(HEIGHT_PROPERTY, `${Math.round(height)}px`, heightWritten)
    topWritten = publish(TOP_PROPERTY, `${Math.round(offset)}px`, topWritten)

    if (keyboard !== keyboardMarked) {
      keyboardMarked = keyboard
      if (keyboard) root.setAttribute(KEYBOARD_ATTRIBUTE, 'open')
      else if (originalKeyboard === null) root.removeAttribute(KEYBOARD_ATTRIBUTE)
      else root.setAttribute(KEYBOARD_ATTRIBUTE, originalKeyboard)
    }

    if (!opened) return
    // Let the browser reveal the caret in an active conversation. Scrolling
    // the whole card can move it away again when the card exceeds the band.
    if (body.hasAttribute('data-maid-conversation-active')) return
    // Reading after the attribute write flushes the pinned layout, so the card
    // is measured where the reader will actually see it.
    const anchor = resolveAnchor()
    const box = anchor?.getBoundingClientRect()
    if (anchor === null || box === undefined || box.bottom <= offset + height + 1) return

    // The hero stack is centred and taller than a landscape band, so it would
    // leave the composer below the fold. Bring it back once per keyboard opening
    // rather than fighting the host on every frame.
    const nudge = (): void => {
      nudgeFrame = null
      if (!disposed && keyboardMarked) anchor.scrollIntoView?.({ block: 'end', inline: 'nearest' })
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

  const dispose = (): void => {
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
    restoreViewport()
  }

  try {
    view.addEventListener('resize', onViewportChange)
    doc.addEventListener('focusin', onViewportChange, true)
    visual?.addEventListener('resize', onViewportChange)
    visual?.addEventListener('scroll', onViewportChange)

    schedule()
    for (const delay of SETTLE_DELAYS) {
      settleTimers.push(setTimeout(() => { schedule() }, delay))
    }
  } catch (error) {
    dispose()
    throw error
  }
  return dispose
}
