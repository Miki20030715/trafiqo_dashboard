import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Trophy, Target, BarChart2, ShoppingBag, History, CheckCircle } from 'lucide-react'
import { useGamification, GOALS, REWARDS, SCOREBOARD, type RankTier } from '@/lib/gamification'

type Tab = 'goals' | 'scoreboard' | 'marketplace' | 'history'

const TABS: { id: Tab; icon: typeof Trophy; labelKey: string }[] = [
  { id: 'goals', icon: Target, labelKey: 'rewards.goals' },
  { id: 'scoreboard', icon: BarChart2, labelKey: 'rewards.scoreboard' },
  { id: 'marketplace', icon: ShoppingBag, labelKey: 'rewards.marketplace' },
  { id: 'history', icon: History, labelKey: 'rewards.history' },
]

const RANK_LABELS: Record<RankTier, string> = {
  bronze: 'rewards.bronzeRank',
  silver: 'rewards.silverRank',
  gold: 'rewards.goldRank',
  platinum: 'rewards.platinumRank',
}

const RANK_COLORS: Record<RankTier, string> = {
  bronze: 'text-amber-700 bg-amber-50 ring-amber-200',
  silver: 'text-slate-600 bg-slate-100 ring-slate-200',
  gold: 'text-yellow-700 bg-yellow-50 ring-yellow-200',
  platinum: 'text-brand-700 bg-brand-50 ring-brand-200',
}

function LevelBadge({ rank, level }: { rank: RankTier; level: number }) {
  const { t } = useTranslation()
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ring-1 ${RANK_COLORS[rank]}`}>
      <Trophy className="h-3.5 w-3.5" />
      {t(RANK_LABELS[rank])} · Lvl {level}
    </span>
  )
}

function GoalsTab() {
  const { t } = useTranslation()
  const { state } = useGamification()

  return (
    <div className="flex flex-col gap-3">
      {GOALS.map((goal) => {
        const progress = state.goalProgress[goal.id] ?? 0
        const completed = state.completedGoals.includes(goal.id)
        const pct = Math.min(100, Math.round((progress / goal.target) * 100))
        return (
          <div key={goal.id} className="rounded-2xl bg-white p-4 shadow-card">
            <div className="mb-2 flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                {completed ? (
                  <CheckCircle className="h-5 w-5 shrink-0 text-green-500" />
                ) : (
                  <Target className="h-5 w-5 shrink-0 text-brand-400" />
                )}
                <p className="text-sm font-semibold text-ink">{goal.titleKey}</p>
              </div>
              <span className={`shrink-0 rounded-lg px-2 py-0.5 text-xs font-bold ${
                completed ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
              }`}>
                +{goal.earnedPoints} {t('rewards.pts')}
              </span>
            </div>
            <div className="mb-1 flex items-center justify-between text-xs text-ink-muted">
              <span>{t('rewards.goalProgress')}</span>
              <span>{completed ? t('rewards.goalComplete') : `${progress} / ${goal.target} ${goal.unit}`}</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-2 rounded-full transition-all ${completed ? 'bg-green-500' : 'bg-brand-500'}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )
      })}

      {/* Earn actions */}
      <div className="mt-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-muted">{t('rewards.earnActions')}</p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {[
            { label: t('rewards.earnTripLabel'), pts: t('rewards.earnTripPts') },
            { label: t('rewards.earnEcoLabel'), pts: t('rewards.earnEcoPts') },
            { label: t('rewards.earnPeakLabel'), pts: t('rewards.earnPeakPts') },
            { label: t('rewards.earnShareLabel'), pts: t('rewards.earnSharePts') },
            { label: t('rewards.earnFeedbackLabel'), pts: t('rewards.earnFeedbackPts') },
          ].map(({ label, pts }) => (
            <div key={label} className="flex items-center justify-between rounded-xl bg-white px-3 py-2 shadow-sm">
              <span className="text-sm text-ink">{label}</span>
              <span className="text-sm font-bold text-amber-600">{pts}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function ScoreboardTab() {
  const { t, i18n } = useTranslation()
  const { state } = useGamification()
  const lang = i18n.language

  const board = SCOREBOARD.map((e) => (e.isYou ? { ...e, points: state.points, name: t('rewards.youLabel') } : e))
    .sort((a, b) => b.points - a.points)
    .map((e, i) => ({ ...e, rank: i + 1 }))

  return (
    <div className="rounded-2xl bg-white shadow-card overflow-hidden">
      {board.map((entry) => (
        <div
          key={entry.rank}
          className={`flex items-center gap-3 px-5 py-3.5 ${entry.isYou ? 'bg-brand-50' : 'odd:bg-slate-50/50'} border-b border-slate-100 last:border-0`}
        >
          <span className={`w-6 text-center text-sm font-bold ${entry.rank <= 3 ? 'text-amber-500' : 'text-ink-muted'}`}>
            {entry.rank <= 3 ? ['🥇', '🥈', '🥉'][entry.rank - 1] : entry.rank}
          </span>
          <span className={`flex-1 text-sm font-medium ${entry.isYou ? 'font-bold text-brand-700' : 'text-ink'}`}>
            {entry.name}
          </span>
          <span className={`text-sm font-semibold ${entry.isYou ? 'text-brand-700' : 'text-ink-muted'}`}>
            {lang === 'hu' ? `${entry.points} pt` : `${entry.points} pts`}
          </span>
        </div>
      ))}
    </div>
  )
}

function MarketplaceTab() {
  const { t } = useTranslation()
  const { state, redeemReward, points } = useGamification()
  const [justRedeemed, setJustRedeemed] = useState<string | null>(null)

  function handleRedeem(reward: (typeof REWARDS)[0]) {
    if (state.redeemedRewards.includes(reward.id)) return
    if (points < reward.pointCost) return
    const ok = redeemReward(reward, reward.nameKey)
    if (ok) {
      setJustRedeemed(reward.id)
      setTimeout(() => setJustRedeemed(null), 2000)
    }
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {REWARDS.map((reward) => {
        const redeemed = state.redeemedRewards.includes(reward.id)
        const affordable = points >= reward.pointCost
        const isFlashing = justRedeemed === reward.id

        return (
          <div key={reward.id} className="flex flex-col rounded-2xl bg-white p-5 shadow-card">
            <div className="mb-3 flex items-start justify-between">
              <span className="text-3xl">{reward.emoji}</span>
              <span className={`rounded-lg px-2 py-0.5 text-xs font-bold ${affordable && !redeemed ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                {reward.pointCost} {t('rewards.pts')}
              </span>
            </div>
            <p className="text-sm font-bold text-ink">{reward.nameKey}</p>
            <p className="mt-0.5 text-xs text-ink-muted">{reward.descKey}</p>
            <button
              type="button"
              onClick={() => handleRedeem(reward)}
              disabled={redeemed || !affordable}
              className={`mt-4 rounded-xl py-2 text-sm font-semibold transition ${
                redeemed
                  ? 'bg-green-50 text-green-700 cursor-default'
                  : !affordable
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : isFlashing
                  ? 'bg-green-500 text-white'
                  : 'bg-brand-500 text-white hover:bg-brand-600'
              }`}
            >
              {redeemed
                ? `✓ ${t('rewards.redeemed')}`
                : !affordable
                ? t('rewards.notEnoughPoints')
                : isFlashing
                ? `✓ ${t('rewards.redeemed')}!`
                : t('rewards.redeem')}
            </button>
          </div>
        )
      })}
    </div>
  )
}

