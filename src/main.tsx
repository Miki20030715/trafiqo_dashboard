import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './i18n'
import 'leaflet/dist/leaflet.css'
import './index.css'
import App from './App'
import { AuthProvider } from '@/auth/AuthContext'
import { GamificationProvider } from '@/lib/gamification'
import { ThemeProvider } from '@/lib/theme'
import { RouteShareProvider } from '@/lib/routeShare'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <GamificationProvider>
          <RouteShareProvider>
            <App />
          </RouteShareProvider>
        </GamificationProvider>
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>,
)
