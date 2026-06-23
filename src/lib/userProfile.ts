import { useState, useCallback } from 'react'

export type UserRole =
  | 'privateDriver'
  | 'taxiDriver'
  | 'transitRider'
  | 'cyclist'
  | 'pedestrian'
  | 'police'
  | 'emergency'
  | 'logistics'
  | ''

export interface UserProfile {
  role: UserRole
  advancedMetrics: boolean
  memberSince: string
}

const STORAGE_KEY = 'trafiqo.profile'

const INITIAL: UserProfile = {
  role: '',
  advancedMetrics: false,
  memberSince: new Date().toISOString(),
}

function load(): UserProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as UserProfile) : INITIAL
  } catch {
    return INITIAL
  }
}

function persist(p: UserProfile) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(p))
}

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile>(load)

  const updateProfile = useCallback((partial: Partial<UserProfile>) => {
    setProfile((prev) => {
      const next = { ...prev, ...partial }
      persist(next)
      return next
    })
  }, [])

  return { profile, updateProfile }
}
