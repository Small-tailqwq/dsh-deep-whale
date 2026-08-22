import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  classifyUpdate,
  computeSkinFingerprint,
  inspectInstalledVersion,
  inspectSkinVersion,
  parseGitHubRemote,
  readSkinBuildMeta,
  repositoryRelativePath,
  type SkinVersionDeps,
} from '../src/index.ts'
import type { SkinVersionCommit } from '../src/contract.ts'

function gitAvailable(): boolean {
  try {
    execFileSync('git', ['--version'], { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

const hasGit = gitAvailable()
const LONG_HASH = 'a'.repeat(40)
const REMOTE_FINGERPRINT = 'b'.repeat(64)

function writeBuildPackage(dir: string, path = 'orca-link'): string {
  mkdirSync(join(dir, 'lib'), { recursive: true })
  writeFileSync(join(dir, 'lib', 'client.js'), 'client\n')
  writeFileSync(join(dir, 'lib', 'index.js'), 'index\n')
  writeFileSync(join(dir, 'cordis.patch.yml'), 'patch\n')
  writeFileSync(join(dir, 'skin.json'), JSON.stringify({ id: path, dshCompatibility: '0.1.1rc2' }))
  const fingerprint = computeSkinFingerprint(dir)!
  writeFileSync(join(dir, 'skin.build.json'), JSON.stringify({
    schema: 1,
    fingerprint,
    repository: 'Small-tailqwq/dsh-deep-whale',
    path,
  }))
  return fingerprint
}

function commit(hash: string, message: string): SkinVersionCommit {
  return { hash, short: hash.slice(0, 7), date: '2026-08-22T10:00:00Z', message }
}

function fakeGit(overrides: Partial<Record<string, (args: string[]) => string | null>> = {}): (cwd: string, args: string[]) => Promise<string | null> {
  return async (_cwd, args) => {
    const [head, ...rest] = args
    if (overrides[head] !== undefined) return overrides[head]!(args)
    if (head === 'rev-parse') {
      if (rest[0] === 'HEAD') return LONG_HASH
      if (rest[0] === '--short') return 'aaaaaaa'
      if (rest[0] === '--show-toplevel') return '/workspace'
    }
    if (head === 'log') {
      if (args.includes('--format=%H')) return LONG_HASH
      return '2026-08-22T10:00:00+08:00'
    }
    if (head === 'status') return ''
    if (head === 'remote') return 'https://github.com/Small-tailqwq/dsh-deep-whale.git'
    return null
  }
}

function fakeDeps(overrides: Partial<SkinVersionDeps> = {}): SkinVersionDeps {
  return {
    git: fakeGit(),
    githubJson: async () => ({ default_branch: 'main' }) as unknown,
    directoryCommit: async () => commit('b'.repeat(40), 'skin work'),
    buildMeta: async () => ({
      fingerprint: REMOTE_FINGERPRINT,
      repository: 'Small-tailqwq/dsh-deep-whale',
      path: 'orca-link',
    }),
    compareCommit: async () => 'identical',
    defaultBranch: async () => 'main',
    ...overrides,
  }
}

describe('parseGitHubRemote', () => {
  it('accepts https, git@ and ssh forms with optional .git suffix', () => {
    expect(parseGitHubRemote('https://github.com/Small-tailqwq/dsh-deep-whale.git'))
      .toEqual({ owner: 'Small-tailqwq', repo: 'dsh-deep-whale' })
    expect(parseGitHubRemote('https://github.com/Small-tailqwq/dsh-deep-whale'))
      .toEqual({ owner: 'Small-tailqwq', repo: 'dsh-deep-whale' })
    expect(parseGitHubRemote('git@github.com:owner/repo.git'))
      .toEqual({ owner: 'owner', repo: 'repo' })
    expect(parseGitHubRemote('ssh://git@github.com/owner/repo.git'))
      .toEqual({ owner: 'owner', repo: 'repo' })
    expect(parseGitHubRemote('git://github.com/owner/repo')).toEqual({ owner: 'owner', repo: 'repo' })
  })

  it('rejects non-github remotes and paths with tails', () => {
    expect(parseGitHubRemote('https://gitlab.com/owner/repo')).toBeNull()
    expect(parseGitHubRemote('https://github.com/owner/repo/tree/main')).toBeNull()
    expect(parseGitHubRemote('https://github.com/owner/repo/commit/abc')).toBeNull()
    expect(parseGitHubRemote('')).toBeNull()
  })
})

describe('repositoryRelativePath', () => {
  it('returns an empty string for the repository root itself', () => {
    const root = mkdtempSync(join(tmpdir(), 'dsh-skin-version-'))
    try {
      expect(repositoryRelativePath(root, root)).toBe('')
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })

  it('returns a slash-separated relative path for a nested skin package', () => {
    const root = mkdtempSync(join(tmpdir(), 'dsh-skin-version-'))
    const skin = join(root, 'orca-link')
    try {
      mkdirSync(skin)
      const rel = repositoryRelativePath(skin, root)
      expect(rel).toBe('orca-link')
      expect(rel).not.toContain('\\')
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })
})

describe('readSkinBuildMeta', () => {
  function metaFile(): string {
    const dir = mkdtempSync(join(tmpdir(), 'dsh-skin-meta-'))
    writeBuildPackage(dir)
    return dir
  }

  it('reads a well-formed build metadata file', () => {
    const dir = metaFile()
    try {
      expect(readSkinBuildMeta(dir)).toEqual({
        fingerprint: computeSkinFingerprint(dir),
        repository: 'Small-tailqwq/dsh-deep-whale',
        path: 'orca-link',
      })
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it('returns null when metadata is missing or malformed', () => {
    const dir = mkdtempSync(join(tmpdir(), 'dsh-skin-meta-'))
    try {
      expect(readSkinBuildMeta(dir)).toBeNull()
      writeFileSync(join(dir, 'skin.build.json'), '{ broken')
      expect(readSkinBuildMeta(dir)).toBeNull()
      writeFileSync(join(dir, 'skin.build.json'), JSON.stringify({ schema: 1, fingerprint: 'nope', repository: 'x/y', path: 'z' }))
      expect(readSkinBuildMeta(dir)).toBeNull()
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })
})

describe('inspectInstalledVersion', () => {
  it('prefers live git history over build metadata', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'dsh-skin-installed-'))
    try {
      writeBuildPackage(dir)
      const withGit = await inspectInstalledVersion(dir, fakeGit())
      expect(withGit.source).toBe('git')
      expect(withGit.local?.hash).toBe(LONG_HASH)
      expect(withGit.dirty).toBe(false)
      expect(withGit.baseRef).toBe(LONG_HASH)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it('falls back to build metadata when the directory has no git', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'dsh-skin-installed-'))
    try {
      const fingerprint = writeBuildPackage(dir)
      const result = await inspectInstalledVersion(dir)
      expect(result.source).toBe('build')
      expect(result.local?.hash).toBe(fingerprint)
      expect(result.repository).toBe('Small-tailqwq/dsh-deep-whale')
      expect(result.relPath).toBe('orca-link')
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it('labels a worktree with uncommitted changes inside the skin directory as dirty', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'dsh-skin-installed-'))
    try {
      const result = await inspectInstalledVersion(dir, fakeGit({
        status: () => ' M orca-link/lib/client.js',
      }))
      expect(result.dirty).toBe(true)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it.skipIf(!hasGit)('reads HEAD and cleanliness from a real git repository', async () => {
    const root = mkdtempSync(join(tmpdir(), 'dsh-skin-version-'))
    const skin = join(root, 'orca-link')
    try {
      mkdirSync(skin)
      writeFileSync(join(skin, 'skin.json'), '{}')
      execFileSync('git', ['init', '-q'], { cwd: root })
      execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: root })
      execFileSync('git', ['config', 'user.name', 'Test'], { cwd: root })
      execFileSync('git', ['add', '.'], { cwd: root })
      execFileSync('git', ['commit', '-q', '-m', 'init'], { cwd: root })
      const clean = await inspectInstalledVersion(skin)
      expect(clean.source).toBe('git')
      expect(clean.dirty).toBe(false)
      expect(clean.relPath).toBe('orca-link')
      writeFileSync(join(skin, 'skin.json'), '{"dirty": true}')
      const dirty = await inspectInstalledVersion(skin)
      expect(dirty.dirty).toBe(true)
    } finally {
      rmSync(root, { recursive: true, force: true })
    }
  })
})

describe('classifyUpdate', () => {
  it('treats an unchanged directory head as up-to-date regardless of ancestry', () => {
    expect(classifyUpdate('behind', true)).toBe('up-to-date')
    expect(classifyUpdate('ahead', true)).toBe('up-to-date')
    expect(classifyUpdate('diverged', true)).toBe('up-to-date')
    expect(classifyUpdate('identical', true)).toBe('up-to-date')
  })

  it('maps ancestry to the remote state when the directory moved', () => {
    expect(classifyUpdate('behind', false)).toBe('update-available')
    expect(classifyUpdate('ahead', false)).toBe('local-ahead')
    expect(classifyUpdate('diverged', false)).toBe('diverged')
    expect(classifyUpdate('identical', false)).toBe('up-to-date')
  })

  it('stays unknown when ancestry cannot be proven', () => {
    expect(classifyUpdate(null, false)).toBe('unknown')
    expect(classifyUpdate('weird', false)).toBe('unknown')
  })
})

describe('inspectSkinVersion', () => {
  it('stops early when neither git nor metadata is available', async () => {
    const result = await inspectSkinVersion('orca-link', '/nowhere', fakeDeps({ git: fakeGit({ 'rev-parse': () => null }) }))
    expect(result.source).toBe('none')
    expect(result.local).toBeNull()
    expect(result.remote).toBeNull()
    expect(result.note).toContain('既不是 Git 仓库')
  })

  it('uses a deterministic build fingerprint as the installed identity', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'dsh-skin-installed-'))
    try {
      const fingerprint = writeBuildPackage(dir)
      const result = await inspectSkinVersion('orca-link', dir, fakeDeps({
        git: fakeGit({ 'rev-parse': () => null }),
        buildMeta: async () => ({
          fingerprint: fingerprint === REMOTE_FINGERPRINT ? 'c'.repeat(64) : REMOTE_FINGERPRINT,
          repository: 'Small-tailqwq/dsh-deep-whale',
          path: 'orca-link',
        }),
      }))
      expect(result.source).toBe('build')
      expect(result.remote?.state).toBe('update-available')
      expect(result.remote?.repo).toBe('Small-tailqwq/dsh-deep-whale')
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it('reports an intact packaged build as up-to-date when fingerprints agree', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'dsh-skin-installed-'))
    try {
      const fingerprint = writeBuildPackage(dir)
      const result = await inspectSkinVersion('orca-link', dir, fakeDeps({
        git: fakeGit({ 'rev-parse': () => null }),
        buildMeta: async () => ({
          fingerprint,
          repository: 'Small-tailqwq/dsh-deep-whale',
          path: 'orca-link',
        }),
      }))
      expect(result.remote?.state).toBe('up-to-date')
      expect(result.dirty).toBe(false)
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it('does not call a locally modified packaged build a remote update', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'dsh-skin-installed-'))
    try {
      writeBuildPackage(dir)
      writeFileSync(join(dir, 'lib', 'client.js'), 'locally modified\n')
      const result = await inspectSkinVersion('orca-link', dir, fakeDeps({
        git: fakeGit({ 'rev-parse': () => null }),
      }))
      expect(result.dirty).toBe(true)
      expect(result.remote?.state).toBe('unknown')
      expect(result.note).toContain('本地有修改')
    } finally {
      rmSync(dir, { recursive: true, force: true })
    }
  })

  it('reports when the origin is not GitHub', async () => {
    const result = await inspectSkinVersion('orca-link', '/skin', fakeDeps({
      git: fakeGit({ remote: () => 'https://gitlab.com/owner/repo.git' }),
    }))
    expect(result.source).toBe('git')
    expect(result.remote).toBeNull()
    expect(result.note).toContain('GitHub 更新源')
  })

  it('flags update-available only when the remote is strictly ahead and the directory moved', async () => {
    const result = await inspectSkinVersion('orca-link', '/skin', fakeDeps({
      directoryCommit: async (_repo, ref) => (
        ref === 'main' ? commit('b'.repeat(40), 'skin work') : commit(LONG_HASH, 'installed')
      ),
      compareCommit: async () => 'behind',
    }))
    expect(result.remote?.state).toBe('update-available')
    expect(result.remote?.latest?.message).toBe('skin work')
  })

  it('stays up-to-date when the remote moved elsewhere but not in the skin directory', async () => {
    const result = await inspectSkinVersion('orca-link', '/skin', fakeDeps({
      compareCommit: async () => 'behind',
      // The directory head is identical on both sides (same hash for every
      // ref): infrastructure-only commits never count as a skin update.
      directoryCommit: async () => commit(LONG_HASH, 'same head'),
    }))
    expect(result.remote?.state).toBe('up-to-date')
  })

  it('maps local leads and forks to their own states, never to update-available', async () => {
    const ahead = await inspectSkinVersion('orca-link', '/skin', fakeDeps({
      git: fakeGit({ log: (args) => args.includes('--format=%H') ? 'b'.repeat(40) : '2026-08-22T10:00:00+08:00' }),
      directoryCommit: async (_repo, ref) => (
        ref === 'main' ? commit(LONG_HASH, 'old') : commit('b'.repeat(40), 'local work')
      ),
      compareCommit: async () => 'ahead',
    }))
    expect(ahead.remote?.state).toBe('local-ahead')
    const diverged = await inspectSkinVersion('orca-link', '/skin', fakeDeps({
      git: fakeGit({ log: (args) => args.includes('--format=%H') ? 'c'.repeat(40) : '2026-08-22T10:00:00+08:00' }),
      directoryCommit: async (_repo, ref) => (
        ref === 'main' ? commit('b'.repeat(40), 'remote work') : commit('c'.repeat(40), 'local work')
      ),
      compareCommit: async () => 'diverged',
    }))
    expect(diverged.remote?.state).toBe('diverged')
  })

  it('stays unknown when ancestry cannot be proven', async () => {
    const result = await inspectSkinVersion('orca-link', '/skin', fakeDeps({
      directoryCommit: async (_repo, ref) => (
        ref === 'main' ? commit('b'.repeat(40), 'skin work') : commit(LONG_HASH, 'installed')
      ),
      compareCommit: async () => null,
    }))
    expect(result.remote?.state).toBe('unknown')
    expect(result.note).toContain('无法证明')
  })

  it('never reports an update when the installed ref is missing upstream', async () => {
    const differing = await inspectSkinVersion('orca-link', '/skin', fakeDeps({
      compareCommit: async () => {
        throw Object.assign(new Error('not-found'), { status: 404 })
      },
      // directory hashes agree: nothing moved upstream → up-to-date
      directoryCommit: async () => commit(LONG_HASH, 'same head'),
    }))
    expect(differing.remote?.state).toBe('up-to-date')
    const moved = await inspectSkinVersion('orca-link', '/skin', fakeDeps({
      directoryCommit: async (_repo, ref) => (
        ref === 'main' ? commit('b'.repeat(40), 'skin work') : commit(LONG_HASH, 'installed')
      ),
      compareCommit: async () => {
        throw Object.assign(new Error('not-found'), { status: 404 })
      },
    }))
    expect(moved.remote?.state).toBe('unknown')
    expect(moved.note).toContain('不在远端历史中')
  })

  it('falls back gracefully when the GitHub API is unreachable', async () => {
    const result = await inspectSkinVersion('orca-link', '/skin', fakeDeps({
      compareCommit: async () => {
        throw new Error('network down')
      },
    }))
    expect(result.local?.short).toBe('aaaaaaa')
    expect(result.note).toContain('远端查询失败')
  })
})
