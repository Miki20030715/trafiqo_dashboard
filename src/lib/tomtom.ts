import { env, hasTomTom } from './env'

/**
 * TomTom tile URL builders. The key is read from import.meta.env (never hardcoded).
 * When no key is present, callers fall back to the behavioural model map layer.
 *
 * Note: map/traffic tile keys are necessarily exposed to the browser (that's how
 * client-side tiles work); TomTom keys are meant to be domain-restricted in the portal.
 */

export type TrafficFlowStyle = 'relative' | 'absolute' | 'relative-delay' | 'reduced-sensitivity'

/** TomTom Traffic Flow raster tiles — colour-coded live flow speeds. */
export function tomtomTrafficFlowUrl(style: TrafficFlowStyle = 'relative'): string {
  return `https://api.tomtom.com/traffic/map/4/tile/flow/${style}/{z}/{x}/{y}.png?key=${env.tomtomKey}`
}

/** TomTom base map tiles (optional — the app uses a CARTO basemap by default). */
export function tomtomBaseMapUrl(): string {
  return `https://api.tomtom.com/map/1/tile/basic/main/{z}/{x}/{y}.png?key=${env.tomtomKey}`
}

export { hasTomTom }
