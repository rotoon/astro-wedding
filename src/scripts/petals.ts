/**
 * A few seconds of petals drifting down the screen, for the wedding anniversary.
 * Imported on demand, so canvas-confetti is only downloaded on that day.
 */
import confetti from 'canvas-confetti'

const DURATION_MS = 5000
const EVERY_MS = 220
// Blush, milk tea, cream and the site's gold
const COLORS = ['#f2c4c4', '#e8b4a8', '#f6f1ed', '#dacabe', '#d9ba7f']

export const petals = () => {
  // A soft petal: two curves meeting at the tips
  const petal = confetti.shapeFromPath({ path: 'M0 0 C4 -6 12 -6 16 0 C12 6 4 6 0 0 Z' })
  const end = Date.now() + DURATION_MS

  const drop = () => {
    confetti({
      particleCount: 2,
      shapes: [petal],
      colors: COLORS,
      origin: { x: Math.random(), y: -0.05 },
      angle: 270, // straight down
      spread: 40,
      startVelocity: 3,
      gravity: 0.35,
      drift: Math.random() - 0.5,
      ticks: 600,
      scalar: 1.6,
      disableForReducedMotion: true,
    })
    if (Date.now() < end) setTimeout(drop, EVERY_MS)
  }
  drop()
}
