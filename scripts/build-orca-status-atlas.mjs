/** Pack complete poses and shared eye-only cels into the status atlas. */
import { createHash } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const sharp = createRequire(new URL('../orca-link/package.json', import.meta.url))('sharp')
const root = fileURLToPath(new URL('../orca-link/', import.meta.url))
const source = `${root}/assets/source/status-character`
const statuses = ['standby', 'syncing', 'working', 'approval', 'input', 'review', 'complete', 'fault', 'offline', 'ready']
const loops = new Set(['standby', 'syncing', 'working', 'review'])
const syncingBlinkCels = [0, 0, 0, 1, 3, 1, 0, 0]
const eyeMotion = new Set(['standby', 'review', 'offline'])
const inputCell = 444
const cell = 256
const drawing = 224
const padding = (cell - drawing) / 2
// The input gesture moves its hand, not its seated knees. These offsets were
// fitted to the neutral stocking/strap contour after whole-pose registration.
const inputLegAdjustments = [
  { x: 0, y: 0, scale: 1 },
  { x: -8, y: 2, scale: 1.02 },
  { x: -8, y: 2, scale: 1.02 },
  { x: -9, y: 2, scale: 1.02 },
  { x: -9, y: 2, scale: 1.02 },
  { x: -10, y: 4, scale: 1.04 },
  { x: -9, y: 4, scale: 1.04 },
  { x: -9, y: 4, scale: 1.04 },
]

async function readCells(name) {
  const path = `${source}/${name}.png`
  const { width, height, hasAlpha } = await sharp(path).metadata()
  if (!hasAlpha || Math.abs(width / height - 2) > 0.01) throw new Error(`Invalid 4 x 2 RGBA sheet: ${name}`)
  // ImageGen's row gutter can sit a few pixels below the mathematical half.
  // Split in the transparent gutter so a tail edge cannot leak above the next cel.
  const alpha = await sharp(path).extractChannel('alpha').raw().toBuffer()
  let split = Math.round(height / 2)
  let smallest = Infinity
  for (let y = split - 12; y <= Math.round(height / 2) + 12; y++) {
    let coverage = 0
    for (let x = 0; x < width; x++) coverage += alpha[y * width + x]
    if (coverage < smallest || (coverage === smallest && Math.abs(y - height / 2) < Math.abs(split - height / 2))) {
      smallest = coverage
      split = y
    }
  }
  const extent = Math.max(Math.ceil(width / 4), split, height - split)
  return Promise.all(Array.from({ length: 8 }, async (_, index) => {
    const x = index % 4
    const y = Math.floor(index / 4)
    const left = Math.round(x * width / 4)
    const top = y === 0 ? 0 : split
    const frameWidth = Math.round((x + 1) * width / 4) - left
    const frameHeight = y === 0 ? split : height - split
    const padded = await sharp(path).extract({
      left, top,
      width: frameWidth,
      height: frameHeight,
    }).extend({ right: extent - frameWidth, bottom: extent - frameHeight, left: 0, top: 0, background: '#00000000' }).png().toBuffer()
    const frame = sharp(padded).resize(inputCell, inputCell).ensureAlpha()
    return { pixels: await frame.clone().raw().toBuffer(), png: await frame.png().toBuffer() }
  }))
}

// A shared still layer keeps camera drift in generated sheets out of the actor.
function softRect(x, y, left, top, width, height, feather) {
  return Math.max(0, Math.min(1,
    (x - left) / feather, (left + width - x) / feather,
    (y - top) / feather, (top + height - y) / feather))
}


function registrationSamples(pixels, status) {
  const samples = []
  for (let y = 0; y < inputCell; y += 4) {
    for (let x = 0; x < inputCell; x += 4) {
      const head = x >= 65 && x < 335 && y < 270
      const tail = status === 'working' && x < 160 && y > 285
      if ((!head && !tail) || (x > 205 && x < 295 && y > 145 && y < 222)) continue
      if (status === 'fault' && y >= 145) continue
      const i = (y * inputCell + x) * 4
      samples.push([x, y, pixels[i + 3], pixels[i] * pixels[i + 3] / 255])
    }
  }
  return samples
}

