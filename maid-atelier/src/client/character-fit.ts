/**
 * Both maids are sized against the conversation column's HEIGHT — 96% and 92%
 * of the stage, retreating to 64%/62% while a chat is on screen — so standing
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
 * them: the chat-active retreat, the phone layout, the model-exit feature, or a
 * later revision of the character rules.
 *
 * The distance comes from `offsetLeft`/`offsetWidth` — layout geometry, not
 * painted geometry. `translate` therefore never feeds back into the
 * measurement: the maid this module slides away (or the one the model-exit
 * rules slid away) keeps the box it had, the gap stays what it really is, and
 * the decision holds until the column itself changes.
 */
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
  const left = stage.querySelector<HTMLElement>(LEFT_SELECTOR)
  const right = stage.querySelector<HTMLElement>(RIGHT_SELECTOR)
  // Both maids are created with the stage, so an absent one means this is not
  // the stage shape the module drives; leave the marker alone.
  if (body === null || view === null || left === null || right === null) return () => {}

  let crowded = false
  let frame: number | null = null
  let observer: ResizeObserver | undefined

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
    // A stage that is not laid out yet — the conversation column has not
    // mounted, or it is detached mid-render — measures as 0/0 and must not
    // decide anything; the observer re-runs this once the column exists.
    if (!stage.isConnected || stage.offsetWidth === 0) return
    // Both maids are absolutely positioned in the stage, so they share an offset
    // parent and the difference of their offsets is the room between them.
    const gap = right.offsetLeft - left.offsetLeft - left.offsetWidth
    decide(crowded ? gap < RESTORE_GAP_PX : gap < CROWDED_GAP_PX)
  }

  /** One measurement per frame, however many boxes changed in it. */
  const schedule = (): void => {
    if (frame === null) frame = view.requestAnimationFrame(measure)
  }

  if (typeof view.ResizeObserver === 'function') {
    observer = new view.ResizeObserver(schedule)
    // The column's width (stage) and both maids' boxes are the only inputs: the
    // maids' height is a percentage of the column, and the chat-active retreat
    // changes it again. Anything that moves them moves one of these three.
    observer.observe(stage)
    observer.observe(left)
    observer.observe(right)
  }
  schedule()

  return () => {
    if (frame !== null) view.cancelAnimationFrame(frame)
    frame = null
    observer?.disconnect()
    observer = undefined
    decide(false)
  }
}
