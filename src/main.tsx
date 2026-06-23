import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './i18n'
import 'leaflet/dist/leaflet.css'
import './index.css'
import App from './App'
import { AuthProvider } from '@/auth/AuthContext'
import { GamificationProvider } from '@/lib/gamification'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <GamificationProvider>
        <App />
      </GamificationProvider>
    </AuthProvider>
  </StrictMode>,
)
