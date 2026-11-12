import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, writeFileSync, mkdtempSync, readdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createRequire } from 'node:module'
import { gzipSync, gunzipSync } from 'node:zlib'
import { selectorRows, cssInventory, literal, sourceEvidence, repository, ts } from './inventory.mjs'
import { matchFixtureDocuments, chromium, inspectPage } from './browser.mjs'
import { compareReports, auditExitCode } from './comparison.mjs'
import { recordFixtures, readCurrentRecords, isQueryAtSite } from './fixture-recorder.mjs'

const site = { skin: 'test', file: 'test.css', line: 1 }
test('query observations belong to the direct caller rather than its outer frames', () => {
  const call = { method: 'querySelectorAll', stack: [
    '    at C:\\repo\\shared\\relational-markers.ts:68:33',
    '    at refresh (C:/repo/shared/relational-markers.ts:67:23)',
    '    at installRelationalMarkers (C:/repo/shared/relational-markers.ts:82:96)',
  ].join('\n') }
  assert.equal(isQueryAtSite(call, { method: 'querySelectorAll', file: 'shared/relational-markers.ts', line: 68 }), true)
  assert.equal(isQueryAtSite(call, { method: 'querySelectorAll', file: 'shared/relational-markers.ts', line: 82 }), false)
  assert.equal(isQueryAtSite(call, { method: 'matches', file: 'shared/relational-markers.ts', line: 68 }), false)
})

test('nested alternatives retain the ancestor branch and negative predicates', async () => {
  const rows = selectorRows('body:is(.live,.dead:has(:is(.present,.missing))):not(:is(.blocked,.hidden))', site, [], '{}')
  const match = await matchFixtureDocuments(rows, [{ id: 'live', test: 'nested', html: '<body class="live"><div class="present"></div></body>' }], {})
  assert.equal(match.result[rows[0].query].witnesses.length, 1)
  const inner = rows.filter(row => row.branch.endsWith(':is[0]') || row.branch.endsWith(':is[1]')).filter(row => row.query.includes(':has'))
  assert.ok(inner.length >= 2)
  for (const row of inner) {
    assert.equal(match.result[row.query].witnesses.length, 0, row.query)
    assert.ok(row.query.includes(':not(:is(.blocked,.hidden))'))
  }
  assert.equal(selectorRows('body:not(:is(.blocked,.hidden))::after', site, [], '{}').length, 1)
})

test('source-pinned width variants expose a relationship regression', async () => {
  const fixture = JSON.parse(readFileSync(join(repository, 'orca-link/tests/fixtures/conversation-width.json'), 'utf8'))
  const rows = [":has(>[data-conversation-scroll])>[data-width-handle]", '[data-conversation-content]>[data-width-handle]'].map(selector => selectorRows(selector, site, [], '{}')[0])
  const snapshots = fixture.variants.map(variant => ({ id: variant.hostCommit, html: variant.html, test: variant.label }))
  const result = await matchFixtureDocuments(rows, snapshots, {})
  assert.deepEqual(result.result[rows[0].query].witnesses.map(hit => hit.count), [2])
  assert.deepEqual(result.result[rows[1].query].witnesses.map(hit => hit.count), [2, 2])
})

test('query constants respect parameters, mutable bindings and nested blocks', () => {
  const source = ts.createSourceFile('queries.ts', `
    const selector = '.outer';
    function dynamic(selector) { document.querySelector(selector) }
    function mutable() { let selector = '.before'; selector = next(); document.querySelector(selector) }
    function closure() { { document.querySelector(selector) } }
    const joined = ['.a', '.b'].join(','); document.querySelector(joined);
    try {} catch (selector) { document.querySelector(selector) }
    for (const selector of values) { document.querySelector(selector) }
    function hoisted() { if (flag) { var selector = '.mutable' } document.querySelector(selector) }
  `, ts.ScriptTarget.Latest, true)
  const values = []
  function visit(node) {
    if (ts.isCallExpression(node) && node.expression.name?.text === 'querySelector') values.push(literal(node.arguments[0]))
    ts.forEachChild(node, visit)
  }
  visit(source)
  assert.deepEqual(values, [undefined, undefined, '.outer', '.a,.b', undefined, undefined, undefined])
})

