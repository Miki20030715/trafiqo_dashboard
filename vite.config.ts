import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

// https://vitejs.dev/config/
// On GitHub Pages the app is served from /<repo>/, so we set base accordingly
// only for that build (GITHUB_PAGES=true). Local dev and other builds use '/'.
export default defineConfig({
  base: process.env.GITHUB_PAGES === 'true' ? '/trafiqo_dashboard/' : '/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          leaflet: ['leaflet', 'react-leaflet'],
          i18n: ['i18next', 'react-i18next'],
          supabase: ['@supabase/supabase-js'],
          charts: ['recharts'],
        },
      },
    },
  },
  server: {
    host: true,
    port: 5173,
  },
})
