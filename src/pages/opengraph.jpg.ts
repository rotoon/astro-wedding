import type { APIRoute } from 'astro'
import { readFileSync } from 'fs'
import { join } from 'path'

export const get: APIRoute = async function get({ params, request }) {
  try {
    // This would normally generate a dynamic OpenGraph image with "SOM & TOON START TOGETHER 25-05-2025"
    // For simplicity, we'll just return a static image
    const imagePath = join(process.cwd(), 'public', 'img', 'og-cover.jpg')

    // In a real implementation, you would use something like Sharp or Canvas
    // to dynamically create an image with "SOM & TOON START TOGETHER 25-05-2025" overlays
    const imageBuffer = readFileSync(imagePath)

    return new Response(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (error) {
    console.error('Error generating OpenGraph image:', error)
    return new Response('Error generating image', { status: 500 })
  }
}
