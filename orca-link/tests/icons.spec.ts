// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { installOrcaIcons } from '../src/client/icons.ts'

interface IconFixture { component: string; name: string | null; svg: string; symbolId?: string }
interface LoaderFixture { component: string; name: string; html: string; sources: Record<string, string> }
const pinned = JSON.parse(readFileSync(resolve('tests/fixtures/dsh-icons.json'), 'utf8'))
const target: { icons: IconFixture[]; symbols: Record<string, string>; sources: Record<string, string>; loaders: LoaderFixture[] } = process.env.DSH_ICON_FIXTURE
  ? JSON.parse(readFileSync(process.env.DSH_ICON_FIXTURE, 'utf8'))
  : pinned
let dispose: (() => void) | undefined
afterEach(() => { vi.restoreAllMocks(); dispose?.(); dispose = undefined; document.body.innerHTML = '' })

it('pins icon fixtures to the verified host baseline', () => {
  const manifest = JSON.parse(readFileSync(resolve('skin.json'), 'utf8'))
  // The manifest schema records RC builds; alpha verification lives in this fixture.
  if (!pinned.hostVersion.includes('-alpha.')) expect(pinned.hostVersion.replace('-rc.', 'rc')).toBe(manifest.dshCompatibility)
  expect(pinned.hostCommit).toMatch(/^[a-f0-9]{40}$/)
})

it('decorates auto-review permission controls and releases their marker', () => {
  const glyph = (pinned.icons as IconFixture[]).find(icon => icon.component === 'PermissionIconAutoReviewRegular')!
  document.body.innerHTML = `<div data-composer-seat><button>${glyph.svg}</button></div><div role="menuitem">${glyph.svg}</div>`
  dispose = installOrcaIcons(document.body)
  const controls = Array.from(document.querySelectorAll('button, [role="menuitem"]'))
  expect(controls.map(control => control.getAttribute('data-orca-permission'))).toEqual(['auto', 'auto'])
  dispose()
  dispose = undefined
  expect(document.querySelector('[data-orca-permission]')).toBeNull()
})

describe('official host icon inventory', () => {
  it.each(target.icons)('$component redraws as $name and restores the original nodes', ({ component, name, svg }) => {
    expect(name, `Review semantic mapping for ${component}`).toBeTypeOf('string')
    expect(name).not.toBe('')
    document.body.innerHTML = svg
    const host = document.querySelector('svg')!
    const children = Array.from(host.childNodes)
    const original = host.innerHTML
    const originalElement = host.outerHTML
    dispose = installOrcaIcons(document.body)
    expect(host.getAttribute('data-orca-link-icon')).toBe(name)
    const art = host.querySelectorAll(':scope > g[data-orca-link-icon-art]')
    expect(art).toHaveLength(1)
    expect(art[0]!.querySelectorAll('path, rect').length).toBeGreaterThan(0)
    children.forEach((child, index) => { expect(host.childNodes[index]).toBe(child) })
    dispose()
    dispose = undefined
    expect(host.innerHTML).toBe(original)
    expect(Array.from(host.childNodes)).toEqual(children)
    expect(host.hasAttribute('data-orca-link-icon')).toBe(false)
    expect(host.outerHTML).toBe(originalElement)
  })
})

it('covers every official symbol, including compact artwork', () => {
  expect(new Set(target.icons.flatMap(icon => icon.symbolId ? [icon.symbolId] : [])))
    .toEqual(new Set(Object.keys(target.symbols)))
})

it('keeps the shared sprite untouched during mounting, replacement and disposal', async () => {
  const sprite = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  sprite.setAttribute('data-dsh-icon-sprite', '')
  for (const [id, markup] of Object.entries(target.symbols)) {
    const root = new DOMParser().parseFromString(markup, 'image/svg+xml').documentElement
    const symbol = document.createElementNS('http://www.w3.org/2000/svg', 'symbol')
    symbol.id = id
    symbol.innerHTML = root.innerHTML
    sprite.append(symbol)
  }
  document.body.append(sprite)
  const original = sprite.outerHTML
  dispose = installOrcaIcons(document.body)
  expect(sprite.outerHTML).toBe(original)
  const replacement = sprite.firstElementChild!.cloneNode(true)
  sprite.firstElementChild!.replaceWith(replacement)
  await nextMutation()
  expect(sprite.outerHTML).toBe(original)
  dispose()
  dispose = undefined
  expect(sprite.outerHTML).toBe(original)
})

