import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Gauge, Trophy, AlertTriangle, RefreshCw, FlaskConical } from 'lucide-react'
import { MODEL_CORRIDORS } from '@/components/map/mapConfig'
import { rankCorridorsLive, type CorridorRanking, type CorridorSpec } from '@/lib/matrix'

/** English names for the model corridors (their stored name is Hungarian). */
const CORRIDOR_EN: Record<string, string> = {
  nagykorut: 'Grand Boulevard',
  hungaria: 'Hungária Boulevard',
  vaci: 'Váci Road',
  ulloi: 'Üllői Road',
  andrassy: 'Andrássy Avenue',
  'm1m7-inflow': 'M1–M7 inflow (Budaörsi Road)',
  'arpad-bridge': 'Árpád Bridge',
}

const SPECS: CorridorSpec[] = MODEL_CORRIDORS.map((c) => {
  const from = c.path[0] as [number, number]
  const to = c.path[c.path.length - 1] as [number, number]
  return {
    id: c.id,
    name: CORRIDOR_EN[c.id] ?? c.name,
    nameHu: c.name,
    from: { lat: from[0], lon: from[1] },
    to: { lat: to[0], lon: to[1] },
  }
})

const REFRESH_MS = 90_000

export function LiveCorridorRanking() {
  const { t, i18n } = useTranslation()
  const hu = i18n.language.startsWith('hu')
  const [ranking, setRanking] = useState<CorridorRanking | null>(null)
  const [loading, setLoading] = useState(true)
  const [updatedAt, setUpdatedAt] = useState<number>(0)
  const timer = useRef<number | null>(null)

  async function refresh() {
    setLoading(true)
    const r = await rankCorridorsLive(SPECS, 'car')
    setRanking(r)
    setUpdatedAt(Date.now())
    setLoading(false)
  }

  useEffect(() => {
    refresh()
    timer.current = window.setInterval(refresh, REFRESH_MS)
    return () => {
      if (timer.current) window.clearInterval(timer.current)
    }
  }, [])

  const corridors = ranking?.corridors ?? []
  const maxSpeed = Math.max(1, ...corridors.map((c) => c.speedKmh))
  const best = corridors[0]
  const worst = corridors[corridors.length - 1]

  return (
    <div className="mb-6 rounded-2xl bg-white p-5 shadow-card">
      <div className="mb-1 flex flex-wrap items-center gap-2">
        <Gauge className="h-4 w-4 text-brand-600" />
        <h2 className="text-sm font-semibold text-ink">{t('stats.liveTitle')}</h2>
        {ranking?.source === 'tomtom' ? (
          <span className="inline-flex items-center gap-1 rounded-md bg-green-50 px-1.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-wide text-green-700 ring-1 ring-green-100">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
            </span>
            {t('stats.liveBadge')}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-1.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-wide text-amber-700 ring-1 ring-amber-100">
            <FlaskConical className="h-3 w-3" />
            {t('stats.modelBadge')}
          </span>
        )}
        <button
          type="button"
          onClick={refresh}
          className="ml-auto inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-ink-muted hover:bg-slate-100"
          title={t('stats.refresh')}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>
      <p className="mb-3 text-xs text-ink-muted">{t('stats.liveSubtitle')}</p>

      {best && worst && (
        <div className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-3 py-2">
            <Trophy className="h-4 w-4 shrink-0 text-green-700" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink">{hu ? best.nameHu : best.name}</p>
              <p className="text-xs text-green-700">{best.speedKmh} {t('stats.kmh')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-red-700" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink">{hu ? worst.nameHu : worst.name}</p>
              <p className="text-xs text-red-700">{worst.speedKmh} {t('stats.kmh')}</p>
            </div>
          </div>
        </div>
      )}

      <ol className="flex flex-col gap-1.5">
        {corridors.map((c, i) => (
          <li key={c.id} className="flex items-center gap-3">
            <span className="w-5 text-center text-xs font-bold text-ink-muted">{i + 1}</span>
            <span className="w-40 shrink-0 truncate text-sm text-ink">{hu ? c.nameHu : c.name}</span>
            <span className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
              <span
                className="block h-full rounded-full bg-brand-500 transition-all duration-500"
                style={{ width: `${Math.round((c.speedKmh / maxSpeed) * 100)}%` }}
              />
            </span>
            <span className="w-16 text-right text-sm font-semibold text-ink">
              {c.speedKmh} <span className="text-xs font-normal text-ink-muted">{t('stats.kmh')}</span>
            </span>
          </li>
        ))}
      </ol>

      {updatedAt > 0 && (
        <p className="mt-3 text-[0.7rem] text-ink-muted">
          {t('stats.lastUpdated', { time: new Date(updatedAt).toLocaleTimeString() })}
        </p>
      )}
    </div>
  )
}

export default LiveCorridorRanking