test('candidate source evidence includes slot values and exact class fragments', () => {
  const host = { sources: new Map([
    ['component.tsx', { blob: 'a', text: `return <div data-phase="active" data-slot={name} />` }],
    ['registration.ts', { blob: 'b', text: `renderSlot('conversation.main')` }],
    ['component.css', { blob: 'c', text: '.menuBar{color:red}' }],
  ]) }
  const rows = ['[data-phase="missing"]', '[data-slot="conversation.main"]', '[class*="_menu"]', '[class$="_menuBar"]'].map(selector => selectorRows(selector, site, [], '{}')[0])
  sourceEvidence(rows, host, {})
  assert.deepEqual(rows[0].missingHostValues, ['data-phase=missing'])
  assert.deepEqual(rows[1].missingHostValues, [])
  assert.deepEqual(rows[2].missingHostClasses, [])
  assert.deepEqual(rows[3].missingHostClasses, [])
  const absent = selectorRows('[class$="_menu"]', site, [], '{}')
  sourceEvidence(absent, host, {})
  assert.deepEqual(absent[0].missingHostClasses, ['_menu'])
})

test('inventory identities are unique and module styles match committed bundles', () => {
  const identities = new Set()
  for (const skin of ['maid-atelier', 'orca-link']) {
    const inventory = cssInventory(skin)
    assert.deepEqual(inventory.issues, [])
    for (const row of inventory.rows) {
      assert.equal(identities.has(row.id), false, `${row.file}:${row.line}`)
      identities.add(row.id)
    }
    const bundle = ts.createSourceFile('client.js', readFileSync(join(repository, skin, 'lib/client.js'), 'utf8'), ts.ScriptTarget.Latest, true)
    const strings = new Set()
    function visit(node) { if (ts.isStringLiteralLike(node)) strings.add(node.text); ts.forEachChild(node, visit) }
    visit(bundle)
    for (const sheet of inventory.sheets) assert.ok(strings.has(sheet.compiled), sheet.file)
  }
})

test('browser evidence respects conditions and records pseudo-element geometry', async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true })
  try {
    const page = await browser.newPage()
    await page.setContent('<style>button::after{content:"";display:block;width:12px;height:3px}</style><button>x</button>')
    const rows = [
      ...selectorRows('button::after', site, [], '{}'),
      ...selectorRows('button', site, [{ name: 'media', value: '(min-width: 99999px)' }], '{}'),
      ...selectorRows('button', site, [{ name: 'container', value: '(width > 1px)' }], '{}'),
    ]
    const measured = await inspectPage(page, rows, [site.file])
    assert.equal(measured[0].status, 'runtime-hit')
    assert.equal(measured[0].samples[0].style.width, '12px')
    assert.equal(measured[1].status, 'inactive-condition')
    assert.equal(measured[2].status, 'container-needs-review')
    assert.equal((await inspectPage(page, rows, []))[0].status, 'stylesheet-not-loaded')
    assert.equal((await inspectPage(page, [{ ...rows[0], kind: 'query', receiver: 'panel' }], []))[0].status, 'query-needs-scope')
  } finally { await browser.close() }
})

