/** Browser half: one official settings section plus the shared preference runtime. */
import type { Context } from '@deepseek-ai/cordis'
import type { SkinCatalogEntry } from '../contract.ts'
import { SkinManager, requestSkinSwitch } from './SkinManager.tsx'
import { PreferencesStore } from './preferences.ts'
import { SkinCustomizationRegistry } from './runtime.ts'
import './skin-manager.module.css'

interface SlotsContext extends Context {
  slots: {
    inject(name: string, register: () => unknown): void
    register(options: Record<string, unknown>, component: unknown): unknown
  }
}

export const inject = ['slots']

function activeSkin(catalog: SkinCatalogEntry[]): string {
  const active = catalog.find(skin => document.body.hasAttribute(skin.bodyAttr))
  if (active !== undefined) return active.id
  return 'official'
}

/** Register settings and the generic customization registry with owned cleanup. */
export function apply(ctx: SlotsContext): void {
  const store = new PreferencesStore()
  const registry = new SkinCustomizationRegistry(store)
  ctx.effect(() => () => registry.dispose(), 'ui-skin-manager: customization registry')
  ctx.slots.inject('settings.section', () => ctx.slots.register({
    name: 'settings.section',
    id: 'dsh-skins',
    order: 115,
    label: '皮肤管理',
    inject: () => ({ registry, active: activeSkin, switchSkin: requestSkinSwitch }),
  }, SkinManager))
}
