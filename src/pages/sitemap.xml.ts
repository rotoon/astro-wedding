import type { APIRoute } from 'astro'

export const get: APIRoute = async function get({ site }) {
  if (!site) {
    return new Response(
      'Site configuration is required to generate the sitemap',
      {
        status: 500,
      }
    )
  }

  // Replace with your actual domain when in production
  const siteUrl = site.toString()

  // Generate the XML sitemap with the content type header
  return new Response(generateSitemap(siteUrl), {
    status: 200,
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'max-age=3600, public',
    },
  })
}

function generateSitemap(siteUrl: string) {
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
    <loc>${siteUrl}${page.url}</loc>
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
