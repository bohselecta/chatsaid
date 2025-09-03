// Rasterize existing SVG placeholders to JPG/PNG sources that the preview
// pipeline can consume. This is a one-time helper to bootstrap responsive
// variants until real photos are added.
import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'

const ROOT = process.cwd()
const SRC_DIR = path.join(ROOT, 'public', 'virtual-home')

type Task = {
  src: string
  out: string
  width: number
  height: number
  format: 'jpg' | 'png'
}

const tasks: Task[] = [
  { src: 'bg-apartment.svg', out: 'bg-apartment.jpg', width: 1600, height: 1200, format: 'jpg' },
  { src: 'bg-office.svg', out: 'bg-office.jpg', width: 1600, height: 1200, format: 'jpg' },
  { src: 'bg-skyline.svg', out: 'bg-skyline.jpg', width: 1600, height: 1200, format: 'jpg' },
  { src: 'desk-wood.svg', out: 'desk-wood.png', width: 1600, height: 400, format: 'png' },
  { src: 'desk-steel.svg', out: 'desk-steel.png', width: 1600, height: 400, format: 'png' },
]

async function run() {
  for (const t of tasks) {
    const inPath = path.join(SRC_DIR, t.src)
    const outPath = path.join(SRC_DIR, t.out)
    if (!fs.existsSync(inPath)) {
      console.warn('missing source', inPath)
      continue
    }
    const buf = fs.readFileSync(inPath)
    const img = sharp(buf).resize({ width: t.width, height: t.height, fit: 'cover' })
    if (t.format === 'jpg') {
      await img.jpeg({ quality: 84 }).toFile(outPath)
    } else {
      await img.png({ compressionLevel: 8 }).toFile(outPath)
    }
    console.log('wrote', outPath)
  }
}

run().catch((e) => { console.error(e); process.exit(1) })

