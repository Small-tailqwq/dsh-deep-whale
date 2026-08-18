// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  installOrcaStatusCharacter,
  isLinkStatus,
  statusFrame,
  statusFrameDuration,
  statusFrameInterval,
} from '../src/client/status-character.ts'
import type { LinkStatus } from '../src/client/link-status.ts'

const classes = {
  character: 'character',
  characterBubble: 'bubble',
  characterFrame: 'frame',
  characterSprite: 'sprite',
}

afterEach(() => {
  vi.useRealTimers()
  document.body.innerHTML = ''
  document.body.removeAttribute('data-orca-link-status')
})

describe('ORCA LINK status character', () => {
  it('maps every link status to one stable atlas row and valid animation frames', () => {
    const statuses: LinkStatus[] = [
      'standby',
      'syncing',
      'working',
      'approval',
      'input',
      'review',
      'complete',
      'fault',
      'offline',
      'ready',
    ]
    statuses.forEach((status, row) => {
      const frames = Array.from({ length: 24 }, (_, index) => statusFrame(status, index))
      expect(new Set(frames.map(frame => frame.row))).toEqual(new Set([row]))
      expect(frames.every(frame => frame.frame >= 0 && frame.frame <= 7)).toBe(true)
    })
    expect(isLinkStatus('working')).toBe(true)
    expect(isLinkStatus('unknown')).toBe(false)
  })

  it('holds event states on a natural final frame instead of looping', () => {
    expect(statusFrame('approval', 100).frame).toBe(7)
    expect(statusFrame('input', 100).frame).toBe(7)
    expect(statusFrame('complete', 100).frame).toBe(7)
    expect(statusFrame('fault', 100).frame).toBe(7)
    expect(statusFrame('ready', 100).frame).toBe(7)

    expect(statusFrame('working', 7).frame).toBe(7)
    expect(statusFrame('working', 8).frame).toBe(0)
    expect(statusFrame('syncing', 8).frame).toBe(0)
  })

  it('plays transition poses once, keeps a 12fps working cadence, and relaxes standby', () => {
    expect(Array.from({ length: 12 }, (_, index) => statusFrame('input', index).frame))
      .toEqual([0, 1, 2, 3, 4, 5, 6, 7, 7, 7, 7, 7])
    expect(Array.from({ length: 12 }, (_, index) => statusFrame('approval', index).frame))
      .toEqual([0, 1, 2, 3, 4, 5, 6, 7, 7, 7, 7, 7])
    expect(statusFrameInterval('working')).toBe(83)
    expect(statusFrameInterval('offline')).toBe(83)
    expect(statusFrameInterval('standby')).toBe(240)
    expect(statusFrameInterval('standby')).toBeGreaterThan(statusFrameInterval('working'))

    // Standby uses per-frame pacing: long open-eye holds, quick blink cells.
    expect(statusFrameDuration('working', 0)).toBe(83)
    expect(statusFrameDuration('standby', 0)).toBe(700)
    expect(statusFrameDuration('standby', 4)).toBe(130)
    expect(statusFrameDuration('standby', 6)).toBe(110)
    expect(statusFrameDuration('standby', 0)).toBeGreaterThan(statusFrameDuration('standby', 6))
  })

  it('applies standby frame alignment so the loop does not visually jump', () => {
    vi.useFakeTimers()
    document.body.innerHTML = '<div data-slot="sidebar"><div><div></div></div></div>'
    document.body.dataset.orcaLinkStatus = 'standby'
    const dispose = installOrcaStatusCharacter(document.body, classes)

    const character = document.querySelector<HTMLElement>('[data-orca-link-character]')!
    const sprite = document.querySelector<HTMLElement>('[data-orca-link-character-sprite]')!
    expect(sprite.style.transform).toBe('translate(0%, 0%)')

    vi.advanceTimersByTime(4 * 700)
    expect(character.dataset.orcaLinkFrame).toBe('1')
    expect(sprite.style.transform).toContain('translate(2.11864406779661')
    expect(sprite.style.transform).toContain('-0.0847457627118644')

    dispose()
  })

  it('mounts in the sidebar stage, follows body status, and retracts cleanly', async () => {
    document.body.innerHTML = '<div data-slot="sidebar"><div><div></div></div></div>'
    document.body.dataset.orcaLinkStatus = 'working'
    const dispose = installOrcaStatusCharacter(document.body, classes)

    const character = document.querySelector<HTMLElement>('[data-orca-link-character]')!
    const sprite = character.querySelector<HTMLElement>('[data-orca-link-character-sprite]')!
    expect(character.parentElement).toBe(document.querySelector("[data-slot='sidebar'] > :first-child"))
    expect(character.dataset.orcaLinkStatus).toBe('working')
    expect(sprite.style.getPropertyValue('--orca-status-row')).toBe('2')

    document.body.dataset.orcaLinkStatus = 'approval'
    await new Promise(resolve => { setTimeout(resolve, 0) })
    expect(character.dataset.orcaLinkStatus).toBe('approval')
    expect(sprite.style.getPropertyValue('--orca-status-row')).toBe('3')

    dispose()
    expect(document.querySelector('[data-orca-link-character]')).toBeNull()
  })
})
