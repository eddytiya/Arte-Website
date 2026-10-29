/**
 * Analytics placeholder. Loads Google Analytics 4 only when VITE_GA_ID is set.
 * If you target EU/UK visitors, add a consent banner before enabling this.
 */
declare global {
  interface Window {
    dataLayer: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

export function initAnalytics() {
  const id = import.meta.env.VITE_GA_ID as string | undefined
  if (!id || typeof window === 'undefined') return
  const s = document.createElement('script')
  s.async = true
  s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`
  document.head.appendChild(s)
  window.dataLayer = window.dataLayer || []
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer.push(arguments)
  }
  window.gtag('js', new Date())
  window.gtag('config', id, { anonymize_ip: true })
}

/** Call on meaningful conversions, e.g. trackEvent('generate_lead'). No-op without analytics. */
export function trackEvent(name: string, params?: Record<string, unknown>) {
  window.gtag?.('event', name, params)
}
