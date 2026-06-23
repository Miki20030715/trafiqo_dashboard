import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Map, Route, Users, Gauge, Trophy, ShieldCheck, Building2, LayoutGrid } from 'lucide-react'
import Header from './Header'
import Footer from './Footer'
import MapView from '@/components/map/MapView'
import { type AppView } from './views'

const VIEW_META: Record<Exclude<AppView, 'dashboard' | 'profile'>, { icon: typeof Map; labelKey: string }> = {
  map: { icon: Map, labelKey: 'nav.map' },
  routes: { icon: Route, labelKey: 'nav.routes' },
  roles: { icon: Users, labelKey: 'nav.roles' },
  metrics: { icon: Gauge, labelKey: 'nav.metrics' },
  rewards: { icon: Trophy, labelKey: 'nav.rewards' },
  cityControl: { icon: Building2, labelKey: 'nav.cityControl' },
  trust: { icon: ShieldCheck, labelKey: 'nav.trust' },
}

/** Temporary placeholder shown for modules that later build steps will implement. */
function ViewPlaceholder({ view }: { view: AppView }) {
  const { t } = useTranslation()
  const meta = view in VIEW_META ? VIEW_META[view as keyof typeof VIEW_META] : null
  const Icon = meta?.icon ?? LayoutGrid
  const label = meta ? t(meta.labelKey) : view

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-500">
        <Icon className="h-8 w-8" />
      </div>
      <h2 className="mt-5 text-xl font-bold text-ink">{label}</h2>
      <p className="mt-2 text-sm text-ink-muted">{t('common.comingSoon')}</p>
    </div>
  )
}

export function AppShell() {
  const [view, setView] = useState<AppView>('dashboard')

  // The Budapest map is the centerpiece — it fills the main area on the dashboard and map views.
  const showMap = view === 'dashboard' || view === 'map'

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Header activeView={view} onNavigate={setView} />
      <main className="flex flex-1 flex-col">
        {showMap ? <MapView /> : <ViewPlaceholder view={view} />}
      </main>
      <Footer onNavigate={setView} />
    </div>
  )
}

export default AppShell