function registerPose(samples, pixels, translationLimit = 24) {
  let best = { x: 0, y: 0, scale: 1, error: Infinity }
  const compare = (dx, dy, scale) => {
    let error = 0
    for (const [x, y, alpha, luma] of samples) {
      const sx = Math.round((x - dx) / scale)
      const sy = Math.round((y - dy) / scale)
      const i = (sy * inputCell + sx) * 4
      const outside = sx < 0 || sx >= inputCell || sy < 0 || sy >= inputCell
      const a = outside ? 0 : pixels[i + 3]
      const l = outside ? 0 : pixels[i] * a / 255
      error += (alpha - a) ** 2 + (luma - l) ** 2
    }
    if (error < best.error) best = { x: dx, y: dy, scale, error }
  }
  for (let scale = 90; scale <= 110; scale += 2) {
    for (let y = -translationLimit; y <= translationLimit; y += 3) {
      for (let x = -translationLimit; x <= translationLimit; x += 3) compare(x, y, scale / 100)
    }
  }
  const coarse = best
  for (let s = -4; s <= 4; s++) {
    for (let y = -3; y <= 3; y++) {
      for (let x = -3; x <= 3; x++) compare(coarse.x + x, coarse.y + y, coarse.scale + s * 0.0025)
    }
  }
  return { x: best.x, y: best.y, scale: best.scale }
}

function samplePixel(pixels, x, y) {
  const left = Math.floor(x)
  const top = Math.floor(y)
  const result = [0, 0, 0, 0]
  for (let dy = 0; dy <= 1; dy++) {
    for (let dx = 0; dx <= 1; dx++) {
      if (left + dx < 0 || left + dx >= inputCell || top + dy < 0 || top + dy >= inputCell) continue
      const i = ((top + dy) * inputCell + left + dx) * 4
      const weight = (dx ? x - left : 1 - x + left) * (dy ? y - top : 1 - y + top)
      const alpha = pixels[i + 3] * weight
      for (let c = 0; c < 3; c++) result[c] += pixels[i + c] * alpha
      result[3] += alpha
    }
  }
  return result
}

async function transformFrame(frame, transform, neutral) {
  const output = neutral === undefined ? Buffer.alloc(inputCell * inputCell * 4) : Buffer.from(neutral.pixels)
  for (let y = 0; y < inputCell; y++) {
    for (let x = 0; x < inputCell; x++) {
      const weight = neutral === undefined ? 1 : softRect(x, y, 218, 157, 63, 54, 5)
      if (weight === 0) continue
      const i = (y * inputCell + x) * 4
      const sample = samplePixel(frame.pixels, (x - transform.x) / transform.scale, (y - transform.y) / transform.scale)
      const baseAlpha = neutral?.pixels[i + 3] ?? 0
      const alpha = baseAlpha * (1 - weight) + sample[3] * weight
      for (let c = 0; c < 3; c++) output[i + c] = alpha === 0 ? 0
        : Math.round(((neutral?.pixels[i + c] ?? 0) * baseAlpha * (1 - weight) + sample[c] * weight) / alpha)
      output[i + 3] = Math.round(alpha)
    }
  }
  return sharp(output, { raw: { width: inputCell, height: inputCell, channels: 4 } }).png().toBuffer()
}

function smoothStep(start, end, value) {
  const t = Math.max(0, Math.min(1, (value - start) / (end - start)))
  return t * t * (3 - 2 * t)
}

async function anchorInputLegs(png, column) {
  const adjustment = inputLegAdjustments[column]
  const pixels = await sharp(png).ensureAlpha().raw().toBuffer()
  const output = Buffer.from(pixels)
  for (let y = 358; y < 438; y++) {
    for (let x = 165; x < 300; x++) {
      let weight = smoothStep(358, 386, y) * smoothStep(165, 178, x)
        * (1 - smoothStep(284, 298, x)) * (1 - smoothStep(431, 438, y))
      // The near sleeve occludes the knee during lift-off. Keep it in place.
      if (column === 1) weight *= smoothStep(386, 397, y)
        + (1 - smoothStep(216, 227, x)) * (1 - smoothStep(386, 397, y))
      if (column === 2) weight *= smoothStep(365, 383, y)
        + (1 - smoothStep(218, 230, x)) * (1 - smoothStep(365, 383, y))
      if (weight === 0) continue
      const sx = x + ((x - 220 - adjustment.x) / adjustment.scale + 220 - x) * weight
      const sy = y + ((y - 405 - adjustment.y) / adjustment.scale + 405 - y) * weight
      // Deform one complete source contour, rather than blend two silhouettes
      // or graft a rectangle from another cel through a hand or device.
      const sample = samplePixel(pixels, sx, sy)
      const i = (y * inputCell + x) * 4
      output[i + 3] = Math.round(sample[3])
      for (let c = 0; c < 3; c++) output[i + c] = sample[3] === 0 ? 0 : Math.round(sample[c] / sample[3])
    }
  }
  return sharp(output, { raw: { width: inputCell, height: inputCell, channels: 4 } }).png().toBuffer()
}

