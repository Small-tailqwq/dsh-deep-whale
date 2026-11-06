/**
 * Decide when a skin switch may reload the page that requested it.
 *
 * The switch route only writes the patch. DSH applies it when its config
 * watcher sees a stable file (chokidar awaitWriteFinish, ~2 s), then streams
 * the recomposed client graph to the open page, which starts swapping skins in
 * place. A fixed 1.2 s reload therefore booted the old graph again and showed
 * old skin -> official look -> new skin. The page now reloads as soon as the
 * Host begins applying the switch (the first body-attribute change), so the new
 * skin makes its entrance once, on a page booted from the recomposed graph.
 * The desktop shell replays the boot graph captured at Host startup on every
 * reload, so there the in-place switch is kept. A timeout asks for an app
 * restart instead of replaying the old graph with a renderer reload.
 */
import type { SkinCatalogEntry } from '../contract.ts'

/** Upper bound for the Host to start applying the patch. */
export const SWITCH_SETTLE_TIMEOUT_MS = 12_000

/** Desktop-shell pages receive their boot graph through this preload bridge. */
export function isDesktopShell(target: object = window): boolean {
  return 'dshDesktopBoot' in target
}

/** Ids of the skins whose body attribute is currently present, in catalog order. */
export function activeSkins(catalog: readonly SkinCatalogEntry[], body: HTMLElement): string[] {
  return catalog.filter(skin => body.hasAttribute(skin.bodyAttr)).map(skin => skin.id)
}

/**
 * Resolve once the mounted skins satisfy `done`, checked on every change of
 * a catalog body attribute.
 * @returns false when that did not happen within the timeout.
 */
export function waitForSkins(
  catalog: readonly SkinCatalogEntry[],
  done: (active: string[]) => boolean,
  doc: Document = document,
  timeoutMs = SWITCH_SETTLE_TIMEOUT_MS,
  signal?: AbortSignal,
): Promise<boolean> {
  return new Promise((resolve) => {
    let timer: number | undefined
    const observer = new MutationObserver(() => {
      if (done(activeSkins(catalog, doc.body))) finish(true)
    })
    const abort = (): void => { finish(false) }
    const finish = (settled: boolean): void => {
      observer.disconnect()
      if (timer !== undefined) window.clearTimeout(timer)
      signal?.removeEventListener('abort', abort)
      resolve(settled)
    }
    observer.observe(doc.body, { attributes: true, attributeFilter: catalog.map(skin => skin.bodyAttr) })
    timer = window.setTimeout(() => finish(false), timeoutMs)
    signal?.addEventListener('abort', abort, { once: true })
  })
}
