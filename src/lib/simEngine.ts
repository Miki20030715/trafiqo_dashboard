/**
 * Agent simulation engine (model — not measured data).
 *
 * Agents are the eight traveller types from "Who are you?". Each has a clearly
 * different base speed. They take random A→B journeys over the Budapest road graph
 * (see roadNetwork.ts), so they move ALONG streets only and cross the river only on
 * bridges. They slow down in crowded areas (density), and ~50% change their mind
 * mid-journey and reroute (often turning back).
 *
 * The engine is framework-agnostic so it can drive the live map (SimulationLayer)
 * and also be run headlessly to collect per-road statistics (Step 3).
 */
import {
  getNode,
  haversineMeters,
  edgeBetween,
  shortestPath,
  randomNodeId,
} from '@/components/map/roadNetwork'

export type AgentTypeId =
  | 'privateDriver'
  | 'taxiDriver'
  | 'transitRider'
  | 'cyclist'
  | 'pedestrian'
  | 'police'
  | 'emergency'
  | 'logistics'

export interface AgentType {
  id: AgentTypeId
  /** Free-flow base speed in km/h (clearly different per type). */
  baseKmh: number
  emoji: string
  /** Marker fill colour. */
  color: string
  /** How strongly congestion slows this type (0 = immune). Emergency/police push through. */
  congestionSensitivity: number
}

/** Eight traveller types — pedestrian slowest, emergency fastest. */
export const AGENT_TYPES: AgentType[] = [
  { id: 'pedestrian', baseKmh: 5, emoji: '🚶', color: '#64748B', congestionSensitivity: 0.4 },
  { id: 'cyclist', baseKmh: 16, emoji: '🚴', color: '#16A34A', congestionSensitivity: 0.5 },
  { id: 'transitRider', baseKmh: 24, emoji: '🚌', color: '#0F9D58', congestionSensitivity: 0.7 },
  { id: 'logistics', baseKmh: 30, emoji: '🚚', color: '#EA7B0B', congestionSensitivity: 1.1 },
  { id: 'taxiDriver', baseKmh: 38, emoji: '🚕', color: '#F8B500', congestionSensitivity: 1.0 },
  { id: 'privateDriver', baseKmh: 42, emoji: '🚗', color: '#1B72E8', congestionSensitivity: 1.0 },
  { id: 'police', baseKmh: 50, emoji: '🚓', color: '#1D4ED8', congestionSensitivity: 0.35 },
  { id: 'emergency', baseKmh: 58, emoji: '🚒', color: '#EA4335', congestionSensitivity: 0.25 },
]

const TYPE_MAP: Record<AgentTypeId, AgentType> = Object.fromEntries(
  AGENT_TYPES.map((t) => [t.id, t]),
) as Record<AgentTypeId, AgentType>

export interface Agent {
  id: string
  type: AgentTypeId
  lat: number
  lon: number
  /** Current effective speed in km/h (after density slowdown). */
  speedKmh: number
  /** Current road name the agent is travelling on. */
  road: string
  roadHu: string
  // — internal journey state —
  route: string[] // node ids, origin → destination
  seg: number // index of the node we departed from (heading to route[seg+1])
  distOnSeg: number // metres travelled along the current segment
  segLen: number // length of the current segment in metres
  origin: string // first node of the original journey (for "turn back")
  willReroute: boolean
  rerouteAt: number // fraction of the journey (0..1) at which the agent changes its mind
  rerouted: boolean
  traveled: number // metres travelled on the current route
  total: number // total length of the current route in metres
  pendingRoute: string[] | null // reroute applied at the next intersection
}

function routeLength(route: string[]): number {
  let total = 0
  for (let i = 0; i < route.length - 1; i++) {
    const a = getNode(route[i])
    const b = getNode(route[i + 1])
    total += haversineMeters(a.lat, a.lon, b.lat, b.lon)
  }
  return total
}

function segLength(route: string[], seg: number): number {
  const a = getNode(route[seg])
  const b = getNode(route[seg + 1])
  return haversineMeters(a.lat, a.lon, b.lat, b.lon)
}

function roadFor(route: string[], seg: number): { road: string; roadHu: string } {
  const e = edgeBetween(route[seg], route[seg + 1])
  return e ? { road: e.road, roadHu: e.roadHu } : { road: '—', roadHu: '—' }
}

/** Build a fresh random journey starting from `start` (defaults to a random node). */
function newJourney(start?: string): { route: string[]; total: number } {
  for (let attempt = 0; attempt < 12; attempt++) {
    const from = start ?? randomNodeId()
    const to = randomNodeId(from)
    const route = shortestPath(from, to)
    if (route && route.length >= 2) return { route, total: routeLength(route) }
  }
  // Fallback: a guaranteed 2-node hop.
  const from = start ?? randomNodeId()
  const to = randomNodeId(from)
  const route = shortestPath(from, to) ?? [from, to]
  return { route, total: routeLength(route) }
}

