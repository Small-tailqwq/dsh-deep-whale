import './work-light.module.css'

/** A bounded light rig: its gradients stay still while two dust layers drift. */
export function createOrcaWorkLight(mode: 'sidebar' | 'repair'): HTMLElement {
  const light = document.createElement('div')
  light.dataset.orcaWorkLight = mode
  light.setAttribute('aria-hidden', 'true')
  const suspension = document.createElement('span')
  suspension.dataset.orcaLightSuspension = ''
  const rig = document.createElement('div')
  rig.dataset.orcaLightRig = ''
  const housing = document.createElement('span')
  housing.dataset.orcaLightHousing = ''
  const illumination = document.createElement('div')
  illumination.dataset.orcaLightIllumination = ''
  for (const part of ['tube', 'beam']) {
    const node = document.createElement('span')
    node.dataset.orcaLightPart = part
    illumination.append(node)
  }
  rig.append(housing, illumination)
  light.append(suspension, rig)
  // Dust lives in room coordinates, outside the falling/rotating lamp rig.
  for (const part of ['dust-near', 'dust-far']) {
    const dust = document.createElement('span')
    dust.dataset.orcaLightPart = part
    light.append(dust)
  }
  return light
}

const visibilityLeases = new WeakMap<HTMLElement, { count: number, dispose: () => void }>()

/** Pause the decorative compositor animations while this document is hidden. */
export function installOrcaLightVisibility(body: HTMLElement): () => void {
  let lease = visibilityLeases.get(body)
  if (!lease) {
    const attribute = 'data-orca-lights-paused'
    const original = body.getAttribute(attribute)
    let written: string | null = null
    const sync = (): void => {
      written = document.hidden ? '' : null
      if (written === null) body.removeAttribute(attribute)
      else body.setAttribute(attribute, written)
    }
    lease = {
      count: 0,
      dispose: () => {
        document.removeEventListener('visibilitychange', sync)
        if (body.getAttribute(attribute) !== written) return
        if (original === null) body.removeAttribute(attribute)
        else body.setAttribute(attribute, original)
      },
    }
    visibilityLeases.set(body, lease)
    document.addEventListener('visibilitychange', sync)
    sync()
  }
  lease.count += 1
  let released = false
  return () => {
    if (released) return
    released = true
    if (--lease.count !== 0) return
    lease.dispose()
    visibilityLeases.delete(body)
  }
}
