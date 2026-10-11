import type { APIRoute } from 'astro'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

/**
 * Serves the JPEG share image at /opengraph.jpg (some crawlers don't accept the
 * WebP og:image). Prerendered at build time from public/img/opengraph.jpg.
 */
export const GET: APIRoute = async () => {
  const image = await readFile(join(process.cwd(), 'public', 'img', 'opengraph.jpg'))

  return new Response(image, {
    headers: {
      'Content-Type': 'image/jpeg',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
}