function spawnAgent(type: AgentTypeId, idx: number): Agent {
  const { route, total } = newJourney()
  const node = getNode(route[0])
  const { road, roadHu } = roadFor(route, 0)
  return {
    id: `${type}-${idx}`,
    type,
    lat: node.lat,
    lon: node.lon,
    speedKmh: TYPE_MAP[type].baseKmh,
    road,
    roadHu,
    route,
    seg: 0,
    distOnSeg: 0,
    segLen: segLength(route, 0),
    origin: route[0],
    willReroute: Math.random() < 0.5,
    rerouteAt: 0.3 + Math.random() * 0.4, // change mind somewhere in the middle
    rerouted: false,
    traveled: 0,
    total,
    pendingRoute: null,
  }
}

/** Create `perType` agents of every type (default 2 → 16 agents). */
export function createAgents(perType = 2): Agent[] {
  const agents: Agent[] = []
  for (const t of AGENT_TYPES) {
    for (let i = 0; i < perType; i++) agents.push(spawnAgent(t.id, i))
  }
  return agents
}

/** Density radius (metres) within which neighbours slow an agent down. */
const DENSITY_RADIUS = 160

function densityFactor(agent: Agent, all: Agent[]): number {
  let neighbours = 0
  for (const other of all) {
    if (other === agent) continue
    const d = haversineMeters(agent.lat, agent.lon, other.lat, other.lon)
    if (d < DENSITY_RADIUS) neighbours++
  }
  const sens = TYPE_MAP[agent.type].congestionSensitivity
  // Each nearby agent shaves ~10% (scaled by sensitivity); floor keeps things moving.
  const factor = 1 - 0.1 * sens * neighbours
  return Math.max(0.25, Math.min(1, factor))
}

function assignRoute(agent: Agent, route: string[]) {
  agent.route = route
  agent.seg = 0
  agent.distOnSeg = 0
  agent.segLen = segLength(route, 0)
  agent.traveled = 0
  agent.total = routeLength(route)
  const { road, roadHu } = roadFor(route, 0)
  agent.road = road
  agent.roadHu = roadHu
}

/**
 * Advance every agent by `dt` seconds. Mutates the agents in place and returns the
 * same array (handy for React state via a fresh array copy).
 */
export function stepAgents(agents: Agent[], dt: number): Agent[] {
  for (const agent of agents) {
    const type = TYPE_MAP[agent.type]
    const factor = densityFactor(agent, agents)
    const effectiveKmh = type.baseKmh * factor
    agent.speedKmh = effectiveKmh

    let move = (effectiveKmh / 3.6) * dt // metres this tick
    let guard = 0
    while (move > 0 && guard++ < 50) {
      const remainOnSeg = agent.segLen - agent.distOnSeg
      if (move < remainOnSeg) {
        agent.distOnSeg += move
        agent.traveled += move
        move = 0
      } else {
        // Reached the end of the current segment (an intersection).
        move -= remainOnSeg
        agent.traveled += remainOnSeg
        agent.seg += 1
        agent.distOnSeg = 0

        // Apply a pending reroute decided earlier.
        if (agent.pendingRoute) {
          assignRoute(agent, agent.pendingRoute)
          agent.pendingRoute = null
          continue
        }

        // Reached the destination → start a brand-new journey from here.
        if (agent.seg >= agent.route.length - 1) {
          const { route, total } = newJourney(agent.route[agent.route.length - 1])
          agent.origin = route[0]
          agent.willReroute = Math.random() < 0.5
          agent.rerouteAt = 0.3 + Math.random() * 0.4
          agent.rerouted = false
          assignRoute(agent, route)
          agent.total = total
          continue
        }

        agent.segLen = segLength(agent.route, agent.seg)
        const { road, roadHu } = roadFor(agent.route, agent.seg)
        agent.road = road
        agent.roadHu = roadHu

        // Decide whether to change our mind at this intersection (~50% of agents do).
        if (
          agent.willReroute &&
          !agent.rerouted &&
          agent.total > 0 &&
          agent.traveled / agent.total >= agent.rerouteAt
        ) {
          agent.rerouted = true
          const here = agent.route[agent.seg]
          // Half the rerouters turn back toward where they started; the rest pick a new goal.
          const dest = Math.random() < 0.5 ? agent.origin : randomNodeId(here)
          const newRoute = shortestPath(here, dest)
          if (newRoute && newRoute.length >= 2) agent.pendingRoute = newRoute
        }
      }
    }

    // Interpolate the marker position along the current segment.
    const a = getNode(agent.route[agent.seg])
    const b = getNode(agent.route[Math.min(agent.seg + 1, agent.route.length - 1)])
    const f = agent.segLen > 0 ? agent.distOnSeg / agent.segLen : 0
    agent.lat = a.lat + (b.lat - a.lat) * f
    agent.lon = a.lon + (b.lon - a.lon) * f
  }
  return agents
}

export function agentTypeLabelKey(type: AgentTypeId): string {
  return `roles.${type}`
}
