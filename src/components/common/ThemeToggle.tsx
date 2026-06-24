import { useTranslation } from 'react-i18next'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/lib/theme'

interface ThemeToggleProps {
  className?: string
}

export function ThemeToggle({ className = '' }: ThemeToggleProps) {
  const { t } = useTranslation()
  const { isDark, toggleTheme } = useTheme()

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-pressed={isDark}
      title={isDark ? t('theme.switchToLight') : t('theme.switchToDark')}
      aria-label={isDark ? t('theme.switchToLight') : t('theme.switchToDark')}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-lg text-ink-soft transition hover:bg-slate-100 ${className}`}
    >
      {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  )
}

export default ThemeToggle
