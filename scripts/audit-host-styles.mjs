import { execFileSync, spawnSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { parseArgs } from 'node:util'
import { randomUUID } from 'node:crypto'
import { repository, skins, files, inputDigest, digest, portable, cssInventory, queryInventory, hostSources, sourceEvidence, propertyEvidence } from './style-audit/inventory.mjs'
import { matchFixtureDocuments } from './style-audit/browser.mjs'
import { compareReports, auditExitCode } from './style-audit/comparison.mjs'
import { readCurrentRecords, isQueryAtSite } from './style-audit/fixture-recorder.mjs'

const { values } = parseArgs({ options: {
  source: { type: 'string' }, ref: { type: 'string' }, base: { type: 'string' },
  out: { type: 'string' }, fixtures: { type: 'string' }, runtime: { type: 'string', multiple: true }, baseline: { type: 'string' },
} })
if (!values.source || !values.ref || !values.out) throw new Error('Usage: node scripts/audit-host-styles.mjs --source <official-dsh> --ref <sha> --out <directory> [--base <sha>] [--fixtures <recorded-directory>] [--runtime <capture.json>] [--baseline <report.json>]')
if (values.baseline && !values.runtime) throw new Error('--baseline requires a completed --runtime capture.')
const output = resolve(values.out)
mkdirSync(output, { recursive: true })
const host = hostSources(values.source, values.ref)
const base = values.base ? hostSources(values.source, values.base) : null
console.log(`Official DSH ${host.version} @ ${host.commit}; ${host.sources.size} production source files`)
const recorder = digest(readFileSync(join(repository, 'scripts/style-audit/fixture-recorder.mjs')))
const fixtureDirectory = values.fixtures ? resolve(values.fixtures) : join(output, 'fixtures')
let runs
if (values.fixtures) {
  runs = JSON.parse(readFileSync(join(fixtureDirectory, 'run.json'), 'utf8'))
  if (!runs.runId) throw new Error('Fixture cache has no run identity; record fresh fixtures.')
  if (runs.recorder !== recorder) throw new Error('Fixture recorder changed; record fresh fixtures before auditing.')
  for (const skin of skins) if (runs.skins[skin].inputs !== inputDigest(skin)) throw new Error(`${skin}: fixture inputs changed; record fresh fixtures before auditing.`)
} else {
  runs = { schema: 1, runId: randomUUID(), recorder, skins: {} }
  mkdirSync(fixtureDirectory, { recursive: true })
  for (const skin of skins) {
    console.log(`Recording ${skin} test fixtures`)
    const reportPath = join(output, `${skin}-tests.json`)
    const result = spawnSync(process.execPath, [join(repository, skin, 'node_modules/vitest/vitest.mjs'), 'run',
      '--config', 'scripts/style-audit.config.ts', '--reporter=dot', '--reporter=json', `--outputFile=${reportPath}`], {
      cwd: join(repository, skin), stdio: 'inherit', env: { ...process.env, DSH_STYLE_AUDIT_FIXTURES: join(fixtureDirectory, skin), DSH_STYLE_AUDIT_RUN: runs.runId },
    })
    if (result.error) throw result.error
    const tests = JSON.parse(readFileSync(reportPath, 'utf8'))
    runs.skins[skin] = { inputs: inputDigest(skin), exitCode: result.status ?? 1, passed: tests.numPassedTests, failed: tests.numFailedTests,
      files: tests.testResults.map(file => portable(relative(repository, file.name))),
      failures: tests.testResults.flatMap(file => file.assertionResults.filter(test => test.status === 'failed').map(test => ({ file: portable(relative(repository, file.name)), test: test.fullName }))) }
    if (!tests.numPassedTests) runs.skins[skin].exitCode = 1
  }
  writeFileSync(join(fixtureDirectory, 'run.json'), `${JSON.stringify(runs, null, 2)}\n`)
}

const report = { schema: 1, host: { repository: 'https://github.com/deepseek-ai/deepseek-harness.git', commit: host.commit, version: host.version,
  sourceFiles: host.sources.size, base: base?.commit ?? null },
  skinCommit: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repository, encoding: 'utf8' }).trim(),
  runs, fixtures: [], sourceIssues: [], bindings: [], properties: [], rows: [], dynamicQueries: [], regressions: [] }
