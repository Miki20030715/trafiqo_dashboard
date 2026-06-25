/**
 * TomTom Matrix Routing v2 — evaluate many origin→destination legs in ONE call,
 * then compose and rank several route options (fastest / shortest / least congested).
 *
 * Used by route planning (compare alternatives for one trip) and the Road stats view
 * (rank major corridors by current live speed). Falls back to a road-graph model
 * estimate when no live key is present, so the UI always has something to show.
 *
 * The key is read from import.meta.env (never hardcoded).
 */
import { env, hasTomTom } from './env'
import type { RoutePoint, TravelMode } from './routing'
import {
  nearestNodeId,
  shortestPath,
  getNode,
  haversineMeters,
  edgeBetween,
} from '@/components/map/roadNetwork'
import { roadLoad } from './simEngine'

const TT_MODE: Record<TravelMode, string> = {
  car: 'car',
  taxi: 'car',
  transit: 'bus',
  bike: 'bicycle',
  walk: 'pedestrian',
}

const MODEL_SPEED_KMH: Record<TravelMode, number> = {
  car: 32,
  taxi: 32,
  transit: 22,
  bike: 16,
  walk: 5,
}

export type ResultSource = 'tomtom' | 'model'

export interface LegSummary {
  durationSeconds: number
  distanceMeters: number
  trafficDelaySeconds: number
}

interface LatLon {
  lat: number
  lon: number
}

/**
 * Low-level Matrix v2 call: returns a [originIndex][destinationIndex] grid of leg
 * summaries, or null on any failure (caller falls back to the model).
 */
async function tomtomMatrix(
  origins: LatLon[],
  destinations: LatLon[],
  mode: TravelMode,
): Promise<(LegSummary | null)[][] | null> {
  if (!hasTomTom()) return null
  const url = `https://api.tomtom.com/routing/matrix/2?key=${env.tomtomKey}`
  const body = {
    origins: origins.map((p) => ({ point: { latitude: p.lat, longitude: p.lon } })),
    destinations: destinations.map((p) => ({ point: { latitude: p.lat, longitude: p.lon } })),
    options: {
      departAt: 'now',
      traffic: 'live',
      travelMode: TT_MODE[mode],
      routeType: 'fastest',
    },
  }
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const txt = await res.text().catch(() => '')
      console.error(`[matrix] TomTom Matrix v2 ${res.status} ${res.statusText}`, txt.slice(0, 300))
      return null
    }
    const data = await res.json()
    const grid: (LegSummary | null)[][] = origins.map(() => destinations.map(() => null))
    for (const cell of data.data ?? []) {
      const s = cell.routeSummary
      if (s && cell.originIndex != null && cell.destinationIndex != null) {
        grid[cell.originIndex][cell.destinationIndex] = {
          durationSeconds: s.travelTimeInSeconds ?? 0,
          distanceMeters: s.lengthInMeters ?? 0,
          trafficDelaySeconds: s.trafficDelayInSeconds ?? 0,
        }
      }
    }
    return grid
  } catch (err) {
    console.error('[matrix] TomTom Matrix v2 request failed (CORS / domain / network):', err)
    return null
  }
}

/** Model estimate of a single leg using the road graph (distance, time, congestion delay). */
function modelLeg(a: LatLon, b: LatLon, mode: TravelMode): LegSummary {
  const path = shortestPath(nearestNodeId(a.lat, a.lon), nearestNodeId(b.lat, b.lon))
  const nodes = path ?? []
  const pts: [number, number][] = [[a.lat, a.lon]]
  for (const id of nodes) {
    const n = getNode(id)
    pts.push([n.lat, n.lon])
  }
  pts.push([b.lat, b.lon])

  let distance = 0
  for (let i = 1; i < pts.length; i++) {
    distance += haversineMeters(pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1])
  }

  // Average road load along the graph portion → congestion delay.
  let loadSum = 0
  let loadW = 0
  for (let i = 0; i < nodes.length - 1; i++) {
    const e = edgeBetween(nodes[i], nodes[i + 1])
    const seg = haversineMeters(
      getNode(nodes[i]).lat,
      getNode(nodes[i]).lon,
      getNode(nodes[i + 1]).lat,
      getNode(nodes[i + 1]).lon,
    )
    loadSum += (e ? roadLoad(e.road) : 0.25) * seg
    loadW += seg
  }
  const avgLoad = loadW > 0 ? loadSum / loadW : 0.25
  const freeFlow = (distance / 1000 / MODEL_SPEED_KMH[mode]) * 3600
  const trafficDelay = freeFlow * avgLoad * 0.7
  return {
    // Travel time includes the congestion delay, so busier corridors read slower.
    durationSeconds: Math.round(freeFlow + trafficDelay),
    distanceMeters: Math.round(distance),
    trafficDelaySeconds: Math.round(trafficDelay),
  }
}

// ───────────────────────── Route options comparison ─────────────────────────

export interface RouteOption {
  id: string
  /** null = the direct route; otherwise the via-landmark name. */
  via: string | null
  viaHu: string | null
  durationSeconds: number
  distanceMeters: number
  trafficDelaySeconds: number
}

