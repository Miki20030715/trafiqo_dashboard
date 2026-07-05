import { useMemo, useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend,
} from 'recharts'
import { Sparkles, Info, RotateCcw, TrendingUp, Loader2 } from 'lucide-react'
import { type UserRole } from '@/lib/userProfile'
import { hasAnthropic } from '@/lib/env'
import {
  MODES, MODE_META, ROLE_COEFFICIENTS, valueOfTime, runScenario, runAggregateScenario,
  type Intervention, type Mode, type Role, type UtilityTerms,
} from '@/lib/behaviorModel'
import {
  summariseScenario, explainScenarioLocal, explainScenarioWithClaude,
  type ScenarioFacts, type ShiftSummary,
} from '@/lib/behaviorExplain'

type Segment = Role | 'all'

const ALL_ROLES = Object.keys(ROLE_COEFFICIENTS) as Role[]

interface BehaviorPredictionPanelProps {
  initialRole?: UserRole
  onRoleChange?: (role: UserRole) => void
}

/** Intervention controls held in React state (no localStorage — pure component state). */
interface Controls {
  charge: number          // HUF added to car (congestion charge)
  extraCongestion: number // +% car time
  fareDelta: number       // HUF change to transit
  nudge: number           // 0..1 green nudge
  bikeLane: boolean       // new protected bike lane
  fastTransit: boolean    // service improvement
}

const NEUTRAL: Controls = { charge: 0, extraCongestion: 0, fareDelta: 0, nudge: 0, bikeLane: false, fastTransit: false }

const PRESETS: { key: string; controls: Partial<Controls> }[] = [
  { key: 'presetCharge', controls: { charge: 800 } },
  { key: 'presetNudge', controls: { nudge: 0.7 } },
  { key: 'presetJam', controls: { extraCongestion: 0.5 } },
  { key: 'presetBikeLane', controls: { bikeLane: true, fareDelta: -150 } },
]

function pct(x: number): number {
  return Math.round(x * 1000) / 10
}

