import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './i18n'
import 'leaflet/dist/leaflet.css'
import './index.css'
import App from './App'
import { AuthProvider } from '@/auth/AuthContext'
import { GamificationProvider } from '@/lib/gamification'
import { ThemeProvider } from '@/lib/theme'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <GamificationProvider>
          <App />
        </GamificationProvider>
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>,
)