export interface RouteComparison {
  options: RouteOption[] // sorted fastest → slowest
  fastestId: string
  shortestId: string
  leastCongestedId: string
  bestId: string
  source: ResultSource
}

interface Hub {
  name: string
  nameHu: string
  lat: number
  lon: number
}

const VIA_HUBS: Hub[] = [
  { name: 'Deák Ferenc Square', nameHu: 'Deák Ferenc tér', lat: 47.4979, lon: 19.0541 },
  { name: 'Blaha Lujza Square', nameHu: 'Blaha Lujza tér', lat: 47.4962, lon: 19.0701 },
  { name: 'Grand Boulevard (Oktogon)', nameHu: 'Nagykörút (Oktogon)', lat: 47.5064, lon: 19.0648 },
  { name: 'Móricz Zsigmond Square', nameHu: 'Móricz Zsigmond körtér', lat: 47.4769, lon: 19.046 },
  { name: 'Hero’s Square', nameHu: 'Hősök tere', lat: 47.5151, lon: 19.0776 },
]

/** Choose up to `n` hubs that plausibly lie between origin and destination. */
function pickVias(origin: RoutePoint, destination: RoutePoint, n: number): Hub[] {
  const direct = haversineMeters(origin.lat, origin.lon, destination.lat, destination.lon)
  return VIA_HUBS.map((h) => {
    const detour =
      haversineMeters(origin.lat, origin.lon, h.lat, h.lon) +
      haversineMeters(h.lat, h.lon, destination.lat, destination.lon)
    return { h, ratio: detour / Math.max(direct, 1) }
  })
    .filter((x) => x.ratio < 1.7)
    .sort((a, b) => a.ratio - b.ratio)
    .slice(0, n)
    .map((x) => x.h)
}

/** Drop options that are effectively the same route (≈ same time and distance). */
function dedupeOptions(options: RouteOption[]): RouteOption[] {
  const kept: RouteOption[] = []
  for (const o of options) {
    const dup = kept.some(
      (k) =>
        Math.abs(k.durationSeconds - o.durationSeconds) < 30 &&
        Math.abs(k.distanceMeters - o.distanceMeters) < 150,
    )
    if (!dup) kept.push(o)
  }
  return kept
}

function rankComparison(options: RouteOption[], source: ResultSource): RouteComparison {
  const fastest = options.reduce((a, b) => (b.durationSeconds < a.durationSeconds ? b : a))
  const shortest = options.reduce((a, b) => (b.distanceMeters < a.distanceMeters ? b : a))
  const leastCongested = options.reduce((a, b) =>
    b.trafficDelaySeconds < a.trafficDelaySeconds ? b : a,
  )
  const sorted = [...options].sort((a, b) => a.durationSeconds - b.durationSeconds)
  return {
    options: sorted,
    fastestId: fastest.id,
    shortestId: shortest.id,
    leastCongestedId: leastCongested.id,
    bestId: fastest.id, // fastest (already traffic-aware) is the recommended option
    source,
  }
}

/**
 * Compare the direct route with a few via-landmark alternatives for one trip,
 * using Matrix Routing v2 when a key is present (else the road-graph model).
 */
export async function compareRouteOptions(
  origin: RoutePoint,
  destination: RoutePoint,
  mode: TravelMode,
): Promise<RouteComparison> {
  const vias = pickVias(origin, destination, 3)

  // One matrix covers: origin→dest, origin→each via, each via→dest.
  const origins: LatLon[] = [origin, ...vias]
  const destinations: LatLon[] = [destination, ...vias]
  const grid = await tomtomMatrix(origins, destinations, mode)

  const options: RouteOption[] = []
  if (grid) {
    const direct = grid[0][0]
    if (direct) {
      options.push({ id: 'direct', via: null, viaHu: null, ...direct })
    }
    vias.forEach((h, i) => {
      const toVia = grid[0][i + 1] // origin → via
      const fromVia = grid[i + 1][0] // via → dest
      if (toVia && fromVia) {
        options.push({
          id: `via-${i}`,
          via: h.name,
          viaHu: h.nameHu,
          durationSeconds: toVia.durationSeconds + fromVia.durationSeconds,
          distanceMeters: toVia.distanceMeters + fromVia.distanceMeters,
          trafficDelaySeconds: toVia.trafficDelaySeconds + fromVia.trafficDelaySeconds,
        })
      }
    })
  }

  if (options.length >= 2) return rankComparison(dedupeOptions(options), 'tomtom')

  // Model fallback (no key, or the live call failed).
  const modelOptions: RouteOption[] = [
    { id: 'direct', via: null, viaHu: null, ...modelLeg(origin, destination, mode) },
  ]
  vias.forEach((h, i) => {
    const a = modelLeg(origin, h, mode)
    const b = modelLeg(h, destination, mode)
    modelOptions.push({
      id: `via-${i}`,
      via: h.name,
      viaHu: h.nameHu,
      durationSeconds: a.durationSeconds + b.durationSeconds,
      distanceMeters: a.distanceMeters + b.distanceMeters,
      trafficDelaySeconds: a.trafficDelaySeconds + b.trafficDelaySeconds,
    })
  })
  return rankComparison(dedupeOptions(modelOptions), 'model')
}
