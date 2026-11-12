import { SKIN_CUSTOMIZATION_PROTOCOL, type SkinCustomizationDefinition } from '../protocol.ts'

/** The active skin supplies its artwork; the manager owns only the opt-in. */
export function createPresetPluginIcons(doc: Document = document): SkinCustomizationDefinition {
  let style: HTMLStyleElement | undefined
  return {
    protocol: SKIN_CUSTOMIZATION_PROTOCOL,
    skinId: 'dsh-skin-manager',
    title: '插件图标',
    titleEn: 'Plugin icons',
    settings: [{ key: 'presetPluginIcons', type: 'boolean', label: '使用皮肤预设图标', labelEn: 'Use skin preset icons', defaultValue: false }],
    apply(state) {
      if (state?.values.presetPluginIcons !== true) {
        style?.remove()
        style = undefined
      } else if (style === undefined) {
        style = doc.createElement('style')
        // The host's loader must not adopt this runtime stylesheet for another plugin.
        style.setAttribute('data-plugin', '@smalltailqwq/dsh-client-ui-skin-deep-whale-manager')
        style.setAttribute('data-skin-manager-preset-icons', '')
        style.textContent = ':root{--dsh-preset-plugin-native:hidden;--dsh-preset-plugin-display:block}'
        doc.head.append(style)
      }
    },
  }
}
