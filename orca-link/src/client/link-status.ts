import { hasMutationOutsideTerminal, hasMutationOutsideTranscript } from './mutation-filter.ts'

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
const TRANSCRIPT_COALESCE_MS = 120
const SIGNAL_LABEL_SELECTOR = '[data-orca-link-signal-label]'

function conversationRoot(body: HTMLElement): HTMLElement | null {
  for (const candidate of body.querySelectorAll<HTMLElement>('[data-phase]')) {
    const scrollport = candidate.querySelector<HTMLElement>('[data-conversation-scroll]')
    if (scrollport?.closest('[data-phase]') === candidate) return candidate
  }
  return null
}

function lastFlowRow(flow: HTMLElement, skipTail = false): HTMLElement | null {
  // Process groups retain their rows under a nested flow, including while
  // folded. Only descend into that host-owned group, never tool preview DOM.
  for (let index = flow.children.length - 1; index >= 0; index -= 1) {
    const child = flow.children[index]
    if (!(child instanceof HTMLElement)) continue
    if (child.hasAttribute('data-chat-flow-kind')) {
      if (!skipTail || child.dataset.chatFlowKind !== 'turn-tail') return child
    } else if (child.hasAttribute('data-step-process')) {
      const content = child.querySelector<HTMLElement>(':scope > [data-step-process-body] > [data-step-process-content][data-chat-flow]')
      const row = content === null ? null : lastFlowRow(content, skipTail)
      if (row !== null) return row
    }
  }
  return null
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
  const meaningful = lastFlowRow(flow, true)
  if (meaningful !== null && meaningful.querySelector("[data-state='error'], [data-state='interrupted']") !== null) return 'fault'
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

  // resolveStatus reads the transcript (running rows, the turn tail, errors)
  // with several whole-conversation queries. A streaming reply rewrites the
  // transcript on every batch, so transcript-only batches are coalesced into
  // one trailing pass per window; anything outside it (phase, composer,
  // approval and question cards) still resolves immediately.
  let transcriptTimer: ReturnType<typeof setTimeout> | undefined
  const flushTranscript = (): void => {
    transcriptTimer = undefined
    synchronize()
  }
  const observer = new MutationObserver((records) => {
    if (!hasMutationOutsideTerminal(records)) return
    if (hasMutationOutsideTranscript(records)) {
      if (transcriptTimer !== undefined) clearTimeout(transcriptTimer)
      transcriptTimer = undefined
      synchronize()
      return
    }
    transcriptTimer ??= setTimeout(flushTranscript, TRANSCRIPT_COALESCE_MS)
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
    if (transcriptTimer !== undefined) clearTimeout(transcriptTimer)
    if (originalBodyStatus === null) body.removeAttribute('data-orca-link-status')
    else body.setAttribute('data-orca-link-status', originalBodyStatus)
    const chip = body.querySelector<HTMLElement>(SIGNAL_SELECTOR)
    chip?.removeAttribute('data-orca-link-status')
    const label = chip?.querySelector<HTMLElement>(SIGNAL_LABEL_SELECTOR)
    if (label !== null && label !== undefined) label.textContent = STATUS_LABELS.standby
  }
}
