import { hasMutationOutsideTerminal } from './mutation-filter.ts'

export type LinkStatus =
  | 'standby'
  | 'syncing'
  | 'working'
  | 'approval'
  | 'input'
  | 'review'
  | 'complete'
  | 'fault'
  | 'offline'
  | 'ready'

const STATUS_LABELS: Record<LinkStatus, string> = {
  standby: 'LINK ACTIVE',
  syncing: 'LINK SYNC',
  working: 'TASK RUNNING',
  approval: 'AUTH REQUEST',
  input: 'INPUT REQUIRED',
  review: 'PLAN REVIEW',
  complete: 'TASK COMPLETE',
  fault: 'LINK FAULT',
  offline: 'LINK OFFLINE',
  ready: 'SESSION READY',
}

const SIGNAL_SELECTOR = '[data-orca-link-signal]'
const SIGNAL_LABEL_SELECTOR = '[data-orca-link-signal-label]'

function conversationRoot(body: HTMLElement): HTMLElement | null {
  for (const candidate of body.querySelectorAll<HTMLElement>('[data-phase]')) {
    const scrollport = candidate.querySelector<HTMLElement>('[data-conversation-scroll]')
    if (scrollport?.closest('[data-phase]') === candidate) return candidate
  }
  return null
}

function lastFlowRow(flow: HTMLElement): HTMLElement | null {
  const rows = Array.from(flow.children).filter((child): child is HTMLElement => (
    child instanceof HTMLElement && child.hasAttribute('data-chat-flow-kind')
  ))
  return rows.at(-1) ?? null
}

function lastMeaningfulFlowRow(flow: HTMLElement): HTMLElement | null {
  const rows = Array.from(flow.children).filter((child): child is HTMLElement => (
    child instanceof HTMLElement && child.dataset.chatFlowKind !== undefined
      && child.dataset.chatFlowKind !== 'turn-tail'
  ))
  return rows.at(-1) ?? null
}

function resolveStatus(root: HTMLElement | null): LinkStatus {
  if (root === null) return 'standby'
  const phase = root.dataset.phase ?? ''
  if (phase === 'hero') return 'standby'
  if (phase === 'settling') return 'syncing'
  if (phase !== 'active') return 'ready'

  if (root.querySelector('[data-approval-key]') !== null) return 'approval'
  if (root.querySelector('[data-plan-review-key]') !== null) return 'review'
  if (root.querySelector('[data-question-key]') !== null) return 'input'

  const input = root.querySelector<HTMLElement>('[data-composer-input][data-phase]')
  if (input?.dataset.phase === 'submitting' || input?.dataset.phase === 'adjudicating') return 'syncing'
  if (
    root.querySelector("svg[data-orca-link-icon='stop']") !== null
    || root.querySelector("[data-state='running']") !== null
  ) return 'working'
  if (input?.getAttribute('aria-disabled') === 'true') return 'offline'

  const flow = root.querySelector<HTMLElement>('[data-chat-flow]')
  if (flow === null) return 'ready'
  const tail = lastFlowRow(flow)
  const meaningful = lastMeaningfulFlowRow(flow)
  if (meaningful?.querySelector("[data-state='error'], [data-state='interrupted']") !== null) return 'fault'
  if (tail?.dataset.chatFlowKind === 'turn-tail') return 'complete'
  return 'ready'
}

/**
 * Project the currently mounted conversation's state onto the sidebar signal.
 * Background sessions are intentionally ignored: switching sessions replaces
 * the central conversation root and therefore recomputes the label naturally.
 */
export function installOrcaLinkStatus(body: HTMLElement): () => void {
  const originalBodyStatus = body.getAttribute('data-orca-link-status')

  const synchronize = (): void => {
    const status = resolveStatus(conversationRoot(body))
    if (body.dataset.orcaLinkStatus !== status) body.dataset.orcaLinkStatus = status
    const chip = body.querySelector<HTMLElement>(SIGNAL_SELECTOR)
    if (chip === null) return
    const label = chip.querySelector<HTMLElement>(SIGNAL_LABEL_SELECTOR)
    if (chip.dataset.orcaLinkStatus !== status) chip.dataset.orcaLinkStatus = status
    if (label !== null && label.textContent !== STATUS_LABELS[status]) label.textContent = STATUS_LABELS[status]
  }

  const observer = new MutationObserver((records) => {
    if (hasMutationOutsideTerminal(records)) synchronize()
  })
  observer.observe(body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: [
      'aria-selected',
      'data-phase',
      'data-state',
      'data-orca-link-icon',
      'aria-disabled',
    ],
  })
  synchronize()

  return () => {
    observer.disconnect()
    if (originalBodyStatus === null) body.removeAttribute('data-orca-link-status')
    else body.setAttribute('data-orca-link-status', originalBodyStatus)
    const chip = body.querySelector<HTMLElement>(SIGNAL_SELECTOR)
    chip?.removeAttribute('data-orca-link-status')
    const label = chip?.querySelector<HTMLElement>(SIGNAL_LABEL_SELECTOR)
    if (label !== null && label !== undefined) label.textContent = STATUS_LABELS.standby
  }
}
