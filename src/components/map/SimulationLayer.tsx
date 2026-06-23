import { useEffect, useState, useRef } from 'react'
import { Marker, Tooltip } from 'react-leaflet'
import L from 'leaflet'
import { useTranslation } from 'react-i18next'

interface Agent {
  id: string
  type: 'pedestrian' | 'animal'
  lat: number
  lon: number
  dlat: number
  dlon: number
}

const BOUNDS = { minLat: 47.47, maxLat: 47.55, minLon: 19.00, maxLon: 19.12 }

function randomInBounds() {
  return {
    lat: BOUNDS.minLat + Math.random() * (BOUNDS.maxLat - BOUNDS.minLat),
    lon: BOUNDS.minLon + Math.random() * (BOUNDS.maxLon - BOUNDS.minLon),
  }
}

function createAgentIcon(type: 'pedestrian' | 'animal') {
  const color = type === 'pedestrian' ? '#1B72E8' : '#F8B500'
  const emoji = type === 'pedestrian' ? '🚶' : '🐦'
  return L.divIcon({
    html: `<div style="
      width:28px;height:28px;border-radius:50%;
      background:${color};
      border:2.5px solid #fff;
      box-shadow:0 2px 6px rgba(0,0,0,0.25);
      display:flex;align-items:center;justify-content:center;
      font-size:14px;line-height:1;
    ">${emoji}</div>`,
    className: '',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  })
}

function initAgents(): Agent[] {
  const agents: Agent[] = []
  for (let i = 0; i < 10; i++) {
    const pos = randomInBounds()
    agents.push({
      id: `ped-${i}`,
      type: 'pedestrian',
      ...pos,
      dlat: (Math.random() - 0.5) * 0.0004,
      dlon: (Math.random() - 0.5) * 0.0006,
    })
  }
  for (let i = 0; i < 6; i++) {
    const pos = randomInBounds()
    agents.push({
      id: `ani-${i}`,
      type: 'animal',
      ...pos,
      dlat: (Math.random() - 0.5) * 0.0006,
      dlon: (Math.random() - 0.5) * 0.0008,
    })
  }
  return agents
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v))
}

const PEDESTRIAN_ICON = createAgentIcon('pedestrian')
const ANIMAL_ICON = createAgentIcon('animal')

export function SimulationLayer() {
  const { t } = useTranslation()
  const [agents, setAgents] = useState<Agent[]>(initAgents)
  const rafRef = useRef<number | null>(null)
  const lastTickRef = useRef(Date.now())

  useEffect(() => {
    function tick() {
      const now = Date.now()
      const dt = Math.min(now - lastTickRef.current, 200) / 1000
      lastTickRef.current = now

      setAgents((prev) =>
        prev.map((a) => {
          let lat = a.lat + a.dlat * dt * 30
          let lon = a.lon + a.dlon * dt * 30
          let dlat = a.dlat
          let dlon = a.dlon

          if (lat < BOUNDS.minLat || lat > BOUNDS.maxLat) { dlat = -dlat; lat = clamp(lat, BOUNDS.minLat, BOUNDS.maxLat) }
          if (lon < BOUNDS.minLon || lon > BOUNDS.maxLon) { dlon = -dlon; lon = clamp(lon, BOUNDS.minLon, BOUNDS.maxLon) }

          if (Math.random() < 0.01) {
            dlat = (Math.random() - 0.5) * 0.0005
            dlon = (Math.random() - 0.5) * 0.0007
          }

          return { ...a, lat, lon, dlat, dlon }
        })
      )

      rafRef.current = window.setTimeout(tick, 1000)
    }

    rafRef.current = window.setTimeout(tick, 1000)
    return () => { if (rafRef.current) window.clearTimeout(rafRef.current) }
  }, [])

  return (
    <>
      {agents.map((a) => (
        <Marker
          key={a.id}
          position={[a.lat, a.lon]}
          icon={a.type === 'pedestrian' ? PEDESTRIAN_ICON : ANIMAL_ICON}
        >
          <Tooltip>
            <span className="text-xs">
              {a.type === 'pedestrian' ? t('simulation.pedestrianLabel') : t('simulation.animalLabel')}
              {' · '}
              <em>{t('simulation.syntheticNote')}</em>
            </span>
          </Tooltip>
        </Marker>
      ))}
    </>
  )
}

export default SimulationLayer
