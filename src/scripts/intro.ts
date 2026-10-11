/**
 * Tiny signal shared by the loading screen and anything that should wait for it.
 * LoadingAnimation calls `markIntroDone()` once the page is shown; listeners
 * registered with `onIntroDone()` run then, or immediately if it already happened
 * or the page has no loading screen.
 */
const INTRO_DONE_EVENT = 'intro:done'

export const markIntroDone = () => {
  document.documentElement.dataset.introDone = 'true'
  document.dispatchEvent(new Event(INTRO_DONE_EVENT))
}

export const onIntroDone = (callback: () => void) => {
  // Pages without a loading screen (e.g. /wishes) have no intro to wait for
  const hasIntro = document.querySelector('.loading-screen') !== null
  if (!hasIntro || document.documentElement.dataset.introDone) {
    callback()
  } else {
    document.addEventListener(INTRO_DONE_EVENT, callback, { once: true })
  }
}
