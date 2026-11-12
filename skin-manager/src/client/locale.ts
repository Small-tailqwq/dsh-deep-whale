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

type UiLang = 'zh' | 'en'

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

/**
 * Live read for every caller that is not a React render: the settings-section
 * server snapshot, and — the reason this is exported — slot labels. A
 * `settings.section` label is a plain function the host calls itself, so the
 * manager cannot subscribe for it the way `useUiLang` does; the host
 * recomputes labels on its own locale revision and this read then picks the
 * repointed `<html lang>` up. Node-side calls have no DOM and degrade to the
 * source language.
 */
export function currentUiLang(): UiLang {
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
  return useSyncExternalStore(subscribeUiLang, uiLangSnapshot, currentUiLang)
}

/* ------------------------------------------------------------------ */
/* Manager copy. `zh` is the source of truth; typing `en` as `typeof   */
/* zhCopy` makes TypeScript reject a missing or wrongly shaped key.    */
/* ------------------------------------------------------------------ */

/**
 * Explain the backend's shortcut failure reasons: known codes become advice,
 * any other PowerShell message is shown as is and followed by the retry hint.
 */
function desktopIconReasons(errors: string[], known: Record<'shared-denied' | 'save-blocked', string>, retry: string): string[] {
  const reasons = errors.map(error => Object.hasOwn(known, error) ? known[error as keyof typeof known] : error)
  return errors.every(error => Object.hasOwn(known, error)) && errors.length > 0 ? reasons : [...reasons, retry]
}

const zhCopy = {
  headerTitle: '皮肤管理',
  increaseValue: (label: string) => `增大${label}`,
  decreaseValue: (label: string) => `减小${label}`,
  // The settings nav gives every section a narrow two-column cell and ellipsises
  // the overflow, so the nav label is its own, shorter string rather than the
  // page heading: "Skin Management" would render as "Skin Manage…".
  navLabel: '皮肤管理',
  installedTitle: '已安装',
  checking: '检查中…',
  checkUpdates: '检查更新',
  officialName: '官方默认',
  stateCurrent: '当前',
  stateSwitching: '切换中…',
  skinConflict: '检测到多套皮肤同时生效，请重新选择目标皮肤。',
  switchStateUnavailable: '无法读取宿主的皮肤运行状态。',
  switchChanged: '皮肤选择已被其他操作更改。',
  switchRestartRequired: '设置已保存，但当前窗口未完成皮肤切换。请重启桌面应用使其生效。',
  compatibility: (version: string) => `已适配 DSH ${version}`,
  incompatibleBlocked: (runtime: string) => `不支持 DSH ${runtime}，已停用`,
  incompatibleAllowed: (runtime: string) => `已允许在 DSH ${runtime} 上运行`,
  incompatibleConfirm: (runtime: string) => `这个皮肤没有声明支持 DSH ${runtime}，启用后界面可能错乱，例如输入框消失。\n\n仍要启用吗？之后可以随时切回「官方默认」。`,
  gitHashTitle: (hash: string, date: string | null) => `本地提交 ${hash}${date === null ? '' : `\n${date}`}\n点击复制`,
  buildHashTitle: (hash: string) => `本地构建 ${hash}\n点击复制`,
  upToDate: '已是最新',
  updateAvailable: (short: string, date: string) => date === '' ? `有更新 ${short}` : `有更新 ${short} · ${date}`,
  localAhead: '本地较新',
  diverged: '与远端分叉',
  unknownUpdate: '无法检查更新',
  localDirty: '有本地改动',
  noSkins: '未发现已安装的皮肤。',
  copiedOk: '已复制。',
  copyFailed: '复制失败：浏览器拒绝了剪贴板访问。',
  loadingSkins: '读取中…',
  actionFailed: (message: string) => `操作失败：${message}`,
  noSettings: '这个皮肤没有可调整的设置。',
  lockedBy: (label: string) => `「${label}」开启时不可用`,
  locked: '当前不可用',
  desktopIconTitle: '桌面',
  desktopIconLabel: '快捷方式图标跟随皮肤',
  desktopIconDescription: '替换桌面、开始菜单和任务栏中的图标；关闭或切回官方默认时还原。',
  desktopIconPending: '正在更新快捷方式…',
  desktopIconDone: (updated: number, failed: number, errors: string[] = []) => failed > 0
    ? `已更新 ${updated} 个快捷方式，${failed} 个修改失败：${desktopIconReasons(errors, {
      'shared-denied': '所有用户共享的快捷方式需要以管理员身份运行 DeepSeek Harness',
      'save-blocked': '被安全软件（如 360、火绒）的快捷方式防护拦截，请把 DeepSeek Harness 加入其信任区后再切换一次开关',
    }, '可再切换一次开关重试').join('；')}。`
    : updated > 0 ? `已更新 ${updated} 个快捷方式，开始菜单稍后刷新。` : '快捷方式已是目标图标，或当前皮肤未提供桌面图标。',
  schedulePolicy: '规则',
  policyHideInRanges: '在这些时段隐藏',
  policyShowInRanges: '只在这些时段显示',
  rangeStartAria: (index: number) => `时段 ${index} 开始`,
  rangeEndAria: (index: number) => `时段 ${index} 结束`,
  hourAria: (label: string) => `${label} 时`,
  minuteAria: (label: string) => `${label} 分`,
  rangeTo: '至',
  removeRange: '删除',
  addRange: '添加时间段',
  scheduleHint: '按本机时间，可跨午夜，如 22:00 至 07:00。',
  backupTitle: '备份',
  backupLabel: '皮肤与管理器设置',
  backupDescription: '也可以把 JSON 文件拖到这里导入。',
  exportButton: '导出',
  importButton: '导入',
  dropActive: '松开以导入',
  exportOk: '已导出。',
  importOk: (count: number) => `已导入 ${count} 组设置。`,
  importOkDeferred: (active: number, deferred: number) =>
    `已导入 ${active} 组设置；另有 ${deferred} 个皮肤未加载，加载后生效。`,
  importFail: (message: string) => `导入失败：${message}`,
  importErrorInvalidEnvelope: '文件不是有效的皮肤设置备份',
  importErrorTooLarge: '文件过大：设置内容超过 256 KiB 限制',
  resetSkinButton: '恢复默认',
  resetSkinConfirm: (title: string) => `将「${title}」的设置全部恢复为默认？`,
  clearKeptLabel: (count: number) => `${count} 个未加载皮肤的暂存设置`,
  clearKeptButton: '清理',
  clearKeptConfirm: (count: number) => `删除 ${count} 个未加载皮肤的暂存设置？这些设置只在对应皮肤加载后才会生效。`,
  clearKeptOk: (count: number) => `已清理 ${count} 个未加载皮肤的暂存设置。`,
  importErrorMessage: (code: 'empty' | 'invalid-json' | 'invalid-envelope' | 'no-matching-skins' | 'too-large' | 'store-too-large') => {
    switch (code) {
      case 'empty': return '文件为空'
      case 'invalid-json': return '文件不是有效的 JSON'
      case 'invalid-envelope': return '文件不是有效的皮肤设置备份'
      case 'no-matching-skins': return '备份里没有皮肤设置'
      case 'too-large': return '文件过大：设置内容超过 256 KiB 限制'
      case 'store-too-large': return '导入后的设置会超过 256 KiB 的可恢复上限，请先清理未加载皮肤的暂存设置'
    }
  },
}

