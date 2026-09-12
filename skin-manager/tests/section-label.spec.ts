// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { apply } from '../src/client/index.ts'
import { skinManagerCopy } from '../src/client/locale.ts'

interface SectionOptions {
  id?: string
  label?: unknown
}

/** Run `apply` against the smallest ctx the settings section needs. */
function registerSection(): SectionOptions {
  const entries: SectionOptions[] = []
  const ctx = {
    effect: (fn: () => unknown) => fn(),
    slots: {
      inject: (_name: string, register: () => unknown) => { register() },
      register: (options: SectionOptions) => { entries.push(options); return options },
    },
  }
  apply(ctx as unknown as Parameters<typeof apply>[0])
  const entry = entries[0]
  if (entry === undefined) throw new Error('no settings section registered')
  return entry
}

const originalLanguage = window.navigator.language

afterEach(() => {
  document.documentElement.lang = ''
  Object.defineProperty(window.navigator, 'language', { value: originalLanguage, configurable: true })
})

describe('settings section label', () => {
  it('is a function, so the host can re-evaluate it on every locale revision', () => {
    document.documentElement.lang = 'zh-CN'
    expect(typeof registerSection().label).toBe('function')
  })

  it('follows the host language instead of staying on the Chinese source string', () => {
    document.documentElement.lang = 'zh-CN'
    const label = registerSection().label as () => string
    expect(label()).toBe('皮肤管理')

    document.documentElement.lang = 'en'
    expect(label()).toBe('Skins')

    // The host calls the same function again after another switch: no caching
    // of the first read, and no re-registration needed.
    document.documentElement.lang = 'zh-TW'
    expect(label()).toBe('皮肤管理')
    document.documentElement.lang = 'en-US'
    expect(label()).toBe('Skins')
  })

  it('uses a short nav label that survives the settings cell', () => {
    // The host lays the sections out as 144px cells and ellipsises the
    // overflow, so the page heading would render as "Skin Manage…". The nav
    // label is a separate, shorter string for exactly that reason.
    expect(skinManagerCopy('en').navLabel).toBe('Skins')
    expect(skinManagerCopy('en').navLabel.length).toBeLessThan(skinManagerCopy('en').headerTitle.length)
    expect(skinManagerCopy('en').navLabel.length).toBeLessThanOrEqual(12)
    expect(skinManagerCopy('zh').navLabel).toBe('皮肤管理')
  })

  it('falls back to the navigator language when <html lang> is empty', () => {
    Object.defineProperty(window.navigator, 'language', { value: 'en-GB', configurable: true })
    const label = registerSection().label as () => string
    expect(label()).toBe('Skins')
  })
})
