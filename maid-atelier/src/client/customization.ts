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
const ATTR_NAV_MODE = 'data-maid-nav-mode'
/** Navigation layouts the stylesheet implements; anything else falls back to the default. */
const NAV_MODES = new Set(['corner', 'topbar', 'rail'])

/**
 * Workspace typography choices. `serif` is the skin's own sidebar stack (the
 * stylesheet default), `system` takes the host family, and `conversation` mirrors
 * the conversation font switch so both surfaces move together. Anything else
 * falls back to the serif default.
 */
const WORKSPACE_FONTS = new Set(['serif', 'system', 'conversation'])

/**
 * Workspace row height control. The 22px default is also the stylesheet's
 * `--maid-workspace-row-height` fallback, so a skin without a manager renders
 * the compact row; the range starts there because the title's own line box sets
 * the floor.
 */
const WORKSPACE_ROW_HEIGHT_DEFAULT = 22
const WORKSPACE_ROW_HEIGHT_MIN = 22
const WORKSPACE_ROW_HEIGHT_MAX = 44
const WORKSPACE_ROW_HEIGHT_PROPERTY = '--maid-workspace-row-height'

/**
 * Style-property twin of {@link SkinAttributeProjector}: a length control cannot
 * ride an attribute — the stylesheet would need one rule per pixel value — so the
 * owned custom property is written inline on the same root and released only
 * while it still holds the value this writer set.
 */
class SkinPropertyProjector {
  private readonly originals = new Map<string, string>()
  private readonly owned = new Map<string, string>()

  constructor(private readonly root: HTMLElement = document.documentElement) {}

  set(name: string, value: string): void {
    if (!this.originals.has(name)) this.originals.set(name, this.root.style.getPropertyValue(name))
    this.root.style.setProperty(name, value)
    this.owned.set(name, value)
  }

  release(): void {
    for (const [name, original] of [...this.originals]) {
      if (this.root.style.getPropertyValue(name) === this.owned.get(name)) {
        if (original === '') this.root.style.removeProperty(name)
        else this.root.style.setProperty(name, original)
      }
      this.originals.delete(name)
      this.owned.delete(name)
    }
  }
}

/**
 * Normalize the row height: a manager that predates the control, a missing value
 * or a forged one all mean the skin default, and the result is rounded so the
 * written length never carries sub-pixel noise.
 */
