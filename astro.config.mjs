// @ts-check
import { defineConfig } from 'astro/config'

// https://astro.build/config
export default defineConfig({
  site: 'https://www.ststarttogether.com',

  // Enable compression for better performance
  compressHTML: true,

  build: {
    // Inline small stylesheets, link the rest
    inlineStylesheets: 'auto',

    // Output folder for bundled JS/CSS
    assets: 'assets',
  },

  vite: {
    build: {
      // Use CSS code splitting - reduces main payload size
      cssCodeSplit: true,

      // Minimize JS for better performance
      minify: 'terser',

      rollupOptions: {
        output: {
          manualChunks: {
            // Bundle swiper separately so it can be cached on its own
            swiper: ['swiper'],
          },
        },
      },

      // Terser options for better minification
      terserOptions: {
        compress: {
          // Remove console logs in production
          drop_console: true,
          // Aggressive optimizations
          passes: 2,
        },
      },
    },

    css: {
      // Enable sourcemaps for development
      devSourcemap: true,
    },
  },
})
