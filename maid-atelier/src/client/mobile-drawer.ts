/**
 * `@deepseek-ai/dsh-client-ui-layout` closes its narrow sidebar only from the
 * toggle button. Two gestures a phone user expects are therefore missing:
 *
 * 1. picking a session calls `openSession`, which never touches
 *    `narrowExpanded`, so the drawer keeps covering the conversation after a
 *    session switch and has to be closed by hand;
 * 2. tapping outside the open drawer does nothing at all — the host's
 *    `overlayLayer` is only an overlay container (`pointer-events: none`, no
 *    handler), not a scrim, so the drawer stays up until the toggle is found
 *    again.
 *
 * Both are mirrored here: a row activation closes the overlay on the next
 * frame, and a pointer that lands outside the open column dismisses it. The tap
 * that dismisses is then swallowed, because on a phone the control behind the
 * drawer is usually the composer — and its send button sits exactly in the
 * corner a reader aims at when dismissing.
 *
 * A settings dialog opened from the drawer is deliberately *not* a dismissal:
 * closing one surface must not close another the reader opened. The drawer
 * stays where it was and the dialog closes on its own.
 *
 * The breakpoint mirrors `SIDEBAR_AUTO_COLLAPSE` in the layout package: below it
 * the collapsed column is a rail and the expanded column is an overlay, above it
 * the column is docked and must stay open.
 */
const DRAWER_AUTO_COLLAPSE = 1024
const SIDEBAR_COLUMN_SELECTOR = ":is([data-pane='sidebar'], [class*='sidebarCol'])"
const SESSION_ROW_SELECTOR = '[data-maid-session-row], [role="treeitem"][class*="sessionRow"]'
const ROW_AFFORDANCE_SELECTOR = '[role="menu"], [role="dialog"], input, textarea, [aria-haspopup]'
/** Popups own the tap that dismisses them, so the drawer waits its turn. */
const OPEN_POPUP_SELECTOR = [
  '[role="menu"]',
  '[role="listbox"]',
  '[role="dialog"]',
  '[aria-modal="true"]',
  '[data-radix-popper-content-wrapper]',
  '[data-floating-ui-portal]',
].join(',')
/** The host's resize handle is a drag, not a dismissal. */
const DRAG_HANDLE_SELECTOR = "[class*='handle']"
/** How long a dismissing pointer keeps swallowing the click it produced. */
const SWALLOW_WINDOW_MS = 400

/**
 * Close the narrow sidebar when a session row (or the sidebar's New Session
 * button) is activated, and when a tap lands outside the open drawer.
 * @param body - skin owning element (document.body); supplies the document and view.
 * @returns disposer removing the listeners installed here.
 */
export function installMaidMobileDrawerAutoClose(body: HTMLElement): () => void {
  const doc = body.ownerDocument
  const view = doc.defaultView
  if (view === null) return () => {}
  let pendingFrame: number | null = null
  let swallowTimer: ReturnType<typeof setTimeout> | null = null

  const drawerOpen = (): boolean => view.innerWidth < DRAWER_AUTO_COLLAPSE
    && doc.querySelector('div[data-sidebar-collapsed]') === null
    && (doc.querySelector(SIDEBAR_COLUMN_SELECTOR)?.getBoundingClientRect().width ?? 0) > 0

  const closeDrawer = (): void => {
    if (!drawerOpen()) return
    doc.querySelector(SIDEBAR_COLUMN_SELECTOR)
      ?.querySelector<HTMLElement>("button[class*='toggle']")
      ?.click()
  }

  /** Gestures that keep the drawer open: its own chrome, a popup, a drag handle. */
  const ownsGesture = (target: Element): boolean => target.closest(SIDEBAR_COLUMN_SELECTOR) !== null
    || target.closest(ROW_AFFORDANCE_SELECTOR) !== null
    || target.closest(DRAG_HANDLE_SELECTOR) !== null
    || doc.querySelector(OPEN_POPUP_SELECTOR) !== null

  /** Dismiss the drawer for a gesture outside it; true when it was open to close. */
  const dismissOutside = (target: Element): boolean => {
    if (!drawerOpen() || ownsGesture(target)) return false
    closeDrawer()
    return true
  }

  const armSwallow = (): void => {
    if (swallowTimer !== null) clearTimeout(swallowTimer)
    swallowTimer = setTimeout(() => { swallowTimer = null }, SWALLOW_WINDOW_MS)
  }

  const releaseSwallow = (): boolean => {
    if (swallowTimer === null) return false
    clearTimeout(swallowTimer)
    swallowTimer = null
    return true
  }

  const onPointerDown = (event: PointerEvent): void => {
    // Secondary buttons and extra touches during a pinch are not dismissals.
    if (event.isPrimary === false || event.button > 0) return
    const target = event.target
    if (!(target instanceof Element) || !dismissOutside(target)) return
    armSwallow()
  }

  const onMouseDown = (event: MouseEvent): void => {
    // Cancelling the default focus keeps a dismissing tap from raising the phone
    // keyboard on the composer behind the drawer.
    if (swallowTimer !== null) event.preventDefault()
  }

  const onClick = (event: MouseEvent): void => {
    const target = event.target
    if (!(target instanceof Element)) return

    // The pointerdown that dismissed the drawer already did the work: swallow the
    // click it produced so it cannot activate the control behind the overlay.
    if (releaseSwallow()) {
      event.preventDefault()
      event.stopPropagation()
      return
    }

    // Synthetic clicks (no pointerdown) still dismiss; for a real pointer the
    // drawer is already closed by now, so this is a no-op.
    if (drawerOpen() && dismissOutside(target)) return

    // Row-internal affordances (overflow menu, inline rename, popovers) own the
    // gesture and keep the drawer open.
    if (target.closest(ROW_AFFORDANCE_SELECTOR) !== null) return
    const row = target.closest(SESSION_ROW_SELECTOR)
    const newSession = target.closest<HTMLElement>("button[class*='newSession']")
    if (row === null && newSession === null) return
    if (target.closest(SIDEBAR_COLUMN_SELECTOR) === null) return
    // A row carries a nested "Session actions" control that has no aria-haspopup,
    // so it is recognised structurally instead.
    const control = target.closest('button, [role="button"], a')
    if (control !== null && row !== null && control !== row && row.contains(control)) return
    if (!drawerOpen() || pendingFrame !== null) return
    // Let the host apply the selection first, then close the overlay.
    pendingFrame = view.requestAnimationFrame(() => {
      pendingFrame = null
      closeDrawer()
    })
  }

  doc.addEventListener('pointerdown', onPointerDown, true)
  doc.addEventListener('mousedown', onMouseDown, true)
  doc.addEventListener('click', onClick, true)
  return () => {
    doc.removeEventListener('pointerdown', onPointerDown, true)
    doc.removeEventListener('mousedown', onMouseDown, true)
    doc.removeEventListener('click', onClick, true)
    if (pendingFrame !== null) view.cancelAnimationFrame(pendingFrame)
    pendingFrame = null
    releaseSwallow()
  }
}
