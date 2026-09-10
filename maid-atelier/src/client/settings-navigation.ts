const NAV_SELECTOR = "[data-slot='sidebar.settings'] > [role='presentation'] > [role='dialog'] > nav"
const MORE_ATTRIBUTE = 'data-maid-settings-more'
const installations = new WeakMap<Document, () => void>()

/** The existing settings observer calls synchronize when the host replaces its navigation. */
export function createMaidSettingsNavigation(body: HTMLElement): { synchronize: () => void, dispose: () => void } {
  const doc = body.ownerDocument
  installations.get(doc)?.()
  let active = true
  let nav: HTMLElement | null = null
  let list: HTMLElement | null = null
  let originalMore: string | null = null
  let writtenMore: string | null = null
  let resizeObserver: ResizeObserver | undefined

  const update = (): void => {
    if (!active || nav === null || list === null) return
    const more = list.scrollHeight - list.clientHeight - Math.max(0, list.scrollTop) > 1
    writtenMore = more ? '' : null
    if (nav.getAttribute(MORE_ATTRIBUTE) === writtenMore) return
    if (writtenMore === null) nav.removeAttribute(MORE_ATTRIBUTE)
    else nav.setAttribute(MORE_ATTRIBUTE, writtenMore)
  }

  const detach = (): void => {
    resizeObserver?.disconnect()
    resizeObserver = undefined
    list?.removeEventListener('scroll', update)
    if (nav !== null && nav.getAttribute(MORE_ATTRIBUTE) === writtenMore) {
      if (originalMore === null) nav.removeAttribute(MORE_ATTRIBUTE)
      else nav.setAttribute(MORE_ATTRIBUTE, originalMore)
    }
    nav = null
    list = null
  }

  const synchronize = (): void => {
    if (!active) return
    const nextNav = body.querySelector<HTMLElement>(NAV_SELECTOR)
    const nextList = nextNav?.querySelector<HTMLElement>(':scope > :last-child') ?? null
    if (nav !== nextNav || list !== nextList) {
      detach()
      nav = nextNav
      list = nextList
      originalMore = nav?.getAttribute(MORE_ATTRIBUTE) ?? null
      writtenMore = originalMore
      if (list !== null) {
        try {
          list.addEventListener('scroll', update, { passive: true })
          if (typeof ResizeObserver !== 'undefined') {
            resizeObserver = new ResizeObserver(update)
            resizeObserver.observe(list)
          }
        } catch (error) {
          detach()
          throw error
        }
      }
    }
    update()
  }

  const dispose = (): void => {
    if (!active) return
    active = false
    detach()
    if (installations.get(doc) === dispose) installations.delete(doc)
  }
  installations.set(doc, dispose)
  return { synchronize, dispose }
}
