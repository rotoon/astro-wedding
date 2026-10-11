// @ts-check
import { defineConfig } from 'astro/config'

// https://astro.build/config
export default defineConfig({
  site: 'https://www.ststarttogether.com',

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
    css: {
      // Enable sourcemaps for development
      devSourcemap: true,
    },
  },
})
