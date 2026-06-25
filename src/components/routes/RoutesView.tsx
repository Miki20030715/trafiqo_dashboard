import { useMemo, useState } from 'react'
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
import { planTransit } from '@/lib/transit'
import { compareRouteOptions, type RouteComparison } from '@/lib/matrix'
import TransitOptions from './TransitOptions'
import RouteOptions from './RouteOptions'
import PlaceSearchInput, { type SelectedPlace } from './PlaceSearchInput'
import { useEffect } from 'react'
import { useTheme } from '@/lib/theme'

/** Convert a searched place into the RoutePoint the routing/transit/matrix libs expect. */
function toRoutePoint(p: SelectedPlace): RoutePoint {
  return { lat: p.lat, lon: p.lon, name: p.name, nameHu: p.name }
}

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

function RouteMapInner({ result, origin, dest }: { result: RouteResult; origin: RoutePoint; dest: RoutePoint }) {
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
  const { isDark } = useTheme()
  const basemap = isDark ? 'dark_all' : 'light_all'
  const lang = i18n.language
  const [mode, setMode] = useState<TravelMode>('car')
  const [origin, setOrigin] = useState<RoutePoint | null>(null)
  const [dest, setDest] = useState<RoutePoint | null>(null)
  const [result, setResult] = useState<RouteResult | null>(null)
  const [comparison, setComparison] = useState<RouteComparison | null>(null)
  const [loading, setLoading] = useState(false)

  const canCalculate = origin !== null && dest !== null

  async function handleCalculate() {
    if (!origin || !dest) return
    setLoading(true)
    setComparison(null)
    const r = await calculateRoute(origin, dest, mode)
    setResult(r)
    setLoading(false)
    // Compare alternative route options (Matrix Routing v2) in the background.
    compareRouteOptions(origin, dest, mode)
      .then(setComparison)
      .catch(() => setComparison(null))
  }

  const timeSavedMins = result ? estimateTimeSaved(result.durationSeconds, mode) : 0

  // Simulated transit itinerary, shown only in Transit mode. Memoised so it stays
  // stable while the same route is displayed.
  const transitPlan = useMemo(() => {
    if (!result || mode !== 'transit' || !origin || !dest) return null
    return planTransit(origin, dest, result.durationSeconds)
  }, [result, mode, origin, dest])

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:flex-row">
      {/* Left panel: controls */}
      <div className="flex w-full flex-col gap-5 lg:w-80 lg:shrink-0">
        <h1 className="text-xl font-bold text-ink">{t('routes.title')}</h1>

        {/* Travel mode */}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">{t('routes.travelMode')}</p>
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

        {/* Origin — free-text place search */}
        <PlaceSearchInput
          label={t('routes.origin')}
          pinColor="text-green-500"
          placeholder={t('routes.searchPlaceholder')}
          onSelect={(p) => {
            setOrigin(p ? toRoutePoint(p) : null)
            setResult(null)
            setComparison(null)
          }}
        />

        {/* Destination — free-text place search */}
        <PlaceSearchInput
          label={t('routes.destination')}
          pinColor="text-red-500"
          placeholder={t('routes.searchPlaceholder')}
          onSelect={(p) => {
            setDest(p ? toRoutePoint(p) : null)
            setResult(null)
            setComparison(null)
          }}
        />

        <button
          type="button"
          onClick={handleCalculate}
          disabled={!canCalculate || loading}
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

            {result.source === 'tomtom' ? (
              <div className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-green-50 px-2 py-1 text-xs font-semibold text-green-700">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
                </span>
                {t('routes.liveRoute')}
              </div>
            ) : (
              <div className="mt-2 flex flex-col gap-1">
                <div className="flex items-center gap-1.5 text-xs text-ink-muted">
                  <FlaskConical className="h-3 w-3" />
                  {t('routes.modelRoute')}
                </div>
                {/* When a live key exists but the TomTom call failed, show the exact reason. */}
                {result.error && (
                  <div className="rounded-lg bg-red-50 px-2.5 py-1.5 text-[0.7rem] leading-snug text-red-700">
                    <span className="font-semibold">
                      {t('routes.liveFailed')}
                      {result.error.status ? ` (HTTP ${result.error.status})` : ''}:
                    </span>{' '}
                    <span className="break-words">{result.error.message}</span>
                    <span className="mt-0.5 block text-red-600/80">
                      {result.error.network
                        ? t('routes.liveFailedNetworkHint')
                        : t('routes.liveFailedHttpHint')}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Route options comparison (Matrix Routing v2) */}
        {result && comparison && <RouteOptions comparison={comparison} />}

        {/* Simulated public-transport itinerary (Transit mode only) */}
        {transitPlan && <TransitOptions plan={transitPlan} />}
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
            key={basemap}
            url={`https://{s}.basemaps.cartocdn.com/${basemap}/{z}/{x}/{y}{r}.png`}
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
