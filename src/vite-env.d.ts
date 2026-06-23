/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** TomTom API key — traffic flow tiles + routing. Falls back to behavioural model layer if absent. */
  readonly VITE_TOMTOM_KEY?: string
  /** Supabase project URL — optional; mock auth is used when absent. */
  readonly VITE_SUPABASE_URL?: string
  /** Supabase anon key — optional; mock auth is used when absent. */
  readonly VITE_SUPABASE_ANON_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