const captures = values.runtime?.map(path => ({ path: resolve(path), capture: JSON.parse(readFileSync(resolve(path), 'utf8')) }))
if (captures?.some(({ capture }) => !capture.complete || capture.host.commit !== host.commit)) throw new Error('Runtime captures must be complete and use the requested host SHA.')
const runtime = captures ? { complete: true, host: { commit: host.commit },
  coordinates: { runs: captures.map(({ capture }) => capture.coordinates) },
  checks: captures.flatMap(({ capture }) => capture.checks), errors: captures.flatMap(({ capture }) => capture.errors),
  scenes: captures.flatMap(({ path, capture }) => capture.scenes.map(scene => ({ ...scene, artifactDirectory: portable(relative(repository, dirname(path))) }))),
} : null
if (runtime) {
  const identities = new Set()
  for (const scene of runtime.scenes) {
    if (identities.has(scene.id)) throw new Error(`Duplicate runtime scene: ${scene.id}`)
    identities.add(scene.id)
    if (scene.reached) {
      const active = skins.filter(skin => Object.hasOwn(scene.state.body, `data-dsh-${skin}`))
      if (active.length !== 1 || active[0] !== scene.skin) throw new Error(`Mixed skin activation in runtime scene: ${scene.id}`)
    }
  }
  report.runtime = { ...runtime.coordinates, checks: runtime.checks, errors: runtime.errors,
    scenes: runtime.scenes.map(({ rows, ...scene }) => scene) }
  for (const skin of skins) {
    const proof = runtime.checks.find(check => check.skin === skin && check.skinCss === 'matches-source')
    if (!proof || proof.inputs !== inputDigest(skin)) throw new Error(`${skin}: runtime capture inputs differ from the current skin source.`)
  }
}

for (const skin of skins) {
  const inventory = cssInventory(skin)
  const queries = queryInventory(skin)
  const rows = [...inventory.rows, ...queries]
  const evidence = sourceEvidence(rows, host, inventory.exports)
  report.properties.push(...propertyEvidence(inventory.properties, host).map(property => ({ skin, ...property })))
  report.sourceIssues.push(...inventory.issues, ...evidence.parseErrors)
  const knownTests = new Set(runs.skins[skin].files)
  const records = readCurrentRecords(join(fixtureDirectory, skin), runs.runId, knownTests, repository)
  const snapshots = [...new Map(records.flatMap(record => record.snapshots.map(snapshot => [snapshot.id, {
    ...snapshot, file: portable(relative(repository, record.testFile)), skin,
  }]))).values()]
  const calls = records.flatMap(record => record.queries.map(query => ({ ...query, file: portable(relative(repository, record.testFile)) })))
  report.fixtures.push({ skin, documents: snapshots.length, recordedFiles: records.length, queryObservations: calls.length, provenance: 'test fixtures; host relationship requires separate source review' })
  console.log(`${skin}: ${inventory.rows.length} CSS obligations, ${queries.length} query sites, ${snapshots.length} fixture documents`)
  let lastLog = Date.now()
  const matched = await matchFixtureDocuments(rows, snapshots, inventory.exports, (done, total) => {
    if (Date.now() - lastLog > 15000) { console.log(`${skin}: matching ${done}/${total} fixture documents`); lastLog = Date.now() }
  })
  for (const row of rows) {
    row.fixture = row.query ? matched.result[row.query] : null
    if (row.kind === 'query') row.observedCalls = calls.filter(call => isQueryAtSite(call, row) && call.selector === row.argumentValue)
      .map(({ method, selector, test, file, calls, positive, maxMatches }) => ({ test, file, calls, positive, maxMatches }))
    row.runtime = runtime?.scenes.filter(scene => scene.skin === skin).flatMap(scene => {
      const hit = scene.rows.find(hit => hit.id === row.id)
      return hit ? [{ scene: scene.id, ...hit }] : []
    }) ?? []
    row.status = row.resolution === 'dynamic' ? 'dynamic-query'
      : row.fixture?.error ? 'unsupported'
      : row.missingHostAttributes.length || row.missingHostClasses.length || row.missingHostValues.length ? 'needs-source-review'
      : row.runtime.some(hit => hit.status === 'runtime-hit') ? 'runtime-hit'
      : row.kind === 'query' && row.receiver !== 'document' && !row.observedCalls?.some(call => call.positive > 0) ? 'query-needs-scope'
      : row.fixture?.witnesses.length || row.observedCalls?.some(call => call.positive > 0) ? 'fixture-only' : 'not-exercised'
    if (base) row.removedHostAttributes = row.missingHostAttributes.filter(name => [...base.sources.values()].some(entry => entry.text.includes(name)))
    if (row.resolution === 'dynamic') {
      row.runtimeValues = calls.filter(call => isQueryAtSite(call, row)).map(call => ({ selector: call.selector, method: call.method, positive: call.positive, file: call.file, test: call.test }))
      report.dynamicQueries.push({ id: row.id, file: row.file, line: row.line, expression: row.expression, observedValues: row.runtimeValues })
    }
  }
  report.rows.push(...rows)
  for (const path of files(join(repository, skin, 'tests')).filter(path => path.endsWith('.json'))) {
    const fixture = JSON.parse(readFileSync(path, 'utf8'))
    const variants = []
    for (const variant of fixture.variants ?? [fixture]) {
      if (!variant.sources || !variant.hostCommit) continue
      const changed = Object.entries(variant.sources).filter(([path, blob]) => host.blobs.get(path) !== blob)
        .map(([path, reviewed]) => ({ path, reviewed, target: host.blobs.get(path) ?? null }))
      variants.push({ commit: variant.hostCommit, changed })
    }
    if (variants.length) report.bindings.push({ file: portable(relative(repository, path)), variants,
      status: variants.some(variant => !variant.changed.length) ? 'source-unchanged' : 'needs-revalidation' })
  }
}
if (values.baseline) {
  const previous = JSON.parse(readFileSync(resolve(values.baseline), 'utf8'))
  report.comparison = compareReports(previous, report, runtime)
  report.regressions = report.comparison.regressions
}
report.summary = { rows: report.rows.length, statuses: {}, testsFailed: Object.values(runs.skins).reduce((sum, run) => sum + run.failed, 0),
  baselineCompared: Boolean(values.baseline),
  testRunsFailed: Object.values(runs.skins).filter(run => run.exitCode !== 0 || !(run.passed > 0)).length,
  sourceIssues: report.sourceIssues.length, staleBindings: report.bindings.filter(binding => binding.status === 'needs-revalidation').length,
  propertyReview: report.properties.filter(property => property.status === 'needs-source-review').length,
  runtimeScenes: runtime?.scenes.filter(scene => scene.reached).length ?? 0, runtimeErrors: runtime?.errors.length ?? 0,
  missingScenes: report.comparison?.missingScenes.length ?? runtime?.scenes.filter(scene => !scene.reached).length ?? 0,
  styleChanges: report.comparison?.styleChanges.length ?? 0,
  inventoryChanges: (report.comparison?.addedRows.length ?? 0) + (report.comparison?.removedRows.length ?? 0), regressions: report.regressions.length }
