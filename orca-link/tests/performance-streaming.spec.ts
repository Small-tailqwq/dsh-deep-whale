// @vitest-environment jsdom
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { installOrcaLinkStatus } from '../src/client/link-status.ts'
import { hasMutationOutsideTranscript } from '../src/client/mutation-filter.ts'
import { installOrcaStatusCharacter } from '../src/client/status-character.ts'

const CSS = readFileSync(resolve(process.cwd(), 'src/client/orca-link.module.css'), 'utf8').replaceAll('\r\n', '\n')
const flush = (): Promise<void> => new Promise(done => { setTimeout(done, 0) })

afterEach(() => {
  vi.useRealTimers()
  document.body.innerHTML = ''
  document.documentElement.removeAttribute('data-dsh-whale-orca-character')
  delete document.body.dataset.orcaLinkStatus
})

function record(target: Node, added: Node[] = []): MutationRecord {
  return { type: 'childList', target, addedNodes: added as unknown as NodeList, removedNodes: [] as unknown as NodeList } as MutationRecord
}

describe('ORCA LINK streaming cost', () => {
  it('lets frame-level controllers skip transcript edits but not the transcript arriving', () => {
    document.body.innerHTML = '<div data-conversation-scroll><div data-chat-flow><p id="tail"></p></div></div>'
    const tail = document.getElementById('tail')!
    const flow = document.querySelector('[data-chat-flow]')!
    expect(hasMutationOutsideTranscript([record(tail, [document.createTextNode('x')])])).toBe(false)
    expect(hasMutationOutsideTranscript([record(flow.parentElement!, [flow])])).toBe(true)
  })

  it('coalesces transcript-only batches in the link signal and resolves the frame at once', async () => {
    document.body.innerHTML = `
      <div data-phase="active"><div data-conversation-scroll>
        <div data-chat-flow><div data-chat-flow-kind="message" id="row"></div></div>
        <div data-composer-seat><div data-composer-input data-phase="idle"></div></div>
      </div></div>`
    const dispose = installOrcaLinkStatus(document.body)
    expect(document.body.dataset.orcaLinkStatus).toBe('ready')
    vi.useFakeTimers()
    // A streaming row starts running inside the transcript: one trailing pass.
    const running = document.createElement('span')
    running.dataset.state = 'running'
    document.getElementById('row')!.append(running)
    await vi.advanceTimersByTimeAsync(0)
    expect(document.body.dataset.orcaLinkStatus).toBe('ready')
    await vi.advanceTimersByTimeAsync(130)
    expect(document.body.dataset.orcaLinkStatus).toBe('working')
    // An approval card lands outside the transcript: no wait.
    const approval = document.createElement('div')
    approval.dataset.approvalKey = 'k'
    document.querySelector('[data-composer-seat]')!.append(approval)
    await vi.advanceTimersByTimeAsync(0)
    expect(document.body.dataset.orcaLinkStatus).toBe('approval')
    dispose()
  })

  it('stops the character loop on a settled one-shot cell and while it is switched off', async () => {
    vi.useFakeTimers()
    document.body.innerHTML = "<div data-slot='sidebar'><div></div></div>"
    document.body.dataset.orcaLinkStatus = 'complete'
    const cls = { character: 'c', characterBubble: 'b', characterFrame: 'f', characterSprite: 's' }
    const spy = vi.spyOn(window, 'setTimeout')
    const dispose = installOrcaStatusCharacter(document.body, cls)
    await vi.advanceTimersByTimeAsync(2_000)
    const settledCalls = spy.mock.calls.length
    await vi.advanceTimersByTimeAsync(5_000)
    expect(spy.mock.calls.length).toBe(settledCalls)

    // A looping state wakes it; switching the character off parks it again.
    document.body.dataset.orcaLinkStatus = 'working'
    await vi.advanceTimersByTimeAsync(500)
    expect(spy.mock.calls.length).toBeGreaterThan(settledCalls)
    document.documentElement.setAttribute('data-dsh-whale-orca-character', 'hidden')
    await vi.advanceTimersByTimeAsync(200)
    const hiddenCalls = spy.mock.calls.length
    await vi.advanceTimersByTimeAsync(2_000)
    expect(spy.mock.calls.length).toBe(hiddenCalls)
    dispose()
  })

  it('pulses the link signal on opacity only', () => {
    const frames = CSS.match(/@keyframes orcaSignalPulse \{([^@]*?)\n\}/)?.[1] ?? ''
    expect(frames).toContain('opacity')
    expect(frames).not.toContain('box-shadow')
  })
})
