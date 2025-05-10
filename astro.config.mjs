// @ts-check
import { defineConfig } from 'astro/config'
// import imagemin from 'vite-plugin-imagemin' - disabled due to image processing errors

// https://astro.build/config
export default defineConfig({
  // Enable compression for better performance
  compressHTML: true,

  // Build options for optimization
  build: {
    // Use better asset optimization
    inlineStylesheets: 'auto',

    // Create image srcsets automatically during build - should be string value
    assets: 'assets',
  },

  // Minimize JS payload size
  vite: {
    build: {
      // Use CSS code splitting - reduces main payload size
      cssCodeSplit: true,

      // Minimize JS for better performance
      minify: 'terser',

      // Optimize JS bundle size
      rollupOptions: {
        output: {
          manualChunks: {
            // Bundle all GSAP related code together
            gsap: ['gsap', 'gsap/ScrollTrigger'],

            // Bundle swiper separately
            swiper: ['swiper'],
          },
        },
      },

      // Optimize dependencies using tree-shaking
      chunkSizeWarningLimit: 1000,

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

    // Optimize CSS
    css: {
      // Enable sourcemaps for development
      devSourcemap: true,
    },

    // Add plugins for optimization
    plugins: [
      // Imagemin disabled due to errors with image processing
    ],

    // Optimize asset loading
    assetsInclude: ['**/*.jpg', '**/*.png', '**/*.svg'],

    // Set environment variables
    define: {
      'import.meta.env.PUBLIC_SITE_URL': JSON.stringify(
        'https://wedding.example.com'
      ),
    },
  },
})
