/**
 * Build-time selector-list expansion for the skin stylesheet.
 *
 * Blink files every style rule under one bucket picked from the rightmost
 * compound (id, class, attribute name, tag) and fast-rejects descendant
 * combinators through an ancestor bloom filter of the same identifiers. A
 * multi-branch `:is(a, b)` contributes to neither: a rule ending in one is
 * matched against every element on every style pass, and an `:is()` list on
 * the left leaves the filter nothing to reject, so each candidate walks its
 * full ancestor chain. Inherited custom properties that the host writes on
 * the conversation root (width handles, viewport resize) restyle the whole
 * transcript, so those rules dominate each pass.
 *
 * The source keeps `:is()` for readability; the build rewrites
 * `X :is(A, B) Y` into the selector list `X A Y, X B Y` only where both forms
 * match the same elements with the same specificity:
 * - every branch padded back to the `:is()` specificity with never-matching
 *   `:not()` items; a compound branch that would need a negative pad is
 *   wrapped in `:where()` and padded from zero, a complex one stays in `:is()`;
 * - no branch that names html/body/:root, nesting, or a pseudo-element;
 * - a branch containing combinators only where every compound before the
 *   `:is()` is anchored on html/body, and its leftmost compound has a non-root
 *   type — otherwise `X :is(A B)` (A may sit above X) would narrow;
 * - the expansion stays within a small per-selector budget.
 */
import type { Selector, SelectorComponent, SelectorList, Visitor } from 'lightningcss'

type Specificity = [number, number, number]

/** Type name that no document element uses; padding only adds specificity. */
const PAD_TYPE = 'maid-specificity-pad'
/** Attribute name that no element carries; padding only adds specificity. */
const PAD_ATTRIBUTE = 'data-maid-specificity-pad'
/** Upper bound of complex selectors produced from one source selector. */
const EXPANSION_BUDGET = 16

const ROOT_TYPES = new Set(['html', 'body'])
/** Pseudo-classes whose meaning depends on the selector's own anchor. */
const ANCHORED_PSEUDO_CLASSES = new Set(['root', 'scope', 'host', 'host-context'])

function add(a: Specificity, b: Specificity): Specificity {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]
}

function compare(a: Specificity, b: Specificity): number {
  return a[0] - b[0] || a[1] - b[1] || a[2] - b[2]
}

function maxSpecificity(list: SelectorList): Specificity {
  let best: Specificity = [0, 0, 0]
  for (const selector of list) {
    const value = specificity(selector)
    if (compare(value, best) > 0) best = value
  }
  return best
}

/** Selectors Level 4 specificity of one complex selector. */
export function specificity(selector: Selector): Specificity {
  let total: Specificity = [0, 0, 0]
  for (const component of selector) total = add(total, componentSpecificity(component))
  return total
}

function componentSpecificity(component: SelectorComponent): Specificity {
  switch (component.type) {
    case 'id': return [1, 0, 0]
    case 'class':
    case 'attribute': return [0, 1, 0]
    case 'type': return [0, 0, 1]
    case 'pseudo-element': return [0, 0, 1]
    case 'pseudo-class': {
      const pseudo = component as { kind: string, selectors?: SelectorList, of?: SelectorList | null }
      if (pseudo.kind === 'where') return [0, 0, 0]
      if (pseudo.kind === 'is' || pseudo.kind === 'not' || pseudo.kind === 'has' || pseudo.kind === 'any') {
        return pseudo.selectors === undefined ? [0, 1, 0] : maxSpecificity(pseudo.selectors)
      }
      if (pseudo.of != null) return add([0, 1, 0], maxSpecificity(pseudo.of))
      return [0, 1, 0]
    }
    default: return [0, 0, 0]
  }
}

/** Components that rule a branch out of expansion wherever it appears. */
function unsafeComponent(component: SelectorComponent): boolean {
  switch (component.type) {
    case 'type': return ROOT_TYPES.has(component.name.toLowerCase())
    case 'nesting':
    case 'pseudo-element': return true
    case 'pseudo-class': {
      const pseudo = component as { kind: string, selectors?: SelectorList, of?: SelectorList | null }
      if (ANCHORED_PSEUDO_CLASSES.has(pseudo.kind) || pseudo.kind === 'custom' || pseudo.kind === 'custom-function') return true
      const nested = [...(pseudo.selectors ?? []), ...(pseudo.of ?? [])]
      return nested.some(selector => selector.some(unsafeComponent))
    }
    default: return false
  }
}

function hasCombinator(selector: Selector): boolean {
  return selector.some(component => component.type === 'combinator')
}

/** Split a complex selector into compounds; combinators sit between them. */
function compounds(selector: Selector): SelectorComponent[][] {
  const result: SelectorComponent[][] = [[]]
  for (const component of selector) {
    if (component.type === 'combinator') result.push([])
    else result[result.length - 1].push(component)
  }
  return result
}

function anchoredOnRoot(compound: SelectorComponent[]): boolean {
  return compound.some(component => component.type === 'type' && ROOT_TYPES.has(component.name.toLowerCase()))
}

function padding(deficit: Specificity): SelectorComponent[] {
  const pads: SelectorComponent[] = []
  const not = (inner: SelectorComponent): SelectorComponent => ({ type: 'pseudo-class', kind: 'not', selectors: [[inner]] } as SelectorComponent)
  for (let i = 0; i < deficit[0]; i++) pads.push(not({ type: 'id', name: `${PAD_ATTRIBUTE}-${i}` }))
  for (let i = 0; i < deficit[1]; i++) pads.push(not({ type: 'attribute', namespace: null, name: PAD_ATTRIBUTE, operation: null } as SelectorComponent))
  for (let i = 0; i < deficit[2]; i++) pads.push(not({ type: 'type', name: PAD_TYPE }))
  return pads
}

