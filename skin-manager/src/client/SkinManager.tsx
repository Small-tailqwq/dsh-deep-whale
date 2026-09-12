import { useEffect, useRef, useState, useSyncExternalStore, type DragEvent as ReactDragEvent, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react'
import { type SkinCatalogEntry, type SkinTarget, type SkinVersionInfo, SKIN_MANAGER_ROUTE } from '../contract.ts'
import type {
  SkinCustomizationDefinition,
  SkinSetting,
  SkinSettingValue,
  TimeRange,
  VisibilitySchedule,
} from '../protocol.ts'
import { SkinCustomizationRegistry } from './runtime.ts'
import { definitionTitle, optionLabel, settingDescription, settingLabel, skinManagerCopy, useUiLang } from './locale.ts'
import {
  buildPreferencesExport,
  defaultExportFileName,
  importPreferencesFromText,
  PreferencesImportError,
  serializePreferencesExport,
} from './transfer.ts'
import css from './skin-manager.module.css'

export interface SkinManagerInjected {
  registry: SkinCustomizationRegistry
  active(catalog: SkinCatalogEntry[]): SkinTarget | 'unknown'
  switchSkin(target: SkinTarget): Promise<void>
}

const shortDate = (iso: string | null): string => iso === null ? '' : iso.slice(0, 10)
const shortMessage = (message: string): string => message.length > 42 ? `${message.slice(0, 42)}…` : message

function VersionRow({ info, onCopied }: { info: SkinVersionInfo, onCopied(): void }) {
  const copy = skinManagerCopy(useUiLang())
  const segment = (text: string, className?: string): ReactNode => (
    <span className={className ?? css.versionMuted}>{text}</span>
  )
  if (info.source === 'none' || info.local === null) {
    return <div className={css.versionRow}>{segment(info.note ?? copy.versionUnavailable)}</div>
  }
  const copyHash = async (): Promise<void> => {
    try {
      await navigator.clipboard?.writeText(info.local!.hash)
      onCopied(true)
    } catch {
      onCopied(false)
    }
  }
  const remoteLatest = info.remote?.latest
  return (
    <div className={css.versionRow}>
      <button
        type="button"
        className={css.versionHash}
        title={info.source === 'git'
          ? copy.gitHashTitle(info.local.hash, info.local.date)
          : copy.buildHashTitle(info.local.hash)}
        onClick={() => void copyHash()}
      >
        {info.source === 'git' ? copy.localCommit : copy.localBuild} {info.local.short}
      </button>
      {info.remote === null && segment(info.note ?? copy.notCompared)}
      {info.remote !== null && info.remote.state === 'up-to-date' && remoteLatest !== null && (
        segment(copy.upToDate(remoteLatest.short), css.versionOk)
      )}
      {info.remote !== null && info.remote.state === 'update-available' && remoteLatest !== null && (
        <>
          <span className={css.versionUpdate}>
            {copy.updateAvailable(remoteLatest.short, shortDate(remoteLatest.date), shortMessage(remoteLatest.message ?? ''))}
          </span>
        </>
      )}
      {info.remote !== null && info.remote.state === 'local-ahead' && remoteLatest !== null && (
        segment(copy.localAhead(remoteLatest.short))
      )}
      {info.remote !== null && info.remote.state === 'diverged' && remoteLatest !== null && (
        segment(copy.diverged(remoteLatest.short))
      )}
      {info.remote !== null && info.remote.state === 'unknown' && (
        segment(copy.unknownUpdate)
      )}
      {info.dirty && segment(copy.localDirty)}
      {info.note !== undefined && segment(info.note)}
    </div>
  )
}

function Toggle({ checked, label, description, disabled = false, onChange }: {
  checked: boolean
  label: string
  description?: string
  disabled?: boolean
  onChange(value: boolean): void
}) {
  return (
    <div className={css.toggleRow}>
      <span>
        <span>{label}</span>
        {description && <small>{description}</small>}
      </span>
      <label className={css.toggleSwitch}>
        <input type="checkbox" role="switch" checked={checked} disabled={disabled} onChange={event => onChange(event.currentTarget.checked)} />
      </label>
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
      <select aria-label={copy.hourAria(label)} value={hour} onChange={event => setHour(event.currentTarget.value)}>
        {Array.from({ length: 24 }, (_, hour) => (
          <option key={hour} value={padTime(hour)}>{padTime(hour)}</option>
        ))}
      </select>
      <span className={css.timeColon} aria-hidden="true">:</span>
      <select aria-label={copy.minuteAria(label)} value={minute} onChange={event => setMinute(event.currentTarget.value)}>
        {Array.from({ length: 60 }, (_, minute) => (
          <option key={minute} value={padTime(minute)}>{padTime(minute)}</option>
        ))}
      </select>
    </span>
  )
}

export function ScheduleEditor({ setting, value, onChange }: {
  setting: Extract<SkinSetting, { type: 'visibility-schedule' }>
  value: VisibilitySchedule
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
        description={settingDescription(setting, lang)}
        onChange={enabled => onChange({ ...value, enabled })}
      />
      {value.enabled && (
        <div className={css.scheduleDetails}>
          <label className={css.selectRow}>
            <span>{copy.schedulePolicy}</span>
            <select value={value.outside} onChange={event => onChange({ ...value, outside: event.currentTarget.value as VisibilitySchedule['outside'] })}>
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
                <button type="button" onClick={() => onChange({ ...value, ranges: value.ranges.filter((_, current) => current !== index) })}>{copy.removeRange}</button>
              </div>
            ))}
          </div>
          <button
            type="button"
            className={css.addRange}
            disabled={value.ranges.length >= 24}
            onClick={() => onChange({ ...value, ranges: [...value.ranges, { start: '09:00', end: '12:00' }] })}
          >
            {copy.addRange}
          </button>
          <small className={css.hint}>{copy.scheduleHint}</small>
        </div>
      )}
    </div>
  )
}

