interface AttributeLease {
  originalValue: string | null
  owners: Set<symbol>
}

const attributeLeases = new WeakMap<HTMLElement, Map<string, AttributeLease>>()

/** Ref-count a skin-owned attribute write so repeated activation and disposal
 * restore only the owner that is actually leaving. */
export function setLeasedAttribute(
  element: HTMLElement,
  attribute: string,
  owner: symbol,
  active: boolean,
): void {
  let attributes = attributeLeases.get(element)
  let lease = attributes?.get(attribute)
  if (active) {
    if (attributes === undefined) {
      attributes = new Map()
      attributeLeases.set(element, attributes)
    }
    if (lease === undefined) {
      lease = { originalValue: element.getAttribute(attribute), owners: new Set() }
      attributes.set(attribute, lease)
    }
    lease.owners.add(owner)
    element.setAttribute(attribute, '')
    return
  }
  if (lease === undefined || attributes === undefined) return
  lease.owners.delete(owner)
  if (lease.owners.size > 0) {
    element.setAttribute(attribute, '')
    return
  }
  if (element.getAttribute(attribute) === '') {
    if (lease.originalValue === null) element.removeAttribute(attribute)
    else element.setAttribute(attribute, lease.originalValue)
  }
  attributes.delete(attribute)
  if (attributes.size === 0) attributeLeases.delete(element)
}
