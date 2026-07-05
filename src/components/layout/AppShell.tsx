import { useState } from 'react'
import Header from './Header'
import Footer from './Footer'
import MapView from '@/components/map/MapView'
import RoutesView from '@/components/routes/RoutesView'
import RolesView from '@/components/roles/RolesView'
import BehaviorPredictionPanel from '@/components/behavior/BehaviorPredictionPanel'
import MetricsView from '@/components/metrics/MetricsView'
import RewardsView from '@/components/rewards/RewardsView'
import ProfileView from '@/components/profile/ProfileView'
import CityControlView from '@/components/citycontrol/CityControlView'
import TrustView from '@/components/trust/TrustView'
import FeedbackModal from '@/components/common/FeedbackModal'
import { type AppView } from './views'
import { useUserProfile } from '@/lib/userProfile'
import { useGamification } from '@/lib/gamification'

export function AppShell() {
  const [view, setView] = useState<AppView>('dashboard')
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const { profile, updateProfile } = useUserProfile()
  const { points } = useGamification()

  const showMap = view === 'dashboard' || view === 'map'

  function renderView() {
    if (showMap) return <MapView />
    switch (view) {
      case 'routes': return <RoutesView />
      case 'roles': return <RolesView initialRole={profile.role} onRoleChange={(r) => updateProfile({ role: r })} />
      case 'behavior': return <BehaviorPredictionPanel initialRole={profile.role} onRoleChange={(r) => updateProfile({ role: r })} />
      case 'metrics': return <MetricsView />
      case 'rewards': return <RewardsView />
      case 'profile': return <ProfileView />
      case 'cityControl': return <CityControlView />
      case 'trust': return <TrustView />
      default: return <MapView />
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Header activeView={view} onNavigate={setView} points={points} />
      <main className="flex flex-1 flex-col">
        {renderView()}
      </main>
      <Footer onNavigate={setView} onFeedback={() => setFeedbackOpen(true)} />
      <FeedbackModal open={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
    </div>
  )
}

export default AppShell
