/**
 * Centralised, typed access to Vite env vars.
 * Keys are read ONLY from import.meta.env — never hardcoded.
 * Real values live in .env (gitignored). See .env.example for the key list.
 */

const read = (v: string | undefined): string => (v ?? '').trim()

export const env = {
  tomtomKey: read(import.meta.env.VITE_TOMTOM_KEY),
  supabaseUrl: read(import.meta.env.VITE_SUPABASE_URL),
  supabaseAnonKey: read(import.meta.env.VITE_SUPABASE_ANON_KEY),
} as const

/** True when a TomTom key is present — otherwise the app falls back to the behavioural model map layer. */
export const hasTomTom = (): boolean => env.tomtomKey.length > 0

/** True when Supabase is fully configured — otherwise the app uses mock auth. */
export const hasSupabase = (): boolean =>
  env.supabaseUrl.length > 0 && env.supabaseAnonKey.length > 0
