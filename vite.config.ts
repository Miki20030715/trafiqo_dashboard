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
  server: {
    host: true,
    port: 5173,
  },
})
