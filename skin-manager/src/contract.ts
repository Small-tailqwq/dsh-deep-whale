/** Same-origin host route used for catalog discovery and activation. */
export const SKIN_MANAGER_ROUTE = '/api/dsh/skins'

export type SkinTarget = 'official' | string

/** Safe manifest fields exposed to the browser; package paths never leave the host. */
export interface SkinCatalogEntry {
  id: string
  name: string
  nameEn?: string
  tagline?: string
  package: string
  wiringId: string
  bodyAttr: string
  /** Latest DSH build explicitly verified by the skin maintainer (x.y.zrcN). */
  dshCompatibility?: string
  order: number
}

/** A git commit or deterministic build identity rendered for one installed skin package. */
export interface SkinVersionCommit {
  hash: string
  short: string
  /** ISO timestamp when it makes sense; null when the local toolchain cannot say. */
  date: string | null
  /** First line of the remote commit message when available. */
  message?: string
}

/** Provenance of the installed identity: git HEAD, deterministic build metadata, or neither. */
export type SkinVersionSource = 'git' | 'build' | 'none'

/**
 * Comparison result against the remote branch. 'unknown' is the safe answer
 * whenever the remote commit cannot be proven to be a descendant of the
 * installed one: a hash difference alone is NOT a remote update.
 */
export type SkinUpdateState = 'up-to-date' | 'update-available' | 'local-ahead' | 'diverged' | 'unknown'

/** Version row shown next to one installed skin (never leaves the host as absolute paths). */
export interface SkinVersionInfo {
  id: string
  /** What the installed commit identity came from. */
  source: SkinVersionSource
  /** Installed commit identity; null when neither git nor metadata is available. */
  local: SkinVersionCommit | null
  /** Remote comparison result; null when there is no GitHub origin to compare against. */
  remote: {
    /** owner/repo parsed from the origin URL or build metadata. */
    repo: string
    /** Tracked branch used for the comparison. */
    branch: string
    /** Latest commit publishing this skin build, or the remote build fingerprint fallback. */
    latest: SkinVersionCommit | null
    /** Installed git directory head or build fingerprint. */
    localView: SkinVersionCommit | null
    state: SkinUpdateState
  } | null
  /** True when the git worktree or installed runtime files differ from their recorded state. */
  dirty: boolean
  /** Human-readable reason when a piece of the row is unavailable (network, non-GitHub, ...). */
  note?: string
}
