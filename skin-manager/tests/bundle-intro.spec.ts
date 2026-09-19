// @vitest-environment jsdom
/**
 * The Plugins page prints a bundle's one-liner from `package.json#description`
 * and localizes only the official packages it hardcodes by npm name, so every
 * third-party bundle reads in one language there. These specs pin the answer:
 * one `plugins.bundle.config` entry per installed bundle — plus the manager's
 * own package — carrying the skin's declared name and tagline in the reader's
 * language, retracted as one activation's state.
 */
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it } from 'vitest'
import type { SkinCatalogEntry } from '../src/contract.ts'
import {
  BUNDLE_CONFIG_SLOT,
  BundleIntro,
  installBundleIntros,
  selfIntroSource,
  skinIntroSource,
  type BundleIntroSlots,
  type BundleIntroSource,
} from '../src/client/bundle-intro.tsx'

const originalLanguage = window.navigator.language

afterEach(() => {
  document.documentElement.lang = ''
  Object.defineProperty(window.navigator, 'language', { value: originalLanguage, configurable: true })
})

const maid: SkinCatalogEntry = {
  id: 'maid-atelier',
  name: '深海女仆工坊',
  nameEn: 'Abyssal Maid Atelier',
  tagline: '双女仆背景、深海蓝蕾丝界面与 Q 版侧栏',
  taglineEn: 'Twin-maid backdrop, deep-sea lace interface, and a chibi sidebar',
  package: '@dsh-external/dsh-client-ui-skin-maid-atelier',
  wiringId: 'ui-skin-maid-atelier',
  bodyAttr: 'data-dsh-maid-atelier',
  dshCompatibility: '0.1.5rc2',
  order: 5,
}

/** A third-party skin that declares no English tagline. */
const bare: SkinCatalogEntry = {
  id: 'deepcel',
  name: 'Deepcel',
  package: '@test/deepcel',
  wiringId: 'ui-skin-deepcel',
  bodyAttr: 'data-deepcel',
  tagline: '一款模仿 excel 的 dsh 皮肤',
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

const markup = (intro: BundleIntroSource, view: 'summary' | 'page'): string =>
  renderToStaticMarkup(createElement(BundleIntro, { view, intro: skinIntroSource(intro as unknown as SkinCatalogEntry) }))

describe('bundle introductions', () => {
  it('registers one entry per installed bundle plus the manager itself', async () => {
    const { slots, registrations } = harness()
    installBundleIntros(slots, async () => [maid, bare])
    await settle()

    expect(registrations.map(entry => entry.options.name)).toEqual([
      BUNDLE_CONFIG_SLOT, BUNDLE_CONFIG_SLOT, BUNDLE_CONFIG_SLOT,
    ])
    expect(liveKeys(registrations)).toEqual([
      '@dsh-external/dsh-client-ui-skin-maid-atelier',
      '@test/deepcel',
      '@dsh-external/dsh-client-ui-skin-deep-whale-manager',
    ])
  })

  it('carries only fields the skin actually declared', () => {
    expect(skinIntroSource(bare)).toEqual({
      key: '@test/deepcel',
      name: 'Deepcel',
      tagline: '一款模仿 excel 的 dsh 皮肤',
    })
    // The manager has no skin.json, so its copy comes from the dictionaries in
    // both languages, the same shape a manifest would supply.
    expect(selfIntroSource()).toEqual({
      key: '@dsh-external/dsh-client-ui-skin-deep-whale-manager',
      name: '皮肤管理器',
      nameEn: 'Skin Manager',
      tagline: '集中发现、启用与定制 DSH Web 皮肤',
      taglineEn: 'Discover, activate, and customize DSH Web skins from one place',
    })
  })

  it('follows the host language, with the other name demoted beside it', () => {
    document.documentElement.lang = 'zh-CN'
    const zh = markup(maid, 'page')
    expect(zh).toContain('深海女仆工坊')
    expect(zh).toContain('Abyssal Maid Atelier')
    expect(zh).toContain('双女仆背景、深海蓝蕾丝界面与 Q 版侧栏')
    expect(zh).toContain('切换与详细选项在「设置 → 皮肤管理」中。')
    expect(zh).toContain('已适配 DSH 0.1.5rc2')

    document.documentElement.lang = 'en'
    const en = markup(maid, 'page')
    expect(en).toContain('Abyssal Maid Atelier')
    expect(en).toContain('深海女仆工坊')
    expect(en).toContain('Twin-maid backdrop, deep-sea lace interface, and a chibi sidebar')
    expect(en).toContain('Switching and detailed options live in Settings → Skins.')
  })

  it('falls back to the declared tagline when a skin ships no translation', () => {
    document.documentElement.lang = 'en'
    expect(markup(bare, 'summary')).toContain('一款模仿 excel 的 dsh 皮肤')
  })

  it('keeps the settings pointer on the page view only', () => {
    document.documentElement.lang = 'en'
    expect(markup(maid, 'page')).toContain('Settings → Skins')
    expect(markup(maid, 'summary')).not.toContain('Settings → Skins')
  })

  it('retracts every registration when the activation ends', async () => {
    const { slots, registrations } = harness()
    const dispose = installBundleIntros(slots, async () => [maid, bare])
    await settle()
    expect(liveKeys(registrations)).toHaveLength(3)

    dispose()
    expect(liveKeys(registrations)).toEqual([])
  })

  it('registers nothing when the catalog cannot be read', async () => {
    const { slots, registrations } = harness()
    // A failed read costs only this optional introduction; the settings page
    // reports the same failure in full.
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
