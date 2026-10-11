import confetti from 'canvas-confetti'
import { HEART_PATH } from './components/HeartIcon'

// Wedding palette: gold, milk tea, cream
const COLORS = ['#d9ba7f', '#b3896b', '#f6f1ed', '#dacabe']

/** Confetti + a few hearts after a wish is sent (skipped for reduced motion) */
export const celebrate = () => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 }, colors: COLORS })
  confetti({
    particleCount: 8,
    spread: 50,
    origin: { y: 0.6 },
    shapes: [confetti.shapeFromText({ text: '❤️', scalar: 3 })],
    scalar: 3,
  })
}

/** Big heart that pops in the middle of the screen when a wish is liked */
export const popHeart = () => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  const heart = document.createElement('div')
  heart.className = 'wish-heart-pop'
  heart.setAttribute('aria-hidden', 'true')
  heart.innerHTML = `<svg viewBox="0 0 24 24" width="150" height="150"><path d="${HEART_PATH}"/></svg>`
  document.body.appendChild(heart)
  heart.addEventListener('animationend', () => heart.remove())
}
