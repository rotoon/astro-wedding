import type { APIRoute } from 'astro'

export const GET: APIRoute = async function GET({ site }) {
  if (!site) {
    return new Response(
      'Site configuration is required to generate the sitemap',
      {
        status: 500,
      }
    )
  }

  // Generate the XML sitemap with the content type header
  return new Response(generateSitemap(site), {
    status: 200,
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'max-age=3600, public',
    },
  })
}

function generateSitemap(site: URL) {
  // Define your site's URLs and their metadata
  const pages = [
    {
      url: '/',
      lastMod: new Date().toISOString(),
      priority: 1.0,
      changeFreq: 'monthly',
    },
  ]

  // Generate the XML header
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`

  // Add each page to the sitemap
  pages.forEach((page) => {
    xml += `
  <url>
    <loc>${new URL(page.url, site).href}</loc>
    <lastmod>${page.lastMod}</lastmod>
    <priority>${page.priority}</priority>
    <changefreq>${page.changeFreq}</changefreq>
  </url>`
  })

  // Close the XML
  xml += `
</urlset>`

  return xml
}
