/**
 * `@deepseek-ai/dsh-client-ui-layout` closes its narrow sidebar only from the
 * toggle button — picking a session calls `openSession`, which never touches
 * `narrowExpanded`. On a phone the drawer therefore keeps covering the
 * conversation after a session switch, and the user has to close it by hand.
 * Mirror the toggle once the row click has been dispatched.
 *
 * The breakpoint mirrors `SIDEBAR_AUTO_COLLAPSE` in the layout package: below it
 * the collapsed column is a rail and the expanded column is an overlay, above it
 * the column is docked and must stay open.
 */
const DRAWER_AUTO_COLLAPSE = 1024
const SIDEBAR_COLUMN_SELECTOR = ":is([data-pane='sidebar'], [class*='sidebarCol'])"
const SESSION_ROW_SELECTOR = '[data-maid-session-row], [role="treeitem"][class*="sessionRow"]'
const ROW_AFFORDANCE_SELECTOR = '[role="menu"], [role="dialog"], input, textarea, [aria-haspopup]'

/**
 * Close the narrow sidebar after a session row (or the sidebar's New Session
 * button) was activated.
 * @param body - skin owning element (document.body); supplies the document and view.
 * @returns disposer removing the click listener installed here.
 */
export function installMaidMobileDrawerAutoClose(body: HTMLElement): () => void {
  const doc = body.ownerDocument
  const view = doc.defaultView
  if (view === null) return () => {}
  let pendingFrame: number | null = null

  const drawerOpen = (): boolean => view.innerWidth < DRAWER_AUTO_COLLAPSE
    && doc.querySelector('div[data-sidebar-collapsed]') === null
    && (doc.querySelector(SIDEBAR_COLUMN_SELECTOR)?.getBoundingClientRect().width ?? 0) > 0

  const closeDrawer = (): void => {
    if (!drawerOpen()) return
    doc.querySelector(SIDEBAR_COLUMN_SELECTOR)
      ?.querySelector<HTMLElement>("button[class*='toggle']")
      ?.click()
  }

  const onClick = (event: MouseEvent): void => {
    const target = event.target
    if (!(target instanceof Element)) return
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

  doc.addEventListener('click', onClick, true)
  return () => {
    doc.removeEventListener('click', onClick, true)
    if (pendingFrame !== null) view.cancelAnimationFrame(pendingFrame)
    pendingFrame = null
  }
}
