import type { LatLngExpression, LatLngBoundsExpression } from 'leaflet'

/** Budapest map defaults. */
export const BUDAPEST_CENTER: LatLngExpression = [47.4979, 19.0402]
export const DEFAULT_ZOOM = 12
export const MIN_ZOOM = 10
export const MAX_ZOOM = 18

/** Loose bounds around greater Budapest to keep panning sensible. */
export const BUDAPEST_BOUNDS: LatLngBoundsExpression = [
  [47.34, 18.85],
  [47.65, 19.33],
]

export type CongestionLevel = 'free' | 'moderate' | 'heavy'

export interface ModelCorridor {
  id: string
  name: string
  level: CongestionLevel
  path: LatLngExpression[]
}

/**
 * Behavioural-model congestion corridors (synthetic, model-generated geometry over
 * real Budapest arteries). Shown only when no live TomTom key is present. This is the
 * model layer — NOT measured traffic. Labelled "Behavioural model / Viselkedési modell".
 */
export const MODEL_CORRIDORS: ModelCorridor[] = [
  {
    id: 'nagykorut',
    name: 'Nagykörút',
    level: 'heavy',
    path: [
      [47.4769, 19.0614],
      [47.4858, 19.0686],
      [47.4986, 19.0671],
      [47.5072, 19.0556],
      [47.5118, 19.0446],
    ],
  },
  {
    id: 'hungaria',
    name: 'Hungária körút',
    level: 'heavy',
    path: [
      [47.4699, 19.0889],
      [47.4862, 19.0974],
      [47.5039, 19.0967],
      [47.5193, 19.0861],
    ],
  },
  {
    id: 'vaci',
    name: 'Váci út',
    level: 'moderate',
    path: [
      [47.5118, 19.0566],
      [47.5292, 19.0633],
      [47.5471, 19.0705],
      [47.5616, 19.0762],
    ],
  },
  {
    id: 'ulloi',
    name: 'Üllői út',
    level: 'moderate',
    path: [
      [47.4856, 19.0686],
      [47.4731, 19.0894],
      [47.4622, 19.1083],
      [47.4538, 19.1241],
    ],
  },
  {
    id: 'andrassy',
    name: 'Andrássy út',
    level: 'free',
    path: [
      [47.4979, 19.0547],
      [47.5052, 19.0648],
      [47.5118, 19.0772],
    ],
  },
  {
    id: 'm1m7-inflow',
    name: 'M1–M7 bevezető (Budaörsi út)',
    level: 'heavy',
    path: [
      [47.4566, 18.9889],
      [47.4651, 19.0083],
      [47.4729, 19.0227],
      [47.4806, 19.0361],
    ],
  },
  {
    id: 'arpad-bridge',
    name: 'Árpád híd',
    level: 'moderate',
    path: [
      [47.5339, 19.0461],
      [47.5347, 19.0561],
      [47.5341, 19.0661],
    ],
  },
]

export const CONGESTION_COLORS: Record<CongestionLevel, string> = {
  free: '#2DA84A', // green
  moderate: '#F8B500', // amber
  heavy: '#EA4335', // red
}
