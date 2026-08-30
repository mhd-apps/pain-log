const HOURLY = 60 * 60 * 1000
const SW_URL = `${import.meta.env.BASE_URL}sw.js`

/**
 * Keeps a home-screen PWA on the current version without the user ever having to
 * force-quit it.
 *
 * Two things have to happen, and neither is automatic:
 *  - The browser only checks for a new service worker on page load, but a PWA
 *    launched from the home screen is suspended rather than closed, so that check
 *    can go days without running. We re-check whenever the app is resumed.
 *  - A newly installed worker sits in "waiting" until something tells it to take
 *    over. We message it to skip waiting, then reload once it controls the page.
 *
 * Reloading mid-entry is safe: the first tap of a record is already persisted.
 */
export function registerUpdates(): void {
  if (!('serviceWorker' in navigator)) return

  // On a first visit there is no controller yet; the handover that follows the
  // initial install must not trigger a reload.
  const hadControllerAtStart = Boolean(navigator.serviceWorker.controller)
  let reloading = false

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadControllerAtStart || reloading) return
    reloading = true
    window.location.reload()
  })

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(SW_URL, { scope: import.meta.env.BASE_URL })
      .then((registration) => {
        const activate = (worker: ServiceWorker | null) => {
          if (worker && hadControllerAtStart) worker.postMessage({ type: 'SKIP_WAITING' })
        }

        // A version may already be waiting from a previous session.
        activate(registration.waiting)

        registration.addEventListener('updatefound', () => {
          const installing = registration.installing
          if (!installing) return
          installing.addEventListener('statechange', () => {
            if (installing.state === 'installed') activate(registration.waiting ?? installing)
          })
        })

        const check = () => {
          registration.update().catch(() => {
            // Offline or unreachable — the next resume tries again.
          })
        }

        document.addEventListener('visibilitychange', () => {
          if (!document.hidden) check()
        })
        window.addEventListener('focus', check)
        setInterval(check, HOURLY)
      })
      .catch(() => {
        // Without a service worker the app still runs, just without offline support.
      })
  })
}