const sheets = new Map(await Promise.all(statuses.filter(name => name !== 'ready' && name !== 'syncing').map(async name => [name, await readCells(name)])))
const neutralPng = await readFile(`${source}/neutral.png`)
const neutral = { png: neutralPng, pixels: await sharp(neutralPng).ensureAlpha().raw().toBuffer() }
const registeredStatuses = new Set(statuses.filter(status => status !== 'ready'))
const samples = new Map([...registeredStatuses].map(status => [status, registrationSamples(neutral.pixels, status)]))
const layers = []
const offsets = {}
const registrations = {}
const standbyFrames = []
for (const [row, status] of statuses.entries()) {
  console.log(`Packing ${status}`)
  offsets[status] = []
  if (registeredStatuses.has(status)) registrations[status] = []
  for (let column = 0; column < 8; column++) {
    // All rows share byte-identical neutral cels for action entry and return.
    const frame = column === 0 || status === 'ready' || status === 'syncing' || (loops.has(status) && column === 7)
      ? neutral : sheets.get(status)[['approval', 'input', 'complete', 'offline'].includes(status) && column === 7 ? 6 : column]
    let png = frame.png
    const registered = registeredStatuses.has(status)
    const offset = { x: 0, y: 0 }
    if (status === 'syncing') {
      // Keep every open-eye hold identical and play one matched close/reopen pair.
      const blink = standbyFrames[syncingBlinkCels[column]]
      png = blink.png
      registrations[status].push(blink.transform)
    } else if (registered) {
      const transform = frame === neutral ? { x: 0, y: 0, scale: 1 }
        : registerPose(samples.get(status), frame.pixels, status === 'fault' ? 48 : 24)
      registrations[status].push(transform)
      // A hand, device and body contour stay in the same complete source drawing.
      if (frame !== neutral) png = await transformFrame(frame, transform, eyeMotion.has(status) ? neutral : undefined)
    }
    if (status === 'input' && column !== 0) png = await anchorInputLegs(png, column)
    if (status === 'standby') standbyFrames.push({ png, transform: registrations[status][column] })
    offsets[status].push([offset.x, offset.y])
    layers.push({
      input: await sharp(png).resize(drawing, drawing).png().toBuffer(),
      left: column * cell + padding + Math.round(offset.x * drawing / inputCell),
      top: row * cell + padding + Math.round(offset.y * drawing / inputCell),
    })
  }
}
// Retain a full-resolution derived sheet alongside the independent source cels.
const syncingSource = await sharp({ create: { width: inputCell * 4, height: inputCell * 2, channels: 4, background: '#00000000' } })
  .composite(syncingBlinkCels.map((frame, index) => ({
    input: standbyFrames[frame].png,
    left: index % 4 * inputCell,
    top: Math.floor(index / 4) * inputCell,
  }))).png().toBuffer()
await writeFile(`${source}/syncing.png`, syncingSource)
const packed = await sharp({ create: { width: cell * 8, height: cell * 10, channels: 4, background: '#00000000' } })
  .composite(layers).png().toBuffer()
// Materialize the composited image before the lossless WebP encoding pass.
const atlas = await sharp(packed).webp({ lossless: true, effort: 6 }).toBuffer()
const filename = `${createHash('sha256').update(atlas).digest('hex')}.webp`
await writeFile(`${root}/assets/runtime/${filename}`, atlas)
const artPath = `${root}/src/client/art.ts`
const art = await readFile(artPath, 'utf8')
await writeFile(artPath, art.replace(/(ORCA_LINK_STATUS_ATLAS = skinAssetUrl\(')[a-f0-9]{64}\.(?:png|webp)('\))/, `$1${filename}$2`))
await writeFile(`${source}/alignment.json`, JSON.stringify({ cell, drawing, registrationCell: inputCell, offsets, registrations,
  derivedFrames: { syncing: { source: 'standby', columns: syncingBlinkCels } },
  inputLegAdjustments: { registrationCell: inputCell, anchor: [220, 405], columns: inputLegAdjustments },
}, null, 2) + '\n')
console.log(`ORCA status atlas: ${filename} (${cell * 8} x ${cell * 10}, ${atlas.length} bytes)`)
