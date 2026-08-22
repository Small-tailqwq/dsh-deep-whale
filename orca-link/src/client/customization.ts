import {
  exposeSkinCustomization,
  SKIN_CUSTOMIZATION_PROTOCOL,
  SkinAttributeProjector,
  type SkinCustomizationState,
} from '../../../skin-manager/src/protocol.ts'

/** ORCA LINK owns the attributes produced from its declared controls. */
export function installOrcaCustomization(root: HTMLElement = document.documentElement): () => void {
  const projector = new SkinAttributeProjector(root)
  const apply = (state: SkinCustomizationState | null): void => {
    if (state === null) {
      projector.release()
      return
    }
    const scheduleVisible = state.visibility.sfwMode !== false
    projector.set('data-dsh-whale-orca-background', state.values.background === true ? 'visible' : 'hidden')
    projector.set('data-dsh-whale-orca-pricing', state.values.pricingLight === true ? 'visible' : 'hidden')
    projector.set('data-dsh-whale-orca-art', scheduleVisible ? 'visible' : 'hidden')
    // The SFW schedule owns the whole second-dimension presentation: during
    // its hidden window the corner character retires with the scene art, even
    // when the standalone character switch is on. Re-applying after the
    // schedule turns visible restores the switch's own verdict.
    projector.set(
      'data-dsh-whale-orca-character',
      state.values.character === true && scheduleVisible ? 'visible' : 'hidden',
    )
  }

  return exposeSkinCustomization({
    protocol: SKIN_CUSTOMIZATION_PROTOCOL,
    skinId: 'orca-link',
    title: 'ORCA LINK',
    settings: [
      { key: 'character', type: 'boolean', label: '显示左上角状态小人', defaultValue: true },
      { key: 'background', type: 'boolean', label: '显示背景', defaultValue: true },
      { key: 'pricingLight', type: 'boolean', label: '显示红绿灯定价指示', defaultValue: true },
      {
        key: 'sfwMode',
        type: 'visibility-schedule',
        label: '不那么二次元模式',
        description: '按本机时间控制场景立绘与左上角小人的显示与隐藏。',
        defaultValue: { enabled: false, outside: 'visible', ranges: [] },
      },
    ],
    apply,
  })
}
