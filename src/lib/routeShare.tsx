import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import type { RoutePoint, TravelMode } from './routing'

/** The most recently searched route, shared from Route planning to Road stats. */
export interface SharedRoute {
  origin: RoutePoint
  dest: RoutePoint
  mode: TravelMode
}

interface RouteShareValue {
  route: SharedRoute | null
  setRoute: (r: SharedRoute | null) => void
}

const RouteShareContext = createContext<RouteShareValue | null>(null)

export function RouteShareProvider({ children }: { children: ReactNode }) {
  const [route, setRouteState] = useState<SharedRoute | null>(null)
  const setRoute = useCallback((r: SharedRoute | null) => setRouteState(r), [])
  return (
    <RouteShareContext.Provider value={{ route, setRoute }}>{children}</RouteShareContext.Provider>
  )
}

export function useRouteShare(): RouteShareValue {
  const ctx = useContext(RouteShareContext)
  if (!ctx) throw new Error('useRouteShare must be used within <RouteShareProvider>')
  return ctx
}
