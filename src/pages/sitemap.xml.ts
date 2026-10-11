import type { APIRoute } from 'astro'

const pages = [{ path: '/', priority: 1.0, changeFreq: 'monthly' }]

export const GET: APIRoute = ({ site }) => {
  if (!site) {
    return new Response('`site` must be set in astro.config.mjs', { status: 500 })
  }

  const lastMod = new Date().toISOString()
  const urls = pages
    .map(
      (page) => `
  <url>
    <loc>${new URL(page.path, site).href}</loc>
    <lastmod>${lastMod}</lastmod>
    <priority>${page.priority}</priority>
    <changefreq>${page.changeFreq}</changefreq>
  </url>`
    )
    .join('')

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}
</urlset>`,
    {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'max-age=3600, public',
      },
    }
  )
}