function RangeEditor({ setting, label, description, value, disabled = false, onChange }: {
  setting: Extract<SkinSetting, { type: 'range' }>
  label: string
  description?: string
  value: number
  disabled?: boolean
  onChange(value: number): void
}) {
  return (
    <label className={css.sliderRow}>
      <span>
        <span>{label}</span>
        {description && <small>{description}</small>}
      </span>
      <span className={css.sliderValue}>{value}{setting.unit ?? ''}</span>
      <input
        type="range"
        min={setting.min}
        max={setting.max}
        step={setting.step ?? 1}
        value={value}
        disabled={disabled}
        aria-label={label}
        onChange={event => onChange(Number(event.currentTarget.value))}
      />
    </label>
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
      <span>
        <span>{label}</span>
        {description && <small>{description}</small>}
      </span>
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
        <div ref={popover} className={css.colorPopover} role="group" aria-label={`${label}色盘`}>
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
              aria-label={`${label}色相`}
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
      <span className={css.checkboxGroupHeading}>
        <span>{label}</span>
        {description && <small>{description}</small>}
      </span>
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

function SettingEditor({ setting, value, disabled = false, onChange }: {
  setting: SkinSetting
  value: SkinSettingValue
  disabled?: boolean
  onChange(value: SkinSettingValue): void
}) {
  const lang = useUiLang()
  const label = settingLabel(setting, lang)
  const description = settingDescription(setting, lang)
  if (setting.type === 'boolean') {
    return <Toggle checked={value as boolean} label={label} description={description} disabled={disabled} onChange={onChange} />
  }
  if (setting.type === 'select') {
    return (
      <label className={css.selectRow}>
        <span>
          <span>{label}</span>
          {description && <small>{description}</small>}
        </span>
        <select value={value as string} disabled={disabled} onChange={event => onChange(event.currentTarget.value)}>
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
  return <ScheduleEditor setting={setting} value={value as VisibilitySchedule} onChange={onChange} />
}

function settingVisible(setting: SkinSetting, values: Record<string, SkinSettingValue>): boolean {
  const condition = setting.visibleWhen
  if (condition === undefined) return true
  const value = values[condition.key]
  return condition.values.some(candidate => candidate === value)
}

function CustomizationCard({ definition, registry }: {
  definition: SkinCustomizationDefinition
  registry: SkinCustomizationRegistry
}) {
  const lang = useUiLang()
  const copy = skinManagerCopy(lang)
  const values = registry.values(definition)
  const onReset = (): void => {
    if (window.confirm(copy.resetSkinConfirm)) registry.resetSkin(definition.skinId)
  }
  return (
    <section className={css.card} data-skin-customization={definition.skinId}>
      <div className={css.cardHeader}>
        <h3>{definitionTitle(definition, lang)}</h3>
        <button
          type="button"
          className={css.resetButton}
          onClick={onReset}
        >
          {copy.resetSkinButton}
        </button>
      </div>
      {definition.settings.map(setting => {
        if (!settingVisible(setting, values)) return null
        const disabled = setting.disabledWhen !== undefined && values[setting.disabledWhen] === true
        return (
          <SettingEditor
            key={setting.key}
            setting={setting}
            value={values[setting.key]!}
            disabled={disabled}
            onChange={value => registry.set(definition, setting.key, value)}
          />
        )
      })}
    </section>
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
  const live = useRef(true)
  const copyTimer = useRef<number | undefined>(undefined)
  const lang = useUiLang()
  const copy = skinManagerCopy(lang)
  const current = active(catalog)
  const currentDefinitions = definitions.filter(definition => definition.skinId === current)

  useEffect(() => {
    live.current = true
    setLoading(true)
    // Catalog loading is the core path: optional local Git/fingerprint probes
    // must neither delay it nor discard a successful catalog result.
    void fetchSkinCatalog().then((skins) => {
      if (!live.current) return
      setCatalog(skins)
    }).catch((reason) => {
      if (live.current) setError(reason instanceof Error ? reason.message : String(reason))
    }).finally(() => {
      if (live.current) setLoading(false)
    })
    void fetchSkinLocalVersions().then((info) => {
      if (live.current) setVersions(info)
    }).catch(() => {
      // Version rows retain their per-skin "尚未读取" fallback. This optional
      // diagnostic must not turn catalog discovery into a failed operation.
    })
    return () => {
      live.current = false
      if (copyTimer.current !== undefined) window.clearTimeout(copyTimer.current)
    }
  }, [])

  const choose = (target: SkinTarget): void => {
    setSwitching(target)
    setError(null)
    void switchSkin(target).catch((reason) => {
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

  return (
    <div className={css.section} data-dsh-skin-manager>
      <header className={css.header}>
        <h2>{copy.headerTitle}</h2>
        <p>{copy.headerIntro}</p>
      </header>

      <section className={css.card}>
        <div className={css.cardHeader}>
          <h3>{copy.installedTitle}</h3>
          <button
            type="button"
            className={css.checkButton}
            disabled={loading || checking}
            onClick={checkVersions}
          >
            {checking ? copy.checking : copy.checkUpdates}
          </button>
        </div>
        <button
          type="button"
          className={current === 'official' ? css.defaultActive : css.defaultButton}
          disabled={loading || switching !== null || current === 'official'}
          onClick={() => choose('official')}
        >
          <span>
            <span>{copy.officialName}</span>
            <small>{copy.officialDescription}</small>
          </span>
          <small className={css.defaultState}>
            {current === 'official' ? copy.stateCurrent : switching === 'official' ? copy.stateSwitching : copy.stateSwitch}
          </small>
        </button>
        <div className={css.skinGrid}>
          {catalog.map(skin => {
            // English UI: lead with the English name and demote the Chinese
            // one to the subtitle, mirroring the default zh presentation.
            const primaryName = lang === 'en' && skin.nameEn !== undefined ? skin.nameEn : skin.name
            const secondaryName = lang === 'en' ? (skin.nameEn !== undefined ? skin.name : undefined) : skin.nameEn
            return (
              <div key={skin.id} className={css.skinTile}>
                <button
                  type="button"
                  className={current === skin.id ? css.activeSkin : css.skinButton}
                  disabled={loading || switching !== null || current === skin.id}
                  onClick={() => choose(skin.id)}
                >
                  <span>{primaryName}</span>
                  {secondaryName !== undefined && <small>{secondaryName}</small>}
                  <small>{current === skin.id ? copy.stateCurrent : switching === skin.id ? copy.stateSwitching : copy.stateSwitch}</small>
                </button>
                {skin.dshCompatibility && (
                  <small className={css.compatibility}>{copy.compatibility(skin.dshCompatibility)}</small>
                )}
                <VersionRow
                  info={versions.get(skin.id) ?? { id: skin.id, source: 'none', local: null, remote: null, dirty: false, note: copy.versionUnread }}
                  onCopied={announceCopied}
                />
              </div>
            )
          })}
        </div>
        {catalog.length === 0 && !loading && (
          <p className={css.hint}>{copy.noSkins}</p>
        )}
        {copied === 'ok' && <p className={css.hint}>{copy.copiedOk}</p>}
        {copied === 'fail' && <p className={css.error}>{copy.copyFailed}</p>}
        {loading && <p className={css.hint}>{copy.loadingSkins}</p>}
        {error !== null && <p className={css.error}>{copy.actionFailed(error)}</p>}
      </section>

      {currentDefinitions.map(definition => (
        <CustomizationCard key={definition.skinId} definition={definition} registry={registry} />
      ))}
      {!loading && current !== 'official' && current !== 'unknown' && currentDefinitions.length === 0 && (
        <section className={css.card}>
          <h3>{copy.settingsTitle}</h3>
          <p className={css.hint}>{copy.noSettings}</p>
        </section>
      )}
      <BackupCard registry={registry} />
    </div>
  )
}

/**
 * Backup & restore card: export the full preferences snapshot as a versioned
 * JSON file, import one back (file picker or drag-and-drop), and surface the
 * outcome through the same hint/error surface the rest of the manager uses.
 */
function BackupCard({ registry }: { registry: SkinCustomizationRegistry }) {
  const lang = useUiLang()
  const copy = skinManagerCopy(lang)
  const fileInput = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [notice, setNotice] = useState<{ kind: 'ok' | 'fail', text: string } | null>(null)
  const live = useRef(true)
  const noticeTimer = useRef<number | undefined>(undefined)

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
      const { preferences, matchedSkins } = importPreferencesFromText(raw, registry.getSnapshot().definitions)
      const written = registry.importPreferences(preferences)
      announce('ok', copy.importOk(written === 0 ? matchedSkins.length : written))
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
    file.text().then(importText).catch((error: unknown) => {
      announce('fail', copy.importFail(error instanceof Error ? error.message : String(error)))
    })
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
    <section className={css.card} data-dsh-skin-backup>
      <div className={css.cardHeader}>
        <h3>{copy.backupTitle}</h3>
      </div>
      <p className={css.hint}>{copy.backupIntro}</p>
      <div className={css.backupActions}>
        <button type="button" className={css.backupButton} onClick={onExport}>{copy.exportButton}</button>
        <button type="button" className={css.backupButton} onClick={onImportClick}>{copy.importButton}</button>
        <input
          ref={fileInput}
          type="file"
          accept="application/json,.json"
          className={css.fileInput}
          onChange={onFileChange}
        />
      </div>
      <div
        className={`${css.dropZone} ${dragging ? css.dropZoneActive : ''}`}
        onDragEnter={onDragOver}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        {dragging ? copy.dropActive : copy.dropHint}
      </div>
      {notice !== null && (
        <p className={notice.kind === 'ok' ? css.hint : css.error}>{notice.text}</p>
      )}
    </section>
  )
}

/** Installed skin catalog; never waits for optional version probes. */
export async function fetchSkinCatalog(): Promise<SkinCatalogEntry[]> {
  const response = await fetch(SKIN_MANAGER_ROUTE, { credentials: 'same-origin' })
  const result = await response.json() as { ok?: boolean, skins?: SkinCatalogEntry[], error?: string }
  if (!response.ok || result.ok !== true || !Array.isArray(result.skins)) {
    throw new Error(result.error ?? `HTTP ${response.status}`)
  }
  return result.skins
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

/** Same-origin host switch with a bounded refresh handoff. */
export async function requestSkinSwitch(target: SkinTarget): Promise<void> {
  const response = await fetch(SKIN_MANAGER_ROUTE, {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ target }),
  })
  const result = await response.json() as { ok?: boolean, error?: string }
  if (!response.ok || result.ok !== true) throw new Error(result.error ?? `HTTP ${response.status}`)
  window.setTimeout(() => window.location.reload(), 1200)
}
