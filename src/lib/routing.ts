import { env, hasTomTom } from './env'
import {
  getNode,
  haversineMeters,
  nearestNodeId,
  shortestPath,
} from '@/components/map/roadNetwork'

export type TravelMode = 'car' | 'taxi' | 'transit' | 'bike' | 'walk'

const TT_MODE_MAP: Record<TravelMode, string> = {
  car: 'car',
  taxi: 'car',
  transit: 'bus',
  bike: 'bicycle',
  walk: 'pedestrian',
}

export interface RoutePoint {
  lat: number
  lon: number
  name: string
  nameHu: string
}

/** Where the route geometry came from. */
export type RouteSource = 'tomtom' | 'model'

/** Captured when a live TomTom attempt was made but failed, so the UI/console can show why. */
export interface RouteError {
  /** HTTP status, when the request reached TomTom (e.g. 403). Absent for CORS/network failures. */
  status?: number
  /** TomTom's error message, or the JS error text (e.g. "Failed to fetch") for CORS/network. */
  message: string
  /** True when fetch() threw before a response (typically CORS or a network/DNS block). */
  network?: boolean
}

export interface RouteResult {
  durationSeconds: number
  distanceMeters: number
  points: [number, number][]
  /** 'tomtom' = live road routing with traffic; 'model' = estimated along the road graph. */
  source: RouteSource
  /** Present only when a live key existed but the TomTom call failed (diagnostic). */
  error?: RouteError
}

export const BUDAPEST_LOCATIONS: RoutePoint[] = [
  { lat: 47.5001, lon: 19.0839, name: 'Keleti railway station', nameHu: 'Keleti pályaudvar' },
  { lat: 47.5110, lon: 19.0537, name: 'Nyugati railway station', nameHu: 'Nyugati pályaudvar' },
  { lat: 47.4981, lon: 19.0522, name: 'Deák Ferenc Square', nameHu: 'Deák Ferenc tér' },
  { lat: 47.4961, lon: 19.0679, name: 'Blaha Lujza Square', nameHu: 'Blaha Lujza tér' },
  { lat: 47.4882, lon: 19.0710, name: 'Corvin Quarter', nameHu: 'Corvin-negyed' },
  { lat: 47.5167, lon: 19.0774, name: "Hero's Square / Városliget", nameHu: 'Hősök tere / Városliget' },
  { lat: 47.5271, lon: 19.0457, name: 'Margaret Island', nameHu: 'Margitsziget' },
  { lat: 47.4969, lon: 19.0399, name: 'Buda Castle', nameHu: 'Budavári Palota' },
  { lat: 47.5025, lon: 19.0572, name: 'Elizabeth Bridge', nameHu: 'Erzsébet híd' },
  { lat: 47.4990, lon: 19.0435, name: 'Chain Bridge / Lánchíd', nameHu: 'Széchenyi Lánchíd' },
]

