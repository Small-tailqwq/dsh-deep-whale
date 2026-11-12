import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { parseArgs } from 'node:util'
import { execFileSync } from 'node:child_process'
import { gzipSync } from 'node:zlib'
import { chromium, inspectPage } from './style-audit/browser.mjs'
import { skins, cssInventory, queryInventory, hostSources, inputDigest, digest, ts } from './style-audit/inventory.mjs'

const { values } = parseArgs({ options: { source: { type: 'string' }, ref: { type: 'string' },
  'url-file': { type: 'string' }, out: { type: 'string' }, skin: { type: 'string' } } })
if (!values.source || !values.ref || !values['url-file'] || !values.out) throw new Error('Usage: node scripts/capture-host-styles.mjs --source <built-official-checkout> --ref <sha> --url-file <isolated-server-log> --out <directory> [--skin maid-atelier|orca-link]')
const output = resolve(values.out)
if (values.skin && !skins.includes(values.skin)) throw new Error('Unknown skin.')
const selected = values.skin ? [values.skin] : skins
mkdirSync(output, { recursive: true })
const host = hostSources(values.source, values.ref)
const sourceHead = execFileSync('git', ['-C', resolve(values.source), 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim()
if (sourceHead !== host.commit) throw new Error('Build checkout HEAD differs from the target SHA.')
const log = readFileSync(resolve(values['url-file']), 'utf8')
const url = log.match(/https?:\/\/(?:127\.0\.0\.1|localhost|\[::1\])[^\s]+\?token=[^\s]+/)?.[0]
if (!url) throw new Error('No isolated loopback server URL found in the log.')
const report = { schema: 1, complete: false, host: { commit: host.commit, version: host.version }, coordinates: { origin: new URL(url).origin, method: 'fresh-source-build', sourceHead }, scenes: [], errors: [], checks: [] }
const browser = await chromium.launch({ channel: 'chrome', headless: true })
report.coordinates.browser = browser.version()
report.coordinates.platform = process.platform
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'zh-CN' })
  const page = await context.newPage()
  page.on('pageerror', error => report.errors.push(error.message.replace(/token=[^\s&]+/g, 'token=REDACTED')))
  await page.goto(url)
  await page.waitForSelector('[data-slot="sidebar"]', { timeout: 30000 })
  for (const skin of selected) {
    const alreadyActive = await page.evaluate(({ skin, skins }) => document.body.hasAttribute(`data-dsh-${skin}`)
      && skins.filter(other => other !== skin).every(other => !document.body.hasAttribute(`data-dsh-${other}`)), { skin, skins })
    if (!alreadyActive) {
      const switched = await page.evaluate(async target => {
        const response = await fetch('/api/dsh/skins', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ target }) })
        return response.json()
      }, skin)
      if (!switched.ok || switched.target !== skin) throw new Error(`Skin switch failed: ${skin}`)
      await page.waitForTimeout(600)
      await page.reload()
    }
    await page.waitForSelector(`body[data-dsh-${skin}]`, { timeout: 30000 })
    await page.waitForLoadState('networkidle')
    await page.waitForFunction(({ skin, skins }) => skins.filter(other => other !== skin).every(other => !document.body.hasAttribute(`data-dsh-${other}`)), { skin, skins }, { timeout: 10000 })
    const notice = page.getByRole('button', { name: /^(继续|Continue)$/ })
    if (await notice.count()) await notice.first().click()
    const onboarding = page.getByRole('dialog').filter({ hasText: /开始使用|Get started/ })
    if (await onboarding.count()) await onboarding.getByRole('button', { name: /^(关闭|Close)$/ }).click()
    const inventory = cssInventory(skin)
    const rows = [...inventory.rows, ...queryInventory(skin)]
    const release = await page.evaluate(() => window.__DSH_BOOT__?.release)
    if (release?.version !== host.version || release?.commit && release.commit !== host.commit) throw new Error('Serving host release differs from the source target.')
    const nativeBundle = readFileSync(join(resolve(values.source), 'packages/client/ui-conversation/lib/client.js'), 'utf8')
    const nativeSheets = []
    const ast = ts.createSourceFile('client.js', nativeBundle, ts.ScriptTarget.Latest, true)
    function findSheets(node) {
      if (ts.isStringLiteralLike(node) && node.text.includes('--dsh-width-handle-pointer-y') && node.text.includes('[data-side')) nativeSheets.push(node.text)
      ts.forEachChild(node, findSheets)
    }
    findSheets(ast)
    const loaded = await page.locator('style[data-plugin-css]').allTextContents()
    if (!nativeSheets.length || !nativeSheets.some(sheet => loaded.includes(sheet))) throw new Error('Serving conversation CSS differs from the fresh official build.')
    const activeFiles = inventory.sheets.filter(sheet => loaded.includes(sheet.compiled)).map(sheet => sheet.file)
    if (!activeFiles.some(file => file.endsWith(`/${skin}.module.css`))) throw new Error(`Main skin stylesheet differs from source: ${skin}`)
    report.checks.push({ skin, release, nativeCss: 'matches-built-artifact', skinCss: 'matches-source', activeFiles, inputs: inputDigest(skin) })
    async function capture(name) {
      const id = `${skin}/${name}`
      const active = await page.evaluate(skins => skins.filter(skin => document.body.hasAttribute(`data-dsh-${skin}`)), skins)
      if (active.length !== 1 || active[0] !== skin) throw new Error(`Invalid activation state during ${id}: ${active.join(', ')}`)
      const currentSheets = await page.locator('style[data-plugin-css]').allTextContents()
      if (inventory.sheets.some(sheet => activeFiles.includes(sheet.file) && !currentSheets.includes(sheet.compiled))) throw new Error(`Stylesheet changed during ${id}`)
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
      const state = await page.evaluate(() => ({ release: window.__DSH_BOOT__?.release,
        body: Object.fromEntries([...document.body.attributes].map(attr => [attr.name, attr.value])),
        heroFrame: document.querySelectorAll('[data-conversation-content] > [data-slot="conversation.hero.frame"]').length,
        viewport: { width: innerWidth, height: innerHeight },
        dialogs: [...document.querySelectorAll('[role="dialog"]')].map(element => element.innerText.slice(0, 120)),
        settingsSection: document.querySelector('[role="dialog"] nav [aria-current="true"]')?.textContent ?? null,
        media: { dark: matchMedia('(prefers-color-scheme: dark)').matches, reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches },
      }))
      const measurements = await inspectPage(page, rows, activeFiles)
      const html = await page.evaluate(() => {
        const root = document.documentElement.cloneNode(false)
        root.append(document.body.cloneNode(true))
        root.querySelectorAll('script').forEach(script => script.remove())
        return root.outerHTML
      })
      const dom = `${skin}-${name}.html.gz`
      const domHtml = html.replace(/token=[^\s"'&<>]+/g, 'token=REDACTED')
      writeFileSync(join(output, dom), gzipSync(domHtml))
      const image = `${skin}-${name}.png`
      await page.screenshot({ path: join(output, image), animations: 'disabled' })
      report.scenes.push({ id, skin, reached: true, state, rows: measurements, screenshot: image, dom: { file: dom, sha256: digest(domHtml) } })
      console.log(`Captured ${id}: ${measurements.filter(row => row.status === 'runtime-hit').length} matching obligations`)
    }
    async function theme(scheme, reducedMotion = 'no-preference') {
      await page.emulateMedia({ colorScheme: scheme, reducedMotion })
      await page.waitForFunction(dark => document.body.hasAttribute('data-ds-dark-theme') === dark, scheme === 'dark')
    }
    await capture('initial')
    const session = page.getByText('Style audit fixture', { exact: true })
    if (await session.count()) {
      await session.first().click()
      await page.waitForSelector('[data-chat-flow]', { timeout: 10000 })
      await capture('conversation')
      const handle = page.locator('[data-width-handle][data-side="right"]').first()
      if (await handle.isVisible()) {
        await handle.hover()
        await capture('handle-hover')
        const rect = await handle.boundingBox()
        await page.mouse.move(rect.x + rect.width / 2, rect.y + rect.height / 2)
        await page.mouse.down()
        await page.mouse.move(rect.x + rect.width / 2 - 60, rect.y + rect.height / 2, { steps: 4 })
        await capture('handle-drag')
        await page.mouse.up()
        await page.mouse.move(10, 10)
      }
      const composer = page.locator('[data-composer-input][contenteditable="true"]').first()
      if (await composer.count()) {
        await composer.fill('样式巡检草稿')
        await capture('composer-draft')
        await composer.fill('')
      }
      await theme('dark')
      await capture('conversation-dark')
      await theme('light')
      const rightSidebar = page.getByRole('button', { name: /^(打开右侧边栏|Open right sidebar)$/ })
      if (await rightSidebar.count()) {
        await rightSidebar.click()
        await capture('right-sidebar')
        await page.getByRole('button', { name: /^(收起右侧边栏|Close right sidebar)$/ }).click()
      }
    } else report.checks.push({ skin, scene: 'conversation', status: 'not-exercised', reason: 'Synthetic session is not listed' })
    const account = page.getByRole('button', { name: /账号菜单|Account menu/ })
    if (await account.count()) {
      await account.first().click()
      await capture('account-menu')
      const settings = page.getByRole('menuitem', { name: /设置|Settings/ }).or(page.getByRole('button', { name: /^(设置|Settings)/ }))
      if (await settings.count()) {
        await settings.first().click()
        await page.waitForSelector('[role="dialog"]')
        await capture('settings')
        await theme('dark')
        await capture('settings-dark')
        await theme('light')
        for (const [name, label] of [['models', /^(模型|Models)$/], ['plugins', /^(内置插件|Built-in plugins)$/], ['skins', /^(皮肤管理|Skin Manager)$/]]) {
          const navigation = page.getByRole('dialog').getByRole('button', { name: label })
          if (await navigation.count()) {
            await navigation.click()
            await page.waitForFunction(name => document.querySelector('[role="dialog"] nav [aria-current="true"]')?.textContent === name, await navigation.textContent())
            if (name === 'skins') await page.getByText(JSON.parse(readFileSync(new URL('../orca-link/skin.json', import.meta.url), 'utf8')).name, { exact: true }).waitFor({ state: 'visible' })
            await capture(`settings-${name}`)
          }
          else report.scenes.push({ id: `${skin}/settings-${name}`, skin, reached: false, rows: [] })
        }
        await page.getByRole('dialog').getByRole('button', { name: /^(通用设置|General)$/ }).click()
        await page.setViewportSize({ width: 390, height: 844 })
        await capture('settings-phone')
        const mobile = await page.getByRole('dialog').evaluate(panel => {
          const list = panel.querySelector('nav > :last-child')
          const close = [...panel.querySelectorAll('button')].find(button => /^(关闭|Close)$/.test(button.textContent))
          const glyph = close.querySelector('svg').getBoundingClientRect()
          return { horizontalNavigation: getComputedStyle(list).flexDirection === 'row' && getComputedStyle(list).overflowX === 'auto',
            closeGlyph: { width: glyph.width, height: glyph.height } }
        })
        report.checks.push({ skin, scene: 'settings-phone', ...mobile })
        if (!mobile.horizontalNavigation || mobile.closeGlyph.width <= 0 || mobile.closeGlyph.height <= 0) throw new Error(`${skin}: native phone settings navigation or close glyph is obstructed.`)
        const lastCategory = page.getByRole('dialog').locator('nav button').last()
        await lastCategory.scrollIntoViewIfNeeded()
        await lastCategory.click()
        await capture('settings-phone-nav-end')
        await page.getByRole('dialog').getByRole('button', { name: /^(关闭|Close)$/ }).click()
        await page.setViewportSize({ width: 1440, height: 900 })
      }
    }
    const plugins = page.getByRole('button', { name: /^(插件|Plugins)/ })
    await plugins.first().waitFor({ state: 'visible', timeout: 10000 })
    await plugins.first().click()
    await page.locator('[data-plugin-group]').first().waitFor({ state: 'visible', timeout: 15000 })
    await capture('plugins-page')
    if (await session.count()) await session.first().click()
    const collapse = page.getByRole('button', { name: /^(收起侧边栏|Collapse sidebar)$/ })
    if (await collapse.count()) {
      await collapse.click()
      await capture('sidebar-collapsed')
      await page.getByRole('button', { name: /^(打开侧边栏|Open sidebar)$/ }).first().click()
    }
    for (const [name, viewport] of [['narrow', { width: 800, height: 900 }], ['phone', { width: 390, height: 844 }]]) {
      await page.setViewportSize(viewport)
      await capture(name)
    }
    await page.setViewportSize({ width: 1440, height: 900 })
    await theme('dark', 'reduce')
    await capture('dark-reduced-motion')
    await theme('light')
  }
  report.complete = true
} catch (error) {
  const message = error.message.replace(/token=[^\s&"']+/g, 'token=REDACTED')
  report.errors.push(message)
  console.error(message)
} finally {
  await browser.close()
  writeFileSync(join(output, 'capture.json'), `${JSON.stringify(report, null, 2)}\n`)
}
if (!report.complete || !report.scenes.length || report.errors.length) process.exitCode = 1
