import type { Context } from '@deepseek-ai/cordis'

interface MarkerGroup {
  scope: string
  rules: ReadonlyArray<{ selector: string, attribute: string }>
}

interface Claim {
  original: string | null
  owners: Set<symbol>
}

const claims = new WeakMap<Element, Map<string, Claim>>()

function acquire(element: Element, attribute: string, owner: symbol): void {
  let attributes = claims.get(element)
  if (!attributes) claims.set(element, attributes = new Map())
  let claim = attributes.get(attribute)
  if (!claim) attributes.set(attribute, claim = { original: element.getAttribute(attribute), owners: new Set() })
  claim.owners.add(owner)
  if (element.getAttribute(attribute) !== '') element.setAttribute(attribute, '')
}

function release(element: Element, attribute: string, owner: symbol): void {
  const attributes = claims.get(element)
  const claim = attributes?.get(attribute)
  if (!claim) return
  claim.owners.delete(owner)
  if (claim.owners.size > 0) return
  if (element.getAttribute(attribute) === '') {
    if (claim.original === null) element.removeAttribute(attribute)
    else element.setAttribute(attribute, claim.original)
  }
  attributes!.delete(attribute)
}

/**
 * Non-subject :has() rules share a broad invalidation set in Chromium. Even a
 * hidden hero's `:has(...) > [class*=...]` can make an editor mutation restyle
 * the transcript. Project those predicates only inside their small UI scopes.
 */
export function installRelationalMarkers(ctx: Context, groups: readonly MarkerGroup[]): void {
  const states = groups.map(group => ({ group, roots: new Map<Element, { owner: symbol, matches: Set<Element>[] }>() }))
  let observer: MutationObserver | undefined

  const clear = (state: typeof states[number], root: Element): void => {
    const current = state.roots.get(root)
    if (!current) return
    current.matches.forEach((matches, i) => {
      for (const element of matches) release(element, state.group.rules[i]!.attribute, current.owner)
    })
    state.roots.delete(root)
  }

  // Register restoration before the first selector query or attribute write.
  ctx.effect(() => () => {
    observer?.disconnect()
    for (const state of states) for (const root of state.roots.keys()) clear(state, root)
  }, 'skin: scoped relational style markers')

  const refresh = (state: typeof states[number], root: Element): void => {
    let current = state.roots.get(root)
    if (!current) {
      current = { owner: Symbol(), matches: state.group.rules.map(() => new Set()) }
      state.roots.set(root, current)
    }
    state.group.rules.forEach((rule, i) => {
      const next = new Set(root.querySelectorAll(rule.selector))
      if (root.matches(rule.selector)) next.add(root)
      const previous = current!.matches[i]!
      for (const element of previous) if (!next.has(element)) {
        release(element, rule.attribute, current!.owner)
        previous.delete(element)
      }
      for (const element of next) if (!previous.has(element)) {
        previous.add(element)
        acquire(element, rule.attribute, current!.owner)
      }
    })
  }

  for (const state of states) for (const root of document.querySelectorAll(state.group.scope)) refresh(state, root)

  observer = new MutationObserver(records => {
    for (const state of states) {
      const dirty = new Set<Element>()
      const discover = (node: Element): void => {
        if (node.matches(state.group.scope)) dirty.add(node)
        for (const root of node.querySelectorAll(state.group.scope)) dirty.add(root)
      }
      for (const record of records) {
        if (!(record.target instanceof Element)) continue
        // Text edits cannot change these structural predicates.
        if (record.type === 'childList'
          && ![...record.addedNodes, ...record.removedNodes].some(node => node instanceof Element)) continue
        const root = record.target.closest(state.group.scope)
        if (root) dirty.add(root)
        if (record.type === 'childList') {
          for (const node of record.addedNodes) if (node instanceof Element) discover(node)
        }
      }
      for (const root of state.roots.keys()) {
        if (!root.isConnected || !root.matches(state.group.scope)) clear(state, root)
      }
      for (const root of dirty) if (root.isConnected) refresh(state, root)
    }
  })
  observer.observe(document.body, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ['class', 'role', 'aria-haspopup', 'data-slot', 'data-phase', 'data-composer-card', 'data-dsh-part', 'data-plugin-entry'],
  })
}
