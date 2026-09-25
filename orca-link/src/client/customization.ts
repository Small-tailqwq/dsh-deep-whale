import {
  exposeSkinCustomization,
  SKIN_CUSTOMIZATION_PROTOCOL,
  SkinAttributeProjector,
  type SkinCustomizationState,
} from '../../../skin-manager/src/protocol.ts'

export const COMPOSER_SCROLL_HIDE_ATTRIBUTE = 'data-dsh-whale-orca-composer-scroll-hide'
export const COMPOSER_HANDLES_ATTRIBUTE = 'data-dsh-whale-orca-composer-handles'
export const HEADLINE_TYPEWRITER_ATTRIBUTE = 'data-dsh-whale-orca-headline-typewriter'

/** A declared behaviour switch reads as enabled until the manager says 'off'. */
export function orcaFeatureEnabled(doc: Document, attribute: string): boolean {
  return doc.documentElement.getAttribute(attribute) !== 'off'
}

/** Re-run `callback` whenever the manager flips one of the given switches. */
export function observeOrcaFeature(doc: Document, attributes: string[], callback: () => void): () => void {
  const observer = new MutationObserver(callback)
  observer.observe(doc.documentElement, { attributes: true, attributeFilter: attributes })
  return () => { observer.disconnect() }
}

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
    projector.set(COMPOSER_SCROLL_HIDE_ATTRIBUTE, state.values.scrollHideComposer === false ? 'off' : 'on')
    projector.set(COMPOSER_HANDLES_ATTRIBUTE, state.values.composerHandles === false ? 'off' : 'on')
    projector.set(HEADLINE_TYPEWRITER_ATTRIBUTE, state.values.headlineTypewriter === false ? 'off' : 'on')
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
        key: 'scrollHideComposer',
        type: 'boolean',
        label: '上滚时隐藏输入框',
        labelEn: 'Hide the composer while scrolling up',
        description: '向上翻阅对话时收起输入框，向下滚动或回到底部时再显示。',
        descriptionEn: 'Tuck the composer away while reading back through the conversation; it returns when scrolling down or reaching the bottom.',
        defaultValue: true,
      },
      {
        key: 'composerHandles',
        type: 'boolean',
        label: '输入框拖拽收起手柄',
        labelEn: 'Composer drag-to-hide handles',
        description: '在输入框两侧的括号上显示拖拽手柄，向内拖动即可手动收起输入框。',
        descriptionEn: 'Turn the brackets beside the composer into handles that hide it when dragged inward.',
        defaultValue: true,
      },
      {
        key: 'headlineTypewriter',
        type: 'boolean',
        label: '首页标题打字机动画',
        labelEn: 'Home headline typewriter',
        description: '在新会话首页轮播打字机标语；关闭后保留宿主原始标题。',
        descriptionEn: 'Cycle typewriter slogans on the new-session headline; when off, the host headline stays as is.',
        defaultValue: true,
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
