// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { createPresetPluginIcons } from '../src/client/preset-plugin-icons.ts'
import { PreferencesStore } from '../src/client/preferences.ts'
import { SkinCustomizationRegistry } from '../src/client/runtime.ts'
import { buildPreferencesExport, importPreferencesFromText, serializePreferencesExport } from '../src/client/transfer.ts'

const enabled = { values: { presetPluginIcons: true }, visibility: {} }
const cleanups: Array<() => void> = []
afterEach(() => {
  cleanups.reverse().forEach(cleanup => cleanup())
  cleanups.length = 0
  document.body.innerHTML = ''
  localStorage.clear()
  vi.restoreAllMocks()
})

describe('preset plugin icons', () => {
  it('defaults to native icons and persists and restores the opt-in through the existing backup', () => {
    const registry = new SkinCustomizationRegistry(new PreferencesStore(localStorage, window))
    const definition = createPresetPluginIcons()
    const disconnect = registry.registerLocal(definition)
    cleanups.push(() => { disconnect(); registry.dispose() })
    expect(registry.values(definition).presetPluginIcons).toBe(false)
    expect(document.querySelector('[data-skin-manager-preset-icons]')).toBeNull()
    registry.set(definition, 'presetPluginIcons', true)
    const style = document.querySelector('[data-skin-manager-preset-icons]')
    expect(style).not.toBeNull()
    expect(style?.getAttribute('data-plugin')).toBe('@smalltailqwq/dsh-client-ui-skin-deep-whale-manager')
    const exported = serializePreferencesExport(buildPreferencesExport(registry.exportPreferences()))
    registry.set(definition, 'presetPluginIcons', false)
    expect(style?.isConnected).toBe(false)
    registry.importPreferences(importPreferencesFromText(exported, [definition]).preferences)
    expect(registry.values(definition).presetPluginIcons).toBe(true)
    registry.removeUnregisteredSkins()
    expect(Object.keys(registry.exportPreferences())).toEqual(['dsh-skin-manager'])
    expect(registry.values(definition).presetPluginIcons).toBe(true)
    const restored = new PreferencesStore(localStorage, window)
    cleanups.push(() => restored.dispose())
    expect(restored.values(definition).presetPluginIcons).toBe(true)
  })

  it('matches the official card and detail owners without touching nested or unknown plugins', () => {
    // DSH ddac96760b6e: CardHead, DetailTop, PackageCard and ItemCard.
    document.body.innerHTML = `
      <li data-plugin-item="shell"><div class="host_cardHead"><span class="host_cardIcon" id="shell"><svg></svg></span></div></li>
      <li data-plugin-package="@deepseek-ai/dsh-experimental-voice-input-bundle"><div class="host_cardHead"><span class="host_cardIcon" id="voice"><img src="/voice.svg"></span></div></li>
      <li data-plugin-package="@deepseek-ai/dsh-deepseek-chat-import"><div class="host_cardHead"><span class="host_cardIcon" id="chat-import"><img src="/chat-import.svg"></span></div></li>
      <div data-plugin-detail="@deepseek-ai/dsh-cua-bundle"><div class="host_detailTop"><div class="host_detailHead"><span class="host_cardIcon" id="cua"><img src="/cua.svg"></span></div></div></div>
      <div data-plugin-detail="@deepseek-ai/dsh-subagent-codex"><div class="host_detailTop"><div class="host_detailHead"><span class="host_cardIcon" id="codex"><img src="/codex.svg"></span></div></div>
        <li data-plugin-package="third-party"><div class="host_cardHead"><span class="host_cardIcon" id="nested"><svg></svg></span></div></li>
      </div>
      <div data-plugin-item-detail="web-search"><div class="host_detailTop"><div class="host_detailHead"><span class="host_cardIcon" id="search"><svg></svg></span></div></div></div>
      <li data-plugin-package="third-party"><div class="host_cardHead"><span class="host_cardIcon" id="unknown"><svg></svg></span></div></li>`
    const original = document.body.innerHTML
    document.body.setAttribute('data-dsh-orca-link', '')
    const skinStyle = document.createElement('style')
    skinStyle.textContent = readFileSync(resolve('../orca-link/src/client/plugin-icons.generated.module.css'), 'utf8')
    document.head.append(skinStyle)
    cleanups.push(() => { skinStyle.remove(); document.body.removeAttribute('data-dsh-orca-link') })
    const definition = createPresetPluginIcons()
    cleanups.push(() => definition.apply(null))
    definition.apply(enabled)
    const rules = [...skinStyle.sheet!.cssRules] as CSSStyleRule[]
    for (const id of ['shell', 'voice', 'chat-import', 'cua', 'codex', 'search']) {
      const target = document.getElementById(id)!
      expect(rules.some(rule => rule.style.getPropertyValue('--dsh-preset-plugin-icon') && target.matches(rule.selectorText)), id).toBe(true)
    }
    for (const id of ['nested', 'unknown']) {
      const target = document.getElementById(id)!
      expect(rules.some(rule => rule.style.getPropertyValue('--dsh-preset-plugin-icon') && target.matches(rule.selectorText)), id).toBe(false)
    }
    definition.apply(null)
    expect(document.body.innerHTML).toBe(original)
  })

  it.each(['maid-atelier', 'orca-link'])('embeds the original %s SVG bytes in the active skin stylesheet', skin => {
    const root = resolve('..', skin)
    const css = readFileSync(join(root, 'src/client/plugin-icons.generated.module.css'), 'utf8')
    const match = css.match(/data-plugin-package="@deepseek-ai\/dsh-experimental-voice-input-bundle"[^\n]+url\("data:image\/svg\+xml,([^"\n]+)"\)/)
    expect(match).not.toBeNull()
    expect(decodeURIComponent(match![1]!)).toBe(readFileSync(join(root, 'assets/plugin-icons/voice-input.svg'), 'utf8'))
  })

  it('reuses its own stylesheet and releases only its own activation', () => {
    const first = createPresetPluginIcons()
    const second = createPresetPluginIcons()
    cleanups.push(() => { first.apply(null); second.apply(null) })
    first.apply(enabled)
    first.apply(enabled)
    second.apply(enabled)
    expect(document.querySelectorAll('[data-skin-manager-preset-icons]')).toHaveLength(2)
    first.apply(null)
    expect(document.querySelectorAll('[data-skin-manager-preset-icons]')).toHaveLength(1)
    second.apply(null)
    expect(document.querySelector('[data-skin-manager-preset-icons]')).toBeNull()
  })

  it('keeps the next manager activation active when the previous registry is disposed', () => {
    const first = new SkinCustomizationRegistry(new PreferencesStore(localStorage, window))
    const second = new SkinCustomizationRegistry(new PreferencesStore(localStorage, window))
    const firstDefinition = createPresetPluginIcons()
    const secondDefinition = createPresetPluginIcons()
    first.registerLocal(firstDefinition)
    second.registerLocal(secondDefinition)
    cleanups.push(() => { first.dispose(); second.dispose() })
    first.set(firstDefinition, 'presetPluginIcons', true)
    second.set(secondDefinition, 'presetPluginIcons', true)
    expect(document.querySelectorAll('[data-skin-manager-preset-icons]')).toHaveLength(2)
    first.dispose()
    expect(document.querySelectorAll('[data-skin-manager-preset-icons]')).toHaveLength(1)
    expect(second.values(secondDefinition).presetPluginIcons).toBe(true)
  })

  it('releases the stylesheet after a partially failed insertion', () => {
    const definition = createPresetPluginIcons()
    cleanups.push(() => definition.apply(null))
    const append = document.head.append
    vi.spyOn(document.head, 'append').mockImplementation((...nodes) => {
      append.apply(document.head, nodes)
      throw new Error('style insertion failed')
    })
    expect(() => definition.apply(enabled)).toThrow('style insertion failed')
    definition.apply(null)
    expect(document.querySelector('[data-skin-manager-preset-icons]')).toBeNull()
  })
})