const enCopy: typeof zhCopy = {
  headerTitle: 'Skin Management',
  increaseValue: (label: string) => `Increase ${label}`,
  decreaseValue: (label: string) => `Decrease ${label}`,
  navLabel: 'Skins',
  installedTitle: 'Installed',
  checking: 'Checking…',
  checkUpdates: 'Check for updates',
  officialName: 'Official',
  stateCurrent: 'Current',
  stateSwitching: 'Switching…',
  skinConflict: 'Multiple skins are active. Select the skin to use.',
  switchStateUnavailable: 'The Host skin runtime state is unavailable.',
  switchChanged: 'Another operation changed the selected skin.',
  switchRestartRequired: 'Settings saved, but this window did not finish switching skins. Restart the desktop app to apply them.',
  compatibility: (version: string) => `Verified on DSH ${version}`,
  incompatibleBlocked: (runtime: string) => `Not supported on DSH ${runtime}; disabled`,
  incompatibleAllowed: (runtime: string) => `Allowed on DSH ${runtime}`,
  incompatibleConfirm: (runtime: string) => `This skin does not declare support for DSH ${runtime}. Enabling it may break the interface, for example hiding the composer.\n\nEnable it anyway? You can switch back to Official at any time.`,
  gitHashTitle: (hash: string, date: string | null) => `Local commit ${hash}${date === null ? '' : `\n${date}`}\nClick to copy`,
  buildHashTitle: (hash: string) => `Local build ${hash}\nClick to copy`,
  upToDate: 'Up to date',
  updateAvailable: (short: string, date: string) => date === '' ? `Update ${short}` : `Update ${short} · ${date}`,
  localAhead: 'Local is newer',
  diverged: 'Diverged from remote',
  unknownUpdate: 'Cannot check for updates',
  localDirty: 'Local changes',
  noSkins: 'No skins installed.',
  copiedOk: 'Copied.',
  copyFailed: 'Copy failed: the browser denied clipboard access.',
  loadingSkins: 'Loading…',
  actionFailed: (message: string) => `Operation failed: ${message}`,
  noSettings: 'This skin has no settings.',
  lockedBy: (label: string) => `Unavailable while “${label}” is on`,
  locked: 'Currently unavailable',
  desktopIconTitle: 'Desktop',
  desktopIconLabel: 'Shortcut icon follows the skin',
  desktopIconDescription: 'Replaces the icon on the desktop, Start menu and taskbar; turning this off or returning to Official restores it.',
  desktopIconPending: 'Updating shortcuts…',
  desktopIconDone: (updated: number, failed: number, errors: string[] = []) => failed > 0
    ? `Updated ${updated} shortcut(s); ${failed} could not be changed: ${desktopIconReasons(errors, {
      'shared-denied': 'shortcuts shared by all users need DeepSeek Harness to run as administrator',
      'save-blocked': "a security suite's shortcut protection (such as 360 or Huorong) blocked the write; add DeepSeek Harness to its trusted list, then toggle the switch again",
    }, 'toggle the switch again to retry').join('; ')}.`
    : updated > 0 ? `Updated ${updated} shortcut(s); the Start menu refreshes shortly.` : 'Shortcuts already show the target icon, or the active skin ships no desktop icon.',
  schedulePolicy: 'Rule',
  policyHideInRanges: 'Hide during these periods',
  policyShowInRanges: 'Show only during these periods',
  rangeStartAria: (index: number) => `Period ${index} start`,
  rangeEndAria: (index: number) => `Period ${index} end`,
  hourAria: (label: string) => `${label} hour`,
  minuteAria: (label: string) => `${label} minute`,
  rangeTo: 'to',
  removeRange: 'Remove',
  addRange: 'Add period',
  scheduleHint: 'Local time; periods may cross midnight, e.g. 22:00 to 07:00.',
  backupTitle: 'Backup',
  backupLabel: 'Skin and manager settings',
  backupDescription: 'You can also drop a JSON file here to import it.',
  exportButton: 'Export',
  importButton: 'Import',
  dropActive: 'Release to import',
  exportOk: 'Exported.',
  importOk: (count: number) => `Imported ${count} settings group${count === 1 ? '' : 's'}.`,
  importOkDeferred: (active: number, deferred: number) =>
    `Imported ${active} settings group${active === 1 ? '' : 's'}; ${deferred} more apply once those skins load.`,
  importFail: (message: string) => `Import failed: ${message}`,
  importErrorInvalidEnvelope: 'The file is not a valid skin settings backup',
  importErrorTooLarge: 'The file is too large: its settings exceed the 256 KiB limit',
  resetSkinButton: 'Reset',
  resetSkinConfirm: (title: string) => `Reset every setting of “${title}” to its default?`,
  clearKeptLabel: (count: number) => `Stored settings for ${count} unloaded skin${count === 1 ? '' : 's'}`,
  clearKeptButton: 'Clear',
  clearKeptConfirm: (count: number) => `Delete the stored settings for ${count} unloaded skin${count === 1 ? '' : 's'}? They only take effect once that skin is loaded.`,
  clearKeptOk: (count: number) => `Cleared stored settings for ${count} unloaded skin${count === 1 ? '' : 's'}.`,
  importErrorMessage: (code: 'empty' | 'invalid-json' | 'invalid-envelope' | 'no-matching-skins' | 'too-large' | 'store-too-large') => {
    switch (code) {
      case 'empty': return 'The file is empty'
      case 'invalid-json': return 'The file is not valid JSON'
      case 'invalid-envelope': return 'The file is not a valid skin settings backup'
      case 'no-matching-skins': return 'The backup contains no skin settings'
      case 'too-large': return 'The file is too large: its settings exceed the 256 KiB limit'
      case 'store-too-large': return 'The imported settings would exceed the 256 KiB restorable limit; clear the stored settings for unloaded skins first'
    }
  },
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

export function groupLabel(group: { label?: string, labelEn?: string }, lang: UiLang): string | undefined {
  return lang === 'en' ? group.labelEn ?? group.label : group.label
}
