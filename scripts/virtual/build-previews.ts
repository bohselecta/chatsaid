/* Build tiny WebP previews + responsive variants for /public/virtual-home/*
   - For each JPG/PNG: produce
     • webp variants: 400w, 800w, 1600w (suffix: -400w.webp etc.)
     • a tiny 24px blur preview (suffix: -blur.webp), base64 printed to console
   - Skips SVGs.
*/
import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'

const ROOT = process.cwd()
const SRC_DIR = path.join(ROOT, 'public', 'virtual-home')

const TARGET_WIDTHS = [400, 800, 1600]
const QUALITY = 78

async function processFile(filePath: string) {
  const ext = path.extname(filePath).toLowerCase()
  if (!['.jpg', '.jpeg', '.png'].includes(ext)) return

  const base = path.basename(filePath, ext)
  const dir = path.dirname(filePath)

  const buf = fs.readFileSync(filePath)
  const img = sharp(buf)

  // Responsive variants
  for (const w of TARGET_WIDTHS) {
    const out = path.join(dir, `${base}-${w}w.webp`)
    await img.resize({ width: w }).webp({ quality: QUALITY }).toFile(out)
    console.log('wrote', out)
  }

  // Tiny blur preview
  const blurBuf = await img.resize({ width: 24 }).webp({ quality: 40 }).toBuffer()
  const blur64 = `data:image/webp;base64,${blurBuf.toString('base64')}`
  const blurOut = path.join(dir, `${base}-blur.webp`)
  fs.writeFileSync(blurOut, blurBuf)
  console.log('wrote', blurOut)
  console.log(`BLUR:${base}=${blur64}`)
}

async function run() {
  const entries = fs.readdirSync(SRC_DIR)
  for (const name of entries) {
    const file = path.join(SRC_DIR, name)
    const stat = fs.statSync(file)
    if (stat.isDirectory()) continue
    // eslint-disable-next-line no-await-in-loop
    await processFile(file)
  }
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})

