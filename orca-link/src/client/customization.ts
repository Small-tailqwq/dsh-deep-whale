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
    projector.set(
      'data-dsh-whale-orca-character-mirror',
      state.values.mirrorCharacter === true ? 'mirrored' : 'original',
    )
    projector.set(
      'data-dsh-whale-orca-settings-layout',
      state.values.centerSettings === true ? 'centered' : 'docked',
    )
  }

  return exposeSkinCustomization({
    protocol: SKIN_CUSTOMIZATION_PROTOCOL,
    skinId: 'orca-link',
    title: 'ORCA LINK',
    settings: [
      {
        key: 'character',
        type: 'boolean',
        label: '显示左上角状态小人',
        labelEn: 'Show the corner status character',
        defaultValue: true,
      },
      {
        key: 'mirrorCharacter',
        type: 'boolean',
        label: '镜像左上角状态小人',
        labelEn: 'Mirror the corner status character',
        description: '左右翻转角色动画，方便调整鼠标与键盘手位。',
        descriptionEn: 'Flip the character animation horizontally to match your mouse and keyboard hand position.',
        defaultValue: false,
      },
      {
        key: 'background',
        type: 'boolean',
        label: '显示背景',
        labelEn: 'Show the background',
        defaultValue: true,
      },
      {
        key: 'pricingLight',
        type: 'boolean',
        label: '显示红绿灯定价指示',
        labelEn: 'Show the pricing traffic light',
        defaultValue: true,
      },
      {
        key: 'centerSettings',
        type: 'boolean',
        label: '设置界面居中',
        labelEn: 'Center the settings panel',
        description: '在宽阔视口中将设置面板放在屏幕中央；窄视口仍使用全屏布局。',
        descriptionEn: 'Place the settings panel in the center on large viewports; constrained viewports remain full-screen.',
        defaultValue: false,
      },
      {
        key: 'sfwMode',
        type: 'visibility-schedule',
        label: '不那么二次元模式',
        labelEn: 'Not-so-anime mode',
        description: '按本机时间控制场景立绘与左上角小人的显示与隐藏。',
        descriptionEn: 'Control the scene artwork and the corner character by local time.',
        defaultValue: { enabled: false, outside: 'visible', ranges: [] },
      },
    ],
    apply,
  })
}
