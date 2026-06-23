import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { User, Mail, Shield, Settings, CheckCircle, LogOut } from 'lucide-react'
import { useAuth } from '@/auth/AuthContext'
import LanguageToggle from '@/components/common/LanguageToggle'
import { useUserProfile, type UserRole } from '@/lib/userProfile'
import { useGamification } from '@/lib/gamification'

const ROLE_OPTIONS: UserRole[] = [
  'privateDriver', 'taxiDriver', 'transitRider', 'cyclist',
  'pedestrian', 'police', 'emergency', 'logistics',
]

export function ProfileView() {
  const { t } = useTranslation()
  const { user, signOut } = useAuth()
  const { profile, updateProfile } = useUserProfile()
  const { points, level } = useGamification()
  const [editing, setEditing] = useState(false)
  const [draftName, setDraftName] = useState(user?.name ?? '')
  const [saved, setSaved] = useState(false)

  function handleSave() {
    updateProfile({})
    setEditing(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  function handleDiscard() {
    setDraftName(user?.name ?? '')
    setEditing(false)
  }

  const initials = (user?.name ?? user?.email ?? '?').slice(0, 2).toUpperCase()
  const memberDate = new Date(profile.memberSince).toLocaleDateString()

  return (
    <div className="mx-auto max-w-xl px-4 py-8 sm:px-6">
      <h1 className="mb-6 text-2xl font-bold text-ink">{t('profile.title')}</h1>

      {/* Avatar + summary */}
      <div className="mb-6 flex items-center gap-5 rounded-2xl bg-white p-6 shadow-card">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-500 text-2xl font-extrabold text-white">
          {initials}
        </div>
        <div className="flex-1">
          <p className="text-lg font-bold text-ink">{user?.name ?? user?.email}</p>
          <p className="text-sm text-ink-muted">{user?.email}</p>
          <div className="mt-2 flex items-center gap-2 text-xs text-ink-muted">
            <span>{t('profile.memberSince')} {memberDate}</span>
            <span>·</span>
            <span className="font-semibold text-amber-600">{points} pts · Lvl {level}</span>
          </div>
        </div>
      </div>

      {/* Profile fields */}
      <div className="mb-4 rounded-2xl bg-white p-6 shadow-card">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink">{t('profile.editProfile')}</h2>
          {!editing && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-ink-soft hover:bg-slate-200"
            >
              {t('common.edit')}
            </button>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <label className="mb-1 flex items-center gap-1.5 text-xs font-medium text-ink-muted">
              <User className="h-3.5 w-3.5" /> {t('profile.name')}
            </label>
            {editing ? (
              <input
                type="text"
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-ink focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
              />
            ) : (
              <p className="text-sm text-ink">{user?.name ?? '—'}</p>
            )}
          </div>

          <div>
            <label className="mb-1 flex items-center gap-1.5 text-xs font-medium text-ink-muted">
              <Mail className="h-3.5 w-3.5" /> {t('profile.email')}
            </label>
            <p className="text-sm text-ink">{user?.email ?? '—'}</p>
          </div>

          <div>
            <label className="mb-1 flex items-center gap-1.5 text-xs font-medium text-ink-muted">
              <Shield className="h-3.5 w-3.5" /> {t('profile.role')}
            </label>
            {editing ? (
              <select
                value={profile.role}
                onChange={(e) => updateProfile({ role: e.target.value as UserRole })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-ink focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
              >
                <option value="">—</option>
                {ROLE_OPTIONS.map((r) => (
                  <option key={r} value={r}>{t(`roles.${r}`)}</option>
                ))}
              </select>
            ) : (
              <p className="text-sm text-ink">{profile.role ? t(`roles.${profile.role}`) : '—'}</p>
            )}
          </div>
        </div>

        {editing && (
          <div className="mt-5 flex gap-2">
            <button
              type="button"
              onClick={handleSave}
              className="flex-1 rounded-xl bg-brand-500 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600"
            >
              {t('profile.saveChanges')}
            </button>
            <button
              type="button"
              onClick={handleDiscard}
              className="rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-medium text-ink-soft hover:bg-slate-200"
            >
              {t('profile.discardChanges')}
            </button>
          </div>
        )}

        {saved && (
          <div className="mt-3 flex items-center gap-2 text-sm text-green-700">
            <CheckCircle className="h-4 w-4" /> {t('profile.saved')}
          </div>
        )}
      </div>

      {/* Preferences */}
      <div className="mb-4 rounded-2xl bg-white p-6 shadow-card">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-ink">
          <Settings className="h-4 w-4" />
          {t('profile.preferences')}
        </h2>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-ink">{t('profile.advancedMetrics')}</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={profile.advancedMetrics}
            onClick={() => updateProfile({ advancedMetrics: !profile.advancedMetrics })}
            className={`relative h-6 w-11 rounded-full transition-colors focus:outline-none ${profile.advancedMetrics ? 'bg-brand-500' : 'bg-slate-200'}`}
          >
            <span
              className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${profile.advancedMetrics ? 'translate-x-5' : ''}`}
            />
          </button>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
          <p className="text-sm font-medium text-ink">{t('profile.language')}</p>
          <LanguageToggle />
        </div>
      </div>

      {/* Sign out */}
      <div className="rounded-2xl bg-white p-6 shadow-card">
        <h2 className="mb-4 text-sm font-semibold text-ink">{t('profile.dangerZone')}</h2>
        <button
          type="button"
          onClick={() => void signOut()}
          className="inline-flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-100"
        >
          <LogOut className="h-4 w-4" />
          {t('profile.signOut')}
        </button>
      </div>
    </div>
  )
}

export default ProfileView
