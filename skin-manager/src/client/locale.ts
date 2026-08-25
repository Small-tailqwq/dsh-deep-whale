/**
 * Host-language following for the manager surface. Same heuristic as the
 * orca-link pricing light: `document.documentElement.lang` first (the host
 * repoints it on every locale switch), `navigator.language` as fallback,
 * and any `zh*` tag counts as Chinese. A single shared `lang` observer keeps
 * every subscribed component one mutation away from a re-render, and the
 * observer is dropped as soon as the last subscriber unmounts.
 */
import { useSyncExternalStore } from 'react'
import type { SelectOption, SkinCustomizationDefinition, SkinSetting } from '../protocol.ts'

export type UiLang = 'zh' | 'en'

function detectUiLang(): UiLang {
  const lang = document.documentElement.lang || window.navigator.language || 'en'
  return lang.toLowerCase().startsWith('zh') ? 'zh' : 'en'
}

const listeners = new Set<() => void>()
let observer: MutationObserver | null = null
let lastNotified: UiLang | undefined

function refresh(): void {
  const next = detectUiLang()
  if (next === lastNotified) return
  lastNotified = next
  for (const listener of listeners) listener()
}

/**
 * getSnapshot for useSyncExternalStore. The value is a string primitive read
 * live from the document, so successive calls are `Object.is`-stable for as
 * long as the host locale has not actually changed.
 */
export function uiLangSnapshot(): UiLang {
  return detectUiLang()
}

/** Settings-section markup renders through getServerSnapshot; node-side calls have no DOM. */
function serverUiLang(): UiLang {
  try {
    return detectUiLang()
  } catch {
    return 'zh'
  }
}

export function subscribeUiLang(listener: () => void): () => void {
  listeners.add(listener)
  if (observer === null) {
    lastNotified = detectUiLang()
    observer = new MutationObserver(refresh)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] })
  }
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0 && observer !== null) {
      observer.disconnect()
      observer = null
    }
  }
}

export function useUiLang(): UiLang {
  return useSyncExternalStore(subscribeUiLang, uiLangSnapshot, serverUiLang)
}

/* ------------------------------------------------------------------ */
/* Manager copy. `zh` is the source of truth; typing `en` as `typeof   */
/* zhCopy` makes TypeScript reject a missing or wrongly shaped key.    */
/* ------------------------------------------------------------------ */

const zhCopy = {
  headerTitle: '皮肤管理',
  headerIntro: '这里会发现当前 Web profile 中已安装的皮肤。激活由管理器统一处理；详细配置由皮肤按通用协议自行声明并负责应用。每个皮肤下方显示本地提交或构建指纹；「检查更新」只比较官方仓库的构建结果，不会改动你的本地文件。',
  installedTitle: '已安装皮肤',
  checking: '检查中…',
  checkUpdates: '检查更新',
  officialName: '官方默认',
  officialDescription: '不启用任何皮肤',
  stateCurrent: '当前',
  stateSwitching: '切换中',
  stateSwitch: '切换',
  compatibility: (version: string) => `已适配 DSH ${version}`,
  versionUnread: '尚未读取',
  versionUnavailable: '版本信息不可用',
  localCommit: '本地提交',
  localBuild: '本地构建',
  gitHashTitle: (hash: string, date: string | null) => `完整提交 ${hash}\n日期 ${date ?? '未知'}`,
  buildHashTitle: (hash: string) => `完整构建指纹 ${hash}`,
  notCompared: '未对比',
  upToDate: (short: string) => `与远端一致（${short}）`,
  updateAvailable: (short: string, date: string, message: string) => `仓库有新构建：${short} · ${date} · ${message}`,
  localAhead: (short: string) => `本地领先（远端 ${short}）`,
  diverged: (short: string) => `与远端分叉（远端 ${short}）`,
  unknownUpdate: '无法判断更新',
  localDirty: '本地有未提交修改',
  noSkins: '当前 profile 未发现皮肤包；安装本仓库皮肤后可回到这里激活。',
  copiedOk: '完整版本标识已复制到剪贴板。',
  copyFailed: '复制失败：浏览器拒绝了剪贴板访问。',
  loadingSkins: '正在读取已安装皮肤…',
  actionFailed: (message: string) => `操作失败：${message}`,
  settingsTitle: '详细配置',
  noSettings: '当前皮肤尚未暴露可配置项；仍可在上方正常激活和切换。',
  schedulePolicy: '规则方式',
  policyHideInRanges: '这些时段隐藏，其余时间显示',
  policyShowInRanges: '这些时段显示，其余时间隐藏',
  rangeStartAria: (index: number) => `时段 ${index} 开始`,
  rangeEndAria: (index: number) => `时段 ${index} 结束`,
  hourAria: (label: string) => `${label} 时`,
  minuteAria: (label: string) => `${label} 分`,
  rangeTo: '至',
  removeRange: '删除',
  addRange: '添加时间段',
  scheduleHint: '使用本机时间；支持跨午夜，例如 22:00 至 07:00。时间段按“开始包含、结束不包含”计算。',
}

