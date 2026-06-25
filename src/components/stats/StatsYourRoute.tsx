import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Route as RouteIcon, Loader2, MapPinned, Star, Zap, Ruler, Leaf, ArrowRight } from 'lucide-react'
import { compareRouteOptions, type RouteComparison } from '@/lib/matrix'
import { formatDuration, formatDistance, type TravelMode } from '@/lib/routing'
import { useRouteShare } from '@/lib/routeShare'
import RouteOptions from '@/components/routes/RouteOptions'

const MODE_LABEL: Record<TravelMode, string> = {
  car: 'routes.modeCar',
  taxi: 'routes.modeTaxi',
  transit: 'routes.modeTransit',
  bike: 'routes.modeBike',
  walk: 'routes.modeWalk',
}

export function StatsYourRoute() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const { route } = useRouteShare()
  const [cmp, setCmp] = useState<RouteComparison | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    if (!route) {
      setCmp(null)
      return
    }
    setLoading(true)
    setCmp(null)
    compareRouteOptions(route.origin, route.dest, route.mode).then((c) => {
      if (!cancelled) {
        setCmp(c)
        setLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [route])

  const best = cmp?.options.find((o) => o.id === cmp.bestId) ?? null
  const bestLabel = best
    ? best.via === null
      ? t('routes.optionDirect')
      : t('routes.optionVia', { via: best.via })
    : ''

  // Header (always shown)
  const header = (
    <div className="mb-1 flex flex-wrap items-center gap-2">
      <RouteIcon className="h-4 w-4 text-brand-600" />
      <h2 className="text-sm font-semibold text-ink">{t('stats.yourRouteTitle')}</h2>
      {cmp &&
        (cmp.source === 'tomtom' ? (
          <span className="inline-flex items-center gap-1 rounded-md bg-green-50 px-1.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-wide text-green-700 ring-1 ring-green-100">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
            </span>
            {t('stats.liveData')}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-1.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-wide text-amber-700 ring-1 ring-amber-100">
            {t('stats.modelBadge')}
          </span>
        ))}
    </div>
  )

  if (!route) {
    return (
      <section className="mb-8">
        {header}
        <div className="flex items-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-white/50 p-5 text-sm text-ink-muted">
          <MapPinned className="h-5 w-5 shrink-0 text-ink-muted" />
          <p>{t('stats.yourRoutePrompt')}</p>
        </div>
      </section>
    )
  }

  return (
    <section className="mb-8">
      {header}
      <p className="mb-3 flex flex-wrap items-center gap-1.5 text-xs text-ink-muted">
        <span className="font-medium text-ink-soft">{route.origin.name}</span>
        <ArrowRight className="h-3.5 w-3.5" />
        <span className="font-medium text-ink-soft">{route.dest.name}</span>
        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[0.65rem] font-semibold text-ink-soft">
          {t(MODE_LABEL[route.mode])}
        </span>
      </p>

      {loading && (
        <div className="flex items-center gap-2 rounded-2xl bg-white p-5 text-sm text-ink-muted shadow-card">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t('stats.comparing')}
        </div>
      )}

      {!loading && cmp && best && (
        <>
          {/* Best option + why */}
          <div className="mb-3 rounded-2xl border border-green-200 bg-green-50 p-4 shadow-card">
            <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-green-700">
              <Star className="h-4 w-4" />
              {t('stats.recommended')}
            </div>
            <p className="text-base font-bold text-ink">{bestLabel}</p>
            <p className="mt-0.5 text-sm text-ink-soft">
              {formatDuration(best.durationSeconds, lang)} · {formatDistance(best.distanceMeters, lang)}
              {best.trafficDelaySeconds > 0 && (
                <span className="text-amber-600">
                  {' · +'}
                  {Math.round(best.trafficDelaySeconds / 60)} {t('routes.minutes')} {t('routes.optionDelay')}
                </span>
              )}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {best.id === cmp.fastestId && (
                <Why icon={<Zap className="h-3 w-3" />}>{t('routes.optionFastest')}</Why>
              )}
              {best.id === cmp.shortestId && (
                <Why icon={<Ruler className="h-3 w-3" />}>{t('routes.optionShortest')}</Why>
              )}
              {best.id === cmp.leastCongestedId && (
                <Why icon={<Leaf className="h-3 w-3" />}>{t('routes.optionLeastCongested')}</Why>
              )}
            </div>
          </div>

          {/* Full comparison (reuses the route-planning component) */}
          <RouteOptions comparison={cmp} />
        </>
      )}
    </section>
  )
}

function Why({ children, icon }: { children: React.ReactNode; icon: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-white px-1.5 py-0.5 text-[0.65rem] font-semibold text-green-700 ring-1 ring-green-200">
      {icon}
      {children}
    </span>
  )
}

export default StatsYourRoute