export async function calculateRoute(
  origin: RoutePoint,
  destination: RoutePoint,
  mode: TravelMode,
): Promise<RouteResult> {
  // Live TomTom road routing (with traffic) is preferred whenever a key is present.
  if (hasTomTom()) {
    const ttMode = TT_MODE_MAP[mode]
    const url =
      `https://api.tomtom.com/routing/1/calculateRoute/` +
      `${origin.lat},${origin.lon}:${destination.lat},${destination.lon}/json` +
      `?key=${env.tomtomKey}&travelMode=${ttMode}&traffic=true&routeType=fastest`
    try {
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        const route = data.routes?.[0]
        const points: [number, number][] =
          route?.legs?.flatMap((leg: { points: { latitude: number; longitude: number }[] }) =>
            leg.points.map((p) => [p.latitude, p.longitude] as [number, number]),
          ) ?? []
        if (route?.summary && points.length > 1) {
          return {
            durationSeconds: route.summary.travelTimeInSeconds as number,
            distanceMeters: route.summary.lengthInMeters as number,
            points,
            source: 'tomtom',
          }
        }
        const msg = 'TomTom returned 200 but no usable route geometry.'
        console.warn('[routing]', msg)
        return buildModelRoute(origin, destination, mode, { status: res.status, message: msg })
      } else {
        // Read TomTom's error body — it carries the actionable message (e.g. domain/quota).
        const body = await res.text().catch(() => '')
        const ttMessage = extractTomTomMessage(body)
        console.error(
          `[routing] TomTom Routing API ${res.status} ${res.statusText}. ${ttMessage}`,
          body.slice(0, 500),
        )
        return buildModelRoute(origin, destination, mode, {
          status: res.status,
          message: ttMessage || `${res.status} ${res.statusText}`,
        })
      }
    } catch (err) {
      // fetch() throws (no readable status) on CORS rejection or a network/DNS block.
      // For a referrer-restricted TomTom key, the 403 often lacks CORS headers and
      // surfaces here as "Failed to fetch" — i.e. the domain restriction is rejecting it.
      const message = err instanceof Error ? err.message : String(err)
      console.error(
        `[routing] TomTom Routing request failed before a response (likely CORS / domain ` +
          `restriction / network): ${message}`,
      )
      return buildModelRoute(origin, destination, mode, { message, network: true })
    }
  }
  return buildModelRoute(origin, destination, mode)
}

/** Pull a human-readable message out of a TomTom JSON or text error body. */
function extractTomTomMessage(body: string): string {
  try {
    const j = JSON.parse(body)
    return (
      j?.detailedError?.message ||
      j?.error?.description ||
      j?.errorText ||
      j?.message ||
      ''
    )
  } catch {
    return body.slice(0, 200)
  }
}

/** Free-flow speeds (km/h) used to estimate duration for the model route. */
const MODEL_SPEED_KMH: Record<TravelMode, number> = {
  car: 32,
  taxi: 32,
  transit: 22,
  bike: 16,
  walk: 5,
}

/**
 * Fallback route that follows the Budapest road graph instead of a straight line:
 * snap origin/destination to the nearest intersections, route over the network
 * (crossing the river only on bridges), and stitch short connectors at each end.
 * Distance is measured along the polyline; duration uses a mode-specific speed.
 */
function buildModelRoute(
  origin: RoutePoint,
  destination: RoutePoint,
  mode: TravelMode,
  error?: RouteError,
): RouteResult {
  const startNode = nearestNodeId(origin.lat, origin.lon)
  const endNode = nearestNodeId(destination.lat, destination.lon)
  const nodePath = shortestPath(startNode, endNode) ?? [startNode, endNode]

  const points: [number, number][] = [[origin.lat, origin.lon]]
  for (const id of nodePath) {
    const n = getNode(id)
    points.push([n.lat, n.lon])
  }
  points.push([destination.lat, destination.lon])

  let distanceMeters = 0
  for (let i = 1; i < points.length; i++) {
    distanceMeters += haversineMeters(points[i - 1][0], points[i - 1][1], points[i][0], points[i][1])
  }
  distanceMeters = Math.round(distanceMeters)

  const durationSeconds = Math.round((distanceMeters / 1000 / MODEL_SPEED_KMH[mode]) * 3600)
  return { durationSeconds, distanceMeters, points, source: 'model', error }
}

export function formatDuration(seconds: number, lang: string): string {
  const mins = Math.round(seconds / 60)
  if (mins < 60) return lang === 'hu' ? `${mins} perc` : `${mins} min`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return lang === 'hu' ? `${h} ó ${m} perc` : `${h}h ${m}m`
}

export function formatDistance(meters: number, lang: string): string {
  const km = (meters / 1000).toFixed(1)
  return lang === 'hu' ? `${km} km` : `${km} km`
}

export function estimateTimeSaved(durationSeconds: number, mode: TravelMode): number {
  const savings: Record<TravelMode, number> = { car: 0.12, taxi: 0.10, transit: 0.05, bike: 0.08, walk: 0.02 }
  return Math.round((durationSeconds * savings[mode]) / 60)
}
