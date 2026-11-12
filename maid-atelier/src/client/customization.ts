import {
  exposeSkinCustomization,
  SKIN_CUSTOMIZATION_PROTOCOL,
  SkinAttributeProjector,
  type SkinCustomizationState,
  type SkinSettingValue,
} from '../../../skin-manager/src/protocol.ts'

const ATTR_ART = 'data-dsh-whale-maid-art'
const ATTR_FONT = 'data-dsh-whale-maid-font'
const ATTR_WORKSPACE_FONT = 'data-dsh-whale-maid-workspace-font'
const ATTR_MODEL_EXIT = 'data-dsh-whale-maid-model-exit'
const ATTR_MODEL = 'data-dsh-whale-model'
const ATTR_FLASH_GLASSES = 'data-dsh-whale-maid-flash-glasses'
const ATTR_COMPOSER_MODE = 'data-maid-composer-mode'
const ATTR_COMPOSER_BOTTOM_ONLY = 'data-maid-composer-bottom-only'
const ATTR_NAV_MODE = 'data-maid-nav-mode'
const ATTR_PLAIN_PROCESS = 'data-maid-plain-process'
const ATTR_SIDEBAR_LACE = 'data-maid-sidebar-lace'
/** Navigation layouts the stylesheet implements; anything else falls back to the default. */
const NAV_MODES = new Set(['corner', 'topbar', 'rail'])

const WORKSPACE_FONTS = new Set(['serif', 'system', 'conversation'])

// Keep the original banner height unless the user chooses a compact layout.
const WORKSPACE_ROW_HEIGHT_DEFAULT = 54
const WORKSPACE_ROW_HEIGHT_MIN = 22
const WORKSPACE_ROW_HEIGHT_MAX = 54
const WORKSPACE_ROW_HEIGHT_PROPERTY = '--maid-workspace-row-height'

/** Restore the original inline value and priority only while this writer owns it. */
class SkinPropertyProjector {
  private readonly originals = new Map<string, { value: string, priority: string }>()
  private readonly owned = new Map<string, string>()

  constructor(private readonly root: HTMLElement = document.documentElement) {}

  set(name: string, value: string): void {
    if (!this.originals.has(name)) {
      this.originals.set(name, {
        value: this.root.style.getPropertyValue(name),
        priority: this.root.style.getPropertyPriority(name),
      })
    }
    this.root.style.setProperty(name, value)
    this.owned.set(name, value)
  }

  release(): void {
    for (const [name, original] of this.originals) {
      if (this.root.style.getPropertyValue(name) === this.owned.get(name)
        && this.root.style.getPropertyPriority(name) === '') {
        if (original.value === '') this.root.style.removeProperty(name)
        else this.root.style.setProperty(name, original.value, original.priority)
      }
    }
    this.originals.clear()
    this.owned.clear()
  }
}

function workspaceRowHeight(value: SkinSettingValue | undefined): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return WORKSPACE_ROW_HEIGHT_DEFAULT
  return Math.min(WORKSPACE_ROW_HEIGHT_MAX, Math.max(WORKSPACE_ROW_HEIGHT_MIN, Math.round(value)))
}

function sceneBrightness(value: SkinSettingValue | undefined): string {
  const percent = typeof value === 'number' && Number.isFinite(value) ? value : 80
  return String(Math.min(100, Math.max(60, percent)) / 100)
}

/**
 * The lineup is DeepSeek Flash and DeepSeek Pro, so the display name only
 * decides which side the artwork sits on. Both families carry vision now: the
 * glasses artwork is a separate switch (`flashGlasses`) instead of a `vision`
 * substring match, which used to split an older V4 name into a third family.
 */
export function modelFamily(name: string): 'pro' | 'flash' | null {
  const compact = name.toLowerCase().replace(/[^a-z0-9]/g, '')
  if (!compact.includes('deepseek')) return null
  if (compact.includes('pro')) return 'pro'
  if (compact.includes('flash')) return 'flash'
  return null
}

