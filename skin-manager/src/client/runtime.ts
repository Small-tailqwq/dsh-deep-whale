import {
  LEGACY_SKIN_CUSTOMIZATION_PROTOCOL,
  SKIN_CUSTOMIZATION_EVENTS,
  SKIN_CUSTOMIZATION_PROTOCOL,
  type SkinCustomizationDefinition,
  type SkinCustomizationProtocol,
  type SkinCustomizationRegistration,
  type SkinSetting,
  type SkinSettingCondition,
  type SkinSettingValue,
  type VisibilitySchedule,
} from '../protocol.ts'
import { PreferencesStore, mergePreferences, type Preferences } from './preferences.ts'
import { millisecondsToNextMinute, scheduleVisibility } from './schedule.ts'
import { assertPreferencesImportable } from './transfer.ts'

interface RegistrySnapshot {
  definitions: SkinCustomizationDefinition[]
  revision: number
}

/** Owns discovery, persistence fan-out, and clock updates behind one registry interface. */
export class SkinCustomizationRegistry {
  private readonly definitions = new Map<object, SkinCustomizationDefinition>()
  private readonly listeners = new Set<() => void>()
  private snapshot: RegistrySnapshot = { definitions: [], revision: 0 }
  private timer: number | undefined
  private readonly unsubscribeStore: () => void

  constructor(
    private readonly store = new PreferencesStore(),
    private readonly target: Window = window,
    private readonly now: () => Date = () => new Date(),
  ) {
    this.unsubscribeStore = store.subscribe(() => {
      this.applyAll()
      this.emit()
    })
    for (const events of Object.values(SKIN_CUSTOMIZATION_EVENTS)) {
      target.addEventListener(events.register, this.onRegister)
      target.addEventListener(events.unregister, this.onUnregister)
      target.dispatchEvent(new Event(events.ready))
    }
  }

  readonly getSnapshot = (): RegistrySnapshot => this.snapshot

  readonly subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  values(definition: SkinCustomizationDefinition) {
    return this.store.values(definition)
  }

  set(definition: SkinCustomizationDefinition, key: string, value: SkinSettingValue): void {
    this.store.set(definition, key, value)
  }

  /** Manager-owned controls belong to this registry, without a skin discovery broadcast. */
  registerLocal(definition: SkinCustomizationDefinition): () => void {
    const token = {}
    this.definitions.set(token, definition)
    this.rebuildSnapshot()
    this.applyAll()
    return () => {
      if (!this.definitions.delete(token)) return
      definition.apply(null)
      this.rebuildSnapshot()
      this.scheduleClock()
    }
  }

  /** Raw preferences snapshot for export; never mutates store state. */
  exportPreferences(): Preferences {
    return this.store.snapshot()
  }

  /**
   * Replace every skin's preferences in one atomic write. Each block is
   * normalized against its live definition so unknown keys and malformed
   * values never reach the persisted store. Returns the number of skins
   * actually written. The store notifies its subscribers (including this
   * registry's re-apply pass) exactly once, so nothing applies twice.
   *
   * The import is rejected while the store is untouched when the merged result
   * could no longer be exported into a file this manager accepts: kept blocks for
   * unloaded skins accumulate, and an unrestorable backup is worse than a failed
   * import the user can retry after clearing them.
   */
  importPreferences(incoming: Preferences): number {
    assertPreferencesImportable(mergePreferences(this.store.snapshot(), incoming))
    return this.store.replace(this.snapshot.definitions, incoming)
  }

  /** Remove every setting under one skin id; used by per-skin reset flows. */
  resetSkin(skinId: string): boolean {
    return this.store.clearSkin(skinId)
  }

  /**
   * Drop stored blocks for skins the registry does not hold — data an import
   * kept for skins that are not loaded. Returns how many blocks were removed.
   */
  removeUnregisteredSkins(): number {
    return this.store.removeUnregistered(this.snapshot.definitions.map(definition => definition.skinId)).length
  }

  dispose(): void {
    for (const events of Object.values(SKIN_CUSTOMIZATION_EVENTS)) {
      this.target.removeEventListener(events.register, this.onRegister)
      this.target.removeEventListener(events.unregister, this.onUnregister)
    }
    this.unsubscribeStore()
    this.store.dispose()
    if (this.timer !== undefined) this.target.clearTimeout(this.timer)
    for (const definition of this.definitions.values()) definition.apply(null)
    this.definitions.clear()
  }

  private readonly onRegister = (event: Event): void => {
    const detail = event instanceof CustomEvent
      ? event.detail as SkinCustomizationRegistration | undefined
      : undefined
    const protocol = this.eventProtocol(event.type, 'register')
    if (!detail || protocol === undefined || !this.valid(detail.definition, protocol)) return
    this.definitions.set(detail.token, detail.definition)
    this.rebuildSnapshot()
    this.applyAll()
  }

