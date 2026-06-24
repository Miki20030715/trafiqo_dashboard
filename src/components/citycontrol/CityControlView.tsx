import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts'
import { Users, TrendingUp, Leaf, Activity, Settings, CheckCircle } from 'lucide-react'
import { useTheme } from '@/lib/theme'

const FORECAST_DATA = [
  { time: 'now', free: 45, moderate: 35, heavy: 20 },
  { time: '+1h', free: 38, moderate: 37, heavy: 25 },
  { time: '+2h', free: 30, moderate: 38, heavy: 32 },
  { time: '+3h', free: 35, moderate: 40, heavy: 25 },
  { time: '+4h', free: 42, moderate: 36, heavy: 22 },
]

const SUSTAINABILITY_DATA = [
  { name: 'Transit', value: 1240, color: '#2DA84A' },
  { name: 'Bike', value: 890, color: '#1B72E8' },
  { name: 'Walk', value: 560, color: '#F8B500' },
  { name: 'Car (eco)', value: 320, color: '#EA4335' },
]

const ZONES = [
  { id: 'inner', labelKey: 'Belváros (I–VIII)', defaultMultiplier: 1.2 },
  { id: 'outer', labelKey: 'Külső körút (IX–XIV)', defaultMultiplier: 1.0 },
  { id: 'buda', labelKey: 'Budai oldal', defaultMultiplier: 1.1 },
  { id: 'agglomeration', labelKey: 'Agglomeráció', defaultMultiplier: 0.9 },
]

