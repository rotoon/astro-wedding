// @ts-check
import { defineConfig } from 'astro/config'
import react from '@astrojs/react'
import { site } from './src/data/wedding'

// https://astro.build/config
export default defineConfig({
  site: site.url,

  // React is only used for the guestbook islands (src/features/wishes)
  integrations: [react()],

  // HTML-aware whitespace compression (Astro 7's default is 'jsx', which drops
  // spaces between inline elements)
  compressHTML: true,

  build: {
    // Inline small stylesheets, link the rest
    inlineStylesheets: 'auto',

    // Output folder for bundled JS/CSS
    assets: 'assets',
  },

  vite: {
    build: {
      // The guestbook's Firebase SDK chunk (~550 kB, ~165 kB gzip) is loaded
      // only on /wishes pages; the homepage doesn't load React or Firebase
      chunkSizeWarningLimit: 600,
    },
    css: {
      // Enable sourcemaps for development
      devSourcemap: true,
    },
  },
})
