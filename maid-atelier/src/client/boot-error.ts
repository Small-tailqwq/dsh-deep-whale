const BOOT_SELECTOR = '[data-dsh-boot]'
const ERROR_ATTRIBUTE = 'data-maid-boot-error'

interface BootLease {
  original: string | null
  owners: Set<symbol>
}

const leases = new WeakMap<Element, BootLease>()

/** Decorate the kernel-owned failure page without replacing its diagnostics. */
export function installMaidBootError(): () => void {
  const owner = Symbol('maid-boot-error')
  const owned = new Set<Element>()
  let observer: MutationObserver | undefined

  const release = (element: Element): void => {
    owned.delete(element)
    const lease = leases.get(element)
    if (!lease || !lease.owners.delete(owner) || lease.owners.size > 0) return
    leases.delete(element)
    if (element.getAttribute(ERROR_ATTRIBUTE) !== '') return
    if (lease.original === null) element.removeAttribute(ERROR_ATTRIBUTE)
    else element.setAttribute(ERROR_ATTRIBUTE, lease.original)
  }

  const synchronize = (): void => {
    const failed = new Set<Element>()
    for (const boot of document.querySelectorAll(BOOT_SELECTOR)) {
      // rc1 exposes a boot owner but no failure-state attribute. Match the
      // kernel's exact report heading; unknown markup keeps the native page.
      const hasReport = [...boot.querySelectorAll('div')].some(element =>
        element.childElementCount === 0 && element.textContent === 'Failed to load plugins',
      )
      if (!hasReport) continue
      failed.add(boot)
      if (owned.has(boot)) continue
      let lease = leases.get(boot)
      if (!lease) {
        lease = { original: boot.getAttribute(ERROR_ATTRIBUTE), owners: new Set() }
        leases.set(boot, lease)
      }
      lease.owners.add(owner)
      owned.add(boot)
      boot.setAttribute(ERROR_ATTRIBUTE, '')
    }
    for (const element of owned) if (!failed.has(element)) release(element)
  }

  const dispose = (): void => {
    observer?.disconnect()
    for (const element of owned) release(element)
  }

  try {
    observer = new MutationObserver(records => {
      if (records.some(record => {
        const target = record.target instanceof Element ? record.target : record.target.parentElement
        if (target?.closest(BOOT_SELECTOR)) return true
        return [...record.addedNodes, ...record.removedNodes].some(node =>
          node instanceof Element && (node.matches(BOOT_SELECTOR) || node.querySelector(BOOT_SELECTOR)),
        )
      })) synchronize()
    })
    observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true })
    synchronize()
    return dispose
  } catch (error) {
    dispose()
    throw error
  }
}
