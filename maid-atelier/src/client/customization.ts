import {
  exposeSkinCustomization,
  SKIN_CUSTOMIZATION_PROTOCOL,
  SkinAttributeProjector,
  type SkinCustomizationState,
} from '../../../skin-manager/src/protocol.ts'

const ATTR_ART = 'data-dsh-whale-maid-art'
const ATTR_FONT = 'data-dsh-whale-maid-font'
const ATTR_MODEL_EXIT = 'data-dsh-whale-maid-model-exit'
const ATTR_MODEL = 'data-dsh-whale-model'
const ATTR_COMPOSER_MODE = 'data-maid-composer-mode'

export function modelFamily(name: string): 'pro' | 'flash' | 'flash-vision' | null {
  const compact = name.toLowerCase().replace(/[^a-z0-9]/g, '')
  if (compact.includes('v4pro')) return 'pro'
  const isV4Flash = compact.includes('v4flash') || compact.includes('v4f')
  if (isV4Flash && compact.includes('vision')) return 'flash-vision'
  if (isV4Flash) return 'flash'
  return null
}

/** Expose controls and keep every resulting DOM mutation skin-owned. */
export function installMaidCustomization(root: HTMLElement = document.documentElement): () => void {
  const projector = new SkinAttributeProjector(root)
  let observer: MutationObserver | undefined
  let frame: number | undefined

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
        if (element?.closest('[data-input-backdrop]')) return false
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

  const apply = (state: SkinCustomizationState | null): void => {
    if (state === null) {
      stopModelObserver()
      projector.release()
      return
    }
    const artwork = state.values.artwork === true
    const scheduleVisible = state.visibility.sfwMode !== false
    projector.set(ATTR_ART, artwork && scheduleVisible ? 'visible' : 'hidden')
    projector.set(ATTR_FONT, state.values.font === 'serif' ? 'serif' : 'system')
    const modelExit = state.values.modelExit === true
    projector.set(ATTR_MODEL_EXIT, modelExit ? 'enabled' : 'disabled')
    if (modelExit) startModelObserver()
    else stopModelObserver()
    projector.set(ATTR_COMPOSER_MODE, typeof state.values.composerMode === 'string' ? state.values.composerMode : 'persistent')
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
        key: 'modelExit',
        type: 'boolean',
        label: '根据所选模型显示立绘',
        labelEn: 'Show artwork based on the selected model',
        defaultValue: false,
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
    ],
    apply,
  })
}
