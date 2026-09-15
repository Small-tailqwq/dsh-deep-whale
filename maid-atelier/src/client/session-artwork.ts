/**
 * Session-state portraits for the right maid.
 *
 * The harness already publishes what it is doing through its own DOM contract:
 * the reasoning row and the tool row both carry `data-state`, so the skin can
 * tell "she is working", "this turn just finished" and "this turn failed"
 * without touching a service, emitting an event, or reaching a model request.
 *
 * No portraits ship with this module. Whoever wants them supplies data URLs on
 * `window.__dshMaidAtelierArtwork`; when that is absent the installer observes
 * nothing and writes nothing, so the skin behaves exactly as it did before.
 *
 * @module
 */

export type SessionArtworkState = 'thinking' | 'done' | 'failed'

export type SessionArtworkMap = Partial<Record<SessionArtworkState, string>>

declare global {
  interface Window {
    /**
     * Optional state portraits, read once per install. Set this before the skin
     * activates; leaving it undefined keeps the mechanism completely inert.
     */
    __dshMaidAtelierArtwork?: SessionArtworkMap
  }
}

/** Rows the harness marks as actively working (reasoning or a running tool). */
const RUNNING_SELECTOR = '[data-state="running"]'

/**
 * Rows that already ended badly. `stopped` is an interrupted tool call, which
 * reads as "this turn did not land" exactly as `error` does.
 */
const FAILED_SELECTOR = '[data-state="error"], [data-state="stopped"]'

/**
 * The node this module borrows while a state portrait is on screen. The skin
 * owns every `[data-maid-character]` node, so this selector cannot drift with
 * the host.
 */
const PORTRAIT_SELECTOR = '[data-maid-character="right"]'

/** How long a finished or failed portrait stays up before the base one returns. */
const HOLD_MS = 4200

/**
 * A streaming transcript mutates constantly; coalescing the resulting bursts
 * keeps one turn at a handful of recounts instead of thousands.
 */
const TICK_MS = 280

/**
 * Follow the session state and swap the right maid's portrait through the
 * caller-supplied map.
 *
 * @returns A disposer that disconnects the observer, clears both timers, and
 *   restores the portrait this module replaced. Idempotent, so a repeated
 *   disposal cannot remove another activation's writes.
 */
export function installSessionArtwork(): () => void {
  const supplied = window.__dshMaidAtelierArtwork
  const thinking = supplied?.thinking
  const done = supplied?.done
  const failed = supplied?.failed
  if (thinking === undefined && done === undefined && failed === undefined) {
    // Nothing to show: never observe, so an install without portraits costs
    // nothing at all.
    return () => { /* nothing was observed or written */ }
  }

  /** The value found before this module first wrote, restored verbatim. */
  let originalSrc: string | null = null
  let observer: MutationObserver | undefined
  let tick: ReturnType<typeof setTimeout> | undefined
  let hold: ReturnType<typeof setTimeout> | undefined
  let disposed = false
  /** True between the first running row appearing and the last one settling. */
  let working = false
  /** Failure rows already on the page when the current turn started. */
  let errorBaseline = 0
  /** Portrait for the state the session is in right now, if any. */
  let live: string | undefined
  /** Portrait for the finished/failed state, held for {@link HOLD_MS}. */
  let held: string | undefined

  const portrait = (): HTMLImageElement | null =>
    document.querySelector<HTMLImageElement>(PORTRAIT_SELECTOR)

  const paint = (): void => {
    const image = portrait()
    if (image === null) return
    if (originalSrc === null) originalSrc = image.getAttribute('src')
    const next = live ?? held ?? originalSrc
    if (next === null || image.getAttribute('src') === next) return
    image.setAttribute('src', next)
  }

  const recount = (): void => {
    if (disposed) return
    const failures = document.querySelectorAll(FAILED_SELECTOR).length
    const busy = document.querySelectorAll(RUNNING_SELECTOR).length > 0
    if (busy) {
      // A new turn starts here: whatever failed earlier is history, not a
      // verdict on this turn, so the baseline is taken at this moment.
      if (!working) {
        working = true
        errorBaseline = failures
      }
      if (hold !== undefined) clearTimeout(hold)
      hold = undefined
      held = undefined
      live = failures > errorBaseline ? failed : thinking
    } else {
      live = undefined
      if (working) {
        working = false
        held = failures > errorBaseline ? failed : done
        if (hold !== undefined) clearTimeout(hold)
        hold = setTimeout(() => {
          hold = undefined
          held = undefined
          paint()
        }, HOLD_MS)
      }
    }
    paint()
  }

  observer = new MutationObserver(() => {
    if (disposed || tick !== undefined) return
    tick = setTimeout(() => {
      tick = undefined
      recount()
    }, TICK_MS)
  })
  observer.observe(document.body, {
    attributes: true,
    attributeFilter: ['data-state'],
    childList: true,
    subtree: true,
  })
  recount()

  return () => {
    disposed = true
    observer?.disconnect()
    observer = undefined
    if (tick !== undefined) clearTimeout(tick)
    if (hold !== undefined) clearTimeout(hold)
    tick = undefined
    hold = undefined
    working = false
    live = undefined
    held = undefined
    const image = portrait()
    if (image !== null && originalSrc !== null && image.getAttribute('src') !== originalSrc) {
      image.setAttribute('src', originalSrc)
    }
  }
}
