import { useEffect } from 'react'
import { MapContainer, TileLayer, Polyline, Tooltip, useMap } from 'react-leaflet'
import {
  BUDAPEST_CENTER,
  DEFAULT_ZOOM,
  MIN_ZOOM,
  MAX_ZOOM,
  MODEL_CORRIDORS,
  CONGESTION_COLORS,
} from './mapConfig'
import { hasTomTom, tomtomTrafficFlowUrl } from '@/lib/tomtom'
import { useTheme } from '@/lib/theme'
import SimulationLayer from './SimulationLayer'

/** Recomputes map size when its container changes (e.g. fullscreen toggle). */
function MapResizer({ trigger }: { trigger: unknown }) {
  const map = useMap()
  useEffect(() => {
    const id = window.setTimeout(() => map.invalidateSize(), 60)
    return () => window.clearTimeout(id)
  }, [trigger, map])
  return null
}

interface BudapestMapProps {
  /** Show the live TomTom traffic overlay (only relevant when a key is present). */
  showTraffic: boolean
  /** Any value that changes when the container resizes, to trigger invalidateSize. */
  resizeTrigger: unknown
  /** Show synthetic simulation agents (pedestrians + animals). */
  showAgents?: boolean
}

export function BudapestMap({ showTraffic, resizeTrigger, showAgents = false }: BudapestMapProps) {
  const live = hasTomTom()
  const { isDark } = useTheme()
  const basemap = isDark ? 'dark_all' : 'light_all'

  return (
    <MapContainer
      center={BUDAPEST_CENTER}
      zoom={DEFAULT_ZOOM}
      minZoom={MIN_ZOOM}
      maxZoom={MAX_ZOOM}
      scrollWheelZoom
      className="h-full w-full bg-slate-100"
      zoomControl
    >
      <MapResizer trigger={resizeTrigger} />

      {/* Clean basemap (no key required) — light or dark to match the theme */}
      <TileLayer
        key={basemap}
        url={`https://{s}.basemaps.cartocdn.com/${basemap}/{z}/{x}/{y}{r}.png`}
        subdomains="abcd"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
        maxZoom={MAX_ZOOM}
      />

      {/* Real TomTom traffic flow — only when a key is present and the layer is on */}
      {live && showTraffic && (
        <TileLayer
          url={tomtomTrafficFlowUrl('relative')}
          attribution='Traffic &copy; <a href="https://www.tomtom.com">TomTom</a>'
          opacity={0.9}
          maxZoom={MAX_ZOOM}
        />
      )}

      {/* Behavioural model congestion layer — only when no live key is available */}
      {!live &&
        MODEL_CORRIDORS.map((c) => (
          <Polyline
            key={c.id}
            positions={c.path}
            pathOptions={{ color: CONGESTION_COLORS[c.level], weight: 6, opacity: 0.85 }}
          >
            <Tooltip sticky>{c.name}</Tooltip>
          </Polyline>
        ))}

      {/* Synthetic simulation agents — fixed pixel size, won't shrink on zoom */}
      {showAgents && <SimulationLayer />}
    </MapContainer>
  )
}

export default BudapestMap
