/**
 * Throttles a callback to at most once per animation frame, always running it
 * with the latest arguments. Ideal for scroll handlers that write styles.
 */
export function throttle<Args extends unknown[]>(
  callback: (...args: Args) => void
): (...args: Args) => void {
  let frame: number | null = null
  let lastArgs: Args

  return (...args: Args) => {
    lastArgs = args
    if (frame !== null) return

    frame = requestAnimationFrame(() => {
      frame = null
      callback(...lastArgs)
    })
  }
}