for (const row of report.rows) report.summary.statuses[row.status] = (report.summary.statuses[row.status] ?? 0) + 1
writeFileSync(join(output, 'report.json'), `${JSON.stringify(report, null, 2)}\n`)
const missing = new Map()
for (const row of report.rows) for (const name of [...row.missingHostAttributes, ...row.missingHostClasses, ...row.missingHostValues]) {
  if (!missing.has(name)) missing.set(name, [])
  missing.get(name).push(row)
}
const escape = text => String(text).replaceAll('|', '\\|').replaceAll('\n', ' ')
const lines = ['# 样式巡检报告', '', `宿主：DSH ${host.version} @ \`${host.commit}\`。`, '',
  '夹具命中是测试证据。宿主来源待核对、动态查询、未覆盖场景和浏览器结果分别计数。', '',
  '| 状态 | 数量 |', '|---|---:|', ...Object.entries(report.summary.statuses).map(([status, count]) => `| ${status} | ${count} |`), '',
  `来源解析问题：${report.sourceIssues.length}；过期夹具绑定：${report.summary.staleBindings}。`, '',
  values.baseline ? `同场景运行时命中回归：${report.regressions.length}。` : '本轮没有提供运行时基线，未运行跨版本回归比较。', '',
  `真实场景：${report.summary.runtimeScenes}；未到达场景：${report.summary.missingScenes}；计算样式/目标变化待审阅：${report.summary.styleChanges}；宿主 CSS 变量引用或覆盖待核对：${report.summary.propertyReview}。`, '',
  '## 宿主来源中找不到的属性或类片段', '', '| 名称 | 项数 | 示例位置 |', '|---|---:|---|',
  ...[...missing].sort((a, b) => b[1].length - a[1].length).map(([name, rows]) => `| \`${escape(name)}\` | ${rows.length} | ${rows.slice(0, 3).map(row => `${row.file}:${row.line}`).join(', ')} |`), '',
  '## 全量清单', '', '| 皮肤 | 文件:行 | 类型 | 状态 | 选择器 / 表达式 |', '|---|---|---|---|---|',
  ...report.rows.map(row => `| ${row.skin} | ${row.file}:${row.line} | ${row.kind} | ${row.status} | \`${escape(row.effective ?? row.expression)}\` |`), '',
  '完整分支、条件、伪元素、来源 blob、夹具证据与运行时数据见同目录 report.json。', '']
writeFileSync(join(output, 'report.md'), lines.join('\n'))
console.log(JSON.stringify(report.summary, null, 2))
console.log(`Reports: ${join(output, 'report.md')}`)
// A completed inventory with gaps is a useful report, never a green compatibility result.
process.exitCode = auditExitCode(report.summary)
