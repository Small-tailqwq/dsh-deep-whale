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
import css from './skin-manager.module.css'

export interface SkinManagerInjected {
  registry: SkinCustomizationRegistry
  active(catalog: SkinCatalogEntry[]): SkinTarget | 'unknown'
  switchSkin(target: SkinTarget): Promise<void>
}

const shortDate = (iso: string | null): string => iso === null ? '' : iso.slice(0, 10)
const shortMessage = (message: string): string => message.length > 42 ? `${message.slice(0, 42)}…` : message

function VersionRow({ info, onCopied }: { info: SkinVersionInfo, onCopied(): void }) {
  const segment = (text: string, className?: string): ReactNode => (
    <span className={className ?? css.versionMuted}>{text}</span>
  )
  if (info.source === 'none' || info.local === null) {
    return <div className={css.versionRow}>{segment(info.note ?? '版本信息不可用')}</div>
  }
  const copy = async (): Promise<void> => {
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
          ? `完整提交 ${info.local.hash}\n日期 ${info.local.date ?? '未知'}`
          : `完整构建指纹 ${info.local.hash}`}
        onClick={() => void copy()}
      >
        {info.source === 'git' ? '本地提交' : '本地构建'} {info.local.short}
      </button>
      {info.remote === null && segment(info.note ?? '未对比')}
      {info.remote !== null && info.remote.state === 'up-to-date' && remoteLatest !== null && (
        segment(`与远端一致（${remoteLatest.short}）`, css.versionOk)
      )}
      {info.remote !== null && info.remote.state === 'update-available' && remoteLatest !== null && (
        <>
          <span className={css.versionUpdate}>
            仓库有新构建：{remoteLatest.short} · {shortDate(remoteLatest.date)} · {shortMessage(remoteLatest.message ?? '')}
          </span>
        </>
      )}
      {info.remote !== null && info.remote.state === 'local-ahead' && remoteLatest !== null && (
        segment(`本地领先（远端 ${remoteLatest.short}）`)
      )}
      {info.remote !== null && info.remote.state === 'diverged' && remoteLatest !== null && (
        segment(`与远端分叉（远端 ${remoteLatest.short}）`)
      )}
      {info.remote !== null && info.remote.state === 'unknown' && (
        segment('无法判断更新')
      )}
      {info.dirty && segment('本地有未提交修改')}
      {info.note !== undefined && segment(info.note)}
    </div>
  )
}

function Toggle({ checked, label, description, onChange }: {
  checked: boolean
  label: string
  description?: string
  onChange(value: boolean): void
}) {
  return (
    <div className={css.toggleRow}>
      <span>
        <span>{label}</span>
        {description && <small>{description}</small>}
      </span>
      <label className={css.toggleSwitch}>
        <input type="checkbox" role="switch" checked={checked} onChange={event => onChange(event.currentTarget.checked)} />
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
  const [versions, setVersions] = useState<Map<string, SkinVersionInfo>>(new Map())
  const [loading, setLoading] = useState(true)
  const [checking, setChecking] = useState(false)
  const [switching, setSwitching] = useState<SkinTarget | null>(null)
  const [copied, setCopied] = useState<'ok' | 'fail' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const live = useRef(true)
  const copyTimer = useRef<number | undefined>(undefined)
  const current = active(catalog)
  const currentDefinitions = definitions.filter(definition => definition.skinId === current)

  useEffect(() => {
    live.current = true
    setLoading(true)
    // The catalog renders immediately; local version rows load in parallel
    // and must never delay the list or the switching buttons.
    void Promise.all([fetchSkinCatalog(), fetchSkinLocalVersions()]).then(([skins, info]) => {
      if (!live.current) return
      setCatalog(skins)
      setVersions(info)
    }).catch((reason) => {
      if (live.current) setError(reason instanceof Error ? reason.message : String(reason))
    }).finally(() => {
      if (live.current) setLoading(false)
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
        <h2>皮肤管理</h2>
        <p>这里会发现当前 Web profile 中已安装的皮肤。激活由管理器统一处理；详细配置由皮肤按通用协议自行声明并负责应用。每个皮肤下方显示本地提交或构建指纹；「检查更新」只比较官方仓库的构建结果，不会改动你的本地文件。</p>
      </header>

      <section className={css.card}>
        <div className={css.cardHeader}>
          <h3>已安装皮肤</h3>
          <button
            type="button"
            className={css.checkButton}
            disabled={loading || checking}
            onClick={checkVersions}
          >
            {checking ? '检查中…' : '检查更新'}
          </button>
        </div>
        <button
          type="button"
          className={current === 'official' ? css.defaultActive : css.defaultButton}
          disabled={loading || switching !== null || current === 'official'}
          onClick={() => choose('official')}
        >
          <span>
            <span>官方默认</span>
            <small>不启用任何皮肤</small>
          </span>
          <small className={css.defaultState}>
            {current === 'official' ? '当前' : switching === 'official' ? '切换中' : '切换'}
          </small>
        </button>
        <div className={css.skinGrid}>
          {catalog.map(skin => (
            <div key={skin.id} className={css.skinTile}>
              <button
                type="button"
                className={current === skin.id ? css.activeSkin : css.skinButton}
                disabled={loading || switching !== null || current === skin.id}
                onClick={() => choose(skin.id)}
              >
                <span>{skin.name}</span>
                {skin.nameEn && <small>{skin.nameEn}</small>}
                <small>{current === skin.id ? '当前' : switching === skin.id ? '切换中' : '切换'}</small>
              </button>
              {skin.dshCompatibility && (
                <small className={css.compatibility}>已适配 DSH {skin.dshCompatibility}</small>
              )}
              <VersionRow
                info={versions.get(skin.id) ?? { id: skin.id, source: 'none', local: null, remote: null, dirty: false, note: '尚未读取' }}
                onCopied={announceCopied}
              />
            </div>
          ))}
        </div>
        {catalog.length === 0 && !loading && (
          <p className={css.hint}>当前 profile 未发现皮肤包；安装本仓库皮肤后可回到这里激活。</p>
        )}
        {copied === 'ok' && <p className={css.hint}>完整版本标识已复制到剪贴板。</p>}
        {copied === 'fail' && <p className={css.error}>复制失败：浏览器拒绝了剪贴板访问。</p>}
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
