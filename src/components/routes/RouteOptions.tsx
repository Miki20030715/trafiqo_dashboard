import { useTranslation } from 'react-i18next'
import { Zap, Ruler, Leaf, Star, GitCompareArrows, FlaskConical } from 'lucide-react'
import { formatDuration, formatDistance } from '@/lib/routing'
import type { RouteComparison } from '@/lib/matrix'

export function RouteOptions({ comparison }: { comparison: RouteComparison }) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const hu = lang.startsWith('hu')

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
      <div className="mb-1 flex items-center gap-2">
        <GitCompareArrows className="h-4 w-4 text-brand-600" />
        <h3 className="text-sm font-semibold text-ink">{t('routes.optionsTitle')}</h3>
      </div>
      <p className="mb-3 flex items-center gap-1.5 text-[0.7rem] text-ink-muted">
        {comparison.source === 'tomtom' ? (
          <>
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
            </span>
            {t('routes.optionsLive')}
          </>
        ) : (
          <>
            <FlaskConical className="h-3 w-3" />
            {t('routes.optionsModel')}
          </>
        )}
      </p>

      <ol className="flex flex-col gap-2">
        {comparison.options.map((o) => {
          const isBest = o.id === comparison.bestId
          const delayMin = Math.round(o.trafficDelaySeconds / 60)
          return (
            <li
              key={o.id}
              className={`rounded-xl border p-3 ${
                isBest ? 'border-brand-300 bg-brand-50' : 'border-slate-200 bg-slate-50'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">
                    {o.via === null
                      ? t('routes.optionDirect')
                      : t('routes.optionVia', { via: hu ? o.viaHu : o.via })}
                  </p>
                  <p className="mt-0.5 text-xs text-ink-muted">
                    {formatDuration(o.durationSeconds, lang)} · {formatDistance(o.distanceMeters, lang)}
                    {delayMin > 0 && (
                      <>
                        {' · '}
                        <span className="text-amber-600">
                          +{delayMin} {t('routes.minutes')} {t('routes.optionDelay')}
                        </span>
                      </>
                    )}
                  </p>
                </div>
                {isBest && (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-brand-500 px-1.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-wide text-white">
                    <Star className="h-3 w-3" />
                    {t('routes.optionBest')}
                  </span>
                )}
              </div>

              {/* Superlative badges */}
              <div className="mt-2 flex flex-wrap gap-1.5">
                {o.id === comparison.fastestId && (
                  <Tag color="text-green-700 bg-green-100" icon={<Zap className="h-3 w-3" />}>
                    {t('routes.optionFastest')}
                  </Tag>
                )}
                {o.id === comparison.shortestId && (
                  <Tag color="text-brand-700 bg-brand-100" icon={<Ruler className="h-3 w-3" />}>
                    {t('routes.optionShortest')}
                  </Tag>
                )}
                {o.id === comparison.leastCongestedId && (
                  <Tag color="text-green-700 bg-green-100" icon={<Leaf className="h-3 w-3" />}>
                    {t('routes.optionLeastCongested')}
                  </Tag>
                )}
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

function Tag({
  children,
  color,
  icon,
}: {
  children: React.ReactNode
  color: string
  icon: React.ReactNode
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[0.65rem] font-semibold ${color}`}
    >
      {icon}
      {children}
    </span>
  )
}

export default RouteOptions
