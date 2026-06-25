import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Clock, DollarSign, Leaf, Zap, Droplets, Route, Gauge, AlertTriangle, ChevronRight } from 'lucide-react'

interface KpiCardProps {
  icon: typeof Clock
  iconColor: string
  iconBg: string
  label: string
  value: string
  unit: string
  sub?: string
}

function KpiCard({ icon: Icon, iconColor, iconBg, label, value, unit, sub }: KpiCardProps) {
  return (
    <div className="flex flex-col rounded-2xl bg-white p-5 shadow-card">
      <div className={`mb-3 flex h-11 w-11 items-center justify-center rounded-xl ${iconBg}`}>
        <Icon className={`h-6 w-6 ${iconColor}`} />
      </div>
      <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">{label}</p>
      <div className="mt-1 flex items-end gap-1.5">
        <span className="text-3xl font-bold text-ink">{value}</span>
        <span className="mb-0.5 text-sm font-medium text-ink-muted">{unit}</span>
      </div>
      {sub && <p className="mt-1 text-xs text-ink-muted">{sub}</p>}
    </div>
  )
}

const PERIOD_KEYS = ['metrics.today', 'metrics.thisWeek', 'metrics.allTime'] as const

const DATA: Record<string, { timeSaved: string; moneySaved: string; greenScore: string; co2: string; fuel: string; trips: string; speed: string; congestion: string }> = {
  'metrics.today': {
    timeSaved: '18', moneySaved: '420', greenScore: '74', co2: '1.2', fuel: '0.4', trips: '3', speed: '28', congestion: '2',
  },
  'metrics.thisWeek': {
    timeSaved: '94', moneySaved: '2 100', greenScore: '71', co2: '7.8', fuel: '2.6', trips: '14', speed: '31', congestion: '9',
  },
  'metrics.allTime': {
    timeSaved: '612', moneySaved: '13 800', greenScore: '69', co2: '48.3', fuel: '16.1', trips: '87', speed: '30', congestion: '54',
  },
}

const PERIOD_PHRASE: Record<string, string> = {
  'metrics.today': 'metrics.periodToday',
  'metrics.thisWeek': 'metrics.periodWeek',
  'metrics.allTime': 'metrics.periodAllTime',
}

export function MetricsView() {
  const { t } = useTranslation()
  const [period, setPeriod] = useState<keyof typeof DATA>('metrics.today')
  const [advanced, setAdvanced] = useState(false)

  const d = DATA[period]
  // Lower-case phrase ("today" / "this week" / "all-time") appended to period KPI labels.
  const periodPhrase = t(PERIOD_PHRASE[period])

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-ink">{t('metrics.title')}</h1>
        <div className="flex items-center gap-2">
          {/* Period selector */}
          <div className="flex rounded-xl bg-slate-100 p-1">
            {PERIOD_KEYS.map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setPeriod(k)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  period === k ? 'bg-white text-ink shadow-sm' : 'text-ink-muted hover:text-ink'
                }`}
              >
                {t(k)}
              </button>
            ))}
          </div>
          {/* Advanced toggle */}
          <button
            type="button"
            onClick={() => setAdvanced((v) => !v)}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition ${
              advanced ? 'bg-brand-500 text-white' : 'bg-slate-100 text-ink-soft hover:bg-slate-200'
            }`}
          >
            <Zap className="h-3.5 w-3.5" />
            {t('metrics.advancedToggle')}
          </button>
        </div>
      </div>

      {/* Beginner KPIs */}
      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard
          icon={Clock}
          iconColor="text-brand-600"
          iconBg="bg-brand-50"
          label={`${t('metrics.timeSaved')} ${periodPhrase}`}
          value={d.timeSaved}
          unit={t('metrics.minutes')}
          sub={`+${Math.round(Number(d.timeSaved.replace(' ', '')) * 0.12)} ${t('metrics.minutes')} ${t('metrics.vsLastPeriod')}`}
        />
        <KpiCard
          icon={DollarSign}
          iconColor="text-amber-600"
          iconBg="bg-amber-50"
          label={`${t('metrics.moneySaved')} ${periodPhrase}`}
          value={d.moneySaved}
          unit={t('metrics.huf')}
        />
        <KpiCard
          icon={Leaf}
          iconColor="text-green-600"
          iconBg="bg-green-50"
          label={`${t('metrics.greenScore')} ${periodPhrase}`}
          value={d.greenScore}
          unit="/ 100"
          sub={Number(d.greenScore) >= 70 ? `✓ ${t('metrics.aboveAvg')}` : `↗ ${t('metrics.improving')}`}
        />
      </div>

      {/* Advanced metrics */}
      {advanced && (
        <>
          <div className="mb-2 mt-4 flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{t('metrics.advanced')}</span>
            <span className="h-px flex-1 bg-slate-200" />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="flex flex-col rounded-2xl bg-white p-4 shadow-card">
              <Zap className="mb-2 h-4 w-4 text-green-500" />
              <p className="text-xl font-bold text-ink">{d.co2} <span className="text-sm font-normal text-ink-muted">{t('metrics.g')} CO₂</span></p>
              <p className="text-xs text-ink-muted">{t('metrics.co2')}</p>
            </div>
            <div className="flex flex-col rounded-2xl bg-white p-4 shadow-card">
              <Droplets className="mb-2 h-4 w-4 text-blue-500" />
              <p className="text-xl font-bold text-ink">{d.fuel} <span className="text-sm font-normal text-ink-muted">{t('metrics.l')}</span></p>
              <p className="text-xs text-ink-muted">{t('metrics.fuelSaved')}</p>
            </div>
            <div className="flex flex-col rounded-2xl bg-white p-4 shadow-card">
              <Route className="mb-2 h-4 w-4 text-brand-500" />
              <p className="text-xl font-bold text-ink">{d.trips} <span className="text-sm font-normal text-ink-muted">{t('metrics.tripsUnit')}</span></p>
              <p className="text-xs text-ink-muted">{t('metrics.tripsCompleted')}</p>
            </div>
            <div className="flex flex-col rounded-2xl bg-white p-4 shadow-card">
              <Gauge className="mb-2 h-4 w-4 text-slate-500" />
              <p className="text-xl font-bold text-ink">{d.speed} <span className="text-sm font-normal text-ink-muted">{t('metrics.kmh')}</span></p>
              <p className="text-xs text-ink-muted">{t('metrics.avgSpeed')}</p>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-3 rounded-2xl bg-white p-4 shadow-card">
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500" />
            <div>
              <p className="text-sm font-semibold text-ink">{d.congestion} {t('metrics.eventsWord')}</p>
              <p className="text-xs text-ink-muted">{t('metrics.congestionAvoided')}</p>
            </div>
            <ChevronRight className="ml-auto h-4 w-4 text-ink-muted" />
          </div>
        </>
      )}

      {!advanced && (
        <button
          type="button"
          onClick={() => setAdvanced(true)}
          className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-xs text-ink-muted transition hover:text-ink"
        >
          <Zap className="h-3.5 w-3.5" />
          {t('metrics.advancedToggle')}
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
}

export default MetricsView