  private readonly onUnregister = (event: Event): void => {
    const detail = event instanceof CustomEvent
      ? event.detail as SkinCustomizationRegistration | undefined
      : undefined
    const protocol = this.eventProtocol(event.type, 'unregister')
    if (!detail || protocol !== detail.definition.protocol || this.definitions.get(detail.token) !== detail.definition) return
    detail.definition.apply(null)
    this.definitions.delete(detail.token)
    this.rebuildSnapshot()
    this.scheduleClock()
  }

  private eventProtocol(type: string, phase: 'register' | 'unregister'): SkinCustomizationProtocol | undefined {
    if (type === SKIN_CUSTOMIZATION_EVENTS[LEGACY_SKIN_CUSTOMIZATION_PROTOCOL][phase]) return LEGACY_SKIN_CUSTOMIZATION_PROTOCOL
    if (type === SKIN_CUSTOMIZATION_EVENTS[SKIN_CUSTOMIZATION_PROTOCOL][phase]) return SKIN_CUSTOMIZATION_PROTOCOL
    return undefined
  }

  private valid(definition: SkinCustomizationDefinition, protocol: SkinCustomizationProtocol): boolean {
    if (definition?.protocol !== protocol || typeof definition.skinId !== 'string' || typeof definition.apply !== 'function' || !Array.isArray(definition.settings)) return false
    // The skin id becomes an object key in the preferences store; `__proto__`
    // cannot be stored as one and would resolve to the prototype instead.
    if (definition.skinId === '__proto__') return false
    // `groups` is optional presentation metadata: a malformed list is dropped
    // at layout time rather than rejecting the skin's controls.
    const settingTypes = new Set(['boolean', 'select', 'range', 'color', 'checkbox-group', 'visibility-schedule'])
    if (!definition.settings.every(setting => setting !== null && typeof setting === 'object' && settingTypes.has(setting.type))) return false
    const keys = definition.settings.map(setting => setting.key)
    return keys.length === new Set(keys).size && keys.every(key => /^[a-zA-Z][a-zA-Z0-9._-]*$/.test(key))
  }

  private rebuildSnapshot(): void {
    this.snapshot = {
      definitions: [...new Set(this.definitions.values())],
      revision: this.snapshot.revision + 1,
    }
    this.listeners.forEach(listener => listener())
  }

  private emit(): void {
    this.snapshot = { ...this.snapshot, revision: this.snapshot.revision + 1 }
    this.listeners.forEach(listener => listener())
  }

  private applyAll(): void {
    const now = this.now()
    for (const definition of new Set(this.definitions.values())) {
      const values = this.store.values(definition)
      const visibility = Object.fromEntries(definition.settings
        .filter(setting => setting.type === 'visibility-schedule')
        .map(setting => [setting.key, scheduleVisibility(values[setting.key] as VisibilitySchedule, now)]))
      try {
        definition.apply({ values, visibility })
      } catch (error) {
        console.error(`[skin-manager] ${definition.skinId} customization failed`, error)
      }
    }
    this.scheduleClock()
  }

  private scheduleClock(): void {
    if (this.timer !== undefined) this.target.clearTimeout(this.timer)
    const hasEnabledSchedule = [...new Set(this.definitions.values())].some((definition) => {
      const values = this.store.values(definition)
      return definition.settings.some(setting => (
        setting.type === 'visibility-schedule'
        && (values[setting.key] as VisibilitySchedule).enabled
      ))
    })
    this.timer = hasEnabledSchedule
      ? this.target.setTimeout(() => this.applyAll(), millisecondsToNextMinute(this.now()))
      : undefined
  }
}

/** Whether one single-key condition holds for the current values. */
export function conditionMatches(condition: SkinSettingCondition, values: Record<string, SkinSettingValue>): boolean {
  const value = values[condition.key]
  return condition.values.some(candidate => candidate === value)
}

/** Every single-key condition a setting's visibility rests on. */
function visibilityConditions(setting: SkinSetting): SkinSettingCondition[] {
  const condition = setting.visibleWhen
  if (condition === undefined) return []
  return 'anyOf' in condition && Array.isArray(condition.anyOf) ? condition.anyOf : [condition]
}

/**
 * Whether a setting should render. `anyOf` is the family-of-switches form: the
 * control shows while any listed condition holds, and the top-level single-key
 * mirror keeps the declaration readable for a manager that predates `anyOf`.
 *
 * With the full `settings` list the check is transitive: a condition only
 * counts while the control it reads is itself shown, so the child of a hidden
 * switch hides with it instead of hanging under an unrelated row.
 */
export function settingVisible(
  setting: SkinSetting,
  values: Record<string, SkinSettingValue>,
  settings?: readonly SkinSetting[],
  seen: Set<string> = new Set(),
): boolean {
  const conditions = visibilityConditions(setting)
  if (conditions.length === 0) return true
  if (seen.has(setting.key)) return false
  seen.add(setting.key)
  return conditions.some((condition) => {
    if (!conditionMatches(condition, values)) return false
    const parent = settings?.find(candidate => candidate.key === condition.key)
    return parent === undefined || settingVisible(parent, values, settings, new Set(seen))
  })
}

/**
 * The `disabledWhen` state of a control: whether it is locked, and the visible
 * row that locks it (named in the row's caption). A lock from a control the
 * user cannot see still holds, because the skin applies that value anyway.
 */