/** Merge simple selectors into one compound, keeping the type selector first. */
function mergeCompound(parts: SelectorComponent[]): SelectorComponent[] | null {
  const types = parts.filter(component => component.type === 'type' || component.type === 'universal')
  if (types.filter(component => component.type === 'type').length > 1) return null
  const leading = types.find(component => component.type === 'type') ?? types[0]
  const rest = parts.filter(component => component.type !== 'type' && component.type !== 'universal')
  const pseudoElements = rest.filter(component => component.type === 'pseudo-element')
  const simple = rest.filter(component => component.type !== 'pseudo-element')
  return [...(leading === undefined ? [] : [leading]), ...simple, ...pseudoElements]
}

/**
 * Replace the `:is()` at `index` (inside compound `compoundIndex`) with one
 * branch, attaching the compound's other simple selectors to the branch's
 * last compound.
 */
function splice(selector: Selector, index: number, branch: Selector, pads: SelectorComponent[]): Selector | null {
  let start = index
  while (start > 0 && selector[start - 1].type !== 'combinator') start--
  let end = index + 1
  while (end < selector.length && selector[end].type !== 'combinator') end++
  const before = selector.slice(start, index)
  const after = selector.slice(index + 1, end)
  let branchLast = branch.length
  while (branchLast > 0 && branch[branchLast - 1].type !== 'combinator') branchLast--
  const merged = mergeCompound([...before, ...branch.slice(branchLast), ...pads, ...after])
  if (merged === null) return null
  return [...selector.slice(0, start), ...branch.slice(0, branchLast), ...merged, ...selector.slice(end)]
}

/** Expand the first eligible top-level `:is()` list, recursively. */
function expand(selector: Selector, budget: number): Selector[] {
  const parts = compounds(selector)
  let compoundIndex = 0
  for (let index = 0; index < selector.length; index++) {
    const component = selector[index]
    if (component.type === 'combinator') {
      compoundIndex++
      continue
    }
    if (component.type !== 'pseudo-class' || component.kind !== 'is') continue
    const branches = (component as { selectors: SelectorList }).selectors
    if (branches.length < 2 || branches.length > budget) continue
    if (branches.some(branch => branch.some(unsafeComponent))) continue
    if (branches.some(hasCombinator)) {
      const prefix = parts.slice(0, compoundIndex)
      if (!prefix.every(anchoredOnRoot)) continue
      let previous = index - 1
      while (previous >= 0 && selector[previous].type !== 'combinator') previous--
      if (previous >= 0 && (selector[previous] as { value: string }).value !== 'descendant') continue
      if (branches.some(branch => hasCombinator(branch) && mayMatchRoot(compounds(branch)[0]))) continue
    }
    const target = maxSpecificity(branches)
    const expanded: Selector[] = []
    let valid = true
    for (const branch of branches) {
      let own = specificity(branch)
      let replacement = branch
      if (compare(own, target) !== 0 && [0, 1, 2].some(i => target[i] < own[i])) {
        // `:is(dialog, [role=dialog])` is (0,1,0): no pad can lower `dialog`'s
        // type count, so a compound branch restarts from `:where()` at zero.
        if (hasCombinator(branch)) {
          valid = false
          break
        }
        replacement = [{ type: 'pseudo-class', kind: 'where', selectors: [branch] } as SelectorComponent]
        own = [0, 0, 0]
      }
      const deficit: Specificity = [target[0] - own[0], target[1] - own[1], target[2] - own[2]]
      const next = splice(selector, index, replacement, padding(deficit))
      if (next === null) {
        valid = false
        break
      }
      expanded.push(next)
    }
    if (!valid) continue
    const share = Math.max(1, Math.floor(budget / branches.length))
    return expanded.flatMap(next => expand(next, share))
  }
  return [selector]
}

/** Root elements can receive classes, ids and attributes from other plugins. */
function mayMatchRoot(compound: SelectorComponent[]): boolean {
  for (const component of compound) {
    if (component.type === 'type' && !ROOT_TYPES.has(component.name.toLowerCase())) return false
  }
  return true
}

/**
 * Two lightningcss visitors over the same stylesheet source. `collect` runs in
 * a first transform and records every rule-level selector; `expand` runs in
 * the real transform. The
 * Selector hook also sees selectors nested in :not()/:has(), whose anchor is
 * not the rule's subject, so only recorded rule-level selectors are expanded.
 * (Returning whole rules instead would round-trip their declarations, which
 * lightningcss 1.33 cannot deserialize for CSS Modules `var()` names.)
 */
export function createSelectorExpansion(): { collect: Visitor<never>, expand: Visitor<never> } {
  const ruleSelectors = new Set<string>()
  return {
    collect: {
      Rule: {
        style(rule) {
          for (const selector of rule.value.selectors) ruleSelectors.add(JSON.stringify(selector))
        },
      },
    },
    expand: {
      Selector(selector) {
        if (!ruleSelectors.has(JSON.stringify(selector))) return
        const expanded = expand(selector, EXPANSION_BUDGET)
        return expanded.length > 1 ? expanded : undefined
      },
    },
  }
}
