import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FlaskConical, Gauge, Trophy, AlertTriangle, Activity } from 'lucide-react'
import {
  createAgents,
  stepAgents,
  createRoadStats,
  sampleRoadStats,
  rankRoads,
  type RankedRoad,
  type CongestionLevel,
} from '@/lib/simEngine'

const TICK_MS = 400
const SIM_DT = 0.6 // simulation-seconds advanced per tick
const RENDER_EVERY = 2 // refresh the table every N ticks

const LEVEL_COLOR: Record<CongestionLevel, string> = {
  free: '#2DA84A',
  moderate: '#F8B500',
  heavy: '#EA4335',
}
const LEVEL_KEY: Record<CongestionLevel, string> = {
  free: 'stats.free',
  moderate: 'stats.moderate',
  heavy: 'stats.heavy',
}

function FlowBar({ pct, level }: { pct: number; level: CongestionLevel }) {
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
      <div
        className="h-full rounded-full transition-all duration-500 ease-out"
        style={{ width: `${pct}%`, background: LEVEL_COLOR[level] }}
      />
    </div>
  )
}

export function StatsView() {
  const { t, i18n } = useTranslation()
  const hu = i18n.language.startsWith('hu')
  const name = (r: RankedRoad) => (hu ? r.roadHu : r.road)

  const [ranked, setRanked] = useState<RankedRoad[]>([])
  const [collecting, setCollecting] = useState(0)
  const [elapsed, setElapsed] = useState(0)

  const agentsRef = useRef(createAgents(4)) // 32 agents → good road coverage
  const statsRef = useRef(createRoadStats())
  const tickRef = useRef(0)
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    function tick() {
      stepAgents(agentsRef.current, SIM_DT)
      sampleRoadStats(agentsRef.current, statsRef.current)
      tickRef.current += 1
      if (tickRef.current % RENDER_EVERY === 0) {
        const { ranked: r, collecting: c } = rankRoads(statsRef.current)
        setRanked(r)
        setCollecting(c)
        setElapsed(Math.round((Date.now() - statsRef.current.startedAt) / 1000))
      }
      timerRef.current = window.setTimeout(tick, TICK_MS)
    }
    timerRef.current = window.setTimeout(tick, TICK_MS)
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current)
    }
  }, [])

  // Best / worst use roads with a little confidence behind them.
  const confident = ranked.filter((r) => r.samples >= 4)
  const best = confident[0] ?? ranked[0]
  const worst = confident.length ? confident[confident.length - 1] : ranked[ranked.length - 1]

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-2 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold text-ink">{t('stats.title')}</h1>
        <span className="inline-flex items-center gap-1.5 rounded-md bg-brand-50 px-2 py-1 text-[0.65rem] font-bold uppercase tracking-wide text-brand-700 ring-1 ring-brand-100">
          <FlaskConical className="h-3 w-3" />
          {t('stats.modelBadge')}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-md bg-green-50 px-2 py-1 text-[0.65rem] font-bold uppercase tracking-wide text-green-700 ring-1 ring-green-100">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
          </span>
          {t('stats.live')}
        </span>
      </div>
      <p className="mb-4 text-sm text-ink-muted">{t('stats.subtitle')}</p>

      {/* Model-derived disclaimer */}
      <div className="mb-6 flex items-start gap-2 rounded-xl bg-amber-50 px-4 py-3 ring-1 ring-amber-100">
        <FlaskConical className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
        <p className="text-xs leading-relaxed text-amber-800">{t('stats.modelNote')}</p>
      </div>

      {ranked.length === 0 ? (
        <div className="rounded-2xl bg-white p-8 text-center text-sm text-ink-muted shadow-card">
          {t('stats.noData')}
        </div>
      ) : (
        <>
          {/* Best / worst highlight */}
          <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {best && (
              <div className="rounded-2xl border border-green-200 bg-green-50 p-4 shadow-card">
                <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-green-700">
                  <Trophy className="h-4 w-4" />
                  {t('stats.bestNow')}
                </div>
                <p className="text-lg font-bold text-ink">{name(best)}</p>
                <p className="mt-0.5 text-sm text-ink-soft">
                  {t('stats.flow')}: <strong className="text-green-700">{best.flowPct}%</strong>
                  {' · '}
                  {best.avgSpeed} {t('stats.kmh')}
                </p>
              </div>
            )}
            {worst && worst !== best && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 shadow-card">
                <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-red-700">
                  <AlertTriangle className="h-4 w-4" />
                  {t('stats.worstNow')}
                </div>
                <p className="text-lg font-bold text-ink">{name(worst)}</p>
                <p className="mt-0.5 text-sm text-ink-soft">
                  {t('stats.flow')}: <strong className="text-red-700">{worst.flowPct}%</strong>
                  {' · '}
                  {worst.avgSpeed} {t('stats.kmh')}
                </p>
              </div>
            )}
          </div>

          {/* Ranked table */}
          <div className="overflow-hidden rounded-2xl bg-white shadow-card">
            <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-2.5 text-[0.7rem] font-semibold uppercase tracking-wide text-ink-muted">
              <span className="w-6 text-center">#</span>
              <span className="flex-1">{t('stats.road')}</span>
              <span className="hidden w-40 sm:block">{t('stats.flow')}</span>
              <span className="w-20 text-right">{t('stats.avgSpeed')}</span>
            </div>
            <ol>
              {ranked.map((r, i) => (
                <li
                  key={r.road}
                  className="flex items-center gap-3 border-b border-slate-50 px-4 py-2.5 last:border-0"
                >
                  <span className="w-6 text-center text-sm font-bold text-ink-muted">{i + 1}</span>
                  <span className="flex flex-1 items-center gap-2 truncate">
                    <span className="truncate text-sm font-medium text-ink">{name(r)}</span>
                    {r.bridge && (
                      <span className="shrink-0 rounded bg-brand-50 px-1.5 py-0.5 text-[0.6rem] font-semibold text-brand-600">
                        {t('stats.bridge')}
                      </span>
                    )}
                    <span
                      className="shrink-0 rounded-full px-2 py-0.5 text-[0.6rem] font-semibold text-white"
                      style={{ background: LEVEL_COLOR[r.level] }}
                    >
                      {t(LEVEL_KEY[r.level])}
                    </span>
                  </span>
                  <span className="hidden w-40 items-center gap-2 sm:flex">
                    <FlowBar pct={r.flowPct} level={r.level} />
                    <span className="w-9 shrink-0 text-right text-xs font-semibold text-ink-soft">
                      {r.flowPct}%
                    </span>
                  </span>
                  <span className="flex w-20 items-center justify-end gap-1 text-right text-sm font-semibold text-ink">
                    <Gauge className="h-3.5 w-3.5 text-ink-muted" />
                    {r.avgSpeed}
                  </span>
                </li>
              ))}
            </ol>
          </div>

          {/* Footer / how to read */}
          <div className="mt-4 flex flex-col gap-2 text-xs text-ink-muted sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5" />
              {t('stats.howToRead')}
            </p>
            <p>
              {t('stats.runningFor', { sec: elapsed })}
              {collecting > 0 && ` · ${t('stats.collecting', { count: collecting })}`}
            </p>
          </div>
        </>
      )}
    </div>
  )
}

export default StatsView
