import { env, hasTomTom } from './env'

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

export interface RouteResult {
  durationSeconds: number
  distanceMeters: number
  points: [number, number][]
  isDemo: boolean
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
  if (hasTomTom()) {
    const ttMode = TT_MODE_MAP[mode]
    const url = `https://api.tomtom.com/routing/1/calculateRoute/${origin.lat},${origin.lon}:${destination.lat},${destination.lon}/json?key=${env.tomtomKey}&travelMode=${ttMode}&traffic=true`
    try {
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        const route = data.routes?.[0]
        if (route) {
          const summary = route.summary
          const points: [number, number][] = route.legs.flatMap((leg: { points: { latitude: number; longitude: number }[] }) =>
            leg.points.map((p) => [p.latitude, p.longitude] as [number, number]),
          )
          return {
            durationSeconds: summary.travelTimeInSeconds as number,
            distanceMeters: summary.lengthInMeters as number,
            points,
            isDemo: false,
          }
        }
      }
    } catch {
      // fall through to demo
    }
  }
  return buildDemoRoute(origin, destination, mode)
}

function buildDemoRoute(origin: RoutePoint, destination: RoutePoint, mode: TravelMode): RouteResult {
  const steps = 20
  const midLat = (origin.lat + destination.lat) / 2 + (Math.random() - 0.5) * 0.01
  const midLon = (origin.lon + destination.lon) / 2 + (Math.random() - 0.5) * 0.01

  const points: [number, number][] = []
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const lat = (1 - t) * (1 - t) * origin.lat + 2 * (1 - t) * t * midLat + t * t * destination.lat
    const lon = (1 - t) * (1 - t) * origin.lon + 2 * (1 - t) * t * midLon + t * t * destination.lon
    points.push([lat, lon])
  }

  const dLat = destination.lat - origin.lat
  const dLon = destination.lon - origin.lon
  const distanceMeters = Math.round(Math.sqrt(dLat * dLat + dLon * dLon) * 111000 * 1.3)

  const speedKmh: Record<TravelMode, number> = { car: 35, taxi: 35, transit: 25, bike: 18, walk: 5 }
  const durationSeconds = Math.round((distanceMeters / 1000 / speedKmh[mode]) * 3600)

  return { durationSeconds, distanceMeters, points, isDemo: true }
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
