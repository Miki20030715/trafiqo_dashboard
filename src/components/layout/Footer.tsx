import { useTranslation } from 'react-i18next'
import { ShieldCheck, MessageSquarePlus } from 'lucide-react'
import TrafiqoLogo from '@/components/brand/TrafiqoLogo'
import MtaiLogo from '@/components/brand/MtaiLogo'
import { type AppView } from './views'

interface FooterProps {
  onNavigate: (view: AppView) => void
  onFeedback?: () => void
}

export function Footer({ onNavigate, onFeedback }: FooterProps) {
  const { t } = useTranslation()

  return (
    <footer className="mt-auto bg-ink text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-12 md:grid-cols-3">
        <div className="md:col-span-2">
          <TrafiqoLogo tone="light" showTagline markClassName="h-9 w-9" wordmarkClassName="h-8" />
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/70">
            {t('footer.decisionSupportNote')}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => onNavigate('trust')}
              className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-3.5 py-2 text-sm font-medium text-white ring-1 ring-white/15 transition hover:bg-white/15"
            >
              <ShieldCheck className="h-4 w-4" />
              {t('footer.dataGovernance')}
            </button>
            {onFeedback && (
              <button
                type="button"
                onClick={onFeedback}
                className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-3.5 py-2 text-sm font-medium text-white ring-1 ring-white/15 transition hover:bg-white/15"
              >
                <MessageSquarePlus className="h-4 w-4" />
                {t('footer.feedbackButton')}
              </button>
            )}
          </div>
        </div>

        {/* Technology & deployment partner */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-white/50">
            {t('footer.partnerHeading')}
          </h3>
          <div className="mt-4 inline-flex rounded-xl bg-white/5 px-4 py-3 ring-1 ring-white/10">
            <MtaiLogo tone="light" />
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-6 py-5 text-xs text-white/50 sm:flex-row sm:items-center sm:justify-between">
          <span>
            © {new Date().getFullYear()} Trafiqo. {t('footer.rightsReserved')}
          </span>
          <span>Smarter choices. Smoother cities.</span>
        </div>
      </div>
    </footer>
  )
}

export default Footer
