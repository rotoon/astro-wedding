/**
 * Scroll reveal for `.reveal-title` and `.reveal-item`:
 * adds `.visible` (see global.css) when an element scrolls into view.
 */
const SELECTOR = '.reveal-title, .reveal-item'
const STAGGER_MS = 80 // delay between elements of the same section

const reveal = (element: HTMLElement) => element.classList.add('visible')

const setupReveal = () => {
  const elements = Array.from(document.querySelectorAll<HTMLElement>(SELECTOR))

  if (!('IntersectionObserver' in window)) {
    elements.forEach(reveal)
    return
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return

        const element = entry.target as HTMLElement
        const delay = Number(element.dataset.revealDelay || 0)
        requestAnimationFrame(() => setTimeout(() => reveal(element), delay))
        observer.unobserve(element)
      })
    },
    { threshold: 0.15, rootMargin: '0px 0px -50px 0px' }
  )

  // Stagger elements within each section (a Map keyed by element, so every
  // section gets its own 0, 80, 160ms… sequence)
  const sections = new Map<Element | null, HTMLElement[]>()
  elements.forEach((element) => {
    const section = element.closest('section')
    sections.set(section, [...(sections.get(section) ?? []), element])
  })

  sections.forEach((sectionElements) => {
    sectionElements.forEach((element, index) => {
      element.dataset.revealDelay = String(index * STAGGER_MS)
      observer.observe(element)
    })
  })
}

setupReveal()
