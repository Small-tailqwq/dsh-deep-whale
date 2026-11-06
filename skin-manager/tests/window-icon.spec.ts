import { spawn, type ChildProcess } from 'node:child_process'
import { EventEmitter } from 'node:events'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { WindowIconHolder } from '../src/desktop-icon.ts'

vi.mock('node:child_process', async importOriginal => ({
  ...await importOriginal<typeof import('node:child_process')>(),
  spawn: vi.fn(),
}))

const children: Array<ReturnType<typeof child>> = []
const holders: WindowIconHolder[] = []

function child() {
  const process = Object.assign(new EventEmitter(), {
    stdin: { end: vi.fn() },
    stderr: Object.assign(new EventEmitter(), { setEncoding: vi.fn() }),
    exitCode: null as number | null,
    signalCode: null,
    kill: vi.fn(),
  })
  children.push(process)
  return process
}

function close(process: ReturnType<typeof child>) {
  process.exitCode = 0
  process.emit('exit', 0)
  process.emit('close', 0)
}

function holder() {
  vi.mocked(spawn).mockImplementation(() => child() as unknown as ChildProcess)
  const result = new WindowIconHolder(900001)
  holders.push(result)
  return result
}

afterEach(async () => {
  const stopping = holders.splice(0).map(holder => holder.stop())
  for (const process of children.splice(0)) if (process.exitCode === null) close(process)
  await Promise.all(stopping)
  vi.clearAllMocks()
})

describe('window icon helper ownership', () => {
  it('waits for the old helper to exit before starting its replacement', async () => {
    const icons = holder()
    icons.set('maid.ico')
    await Promise.resolve()
    const first = children[0]!
    icons.set('orca.ico')
    await Promise.resolve()
    expect(first.stdin.end).toHaveBeenCalledWith('stop\n')
    expect(spawn).toHaveBeenCalledTimes(1)
    close(first)
    await Promise.resolve()
    expect(spawn).toHaveBeenCalledTimes(2)
    expect(vi.mocked(spawn).mock.calls[1]![2]?.env?.DSH_SKIN_ICON_FILE).toBe('orca.ico')
  })

  it('hands ownership between activations without letting the old one stop the new helper', async () => {
    const first = holder()
    first.set('maid.ico')
    await Promise.resolve()
    const next = holder()
    next.set('orca.ico')
    await Promise.resolve()
    expect(spawn).toHaveBeenCalledTimes(1)
    close(children[0]!)
    await Promise.resolve()
    expect(spawn).toHaveBeenCalledTimes(2)
    await first.stop()
    expect(children[1]!.stdin.end).not.toHaveBeenCalled()
  })

  it('starts only the latest requested icon after the old helper exits', async () => {
    const icons = holder()
    icons.set('maid.ico')
    await Promise.resolve()
    icons.set('orca.ico')
    icons.set('sleepy.ico')
    close(children[0]!)
    await Promise.resolve()
    expect(spawn).toHaveBeenCalledTimes(2)
    expect(vi.mocked(spawn).mock.calls[1]![2]?.env?.DSH_SKIN_ICON_FILE).toBe('sleepy.ico')
  })

  it('restores the official icon when the next activation requests no skin icon', async () => {
    const first = holder()
    first.set('maid.ico')
    await Promise.resolve()
    const next = holder()
    next.set(null)
    expect(children[0]!.stdin.end).toHaveBeenCalledWith('stop\n')
    close(children[0]!)
    await next.stop()
    expect(spawn).toHaveBeenCalledTimes(1)
  })

  it('cancels a queued replacement when the activation is disposed', async () => {
    const icons = holder()
    icons.set('maid.ico')
    await Promise.resolve()
    icons.set('orca.ico')
    const stopped = icons.stop()
    close(children[0]!)
    await stopped
    expect(spawn).toHaveBeenCalledTimes(1)
  })
})