test('baseline comparison separates a reached zero, missing scenes and changed styles', () => {
  const row = { id: 'a', runtime: [{ scene: 'reached', status: 'runtime-hit', count: 2, samples: [] }, { scene: 'missing', status: 'runtime-hit', count: 1 }] }
  const previous = { rows: [row, { id: 'removed' }] }
  const current = { rows: [{ ...row, runtime: [{ scene: 'reached', status: 'not-exercised', count: 0 }] }, { id: 'new' }] }
  const capture = { scenes: [{ id: 'reached', reached: true }] }
  const result = compareReports(previous, current, capture)
  assert.equal(result.regressions.length, 1)
  assert.equal(result.missingScenes.length, 1)
  assert.deepEqual(result.addedRows, ['new'])
  assert.deepEqual(result.removedRows, ['removed'])
  current.rows[0].runtime[0] = { scene: 'reached', status: 'runtime-hit', count: 1, samples: [] }
  assert.equal(compareReports(previous, current, capture).styleChanges.length, 1)
})

test('exit codes preserve incomplete coverage and test failures', () => {
  const complete = { rows: 1, statuses: { 'runtime-hit': 1 }, runtimeScenes: 1 }
  assert.equal(auditExitCode(complete), 0)
  assert.equal(auditExitCode({ ...complete, testRunsFailed: 1 }), 1)
  for (const gap of [{ runtimeScenes: 0 }, { staleBindings: 1 }, { missingScenes: 1 }, { propertyReview: 1 }, { rows: 0 }, { statuses: { 'fixture-only': 1 } }]) assert.equal(auditExitCode({ ...complete, ...gap }), 2)
})

test('fixture recorder counts empty forms as elements and restores prototypes', () => {
  const { JSDOM } = createRequire(join(repository, 'orca-link/package.json'))('jsdom')
  const dom = new JSDOM('<!doctype html><html><body></body></html>')
  const names = ['document', 'Document', 'Element', 'DocumentFragment']
  const originals = Object.fromEntries(names.map(name => [name, Object.getOwnPropertyDescriptor(globalThis, name)]))
  const previous = process.env.DSH_STYLE_AUDIT_FIXTURES
  const previousRun = process.env.DSH_STYLE_AUDIT_RUN
  const output = mkdtempSync(join(tmpdir(), 'dsh-style-recorder-'))
  const originalQuery = dom.window.Document.prototype.querySelector
  try {
    names.forEach(name => Object.defineProperty(globalThis, name, { configurable: true, writable: true, value: dom.window[name] }))
    process.env.DSH_STYLE_AUDIT_FIXTURES = output
    process.env.DSH_STYLE_AUDIT_RUN = 'current-run'
    const hooks = []
    recordFixtures({ afterAll: hook => hooks.push(hook), state: () => ({ currentTestName: 'form target', testPath: 'form.spec.ts' }) })
    document.body.innerHTML = '<form></form>'
    assert.ok(document.querySelector('form'))
    hooks.forEach(hook => hook())
    const record = JSON.parse(gunzipSync(readFileSync(join(output, readdirSync(output)[0]))))
    assert.equal(record.queries.find(call => call.selector === 'form').positive, 1)
    assert.ok(record.snapshots.some(snapshot => snapshot.html.includes('<form>')))
    assert.equal(dom.window.Document.prototype.querySelector, originalQuery)
    writeFileSync(join(output, 'old.json.gz'), gzipSync(JSON.stringify({ ...record, runId: 'old-run', testFile: 'old.spec.ts' })))
    assert.equal(readCurrentRecords(output, 'current-run', new Set(['form.spec.ts', 'old.spec.ts']), repository).length, 1)
  } finally {
    if (previous === undefined) delete process.env.DSH_STYLE_AUDIT_FIXTURES
    else process.env.DSH_STYLE_AUDIT_FIXTURES = previous
    if (previousRun === undefined) delete process.env.DSH_STYLE_AUDIT_RUN
    else process.env.DSH_STYLE_AUDIT_RUN = previousRun
    names.forEach(name => { if (originals[name]) Object.defineProperty(globalThis, name, originals[name]); else delete globalThis[name] })
    dom.window.close()
    assert.ok(output.startsWith(join(tmpdir(), 'dsh-style-recorder-')))
    rmSync(output, { recursive: true })
  }
})
