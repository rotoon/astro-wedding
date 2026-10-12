import fs from 'node:fs'
import path from 'node:path'

const IMAGE_EXTENSION = /\.(webp|jpe?g|png|avif)$/i

/**
 * Lists the image files in a folder under `public/` (build time only) and
 * returns their public URLs, e.g. listPublicImages('img/slide') -> ['/img/slide/a.webp', …]
 */
export const listPublicImages = (folder: string): string[] => {
  const dir = path.join(process.cwd(), 'public', folder)
  if (!fs.existsSync(dir)) return []

  return fs
    .readdirSync(dir)
    .filter((file) => IMAGE_EXTENSION.test(file))
    .sort((a, b) => a.localeCompare(b, 'en', { numeric: true })) // 1, 2, … 10
    .map((file) => `/${folder}/${file}`)
}

/** Returns a shuffled copy (Fisher–Yates; `sort(() => Math.random() - 0.5)` is biased) */
export const shuffle = <T>(items: readonly T[]): T[] => {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

/**
 * Pixel size of a WebP, PNG or JPEG under `public/` (build time only), read
 * from the file header, so <img> can carry width/height and keep its shape
 * before it loads. Returns null for anything it can't read.
 */
export const imageSize = (publicUrl: string): { width: number; height: number } | null => {
  const file = path.join(process.cwd(), 'public', publicUrl)
  if (!fs.existsSync(file)) return null
  const buf = fs.readFileSync(file)

  // WebP: RIFF....WEBP then a VP8 / VP8L / VP8X chunk
  if (buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') {
    const chunk = buf.toString('ascii', 12, 16)
    if (chunk === 'VP8 ') {
      return { width: buf.readUInt16LE(26) & 0x3fff, height: buf.readUInt16LE(28) & 0x3fff }
    }
    if (chunk === 'VP8L') {
      const bits = buf.readUInt32LE(21)
      return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 }
    }
    if (chunk === 'VP8X') {
      return { width: buf.readUIntLE(24, 3) + 1, height: buf.readUIntLE(27, 3) + 1 }
    }
  }

  // PNG: size is the start of the IHDR chunk
  if (buf.readUInt32BE(0) === 0x89504e47) {
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) }
  }

  // JPEG: walk the segments to the first start-of-frame marker
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let offset = 2
    while (offset < buf.length) {
      const marker = buf[offset + 1]
      const length = buf.readUInt16BE(offset + 2)
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
        return { width: buf.readUInt16BE(offset + 7), height: buf.readUInt16BE(offset + 5) }
      }
      offset += 2 + length
    }
  }

  return null
}
