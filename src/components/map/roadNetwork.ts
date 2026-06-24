/**
 * Central-Budapest road network — a hand-built graph of real intersections, arteries
 * and the Danube bridges. The simulation moves agents ALONG these edges only, so they
 * stay on streets and can cross the river ONLY via the six bridge edges (never through
 * buildings or across water).
 *
 * This is model geometry over real Budapest streets — not measured routing data.
 * Roads are named so Step 3 can aggregate per-road statistics.
 */

export interface RoadNode {
  id: string
  lat: number
  lon: number
}

export interface RoadEdge {
  a: string
  b: string
  /** Street/bridge name (English) — used to group statistics. */
  road: string
  roadHu: string
  /** True for the Danube bridges — the only Buda↔Pest connections. */
  bridge?: boolean
}

/** Intersections / landmarks. Coordinates are approximate real positions. */
export const NODES: RoadNode[] = [
  // — Pest (east bank) —
  { id: 'deak', lat: 47.4979, lon: 19.0541 },
  { id: 'astoria', lat: 47.4940, lon: 19.0588 },
  { id: 'ferenciek', lat: 47.4936, lon: 19.0533 },
  { id: 'kalvin', lat: 47.4889, lon: 19.0611 },
  { id: 'fovam', lat: 47.4862, lon: 19.0570 },
  { id: 'blaha', lat: 47.4962, lon: 19.0701 },
  { id: 'corvin', lat: 47.4856, lon: 19.0705 },
  { id: 'boraros', lat: 47.4762, lon: 19.0662 },
  { id: 'keleti', lat: 47.5003, lon: 19.0840 },
  { id: 'oktogon', lat: 47.5064, lon: 19.0648 },
  { id: 'nyugati', lat: 47.5112, lon: 19.0567 },
  { id: 'jaszai', lat: 47.5146, lon: 19.0490 },
  { id: 'hosok', lat: 47.5151, lon: 19.0776 },
  { id: 'arpadPest', lat: 47.5330, lon: 19.0640 },
  { id: 'szechenyi', lat: 47.4979, lon: 19.0472 },
  { id: 'erzsebetPest', lat: 47.4925, lon: 19.0512 },
  // — Buda (west bank) —
  { id: 'clark', lat: 47.4979, lon: 19.0405 },
  { id: 'castle', lat: 47.4968, lon: 19.0348 },
  { id: 'szell', lat: 47.5070, lon: 19.0249 },
  { id: 'margitBuda', lat: 47.5128, lon: 19.0388 },
  { id: 'dobrentei', lat: 47.4906, lon: 19.0454 },
  { id: 'gellert', lat: 47.4837, lon: 19.0510 },
  { id: 'moricz', lat: 47.4773, lon: 19.0460 },
  { id: 'petofiBuda', lat: 47.4767, lon: 19.0607 },
  { id: 'arpadBuda', lat: 47.5340, lon: 19.0455 },
]

export const EDGES: RoadEdge[] = [
  // Kiskörút (Little Boulevard)
  { a: 'deak', b: 'astoria', road: 'Little Boulevard', roadHu: 'Kiskörút' },
  { a: 'astoria', b: 'kalvin', road: 'Little Boulevard', roadHu: 'Kiskörút' },
  { a: 'kalvin', b: 'fovam', road: 'Little Boulevard', roadHu: 'Kiskörút' },
  // Belváros / inner city
  { a: 'deak', b: 'ferenciek', road: 'Inner city', roadHu: 'Belváros' },
  { a: 'ferenciek', b: 'erzsebetPest', road: 'Inner city', roadHu: 'Belváros' },
  // Rákóczi út
  { a: 'astoria', b: 'blaha', road: 'Rákóczi Avenue', roadHu: 'Rákóczi út' },
  { a: 'blaha', b: 'keleti', road: 'Rákóczi Avenue', roadHu: 'Rákóczi út' },
  // Nagykörút (Grand Boulevard)
  { a: 'boraros', b: 'corvin', road: 'Grand Boulevard', roadHu: 'Nagykörút' },
  { a: 'corvin', b: 'blaha', road: 'Grand Boulevard', roadHu: 'Nagykörút' },
  { a: 'blaha', b: 'oktogon', road: 'Grand Boulevard', roadHu: 'Nagykörút' },
  { a: 'oktogon', b: 'nyugati', road: 'Grand Boulevard', roadHu: 'Nagykörút' },
  { a: 'nyugati', b: 'jaszai', road: 'Grand Boulevard', roadHu: 'Nagykörút' },
  // Andrássy út
  { a: 'deak', b: 'oktogon', road: 'Andrássy Avenue', roadHu: 'Andrássy út' },
  { a: 'oktogon', b: 'hosok', road: 'Andrássy Avenue', roadHu: 'Andrássy út' },
  // Bajcsy-Zsilinszky / Váci út
  { a: 'deak', b: 'nyugati', road: 'Bajcsy-Zsilinszky Road', roadHu: 'Bajcsy-Zsilinszky út' },
  { a: 'nyugati', b: 'arpadPest', road: 'Váci Road', roadHu: 'Váci út' },
  // Üllői út
  { a: 'kalvin', b: 'corvin', road: 'Üllői Road', roadHu: 'Üllői út' },
  // Pest riverside lower quay
  { a: 'fovam', b: 'boraros', road: 'Pest Quay', roadHu: 'Pesti rakpart' },
  { a: 'deak', b: 'szechenyi', road: 'József Attila Street', roadHu: 'József Attila utca' },
  { a: 'keleti', b: 'hosok', road: 'Dózsa György Road', roadHu: 'Dózsa György út' },

  // — Danube bridges (the ONLY Buda↔Pest links) —
  { a: 'szechenyi', b: 'clark', road: 'Chain Bridge', roadHu: 'Lánchíd', bridge: true },
  { a: 'erzsebetPest', b: 'dobrentei', road: 'Elizabeth Bridge', roadHu: 'Erzsébet híd', bridge: true },
  { a: 'fovam', b: 'gellert', road: 'Liberty Bridge', roadHu: 'Szabadság híd', bridge: true },
  { a: 'boraros', b: 'petofiBuda', road: 'Petőfi Bridge', roadHu: 'Petőfi híd', bridge: true },
  { a: 'jaszai', b: 'margitBuda', road: 'Margaret Bridge', roadHu: 'Margit híd', bridge: true },
  { a: 'arpadPest', b: 'arpadBuda', road: 'Árpád Bridge', roadHu: 'Árpád híd', bridge: true },

  // — Buda (west bank) —
  { a: 'clark', b: 'castle', road: 'Castle District', roadHu: 'Várkerület' },
  { a: 'clark', b: 'dobrentei', road: 'Buda Lower Quay', roadHu: 'Budai alsó rakpart' },
  { a: 'dobrentei', b: 'gellert', road: 'Buda Lower Quay', roadHu: 'Budai alsó rakpart' },
  { a: 'gellert', b: 'petofiBuda', road: 'Gellért Quay', roadHu: 'Szent Gellért rakpart' },
  { a: 'gellert', b: 'moricz', road: 'Bartók Béla Road', roadHu: 'Bartók Béla út' },
  { a: 'moricz', b: 'petofiBuda', road: 'Irinyi Street', roadHu: 'Irinyi József utca' },
  { a: 'clark', b: 'margitBuda', road: 'Buda Upper Quay', roadHu: 'Budai felső rakpart' },
  { a: 'margitBuda', b: 'szell', road: 'Margit Boulevard', roadHu: 'Margit körút' },
  { a: 'castle', b: 'dobrentei', road: 'Hegyalja Road', roadHu: 'Hegyalja út' },
  { a: 'castle', b: 'szell', road: 'Krisztina Boulevard', roadHu: 'Krisztina körút' },
  { a: 'margitBuda', b: 'arpadBuda', road: 'Buda Upper Quay', roadHu: 'Budai felső rakpart' },
]