function workspaceRowHeight(value: SkinSettingValue | undefined): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return WORKSPACE_ROW_HEIGHT_DEFAULT
  return Math.min(WORKSPACE_ROW_HEIGHT_MAX, Math.max(WORKSPACE_ROW_HEIGHT_MIN, Math.round(value)))
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
    const navMode = state.values.mobileNav
    projector.set(ATTR_NAV_MODE, typeof navMode === 'string' && NAV_MODES.has(navMode) ? navMode : 'corner')
    properties.set(WORKSPACE_ROW_HEIGHT_PROPERTY, `${workspaceRowHeight(state.values.workspaceRowHeight)}px`)
  }

  return exposeSkinCustomization({
    protocol: SKIN_CUSTOMIZATION_PROTOCOL,
    skinId: 'maid-atelier',
    title: '深海女仆工坊',
    titleEn: 'Abyssal Maid Atelier',
    settings: [
      {
        key: 'artwork',
        type: 'boolean',
        label: '显示双女仆立绘',
        labelEn: 'Show the twin maid artwork',
        defaultValue: true,
      },
      {
        key: 'sfwMode',
        type: 'visibility-schedule',
        label: '不那么二次元模式',
        labelEn: 'Not-so-anime mode',
        description: '按本机时间控制大幅立绘；可设置工作时段隐藏、其他时间显示，也可反向设置。',
        descriptionEn: 'Control the large artwork by local time; hide it during work hours and show it otherwise, or the reverse.',
        defaultValue: { enabled: false, outside: 'visible', ranges: [] },
      },
      {
        key: 'font',
        type: 'select',
        label: '对话区字体',
        labelEn: 'Conversation font',
        defaultValue: 'system',
        options: [
          { value: 'system', label: '系统默认无衬线', labelEn: 'System default sans' },
          { value: 'serif', label: 'Georgia 衬线（#22）', labelEn: 'Georgia serif (#22)' },
        ],
      },
      {
        key: 'workspaceFont',
        type: 'select',
        label: '工作区字体',
        labelEn: 'Workspace font',
        description: '左侧栏工作区与会话列表的字体；可跟随上面的对话区字体设置。',
        descriptionEn: 'Typeface of the sidebar Workspace and Session lists; can follow the conversation font setting above.',
        defaultValue: 'serif',
        options: [
          { value: 'serif', label: 'Georgia 衬线（皮肤默认）', labelEn: 'Georgia serif (skin default)' },
          { value: 'system', label: '系统默认无衬线', labelEn: 'System default sans' },
          { value: 'conversation', label: '跟随对话区字体', labelEn: 'Follow the conversation font' },
        ],
      },
      {
        key: 'modelExit',
        type: 'boolean',
        label: '桌面端根据所选模型显示立绘',
        labelEn: 'Show artwork based on the selected model on desktop',
        defaultValue: false,
      },
      {
        key: 'mobileModelExit',
        type: 'boolean',
        label: '移动端根据所选模型显示立绘',
        labelEn: 'Show artwork based on the selected model on mobile',
        defaultValue: true,
      },
      {
        key: 'flashGlasses',
        type: 'boolean',
        label: 'flash🧐 带眼镜立绘',
        labelEn: 'flash 🧐 glasses artwork',
        description: 'flash 模型改用带眼镜的立绘。',
        descriptionEn: 'Use the glasses artwork for the flash model.',
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
        key: 'mobileNav',
        type: 'select',
        label: '移动端导航方式',
        labelEn: 'Phone navigation layout',
        description: '仅影响竖屏手机（宽度 ≤700px）：左上角品牌图标（默认）、横向顶栏，或宿主原本的纵向侧栏。桌面与横屏不受影响。',
        descriptionEn: 'Portrait phones only (≤700px wide): a brand mark in the top-left corner (default), a horizontal top bar, or the host\u2019s own vertical column. Desktop and landscape are untouched.',
        defaultValue: 'corner',
        options: [
          { value: 'corner', label: '左上角品牌图标', labelEn: 'Brand mark · top-left corner' },
          { value: 'topbar', label: '横向顶栏', labelEn: 'Horizontal top bar' },
          { value: 'rail', label: '纵向侧栏（宿主默认）', labelEn: 'Vertical column (host default)' },
        ],
      },
      {
        key: 'composerMode',
        type: 'select',
        label: '输入框显示方式',
        labelEn: 'Composer visibility mode',
        description: '始终显示；空态胶囊在输入框为空且未聚焦时收起为简约胶囊；滚动显隐在上滚回顾时隐去、下滚渐现。',
        descriptionEn: 'Always visible; the idle capsule collapses to a slim capsule while the composer is empty and unfocused; scroll mode hides it when scrolling up to review and reveals it when scrolling down.',
        defaultValue: 'persistent',
        options: [
          { value: 'persistent', label: '始终显示', labelEn: 'Always visible' },
          { value: 'capsule', label: '空态胶囊（点击展开）', labelEn: 'Idle capsule (click to expand)' },
          { value: 'scroll', label: '上滚隐去 · 下滚渐现', labelEn: 'Hide on scroll up · show on scroll down' },
        ],
      },
      {
        key: 'workspaceRowHeight',
        type: 'range',
        label: '工作区条目行高',
        labelEn: 'Workspace row height',
        description: '左侧栏「工作区」分组条目的高度，单位像素；文件夹徽章与当前工作区的缎带按同一比例缩放。',
        descriptionEn: 'Height of the sidebar Workspace group row in pixels; the folder crest and the active Workspace ribbon scale with it.',
        defaultValue: WORKSPACE_ROW_HEIGHT_DEFAULT,
        min: WORKSPACE_ROW_HEIGHT_MIN,
        max: WORKSPACE_ROW_HEIGHT_MAX,
        step: 1,
        unit: 'px',
      },
    ],
    apply,
  })
}
