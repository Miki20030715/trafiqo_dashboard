import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { env, hasSupabase } from './env'

/**
 * Supabase client — created only when both URL and anon key are present.
 * When null, the app uses its mock-auth fallback (see AuthContext).
 */
export const supabase: SupabaseClient | null = hasSupabase()
  ? createClient(env.supabaseUrl, env.supabaseAnonKey)
  : null
