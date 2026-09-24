/**
 * Tap the active sidebar panel entry again to return to the conversation.
 *
 * On a narrow frame the host shows a global panel (Plugins) in place of the
 * conversation with no close control, and the session list sits in the
 * collapsed drawer, so getting back to the same conversation takes three taps.
 * The host's own `layout.selectPanel(null)` returns to the current session
 * without changing it; this module only calls it when the tapped entry was
 * already the active one. Wide frames keep the host's behaviour untouched.
 */

/** The host's narrow-frame breakpoint (ui-layout `SIDEBAR_AUTO_COLLAPSE`). */
export const NARROW_FRAME_WIDTH = 1024

/** The part of the host's `ctx.layout` this module calls. */
export interface PanelLayout {
  selectPanel(panelId: null): void
}

/** The sidebar entry of a global panel: the button wrapping its `sidebar.panellist` glyph. */
function panelEntry(target: EventTarget | null): Element | null {
  const button = target instanceof Element ? target.closest('button') : null
  return button?.querySelector("[data-slot='sidebar.panellist']") ? button : null
}

/**
 * @param doc - the page document.
 * @param layout - reads the host layout service at tap time; undefined leaves the tap to the host.
 * @returns the disposer removing both listeners.
 */
export function installPanelToggle(doc: Document, layout: () => PanelLayout | undefined): () => void {
  // React settles the host's own selection before a document bubble listener
  // runs, so "was it already open" is read in the capture phase.
  let reopened: Element | null = null
  const capture = (event: MouseEvent): void => {
    const entry = panelEntry(event.target)
    const narrow = (doc.defaultView?.innerWidth ?? Infinity) < NARROW_FRAME_WIDTH
    reopened = entry !== null && narrow && entry.getAttribute('aria-current') === 'page' ? entry : null
  }
  const bubble = (event: MouseEvent): void => {
    const entry = reopened
    reopened = null
    if (entry === null || panelEntry(event.target) !== entry) return
    layout()?.selectPanel(null)
  }
  doc.addEventListener('click', capture, true)
  doc.addEventListener('click', bubble)
  return () => {
    doc.removeEventListener('click', capture, true)
    doc.removeEventListener('click', bubble)
  }
}
