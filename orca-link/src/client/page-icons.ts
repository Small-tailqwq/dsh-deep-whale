/**
 * Page icons — the tab favicon and the web app manifest that names the icon of
 * the installed app (taskbar, start menu, pinned shortcut). The host declares
 * both as static head links (`link[rel="icon"]` → /favicon.svg,
 * `link[rel="manifest"]` → /manifest.webmanifest) and a browser honours the
 * first usable declaration, so appending a skin link would leave the host icons
 * in charge. Both host nodes are replaced instead, each pinned to a comment
 * anchor so disposal puts the original back where it was.
 *
 * The replacement manifest travels as a data: URL, where relative paths cannot
 * resolve: the identity fields reuse the host values and start_url/scope are
 * made absolute against the runtime origin.
 */
const PAGE_ICON_SVG = [
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">',
  '<rect width="64" height="64" fill="#f7f9fc"/>',
  '<path d="M8 18c9 1 15 7 18 16 2-11 8-19 18-24-2 9 1 15 7 19 2-3 4-5 7-6-2 16-12 26-28 27-10 0-18-7-22-18-2-6-5-11-10-14Z" fill="#11151b"/>',
  '<rect x="43" y="26" width="4" height="4" fill="#086cff"/>',
  '</svg>',
].join('')

/** The skin's web icon, shared by the tab favicon and the web app manifest. */
const PAGE_ICON = `data:image/svg+xml;utf8,${encodeURIComponent(PAGE_ICON_SVG)}`
const MANIFEST_NAME = 'DeepSeek Harness'
const MANIFEST_SHORT_NAME = 'DSH'
const MANIFEST_DISPLAY = 'fullscreen'
const HOST_PAGE_ICON_SELECTOR = 'link[rel~="icon"], link[rel="manifest"]'
const HOST_PAGE_ICON_ANCHOR = 'orca-link: host page icon'

interface PageIconInstallation {
  users: number
  restore: () => void
}

/**
 * One installation per document, reference counted: a second activation must
 * not capture the first activation's links as if they were the host's, or the
 * last disposal would leave a skin link behind.
 */
const installations = new WeakMap<Document, PageIconInstallation>()

function mountPageIcons(doc: Document): () => void {
  const replaced: Array<{ node: HTMLLinkElement, anchor: Comment }> = []
  const owned: HTMLLinkElement[] = []
  const restore = (): void => {
    for (const node of owned) node.remove()
    for (const { node, anchor } of replaced) {
      // Restore only when the original is still detached: a host that swapped
      // its own link while the skin was active keeps its newer node.
      if (anchor.parentNode !== null && !node.isConnected) anchor.replaceWith(node)
      else anchor.remove()
    }
  }

  try {
    for (const node of doc.head.querySelectorAll<HTMLLinkElement>(HOST_PAGE_ICON_SELECTOR)) {
      const anchor = doc.createComment(HOST_PAGE_ICON_ANCHOR)
      replaced.push({ node, anchor })
      node.before(anchor)
      node.remove()
    }

    const favicon = doc.createElement('link')
    favicon.rel = 'icon'
    favicon.type = 'image/svg+xml'
    favicon.href = PAGE_ICON
    favicon.dataset.skinChrome = 'favicon'
    doc.head.append(favicon)
    owned.push(favicon)

    // Identity fields follow the host manifest so an installed app keeps its
    // name, scope and display mode; only the icons change.
    const root = new URL('/', doc.location.href).href
    const manifest = {
      id: root,
      name: MANIFEST_NAME,
      short_name: MANIFEST_SHORT_NAME,
      start_url: root,
      scope: root,
      display: MANIFEST_DISPLAY,
      icons: [{ src: PAGE_ICON, sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
    }
    const manifestLink = doc.createElement('link')
    manifestLink.rel = 'manifest'
    manifestLink.type = 'application/manifest+json'
    manifestLink.href = `data:application/manifest+json,${encodeURIComponent(JSON.stringify(manifest))}`
    manifestLink.dataset.skinChrome = 'manifest'
    doc.head.append(manifestLink)
    owned.push(manifestLink)
  } catch (error) {
    restore()
    throw error
  }
  return restore
}

/** Replace the host page icons with the skin's; returns a counted disposer. */
export function installOrcaPageIcons(): () => void {
  const doc = document
  let installation = installations.get(doc)
  if (installation === undefined) {
    installation = { users: 0, restore: mountPageIcons(doc) }
    installations.set(doc, installation)
  }
  const current = installation
  current.users += 1
  let active = true
  return () => {
    if (!active) return
    active = false
    if (--current.users > 0) return
    current.restore()
    installations.delete(doc)
  }
}
