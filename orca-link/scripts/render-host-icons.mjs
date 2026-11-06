import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { posix } from 'node:path'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import ts from 'typescript'

const require = createRequire(import.meta.url)
const primitivePath = 'packages/client/ui-primitives/src/icons/index.tsx'
const permissionPath = 'packages/client/ui-primitives/src/PermissionIcon.tsx'
const composerPath = 'packages/client/ui-conversation/src/client/skeleton/InputBar.tsx'
const dockPath = 'packages/client/ui-dockkit/src/components/TabPanel.tsx'
const browserPath = 'packages/client/ui-sidebar-browser/src/client/view/BrowserBody.tsx'
const stateDotPath = 'packages/client/ui-primitives/src/StateDot.tsx'

/** Read immutable Git objects; the host checkout and its dependencies are unused. */
export function renderHostIcons(source, ref) {
  const git = (...args) => execFileSync('git', ['-C', source, ...args], {
    encoding: 'utf8', maxBuffer: 16 * 1024 * 1024,
  }).trimEnd()
  const hostCommit = git('rev-parse', '--verify', `${ref}^{commit}`)
  const files = new Set(git('ls-tree', '-r', '--name-only', hostCommit).split('\n'))
  const sources = new Map()
  const modules = new Map()
  const read = path => {
    sources.set(path, git('rev-parse', `${hostCommit}:${path}`))
    return git('show', `${hostCommit}:${path}`)
  }
  const evaluate = (path, sourceText) => {
    const { outputText } = ts.transpileModule(sourceText, {
      fileName: path,
      compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
    })
    const module = { exports: {} }
    const load = specifier => {
      if (specifier === 'react' || specifier === 'react/jsx-runtime') return require(specifier)
      if (!specifier.startsWith('.')) throw new Error(`Unexpected host icon import: ${specifier}`)
      return loadModule(posix.join(posix.dirname(path), specifier))
    }
    Function('require', 'module', 'exports', outputText)(load, module, module.exports)
    return module.exports
  }
  const loadModule = path => {
    if (!modules.has(path)) modules.set(path, evaluate(path, read(path)))
    return modules.get(path)
  }
  const parse = path => ts.createSourceFile(path, read(path), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const declarations = (file, names) => names.map(name => {
    const statement = file.statements.find(node => (
      ts.isFunctionDeclaration(node) && node.name?.text === name
      || ts.isVariableStatement(node) && node.declarationList.declarations.some(item => item.name.getText(file) === name)
    ))
    if (!statement) throw new Error(`Missing host icon declaration: ${file.fileName}#${name}`)
    return statement.getText(file)
  }).join('\n')
  const icons = []
  const errors = []
  const render = (component, fn, props = {}, site, nested = false) => {
    const markup = renderToStaticMarkup(React.createElement(fn, props))
    const svg = nested ? markup.match(/<svg\b[^]*?<\/svg>/)?.[0] ?? '' : markup
    if (!svg.startsWith('<svg ') || !svg.endsWith('</svg>')) throw new Error(`Not an SVG: ${component}`)
    const symbolId = svg.match(/data-icon="([^"]+)"/)?.[1]
    icons.push({ component, svg, ...(site ? { site } : {}), ...(symbolId ? { symbolId } : {}) })
  }

  const inlineSvg = (file, owner, index = 0) => {
    const found = []
    const visit = (node, enclosing) => {
      if (ts.isFunctionDeclaration(node) || ts.isFunctionExpression(node)) enclosing = node.name?.text ?? enclosing
      if (ts.isVariableDeclaration(node) && node.initializer && (ts.isArrowFunction(node.initializer) || ts.isFunctionExpression(node.initializer))) enclosing = node.name.getText(file)
      if (ts.isJsxElement(node) && node.openingElement.tagName.getText(file) === 'svg') {
        if (enclosing === owner) found.push(node)
      } else ts.forEachChild(node, child => visit(child, enclosing))
    }
    visit(file)
    if (!found[index]) return null
    // Keep the native drawing; layout classes, handlers and refs belong to its caller.
    const transformed = ts.transform(found[index], [context => {
      const clean = node => {
        if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
          const attributes = ts.factory.createJsxAttributes(node.attributes.properties.filter(attribute => (
            ts.isJsxAttribute(attribute) && !/^(className|style|ref|on[A-Z].*)$/.test(attribute.name.getText(file))
            && !(node.tagName.getText(file) === 'svg' && /^(width|height)$/.test(attribute.name.getText(file)))
          )))
          node = ts.isJsxOpeningElement(node)
            ? ts.factory.updateJsxOpeningElement(node, node.tagName, node.typeArguments, attributes)
            : ts.factory.updateJsxSelfClosingElement(node, node.tagName, node.typeArguments, attributes)
        }
        return ts.visitEachChild(node, clean, context)
      }
      return clean
    }])
    const text = ts.createPrinter().printNode(ts.EmitHint.Unspecified, transformed.transformed[0], file)
    transformed.dispose()
    return text
  }

  for (const path of [primitivePath, permissionPath]) {
    const owners = new Set(parse(path).statements.flatMap(node => ts.isFunctionDeclaration(node)
      ? [node.name?.text]
      : ts.isVariableStatement(node) ? node.declarationList.declarations.map(item => item.name.getText()) : []))
    for (const [component, fn] of Object.entries(loadModule(path))) {
      const owner = component.replace(/(?:Regular|Medium)$/, 'Artwork')
      if (typeof fn === 'function') {
        const site = owners.has('productIcon') ? `${path}#productIcon:svg1` : owners.has(owner) ? `${path}#${owner}:svg1` : undefined
        render(component, fn, {}, site)
        if (component.startsWith('IconAppsAddOutline')) render(component.replace('Outline', 'Compact'), fn, { compact: true }, site)
      }
    }
  }

  const stateDot = parse(stateDotPath)
  read('packages/client/ui-primitives/src/StateDot.module.css')
  // Class names and refs have no drawing effect during static rendering.
  const stateIcons = evaluate(stateDotPath, `
    const clsx = (...names) => names.filter(Boolean).join(' ')
    const css = { spinner: 'spinner', spinnerMotion: 'spinnerMotion', spinnerTrack: 'spinnerTrack', spinnerArc: 'spinnerArc' }
    const syncSpinner = undefined
    ${declarations(stateDot, ['StateDot'])}
  `)
  render('StateDotOngoing', stateIcons.StateDot, { state: 'ongoing' })
  render('StateDotOngoingLarge', stateIcons.StateDot, { state: 'ongoing', size: 28 })

  const composer = parse(composerPath)
  const inline = []
  const visit = node => {
    if (ts.isJsxElement(node) && node.openingElement.tagName.getText(composer) === 'svg') inline.push(node)
    else ts.forEachChild(node, visit)
  }
  visit(composer)
  // Both stop locations are independent host branches and must stay covered.
  const composerNames = inline.length === 3
    ? ['ComposerStop', 'ComposerPrimaryStop', 'ComposerSend']
    : ['ComposerStop', 'ComposerPrimaryStop', 'ComposerSending', 'ComposerSend']
  if (inline.length !== composerNames.length) errors.push({ source: composerPath, error: `Review composer SVG inventory: expected ${composerNames.length}, got ${inline.length}` })
  else inline.forEach((node, index) => {
    const component = composerNames[index]
    render(component, evaluate(composerPath, `export const Glyph = () => (${inlineSvg(composer, 'InputBar', index)})`).Glyph, {}, `${composerPath}#InputBar:svg${index + 1}`)
  })

  const dock = parse(dockPath)
  const dockIcons = evaluate(dockPath, `${declarations(dock, ['SplitGlyph', 'ZONE_FILL', 'PANEL_FRAME', 'ZoneGlyph'])}\nexport { SplitGlyph, ZoneGlyph, ZONE_FILL }`)
  render('DockSplit', dockIcons.SplitGlyph)
  for (const zone of Object.keys(dockIcons.ZONE_FILL)) render(`DockZone${zone}`, dockIcons.ZoneGlyph, { zone }, `${dockPath}#ZoneGlyph:svg1`)

  const browser = parse(browserPath)
  const sandbox = evaluate(browserPath, `import { SHIELD_OUTLINE_PATH, ICON_REGULAR_STROKE } from '${posix.relative(posix.dirname(browserPath), primitivePath)}';\n${declarations(browser, ['SandboxPolicyIcon'])}\nexport { SandboxPolicyIcon }`)
  render('SandboxEnabled', sandbox.SandboxPolicyIcon, { sandboxed: true }, `${browserPath}#SandboxPolicyIcon:svg1`)
  render('SandboxDisabled', sandbox.SandboxPolicyIcon, { sandboxed: false }, `${browserPath}#SandboxPolicyIcon:svg1`)

  const inlineControls = [
    ['JsonCollapse', 'ui-primitives/src/JsonTree.tsx', 'JsonString'],
    ['LinkImage', 'ui-primitives/src/LinkIcon.tsx', 'PhotoGlyph'],
    ['LinkDocument', 'ui-primitives/src/LinkIcon.tsx', 'PaperDocGlyph'],
    ['LinkFile', 'ui-primitives/src/LinkIcon.tsx', 'PaperGlyph'],
    ['Calendar', 'ui-schedule/src/client/CalendarIcon.tsx', 'IconCalendarOutlineRegular'],
    ['AccountNoticeBell', 'ui-settings-account/src/client/AccountNotice.tsx', 'NoticeCard'],
    ['Logout', 'ui-settings-account/src/client/LogoutIcon.tsx', 'LogoutIcon'],
    ['ShortcutSearch', 'ui-shortcuts/src/client/Reference.tsx', 'ShortcutReference'],
    ['ZoomOut', 'ui-sidebar-documentpreview/src/client/zoom/ZoomControls.tsx', 'ZoomControls'],
    ['ZoomOut', 'ui-primitives/src/ZoomControls.tsx', 'ZoomControls'],
    ['QuoteMark', 'ui-primitives/src/QuotePreview.tsx', 'QuoteMarkIcon'],
    ['GuideMore', 'ui-sidebar-right/src/client/tabs/guide/GuideMoreIcon.tsx', 'GuideMoreIcon'],
    ['Fullscreen', 'ui-sidebar-right/src/client/shell/SidebarRight.tsx', 'FullscreenGlyph'],
    ['FullscreenExit', 'ui-sidebar-right/src/client/shell/SidebarRight.tsx', 'ExitFullscreenGlyph'],
    ['GuideCompass', 'ui-sidebar-right/src/client/tabs/guide/GuideTitle.tsx', 'CompassGlyph'],
    ['GuideCube', 'ui-sidebar-right/src/client/tabs/guide/GuideTitle.tsx', 'CubeGlyph'],
    ['TerminalEmpty', 'ui-sidebar-terminal/src/client/terminal.tsx', 'TerminalBody'],
    ['SubagentSwitch', 'ui-subagent/src/client/SubagentHeaderLineage.tsx', 'SubagentSwitcherIcon'],
    ['TrajectoryWrench', 'ui-trajectory/src/client/TrajectoryTable.tsx', 'ToolWrenchIcon'],
    ['TrajectoryInformation', 'ui-trajectory/src/client/TrajectoryTable.tsx', 'InformationIcon'],
    ['TrajectoryCompacted', 'ui-trajectory/src/client/TrajectoryTable.tsx', 'CompactedIcon'],
    ['TrajectoryCallWrench', 'ui-trajectory/src/client/TrajectoryTable.tsx', 'AssistantToolCalls'],
    ['TrajectoryCatalogWrench', 'ui-trajectory/src/client/TrajectoryTable.tsx', 'ToolGlyph'],
    ['ProgramJson', 'ui-trajectory/src/client/TrajectoryTable.tsx', 'ProgramInput'],
    ['TrajectoryDuration', 'ui-trajectory/src/client/TrajectoryToolbar.tsx', 'TrajectoryToolbar'],
    ['InspectorFilter', '../experimental/session-inspector/src/client/views/TypeFilter.tsx', 'TypeFilter'],
    ['InspectorPick', '../experimental/session-inspector/src/client/views/View.tsx', 'SessionInspectorView'],
  ]
  for (const [component, relative, owner] of inlineControls) {
    const path = posix.normalize(`packages/client/${relative}`)
    if (!files.has(path)) continue
    const file = parse(path)
    const drawing = inlineSvg(file, owner)
    if (drawing === null) continue
    const { Glyph } = evaluate(path, `export const Glyph = ({ strokeWidth = 1 }) => (${drawing})`)
    render(component, Glyph, {}, `${path}#${owner}:svg1`)
  }

  const shortcutPath = 'packages/client/ui-shortcuts/src/client/Icons.tsx'
  const shortcuts = evaluate(shortcutPath, `${declarations(parse(shortcutPath), ['artwork', 'ShortcutIcon'])}\nexport { ShortcutIcon }`)
  for (const kind of ['edit', 'error', 'success']) render(`Shortcut${kind}`, shortcuts.ShortcutIcon, { kind }, `${shortcutPath}#ShortcutIcon:svg1`)

  const forgePath = 'packages/experimental/client-ui-forge/src/client/glyphs.tsx'
  if (files.has(forgePath)) {
    const forge = evaluate(forgePath, `
      import { IconCheckCircleFillRegular, IconCloseCircleFillRegular } from '${posix.relative(posix.dirname(forgePath), primitivePath)}';
      const clsx = (...names) => names.filter(Boolean).join(' ')
      const css = {}
      ${declarations(parse(forgePath), ['BRANCH_ENDS', 'TOWARD_BASE', 'OPEN', 'SHAPES', 'ChangeRequestGlyph', 'CHECK_TONE', 'CheckGlyph'])}
      export { ChangeRequestGlyph, CheckGlyph }
    `)
    for (const tone of ['open', 'unknown', 'blocked', 'draft', 'merged', 'closed']) {
      render(`ChangeRequest${tone}`, forge.ChangeRequestGlyph, { tone }, `${forgePath}#ChangeRequestGlyph:svg1`)
    }
    for (const state of ['success', 'failure', 'pending', 'neutral', 'skipped', 'cancelled']) {
      render(`ForgeCheck${state}`, forge.CheckGlyph, { state }, `${forgePath}#CheckGlyph:svg1`, true)
    }
  }

  for (const [prefix, path, owner] of [
    ['Secret', 'packages/client/ui-secret-mask/src/client/SecretText.tsx', 'EyeGlyph'],
    ['ApiKey', 'packages/client/ui-settings-models/src/client/ApiKeyInput.tsx', 'ApiKeyInput'],
  ]) {
    if (!files.has(path)) continue
    const file = parse(path)
    const drawing = inlineSvg(file, owner)
    if (drawing === null) continue
    const glyphs = evaluate(path, `${declarations(file, ['EYE_CONTOUR', 'EYE_PATH', 'EYE_OFF_PATH'])}\nexport const Glyph = ({ revealed, path }) => (${drawing});\nexport { EYE_PATH, EYE_OFF_PATH }`)
    for (const revealed of [false, true]) render(`${prefix}Eye${revealed ? 'Off' : 'On'}`, glyphs.Glyph, { revealed, path: revealed ? glyphs.EYE_OFF_PATH : glyphs.EYE_PATH }, `${path}#${owner}:svg1`)
  }

  const contextPath = 'packages/client/ui-conversation/src/client/skeleton/ContextMeter.tsx'
  const context = parse(contextPath)
  const usage = evaluate(contextPath, `${declarations(context, ['RADIUS', 'CIRCUMFERENCE'])}\nexport const Glyph = ({ percent }) => (${inlineSvg(context, 'ContextMeter')})`)
  for (const percent of [0, 25, 100]) render(`ContextUsage${percent}`, usage.Glyph, { percent }, `${contextPath}#ContextMeter:svg1`)

  for (const path of [
    'packages/client/ui-attachment/src/FileCard.tsx',
    'packages/client/ui-attachment/src/FileCard.module.css',
    'packages/client/ui-settings-account/src/client/PlatformOverlay.tsx',
    'packages/client/ui-settings-account/src/client/PlatformOverlay.module.css',
  ]) if (files.has(path)) read(path)

  return {
    hostVersion: JSON.parse(read('package.json')).version,
    hostCommit,
    errors,
    sources: Object.fromEntries([...sources].sort(([a], [b]) => a.localeCompare(b))),
    symbols: loadModule(primitivePath).ICON_SYMBOLS ?? {},
    icons: icons.sort((a, b) => a.component.localeCompare(b.component)),
  }
}
