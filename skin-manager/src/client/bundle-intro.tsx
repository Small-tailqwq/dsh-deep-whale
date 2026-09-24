/**
 * The verified-host line for installed skins, served through the Plugins
 * page's `plugins.bundle.config` slot.
 *
 * Since DSH 0.1.7 the page localizes each package's title, description and
 * icon from the package's own `locale/*.json` and `package.json#icon`, so the
 * name and tagline no longer need repeating here. What the page cannot know is
 * the host build a skin was last verified on (`skin.json#dshCompatibility`);
 * this module adds exactly that line to each declaring skin's detail page.
 * Nothing here names a specific skin, so any installed third-party skin gets
 * the same treatment.
 */
import type { ReactNode } from 'react'
import type { SkinCatalogEntry } from '../contract.ts'
import { skinManagerCopy, useUiLang } from './locale.ts'
import css from './skin-manager.module.css'

/** The Plugins page slot a bundle's own content registers into, keyed by package name. */
export const BUNDLE_CONFIG_SLOT = 'plugins.bundle.config'

/** One entry's source: the bundle's package name and the host build it declares. */
export interface BundleIntroSource {
  /** The `plugins.bundle.config` key: the bundle's package name. */
  readonly key: string
  readonly dshCompatibility: string
}

/** The slot registry surface this module uses; the host returns a disposer from `inject`. */
export interface BundleIntroSlots {
  inject(name: string, register: () => unknown): unknown
  register(options: Record<string, unknown>, component: unknown): unknown
}

/** Props the page binds for the entry: its requested view plus this entry's source. */
interface BundleIntroProps {
  readonly view?: 'summary' | 'page'
  readonly intro: BundleIntroSource
}

/** The skin's catalog row as an entry source, or none when it declares no verified host. */
export function skinIntroSource(skin: SkinCatalogEntry): BundleIntroSource | undefined {
  return skin.dshCompatibility === undefined ? undefined : { key: skin.package, dshCompatibility: skin.dshCompatibility }
}

/** The verified-host line, in the reader's language. */
export function BundleIntro({ intro }: BundleIntroProps): ReactNode {
  const copy = skinManagerCopy(useUiLang())
  return <p className={css.introHint} data-skin-intro={intro.key}>{copy.compatibility(intro.dshCompatibility)}</p>
}

/**
 * Register one entry per installed skin that declares a verified host.
 * @param slots - the plugin's slot registry.
 * @param loadCatalog - catalog reader, injected so tests can drive it without a route.
 * @returns the disposer retracting every registration made by this call.
 */
export function installBundleIntros(
  slots: BundleIntroSlots,
  loadCatalog: () => Promise<SkinCatalogEntry[]>,
): () => void {
  let active = true
  const disposers: Array<() => void> = []
  // The catalog route is the manager's own; a failure costs only this optional
  // line, and the settings page reports the same failure in full.
  void loadCatalog().then(
    (skins) => {
      for (const skin of skins) {
        const intro = skinIntroSource(skin)
        if (!active || intro === undefined) continue
        const disposer = slots.inject(BUNDLE_CONFIG_SLOT, () => slots.register({
          name: BUNDLE_CONFIG_SLOT,
          key: intro.key,
          inject: () => ({ intro }),
        }, BundleIntro))
        if (typeof disposer === 'function') disposers.push(disposer as () => void)
      }
    },
    () => {},
  )
  return () => {
    active = false
    for (const dispose of disposers.splice(0)) dispose()
  }
}
