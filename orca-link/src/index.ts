import type { Context } from '@deepseek-ai/cordis'
import { installSkinAssets } from '../../shared/skin-assets.ts'
import files from '../assets/runtime/manifest.json'

/** Serve only this package's immutable presentation assets while the skin is enabled. */
export function apply(ctx: Context): void {
  installSkinAssets(ctx, 'orca-link', new URL('../assets/runtime/', import.meta.url), files)
}
