import { useEffect, useState, useSyncExternalStore } from 'react'
import { type SkinCatalogEntry, type SkinTarget, SKIN_MANAGER_ROUTE } from '../contract.ts'
import type {
  SkinCustomizationDefinition,
  SkinSetting,
  SkinSettingValue,
  TimeRange,
  VisibilitySchedule,
} from '../protocol.ts'
import { SkinCustomizationRegistry } from './runtime.ts'
import css from './skin-manager.module.css'

export interface SkinManagerInjected {
  registry: SkinCustomizationRegistry
  active(catalog: SkinCatalogEntry[]): SkinTarget | 'unknown'
  switchSkin(target: SkinTarget): Promise<void>
}

function Toggle({ checked, label, description, onChange }: {
  checked: boolean
  label: string
  description?: string
  onChange(value: boolean): void
}) {
  return (
    <label className={css.toggleRow}>
      <span>
        <span>{label}</span>
        {description && <small>{description}</small>}
      </span>
      <input type="checkbox" role="switch" checked={checked} onChange={event => onChange(event.currentTarget.checked)} />
    </label>
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
  const [hour = '00', minute = '00'] = value.split(':')
  const setHour = (hour: string): void => onChange(`${hour}:${minute}`)
  const setMinute = (minute: string): void => onChange(`${hour}:${minute}`)
  return (
    <span className={css.timeSelect}>
      <select aria-label={`${label} 时`} value={hour} onChange={event => setHour(event.currentTarget.value)}>
        {Array.from({ length: 24 }, (_, hour) => (
          <option key={hour} value={padTime(hour)}>{padTime(hour)}</option>
        ))}
      </select>
      <span className={css.timeColon} aria-hidden="true">:</span>
      <select aria-label={`${label} 分`} value={minute} onChange={event => setMinute(event.currentTarget.value)}>
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
  const updateRange = (index: number, patch: Partial<TimeRange>): void => onChange({
    ...value,
    ranges: value.ranges.map((range, current) => current === index ? { ...range, ...patch } : range),
  })
  return (
    <div className={css.schedule}>
      <Toggle
        checked={value.enabled}
        label={setting.label}
        description={setting.description}
        onChange={enabled => onChange({ ...value, enabled })}
      />
      {value.enabled && (
        <div className={css.scheduleDetails}>
          <label className={css.selectRow}>
            <span>规则方式</span>
            <select value={value.outside} onChange={event => onChange({ ...value, outside: event.currentTarget.value as VisibilitySchedule['outside'] })}>
              <option value="visible">这些时段隐藏，其余时间显示</option>
              <option value="hidden">这些时段显示，其余时间隐藏</option>
            </select>
          </label>
          <div className={css.rangeList}>
            {value.ranges.map((range, index) => (
              <div className={css.rangeRow} key={index}>
                <TimeSelect
                  label={`时段 ${index + 1} 开始`}
                  value={range.start}
                  onChange={start => updateRange(index, { start })}
                />
                <span>至</span>
                <TimeSelect
                  label={`时段 ${index + 1} 结束`}
                  value={range.end}
                  onChange={end => updateRange(index, { end })}
                />
                <button type="button" onClick={() => onChange({ ...value, ranges: value.ranges.filter((_, current) => current !== index) })}>删除</button>
              </div>
            ))}
          </div>
          <button
            type="button"
            className={css.addRange}
            disabled={value.ranges.length >= 24}
            onClick={() => onChange({ ...value, ranges: [...value.ranges, { start: '09:00', end: '12:00' }] })}
          >
            添加时间段
          </button>
          <small className={css.hint}>使用本机时间；支持跨午夜，例如 22:00 至 07:00。时间段按“开始包含、结束不包含”计算。</small>
        </div>
      )}
    </div>
  )
}

function SettingEditor({ setting, value, onChange }: {
  setting: SkinSetting
  value: SkinSettingValue
  onChange(value: SkinSettingValue): void
}) {
  if (setting.type === 'boolean') {
    return <Toggle checked={value as boolean} label={setting.label} description={setting.description} onChange={onChange} />
  }
  if (setting.type === 'select') {
    return (
      <label className={css.selectRow}>
        <span>
          <span>{setting.label}</span>
          {setting.description && <small>{setting.description}</small>}
        </span>
        <select value={value as string} onChange={event => onChange(event.currentTarget.value)}>
          {setting.options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>
      </label>
    )
  }
  return <ScheduleEditor setting={setting} value={value as VisibilitySchedule} onChange={onChange} />
}

function CustomizationCard({ definition, registry }: {
  definition: SkinCustomizationDefinition
  registry: SkinCustomizationRegistry
}) {
  const values = registry.values(definition)
  return (
    <section className={css.card} data-skin-customization={definition.skinId}>
      <h3>{definition.title}</h3>
      {definition.settings.map(setting => (
        <SettingEditor
          key={setting.key}
          setting={setting}
          value={values[setting.key]!}
          onChange={value => registry.set(definition, setting.key, value)}
        />
      ))}
    </section>
  )
}

/** Generic settings surface: host-discovered activation plus skin-owned declarations. */
export function SkinManager({ registry, active, switchSkin }: SkinManagerInjected) {
  const { definitions } = useSyncExternalStore(registry.subscribe, registry.getSnapshot)
  const [catalog, setCatalog] = useState<SkinCatalogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [switching, setSwitching] = useState<SkinTarget | null>(null)
  const [error, setError] = useState<string | null>(null)
  const current = active(catalog)
  const currentDefinitions = definitions.filter(definition => definition.skinId === current)

  useEffect(() => {
    let live = true
    fetchSkinCatalog().then((skins) => {
      if (live) setCatalog(skins)
    }).catch((reason) => {
      if (live) setError(reason instanceof Error ? reason.message : String(reason))
    }).finally(() => {
      if (live) setLoading(false)
    })
    return () => { live = false }
  }, [])

  const choose = (target: SkinTarget): void => {
    setSwitching(target)
    setError(null)
    void switchSkin(target).catch((reason) => {
      setSwitching(null)
      setError(reason instanceof Error ? reason.message : String(reason))
    })
  }

  const targets = [
    { id: 'official', name: '官方默认', nameEn: undefined },
    ...catalog,
  ]

  return (
    <div className={css.section} data-dsh-skin-manager>
      <header className={css.header}>
        <h2>皮肤管理</h2>
        <p>这里会发现当前 Web profile 中已安装的皮肤。激活由管理器统一处理；详细配置由皮肤按通用协议自行声明并负责应用。</p>
      </header>

      <section className={css.card}>
        <h3>已安装皮肤</h3>
        <div className={css.skinGrid}>
          {targets.map(target => (
            <button
              key={target.id}
              type="button"
              className={current === target.id ? css.activeSkin : css.skinButton}
              disabled={loading || switching !== null || current === target.id}
              onClick={() => choose(target.id)}
            >
              <span>{target.name}</span>
              {'nameEn' in target && target.nameEn && <small>{target.nameEn}</small>}
              <small>{current === target.id ? '当前' : switching === target.id ? '切换中' : '切换'}</small>
            </button>
          ))}
        </div>
        {loading && <p className={css.hint}>正在读取已安装皮肤…</p>}
        {error !== null && <p className={css.error}>操作失败：{error}</p>}
      </section>

      {currentDefinitions.map(definition => (
        <CustomizationCard key={definition.skinId} definition={definition} registry={registry} />
      ))}
      {!loading && current !== 'official' && current !== 'unknown' && currentDefinitions.length === 0 && (
        <section className={css.card}>
          <h3>详细配置</h3>
          <p className={css.hint}>当前皮肤尚未暴露可配置项；仍可在上方正常激活和切换。</p>
        </section>
      )}
    </div>
  )
}

export async function fetchSkinCatalog(): Promise<SkinCatalogEntry[]> {
  const response = await fetch(SKIN_MANAGER_ROUTE, { credentials: 'same-origin' })
  const result = await response.json() as { ok?: boolean, skins?: SkinCatalogEntry[], error?: string }
  if (!response.ok || result.ok !== true || !Array.isArray(result.skins)) {
    throw new Error(result.error ?? `HTTP ${response.status}`)
  }
  return result.skins
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