export function settingLock(
  setting: SkinSetting,
  values: Record<string, SkinSettingValue>,
  settings: readonly SkinSetting[],
): { locked: boolean, by?: SkinSetting } {
  if (setting.disabledWhen === undefined || values[setting.disabledWhen] !== true) return { locked: false }
  const parent = settings.find(candidate => candidate.key === setting.disabledWhen)
  return parent !== undefined && settingVisible(parent, values, settings) ? { locked: true, by: parent } : { locked: true }
}

/** One rendered row plus the rows that depend on it. */
export interface SettingNode {
  setting: SkinSetting
  children: SettingNode[]
}

/** One titled block in render order; `label` is undefined for the trailing untitled block. */
export interface SettingSection {
  key: string
  label?: string
  labelEn?: string
  nodes: SettingNode[]
}

/** Keys a setting depends on, through visibility or a lock. */
function parentKeys(setting: SkinSetting): string[] {
  const keys = visibilityConditions(setting).map(condition => condition.key)
  if (setting.disabledWhen !== undefined) keys.push(setting.disabledWhen)
  return keys.filter(key => key !== setting.key)
}

/**
 * Arrange a definition for display. Settings land in their declared group
 * (groups in declaration order, unknown or missing groups in one untitled
 * block at the end), and inside a block every dependent setting sits under the
 * last control it depends on, whatever its position in the array. A skin can
 * therefore append a new option at the end of `settings` and still have it
 * shown with its topic and its parent switch.
 */
export function layoutSettings(definition: SkinCustomizationDefinition): SettingSection[] {
  const declared = Array.isArray(definition.groups)
    ? definition.groups.filter(group => group !== null && typeof group === 'object' && typeof group.key === 'string' && typeof group.label === 'string')
    : []
  const sections: SettingSection[] = declared.map(group => ({ key: group.key, label: group.label, labelEn: group.labelEn, nodes: [] }))
  const sectionKeys = new Set(sections.map(section => section.key))
  const rest: SettingSection = { key: '', nodes: [] }
  const members = new Map<SettingSection, SkinSetting[]>()
  for (const setting of definition.settings) {
    const section = typeof setting.group === 'string' && sectionKeys.has(setting.group)
      ? sections.find(candidate => candidate.key === setting.group)!
      : rest
    members.set(section, [...members.get(section) ?? [], setting])
  }

  for (const section of [...sections, rest]) {
    const list = members.get(section) ?? []
    const index = new Map(list.map((setting, position) => [setting.key, position]))
    const nodes = new Map(list.map(setting => [setting.key, { setting, children: [] } as SettingNode]))
    const parentOf = new Map<string, string>()
    // A control shown by any of several switches hangs under the row those
    // switches share (the maid glasses option sits beside the desktop and
    // mobile model switches, under the artwork switch), right after the last
    // of them; nesting it under one switch would read as "only this one".
    const after = new Map<string, string>()
    const parentsOf = new Map(list.map(setting => [setting.key, [...new Set(parentKeys(setting).filter(key => index.has(key)))]]))
    for (const [key, parents] of parentsOf) {
      if (parents.length === 1) parentOf.set(key, parents[0]!)
    }
    const chain = (key: string): string[] => {
      const keys: string[] = []
      for (let cursor: string | undefined = key; cursor !== undefined && !keys.includes(cursor); cursor = parentOf.get(cursor)) keys.push(cursor)
      return keys
    }
    for (const [key, parents] of parentsOf) {
      if (parents.length < 2) continue
      const chains = parents.map(chain)
      const shared = chains[0]!.find(candidate => chains.every(keys => keys.includes(candidate)))
      if (shared !== undefined) parentOf.set(key, shared)
      after.set(key, parents.reduce((last, parent) => index.get(parent)! > index.get(last)! ? parent : last))
    }
    // A dependency cycle has no top row; attach none of its members.
    for (const key of [...parentOf.keys()]) {
      const path = new Set<string>([key])
      let cursor = parentOf.get(key)
      while (cursor !== undefined && !path.has(cursor)) {
        path.add(cursor)
        cursor = parentOf.get(cursor)
      }
      if (cursor !== undefined) parentOf.delete(key)
    }
    for (const setting of list) {
      const parent = parentOf.get(setting.key)
      const node = nodes.get(setting.key)!
      if (parent === undefined) section.nodes.push(node)
      else nodes.get(parent)!.children.push(node)
    }
    const contains = (node: SettingNode, key: string): boolean => node.setting.key === key || node.children.some(child => contains(child, key))
    const place = (siblings: SettingNode[]): void => {
      for (const node of [...siblings]) {
        const anchor = after.get(node.setting.key)
        if (anchor === undefined) continue
        const from = siblings.indexOf(node)
        const target = siblings.findIndex(sibling => sibling !== node && contains(sibling, anchor))
        if (target > from) siblings.splice(target, 0, ...siblings.splice(from, 1))
      }
      for (const node of siblings) place(node.children)
    }
    place(section.nodes)
  }
  return [...sections, rest].filter(section => section.nodes.length > 0)
}
