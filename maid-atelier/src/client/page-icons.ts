import type { Context } from '@deepseek-ai/cordis'
import { SLEEPY_32, DELIGHTED_32, DETERMINED_32, DELIGHTED_192, DELIGHTED_512 } from './icon-art.generated.ts'

// Module lifetime keeps the choice stable across skin toggles within this page.
const PAGE_ICON = [SLEEPY_32, DELIGHTED_32, DETERMINED_32][Math.floor(Math.random() * 3)]!

export function installMaidPageIcons(ctx: Context): void {
  const replaced: Array<{ node: HTMLLinkElement; anchor: Comment }> = []
  const owned: HTMLLinkElement[] = []
  ctx.effect(() => () => {
    for (const node of owned) node.remove()
    for (const { node, anchor } of replaced) {
      if (anchor.parentNode !== null && !node.isConnected) anchor.replaceWith(node)
      else anchor.remove()
    }
  }, 'ui-skin-maid-atelier: page icons')

  // Preserve exact positions and attributes, including adjacent host links.
  for (const node of document.head.querySelectorAll<HTMLLinkElement>('link[rel~="icon"], link[rel="manifest"]')) {
    const anchor = document.createComment('maid-atelier: host icon')
    replaced.push({ node, anchor })
    node.before(anchor)
    node.remove()
  }

  const append = (rel: string, href: string, type: string): HTMLLinkElement => {
    const node = document.createElement('link')
    owned.push(node)
    node.rel = rel
    node.href = href
    node.type = type
    node.dataset.skinChrome = rel === 'icon' ? 'favicon' : 'manifest'
    node.dataset.skinOwner = 'maid-atelier'
    document.head.append(node)
    return node
  }
  append('icon', PAGE_ICON, 'image/png').setAttribute('sizes', '32x32')

  // Official DSH apps/web/public/manifest.webmanifest fields; data manifests
  // need absolute URLs to preserve the application's identity and scope.
  const root = new URL('/', window.location.href).href
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
}
