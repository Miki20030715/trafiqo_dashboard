/**
 * Simulated Budapest public-transport itineraries.
 *
 * These are ILLUSTRATIVE, model-generated transit options — real Budapest line
 * numbers/colours are used for realism, but the plan (which lines, how many stops,
 * timings, transfers) is synthetic and NOT a real BKK timetable or live schedule.
 *
 * Generation is deterministic for a given origin→destination, so the same trip always
 * yields the same itinerary (stable across re-renders).
 */
import type { RoutePoint } from './routing'

export type TransitKind = 'metro' | 'tram' | 'bus' | 'trolley'
export type LegKind = TransitKind | 'walk' | 'transfer'

export interface TransitLeg {
  kind: LegKind
  /** Line label for ride legs, e.g. 'M2', '4/6', '7'. */
  line?: string
  /** Badge background / text colours for ride legs. */
  bg?: string
  text?: string
  /** Interchange name for transfer legs. */
  hub?: string
  /** Which end a walk leg connects ('stop' = to first stop, 'dest' = to destination). */
  phase?: 'toStop' | 'toDest'
  minutes: number
  stops?: number
}

export interface TransitPlan {
  legs: TransitLeg[]
  totalMinutes: number
  transfers: number
}

interface LineDef {
  line: string
  kind: TransitKind
  bg: string
  text: string
}

/** Real Budapest lines with their identity colours (used illustratively). */
const LINES: LineDef[] = [
  { line: 'M1', kind: 'metro', bg: '#FDC500', text: '#1A1B25' },
  { line: 'M2', kind: 'metro', bg: '#E41F18', text: '#FFFFFF' },
  { line: 'M3', kind: 'metro', bg: '#0066B3', text: '#FFFFFF' },
  { line: 'M4', kind: 'metro', bg: '#009A49', text: '#FFFFFF' },
  { line: '4/6', kind: 'tram', bg: '#FFD800', text: '#1A1B25' },
  { line: '2', kind: 'tram', bg: '#FFD800', text: '#1A1B25' },
  { line: '47/49', kind: 'tram', bg: '#FFD800', text: '#1A1B25' },
  { line: '1', kind: 'tram', bg: '#FFD800', text: '#1A1B25' },
  { line: '7', kind: 'bus', bg: '#0046AD', text: '#FFFFFF' },
  { line: '9', kind: 'bus', bg: '#0046AD', text: '#FFFFFF' },
  { line: '105', kind: 'bus', bg: '#0046AD', text: '#FFFFFF' },
  { line: '70', kind: 'trolley', bg: '#E41F18', text: '#FFFFFF' },
  { line: '72', kind: 'trolley', bg: '#E41F18', text: '#FFFFFF' },
]

/** Major interchange hubs used for transfers. */
const HUBS = [
  'Deák Ferenc tér',
  'Astoria',
  'Kálvin tér',
  'Blaha Lujza tér',
  'Keleti pályaudvar',
  'Nyugati pályaudvar',
  'Móricz Zsigmond körtér',
  'Széll Kálmán tér',
]

function hashStr(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** Deterministic 0..1 PRNG seeded from an integer. */
function mulberry32(seed: number): () => number {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function rideLeg(def: LineDef, minutes: number): TransitLeg {
  return {
    kind: def.kind,
    line: def.line,
    bg: def.bg,
    text: def.text,
    minutes,
    stops: Math.max(2, Math.round(minutes / 1.6)),
  }
}

/**
 * Build a simulated transit itinerary roughly matching `totalSeconds` of travel.
 */
export function planTransit(
  origin: RoutePoint,
  destination: RoutePoint,
  totalSeconds: number,
): TransitPlan {
  const rng = mulberry32(hashStr(`${origin.name}=>${destination.name}`))
  const pick = <T>(arr: T[]): T => arr[Math.floor(rng() * arr.length)]

  const totalMin = Math.max(8, Math.round(totalSeconds / 60))
  const walk1 = 2 + Math.floor(rng() * 4) // 2–5 min
  const walk2 = 2 + Math.floor(rng() * 3) // 2–4 min
  const rideBudget = Math.max(6, totalMin - walk1 - walk2)
  const withTransfer = rideBudget >= 16 && rng() < 0.6

  const legs: TransitLeg[] = [{ kind: 'walk', phase: 'toStop', minutes: walk1 }]

  const line1 = pick(LINES)
  if (withTransfer) {
    const transferWait = 2 + Math.floor(rng() * 3) // 2–4 min
    const ride1 = Math.max(4, Math.round(rideBudget * (0.45 + rng() * 0.1)))
    const ride2 = Math.max(4, rideBudget - ride1 - transferWait)
    let line2 = pick(LINES)
    while (line2.line === line1.line) line2 = pick(LINES)
    const hub = pick(HUBS)

    legs.push(rideLeg(line1, ride1))
    legs.push({ kind: 'transfer', hub, minutes: transferWait })
    legs.push(rideLeg(line2, ride2))
  } else {
    legs.push(rideLeg(line1, rideBudget))
  }

  legs.push({ kind: 'walk', phase: 'toDest', minutes: walk2 })

  const totalMinutes = legs.reduce((sum, l) => sum + l.minutes, 0)
  const transfers = withTransfer ? 1 : 0
  return { legs, totalMinutes, transfers }
}
