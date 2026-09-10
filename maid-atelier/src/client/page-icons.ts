import type { Context } from '@deepseek-ai/cordis'
import { SLEEPY_32, DELIGHTED_32, DETERMINED_32, DELIGHTED_192, DELIGHTED_512 } from './icon-art.generated.ts'

// Module lifetime keeps the choice stable across skin toggles within this page.
const PAGE_ICON = [SLEEPY_32, DELIGHTED_32, DETERMINED_32][Math.floor(Math.random() * 3)]!
const installations = new WeakMap<Document, { users: number, restore: () => void }>()

export function installMaidPageIcons(ctx: Context): void {
  ctx.effect(() => {
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
  }, 'ui-skin-maid-atelier: page icons')
}

function mountPageIcons(doc: Document): () => void {
  const replaced: Array<{ node: HTMLLinkElement; anchor: Comment }> = []
  const owned: HTMLLinkElement[] = []
  const restore = (): void => {
    for (const node of owned) node.remove()
    for (const { node, anchor } of replaced) {
      if (anchor.parentNode !== null && !node.isConnected) anchor.replaceWith(node)
      else anchor.remove()
    }
  }

  try {
    // Preserve exact positions and attributes, including adjacent host links.
    for (const node of doc.head.querySelectorAll<HTMLLinkElement>('link[rel~="icon"], link[rel="manifest"]')) {
      const anchor = doc.createComment('maid-atelier: host icon')
      replaced.push({ node, anchor })
      node.before(anchor)
      node.remove()
    }

    const append = (rel: string, href: string, type: string): HTMLLinkElement => {
      const node = doc.createElement('link')
      owned.push(node)
      node.rel = rel
      node.href = href
      node.type = type
      node.dataset.skinChrome = rel === 'icon' ? 'favicon' : 'manifest'
      node.dataset.skinOwner = 'maid-atelier'
      doc.head.append(node)
      return node
    }
    append('icon', PAGE_ICON, 'image/png').setAttribute('sizes', '32x32')

    // Official DSH apps/web/public/manifest.webmanifest fields; data manifests
    // need absolute URLs to preserve the application's identity and scope.
    const root = new URL('/', doc.location.href).href
    const manifest = {
      id: root,
      name: 'DeepSeek Harness',
      short_name: 'DSH',
      start_url: root,
      scope: root,
      display: 'fullscreen',
      icons: [
        { src: DELIGHTED_192, sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: DELIGHTED_512, sizes: '512x512', type: 'image/png', purpose: 'any' },
      ],
    }
    append('manifest', `data:application/manifest+json,${encodeURIComponent(JSON.stringify(manifest))}`, 'application/manifest+json')
  } catch (error) {
    restore()
    throw error
  }
  return restore
}
