import { useTranslation } from 'react-i18next'
import { LANGUAGES, type Language } from '@/i18n'

interface LanguageToggleProps {
  /** 'light' for use on dark backgrounds. */
  tone?: 'dark' | 'light'
  className?: string
}

export function LanguageToggle({ tone = 'dark', className = '' }: LanguageToggleProps) {
  const { i18n, t } = useTranslation()
  const current = (LANGUAGES.includes(i18n.language as Language) ? i18n.language : 'hu') as Language

  const base =
    tone === 'light'
      ? 'bg-white/10 ring-1 ring-white/20'
      : 'bg-slate-100 ring-1 ring-slate-200'

  return (
    <div
      role="group"
      aria-label={t('common.language')}
      className={`inline-flex items-center rounded-lg p-0.5 ${base} ${className}`}
    >
      {LANGUAGES.map((lng) => {
        const active = lng === current
        const activeCls =
          tone === 'light'
            ? 'bg-white text-ink shadow-sm'
            : 'bg-white text-ink shadow-sm'
        const idleCls = tone === 'light' ? 'text-white/80 hover:text-white' : 'text-ink-muted hover:text-ink'
        return (
          <button
            key={lng}
            type="button"
            onClick={() => i18n.changeLanguage(lng)}
            aria-pressed={active}
            className={`rounded-md px-2.5 py-1 text-xs font-bold uppercase tracking-wide transition ${
              active ? activeCls : idleCls
            }`}
          >
            {lng}
          </button>
        )
      })}
    </div>
  )
}

export default LanguageToggle
