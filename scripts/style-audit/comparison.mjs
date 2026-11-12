export function compareReports(previous, current, capture) {
  const result = { regressions: [], styleChanges: [], missingScenes: [], addedRows: [], removedRows: [] }
  const oldRows = new Map(previous.rows.map(row => [row.id, row]))
  const currentRows = new Map(current.rows.map(row => [row.id, row]))
  const scenes = new Map(capture.scenes.map(scene => [scene.id, scene]))
  for (const row of current.rows) {
    const before = oldRows.get(row.id)
    if (!before) { result.addedRows.push(row.id); continue }
    for (const old of before.runtime ?? []) {
      if (old.status !== 'runtime-hit') continue
      const scene = scenes.get(old.scene)
      if (!scene?.reached) {
        result.missingScenes.push({ id: row.id, scene: old.scene })
        continue
      }
      const now = row.runtime.find(hit => hit.scene === old.scene)
      if (!now) { result.missingScenes.push({ id: row.id, scene: old.scene }); continue }
      const site = { id: row.id, skin: row.skin, file: row.file, line: row.line, selector: row.effective, scene: old.scene }
      if (now.status === 'not-exercised') result.regressions.push({ ...site, before: old.count, after: now.count })
      if (now.status === 'runtime-hit') {
        const before = (old.samples ?? []).map(sample => ({ tag: sample.tag, owner: sample.owner, style: sample.style }))
        const after = (now.samples ?? []).map(sample => ({ tag: sample.tag, owner: sample.owner, style: sample.style }))
        if (old.count !== now.count || JSON.stringify(before) !== JSON.stringify(after)) result.styleChanges.push({ ...site, before: { count: old.count, samples: before }, after: { count: now.count, samples: after } })
      }
    }
  }
  for (const row of previous.rows) if (!currentRows.has(row.id)) result.removedRows.push(row.id)
  return result
}

export function auditExitCode(summary) {
  if (summary.testRunsFailed || summary.regressions || summary.runtimeErrors) return 1
  return Object.keys(summary.statuses).some(status => status !== 'runtime-hit') || !summary.rows
    || summary.sourceIssues || summary.staleBindings || summary.propertyReview || summary.styleChanges
    || summary.missingScenes || summary.inventoryChanges || !summary.runtimeScenes ? 2 : 0
}
