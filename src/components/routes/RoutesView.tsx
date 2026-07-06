import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { MapContainer, TileLayer, Polyline, Marker, useMap } from 'react-leaflet'
import L from 'leaflet'
import { Car, Bus, Bike, Footprints, Clock, MapPin, Zap, FlaskConical } from 'lucide-react'
import {
  type TravelMode,
  type RoutePoint,
  type RouteResult,
  calculateRoute,
  formatDuration,
  formatDistance,
  estimateTimeSaved,
} from '@/lib/routing'
import PlaceSearchInput, { type SelectedPlace } from './PlaceSearchInput'

const MODE_CONFIG: { mode: TravelMode; icon: typeof Car; labelKey: string }[] = [
  { mode: 'car', icon: Car, labelKey: 'routes.modeCar' },
  { mode: 'taxi', icon: Car, labelKey: 'routes.modeTaxi' },
  { mode: 'transit', icon: Bus, labelKey: 'routes.modeTransit' },
  { mode: 'bike', icon: Bike, labelKey: 'routes.modeBike' },
  { mode: 'walk', icon: Footprints, labelKey: 'routes.modeWalk' },
]

function createPinIcon(color: string) {
  return L.divIcon({
    html: `<div style="width:14px;height:14px;border-radius:50%;background:${color};border:3px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.3)"></div>`,
    className: '',
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  })
}

function RouteMapInner({ result, origin, dest }: { result: RouteResult; origin: { lat: number; lon: number }; dest: { lat: number; lon: number } }) {
  const map = useMap()
  useEffect(() => {
    if (result.points.length > 0) {
      map.fitBounds(result.points as [number, number][], { padding: [40, 40] })
    }
  }, [result, map])
  return (
    <>
      <Polyline positions={result.points} pathOptions={{ color: '#1B72E8', weight: 5, opacity: 0.85 }} />
      <Marker position={[origin.lat, origin.lon]} icon={createPinIcon('#2DA84A')} />
      <Marker position={[dest.lat, dest.lon]} icon={createPinIcon('#EA4335')} />
    </>
  )
}

export function RoutesView() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const [mode, setMode] = useState<TravelMode>('car')
  const [origin, setOrigin] = useState<SelectedPlace | null>(null)
  const [dest, setDest] = useState<SelectedPlace | null>(null)
  const [result, setResult] = useState<RouteResult | null>(null)
  const [loading, setLoading] = useState(false)

  /** A chosen place → the RoutePoint shape the routing lib expects. */
  function toRoutePoint(p: SelectedPlace): RoutePoint {
    return { lat: p.lat, lon: p.lon, name: p.name, nameHu: p.name }
  }

  async function handleCalculate() {
    if (!origin || !dest) return
    setLoading(true)
    const r = await calculateRoute(toRoutePoint(origin), toRoutePoint(dest), mode)
    setResult(r)
    setLoading(false)
  }

  const timeSavedMins = result ? estimateTimeSaved(result.durationSeconds, mode) : 0

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:flex-row">
      {/* Left panel: controls */}
      <div className="flex w-full flex-col gap-5 lg:w-80 lg:shrink-0">
        <h1 className="text-xl font-bold text-ink">{t('routes.title')}</h1>

        {/* Travel mode */}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">{t('routes.modeCar')}</p>
          <div className="flex flex-wrap gap-2">
            {MODE_CONFIG.map(({ mode: m, icon: Icon, labelKey }) => (
              <button
                key={m}
                type="button"
                onClick={() => { setMode(m); setResult(null) }}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition ${
                  mode === m
                    ? 'bg-brand-500 text-white'
                    : 'bg-slate-100 text-ink-soft hover:bg-slate-200'
                }`}
              >
                <Icon className="h-4 w-4" />
                {t(labelKey)}
              </button>
            ))}
          </div>
        </div>

        {/* Origin — free-text search (TomTom Search API) */}
        <PlaceSearchInput
          label={t('routes.origin')}
          pinColor="text-green-500"
          placeholder={t('routes.searchPlaceholder')}
          onSelect={(p) => { setOrigin(p); setResult(null) }}
        />

        {/* Destination — free-text search (TomTom Search API) */}
        <PlaceSearchInput
          label={t('routes.destination')}
          pinColor="text-red-500"
          placeholder={t('routes.searchPlaceholder')}
          onSelect={(p) => { setDest(p); setResult(null) }}
        />

        <button
          type="button"
          onClick={handleCalculate}
          disabled={!origin || !dest || loading}
          className="rounded-xl bg-brand-500 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-40"
        >
          {loading ? t('routes.calculating') : t('routes.calculate')}
        </button>

        {/* Result summary */}
        {result && (
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-medium text-ink-muted">
                  <Clock className="mr-1 inline h-3.5 w-3.5" />
                  {t('routes.duration')}
                </span>
                <span className="text-lg font-bold text-ink">
                  {formatDuration(result.durationSeconds, lang)}
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-medium text-ink-muted">
                  <MapPin className="mr-1 inline h-3.5 w-3.5" />
                  {t('routes.distance')}
                </span>
                <span className="text-lg font-bold text-ink">
                  {formatDistance(result.distanceMeters, lang)}
                </span>
              </div>
            </div>

            <div className="mt-3 rounded-xl bg-brand-50 px-3 py-2.5">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-brand-500" />
                <span className="text-xs font-semibold text-brand-700">{t('routes.modelImpact')}</span>
              </div>
              <p className="mt-1 text-sm text-brand-600">
                {t('routes.timeSavedLabel')}: <strong>~{timeSavedMins} {t('routes.minutes')}</strong>
              </p>
            </div>

            {result.isDemo && (
              <div className="mt-2 flex items-center gap-1.5 text-xs text-ink-muted">
                <FlaskConical className="h-3 w-3" />
                {t('routes.noKey')}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right panel: map */}
      <div className="relative min-h-[400px] flex-1 overflow-hidden rounded-2xl shadow-card lg:min-h-0">
        {!result && (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-white/70 backdrop-blur-sm">
            <p className="text-sm text-ink-muted">{t('routes.noRoute')}</p>
          </div>
        )}
        <MapContainer
          center={[47.4979, 19.0402]}
          zoom={12}
          className="h-full w-full bg-slate-100"
          zoomControl
          style={{ minHeight: 400 }}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            subdomains="abcd"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          />
          {result && origin && dest && (
            <RouteMapInner result={result} origin={origin} dest={dest} />
          )}
        </MapContainer>
      </div>
    </div>
  )
}

export default RoutesView
