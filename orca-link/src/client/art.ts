import { skinAssetUrl } from './asset-url.ts'

/**
 * Independent ORCA LINK artwork layers generated for this skin. Neither has
 * lettering or fake controls: live DSH content owns the readable layer.
 * Re-embed from a source image with:
 *   node scripts/embed-skin-art orca-link ORCA_LINK_CHARACTER_ART <imagePath> 0
 *   node scripts/embed-skin-art orca-link ORCA_LINK_ART <imagePath> 1920
 *   node scripts/embed-skin-art orca-link ORCA_LINK_DARK_HERO_ART <imagePath> 1920
 *   node scripts/embed-skin-art orca-link ORCA_LINK_DARK_ACTIVE_ART <imagePath> 1920
 *   node scripts/embed-skin-art orca-link ORCA_LINK_LIGHT_HERO_ART <imagePath> 1920
 *   node scripts/embed-skin-art orca-link ORCA_LINK_LIGHT_ACTIVE_ART <imagePath> 1920
 *   node scripts/embed-skin-art orca-link ORCA_LINK_STATUS_ATLAS <imagePath> 2048
 */

export const ORCA_LINK_STATUS_ATLAS = skinAssetUrl('dc68deddbdc6f1ac67721f2c52ddfe231683ddc693796da57f6510964972608b.webp')

export const ORCA_LINK_LIGHT_HERO_ART = skinAssetUrl('d5fdfd91306d2f3aaa766674d5994be4a014c4dd083d6afd7f90b4947bba6802.webp')
export const ORCA_LINK_LIGHT_ACTIVE_ART = skinAssetUrl('3605bdd7ccfcc75ca78558f2c958bb3bb35e544cc705f5c15c3653ca21a274d5.webp')

export const ORCA_LINK_DARK_HERO_ART = skinAssetUrl('5affe6ca90a22227bc020914e4b9d4dc8913a336ffc4a76e17f5b715fa2e0086.webp')
export const ORCA_LINK_DARK_ACTIVE_ART = skinAssetUrl('905f86159587cb4f168fdc78dac8ac8b53e3271d829f78878ddb0c81d0e33747.webp')
