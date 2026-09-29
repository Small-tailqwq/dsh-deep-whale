/**
 * The scene is a window-sized wallpaper (`position: fixed; inset: 0`) and the
 * character stands on the right of the frame in all four scenes (roughly 55-93%
 * of the art's width). Anything that claims the window's right edge — DSH's own
 * right sidebar, or the dock a plugin registers into it — therefore covers her
 * instead of reframing the picture, which is exactly what a wallpaper spanning
 * the whole window cannot avoid on its own.
 *
 * The scene follows the conversation column instead. This controller measures
 * how much width the column lost on its right and publishes it as
 * `--orca-scene-clip-right`, plus `data-orca-scene-clipped` while that reserve
 * is a real panel: the stylesheet ends the scene at the panel's edge, and the
 * marker switches the crop to the art's right side, where the character stands.
 * Ending the scene alone is not enough — `cover` on a narrower box centers the
 * art, which crops exactly the character.
 *
 * The column's box is the only input, so it already covers a native right
 * sidebar, a plugin's dock, or any other chrome that reserves width there, and
 * a divider drag publishes it frame by frame.
 */
const COLUMN_SELECTOR = "[class*='centerCol']"
const CLIPPED_ATTRIBUTE = 'data-orca-scene-clipped'
const CLIP_PROPERTY = '--orca-scene-clip-right'
/** A right reserve this small is the column's own scrollbar gutter, not a panel. */
const CLIPPED_MIN_PX = 16
/** Hysteresis: a reserve this small is a panel mid-drag, closing. */
const CLIPPED_RESTORE_PX = 8
/** The host replaces the conversation column on some navigations. */
const RELOCATE_MS = 1500

/**
 * Keep the scene's frame on the conversation column's right edge.
 * @param body - skin owning element (document.body); supplies the document and view.
 * @returns disposer restoring the published value, the marker and the observers.
 */
export function installOrcaSceneFit(body: HTMLElement): () => void {
  const doc = body.ownerDocument
  const view = doc.defaultView
  if (view === null) return () => {}
  const originalClip = body.style.getPropertyValue(CLIP_PROPERTY)
  let column: HTMLElement | null = null
  let observer: ResizeObserver | undefined
  let frame: number | null = null
  let clip = -1
  let clipped = false

  /** Write only the delta: every write re-matches the scene rules. */
  const publish = (reserve: number, nextClipped: boolean): void => {
    if (reserve !== clip) {
      clip = reserve
      body.style.setProperty(CLIP_PROPERTY, `${reserve}px`)
    }
    if (nextClipped !== clipped) {
      clipped = nextClipped
      if (nextClipped) body.setAttribute(CLIPPED_ATTRIBUTE, '')
      else body.removeAttribute(CLIPPED_ATTRIBUTE)
    }
  }

  const measure = (): void => {
    frame = null
    // A column that is gone, detached mid-render, or not laid out yet reserves
    // nothing; the retry below re-measures once it exists.
    const rect = column !== null && column.isConnected ? column.getBoundingClientRect() : null
    const reserve = rect === null || rect.width === 0
      ? 0
      : Math.max(0, Math.round(view.innerWidth - rect.right))
    publish(reserve, clipped ? reserve > CLIPPED_RESTORE_PX : reserve >= CLIPPED_MIN_PX)
  }

  /** One measurement per frame, however many boxes changed in it. */
  const schedule = (): void => {
    if (frame === null) frame = view.requestAnimationFrame(measure)
  }

  const locate = (): void => {
    const next = doc.querySelector<HTMLElement>(COLUMN_SELECTOR)
    // A column that is gone has to be re-measured as well: the frame it used to
    // reserve must not outlive it.
    if (next === column && next !== null) return
    observer?.disconnect()
    observer = undefined
    column = next
    if (column !== null && typeof view.ResizeObserver === 'function') {
      // The column is the measured box, so its own resize covers a panel toggle,
      // a divider drag and a window resize alike.
      observer = new view.ResizeObserver(schedule)
      observer.observe(column)
    }
    schedule()
  }

  locate()
  // A window resize changes `innerWidth` without necessarily resizing the column
  // (a panel that keeps its width while the frame shrinks), so listen as well.
  view.addEventListener('resize', schedule)
  const relocate = view.setInterval(() => {
    locate()
    schedule()
  }, RELOCATE_MS)

  return () => {
    view.removeEventListener('resize', schedule)
    view.clearInterval(relocate)
    if (frame !== null) view.cancelAnimationFrame(frame)
    frame = null
    observer?.disconnect()
    observer = undefined
    if (originalClip === '') body.style.removeProperty(CLIP_PROPERTY)
    else body.style.setProperty(CLIP_PROPERTY, originalClip)
    body.removeAttribute(CLIPPED_ATTRIBUTE)
  }
}
