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
