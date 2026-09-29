/**
 * Package name the client loader stamps on this skin's `<style>` tags. Kept
 * beside the helper (and pinned to package.json by a test) because the loader
 * gives a bundle no way to ask for its own id.
 */
export const SKIN_PACKAGE_ID = '@smalltailqwq/dsh-client-ui-skin-maid-atelier'

/**
 * Hand back the `<style>` tags the loader claimed for this skin by mistake.
 *
 * After any plugin's factory runs, the client loader stamps every `<style>`
 * without a `data-plugin` with that plugin's id ("HMR bookkeeping"), and once
 * the plugin's effects have cleaned up it deletes every tag carrying the id.
 * A skin is reloaded or switched away far more often than any other plugin, so
 * styles other plugins inject at runtime (CSS-in-JS rule tags, lazily loaded
 * component sheets) get claimed by the skin and then deleted with it: the
 * stats pills and the conversation manager page lose their styling until a
 * refresh. The tags the bundle itself emitted carry `data-plugin-css`; anything
 * else carrying this skin's id is somebody else's, so drop the stamp and the
 * loader's sweep passes them by.
 */
export function releaseClaimedStyles(doc: Document = document, id: string = SKIN_PACKAGE_ID): void {
  const claimed = doc.querySelectorAll<HTMLStyleElement>(
    `style[data-plugin=${JSON.stringify(id)}]:not([data-plugin-css])`,
  )
  for (const style of claimed) style.removeAttribute('data-plugin')
}