/** Expose controls and keep every resulting DOM mutation skin-owned. */
export function installMaidCustomization(root: HTMLElement = document.documentElement): () => void {
  const projector = new SkinAttributeProjector(root)
  const properties = new SkinPropertyProjector(root)
  let observer: MutationObserver | undefined
  let frame: number | undefined
  let activeState: SkinCustomizationState | null = null
  let mobile = window.innerWidth <= 700

  const synchronizeModel = (): void => {
    let family: ReturnType<typeof modelFamily> = null
    for (const trigger of document.querySelectorAll<HTMLElement>("[data-composer-card] button[aria-haspopup='menu']")) {
      family = modelFamily(`${trigger.title} ${trigger.getAttribute('aria-label') ?? ''} ${trigger.textContent ?? ''}`)
      if (family !== null) break
    }
    if (family === null) projector.unset(ATTR_MODEL)
    else projector.set(ATTR_MODEL, family)
  }

  const scheduleModelSync = (): void => {
    if (frame !== undefined) return
    frame = requestAnimationFrame(() => {
      frame = undefined
      synchronizeModel()
    })
  }

  const startModelObserver = (): void => {
    if (observer !== undefined) return
    observer = new MutationObserver(records => {
      if (records.some(record => {
        const element = record.target instanceof Element ? record.target : undefined
        if (record.type === 'childList' && element?.closest('[data-composer-input]')) return false
        if (record.type === 'attributes') return element?.matches("button[aria-haspopup='menu']") === true
        if (element?.closest("[data-composer-card] button[aria-haspopup='menu']")) return true
        return [...record.addedNodes, ...record.removedNodes].some(node => (
          node instanceof Element
          && (node.matches("[data-composer-card], button[aria-haspopup='menu']")
            || node.querySelector("[data-composer-card], button[aria-haspopup='menu']"))
        ))
      })) scheduleModelSync()
    })
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['aria-label', 'title'],
      childList: true,
      subtree: true,
    })
    synchronizeModel()
  }

  const stopModelObserver = (): void => {
    observer?.disconnect()
    observer = undefined
    if (frame !== undefined) cancelAnimationFrame(frame)
    frame = undefined
    projector.release(ATTR_MODEL)
  }

  const synchronizeModelMode = (): void => {
    if (activeState === null) return
    const modelExit = mobile
      ? activeState.values.mobileModelExit !== false
      : activeState.values.modelExit === true
    projector.set(ATTR_MODEL_EXIT, modelExit ? 'enabled' : 'disabled')
    if (modelExit) startModelObserver()
    else stopModelObserver()
  }

  const onResize = (): void => {
    const nextMobile = window.innerWidth <= 700
    if (mobile === nextMobile) return
    mobile = nextMobile
    synchronizeModelMode()
  }

  const apply = (state: SkinCustomizationState | null): void => {
    if (state === null) {
      window.removeEventListener('resize', onResize)
      activeState = null
      stopModelObserver()
      projector.release()
      properties.release()
      return
    }
    if (activeState === null) window.addEventListener('resize', onResize)
    activeState = state
    mobile = window.innerWidth <= 700
    const artwork = state.values.artwork === true
    const scheduleVisible = state.visibility.sfwMode !== false
    projector.set(ATTR_ART, artwork && scheduleVisible ? 'visible' : 'hidden')
    projector.set(ATTR_FONT, state.values.font === 'serif' ? 'serif' : 'system')
    const workspaceFont = state.values.workspaceFont
    projector.set(ATTR_WORKSPACE_FONT, typeof workspaceFont === 'string' && WORKSPACE_FONTS.has(workspaceFont) ? workspaceFont : 'serif')
    projector.set(ATTR_FLASH_GLASSES, state.values.flashGlasses === true ? 'on' : 'off')
    synchronizeModelMode()
    projector.set(ATTR_COMPOSER_MODE, typeof state.values.composerMode === 'string' ? state.values.composerMode : 'persistent')
    projector.set(ATTR_COMPOSER_BOTTOM_ONLY, state.values.composerBottomOnly === true ? 'on' : 'off')
    const navMode = state.values.mobileNav
    projector.set(ATTR_NAV_MODE, typeof navMode === 'string' && NAV_MODES.has(navMode) ? navMode : 'corner')
    properties.set(WORKSPACE_ROW_HEIGHT_PROPERTY, `${workspaceRowHeight(state.values.workspaceRowHeight)}px`)
    properties.set('--maid-scene-brightness-light', sceneBrightness(state.values.sceneBrightnessLight))
    projector.set(ATTR_PLAIN_PROCESS, state.values.plainProcess === true ? 'on' : 'off')
    projector.set(ATTR_SIDEBAR_LACE, state.values.sidebarLace === false ? 'off' : 'on')
  }

  return exposeSkinCustomization({
    protocol: SKIN_CUSTOMIZATION_PROTOCOL,
    skinId: 'maid-atelier',
    title: '深海女仆工坊',
    titleEn: 'Abyssal Maid Atelier',
    // Groups decide what the manager shows together and in which order; the
    // array below follows the same order so a manager that predates groups
    // still lists related options side by side. New options go at the end of
    // their group (see docs/skin-settings-guidelines.md).
    groups: [
      { key: 'artwork', label: '立绘', labelEn: 'Artwork' },
      { key: 'appearance', label: '外观', labelEn: 'Appearance' },
      { key: 'sidebar', label: '侧栏', labelEn: 'Sidebar' },
      { key: 'composer', label: '输入框', labelEn: 'Composer' },
    ],
    settings: [
      {
        key: 'artwork',
        group: 'artwork',
        type: 'boolean',
        label: '显示女仆立绘',
        labelEn: 'Show the maid artwork',
        defaultValue: true,
      },
      {
        key: 'modelExit',
        group: 'artwork',
        type: 'boolean',
        label: '桌面端按模型显示',
        labelEn: 'Match the model on desktop',
        description: '只显示与所选模型对应的那位女仆。',
        descriptionEn: 'Show only the maid that matches the selected model.',
        defaultValue: false,
        visibleWhen: { key: 'artwork', values: [true] },
      },
      {
        key: 'mobileModelExit',
        group: 'artwork',
        type: 'boolean',
        label: '移动端按模型显示',
        labelEn: 'Match the model on mobile',
        description: '宽度不超过 700px 时。',
        descriptionEn: 'At widths up to 700px.',
        defaultValue: true,
        visibleWhen: { key: 'artwork', values: [true] },
      },
      {
        key: 'flashGlasses',
        group: 'artwork',
        type: 'boolean',
        label: 'Flash 戴眼镜',
        labelEn: 'Glasses for Flash',
        description: 'Flash 模型使用戴眼镜的立绘。',
        descriptionEn: 'Use the glasses artwork for the Flash model.',
        defaultValue: false,
        visibleWhen: {
          // The top-level single-key form is what a manager that predates
          // `anyOf` reads; it lands on the mobile switch (on by default), so
          // the control still renders there instead of throwing on an absent
          // `values`.
          key: 'mobileModelExit',
          values: [true],
          anyOf: [
            { key: 'modelExit', values: [true] },
            { key: 'mobileModelExit', values: [true] },
          ],
        },
      },
      {
        key: 'sfwMode',
        group: 'artwork',
        type: 'visibility-schedule',
        label: '定时隐藏立绘',
        labelEn: 'Hide the artwork on a schedule',
        defaultValue: { enabled: false, outside: 'visible', ranges: [] },
        visibleWhen: { key: 'artwork', values: [true] },
      },
      {
        key: 'sceneBrightnessLight',
        group: 'appearance',
        type: 'range',
        label: '浅色背景亮度',
        labelEn: 'Light background brightness',
        defaultValue: 80,
        min: 60,
        max: 100,
        step: 1,
        unit: '%',
      },
      {
        key: 'plainProcess',
        group: 'appearance',
        type: 'boolean',
        label: '简洁过程行',
        labelEn: 'Plain process rows',
        description: '浅色主题下去掉过程行的底色。',
        descriptionEn: 'Drop the process row background in the light theme.',
        defaultValue: false,
      },
      {
        key: 'font',
        group: 'appearance',
        type: 'select',
        label: '对话字体',
        labelEn: 'Conversation font',
        defaultValue: 'system',
        options: [
          { value: 'system', label: '系统无衬线', labelEn: 'System sans' },
          { value: 'serif', label: 'Georgia 衬线', labelEn: 'Georgia serif' },
        ],
      },
      {
        key: 'workspaceFont',
        group: 'appearance',
        type: 'select',
        label: '侧栏字体',
        labelEn: 'Sidebar font',
        defaultValue: 'serif',
        options: [
          { value: 'serif', label: 'Georgia 衬线', labelEn: 'Georgia serif' },
          { value: 'system', label: '系统无衬线', labelEn: 'System sans' },
          { value: 'conversation', label: '与对话字体相同', labelEn: 'Same as conversation' },
        ],
      },
      {
        key: 'sidebarLace',
        group: 'sidebar',
        type: 'boolean',
        label: '侧栏花边',
        labelEn: 'Sidebar lace',
        description: '侧栏底部的 U 形花边和列表渐隐。',
        descriptionEn: 'The U-shaped lace and list fade at the bottom of the sidebar.',
        defaultValue: true,
      },
      {
        key: 'workspaceRowHeight',
        group: 'sidebar',
        type: 'range',
        control: 'stepper',
        label: '工作区横幅高度',
        labelEn: 'Workspace banner height',
        description: '只影响工作区，不影响会话。',
        descriptionEn: 'Workspaces only; conversations keep their height.',
        defaultValue: WORKSPACE_ROW_HEIGHT_DEFAULT,
        min: WORKSPACE_ROW_HEIGHT_MIN,
        max: WORKSPACE_ROW_HEIGHT_MAX,
        step: 1,
        unit: 'px',
      },
      {
        key: 'mobileNav',
        group: 'sidebar',
        type: 'select',
        label: '移动端导航',
        labelEn: 'Mobile navigation',
        description: '宽度不超过 700px 的竖屏。',
        descriptionEn: 'Portrait screens up to 700px wide.',
        defaultValue: 'corner',
        options: [
          { value: 'corner', label: '左上角图标', labelEn: 'Top-left icon' },
          { value: 'topbar', label: '顶部横栏', labelEn: 'Top bar' },
          { value: 'rail', label: '竖向侧栏', labelEn: 'Vertical rail' },
        ],
      },
      {
        key: 'composerMode',
        group: 'composer',
        type: 'select',
        label: '显示方式',
        labelEn: 'Visibility',
        defaultValue: 'persistent',
        options: [
          { value: 'persistent', label: '始终显示', labelEn: 'Always visible' },
          { value: 'capsule', label: '空闲时收起为胶囊', labelEn: 'Collapse to a capsule when idle' },
          { value: 'scroll', label: '上滚隐藏，下滚显示', labelEn: 'Hide on scroll up, show on scroll down' },
        ],
      },
      {
        key: 'composerBottomOnly',
        group: 'composer',
        type: 'boolean',
        label: '只在底部显示',
        labelEn: 'Only at the bottom',
        description: '翻看上文时隐藏输入框，优先于「上滚隐藏」。',
        descriptionEn: 'Hide the composer while reading back; takes precedence over hide on scroll.',
        defaultValue: false,
      },
    ],
    apply,
  })
}
