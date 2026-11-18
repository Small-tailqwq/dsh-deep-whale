/**
 * Both maids are sized against the conversation column's HEIGHT — 96% and 92%
 * of the stage, retreating to 64%/62% in an active conversation — so standing
 * side by side they need 0.556 + 0.526 of that height in WIDTH, the maids'
 * intrinsic ratios. That is about 1.08 x the column's height: true on a
 * full-width desktop column, and false as soon as something narrows the column
 * without shortening it. An open right sidebar does exactly that (the native
 * one, or the tabs a plugin registers into it), the pair ends up wider than the
 * column, and the two figures overlap in the middle.
 *
 * Every narrow-layout rule the skin already has reads the VIEWPORT
 * (`window.innerWidth`, `@media (max-width: 700px / 1080px)`), and a narrower
 * column leaves the viewport untouched, so none of them can fire here. This
 * module measures the two boxes instead, which is exact for whatever produced
 * them: the active-conversation retreat, the phone layout, the model-exit feature, or a
 * later revision of the character rules.
 *
 * The available span shares the figures' CSS insets. ResizeObserver gives us
 * the span and figure widths from completed layout, so a frame callback can
 * decide whether they fit without forcing layout. Translation leaves those
 * widths intact when a figure slides offscreen.
 */
const SPAN_SELECTOR = "[data-skin-chrome='character-span']"
const LEFT_SELECTOR = "[data-maid-character='left']"
const RIGHT_SELECTOR = "[data-maid-character='right']"
/** Body marker the stylesheet's `character-fit` rules are scoped on. */
const CROWDED_ATTRIBUTE = 'data-maid-figures-crowded'
/** Leave this much room between the two boxes before one maid slides away. */
const CROWDED_GAP_PX = 32
/** Take it back only once the pair has this much room again, so a dragged column cannot flicker. */
const RESTORE_GAP_PX = 96

/**
 * Mark the body while the two maids no longer fit side by side in the
 * conversation column, and clear it once they do.
 * @param stage - skin-owned character stage holding both maids.
 * @returns disposer retracting the marker and every observer installed here.
 */
export function installMaidCharacterFit(stage: HTMLElement): () => void {
  const body = stage.ownerDocument.body
  const view = stage.ownerDocument.defaultView
  const span = stage.querySelector<HTMLElement>(SPAN_SELECTOR)
  const left = stage.querySelector<HTMLElement>(LEFT_SELECTOR)
  const right = stage.querySelector<HTMLElement>(RIGHT_SELECTOR)
  // Both maids are created with the stage, so an absent one means this is not
  // the stage shape the module drives; leave the marker alone.
  if (body === null || view === null || span === null || left === null || right === null) return () => {}

  let crowded = false
  let frame: number | null = null
  let observer: ResizeObserver | undefined
  const widths = new Map<Element, number>()

  const decide = (next: boolean): void => {
    // A same-value write is still a mutation record every `body[...]` rule pays
    // for, so only the delta is written.
    if (next === crowded) return
    crowded = next
    if (next) body.setAttribute(CROWDED_ATTRIBUTE, '')
    else body.removeAttribute(CROWDED_ATTRIBUTE)
  }

  const measure = (): void => {
    frame = null
    if (!stage.isConnected) return
    const available = widths.get(span)
    const leftWidth = widths.get(left)
    const rightWidth = widths.get(right)
    if (available === undefined || available === 0 || leftWidth === undefined || rightWidth === undefined) return
    const gap = available - leftWidth - rightWidth
    decide(crowded ? gap < RESTORE_GAP_PX : gap < CROWDED_GAP_PX)
  }

  /** One measurement per frame, however many boxes changed in it. */
  const schedule = (): void => {
    if (frame === null) frame = view.requestAnimationFrame(measure)
  }

  const dispose = (): void => {
    if (frame !== null) view.cancelAnimationFrame(frame)
    frame = null
    observer?.disconnect()
    decide(false)
  }

  try {
    if (typeof view.ResizeObserver === 'function') {
      observer = new view.ResizeObserver(entries => {
        for (const entry of entries) widths.set(entry.target, entry.contentRect.width)
        schedule()
      })
      observer.observe(span)
      observer.observe(left)
      observer.observe(right)
    } else {
      frame = view.requestAnimationFrame(() => {
        if (!stage.isConnected || stage.offsetWidth === 0) {
          frame = null
          return
        }
        widths.set(span, span.offsetWidth)
        widths.set(left, left.offsetWidth)
        widths.set(right, right.offsetWidth)
        measure()
      })
    }
  } catch (error) {
    dispose()
    throw error
  }
  return dispose
}
