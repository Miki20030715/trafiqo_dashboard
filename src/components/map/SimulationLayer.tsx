import { useEffect, useRef, useState } from 'react'
import { Marker, Tooltip, Polyline } from 'react-leaflet'
import L from 'leaflet'
import { useTranslation } from 'react-i18next'
import {
  AGENT_TYPES,
  createAgents,
  stepAgents,
  agentTypeLabelKey,
  type Agent,
  type AgentTypeId,
} from '@/lib/simEngine'
import { EDGES, getNode } from './roadNetwork'

/** Fixed-size marker per agent type (won't shrink on zoom). */
const ICONS: Record<AgentTypeId, L.DivIcon> = Object.fromEntries(
  AGENT_TYPES.map((t) => [
    t.id,
    L.divIcon({
      html: `<div style="
        width:26px;height:26px;border-radius:50%;
        background:${t.color};
        border:2.5px solid #fff;
        box-shadow:0 2px 6px rgba(0,0,0,0.28);
        display:flex;align-items:center;justify-content:center;
        font-size:13px;line-height:1;
      ">${t.emoji}</div>`,
      className: '',
      iconSize: [26, 26],
      iconAnchor: [13, 13],
    }),
  ]),
) as Record<AgentTypeId, L.DivIcon>

const TICK_MS = 250

interface SimulationLayerProps {
  /** Draw the underlying road graph faintly so movement is clearly on-road. */
  showNetwork?: boolean
}

export function SimulationLayer({ showNetwork = true }: SimulationLayerProps) {
  const { t } = useTranslation()
  const agentsRef = useRef<Agent[]>(createAgents(2))
  const [, force] = useState(0)
  const lastRef = useRef(Date.now())
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    function tick() {
      const now = Date.now()
      const dt = Math.min((now - lastRef.current) / 1000, 0.5)
      lastRef.current = now
      stepAgents(agentsRef.current, dt)
      force((n) => n + 1)
      timerRef.current = window.setTimeout(tick, TICK_MS)
    }
    lastRef.current = Date.now()
    timerRef.current = window.setTimeout(tick, TICK_MS)
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current)
    }
  }, [])

  const agents = agentsRef.current

  return (
    <>
      {/* Faint road network the agents are constrained to. */}
      {showNetwork &&
        EDGES.map((e, i) => {
          const a = getNode(e.a)
          const b = getNode(e.b)
          return (
            <Polyline
              key={`edge-${i}`}
              positions={[
                [a.lat, a.lon],
                [b.lat, b.lon],
              ]}
              pathOptions={{
                color: e.bridge ? '#1B72E8' : '#94A3B8',
                weight: e.bridge ? 3 : 2,
                opacity: e.bridge ? 0.55 : 0.35,
                dashArray: e.bridge ? undefined : '4 5',
              }}
            />
          )
        })}

      {agents.map((a) => (
        <Marker key={a.id} position={[a.lat, a.lon]} icon={ICONS[a.type]} zIndexOffset={1000}>
          <Tooltip direction="top" offset={[0, -12]}>
            <span className="text-xs">
              <strong>{t(agentTypeLabelKey(a.type))}</strong>
              {' · '}
              {Math.round(a.speedKmh)} km/h
              <br />
              <span className="text-ink-muted">{t('simulation.onRoad', { road: a.roadHu })}</span>
              <br />
              <em className="text-[0.65rem]">{t('simulation.syntheticNote')}</em>
            </span>
          </Tooltip>
        </Marker>
      ))}
    </>
  )
}

export default SimulationLayer
