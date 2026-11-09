import { useEffect, useRef, useState, useSyncExternalStore, type DragEvent as ReactDragEvent, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react'
import { type SkinCatalogEntry, type SkinTarget, type SkinVersionInfo, SKIN_MANAGER_ROUTE } from '../contract.ts'
import type {
  SkinCustomizationDefinition,
  SkinSetting,
  SkinSettingValue,
  TimeRange,
  VisibilitySchedule,
} from '../protocol.ts'
import { layoutSettings, settingLock, settingVisible, SkinCustomizationRegistry, type SettingNode } from './runtime.ts'
import { currentUiLang, definitionTitle, groupLabel, optionLabel, settingDescription, settingLabel, skinManagerCopy, useUiLang } from './locale.ts'
import { activeSkins, isDesktopShell, waitForSkins } from './switch-settle.ts'
import {
  buildPreferencesExport,
  defaultExportFileName,
  importPreferencesFromText,
  PREFERENCES_IMPORT_MAX_TEXT_BYTES,
  PreferencesImportError,
  serializePreferencesExport,
} from './transfer.ts'
import { Button, Switch } from '@deepseek-ai/dsh-client-ui-primitives'
import css from './skin-manager.module.css'

interface SkinManagerInjected {
  registry: SkinCustomizationRegistry
  active(catalog: SkinCatalogEntry[]): SkinTarget | 'unknown'
  /** `acceptRisk` grants the exact skin/DSH version pair the host otherwise refuses. */
  switchSkin(target: SkinTarget, acceptRisk?: boolean): Promise<void>
}

const shortDate = (iso: string | null): string => iso === null ? '' : iso.slice(0, 10)

/**
 * Version facts under one skin card: the short local identity (click to copy
 * the full one), then the comparison once the user has asked for it. Nothing
 * is shown for a comparison that has not run.
 */
function VersionFacts({ info, onCopied }: { info: SkinVersionInfo | undefined, onCopied(ok: boolean): void }) {
  const copy = skinManagerCopy(useUiLang())
  if (info === undefined) return null
  const local = info.local
  const remote = info.remote
  const latest = remote?.latest ?? null
  const copyHash = async (hash: string): Promise<void> => {
    try {
      await navigator.clipboard?.writeText(hash)
      onCopied(true)
    } catch {
      onCopied(false)
    }
  }
  return (
    <>
      {info.source !== 'none' && local !== null && (
        <button
          type="button"
          className={css.versionHash}
          title={info.source === 'git' ? copy.gitHashTitle(local.hash, local.date) : copy.buildHashTitle(local.hash)}
          onClick={() => void copyHash(local.hash)}
        >
          {local.short}
        </button>
      )}
      {remote?.state === 'up-to-date' && latest !== null && <span className={css.versionOk}>{copy.upToDate}</span>}
      {remote?.state === 'update-available' && latest !== null && (
        <span className={css.versionUpdate} title={latest.message}>{copy.updateAvailable(latest.short, shortDate(latest.date))}</span>
      )}
      {remote?.state === 'local-ahead' && latest !== null && <span title={latest.short}>{copy.localAhead}</span>}
      {remote?.state === 'diverged' && latest !== null && <span title={latest.short}>{copy.diverged}</span>}
      {remote?.state === 'unknown' && <span>{copy.unknownUpdate}</span>}
      {info.dirty && <span>{copy.localDirty}</span>}
      {info.note !== undefined && <span>{info.note}</span>}
    </>
  )
}

/** Title plus optional description, in the host settings row typography. */
function RowText({ label, description }: { label: string, description?: string }) {
  return (
    <span className={css.rowText}>
      <span className={css.rowTitle}>{label}</span>
      {description && <small className={css.rowDescription}>{description}</small>}
    </span>
  )
}

/**
 * A boolean row drawn with the host's own Switch (ui-primitives, a platform
 * module), so it matches the Plugins page and follows whatever each skin does
 * to the product switch. Only the switch toggles; the row copy stays text.
 */
function Toggle({ checked, label, description, disabled = false, onChange }: {
  checked: boolean
  label: string
  description?: string
  disabled?: boolean
  onChange(value: boolean): void
}) {
  return (
    <div className={css.toggleRow}>
      <RowText label={label} description={description} />
      <Switch checked={checked} label={label} disabled={disabled} onChange={onChange} />
    </div>
  )
}

const padTime = (part: number): string => String(part).padStart(2, '0')

/**
 * Hour/minute pair picker. A native `input[type=time]` opens the
 * operating system's popup, which no stylesheet can reach; two hour/minute
 * selects keep the same "HH:MM" value contract while letting every skin
 * (and the generic --dsw-* theme) dress both the closed control and the open
 * list — the same customizable-select surface as the other setting rows.
 */
function TimeSelect({ label, value, onChange }: {
  label: string
  value: string
  onChange(value: string): void
}) {
  const copy = skinManagerCopy(useUiLang())
  const [hour = '00', minute = '00'] = value.split(':')
  const setHour = (hour: string): void => onChange(`${hour}:${minute}`)
  const setMinute = (minute: string): void => onChange(`${hour}:${minute}`)
  return (
    <span className={css.timeSelect}>
      <select className={css.selectInput} aria-label={copy.hourAria(label)} value={hour} onChange={event => setHour(event.currentTarget.value)}>
        {Array.from({ length: 24 }, (_, hour) => (
          <option key={hour} value={padTime(hour)}>{padTime(hour)}</option>
        ))}
      </select>
      <span className={css.timeColon} aria-hidden="true">:</span>
      <select className={css.selectInput} aria-label={copy.minuteAria(label)} value={minute} onChange={event => setMinute(event.currentTarget.value)}>
        {Array.from({ length: 60 }, (_, minute) => (
          <option key={minute} value={padTime(minute)}>{padTime(minute)}</option>
        ))}
      </select>
    </span>
  )
}

/**
 * A schedule is a switch with dependent rows: the rule and the periods sit in
 * the same indented block that every other dependent control uses, and only
 * while the schedule is on.
 */
export function ScheduleEditor({ setting, value, description, onChange }: {
  setting: Extract<SkinSetting, { type: 'visibility-schedule' }>
  value: VisibilitySchedule
  description?: string
  onChange(value: VisibilitySchedule): void
}) {
  const lang = useUiLang()
  const copy = skinManagerCopy(lang)
  const updateRange = (index: number, patch: Partial<TimeRange>): void => onChange({
    ...value,
    ranges: value.ranges.map((range, current) => current === index ? { ...range, ...patch } : range),
  })
  return (
    <div className={css.schedule}>
      <Toggle
        checked={value.enabled}
        label={settingLabel(setting, lang)}
        description={description ?? settingDescription(setting, lang)}
        onChange={enabled => onChange({ ...value, enabled })}
      />
      {value.enabled && (
        <div className={css.children}>
          <label className={css.selectRow}>
            <RowText label={copy.schedulePolicy} />
            <select className={css.selectInput} value={value.outside} onChange={event => onChange({ ...value, outside: event.currentTarget.value as VisibilitySchedule['outside'] })}>
              <option value="visible">{copy.policyHideInRanges}</option>
              <option value="hidden">{copy.policyShowInRanges}</option>
            </select>
          </label>
          <div className={css.rangeList}>
            {value.ranges.map((range, index) => (
              <div className={css.rangeRow} key={index}>
                <TimeSelect
                  label={copy.rangeStartAria(index + 1)}
                  value={range.start}
                  onChange={start => updateRange(index, { start })}
                />
                <span>{copy.rangeTo}</span>
                <TimeSelect
                  label={copy.rangeEndAria(index + 1)}
                  value={range.end}
                  onChange={end => updateRange(index, { end })}
                />
                <Button variant="outline" size="sm" onClick={() => onChange({ ...value, ranges: value.ranges.filter((_, current) => current !== index) })}>{copy.removeRange}</Button>
              </div>
            ))}
            <div className={css.rangeFooter}>
              <Button
                variant="outline"
                size="sm"
                disabled={value.ranges.length >= 24}
                onClick={() => onChange({ ...value, ranges: [...value.ranges, { start: '09:00', end: '12:00' }] })}
              >
                {copy.addRange}
              </Button>
              <small className={css.hint}>{copy.scheduleHint}</small>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Numbers take one of two controls. The slider is for a continuous amount the
 * user judges by eye or ear (brightness, volume) and always shows its value;
 * the stepper is for a small exact quantity (a height in px, a count).
 */
function RangeEditor({ setting, label, description, value, disabled = false, onChange }: {
  setting: Extract<SkinSetting, { type: 'range' }>
  label: string
  description?: string
  value: number
  disabled?: boolean
  onChange(value: number): void
}) {
  const copy = skinManagerCopy(useUiLang())
  if (setting.control === 'stepper') {
    const step = setting.step ?? 1
    const change = (direction: number): void => onChange(
      Math.min(setting.max, Math.max(setting.min, Number((value + direction * step).toPrecision(12)))),
    )
    return (
      <div className={css.selectRow}>
        <RowText label={label} description={description} />
        <div className={css.numberControl} role="group" aria-label={label} aria-disabled={disabled || undefined}>
          <div className={css.stepper}>
            <span className={css.numberValue}>{value}</span>
            <span className={css.stepperArrows}>
              <button type="button" className={css.stepperArrow} aria-label={copy.increaseValue(label)} disabled={disabled || value >= setting.max} onClick={() => change(1)}>
                <svg width="9" height="9" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  <path d="m3 9 4-4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <button type="button" className={css.stepperArrow} aria-label={copy.decreaseValue(label)} disabled={disabled || value <= setting.min} onClick={() => change(-1)}>
                <svg width="9" height="9" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  <path d="m3 5 4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </span>
          </div>
          {setting.unit && <span className={css.numberUnit}>{setting.unit}</span>}
        </div>
      </div>
    )
  }
  return (
    <div className={css.sliderRow}>
      <RowText label={label} description={description} />
      <span className={css.sliderControl}>
        <input
          type="range"
          min={setting.min}
          max={setting.max}
          step={setting.step ?? 1}
          value={value}
          disabled={disabled}
          aria-label={label}
          aria-valuetext={`${value}${setting.unit ?? ''}`}
          onChange={event => onChange(Number(event.currentTarget.value))}
        />
        <span className={css.sliderValue} aria-hidden="true">{value}{setting.unit ?? ''}</span>
      </span>
    </div>
  )
}

interface RgbColor {
  r: number
  g: number
  b: number
}

interface HsvColor {
  h: number
  s: number
  v: number
}

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value))

function hexToRgb(value: string): RgbColor {
  const match = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(value)
  return match === null
    ? { r: 255, g: 83, b: 111 }
    : { r: Number.parseInt(match[1]!, 16), g: Number.parseInt(match[2]!, 16), b: Number.parseInt(match[3]!, 16) }
}

function rgbToHex({ r, g, b }: RgbColor): string {
  return `#${[r, g, b].map(part => Math.round(clamp(part, 0, 255)).toString(16).padStart(2, '0')).join('')}`
}

function rgbToHsv({ r, g, b }: RgbColor): HsvColor {
  const red = r / 255
  const green = g / 255
  const blue = b / 255
  const max = Math.max(red, green, blue)
  const min = Math.min(red, green, blue)
  const delta = max - min
  let hue = 0
  if (delta !== 0) {
    if (max === red) hue = 60 * (((green - blue) / delta) % 6)
    else if (max === green) hue = 60 * ((blue - red) / delta + 2)
    else hue = 60 * ((red - green) / delta + 4)
  }
  return {
    h: hue < 0 ? hue + 360 : hue,
    s: max === 0 ? 0 : delta / max,
    v: max,
  }
}

function hsvToRgb({ h, s, v }: HsvColor): RgbColor {
  const chroma = v * s
  const sector = ((h % 360) + 360) % 360 / 60
  const second = chroma * (1 - Math.abs(sector % 2 - 1))
  const [red, green, blue] = sector < 1 ? [chroma, second, 0]
    : sector < 2 ? [second, chroma, 0]
      : sector < 3 ? [0, chroma, second]
        : sector < 4 ? [0, second, chroma]
          : sector < 5 ? [second, 0, chroma]
            : [chroma, 0, second]
  const match = v - chroma
  return {
    r: (red + match) * 255,
    g: (green + match) * 255,
    b: (blue + match) * 255,
  }
}

function ColorEditor({ label, description, value, disabled = false, onChange }: {
  label: string
  description?: string
  value: string
  disabled?: boolean
  onChange(value: string): void
}) {
  const button = useRef<HTMLButtonElement>(null)
  const popover = useRef<HTMLDivElement>(null)
  const color = rgbToHsv(hexToRgb(value))
  const [hue, setHue] = useState(color.h)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (color.s > 0) setHue(color.h)
  }, [color.h, color.s])

  useEffect(() => {
    const panel = popover.current
    if (panel === null) return
    panel.setAttribute('popover', 'auto')
    const onToggle = (): void => setOpen(panel.matches(':popover-open'))
    panel.addEventListener('toggle', onToggle)
    return () => panel.removeEventListener('toggle', onToggle)
  }, [])

  const positionPopover = (): void => {
    const trigger = button.current
    const panel = popover.current
    if (trigger === null || panel === null) return
    const triggerRect = trigger.getBoundingClientRect()
    const gap = 8
    const edge = 8
    const left = clamp(triggerRect.right - panel.offsetWidth, edge, window.innerWidth - panel.offsetWidth - edge)
    const below = triggerRect.bottom + gap
    const top = below + panel.offsetHeight <= window.innerHeight - edge
      ? below
      : Math.max(edge, triggerRect.top - panel.offsetHeight - gap)
    panel.style.left = `${left}px`
    panel.style.top = `${top}px`
  }

  const togglePopover = (): void => {
    const panel = popover.current
    if (panel === null) return
    if (panel.matches(':popover-open')) panel.hidePopover()
    else {
      panel.showPopover()
      positionPopover()
    }
  }

  const updateSaturationValue = (event: ReactPointerEvent<HTMLDivElement>): void => {
    const target = event.currentTarget
    const rect = target.getBoundingClientRect()
    const saturation = clamp((event.clientX - rect.left) / rect.width, 0, 1)
    const brightness = 1 - clamp((event.clientY - rect.top) / rect.height, 0, 1)
    onChange(rgbToHex(hsvToRgb({ h: hue, s: saturation, v: brightness })))
  }

  const rgb = hexToRgb(value)
  const updateRgb = (channel: keyof RgbColor, raw: string): void => {
    const numeric = Number.parseInt(raw, 10)
    onChange(rgbToHex({ ...rgb, [channel]: Number.isFinite(numeric) ? numeric : 0 }))
  }

  return (
    <div className={css.colorRow}>
      <RowText label={label} description={description} />
      <div className={css.colorControl}>
        <code>{value.toUpperCase()}</code>
        <button
          ref={button}
          type="button"
          className={css.colorButton}
          disabled={disabled}
          aria-label={label}
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={togglePopover}
        >
          <span className={css.colorSwatch} style={{ backgroundColor: value }} />
        </button>
        <div ref={popover} className={css.colorPopover} role="group" aria-label={label}>
          <div
            className={css.colorPalette}
            style={{ backgroundColor: `hsl(${hue} 100% 50%)` }}
            onPointerDown={(event) => {
              event.currentTarget.setPointerCapture(event.pointerId)
              updateSaturationValue(event)
            }}
            onPointerMove={(event) => {
              if (event.currentTarget.hasPointerCapture(event.pointerId)) updateSaturationValue(event)
            }}
          >
            <span
              className={css.colorPaletteMarker}
              style={{ left: `${color.s * 100}%`, top: `${(1 - color.v) * 100}%` }}
            />
          </div>
          <div className={css.colorHueRow}>
            <span className={css.colorPreview} style={{ backgroundColor: value }} />
            <input
              type="range"
              min="0"
              max="359"
              value={Math.round(hue)}
              aria-label={`${label} H`}
              onChange={(event) => {
                const nextHue = Number(event.currentTarget.value)
                setHue(nextHue)
                onChange(rgbToHex(hsvToRgb({ ...color, h: nextHue })))
              }}
            />
          </div>
          <div className={css.colorRgb}>
            {(['r', 'g', 'b'] as const).map(channel => (
              <label key={channel}>
                <input
                  type="number"
                  min="0"
                  max="255"
                  value={Math.round(rgb[channel])}
                  aria-label={`${label} ${channel.toUpperCase()}`}
                  onChange={event => updateRgb(channel, event.currentTarget.value)}
                />
                <span>{channel.toUpperCase()}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function CheckboxGroupEditor({ setting, label, description, value, disabled = false, onChange }: {
  setting: Extract<SkinSetting, { type: 'checkbox-group' }>
  label: string
  description?: string
  value: string[]
  disabled?: boolean
  onChange(value: string[]): void
}) {
  const lang = useUiLang()
  const selected = new Set(value)
  const update = (option: string, checked: boolean): void => {
    if (checked) selected.add(option)
    else selected.delete(option)
    onChange(setting.options
      .map(item => item.value)
      .filter(item => selected.has(item)))
  }
  return (
    <div className={css.checkboxGroup}>
      <RowText label={label} description={description} />
      <div className={css.checkboxGrid} role="group" aria-label={label}>
        {setting.options.map(option => (
          <label className={css.checkboxOption} key={option.value}>
            <input
              type="checkbox"
              checked={selected.has(option.value)}
              disabled={disabled}
              onChange={event => update(option.value, event.currentTarget.checked)}
            />
            <span>{optionLabel(option, lang)}</span>
          </label>
        ))}
      </div>
    </div>
  )
}

function SettingEditor({ setting, value, description, disabled = false, onChange }: {
  setting: SkinSetting
  value: SkinSettingValue
  description?: string
  disabled?: boolean
  onChange(value: SkinSettingValue): void
}) {
  const lang = useUiLang()
  const label = settingLabel(setting, lang)
  if (setting.type === 'boolean') {
    return <Toggle checked={value as boolean} label={label} description={description} disabled={disabled} onChange={onChange} />
  }
  if (setting.type === 'select') {
    return (
      <label className={css.selectRow}>
        <RowText label={label} description={description} />
        <select className={css.selectInput} value={value as string} disabled={disabled} onChange={event => onChange(event.currentTarget.value)}>
          {setting.options.map(option => <option key={option.value} value={option.value}>{optionLabel(option, lang)}</option>)}
        </select>
      </label>
    )
  }
  if (setting.type === 'range') {
    return <RangeEditor setting={setting} label={label} description={description} value={value as number} disabled={disabled} onChange={onChange} />
  }
  if (setting.type === 'color') {
    return <ColorEditor label={label} description={description} value={value as string} disabled={disabled} onChange={onChange} />
  }
  if (setting.type === 'checkbox-group') {
    return (
      <CheckboxGroupEditor
        setting={setting}
        label={label}
        description={description}
        value={value as string[]}
        disabled={disabled}
        onChange={onChange}
      />
    )
  }
  return <ScheduleEditor setting={setting} value={value as VisibilitySchedule} description={description} onChange={onChange} />
}

/**
 * One row and, indented under it, every visible row that depends on it. A
 * locked row (`disabledWhen`) names the control that locks it in place of
 * its description, so the reason sits where the user is looking.
 */
function SettingNodes({ nodes, definition, values, registry }: {
  nodes: SettingNode[]
  definition: SkinCustomizationDefinition
  values: Record<string, SkinSettingValue>
  registry: SkinCustomizationRegistry
}) {
  const lang = useUiLang()
  const copy = skinManagerCopy(lang)
  const visible = nodes.filter(node => settingVisible(node.setting, values, definition.settings))
  return (
    <>
      {visible.map(({ setting, children }) => {
        const lock = settingLock(setting, values, definition.settings)
        const description = !lock.locked
          ? settingDescription(setting, lang)
          : lock.by !== undefined ? copy.lockedBy(settingLabel(lock.by, lang)) : copy.locked
        const shownChildren = children.filter(child => settingVisible(child.setting, values, definition.settings))
        return (
          <div className={css.settingNode} key={setting.key} data-setting-key={setting.key} data-locked={lock.locked || undefined}>
            <SettingEditor
              setting={setting}
              value={values[setting.key]!}
              description={description}
              disabled={lock.locked}
              onChange={value => registry.set(definition, setting.key, value)}
            />
            {shownChildren.length > 0 && (
              <div className={css.children}>
                <SettingNodes nodes={shownChildren} definition={definition} values={values} registry={registry} />
              </div>
            )}
          </div>
        )
      })}
    </>
  )
}

/** The active skin's controls: one titled card per declared group. */
function CustomizationSection({ definition, registry }: {
  definition: SkinCustomizationDefinition
  registry: SkinCustomizationRegistry
}) {
  const lang = useUiLang()
  const copy = skinManagerCopy(lang)
  const values = registry.values(definition)
  const title = definitionTitle(definition, lang)
  const sections = layoutSettings(definition)
    .filter(section => section.nodes.some(node => settingVisible(node.setting, values, definition.settings)))
  const onReset = (): void => {
    if (window.confirm(copy.resetSkinConfirm(title))) registry.resetSkin(definition.skinId)
  }
  return (
    <section className={css.block} data-skin-customization={definition.skinId}>
      <div className={css.blockHead}>
        <h3>{title}</h3>
        <Button variant="outline" size="sm" className={css.resetButton} onClick={onReset}>
          {copy.resetSkinButton}
        </Button>
      </div>
      {sections.map(section => {
        const label = groupLabel(section, lang)
        return (
          <div className={css.group} key={section.key} data-setting-group={section.key || undefined}>
            {label !== undefined && <h4 className={css.groupTitle}>{label}</h4>}
            <div className={css.card}>
              <SettingNodes nodes={section.nodes} definition={definition} values={values} registry={registry} />
            </div>
          </div>
        )
      })}
    </section>
  )
}

/**
 * One choosable look. The card body is the button that switches to it; the
 * facts below it (verified host, version) stay outside the button so the
 * hash can be its own copy control.
 */
function SkinCard({ name, active, switching, disabled, onSelect, children }: {
  name: string
  active: boolean
  switching: boolean
  disabled: boolean
  onSelect(): void
  children?: ReactNode
}) {
  const copy = skinManagerCopy(useUiLang())
  return (
    <li className={css.skinCard} data-active={active || undefined}>
      <button type="button" className={css.skinMain} disabled={disabled} aria-current={active || undefined} onClick={onSelect}>
        <span className={css.skinName}>{name}</span>
        {(active || switching) && <span className={css.skinState}>{active ? copy.stateCurrent : copy.stateSwitching}</span>}
      </button>
      {children !== undefined && <div className={css.skinMeta}>{children}</div>}
    </li>
  )
}

/** Generic settings surface: host-discovered activation plus skin-owned declarations. */
export function SkinManager({ registry, active, switchSkin }: SkinManagerInjected) {
  const { definitions } = useSyncExternalStore(registry.subscribe, registry.getSnapshot)
  const [catalog, setCatalog] = useState<SkinCatalogEntry[]>([])
  const [versions, setVersions] = useState<Map<string, SkinVersionInfo>>(new Map())
  const [loading, setLoading] = useState(true)
  const [checking, setChecking] = useState(false)
  const [switching, setSwitching] = useState<SkinTarget | null>(null)
  const [copied, setCopied] = useState<'ok' | 'fail' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [desktopIcon, setDesktopIcon] = useState<DesktopIconStatus | undefined>(undefined)
  const live = useRef(true)
  const copyTimer = useRef<number | undefined>(undefined)
  const lang = useUiLang()
  const copy = skinManagerCopy(lang)
  const current = active(catalog)
  const currentDefinitions = definitions.filter(definition => definition.skinId === current)
  const skinName = (skin: SkinCatalogEntry): string => lang === 'en' && skin.nameEn !== undefined ? skin.nameEn : skin.name
  const currentSkin = catalog.find(skin => skin.id === current)

  useEffect(() => {
    live.current = true
    setLoading(true)
    // Catalog loading is the core path: optional local Git/fingerprint probes
    // must neither delay it nor discard a successful catalog result.
    void fetchSkinCatalogState().then((state) => {
      if (!live.current) return
      setCatalog(state.skins)
      setDesktopIcon(state.desktopIcon)
    }).catch((reason) => {
      if (live.current) setError(reason instanceof Error ? reason.message : String(reason))
    }).finally(() => {
      if (live.current) setLoading(false)
    })
    void fetchSkinLocalVersions().then((info) => {
      if (live.current) setVersions(info)
    }).catch(() => {
      // Version facts stay empty. This optional diagnostic must not turn
      // catalog discovery into a failed operation.
    })
    return () => {
      live.current = false
      if (copyTimer.current !== undefined) window.clearTimeout(copyTimer.current)
    }
  }, [])

  const choose = (target: SkinTarget): void => {
    // A skin outside its declared DSH range stays disabled by the host until
    // the user accepts that exact version pair; never grant it silently.
    const blocked = catalog.find(skin => skin.id === target)?.compatibility
    const acceptRisk = blocked !== undefined && !blocked.exempted
    if (acceptRisk && !window.confirm(copy.incompatibleConfirm(blocked.runtimeVersion))) return
    setSwitching(target)
    setError(null)
    void switchSkin(target, acceptRisk).then(() => {
      // Only a switch settled without reload returns; re-render the new state.
      if (live.current) setSwitching(null)
    }, (reason) => {
      setSwitching(null)
      setError(reason instanceof Error ? reason.message : String(reason))
    })
  }

  const checkVersions = (): void => {
    setChecking(true)
    setError(null)
    void fetchSkinVersions().then((info) => {
      if (live.current) setVersions(info)
    }).catch((reason) => {
      if (live.current) setError(reason instanceof Error ? reason.message : String(reason))
    }).finally(() => {
      if (live.current) setChecking(false)
    })
  }

  const announceCopied = (ok: boolean): void => {
    setCopied(ok ? 'ok' : 'fail')
    if (copyTimer.current !== undefined) window.clearTimeout(copyTimer.current)
    copyTimer.current = window.setTimeout(() => {
      if (live.current) setCopied(null)
    }, 1600)
  }

  const busy = loading || switching !== null

  return (
    <div className={css.section} data-dsh-skin-manager>
      <h2 className={css.title}>{copy.headerTitle}</h2>

      <section className={css.block}>
        <div className={css.blockHead}>
          <h3>{copy.installedTitle}</h3>
          <Button
            variant="outline"
            size="sm"
            disabled={loading || checking}
            onClick={checkVersions}
          >
            {checking ? copy.checking : copy.checkUpdates}
          </Button>
        </div>
        <ul className={css.skinGrid}>
          <SkinCard
            name={copy.officialName}
            active={current === 'official'}
            switching={switching === 'official'}
            disabled={busy || current === 'official'}
            onSelect={() => choose('official')}
          />
          {catalog.map(skin => (
            <SkinCard
              key={skin.id}
              name={skinName(skin)}
              active={current === skin.id}
              switching={switching === skin.id}
              disabled={busy || current === skin.id}
              onSelect={() => choose(skin.id)}
            >
              {skin.compatibility !== undefined && (
                <span className={skin.compatibility.exempted ? css.metaLine : css.incompatible} data-skin-incompatible={skin.compatibility.exempted ? 'allowed' : 'blocked'}>
                  {skin.compatibility.exempted
                    ? copy.incompatibleAllowed(skin.compatibility.runtimeVersion)
                    : copy.incompatibleBlocked(skin.compatibility.runtimeVersion)}
                </span>
              )}
              {skin.dshCompatibility && <span className={css.metaLine}>{copy.compatibility(skin.dshCompatibility)}</span>}
              <span className={css.versionRow}>
                <VersionFacts info={versions.get(skin.id)} onCopied={announceCopied} />
              </span>
            </SkinCard>
          ))}
        </ul>
        {catalog.length === 0 && !loading && <p className={css.hint}>{copy.noSkins}</p>}
        {copied === 'ok' && <p className={css.hint} role="status">{copy.copiedOk}</p>}
        {copied === 'fail' && <p className={css.error} role="alert">{copy.copyFailed}</p>}
        {loading && <p className={css.hint}>{copy.loadingSkins}</p>}
        {error !== null && <p className={css.error} role="alert">{copy.actionFailed(error)}</p>}
      </section>

      {currentDefinitions.map(definition => (
        <CustomizationSection key={definition.skinId} definition={definition} registry={registry} />
      ))}
      {!loading && currentSkin !== undefined && currentDefinitions.length === 0 && (
        <section className={css.block}>
          <div className={css.blockHead}><h3>{skinName(currentSkin)}</h3></div>
          <p className={css.hint}>{copy.noSettings}</p>
        </section>
      )}
      {desktopIcon !== undefined && <DesktopIconCard initial={desktopIcon} />}
      <BackupCard registry={registry} />
    </div>
  )
}

/**
 * Opt-in Windows desktop shortcut icon. The host only reports the status on
 * the desktop shell, so the card never renders in a browser.
 */
function DesktopIconCard({ initial }: { initial: DesktopIconStatus }) {
  const copy = skinManagerCopy(useUiLang())
  const [enabled, setEnabled] = useState(initial.enabled)
  const [pending, setPending] = useState(false)
  const [outcome, setOutcome] = useState<DesktopIconOutcome | null>(null)
  const [error, setError] = useState<string | null>(null)
  const live = useRef(true)
  useEffect(() => {
    live.current = true
    return () => {
      live.current = false
    }
  }, [])
  const toggle = (next: boolean): void => {
    setPending(true)
    setOutcome(null)
    setError(null)
    void requestDesktopIcon(next).then((result) => {
      if (!live.current) return
      setEnabled(result.enabled)
      setOutcome(result)
    }).catch((reason) => {
      if (live.current) setError(reason instanceof Error ? reason.message : String(reason))
    }).finally(() => {
      if (live.current) setPending(false)
    })
  }
  return (
    <section className={css.block} data-dsh-skin-desktop-icon>
      <div className={css.blockHead}><h3>{copy.desktopIconTitle}</h3></div>
      <div className={css.card}>
        <div className={css.settingNode}>
          <Toggle
            checked={enabled}
            label={copy.desktopIconLabel}
            description={copy.desktopIconDescription}
            disabled={pending}
            onChange={toggle}
          />
        </div>
      </div>
      {pending && <p className={css.hint} role="status">{copy.desktopIconPending}</p>}
      {outcome !== null && <p className={outcome.failed > 0 ? css.error : css.hint} role="status">{copy.desktopIconDone(outcome.updated, outcome.failed, outcome.errors)}</p>}
      {error !== null && <p className={css.error} role="alert">{copy.actionFailed(error)}</p>}
    </section>
  )
}

/**
 * Backup & restore card: export the full preferences snapshot as a versioned
 * JSON file, import one back (file picker, or a file dropped anywhere on the
 * card), and surface the outcome through the same hint/error surface the rest
 * of the manager uses. Imports keep blocks for skins that are not loaded, so
 * the card also offers the one entry point that discards that kept data.
 */
function BackupCard({ registry }: { registry: SkinCustomizationRegistry }) {
  const lang = useUiLang()
  const copy = skinManagerCopy(lang)
  const { definitions } = useSyncExternalStore(registry.subscribe, registry.getSnapshot)
  const fileInput = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [notice, setNotice] = useState<{ kind: 'ok' | 'fail', text: string } | null>(null)
  const live = useRef(true)
  const noticeTimer = useRef<number | undefined>(undefined)

  const registered = new Set(definitions.map(definition => definition.skinId))
  const keptSkins = Object.keys(registry.exportPreferences()).filter(skinId => !registered.has(skinId))

  useEffect(() => {
    live.current = true
    return () => {
      live.current = false
      if (noticeTimer.current !== undefined) window.clearTimeout(noticeTimer.current)
    }
  }, [])

  const announce = (kind: 'ok' | 'fail', text: string): void => {
    if (!live.current) return
    setNotice({ kind, text })
    if (noticeTimer.current !== undefined) window.clearTimeout(noticeTimer.current)
    noticeTimer.current = window.setTimeout(() => {
      if (live.current) setNotice(null)
    }, 4_000)
  }

  const onExport = (): void => {
    try {
      const exported = buildPreferencesExport(registry.exportPreferences())
      const text = serializePreferencesExport(exported)
      const filename = defaultExportFileName()
      const blob = new Blob([text], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = filename
      anchor.rel = 'noopener'
      document.body.append(anchor)
      anchor.click()
      anchor.remove()
      URL.revokeObjectURL(url)
      announce('ok', copy.exportOk)
    } catch (error) {
      announce('fail', copy.importFail(error instanceof Error ? error.message : String(error)))
    }
  }

  const importText = (raw: string): void => {
    try {
      const { preferences, matchedSkins, deferredSkins } = importPreferencesFromText(raw, registry.getSnapshot().definitions)
      const written = registry.importPreferences(preferences)
      announce('ok', deferredSkins.length === 0
        ? copy.importOk(written === 0 ? matchedSkins.length : written)
        : copy.importOkDeferred(matchedSkins.length, deferredSkins.length))
    } catch (error) {
      const message = error instanceof PreferencesImportError
        ? copy.importErrorMessage(error.code)
        : error instanceof Error ? error.message : String(error)
      announce('fail', copy.importFail(message))
    }
  }

  const readFile = (file: File): void => {
    if (!/\.json$/i.test(file.name) && file.type !== 'application/json') {
      announce('fail', copy.importFail(copy.importErrorInvalidEnvelope))
      return
    }
    // Reject on the file's own size before reading it in; the parser repeats the
    // check on the decoded text and then measures configuration content.
    if (file.size > PREFERENCES_IMPORT_MAX_TEXT_BYTES) {
      announce('fail', copy.importFail(copy.importErrorTooLarge))
      return
    }
    file.text().then(importText).catch((error: unknown) => {
      announce('fail', copy.importFail(error instanceof Error ? error.message : String(error)))
    })
  }

  const onClearKept = (): void => {
    if (!window.confirm(copy.clearKeptConfirm(keptSkins.length))) return
    announce('ok', copy.clearKeptOk(registry.removeUnregisteredSkins()))
  }

  const onImportClick = (): void => {
    fileInput.current?.click()
  }

  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const file = event.currentTarget.files?.[0]
    event.currentTarget.value = ''
    if (file === undefined) return
    readFile(file)
  }

  // The composer listens on document; file drags over the import target must
  // stop bubbling before they open its overlay or become message attachments.
  const onDragOver = (event: ReactDragEvent<HTMLDivElement>): void => {
    if (!event.dataTransfer.types.includes('Files')) return
    event.preventDefault()
    event.stopPropagation()
    event.dataTransfer.dropEffect = 'copy'
    setDragging(true)
  }

  const onDragLeave = (event: ReactDragEvent<HTMLDivElement>): void => {
    if (!event.dataTransfer.types.includes('Files')) return
    event.preventDefault()
    event.stopPropagation()
    // Moving between the card's own children fires leave on the old child.
    if (event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget)) return
    setDragging(false)
  }

  const onDrop = (event: ReactDragEvent<HTMLDivElement>): void => {
    if (!event.dataTransfer.types.includes('Files')) return
    event.preventDefault()
    event.stopPropagation()
    setDragging(false)
    const file = event.dataTransfer.files?.[0]
    if (file === undefined) return
    readFile(file)
  }

  return (
    <section className={css.block} data-dsh-skin-backup>
      <div className={css.blockHead}><h3>{copy.backupTitle}</h3></div>
      <div
        className={css.card}
        data-dragging={dragging || undefined}
        onDragEnter={onDragOver}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        <div className={css.settingNode}>
          <div className={css.actionRow}>
            <RowText label={copy.backupLabel} description={dragging ? copy.dropActive : copy.backupDescription} />
            <span className={css.rowActions}>
              <Button variant="outline" size="sm" onClick={onExport}>{copy.exportButton}</Button>
              <Button variant="outline" size="sm" onClick={onImportClick}>{copy.importButton}</Button>
            </span>
            <input
              ref={fileInput}
              type="file"
              accept="application/json,.json"
              className={css.fileInput}
              onChange={onFileChange}
            />
          </div>
        </div>
        {keptSkins.length > 0 && (
          <div className={css.settingNode}>
            <div className={css.actionRow}>
              <RowText label={copy.clearKeptLabel(keptSkins.length)} />
              <span className={css.rowActions}>
                <Button variant="outline" size="sm" className={css.resetButton} onClick={onClearKept}>
                  {copy.clearKeptButton}
                </Button>
              </span>
            </div>
          </div>
        )}
      </div>
      {notice !== null && (
        <p className={notice.kind === 'ok' ? css.hint : css.error} role={notice.kind === 'ok' ? 'status' : 'alert'}>{notice.text}</p>
      )}
    </section>
  )
}

/** Present only when the host runs inside the Windows desktop shell. */
interface DesktopIconStatus {
  enabled: boolean
}

/** Installed skin catalog plus host capabilities; never waits for optional version probes. */
export async function fetchSkinCatalogState(): Promise<{ skins: SkinCatalogEntry[], desktopIcon?: DesktopIconStatus }> {
  const response = await fetch(SKIN_MANAGER_ROUTE, { credentials: 'same-origin' })
  const result = await response.json() as { ok?: boolean, skins?: SkinCatalogEntry[], desktopIcon?: { enabled?: unknown }, error?: string }
  if (!response.ok || result.ok !== true || !Array.isArray(result.skins)) {
    throw new Error(result.error ?? `HTTP ${response.status}`)
  }
  return {
    skins: result.skins,
    ...(typeof result.desktopIcon?.enabled === 'boolean' ? { desktopIcon: { enabled: result.desktopIcon.enabled } } : {}),
  }
}

/** Installed skin catalog; never waits for optional version probes. */
export async function fetchSkinCatalog(): Promise<SkinCatalogEntry[]> {
  return (await fetchSkinCatalogState()).skins
}

interface DesktopIconOutcome {
  enabled: boolean
  updated: number
  failed: number
  /** Reasons PowerShell gave for the failed shortcuts. */
  errors?: string[]
}

/** Turn the desktop shortcut icon sync on or off and report how many shortcuts changed. */
export async function requestDesktopIcon(enabled: boolean): Promise<DesktopIconOutcome> {
  const response = await fetch(SKIN_MANAGER_ROUTE, {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ action: 'desktop-icon', enabled }),
  })
  const result = await response.json() as { ok?: boolean, desktopIcon?: DesktopIconOutcome, error?: string }
  if (!response.ok || result.ok !== true || result.desktopIcon === undefined) throw new Error(result.error ?? `HTTP ${response.status}`)
  return result.desktopIcon
}

/** Local-only version rows (git probes / build metadata, no network). */
export async function fetchSkinLocalVersions(): Promise<Map<string, SkinVersionInfo>> {
  const response = await fetch(SKIN_MANAGER_ROUTE, {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ action: 'local-versions' }),
  })
  const result = await response.json() as { ok?: boolean, versions?: SkinVersionInfo[], error?: string }
  if (!response.ok || result.ok !== true || !Array.isArray(result.versions)) {
    throw new Error(result.error ?? `HTTP ${response.status}`)
  }
  return new Map(result.versions.map(version => [version.id, version]))
}

/** Ask the host to compare every installed skin against its GitHub origin. */
export async function fetchSkinVersions(): Promise<Map<string, SkinVersionInfo>> {
  const response = await fetch(SKIN_MANAGER_ROUTE, {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ action: 'versions' }),
  })
  const result = await response.json() as { ok?: boolean, versions?: SkinVersionInfo[], error?: string }
  if (!response.ok || result.ok !== true || !Array.isArray(result.versions)) {
    throw new Error(result.error ?? `HTTP ${response.status}`)
  }
  return new Map(result.versions.map(version => [version.id, version]))
}

