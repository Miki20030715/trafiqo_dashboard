import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

export type RankTier = 'bronze' | 'silver' | 'gold' | 'platinum'

export interface Goal {
  id: string
  titleKey: string
  target: number
  unit: string
  earnedPoints: number
  category: 'trip' | 'eco' | 'social' | 'peak'
}

export interface RewardItem {
  id: string
  nameKey: string
  descKey: string
  pointCost: number
  category: 'transport' | 'food' | 'culture' | 'green'
  emoji: string
}

export interface RedemptionRecord {
  id: string
  rewardId: string
  rewardName: string
  points: number
  date: string
}

export interface ScoreboardEntry {
  rank: number
  name: string
  points: number
  isYou?: boolean
}

export interface GamificationState {
  points: number
  completedGoals: string[]
  redeemedRewards: string[]
  redemptionHistory: RedemptionRecord[]
  goalProgress: Record<string, number>
}

export const GOALS: Goal[] = [
  { id: 'goal_first_trip', titleKey: 'Complete your first trip', target: 1, unit: 'trip', earnedPoints: 50, category: 'trip' },
  { id: 'goal_5_trips', titleKey: '5 trips completed', target: 5, unit: 'trips', earnedPoints: 100, category: 'trip' },
  { id: 'goal_10_eco', titleKey: '10 eco-mode trips', target: 10, unit: 'eco trips', earnedPoints: 250, category: 'eco' },
  { id: 'goal_avoid_peak', titleKey: 'Avoid peak hours 5×', target: 5, unit: 'times', earnedPoints: 75, category: 'peak' },
  { id: 'goal_share_route', titleKey: 'Share 3 routes', target: 3, unit: 'routes', earnedPoints: 60, category: 'social' },
  { id: 'goal_green_week', titleKey: 'Green score ≥ 80 for 7 days', target: 7, unit: 'days', earnedPoints: 300, category: 'eco' },
]

export const REWARDS: RewardItem[] = [
  { id: 'bkk_day', nameKey: 'BKK day pass', descKey: 'Free 1-day Budapest transit pass', pointCost: 200, category: 'transport', emoji: '🚌' },
  { id: 'bkk_week', nameKey: 'BKK weekly pass', descKey: 'Free 7-day Budapest transit pass', pointCost: 800, category: 'transport', emoji: '🚇' },
  { id: 'bike_hour', nameKey: 'MOL Bubi 1 hour', descKey: '1 hour free bike rental', pointCost: 150, category: 'transport', emoji: '🚲' },
  { id: 'cafe_voucher', nameKey: '500 Ft café voucher', descKey: 'Partner café discount', pointCost: 100, category: 'food', emoji: '☕' },
  { id: 'museum_ticket', nameKey: 'Museum entry', descKey: 'Free entry to partner museums', pointCost: 300, category: 'culture', emoji: '🏛️' },
  { id: 'tree_plant', nameKey: 'Plant a tree', descKey: 'Trafiqo plants a tree in Budapest on your behalf', pointCost: 500, category: 'green', emoji: '🌳' },
]

export const SCOREBOARD: ScoreboardEntry[] = [
  { rank: 1, name: 'Kovács Anna', points: 1840 },
  { rank: 2, name: 'Tóth Gábor', points: 1620 },
  { rank: 3, name: 'Nagy Péter', points: 1410 },
  { rank: 4, name: 'Szabó Eszter', points: 1290 },
  { rank: 5, name: 'Varga Bence', points: 1150 },
  { rank: 6, name: 'Horváth Réka', points: 980 },
  { rank: 7, name: 'Molnár Dávid', points: 820 },
  { rank: 8, name: 'Kiss Lili', points: 710 },
  { rank: 9, name: 'You', points: 340, isYou: true },
  { rank: 10, name: 'Fekete Ádám', points: 290 },
]

function getRank(points: number): RankTier {
  if (points >= 1000) return 'platinum'
  if (points >= 500) return 'gold'
  if (points >= 200) return 'silver'
  return 'bronze'
}

function getLevel(points: number): number {
  return Math.floor(points / 100) + 1
}

function getPointsToNext(points: number): number {
  return 100 - (points % 100)
}

const STORAGE_KEY = 'trafiqo.gamification'

const INITIAL_STATE: GamificationState = {
  points: 340,
  completedGoals: ['goal_first_trip'],
  redeemedRewards: [],
  redemptionHistory: [],
  goalProgress: {
    goal_first_trip: 1,
    goal_5_trips: 3,
    goal_10_eco: 6,
    goal_avoid_peak: 2,
    goal_share_route: 1,
    goal_green_week: 4,
  },
}

function loadState(): GamificationState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as GamificationState) : INITIAL_STATE
  } catch {
    return INITIAL_STATE
  }
}

function persistState(state: GamificationState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

interface GamificationContextValue {
  state: GamificationState
  points: number
  level: number
  rank: RankTier
  pointsToNext: number
  redeemReward: (reward: RewardItem, rewardName: string) => boolean
  addPoints: (amount: number) => void
}

const GamificationContext = createContext<GamificationContextValue | null>(null)

export function GamificationProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GamificationState>(loadState)

  const update = useCallback((updater: (prev: GamificationState) => GamificationState) => {
    setState((prev) => {
      const next = updater(prev)
      persistState(next)
      return next
    })
  }, [])

  const redeemReward = useCallback(
    (reward: RewardItem, rewardName: string): boolean => {
      let success = false
      update((prev) => {
        if (prev.redeemedRewards.includes(reward.id)) return prev
        if (prev.points < reward.pointCost) return prev
        success = true
        const record: RedemptionRecord = {
          id: `${reward.id}_${Date.now()}`,
          rewardId: reward.id,
          rewardName,
          points: reward.pointCost,
          date: new Date().toISOString(),
        }
        return {
          ...prev,
          points: prev.points - reward.pointCost,
          redeemedRewards: [...prev.redeemedRewards, reward.id],
          redemptionHistory: [record, ...prev.redemptionHistory],
        }
      })
      return success
    },
    [update],
  )

  const addPoints = useCallback(
    (amount: number) => {
      update((prev) => ({ ...prev, points: prev.points + amount }))
    },
    [update],
  )

  const value: GamificationContextValue = {
    state,
    points: state.points,
    level: getLevel(state.points),
    rank: getRank(state.points),
    pointsToNext: getPointsToNext(state.points),
    redeemReward,
    addPoints,
  }

  return <GamificationContext.Provider value={value}>{children}</GamificationContext.Provider>
}

export function useGamification() {
  const ctx = useContext(GamificationContext)
  if (!ctx) throw new Error('useGamification must be used inside GamificationProvider')
  return ctx
}
