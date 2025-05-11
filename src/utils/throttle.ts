/**
 * Creates a throttled function that only invokes the provided function at most once per
 * specified interval. If no wait time is provided, it uses requestAnimationFrame.
 *
 * @param callback - The function to throttle
 * @param wait - Optional number of milliseconds to throttle invocations to
 * @returns A throttled version of the callback function
 */
export function throttle<T extends (...args: any[]) => void>(
  callback: T,
  wait?: number
): T {
  if (typeof wait === 'undefined') {
    // Use RAF-based throttling
    let requestId: number | null = null
    let lastArgs: any[] | null = null

    const throttled = (...args: Parameters<T>) => {
      // Store the latest arguments
      lastArgs = args

      // If there's no pending frame, schedule one
      if (requestId === null) {
        requestId = requestAnimationFrame(() => {
          if (lastArgs) {
            callback(...lastArgs)
          }
          requestId = null
          lastArgs = null
        })
      }
    }

    // Add a cancel method to clear any pending frame
    ;(throttled as any).cancel = () => {
      if (requestId !== null) {
        cancelAnimationFrame(requestId)
        requestId = null
        lastArgs = null
      }
    }

    return throttled as T
  } else {
    // Use time-based throttling
    let timeoutId: ReturnType<typeof setTimeout> | null = null
    let lastExecuted = 0

    const throttled = (...args: Parameters<T>) => {
      const now = Date.now()

      if (lastExecuted && now < lastExecuted + wait) {
        // Schedule next execution
        if (timeoutId === null) {
          timeoutId = setTimeout(() => {
            lastExecuted = now
            callback(...args)
            timeoutId = null
          }, wait)
        }
        return
      }

      // Execute immediately
      lastExecuted = now
      callback(...args)
    }

    // Add a cancel method to clear any pending execution
    ;(throttled as any).cancel = () => {
      if (timeoutId !== null) {
        clearTimeout(timeoutId)
        timeoutId = null
      }
    }

    return throttled as T
  }
}
