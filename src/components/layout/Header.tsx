import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Menu, X, Trophy, Building2, User, LogOut, ChevronDown } from 'lucide-react'
import TrafiqoLogo from '@/components/brand/TrafiqoLogo'
import LanguageToggle from '@/components/common/LanguageToggle'
import { useAuth } from '@/auth/AuthContext'
import { PRIMARY_NAV, type AppView } from './views'

interface HeaderProps {
  activeView: AppView
  onNavigate: (view: AppView) => void
  /** Placeholder until gamification (step 6) wires a live balance. */
  points?: number
}

export function Header({ activeView, onNavigate, points = 0 }: HeaderProps) {
  const { t } = useTranslation()
  const { user, signOut } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userOpen, setUserOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const navBtn = (view: AppView, label: string) => {
    const active = activeView === view
    return (
      <button
        key={view}
        type="button"
        onClick={() => {
          onNavigate(view)
          setMobileOpen(false)
        }}
        className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
          active ? 'bg-brand-50 text-brand-700' : 'text-ink-soft hover:bg-slate-100 hover:text-ink'
        }`}
      >
        {label}
      </button>
    )
  }

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
        {/* Logo → home */}
        <button
          type="button"
          onClick={() => onNavigate('dashboard')}
          className="shrink-0"
          aria-label="Trafiqo"
        >
          <TrafiqoLogo markClassName="h-8 w-8" wordmarkClassName="h-6" />
        </button>

        {/* Desktop nav */}
        <nav className="ml-2 hidden items-center gap-0.5 lg:flex">
          {PRIMARY_NAV.map((item) => navBtn(item.view, t(item.labelKey)))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {/* City control toggle */}
          <button
            type="button"
            onClick={() => onNavigate('cityControl')}
            className={`hidden items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition sm:inline-flex ${
              activeView === 'cityControl'
                ? 'bg-brand-50 text-brand-700'
                : 'text-ink-soft hover:bg-slate-100'
            }`}
          >
            <Building2 className="h-4 w-4" />
            <span className="hidden xl:inline">{t('header.controlCenter')}</span>
          </button>

          {/* Points balance (placeholder until step 6) */}
          <div
            className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1.5 text-sm font-semibold text-amber-700 ring-1 ring-amber-100"
            title={t('header.points')}
          >
            <Trophy className="h-4 w-4" />
            {points}
          </div>

          <LanguageToggle className="hidden sm:inline-flex" />

          {/* User menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              type="button"
              onClick={() => setUserOpen((v) => !v)}
              className="inline-flex items-center gap-2 rounded-lg p-1.5 pr-2 hover:bg-slate-100"
              aria-label={t('header.userMenu')}
              aria-expanded={userOpen}
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-500 text-xs font-bold text-white">
                {(user?.name ?? '?').slice(0, 1).toUpperCase()}
              </span>
              <ChevronDown className="h-4 w-4 text-ink-muted" />
            </button>

            {userOpen && (
              <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card-hover">
                <div className="border-b border-slate-100 px-4 py-3">
                  <p className="truncate text-sm font-semibold text-ink">{user?.name}</p>
                  <p className="truncate text-xs text-ink-muted">{user?.email}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onNavigate('profile')
                    setUserOpen(false)
                  }}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-ink-soft hover:bg-slate-50"
                >
                  <User className="h-4 w-4" />
                  {t('header.profile')}
                </button>
                <div className="px-4 py-2 sm:hidden">
                  <LanguageToggle className="w-full justify-center" />
                </div>
                <button
                  type="button"
                  onClick={() => void signOut()}
                  className="flex w-full items-center gap-2.5 border-t border-slate-100 px-4 py-2.5 text-sm text-ink-soft hover:bg-slate-50"
                >
                  <LogOut className="h-4 w-4" />
                  {t('common.signOut')}
                </button>
              </div>
            )}
          </div>

          {/* Mobile nav toggle */}
          <button
            type="button"
            className="inline-flex rounded-lg p-2 text-ink-soft hover:bg-slate-100 lg:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? t('header.closeMenu') : t('header.openMenu')}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile nav drawer */}
      {mobileOpen && (
        <nav className="border-t border-slate-200 px-4 py-3 lg:hidden">
          <div className="grid grid-cols-2 gap-1">
            {PRIMARY_NAV.map((item) => navBtn(item.view, t(item.labelKey)))}
            {navBtn('cityControl', t('header.controlCenter'))}
          </div>
        </nav>
      )}
    </header>
  )
}

export default Header