export function BehaviorPredictionPanel({ initialRole = '', onRoleChange }: BehaviorPredictionPanelProps) {
  const { t } = useTranslation()
  const [segment, setSegment] = useState<Segment>(initialRole || 'privateDriver')
  const [c, setControls] = useState<Controls>(NEUTRAL)

  const modeLabel = (m: Mode) => t(MODE_META[m].i18nKey)

  // Build the intervention from the control state.
  const intervention = useMemo<Intervention>(() => {
    const bits: string[] = []
    if (c.charge > 0) bits.push(`${c.charge} Ft ${t('behavior.congestionCharge')}`)
    if (c.extraCongestion > 0) bits.push(`+${Math.round(c.extraCongestion * 100)}% ${t('behavior.extraCongestion')}`)
    if (c.fareDelta !== 0) bits.push(`${c.fareDelta > 0 ? '+' : ''}${c.fareDelta} Ft ${t('behavior.transitFare')}`)
    if (c.nudge > 0) bits.push(`${Math.round(c.nudge * 100)}% ${t('behavior.greenNudge')}`)
    if (c.bikeLane) bits.push(t('behavior.bikeLane'))
    if (c.fastTransit) bits.push(t('behavior.fastTransit'))
    return {
      label: bits.length ? bits.join(' · ') : t('behavior.noIntervention'),
      carCostDelta: c.charge,
      congestionDelta: c.extraCongestion,
      transitCostDelta: c.fareDelta,
      nudge: c.nudge,
      bikeTimeFactor: c.bikeLane ? 0.8 : 1,
      transitTimeFactor: c.fastTransit ? 0.85 : 1,
    }
  }, [c, t])

  // Run the scenario. Per-role OR city aggregate.
  const scenario = useMemo(() => {
    if (segment === 'all') {
      const agg = runAggregateScenario(intervention)
      return { before: agg.before, after: agg.afterAdapted, timeseries: agg.timeseries, breakdown: null as Record<Mode, UtilityTerms> | null, role: null as Role | null }
    }
    const res = runScenario(segment, intervention)
    return { before: res.before, after: res.afterAdapted, timeseries: res.timeseries, breakdown: res.breakdown, role: segment, result: res }
  }, [segment, intervention])

  // Facts + baseline (local) explanation, recomputed synchronously.
  const facts = useMemo<ScenarioFacts | null>(() => {
    if (segment === 'all' || !('result' in scenario) || !scenario.result) return null
    return summariseScenario(scenario.result, intervention)
  }, [scenario, intervention, segment])

  const aggregateShifts: ShiftSummary[] = useMemo(
    () =>
      MODES.map((mode) => ({ mode, pp: pct(scenario.after[mode]) - pct(scenario.before[mode]) }))
        .filter((s) => Math.abs(s.pp) >= 0.5)
        .sort((a, b) => Math.abs(b.pp) - Math.abs(a.pp)),
    [scenario],
  )

  const localExplanation = useMemo(() => {
    if (facts) return explainScenarioLocal(facts)
    // Aggregate description.
    if (aggregateShifts.length === 0) return t('behavior.aggregateNoShift')
    const fmt = (s: ShiftSummary) => `${modeLabel(s.mode)} ${s.pp > 0 ? '+' : ''}${s.pp.toFixed(1)} pp`
    return `${t('behavior.aggregateLead', { label: intervention.label })} ${aggregateShifts.map(fmt).join(', ')}. ${t('behavior.aggregateTail')}`
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facts, aggregateShifts, intervention.label, t])

  // AI explanation (optional, one call per run). Reset whenever inputs change.
  const [aiText, setAiText] = useState<string | null>(null)
  const [aiSource, setAiSource] = useState<'claude' | 'local' | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  useEffect(() => {
    setAiText(null)
    setAiSource(null)
  }, [segment, intervention])

  async function runExplain() {
    if (!facts) return
    setAiLoading(true)
    const roleLabel = t(`roles.${facts.role}`)
    const { text, source } = await explainScenarioWithClaude(facts, roleLabel)
    setAiText(text)
    setAiSource(source)
    setAiLoading(false)
  }

  function handleSegment(s: Segment) {
    setSegment(s)
    if (s !== 'all') onRoleChange?.(s)
  }

  function applyPreset(p: Partial<Controls>) {
    setControls({ ...NEUTRAL, ...p })
  }

  // ── Chart data ────────────────────────────────────────────────────────────
  const splitData = [
    { name: t('behavior.now'), ...Object.fromEntries(MODES.map((m) => [m, pct(scenario.before[m])])) },
    { name: t('behavior.predicted'), ...Object.fromEntries(MODES.map((m) => [m, pct(scenario.after[m])])) },
  ]
  const trajectoryData = scenario.timeseries.map((pt) => ({
    tick: pt.tick,
    ...Object.fromEntries(MODES.map((m) => [m, pct(pt[m])])),
  }))

  const vot = segment === 'all' ? null : valueOfTime(segment)

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50">
              <TrendingUp className="h-5 w-5 text-brand-600" />
            </div>
            <h1 className="text-2xl font-bold text-ink">{t('behavior.title')}</h1>
          </div>
          <p className="mt-1 max-w-2xl text-sm text-ink-muted">{t('behavior.subtitle')}</p>
        </div>
        <span className="shrink-0 rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-100">
          {t('behavior.modelBadge')}
        </span>
      </div>

      {/* Segment selector */}
      <div className="mb-5">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">{t('behavior.selectRole')}</p>
        <div className="flex flex-wrap gap-2">
          <SegmentChip active={segment === 'all'} onClick={() => handleSegment('all')} label={t('behavior.allCity')} />
          {ALL_ROLES.map((r) => (
            <SegmentChip key={r} active={segment === r} onClick={() => handleSegment(r)} label={t(`roles.${r}`)} />
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Intervention controls */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl bg-white p-5 shadow-card">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-ink">{t('behavior.intervention')}</h2>
              <button
                type="button"
                onClick={() => setControls(NEUTRAL)}
                className="inline-flex items-center gap-1 text-xs text-ink-muted hover:text-ink"
              >
                <RotateCcw className="h-3.5 w-3.5" /> {t('behavior.presetReset')}
              </button>
            </div>

            {/* Presets */}
            <div className="mb-5 flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => applyPreset(p.controls)}
                  className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-ink-soft transition hover:bg-brand-50 hover:text-brand-700"
                >
                  {t(`behavior.${p.key}`)}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-4">
              <Slider
                label={t('behavior.congestionCharge')} unit="Ft" min={0} max={1500} step={50}
                value={c.charge} onChange={(v) => setControls((s) => ({ ...s, charge: v }))}
              />
              <Slider
                label={t('behavior.extraCongestion')} unit="%" min={0} max={80} step={5}
                value={Math.round(c.extraCongestion * 100)}
                onChange={(v) => setControls((s) => ({ ...s, extraCongestion: v / 100 }))}
              />
              <Slider
                label={t('behavior.transitFare')} unit="Ft" min={-300} max={300} step={50}
                value={c.fareDelta} onChange={(v) => setControls((s) => ({ ...s, fareDelta: v }))}
              />
              <Slider
                label={t('behavior.greenNudge')} unit="%" min={0} max={100} step={5}
                value={Math.round(c.nudge * 100)}
                onChange={(v) => setControls((s) => ({ ...s, nudge: v / 100 }))}
              />
              <Toggle
                label={t('behavior.bikeLane')} checked={c.bikeLane}
                onChange={(v) => setControls((s) => ({ ...s, bikeLane: v }))}
              />
              <Toggle
                label={t('behavior.fastTransit')} checked={c.fastTransit}
                onChange={(v) => setControls((s) => ({ ...s, fastTransit: v }))}
              />
            </div>

            {vot !== null && (
              <div className="mt-5 rounded-xl bg-slate-50 px-3 py-2.5">
                <p className="text-xs text-ink-muted">{t('behavior.votLabel')}</p>
                <p className="text-sm font-bold text-ink">{Number.isFinite(vot) ? `${vot.toFixed(0)} Ft / min` : '—'}</p>
              </div>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="flex flex-col gap-6 lg:col-span-3">
          {/* Before / after split */}
          <div className="rounded-2xl bg-white p-5 shadow-card">
            <h2 className="mb-1 text-sm font-semibold text-ink">{t('behavior.currentSplit')}</h2>
            <p className="mb-3 text-xs text-ink-muted">{intervention.label}</p>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={splitData} layout="vertical" margin={{ left: 4, right: 12, top: 4, bottom: 4 }} barCategoryGap={18}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} allowDataOverflow tick={{ fontSize: 10 }} tickFormatter={(v) => `${Math.round(v)}%`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fontWeight: 600 }} width={72} />
                <Tooltip formatter={(v: number, key) => [`${v}%`, modeLabel(key as Mode)]} />
                {MODES.map((m) => (
                  <Bar key={m} dataKey={m} stackId="split" fill={MODE_META[m].color} name={modeLabel(m)} radius={m === 'walk' ? [0, 4, 4, 0] : 0} />
                ))}
              </BarChart>
            </ResponsiveContainer>
            {/* Legend + deltas */}
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {MODES.map((m) => {
                const d = pct(scenario.after[m]) - pct(scenario.before[m])
                return (
                  <div key={m} className="flex items-center gap-1.5 text-xs">
                    <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: MODE_META[m].color }} />
                    <span className="text-ink-soft">{modeLabel(m)}</span>
                    <span className={`ml-auto font-semibold ${d > 0.05 ? 'text-green-600' : d < -0.05 ? 'text-red-600' : 'text-ink-muted'}`}>
                      {d > 0 ? '+' : ''}{d.toFixed(1)}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Trajectory */}
          <div className="rounded-2xl bg-white p-5 shadow-card">
            <h2 className="mb-1 text-sm font-semibold text-ink">{t('behavior.trajectory')}</h2>
            <p className="mb-3 text-xs text-ink-muted">{t('behavior.trajectoryNote')}</p>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={trajectoryData} margin={{ top: 5, right: 10, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="tick" tick={{ fontSize: 10 }} tickFormatter={(v) => (v === 0 ? 't₀' : `+${v}`)} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${v}%`} domain={[0, 'dataMax + 5']} />
                <Tooltip formatter={(v: number, key) => [`${v}%`, modeLabel(key as Mode)]} labelFormatter={(l) => (l === 0 ? 't₀ (intervention)' : `tick +${l}`)} />
                <Legend formatter={(value) => modeLabel(value as Mode)} iconType="plainline" wrapperStyle={{ fontSize: 11 }} />
                {MODES.map((m) => (
                  <Line key={m} type="monotone" dataKey={m} stroke={MODE_META[m].color} strokeWidth={2} dot={false} name={m} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Explanation */}
      <div className="mt-6 rounded-2xl border border-brand-100 bg-white p-5 shadow-card">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-brand-500" />
            <h2 className="text-sm font-semibold text-ink">{t('behavior.whyTitle')}</h2>
          </div>
          {facts && (
            <button
              type="button"
              onClick={runExplain}
              disabled={aiLoading}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-600 disabled:opacity-60"
            >
              {aiLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              {aiLoading ? t('behavior.explaining') : t('behavior.explainAI')}
            </button>
          )}
        </div>

        <p className="text-sm leading-relaxed text-ink-soft">{aiText ?? localExplanation}</p>

        <div className="mt-2 flex items-center gap-2">
          {aiSource === 'claude' && (
            <span className="rounded bg-brand-50 px-2 py-0.5 text-[0.65rem] font-semibold text-brand-700">{t('behavior.aiBadge')}</span>
          )}
          {(aiSource === 'local' || (!aiText && !aiLoading)) && (
            <span className="rounded bg-slate-100 px-2 py-0.5 text-[0.65rem] font-semibold text-ink-muted">{t('behavior.localBadge')}</span>
          )}
          {!hasAnthropic() && facts && (
            <span className="text-[0.65rem] text-ink-muted">{t('behavior.aiHint')}</span>
          )}
        </div>
      </div>

      {/* Utility breakdown (traceability) */}
      {scenario.breakdown && (
        <div className="mt-6 rounded-2xl bg-white p-5 shadow-card">
          <div className="mb-1 flex items-center gap-2">
            <Info className="h-4 w-4 text-ink-muted" />
            <h2 className="text-sm font-semibold text-ink">{t('behavior.utilityTitle')}</h2>
          </div>
          <p className="mb-3 text-xs text-ink-muted">{t('behavior.utilityNote')}</p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] text-right text-xs">
              <thead>
                <tr className="text-ink-muted">
                  <th className="py-1.5 pr-3 text-left font-medium">{t('behavior.modeCol')}</th>
                  <th className="px-2 font-medium">{t('behavior.term_asc')}</th>
                  <th className="px-2 font-medium">{t('behavior.term_time')}</th>
                  <th className="px-2 font-medium">{t('behavior.term_cost')}</th>
                  <th className="px-2 font-medium">{t('behavior.term_green')}</th>
                  <th className="px-2 font-medium">{t('behavior.term_nudge')}</th>
                  <th className="pl-2 font-semibold">{t('behavior.term_total')}</th>
                </tr>
              </thead>
              <tbody className="font-mono">
                {MODES.map((m) => {
                  const b = scenario.breakdown![m]
                  return (
                    <tr key={m} className="border-t border-slate-100">
                      <td className="py-1.5 pr-3 text-left font-sans font-semibold text-ink">
                        <span className="mr-1.5 inline-block h-2 w-2 rounded-sm align-middle" style={{ background: MODE_META[m].color }} />
                        {modeLabel(m)}
                      </td>
                      <Cellv v={b.asc} />
                      <Cellv v={b.time} />
                      <Cellv v={b.cost} />
                      <Cellv v={b.green} />
                      <Cellv v={b.nudge} />
                      <td className="pl-2 font-sans font-bold text-ink">{b.total.toFixed(2)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Calibration disclaimer */}
      <div className="mt-6 flex items-start gap-2 rounded-xl bg-slate-50 px-4 py-3">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-ink-muted" />
        <p className="text-xs leading-relaxed text-ink-muted">{t('behavior.disclaimer')}</p>
      </div>
    </div>
  )
}

// ── Small building blocks ─────────────────────────────────────────────────────

function SegmentChip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
        active ? 'border-brand-400 bg-brand-50 text-brand-700' : 'border-slate-200 bg-white text-ink-soft hover:border-slate-300'
      }`}
    >
      {label}
    </button>
  )
}

function Slider({
  label, unit, min, max, step, value, onChange,
}: {
  label: string; unit: string; min: number; max: number; step: number; value: number; onChange: (v: number) => void
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <span className="font-medium text-ink">{label}</span>
        <span className="font-bold text-brand-700">{value > 0 && unit !== '%' ? '+' : ''}{value} {unit}</span>
      </div>
      <input
        type="range"
        min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-brand-500"
      />
    </div>
  )
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2.5 text-left transition hover:border-slate-300"
    >
      <span className="text-xs font-medium text-ink">{label}</span>
      <span className={`relative h-5 w-9 shrink-0 rounded-full transition ${checked ? 'bg-brand-500' : 'bg-slate-300'}`}>
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${checked ? 'left-[1.125rem]' : 'left-0.5'}`} />
      </span>
    </button>
  )
}

function Cellv({ v }: { v: number }) {
  const color = v > 0.001 ? 'text-green-600' : v < -0.001 ? 'text-red-500' : 'text-ink-muted'
  return <td className={`px-2 ${color}`}>{v >= 0 ? '+' : ''}{v.toFixed(2)}</td>
}

export default BehaviorPredictionPanel
