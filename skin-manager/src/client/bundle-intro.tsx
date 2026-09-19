/**
 * Localized introduction for installed bundles, served through the Plugins
 * page's `plugins.bundle.config` slot.
 *
 * That page prints a bundle's one-liner from `package.json#description` — one
 * static string per package — and localizes only the official packages it
 * hardcodes by exact npm name (`ui-plugin-manager`'s `BUILTIN_COPY`). A
 * third-party bundle cannot replace that line. The slot contract puts a
 * bundle's own content in `plugins.bundle.config`, rendered between the
 * description and the rows, so this module fills it with the same introduction
 * in the reader's language: the name and tagline each skin already declares in
 * its own `skin.json`. Nothing here names a specific skin, so every installed
 * third-party skin gets the same treatment, and a skin without a translated
 * tagline falls back to the one it has.
 */
import type { ReactNode } from 'react'
import type { SkinCatalogEntry } from '../contract.ts'
import { skinManagerCopy, useUiLang } from './locale.ts'
import css from './skin-manager.module.css'

/** The Plugins page slot a bundle's own content registers into, keyed by package name. */
export const BUNDLE_CONFIG_SLOT = 'plugins.bundle.config'

/** The manager's own package, which is a bundle on that page like any other. */
const MANAGER_PACKAGE = '@dsh-external/dsh-client-ui-skin-deep-whale-manager'

/** One entry's copy, in both languages, so the component can follow a live language switch. */
export interface BundleIntroSource {
  /** The `plugins.bundle.config` key: the bundle's package name. */
  readonly key: string
  readonly name: string
  readonly nameEn?: string | undefined
  readonly tagline?: string | undefined
  readonly taglineEn?: string | undefined
  readonly dshCompatibility?: string | undefined
}

/** The slot registry surface this module uses; the host returns a disposer from `inject`. */
export interface BundleIntroSlots {
  inject(name: string, register: () => unknown): unknown
  register(options: Record<string, unknown>, component: unknown): unknown
}

/** Props the page binds for the entry: its requested view plus this entry's copy. */
interface BundleIntroProps {
  readonly view?: 'summary' | 'page'
  readonly intro: BundleIntroSource
}

/** The skin's catalog row as an entry source. */
export function skinIntroSource(skin: SkinCatalogEntry): BundleIntroSource {
  return {
    key: skin.package,
    name: skin.name,
    ...(skin.nameEn === undefined ? {} : { nameEn: skin.nameEn }),
    ...(skin.tagline === undefined ? {} : { tagline: skin.tagline }),
    ...(skin.taglineEn === undefined ? {} : { taglineEn: skin.taglineEn }),
    ...(skin.dshCompatibility === undefined ? {} : { dshCompatibility: skin.dshCompatibility }),
  }
}

/** The manager's own entry, whose copy lives in the dictionaries rather than a skin.json. */
export function selfIntroSource(): BundleIntroSource {
  return {
    key: MANAGER_PACKAGE,
    name: skinManagerCopy('zh').selfName,
    nameEn: skinManagerCopy('en').selfName,
    tagline: skinManagerCopy('zh').selfTagline,
    taglineEn: skinManagerCopy('en').selfTagline,
  }
}

/**
 * The introduction itself: the name in the reader's language, the other name
 * demoted beside it, the tagline, and — on the full page only — where the
 * switching and customization controls are.
 */
export function BundleIntro({ view, intro }: BundleIntroProps): ReactNode {
  const lang = useUiLang()
  const copy = skinManagerCopy(lang)
  const primary = lang === 'en' && intro.nameEn !== undefined ? intro.nameEn : intro.name
  const secondary = lang === 'en'
    ? (intro.nameEn === undefined ? undefined : intro.name)
    : intro.nameEn
  const tagline = lang === 'en' ? (intro.taglineEn ?? intro.tagline) : intro.tagline
  return (
    <section className={css.intro} data-skin-intro={intro.key}>
      <p className={css.introName}>
        <span>{primary}</span>
        {secondary === undefined ? null : <span className={css.introAlt}>{secondary}</span>}
      </p>
      {tagline === undefined ? null : <p className={css.introTagline}>{tagline}</p>}
      {view === 'page' ? <p className={css.introHint}>{copy.bundleIntroHint}</p> : null}
      {view === 'page' && intro.dshCompatibility !== undefined
        ? <p className={css.introHint}>{copy.compatibility(intro.dshCompatibility)}</p>
        : null}
    </section>
  )
}

/**
 * Register one entry per installed bundle, plus the manager's own.
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
  const add = (intro: BundleIntroSource): void => {
    if (!active) return
    const disposer = slots.inject(BUNDLE_CONFIG_SLOT, () => slots.register({
      name: BUNDLE_CONFIG_SLOT,
      key: intro.key,
      inject: () => ({ intro }),
    }, BundleIntro))
    if (typeof disposer === 'function') disposers.push(disposer as () => void)
  }
  // The catalog route is the manager's own; a failure costs only this optional
  // introduction, and the settings page reports the same failure in full.
  void loadCatalog().then(
    (skins) => {
      for (const skin of skins) add(skinIntroSource(skin))
      add(selfIntroSource())
    },
    () => {},
  )
  return () => {
    active = false
    for (const dispose of disposers.splice(0)) dispose()
  }
}