it('retains native symbol geometry, handles href changes and yields unknown symbols', async () => {
  document.body.innerHTML = target.icons.find(icon => icon.component === 'IconClockOutlineRegular')!.svg
  const host = document.querySelector('svg')!
  host.setAttribute('width', '28')
  host.setAttribute('height', '28')
  const use = host.querySelector('use')!
  dispose = installOrcaIcons(document.body)
  expect(host.getAttribute('viewBox')).toBeNull()
  expect(host.getAttribute('width')).toBe('28')
  expect(host.getAttribute('height')).toBe('28')
  expect(host.querySelector('[data-orca-link-icon-art] > svg')?.getAttribute('viewBox')).toBe('0 0 16 16')
  use.setAttribute('href', '#dsw-icon-plus-outline-regular')
  await nextMutation()
  expect(host.hasAttribute('data-orca-link-icon')).toBe(false)
  host.setAttribute('data-icon', 'dsw-icon-plus-outline-regular')
  await nextMutation()
  expect(host.getAttribute('data-orca-link-icon')).toBe('plus')
  host.setAttribute('data-icon', 'dsw-icon-unknown-regular')
  use.setAttribute('href', '#dsw-icon-unknown-regular')
  await nextMutation()
  expect(host.hasAttribute('data-orca-link-icon')).toBe(false)
  expect(host.children).toHaveLength(1)
  expect(host.firstElementChild).toBe(use)
})

it('restores symbol callers when drawing fails after a previous icon was decorated', () => {
  document.body.innerHTML = target.icons.filter(icon => icon.symbolId).slice(0, 2).map(icon => icon.svg).join('')
  const original = document.body.innerHTML
  const append = SVGElement.prototype.append
  let appended = 0
  vi.spyOn(SVGElement.prototype, 'append').mockImplementation(function (this: SVGElement, ...nodes) {
    if (this.hasAttribute('data-icon') && ++appended === 2) throw new Error('Symbol drawing failed')
    append.apply(this, nodes)
  })
  expect(() => installOrcaIcons(document.body)).toThrow('Symbol drawing failed')
  expect(document.body.innerHTML).toBe(original)
})

it.each(target.loaders)('$component loader fixtures pin their native DOM and CSS contracts', ({ sources }) => {
  for (const [path, blob] of Object.entries(sources)) expect(target.sources[path], `Review loader contract: ${path}`).toBe(blob)
})

const fileLoading = pinned.loaders.find((loader: LoaderFixture) => loader.component === 'FileUpload')!.html
const platformLoading = pinned.loaders.find((loader: LoaderFixture) => loader.component === 'PlatformAuthorization')!.html
const nextMutation = () => new Promise(resolve => setTimeout(resolve, 0))

it('decorates both HTML loaders while retaining progress, controls and native nodes', () => {
  document.body.innerHTML = fileLoading + platformLoading
  const original = document.body.innerHTML
  const button = document.querySelector('button')!
  const click = vi.fn()
  button.addEventListener('click', click)
  dispose = installOrcaIcons(document.body)
  expect(document.querySelectorAll('[data-orca-link-loader]')).toHaveLength(2)
  expect(document.querySelectorAll('[data-orca-link-loader-art] [data-orca-hourglass]')).toHaveLength(2)
  expect(document.querySelector('.file_progressBar')?.getAttribute('style')).toBe('width: 40%')
  expect(document.querySelector('button')).toBe(button)
  button.click()
  expect(click).toHaveBeenCalledOnce()
  dispose()
  dispose = undefined
  expect(document.body.innerHTML).toBe(original)
})

it('handles HTML loader mount, removal and reactivation without duplicate art', async () => {
  dispose = installOrcaIcons(document.body)
  document.body.insertAdjacentHTML('beforeend', fileLoading + platformLoading)
  await nextMutation()
  const card = document.querySelector('.file_card')!
  const fileSpinner = card.querySelector('.file_spinner')!
  expect(document.querySelectorAll('[data-orca-link-loader-art]')).toHaveLength(2)
  card.remove()
  await nextMutation()
  expect(fileSpinner.innerHTML).toBe('')
  expect(fileSpinner.hasAttribute('data-orca-link-loader')).toBe(false)
  document.body.append(card)
  await nextMutation()
  expect(document.querySelectorAll('[data-orca-link-loader-art]')).toHaveLength(2)
  dispose()
  dispose = installOrcaIcons(document.body)
  expect(document.querySelectorAll('[data-orca-link-loader-art]')).toHaveLength(2)
})

it('leaves unrelated spinners and another activation’s art intact', () => {
  const glyph = pinned.icons.find((icon: IconFixture) => icon.component === 'Calendar')!
  document.body.innerHTML = fileLoading + glyph.svg + '<button><span class="unrelated_spinner"></span></button>'
  dispose = installOrcaIcons(document.body)
  const hourglass = document.querySelector('[data-orca-link-loader-art]')!
  const calendar = document.querySelector('svg[data-orca-link-icon="calendar"]')!
  const calendarArt = calendar.querySelector('[data-orca-link-icon-art]')!
  const otherDispose = installOrcaIcons(document.body)
  otherDispose()
  expect(document.querySelector('[data-orca-link-loader-art]')).toBe(hourglass)
  expect(calendar.querySelector('[data-orca-link-icon-art]')).toBe(calendarArt)
  expect(document.querySelector('.unrelated_spinner')?.innerHTML).toBe('')
})

