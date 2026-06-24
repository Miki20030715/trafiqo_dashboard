import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { supabase } from '@/lib/supabase'
import { hasSupabase } from '@/lib/env'

export interface AuthUser {
  id: string
  name: string
  email: string
  /** True for the local demo/guest session (never backed by Supabase). */
  isGuest: boolean
}

interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  /** Whether real Supabase auth is wired up (keys present). */
  usingSupabase: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (name: string, email: string, password: string) => Promise<void>
  signInAsGuest: () => void
  signOut: () => Promise<void>
  updateName: (name: string) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

const MOCK_KEY = 'trafiqo.auth.user'

function nameFromEmail(email: string): string {
  const local = email.split('@')[0] ?? 'felhasználó'
  return local
    .replace(/[._-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim()
}

function readMockUser(): AuthUser | null {
  try {
    const raw = window.localStorage.getItem(MOCK_KEY)
    return raw ? (JSON.parse(raw) as AuthUser) : null
  } catch {
    return null
  }
}

function writeMockUser(user: AuthUser | null) {
  if (user) window.localStorage.setItem(MOCK_KEY, JSON.stringify(user))
  else window.localStorage.removeItem(MOCK_KEY)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const usingSupabase = hasSupabase() && supabase !== null
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    if (usingSupabase && supabase) {
      supabase.auth.getSession().then(({ data }) => {
        if (!active) return
        const u = data.session?.user
        setUser(
          u
            ? {
                id: u.id,
                email: u.email ?? '',
                name: (u.user_metadata?.name as string) ?? nameFromEmail(u.email ?? ''),
                isGuest: false,
              }
            : null,
        )
        setLoading(false)
      })

      const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
        const u = session?.user
        setUser(
          u
            ? {
                id: u.id,
                email: u.email ?? '',
                name: (u.user_metadata?.name as string) ?? nameFromEmail(u.email ?? ''),
                isGuest: false,
              }
            : null,
        )
      })
      return () => {
        active = false
        sub.subscription.unsubscribe()
      }
    }

    // Mock fallback: restore any persisted local session.
    setUser(readMockUser())
    setLoading(false)
    return () => {
      active = false
    }
  }, [usingSupabase])

  const signIn = async (email: string, password: string) => {
    if (usingSupabase && supabase) {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      return
    }
    const mock: AuthUser = {
      id: `mock-${Date.now()}`,
      email,
      name: nameFromEmail(email),
      isGuest: false,
    }
    writeMockUser(mock)
    setUser(mock)
  }

  const signUp = async (name: string, email: string, password: string) => {
    if (usingSupabase && supabase) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } },
      })
      if (error) throw error
      return
    }
    const mock: AuthUser = {
      id: `mock-${Date.now()}`,
      email,
      name: name || nameFromEmail(email),
      isGuest: false,
    }
    writeMockUser(mock)
    setUser(mock)
  }

  const signInAsGuest = () => {
    const guest: AuthUser = {
      id: 'guest',
      email: 'guest@trafiqo.demo',
      name: 'Vendég',
      isGuest: true,
    }
    writeMockUser(guest)
    setUser(guest)
  }

  const signOut = async () => {
    if (usingSupabase && supabase && user && !user.isGuest) {
      await supabase.auth.signOut()
    }
    writeMockUser(null)
    setUser(null)
  }

  const updateName = async (name: string) => {
    if (usingSupabase && supabase && user && !user.isGuest) {
      const { error } = await supabase.auth.updateUser({ data: { name } })
      if (error) throw error
    }
    setUser((prev) => {
      if (!prev) return prev
      const updated = { ...prev, name }
      writeMockUser(updated)
      return updated
    })
  }

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, usingSupabase, signIn, signUp, signInAsGuest, signOut, updateName }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, loading, usingSupabase],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>')
  return ctx
}
