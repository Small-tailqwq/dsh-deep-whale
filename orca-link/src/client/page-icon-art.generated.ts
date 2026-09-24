import { skinAssetUrl } from './asset-url.ts'

/**
 * Generated web app manifest icons. The artwork is the skin's own
 * `PAGE_ICON_SVG` from `page-icons.ts` rasterised at 192 and 512 px, then
 * served from the package. Absolute same-origin URLs remain valid when the
 * manifest itself travels as a data: URL.
 *
 * Raster copies exist because Windows builds the installed app, taskbar and
 * start-menu icons from bitmap manifest icons. A manifest that declares only
 * `sizes: "any"` SVG leaves Edge with nothing to rasterise, and the installed
 * app falls back to the site's initial letter.
 *
 * Regenerate: rasterise that SVG at 192 and 512 px with any SVG renderer
 * (fit the 64-unit square viewBox into the square canvas) and replace the two
 * content-hashed PNG files and references below, then run the skin build.
 */

export const PAGE_ICON_192 = skinAssetUrl('06b4f9ef930386c38d4daa2c264d600bec188f58199b5b34002ecb30c7cd1962.png')

export const PAGE_ICON_512 = skinAssetUrl('1d63b2ee2d7e70678527d58d65ae382d41b2af878886e97f86002c57e313e416.png')
