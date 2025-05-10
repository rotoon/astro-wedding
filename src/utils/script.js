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

// Optimized throttle with leading and trailing options
window.throttle = (
  func,
  limit,
  options = { leading: true, trailing: true }
) => {
  let timeout
  let previous = 0

  return function executedFunction(...args) {
    const now = Date.now()
    const { leading, trailing } = options

    if (!previous && !leading) previous = now

    const remaining = limit - (now - previous)

    if (remaining <= 0 || remaining > limit) {
      if (timeout) {
        clearTimeout(timeout)
        timeout = null
      }

      previous = now
      func.apply(this, args)
    } else if (!timeout && trailing) {
      timeout = setTimeout(() => {
        previous = leading ? Date.now() : 0
        timeout = null
        func.apply(this, args)
      }, remaining)
    }
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
      threshold: 0.1,
      rootMargin: '50px',
    }

    const handleIntersection = (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return

        // Use requestAnimationFrame for smoother animations
        requestAnimationFrame(() => {
          entry.target.classList.add('visible')
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

    elementsToObserve.forEach((element) => {
      observer.observe(element)
    })

    return observer
  }

  // Setup background music control
  const setupMusicControl = () => {
    const bgm = getElement('#bgm')
    const audioToggle = getElement('#audio-toggle')

    if (!bgm || !audioToggle) return

    document.body.addEventListener('click', (e) => {
      if (
        e.target.matches('#audio-toggle') ||
        e.target.closest('#audio-toggle')
      ) {
        if (bgm.paused) {
          bgm.play().catch((error) => {
            console.log('Audio playback error:', error)
          })
          audioToggle.classList.remove('muted')
        } else {
          bgm.pause()
          audioToggle.classList.add('muted')
        }
      }
    })
  }

  // Initialize components
  const initializeComponents = () => {
    setupLazyLoading()
    setupAnimationObserver()
    setupMusicControl()

    // Handle loading screen
    setTimeout(() => {
      const loadingScreen = getElement('.loading-screen')
      const mainContainer = getElement('.main-container')

      if (loadingScreen) loadingScreen.classList.add('hidden')
      if (mainContainer) mainContainer.classList.add('visible')
    }, 1500)
  }

  // Initialize when document is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeComponents)
  } else {
    initializeComponents()
  }
})