it('restores native HTML loaders if installation fails while creating their art', () => {
  document.body.innerHTML = fileLoading + platformLoading
  const original = document.body.innerHTML
  vi.spyOn(SVGElement.prototype, 'append').mockImplementationOnce(() => { throw new Error('Drawing failed') })
  expect(() => installOrcaIcons(document.body)).toThrow('Drawing failed')
  expect(document.body.innerHTML).toBe(original)
})

it('updates password visibility art on a retained native SVG', async () => {
  const on = pinned.icons.find((icon: IconFixture) => icon.component === 'ApiKeyEyeOn')!
  const off = pinned.icons.find((icon: IconFixture) => icon.component === 'ApiKeyEyeOff')!
  document.body.innerHTML = `<button aria-label="Show key">${on.svg}</button>`
  dispose = installOrcaIcons(document.body)
  const svg = document.querySelector('svg')!
  const path = svg.querySelector(':scope > path')!
  const holder = document.createElement('div')
  holder.innerHTML = off.svg
  path.setAttribute('d', holder.querySelector('path')!.getAttribute('d')!)
  await nextMutation()
  expect(svg.getAttribute('data-orca-link-icon')).toBe('eye-off')
  holder.innerHTML = on.svg
  path.setAttribute('d', holder.querySelector('path')!.getAttribute('d')!)
  await nextMutation()
  expect(svg.getAttribute('data-orca-link-icon')).toBe('eye')
  expect(document.querySelector('button')?.getAttribute('aria-label')).toBe('Show key')
})

it('updates a retained StateDot when its host state changes', async () => {
  const glyph = (pinned.icons as IconFixture[]).find(icon => icon.component === 'StateDotOngoingLarge')!
  document.body.innerHTML = glyph.svg
  const host = document.querySelector('svg')!
  const original = host.innerHTML
  dispose = installOrcaIcons(document.body)
  expect(host.getAttribute('data-orca-link-icon')).toBe('loading')
  expect(host.querySelector('[data-orca-link-icon-art]')?.getAttribute('transform')).toBe('translate(0 0) scale(1.5)')
  host.setAttribute('data-state', 'error')
  await new Promise(resolve => setTimeout(resolve, 0))
  expect(host.hasAttribute('data-orca-link-icon')).toBe(false)
  expect(host.innerHTML).toBe(original)
  host.setAttribute('data-state', 'ongoing')
  await new Promise(resolve => setTimeout(resolve, 0))
  expect(host.getAttribute('data-orca-link-icon')).toBe('loading')
})

it('distinguishes explicit task execution from response, approval and plugin waits', () => {
  const glyph = (pinned.icons as IconFixture[]).find(icon => icon.component === 'StateDotOngoing')!.svg
  document.body.innerHTML = `
    <div data-testid="todo-panel"><li data-status="in_progress"><span class="todo_glyph">${glyph}</span></li></div>
    <div data-tool="bash">${glyph}</div><div data-terminal>${glyph}</div>
    <div role="status">${glyph}</div><div data-approval-card>${glyph}</div>
    <div data-tool="ask_user_question">${glyph}</div>
    <li data-state="running"><span class="plugins_updateStepDot">${glyph}</span></li>`
  const original = document.body.innerHTML
  dispose = installOrcaIcons(document.body)
  const states = Array.from(document.querySelectorAll('svg[data-state]'))
  expect(states.map(svg => svg.getAttribute('data-orca-link-icon'))).toEqual([
    'task-loading', 'task-loading', 'task-loading', 'loading', 'loading', 'loading', 'loading',
  ])
  expect(document.querySelectorAll('[data-orca-task-fill]')).toHaveLength(3)
  expect(document.querySelectorAll('[data-orca-hourglass]')).toHaveLength(4)
  dispose()
  dispose = undefined
  expect(document.body.innerHTML).toBe(original)
})

it('reclassifies a retained loader moved between task and waiting owners and restores it', async () => {
  const glyph = (pinned.icons as IconFixture[]).find(icon => icon.component === 'StateDotOngoingLarge')!.svg
  document.body.innerHTML = `<div data-tool="read">${glyph}</div><div role="status"></div>`
  const svg = document.querySelector('svg')!
  const original = svg.outerHTML
  dispose = installOrcaIcons(document.body)
  expect(svg.getAttribute('data-orca-link-icon')).toBe('task-loading')
  document.querySelector('[role="status"]')!.append(svg)
  await nextMutation()
  expect(svg.getAttribute('data-orca-link-icon')).toBe('loading')
  expect(svg.querySelector('[data-orca-task-fill]')).toBeNull()
  document.querySelector('[data-tool]')!.append(svg)
  await nextMutation()
  expect(svg.getAttribute('data-orca-link-icon')).toBe('task-loading')
  expect(svg.querySelectorAll(':scope > [data-orca-link-icon-art]')).toHaveLength(1)
  dispose()
  dispose = undefined
  expect(svg.outerHTML).toBe(original)
})
