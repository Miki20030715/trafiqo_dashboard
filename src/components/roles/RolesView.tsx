import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Car, Train, Bike, Footprints, Shield, Siren, Package, CheckCircle, TrendingUp, Leaf, Clock, DollarSign } from 'lucide-react'
import { type UserRole } from '@/lib/userProfile'

interface RoleMeta {
  id: UserRole
  icon: typeof Car
  color: string
  bg: string
  kpis: { labelKey: string; value: string; icon: typeof Clock }[]
  insightKey: string
}

const ROLES: RoleMeta[] = [
  {
    id: 'privateDriver',
    icon: Car,
    color: 'text-brand-600',
    bg: 'bg-brand-50',
    kpis: [
      { labelKey: 'roles.kpiTimeSaved', value: '18 min', icon: Clock },
      { labelKey: 'roles.kpiMoneySaved', value: '420 Ft', icon: DollarSign },
      { labelKey: 'roles.kpiGreenScore', value: '74/100', icon: Leaf },
    ],
    insightKey: 'roles.insightPrivateDriver',
  },
  {
    id: 'taxiDriver',
    icon: Car,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    kpis: [
      { labelKey: 'roles.kpiPassengers', value: '23', icon: TrendingUp },
      { labelKey: 'roles.kpiTimeSaved', value: '34 min', icon: Clock },
      { labelKey: 'roles.kpiRouteEff', value: '91%', icon: TrendingUp },
    ],
    insightKey: 'roles.insightTaxiDriver',
  },
  {
    id: 'transitRider',
    icon: Train,
    color: 'text-green-600',
    bg: 'bg-green-50',
    kpis: [
      { labelKey: 'roles.kpiOnTime', value: '98%', icon: CheckCircle },
      { labelKey: 'roles.kpiTimeSaved', value: '12 min', icon: Clock },
      { labelKey: 'roles.kpiGreenScore', value: '88/100', icon: Leaf },
    ],
    insightKey: 'roles.insightTransitRider',
  },
  {
    id: 'cyclist',
    icon: Bike,
    color: 'text-green-700',
    bg: 'bg-green-50',
    kpis: [
      { labelKey: 'roles.kpiTimeSaved', value: '8 min', icon: Clock },
      { labelKey: 'roles.kpiGreenScore', value: '97/100', icon: Leaf },
      { labelKey: 'roles.kpiPeakAvoided', value: '5×', icon: TrendingUp },
    ],
    insightKey: 'roles.insightCyclist',
  },
  {
    id: 'pedestrian',
    icon: Footprints,
    color: 'text-slate-600',
    bg: 'bg-slate-100',
    kpis: [
      { labelKey: 'roles.kpiGreenScore', value: '100/100', icon: Leaf },
      { labelKey: 'roles.kpiTimeSaved', value: '5 min', icon: Clock },
      { labelKey: 'roles.kpiTrips', value: '7', icon: TrendingUp },
    ],
    insightKey: 'roles.insightPedestrian',
  },
  {
    id: 'police',
    icon: Shield,
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    kpis: [
      { labelKey: 'roles.kpiResponse', value: '4.2 min', icon: Clock },
      { labelKey: 'roles.kpiOnTime', value: '96%', icon: CheckCircle },
      { labelKey: 'roles.kpiRouteEff', value: '88%', icon: TrendingUp },
    ],
    insightKey: 'roles.insightPolice',
  },
  {
    id: 'emergency',
    icon: Siren,
    color: 'text-red-600',
    bg: 'bg-red-50',
    kpis: [
      { labelKey: 'roles.kpiResponse', value: '3.1 min', icon: Clock },
      { labelKey: 'roles.kpiOnTime', value: '99%', icon: CheckCircle },
      { labelKey: 'roles.kpiRouteEff', value: '95%', icon: TrendingUp },
    ],
    insightKey: 'roles.insightEmergency',
  },
  {
    id: 'logistics',
    icon: Package,
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    kpis: [
      { labelKey: 'roles.kpiDeliveries', value: '87%', icon: CheckCircle },
      { labelKey: 'roles.kpiFleetUtil', value: '78%', icon: TrendingUp },
      { labelKey: 'roles.kpiTimeSaved', value: '42 min', icon: Clock },
    ],
    insightKey: 'roles.insightLogistics',
  },
]

interface RolesViewProps {
  initialRole?: UserRole
  onRoleChange?: (role: UserRole) => void
}

export function RolesView({ initialRole = '', onRoleChange }: RolesViewProps) {
  const { t } = useTranslation()
  const [selected, setSelected] = useState<UserRole>(initialRole)

  function handleSelect(role: UserRole) {
    setSelected(role)
    onRoleChange?.(role)
  }

  const activeMeta = ROLES.find((r) => r.id === selected)

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ink">{t('roles.title')}</h1>
        <p className="mt-1 text-sm text-ink-muted">{t('roles.subtitle')}</p>
      </div>

      {/* Role grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {ROLES.map(({ id, icon: Icon, color, bg }) => {
          const isActive = selected === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => handleSelect(id)}
              className={`group flex flex-col items-center gap-2 rounded-2xl border-2 px-3 py-5 text-center transition ${
                isActive
                  ? 'border-brand-400 bg-brand-50 shadow-card'
                  : 'border-transparent bg-white shadow-sm hover:border-slate-200 hover:shadow-card'
              }`}
            >
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${bg}`}>
                <Icon className={`h-6 w-6 ${color}`} />
              </div>
              <span className={`text-sm font-semibold ${isActive ? 'text-brand-700' : 'text-ink'}`}>
                {t(`roles.${id}`)}
              </span>
              {isActive && <CheckCircle className="h-4 w-4 text-brand-500" />}
            </button>
          )
        })}
      </div>

      {/* Insight panel */}
      {activeMeta && (
        <div className="mt-6 rounded-2xl border border-brand-100 bg-white p-6 shadow-card">
          <div className="mb-4 flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${activeMeta.bg}`}>
              <activeMeta.icon className={`h-5 w-5 ${activeMeta.color}`} />
            </div>
            <div>
              <p className="text-xs font-medium text-ink-muted">{t('roles.selectedRole')}</p>
              <p className="text-base font-bold text-ink">{t(`roles.${activeMeta.id}`)}</p>
            </div>
          </div>

          <div className="mb-4 grid grid-cols-3 gap-3">
            {activeMeta.kpis.map(({ labelKey, value, icon: KpiIcon }) => (
              <div key={labelKey} className="rounded-xl bg-slate-50 p-3">
                <KpiIcon className="mb-1 h-4 w-4 text-ink-muted" />
                <p className="text-lg font-bold text-ink">{value}</p>
                <p className="text-xs text-ink-muted">{t(labelKey)}</p>
              </div>
            ))}
          </div>

          <div className="rounded-xl bg-brand-50 px-4 py-3">
            <p className="text-sm font-semibold text-brand-700">{t('roles.yourInsights')}</p>
            <p className="mt-1 text-sm leading-relaxed text-brand-600">{t(activeMeta.insightKey)}</p>
          </div>

          <button
            type="button"
            onClick={() => handleSelect('')}
            className="mt-4 text-xs text-ink-muted underline-offset-2 hover:underline"
          >
            {t('roles.changeRole')}
          </button>
        </div>
      )}

      {!selected && (
        <p className="mt-6 text-center text-sm text-ink-muted">{t('roles.subtitle')}</p>
      )}
    </div>
  )
}

export default RolesView
