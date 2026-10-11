/**
 * Tiny signal shared by the loading screen and anything that should wait for it.
 * LoadingAnimation calls `markIntroDone()` once the page is shown; listeners
 * registered with `onIntroDone()` run then, or immediately if it already happened.
 */
const INTRO_DONE_EVENT = 'intro:done'

export const markIntroDone = () => {
  document.documentElement.dataset.introDone = 'true'
  document.dispatchEvent(new Event(INTRO_DONE_EVENT))
}

export const onIntroDone = (callback: () => void) => {
  if (document.documentElement.dataset.introDone) {
    callback()
  } else {
    document.addEventListener(INTRO_DONE_EVENT, callback, { once: true })
  }
}
