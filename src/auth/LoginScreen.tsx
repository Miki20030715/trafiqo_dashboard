import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { ShieldCheck, Users, Eye, ArrowRight, Loader2 } from 'lucide-react'
import { useAuth } from './AuthContext'
import TrafiqoLogo from '@/components/brand/TrafiqoLogo'
import LanguageToggle from '@/components/common/LanguageToggle'

type Mode = 'signin' | 'signup'

export function LoginScreen() {
  const { t } = useTranslation()
  const { signIn, signUp, signInAsGuest, usingSupabase } = useAuth()
  const [mode, setMode] = useState<Mode>('signin')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      if (mode === 'signin') await signIn(email, password)
      else await signUp(name, email, password)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-full flex-col lg:flex-row">
      {/* Brand panel */}
      <div className="relative flex flex-col justify-between overflow-hidden bg-gradient-to-br from-brand-500 via-brand-600 to-brand-700 px-8 py-10 text-white lg:w-[46%] lg:px-12 lg:py-14">
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-20 -left-10 h-72 w-72 rounded-full bg-orange-500/20 blur-3xl" />

        <div className="relative">
          <TrafiqoLogo tone="light" showTagline markClassName="h-10 w-10" wordmarkClassName="text-3xl" />
        </div>

        <div className="relative mt-10 max-w-md lg:mt-0">
          <p className="text-xl font-semibold leading-snug lg:text-2xl">
            {t('login.commercialHero')}
          </p>
          <ul className="mt-8 space-y-4 text-sm text-white/90">
            <li className="flex items-start gap-3">
              <Eye className="mt-0.5 h-5 w-5 shrink-0 text-white" />
              <span>{t('footer.decisionSupportNote')}</span>
            </li>
            <li className="flex items-start gap-3">
              <Users className="mt-0.5 h-5 w-5 shrink-0 text-white" />
              <span>{t('login.subtitle')}</span>
            </li>
            <li className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-white" />
              <span>
                {usingSupabase ? t('login.supabaseConnected') : t('login.demoBadge')}
              </span>
            </li>
          </ul>
        </div>

        <div className="relative mt-10 text-xs text-white/60">© {new Date().getFullYear()} Trafiqo</div>
      </div>

      {/* Form panel */}
      <div className="flex flex-1 flex-col px-6 py-10 sm:px-10 lg:px-16">
        <div className="flex items-center justify-end">
          <LanguageToggle />
        </div>

        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-8">
          <h1 className="text-2xl font-bold text-ink">{t('login.welcome')}</h1>
          <p className="mt-2 text-sm text-ink-muted">{t('login.subtitle')}</p>

          {!usingSupabase && (
            <div className="mt-5 rounded-xl bg-orange-50 px-3.5 py-2.5 text-xs font-medium text-orange-700 ring-1 ring-orange-100">
              {t('login.demoBadge')}
            </div>
          )}

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            {mode === 'signup' && (
              <div>
                <label htmlFor="name" className="tq-label">
                  {t('common.name')}
                </label>
                <input
                  id="name"
                  type="text"
                  className="tq-input"
                  placeholder={t('login.namePlaceholder')}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                />
              </div>
            )}
            <div>
              <label htmlFor="email" className="tq-label">
                {t('common.email')}
              </label>
              <input
                id="email"
                type="email"
                required
                className="tq-input"
                placeholder={t('login.emailPlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
            <div>
              <label htmlFor="password" className="tq-label">
                {t('common.password')}
              </label>
              <input
                id="password"
                type="password"
                required
                className="tq-input"
                placeholder={t('login.passwordPlaceholder')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              />
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600" role="alert">
                {error}
              </p>
            )}

            <button type="submit" className="tq-btn-primary w-full py-2.5" disabled={busy}>
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  {mode === 'signin' ? t('login.signInCta') : t('login.createAccountCta')}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="my-5 flex items-center gap-3 text-xs text-ink-muted">
            <span className="h-px flex-1 bg-slate-200" />
            {t('login.orDivider')}
            <span className="h-px flex-1 bg-slate-200" />
          </div>

          <button type="button" onClick={signInAsGuest} className="tq-btn-ghost w-full py-2.5 ring-1 ring-slate-200">
            {t('login.guestCta')}
          </button>

          <p className="mt-6 text-center text-sm text-ink-muted">
            {mode === 'signin' ? t('login.noAccount') : t('login.haveAccount')}{' '}
            <button
              type="button"
              className="font-semibold text-brand-600 hover:text-brand-700"
              onClick={() => {
                setMode(mode === 'signin' ? 'signup' : 'signin')
                setError(null)
              }}
            >
              {mode === 'signin' ? t('login.switchToSignUp') : t('login.switchToSignIn')}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

export default LoginScreen