const NODE_MAP: Record<string, RoadNode> = Object.fromEntries(NODES.map((n) => [n.id, n]))

export function getNode(id: string): RoadNode {
  return NODE_MAP[id]
}

/** Great-circle distance in metres between two [lat, lon] points. */
export function haversineMeters(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const R = 6371000
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(bLat - aLat)
  const dLon = toRad(bLon - aLon)
  const lat1 = toRad(aLat)
  const lat2 = toRad(bLat)
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

interface AdjEntry {
  to: string
  weight: number
  edge: RoadEdge
}

const ADJ: Record<string, AdjEntry[]> = (() => {
  const adj: Record<string, AdjEntry[]> = {}
  for (const n of NODES) adj[n.id] = []
  for (const e of EDGES) {
    const na = NODE_MAP[e.a]
    const nb = NODE_MAP[e.b]
    const w = haversineMeters(na.lat, na.lon, nb.lat, nb.lon)
    adj[e.a].push({ to: e.b, weight: w, edge: e })
    adj[e.b].push({ to: e.a, weight: w, edge: e })
  }
  return adj
})()

/** Look up the road metadata for the edge between two adjacent nodes. */
export function edgeBetween(a: string, b: string): RoadEdge | undefined {
  return ADJ[a]?.find((e) => e.to === b)?.edge
}

/** All node ids. */
export const NODE_IDS = NODES.map((n) => n.id)

/** Unique road names (for stats), in declaration order. */
export const ROADS: { road: string; roadHu: string; bridge: boolean }[] = (() => {
  const seen = new Map<string, { road: string; roadHu: string; bridge: boolean }>()
  for (const e of EDGES) {
    if (!seen.has(e.road)) seen.set(e.road, { road: e.road, roadHu: e.roadHu, bridge: !!e.bridge })
  }
  return [...seen.values()]
})()

/**
 * Dijkstra shortest path between two node ids. Returns the list of node ids
 * (inclusive of both ends), or null if unreachable (should not happen — the
 * graph is fully connected through the bridges).
 */
export function shortestPath(from: string, to: string): string[] | null {
  if (from === to) return [from]
  const dist: Record<string, number> = {}
  const prev: Record<string, string | null> = {}
  const visited = new Set<string>()
  for (const id of NODE_IDS) {
    dist[id] = Infinity
    prev[id] = null
  }
  dist[from] = 0

  while (visited.size < NODE_IDS.length) {
    // Pick the unvisited node with smallest distance.
    let u: string | null = null
    let best = Infinity
    for (const id of NODE_IDS) {
      if (!visited.has(id) && dist[id] < best) {
        best = dist[id]
        u = id
      }
    }
    if (u === null) break
    if (u === to) break
    visited.add(u)
    for (const { to: v, weight } of ADJ[u]) {
      if (visited.has(v)) continue
      const alt = dist[u] + weight
      if (alt < dist[v]) {
        dist[v] = alt
        prev[v] = u
      }
    }
  }

  if (dist[to] === Infinity) return null
  const path: string[] = []
  let cur: string | null = to
  while (cur) {
    path.unshift(cur)
    cur = prev[cur]
  }
  return path
}

/** Pick a uniformly random node id, optionally excluding one. */
export function randomNodeId(exclude?: string): string {
  let id = NODE_IDS[Math.floor(Math.random() * NODE_IDS.length)]
  if (exclude) {
    while (id === exclude) id = NODE_IDS[Math.floor(Math.random() * NODE_IDS.length)]
  }
  return id
}
