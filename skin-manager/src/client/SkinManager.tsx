import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react'
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
  return <ScheduleEditor setting={setting} value={value as VisibilitySchedule} onChange={onChange} />
}

function CustomizationCard({ definition, registry }: {
  definition: SkinCustomizationDefinition
  registry: SkinCustomizationRegistry
}) {
  const lang = useUiLang()
  const values = registry.values(definition)
  return (
    <section className={css.card} data-skin-customization={definition.skinId}>
      <h3>{definitionTitle(definition, lang)}</h3>
      {definition.settings.map(setting => {
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
    </div>
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
