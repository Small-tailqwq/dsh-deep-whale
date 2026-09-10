import { ORCA_BOOT_REPAIR_ART } from './boot-error-art.generated.ts'
import { createOrcaWorkLight } from './work-light.ts'
import './boot-error.module.css'

const BOOT_SELECTOR = '[data-dsh-boot]'
const ERROR_ATTRIBUTE = 'data-orca-boot-error'

interface BootLease {
  original: string | null
  owners: Set<symbol>
  scene: HTMLElement
}

const leases = new WeakMap<Element, BootLease>()

function createRepairScene(): HTMLElement {
  const scene = document.createElement('aside')
  scene.dataset.orcaBootScene = ''
  scene.dataset.skinChrome = 'boot-repair'
  scene.setAttribute('aria-hidden', 'true')
  const figure = document.createElement('img')
  figure.dataset.orcaBootFigure = ''
  figure.src = ORCA_BOOT_REPAIR_ART
  figure.alt = ''
  figure.draggable = false
  const floor = document.createElement('span')
  floor.dataset.orcaBootFloor = ''
  scene.append(floor, figure, createOrcaWorkLight('repair'))
  return scene
}

/** The kernel owns the report; this lease owns only its sibling illustration. */
export function installOrcaBootError(): () => void {
  const owner = Symbol('orca-boot-error')
  const owned = new Set<Element>()
  let observer: MutationObserver | undefined

  const release = (boot: Element): void => {
    owned.delete(boot)
    const lease = leases.get(boot)
    if (!lease || !lease.owners.delete(owner) || lease.owners.size > 0) return
    leases.delete(boot)
    lease.scene.remove()
    if (boot.getAttribute(ERROR_ATTRIBUTE) !== '') return
    if (lease.original === null) boot.removeAttribute(ERROR_ATTRIBUTE)
    else boot.setAttribute(ERROR_ATTRIBUTE, lease.original)
  }

  const synchronize = (): void => {
    const failed = new Set<Element>()
    for (const boot of document.querySelectorAll(BOOT_SELECTOR)) {
      // 0.1.5-alpha.1 has no failure-state attribute. Check the kernel's exact
      // title under its direct card, never an unrelated message elsewhere.
      const card = [...boot.children].find(element => !element.hasAttribute('data-orca-boot-scene'))
      const hasReport = card && [...card.querySelectorAll('div')].some(element =>
        element.childElementCount === 0 && element.textContent === 'Failed to load plugins',
      )
      if (!hasReport) continue
      failed.add(boot)
      if (owned.has(boot)) continue
      let lease = leases.get(boot)
      if (!lease) {
        lease = { original: boot.getAttribute(ERROR_ATTRIBUTE), owners: new Set(), scene: createRepairScene() }
        leases.set(boot, lease)
      }
      lease.owners.add(owner)
      owned.add(boot)
      boot.setAttribute(ERROR_ATTRIBUTE, '')
      if (lease.scene.parentElement !== boot) boot.append(lease.scene)
    }
    for (const boot of owned) if (!failed.has(boot)) release(boot)
  }

  const dispose = (): void => {
    observer?.disconnect()
    for (const boot of owned) release(boot)
  }

  try {
    observer = new MutationObserver(records => {
      if (records.some(record => {
        const target = record.target instanceof Element ? record.target : record.target.parentElement
        if (target?.closest('[data-orca-boot-scene]')) return false
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
