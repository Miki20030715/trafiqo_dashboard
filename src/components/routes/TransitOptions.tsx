import { useTranslation } from 'react-i18next'
import { Bus, Footprints, TrainFront, Repeat, FlaskConical, Clock } from 'lucide-react'
import type { TransitPlan, LegKind } from '@/lib/transit'

const KIND_LABEL: Record<string, string> = {
  metro: 'routes.kindMetro',
  tram: 'routes.kindTram',
  bus: 'routes.kindBus',
  trolley: 'routes.kindTrolley',
}

function LineBadge({ line, bg, text }: { line: string; bg?: string; text?: string }) {
  return (
    <span
      className="inline-flex min-w-[1.6rem] items-center justify-center rounded-md px-1.5 py-0.5 text-xs font-bold leading-none"
      style={{ background: bg, color: text }}
    >
      {line}
    </span>
  )
}

export function TransitOptions({ plan }: { plan: TransitPlan }) {
  const { t } = useTranslation()

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-card">
      <div className="mb-1 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Bus className="h-4 w-4 text-brand-600" />
          <h3 className="text-sm font-semibold text-ink">{t('routes.transitTitle')}</h3>
        </div>
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-ink-soft">
          <Clock className="h-3.5 w-3.5" />
          {plan.totalMinutes} {t('routes.minutes')}
        </span>
      </div>

      {/* Model-based disclaimer */}
      <div className="mb-3 flex items-start gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1.5 text-[0.7rem] leading-snug text-amber-800">
        <FlaskConical className="mt-0.5 h-3 w-3 shrink-0" />
        <span>{t('routes.transitNote')}</span>
      </div>

      {/* Transfer summary */}
      <p className="mb-3 text-xs text-ink-muted">
        {plan.transfers === 0
          ? t('routes.transitNoTransfer')
          : t('routes.transitTransferCount', { count: plan.transfers })}
      </p>

      {/* Itinerary timeline */}
      <ol className="flex flex-col gap-2.5">
        {plan.legs.map((leg, i) => {
          const isRide = leg.kind !== 'walk' && leg.kind !== 'transfer'
          return (
            <li key={i} className="flex items-start gap-2.5">
              <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center">
                {leg.kind === 'walk' ? (
                  <Footprints className="h-4 w-4 text-ink-muted" />
                ) : leg.kind === 'transfer' ? (
                  <Repeat className="h-4 w-4 text-amber-600" />
                ) : leg.kind === 'metro' ? (
                  <TrainFront className="h-4 w-4 text-ink-soft" />
                ) : (
                  <Bus className="h-4 w-4 text-ink-soft" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                {isRide ? (
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <LineBadge line={leg.line!} bg={leg.bg} text={leg.text} />
                    <span className="text-sm font-medium text-ink">
                      {t(KIND_LABEL[leg.kind as LegKind] ?? 'routes.kindBus')}
                    </span>
                    <span className="text-xs text-ink-muted">
                      {t('routes.transitStops', { count: leg.stops ?? 0 })} · {leg.minutes}{' '}
                      {t('routes.minutes')}
                    </span>
                  </div>
                ) : leg.kind === 'transfer' ? (
                  <p className="text-sm text-ink-soft">
                    {t('routes.transitTransferAt', { hub: leg.hub })}{' '}
                    <span className="text-xs text-ink-muted">
                      · {leg.minutes} {t('routes.minutes')}
                    </span>
                  </p>
                ) : (
                  <p className="text-sm text-ink-soft">
                    {leg.phase === 'toDest'
                      ? t('routes.transitWalkToDest')
                      : t('routes.transitWalkToStop')}{' '}
                    <span className="text-xs text-ink-muted">
                      · {leg.minutes} {t('routes.minutes')}
                    </span>
                  </p>
                )}
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

export default TransitOptions
