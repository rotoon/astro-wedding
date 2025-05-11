// Utility functions for performance optimization
// Create these as global utility functions so components can access them

// Global image cache
window.imageCache = new Map()

// Efficient DOM caching with weak references to allow garbage collection
window.domCache = new WeakMap()

// Get element utility function - caches DOM lookups
window.getElement = (selector) => {
  if (typeof selector === 'string') {
    if (!window.domCache.has(document)) {
      window.domCache.set(document, new Map())
    }

    const docCache = window.domCache.get(document)

    if (!docCache.has(selector)) {
      docCache.set(selector, document.querySelector(selector))
    }

    return docCache.get(selector)
  }

  return selector
}

// Get elements - returns an array for multiple elements
window.getElements = (selector) => {
  return Array.from(document.querySelectorAll(selector))
}

// More efficient debounce with immediate option
window.debounce = (func, wait, immediate = false) => {
  let timeout

  return function executedFunction(...args) {
    const callNow = immediate && !timeout
    const later = () => {
      timeout = null
      if (!immediate) func.apply(this, args)
    }

    clearTimeout(timeout)
    timeout = setTimeout(later, wait)

    if (callNow) func.apply(this, args)
  }
}

// Improved image preloading with priority and abort controller
window.preloadImages = (selector, priority = 'low') => {
  // Create an AbortController to cancel preloading if needed
  const controller = new AbortController()
  const signal = controller.signal

  // Select images based on selector
  const images = document.querySelectorAll(selector)

  const imagePromises = Array.from(images).map((image) => {
    if (!image.style.backgroundImage && !image.dataset.background)
      return Promise.resolve()

    // Get URL from either background-image or data-background
    let url
    if (image.style.backgroundImage) {
      const match = image.style.backgroundImage.match(/url\(['"]?(.*?)['"]?\)/)
      url = match ? match[1] : null
    } else if (image.dataset.background) {
      url = image.dataset.background
    }

    if (!url || window.imageCache.has(url)) return Promise.resolve()

    return new Promise((resolve, reject) => {
      const img = new Image()

      img.onload = () => {
        window.imageCache.set(url, img)
        resolve()
      }

      img.onerror = reject
      img.src = url

      // Add abort listener
      signal.addEventListener('abort', () => {
        img.src = ''
        reject(new Error('Image preloading aborted'))
      })
    })
  })

  // Return both promises and controller to allow cancellation
  return {
    promises: Promise.all(imagePromises),
    controller,
  }
}

// Initialize everything when DOM is ready
document.addEventListener('DOMContentLoaded', function () {
  // Lazy load images with Intersection Observer
  const setupLazyLoading = () => {
    if (!('IntersectionObserver' in window)) return

    const lazyImageObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return

          const lazyImage = entry.target

          if (lazyImage.dataset.src) {
            if (lazyImage.tagName === 'IMG') {
              lazyImage.src = lazyImage.dataset.src
            } else {
              lazyImage.style.backgroundImage = `url(${lazyImage.dataset.src})`
            }
            delete lazyImage.dataset.src
          } else if (lazyImage.dataset.background) {
            lazyImage.style.backgroundImage = `url(${lazyImage.dataset.background})`
            delete lazyImage.dataset.background
          }

          lazyImage.classList.add('loaded')
          observer.unobserve(lazyImage)
        })
      },
      {
        rootMargin: '200px', // Load images 200px before they appear
        threshold: 0.01,
      }
    )

    // Observe all elements with data-src or data-background attribute
    document
      .querySelectorAll('[data-src], [data-background]')
      .forEach((img) => {
        lazyImageObserver.observe(img)
      })
  }

  // Single Intersection Observer for all animations
  const setupAnimationObserver = () => {
    if (!('IntersectionObserver' in window)) return

    const observerOptions = {
      threshold: 0.15,
      rootMargin: '0px 0px -50px 0px',
    }

    const handleIntersection = (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return

        // Use requestAnimationFrame for smoother animations
        requestAnimationFrame(() => {
          // Add a tiny staggered delay based on element position for nicer effect
          const delay = entry.target.dataset.delay || 0

          setTimeout(() => {
            entry.target.classList.add('visible')
          }, delay)
        })

        observer.unobserve(entry.target)
      })
    }

    const observer = new IntersectionObserver(
      handleIntersection,
      observerOptions
    )

    // Batch DOM operations for better performance
    const elementsToObserve = [
      ...document.querySelectorAll('.reveal-title, .reveal-text, .reveal-item'),
    ]

    // Add slight staggered delays for elements in the same container
    let currentContainer = null
    let itemsInContainer = 0

    elementsToObserve.forEach((element, index) => {
      // Find the parent container
      const container = element.closest('section') || element.parentElement

      // If we're in a new container, reset the counter
      if (container !== currentContainer) {
        currentContainer = container
        itemsInContainer = 0
      }

      // Add a small delay based on position in container (50ms increments)
      if (element.classList.contains('reveal-item')) {
        element.dataset.delay = 50 * itemsInContainer
        itemsInContainer++
      }

      observer.observe(element)
    })

    return observer
  }

  // Setup background music control
  const setupMusicControl = () => {
    // ดึง element จากทั้งสอง id (ทั้งจาก HTML tag และจาก JavaScript สร้าง)
    const bgmTag = getElement('#bgm')
    const bgmJS = getElement('#bgm-js')
    const bgm = bgmJS || bgmTag // ใช้ JS audio element ก่อนถ้ามี
    const audioToggle = getElement('#audio-toggle')

    if (!bgm || !audioToggle) return

    // Toggle mute/unmute when the audio button is clicked
    audioToggle.addEventListener('click', () => {
      if (!bgm) return

      // ถ้าเป็น muted หรือหยุดเล่น ให้เริ่มเล่น
      if (bgm.muted || bgm.paused) {
        bgm.muted = false
        audioToggle.classList.remove('muted')

        try {
          bgm.play()
        } catch (err) {
          // เงียบการรายงานข้อผิดพลาด
        }
      } else {
        // ถ้าไม่ใช่ให้ปิดเสียง
        bgm.muted = true
        audioToggle.classList.add('muted')
      }
    })
  }

  const initializeComponents = () => {
    // Initialize all components after DOM is fully loaded and parsed

    // Setup lazy loading for images
    setupLazyLoading()

    // Setup animation observer
    setupAnimationObserver()

    // Setup music control
    setupMusicControl()
  }

  // Initialize all components
  initializeComponents()
})
