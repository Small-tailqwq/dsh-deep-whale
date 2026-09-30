interface SidebarState {
  users: number
  setWidth: (width: string) => void
  setWide: (wide: boolean) => void
  restore: () => void
}

const states = new WeakMap<HTMLElement, SidebarState>()
const WIDTH = '--orca-sidebar-width'

/** Share ownership when two skin activations briefly overlap. */
export function acquireSidebarState(element: HTMLElement, attribute: string): SidebarState & { release: () => void } {
  let state = states.get(element)
  if (!state) {
    const originalWidth = element.style.getPropertyValue(WIDTH)
    const originalPriority = element.style.getPropertyPriority(WIDTH)
    const originalWide = element.getAttribute(attribute)
    let writtenWidth: string | undefined
    let writtenWide: string | null | undefined
    state = {
      users: 0,
      setWidth(width) {
        if (element.style.getPropertyValue(WIDTH) === width) return
        writtenWidth = width
        element.style.setProperty(WIDTH, width)
      },
      setWide(wide) {
        if (element.hasAttribute(attribute) === wide) return
        writtenWide = wide ? '' : null
        element.toggleAttribute(attribute, wide)
      },
      restore() {
        if (writtenWidth !== undefined && element.style.getPropertyValue(WIDTH) === writtenWidth
          && element.style.getPropertyPriority(WIDTH) === '') {
          if (originalWidth === '') element.style.removeProperty(WIDTH)
          else element.style.setProperty(WIDTH, originalWidth, originalPriority)
        }
        if (writtenWide !== undefined && element.getAttribute(attribute) === writtenWide) {
          if (originalWide === null) element.removeAttribute(attribute)
          else element.setAttribute(attribute, originalWide)
        }
        writtenWidth = undefined
        writtenWide = undefined
      },
    }
    states.set(element, state)
  }
  const current = state
  current.users += 1
  let released = false
  return {
    ...current,
    release() {
      if (released) return
      released = true
      if (--current.users > 0) return
      current.restore()
      states.delete(element)
    },
  }
}
