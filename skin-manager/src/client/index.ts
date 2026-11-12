/** Browser half: one official settings section plus the shared preference runtime. */
import type { Context } from '@deepseek-ai/cordis'
import type { SkinCatalogEntry } from '../contract.ts'
import { SkinManager, fetchSkinCatalog, requestSkinSwitch } from './SkinManager.tsx'
import { installBundleIntros } from './bundle-intro.tsx'
import { installPanelToggle, type PanelLayout } from './panel-toggle.ts'
import { currentUiLang, skinManagerCopy } from './locale.ts'
import { PreferencesStore } from './preferences.ts'
import { SkinCustomizationRegistry } from './runtime.ts'
import { createPresetPluginIcons } from './preset-plugin-icons.ts'
import { activeSkins } from './switch-settle.ts'
import './skin-manager.module.css'

interface SlotsContext extends Context {
  slots: {
    inject(name: string, register: () => unknown): unknown
    register(options: Record<string, unknown>, component: unknown): unknown
  }
}

export const inject = ['slots']

function activeSkin(catalog: SkinCatalogEntry[]): string | null {
  const active = activeSkins(catalog, document.body)
  return active.length > 1 ? null : active[0] ?? 'official'
}

/** Register settings and the generic customization registry with owned cleanup. */
export function apply(ctx: SlotsContext): void {
  const store = new PreferencesStore()
  const registry = new SkinCustomizationRegistry(store)
  const switching = new AbortController()
  ctx.effect(() => () => switching.abort(), 'ui-skin-manager: skin switching')
  ctx.effect(() => () => {
    registry.dispose()
  }, 'ui-skin-manager: customization registry')
  ctx.effect(() => registry.registerLocal(createPresetPluginIcons()), 'ui-skin-manager: preset plugin icons')
  ctx.slots.inject('settings.section', () => ctx.slots.register({
    name: 'settings.section',
    id: 'dsh-skins',
    order: 115,
    // A label the host calls during render, so the settings nav follows the
    // host language instead of staying on the Chinese source string. The host
    // re-invokes it on every locale revision, which is when this re-reads
    // <html lang>; the page itself follows through `useUiLang`. The nav cell is
    // narrow and ellipsises, hence the dedicated short `navLabel`.
    label: () => skinManagerCopy(currentUiLang()).navLabel,
    inject: () => ({ registry, active: activeSkin, switchSkin: (target: string, acceptRisk?: boolean) => requestSkinSwitch(target, acceptRisk, switching.signal) }),
  }, SkinManager))

  // Bundle introductions add the host build each skin declares as verified.
  ctx.effect(() => installBundleIntros(ctx.slots, fetchSkinCatalog), 'ui-skin-manager: bundle introductions')

  // Narrow frames have no way back from a global panel but the drawer's
  // session list; a second tap on the active entry returns to the conversation.
  ctx.effect(() => installPanelToggle(document, () => (ctx as unknown as { get(name: string): unknown }).get('layout') as PanelLayout | undefined),
    'ui-skin-manager: narrow panel toggle')
}