const enCopy: typeof zhCopy = {
  headerTitle: 'Skin Management',
  headerIntro: 'This page discovers the skins installed in the current Web profile. Activation is handled by the manager; detailed options are declared and applied by each skin over a shared protocol. Every skin lists its local commit or build fingerprint below. "Check updates" only compares against the official repository\'s build results and never touches your local files.',
  installedTitle: 'Installed Skins',
  checking: 'Checking…',
  checkUpdates: 'Check updates',
  officialName: 'Official Default',
  officialDescription: 'No skin applied',
  stateCurrent: 'Current',
  stateSwitching: 'Switching',
  stateSwitch: 'Switch',
  compatibility: (version: string) => `Verified on DSH ${version}`,
  versionUnread: 'Not read yet',
  versionUnavailable: 'Version info unavailable',
  localCommit: 'Local commit',
  localBuild: 'Local build',
  gitHashTitle: (hash: string, date: string | null) => `Full commit ${hash}\nDate ${date ?? 'unknown'}`,
  buildHashTitle: (hash: string) => `Full build fingerprint ${hash}`,
  notCompared: 'Not compared',
  upToDate: (short: string) => `Up to date (${short})`,
  updateAvailable: (short: string, date: string, message: string) => `New build available: ${short} · ${date} · ${message}`,
  localAhead: (short: string) => `Local ahead (remote ${short})`,
  diverged: (short: string) => `Diverged (remote ${short})`,
  unknownUpdate: 'Cannot determine updates',
  localDirty: 'Local changes present',
  noSkins: 'No skin packages found in this profile; install one of this repository\'s skins and return here to activate it.',
  copiedOk: 'Full version identifier copied to the clipboard.',
  copyFailed: 'Copy failed: the browser denied clipboard access.',
  loadingSkins: 'Reading installed skins…',
  actionFailed: (message: string) => `Operation failed: ${message}`,
  settingsTitle: 'Detailed Options',
  noSettings: 'The active skin exposes no configurable options yet; activation and switching above still work normally.',
  schedulePolicy: 'Rule mode',
  policyHideInRanges: 'Hide during these periods, show otherwise',
  policyShowInRanges: 'Show during these periods, hide otherwise',
  rangeStartAria: (index: number) => `Period ${index} start`,
  rangeEndAria: (index: number) => `Period ${index} end`,
  hourAria: (label: string) => `${label} hour`,
  minuteAria: (label: string) => `${label} minute`,
  rangeTo: 'to',
  removeRange: 'Remove',
  addRange: 'Add period',
  scheduleHint: 'Uses local time; crossing midnight is supported, e.g. 22:00 to 07:00. Periods are start-inclusive and end-exclusive.',
}

export function skinManagerCopy(lang: UiLang): typeof zhCopy {
  return lang === 'zh' ? zhCopy : enCopy
}

/* ------------------------------------------------------------------ */
/* Skin-declared copy. The `*En` protocol fields are optional, so every */
/* helper falls back to the Chinese declaration for skins that never    */
/* localized; the manager itself never blocks on a missing translation. */
/* ------------------------------------------------------------------ */

export function definitionTitle(definition: SkinCustomizationDefinition, lang: UiLang): string {
  return lang === 'en' ? definition.titleEn ?? definition.title : definition.title
}

export function settingLabel(setting: SkinSetting, lang: UiLang): string {
  return lang === 'en' ? setting.labelEn ?? setting.label : setting.label
}

export function settingDescription(setting: SkinSetting, lang: UiLang): string | undefined {
  if (setting.description === undefined) return undefined
  return lang === 'en' ? setting.descriptionEn ?? setting.description : setting.description
}

export function optionLabel(option: SelectOption, lang: UiLang): string {
  return lang === 'en' ? option.labelEn ?? option.label : option.label
}
