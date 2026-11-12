import type { SkinCatalogEntry, SkinSwitchState, SkinTarget } from '../contract.ts'
import { currentUiLang, skinManagerCopy } from './locale.ts'
import { activeSkins, SWITCH_SETTLE_TIMEOUT_MS } from './switch-settle.ts'

class SelectionChanged extends Error {}

function matches(active: string[], target: SkinTarget): boolean {
  return target === 'official' ? active.length === 0 : active.length === 1 && active[0] === target
}

function pause(signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    signal.throwIfAborted()
    const finish = (): void => { signal.removeEventListener('abort', abort); resolve() }
    const timer = window.setTimeout(finish, 200)
    const abort = (): void => {
      window.clearTimeout(timer)
      signal.removeEventListener('abort', abort)
      reject(signal.reason)
    }
    signal.addEventListener('abort', abort, { once: true })
  })
}

/** Confirm the Host graph and page together, repairing one disposed skin retained by the Host. */
export async function switchDesktopSkin(
  catalog: SkinCatalogEntry[], target: SkinTarget,
  request: (target: SkinTarget, signal?: AbortSignal) => Promise<void>,
  readState: (signal: AbortSignal) => Promise<SkinSwitchState | undefined>,
  doc: Document = document, signal?: AbortSignal,
): Promise<void> {
  const copy = skinManagerCopy(currentUiLang())
  const wait = async (next: SkinTarget, repair: boolean): Promise<string | undefined> => {
    const timeout = new AbortController()
    let available = false
    const timer = window.setTimeout(() => timeout.abort(new Error(available ? copy.switchRestartRequired : copy.switchStateUnavailable)), SWITCH_SETTLE_TIMEOUT_MS)
    const pending = signal === undefined ? timeout.signal : AbortSignal.any([signal, timeout.signal])
    try {
      for (;;) {
        pending.throwIfAborted()
        const state = await readState(pending)
        // The browser bundle can update before config HMR replaces the Host half.
        if (state === undefined) { await pause(pending); continue }
        available = true
        if (!matches(state.configured, next)) throw new SelectionChanged(copy.switchChanged)
        if (matches(state.active, next) && matches(activeSkins(catalog, doc.body), next)) return
        const stale = state.stale.find(id => id !== next)
        if (stale !== undefined) {
          const skin = catalog.find(skin => skin.id === stale)
          if (!repair || skin === undefined || skin.compatibility !== undefined && !skin.compatibility.exempted) {
            throw new Error(copy.skinConflict)
          }
          return stale
        }
        await pause(pending)
      }
    } finally {
      window.clearTimeout(timer)
      timeout.abort()
    }
  }

  signal?.throwIfAborted()
  await request(target, signal)
  const stale = await wait(target, true)
  if (stale === undefined) return
  // Restore the requested selection even if reactivation fails or the manager is unloaded.
  let restore = true
  try {
    await request(stale, signal)
    await wait(stale, false)
  } catch (error) {
    if (error instanceof SelectionChanged) restore = false
    throw error
  } finally {
    if (restore) await request(target)
  }
  await wait(target, false)
}