/**
 * Same-origin host switch. The page reloads once DSH starts applying the patch
 * rather than after a fixed delay, and the desktop shell keeps the in-place
 * switch (see switch-settle.ts).
 */
export async function requestSkinSwitch(target: SkinTarget, acceptRisk = false): Promise<void> {
  const catalog = await fetchSkinCatalog()
  const desktop = isDesktopShell()
  const before = activeSkins(catalog, document.body).join(',')
  const isTarget = (active: string[]): boolean => target === 'official'
    ? active.length === 0
    : active.length === 1 && active[0] === target
  const cancel = new AbortController()
  // Web reloads at the first change (old skin removed or new one added); the
  // desktop shell waits until the requested skin is mounted in place.
  const settled = waitForSkins(catalog, desktop ? isTarget : active => active.join(',') !== before, document, undefined, cancel.signal)
  try {
    const response = await fetch(SKIN_MANAGER_ROUTE, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(acceptRisk ? { target, acceptRisk: true } : { target }),
    })
    const result = await response.json() as { ok?: boolean, error?: string }
    if (!response.ok || result.ok !== true) throw new Error(result.error ?? `HTTP ${response.status}`)
  } catch (error) {
    cancel.abort()
    throw error
  }
  const completed = await settled
  if (desktop) {
    // A renderer reload replays the shell's startup graph, including disabled skins.
    if (!completed) throw new Error(skinManagerCopy(currentUiLang()).switchRestartRequired)
    return
  }
  window.location.reload()
}
