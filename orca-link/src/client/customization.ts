import {
  exposeSkinCustomization,
  SKIN_CUSTOMIZATION_PROTOCOL,
  SkinAttributeProjector,
  type SkinCustomizationState,
} from '../../../skin-manager/src/protocol.ts'

export const COMPOSER_SCROLL_HIDE_ATTRIBUTE = 'data-dsh-whale-orca-composer-scroll-hide'
export const COMPOSER_BOTTOM_ONLY_ATTRIBUTE = 'data-dsh-whale-orca-composer-bottom-only'
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
    // 与其它声明相反：这个开关默认关闭，所以缺省值不是 'on'。
    projector.set(COMPOSER_BOTTOM_ONLY_ATTRIBUTE, state.values.composerBottomOnly === true ? 'on' : 'off')
    projector.set(COMPOSER_HANDLES_ATTRIBUTE, state.values.composerHandles === false ? 'off' : 'on')
    projector.set(HEADLINE_TYPEWRITER_ATTRIBUTE, state.values.headlineTypewriter === false ? 'off' : 'on')
  }

  return exposeSkinCustomization({
    protocol: SKIN_CUSTOMIZATION_PROTOCOL,
    skinId: 'orca-link',
    title: 'ORCA LINK',
    // Groups decide what the manager shows together and in which order; the
    // array below follows the same order so a manager that predates groups
    // still lists related options side by side. New options go at the end of
    // their group (see docs/skin-settings-guidelines.md).
    groups: [
      { key: 'scene', label: '场景', labelEn: 'Scene' },
      { key: 'interface', label: '界面', labelEn: 'Interface' },
      { key: 'composer', label: '输入框', labelEn: 'Composer' },
    ],
    settings: [
      {
        key: 'background',
        group: 'scene',
        type: 'boolean',
        label: '显示背景',
        labelEn: 'Show the background',
        defaultValue: true,
      },
      {
        key: 'character',
        group: 'scene',
        type: 'boolean',
        label: '显示左上角小人',
        labelEn: 'Show the corner character',
        defaultValue: true,
      },
      {
        key: 'mirrorCharacter',
        group: 'scene',
        type: 'boolean',
        label: '左右翻转',
        labelEn: 'Flip horizontally',
        defaultValue: false,
        visibleWhen: { key: 'character', values: [true] },
      },
      {
        key: 'sfwMode',
        group: 'scene',
        type: 'visibility-schedule',
        label: '定时隐藏立绘',
        labelEn: 'Hide the artwork on a schedule',
        description: '左上角小人一并隐藏。',
        descriptionEn: 'The corner character hides with it.',
        defaultValue: { enabled: false, outside: 'visible', ranges: [] },
      },
      {
        key: 'pricingLight',
        group: 'interface',
        type: 'boolean',
        label: '定价红绿灯',
        labelEn: 'Pricing traffic light',
        defaultValue: true,
      },
      {
        key: 'headlineTypewriter',
        group: 'interface',
        type: 'boolean',
        label: '首页标题打字机',
        labelEn: 'Typewriter headline',
        description: '新会话首页轮播标语；关闭后显示原标题。',
        descriptionEn: 'Cycle slogans on the new-session headline; off keeps the original.',
        defaultValue: true,
      },
      {
        key: 'centerSettings',
        group: 'interface',
        type: 'boolean',
        label: '设置面板居中',
        labelEn: 'Center the settings panel',
        description: '宽屏时居中，窄屏仍为全屏。',
        descriptionEn: 'Centered on wide screens; full screen on narrow ones.',
        defaultValue: false,
      },
      {
        key: 'composerBottomOnly',
        group: 'composer',
        type: 'boolean',
        label: '只在底部显示',
        labelEn: 'Only at the bottom',
        description: '翻看上文时隐藏输入框。',
        descriptionEn: 'Hide the composer while reading back.',
        defaultValue: false,
      },
      {
        key: 'scrollHideComposer',
        group: 'composer',
        type: 'boolean',
        label: '上滚时隐藏',
        labelEn: 'Hide on scroll up',
        description: '下滚或回到底部时重新显示。',
        descriptionEn: 'Shows again on scroll down or at the bottom.',
        defaultValue: true,
        // Bottom-only already hides the composer whenever the reader leaves the
        // tail, so the scroll-direction rule has nothing left to decide.
        disabledWhen: 'composerBottomOnly',
      },
      {
        key: 'composerHandles',
        group: 'composer',
        type: 'boolean',
        label: '拖拽手柄收起',
        labelEn: 'Drag handles to hide',
        description: '向内拖动输入框两侧的括号即可收起。',
        descriptionEn: 'Drag the brackets beside the composer inward to hide it.',
        defaultValue: true,
      },
    ],
    apply,
  })
}