function StatCard({ icon: Icon, iconColor, iconBg, label, value, sub }: {
  icon: typeof Users; iconColor: string; iconBg: string; label: string; value: string | number; sub?: string
}) {
  return (
    <div className="flex flex-col rounded-2xl bg-white p-5 shadow-card">
      <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${iconBg}`}>
        <Icon className={`h-5 w-5 ${iconColor}`} />
      </div>
      <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">{label}</p>
      <p className="mt-1 text-2xl font-bold text-ink">{value}</p>
      {sub && <p className="text-xs text-ink-muted">{sub}</p>}
    </div>
  )
}

export function CityControlView() {
  const { t } = useTranslation()
  const { isDark } = useTheme()
  const gridStroke = isDark ? '#2a3346' : '#f1f5f9'
  const axisColor = isDark ? '#8a92a6' : '#6b6f86'
  const tooltipStyle = isDark
    ? { backgroundColor: '#161c2d', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#e6eaf2' }
    : undefined
  const [multipliers, setMultipliers] = useState<Record<string, number>>(
    Object.fromEntries(ZONES.map((z) => [z.id, z.defaultMultiplier]))
  )
  const [applied, setApplied] = useState(false)

  function handleSlider(zoneId: string, value: number) {
    setMultipliers((prev) => ({ ...prev, [zoneId]: value }))
    setApplied(false)
  }

  function handleApply() {
    setApplied(true)
    setTimeout(() => setApplied(false), 2500)
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ink">{t('cityControl.title')}</h1>
        <span className="rounded-lg bg-red-50 px-2.5 py-1 text-xs font-bold text-red-600">
          {t('cityControl.dataNote')}
        </span>
      </div>

      {/* Summary cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard icon={Users} iconColor="text-brand-600" iconBg="bg-brand-50" label={t('cityControl.activeUsers')} value="3 847" sub="+12% vs yesterday" />
        <StatCard icon={Leaf} iconColor="text-green-600" iconBg="bg-green-50" label={t('cityControl.co2Total')} value="4.2 t" sub="CO₂ avoided" />
        <StatCard icon={TrendingUp} iconColor="text-amber-600" iconBg="bg-amber-50" label={t('cityControl.totalPoints')} value="184 K" sub="points issued" />
        <StatCard icon={Activity} iconColor="text-red-500" iconBg="bg-red-50" label={t('cityControl.redemptionRate')} value="38%" sub="of issued pts" />
      </div>

      {/* Forecast chart */}
      <div className="mb-6 rounded-2xl bg-white p-5 shadow-card">
        <h2 className="mb-4 text-sm font-semibold text-ink">{t('cityControl.forecast')}</h2>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={FORECAST_DATA} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
            <XAxis dataKey="time" tick={{ fontSize: 11, fill: axisColor }} stroke={gridStroke} />
            <YAxis tick={{ fontSize: 11, fill: axisColor }} stroke={gridStroke} tickFormatter={(v) => `${v}%`} />
            <Tooltip formatter={(v: number) => `${v}%`} contentStyle={tooltipStyle} />
            <Area type="monotone" dataKey="free" stackId="1" stroke="#2DA84A" fill="#dcfce7" name={t('cityControl.free')} />
            <Area type="monotone" dataKey="moderate" stackId="1" stroke="#F8B500" fill="#fef9c3" name={t('cityControl.moderate')} />
            <Area type="monotone" dataKey="heavy" stackId="1" stroke="#EA4335" fill="#fee2e2" name={t('cityControl.heavy')} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mb-6 grid gap-6 md:grid-cols-2">
        {/* Dynamic pricing sliders */}
        <div className="rounded-2xl bg-white p-5 shadow-card">
          <h2 className="mb-1 text-sm font-semibold text-ink">{t('cityControl.pricing')}</h2>
          <p className="mb-4 text-xs text-ink-muted">{t('cityControl.pricingNote')}</p>
          <div className="flex flex-col gap-4">
            {ZONES.map((zone) => (
              <div key={zone.id}>
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <span className="font-medium text-ink">{zone.labelKey}</span>
                  <span className="font-bold text-brand-700">{multipliers[zone.id].toFixed(1)}×</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="3.0"
                  step="0.1"
                  value={multipliers[zone.id]}
                  onChange={(e) => handleSlider(zone.id, Number(e.target.value))}
                  className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-brand-500"
                />
                <div className="mt-0.5 flex justify-between text-[0.65rem] text-ink-muted">
                  <span>0.5×</span>
                  <span>3.0×</span>
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={handleApply}
            className={`mt-5 w-full rounded-xl py-2.5 text-sm font-semibold transition ${
              applied ? 'bg-green-500 text-white' : 'bg-brand-500 text-white hover:bg-brand-600'
            }`}
          >
            {applied ? (
              <span className="flex items-center justify-center gap-2">
                <CheckCircle className="h-4 w-4" /> {t('cityControl.applied')}
              </span>
            ) : (
              t('cityControl.apply')
            )}
          </button>
        </div>

        {/* Sustainability */}
        <div className="rounded-2xl bg-white p-5 shadow-card">
          <h2 className="mb-4 text-sm font-semibold text-ink">{t('cityControl.sustainability')}</h2>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={SUSTAINABILITY_DATA} layout="vertical" margin={{ left: -10, right: 10 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={gridStroke} />
              <XAxis type="number" tick={{ fontSize: 10, fill: axisColor }} stroke={gridStroke} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: axisColor }} stroke={gridStroke} width={60} />
              <Tooltip formatter={(v: number) => [`${v} users`]} contentStyle={tooltipStyle} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {SUSTAINABILITY_DATA.map((d, i) => (
                  <Cell key={i} fill={d.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 grid grid-cols-3 gap-3">
            {[
              { value: '28 340', labelKey: 'cityControl.sustainabilityKm' },
              { value: '1 204', labelKey: 'cityControl.sustainabilityUsers' },
              { value: '142', labelKey: 'cityControl.sustainabilityTrees' },
            ].map(({ value, labelKey }) => (
              <div key={labelKey} className="flex flex-col items-center rounded-xl bg-green-50 p-2.5 text-center">
                <Leaf className="mb-1 h-4 w-4 text-green-500" />
                <p className="text-base font-bold text-green-800">{value}</p>
                <p className="text-[0.65rem] leading-tight text-green-600">{t(labelKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Reward analytics */}
      <div className="rounded-2xl bg-white p-5 shadow-card">
        <h2 className="mb-1 text-sm font-semibold text-ink">{t('cityControl.rewardAnalytics')}</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Transit passes redeemed', value: '234' },
            { label: 'Bike hours redeemed', value: '89' },
            { label: 'Trees planted', value: '14' },
            { label: 'Avg pts per user', value: '48' },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-xl bg-slate-50 p-3 text-center">
              <p className="text-xl font-bold text-ink">{value}</p>
              <p className="text-xs text-ink-muted">{label}</p>
            </div>
          ))}
        </div>
        <div className="mt-4">
          <Settings className="mb-2 h-4 w-4 text-ink-muted" />
          <p className="text-xs text-ink-muted">{t('cityControl.dataNote')}</p>
        </div>
      </div>
    </div>
  )
}

export default CityControlView
