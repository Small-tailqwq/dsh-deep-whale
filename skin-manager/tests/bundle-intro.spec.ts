// @vitest-environment jsdom
/**
 * The Plugins page localizes each package's title, description and icon from
 * the package itself. These specs pin what the manager adds on top: one
 * `plugins.bundle.config` entry per installed skin that declares a verified
 * host build, in the reader's language, retracted as one activation's state.
 */
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it } from 'vitest'
import type { SkinCatalogEntry } from '../src/contract.ts'
import {
  BUNDLE_CONFIG_SLOT,
  BundleIntro,
  installBundleIntros,
  skinIntroSource,
  type BundleIntroSlots,
} from '../src/client/bundle-intro.tsx'

afterEach(() => {
  document.documentElement.lang = ''
})

const maid: SkinCatalogEntry = {
  id: 'maid-atelier',
  name: '深海女仆工坊',
  package: '@smalltailqwq/dsh-client-ui-skin-maid-atelier',
  wiringId: 'ui-skin-maid-atelier',
  bodyAttr: 'data-dsh-maid-atelier',
  dshCompatibility: '0.1.7rc1',
  order: 5,
}

/** A third-party skin that declares no verified host. */
const bare: SkinCatalogEntry = {
  id: 'deepcel',
  name: 'Deepcel',
  package: '@test/deepcel',
  wiringId: 'ui-skin-deepcel',
  bodyAttr: 'data-deepcel',
  order: 60,
}

interface Registration {
  options: Record<string, unknown>
  live: boolean
}

/** The host's slot surface: `inject` registers and returns that entry's retraction. */
function harness(): { slots: BundleIntroSlots, registrations: Registration[] } {
  const registrations: Registration[] = []
  return {
    registrations,
    slots: {
      inject: (_name: string, register: () => unknown) => {
        register()
        const entry = registrations[registrations.length - 1]
        return () => { if (entry !== undefined) entry.live = false }
      },
      register: (options: Record<string, unknown>) => {
        registrations.push({ options, live: true })
        return options
      },
    },
  }
}

const settle = (): Promise<void> => new Promise(resolve => { setTimeout(resolve, 0) })

const liveKeys = (registrations: Registration[]): unknown[] =>
  registrations.filter(entry => entry.live).map(entry => entry.options.key)

describe('bundle introductions', () => {
  it('registers only skins that declare a verified host', async () => {
    const { slots, registrations } = harness()
    installBundleIntros(slots, async () => [maid, bare])
    await settle()

    expect(registrations.map(entry => entry.options.name)).toEqual([BUNDLE_CONFIG_SLOT])
    expect(liveKeys(registrations)).toEqual(['@smalltailqwq/dsh-client-ui-skin-maid-atelier'])
    expect(skinIntroSource(bare)).toBeUndefined()
  })

  it('follows the host language', () => {
    const intro = skinIntroSource(maid)!
    document.documentElement.lang = 'zh-CN'
    expect(renderToStaticMarkup(createElement(BundleIntro, { view: 'page', intro }))).toContain('已适配 DSH 0.1.7rc1')
    document.documentElement.lang = 'en'
    expect(renderToStaticMarkup(createElement(BundleIntro, { view: 'page', intro }))).toContain('Verified on DSH 0.1.7rc1')
  })

  it('retracts every registration when the activation ends', async () => {
    const { slots, registrations } = harness()
    const dispose = installBundleIntros(slots, async () => [maid, bare])
    await settle()
    expect(liveKeys(registrations)).toHaveLength(1)

    dispose()
    expect(liveKeys(registrations)).toEqual([])
  })

  it('registers nothing when the catalog cannot be read', async () => {
    const { slots, registrations } = harness()
    // A failed read costs only this optional line; the settings page reports
    // the same failure in full.
    installBundleIntros(slots, async () => { throw new Error('route unavailable') })
    await settle()
    expect(registrations).toEqual([])
  })

  it('drops a catalog that arrives after disposal', async () => {
    const { slots, registrations } = harness()
    let release = (_skins: SkinCatalogEntry[]): void => {}
    const pending = new Promise<SkinCatalogEntry[]>((resolve) => { release = resolve })
    const dispose = installBundleIntros(slots, () => pending)
    dispose()
    release([maid])
    await settle()
    expect(registrations).toEqual([])
  })
})