function HistoryTab() {
  const { t } = useTranslation()
  const { state } = useGamification()

  if (state.redemptionHistory.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl bg-white py-12 text-center shadow-card">
        <History className="h-8 w-8 text-ink-muted" />
        <p className="text-sm text-ink-muted">{t('rewards.noHistory')}</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl bg-white shadow-card overflow-hidden">
      {state.redemptionHistory.map((rec) => (
        <div key={rec.id} className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-3.5 last:border-0">
          <div>
            <p className="text-sm font-medium text-ink">{rec.rewardName}</p>
            <p className="text-xs text-ink-muted">{new Date(rec.date).toLocaleDateString()}</p>
          </div>
          <span className="text-sm font-semibold text-red-500">−{rec.points} {t('rewards.pts')}</span>
        </div>
      ))}
    </div>
  )
}

export function RewardsView() {
  const { t } = useTranslation()
  const { points, level, rank, pointsToNext } = useGamification()
  const [tab, setTab] = useState<Tab>('goals')

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-6 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 p-6 text-white shadow-card">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-white/70">{t('rewards.balance')}</p>
            <p className="mt-0.5 text-4xl font-extrabold">{points}</p>
            <p className="text-sm text-white/70">{t('rewards.points')}</p>
          </div>
          <LevelBadge rank={rank} level={level} />
        </div>
        <div className="mt-4">
          <div className="mb-1 flex justify-between text-xs text-white/70">
            <span>{t('rewards.nextLevel')}</span>
            <span>{pointsToNext} {t('rewards.pointsToNext')}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-white/20">
            <div
              className="h-2 rounded-full bg-white transition-all"
              style={{ width: `${100 - (pointsToNext / 100) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-5 flex gap-1 rounded-xl bg-slate-100 p-1">
        {TABS.map(({ id, icon: Icon, labelKey }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium transition ${
              tab === id ? 'bg-white text-ink shadow-sm' : 'text-ink-muted hover:text-ink'
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t(labelKey)}</span>
          </button>
        ))}
      </div>

      {tab === 'goals' && <GoalsTab />}
      {tab === 'scoreboard' && <ScoreboardTab />}
      {tab === 'marketplace' && <MarketplaceTab />}
      {tab === 'history' && <HistoryTab />}
    </div>
  )
}

export default RewardsView
