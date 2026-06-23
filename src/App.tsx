import { useAuth } from '@/auth/AuthContext'
import LoginScreen from '@/auth/LoginScreen'
import AppShell from '@/components/layout/AppShell'
import { Loader2 } from 'lucide-react'

export default function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
      </div>
    )
  }

  return user ? <AppShell /> : <LoginScreen />
}
