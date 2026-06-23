import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ShieldCheck, Eye, Users, FileText, ChevronDown, ChevronUp, CheckCircle, FlaskConical, Mail } from 'lucide-react'

interface PrincipleProps {
  icon: typeof ShieldCheck
  color: string
  bg: string
  title: string
  desc: string
}

function PrincipleCard({ icon: Icon, color, bg, title, desc }: PrincipleProps) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-white p-5 shadow-card">
      <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${bg}`}>
        <Icon className={`h-6 w-6 ${color}`} />
      </div>
      <p className="text-sm font-bold text-ink">{title}</p>
      <p className="text-sm leading-relaxed text-ink-muted">{desc}</p>
    </div>
  )
}

interface FaqItem {
  q: string
  a: string
}

function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [openIdx, setOpenIdx] = useState<number | null>(null)

  return (
    <div className="rounded-2xl bg-white shadow-card overflow-hidden">
      {items.map(({ q, a }, i) => (
        <div key={i} className="border-b border-slate-100 last:border-0">
          <button
            type="button"
            onClick={() => setOpenIdx(openIdx === i ? null : i)}
            className="flex w-full items-start justify-between gap-4 px-5 py-4 text-left transition hover:bg-slate-50"
          >
            <span className="text-sm font-semibold text-ink">{q}</span>
            {openIdx === i ? (
              <ChevronUp className="mt-0.5 h-4 w-4 shrink-0 text-ink-muted" />
            ) : (
              <ChevronDown className="mt-0.5 h-4 w-4 shrink-0 text-ink-muted" />
            )}
          </button>
          {openIdx === i && (
            <div className="px-5 pb-4 text-sm leading-relaxed text-ink-muted">{a}</div>
          )}
        </div>
      ))}
    </div>
  )
}

export function TrustView() {
  const { t } = useTranslation()

  const PRINCIPLES: PrincipleProps[] = [
    {
      icon: ShieldCheck,
      color: 'text-brand-600',
      bg: 'bg-brand-50',
      title: t('trust.privacyFirst'),
      desc: t('trust.privacyFirstDesc'),
    },
    {
      icon: Users,
      color: 'text-green-600',
      bg: 'bg-green-50',
      title: t('trust.humanOversight'),
      desc: t('trust.humanOversightDesc'),
    },
    {
      icon: Eye,
      color: 'text-slate-600',
      bg: 'bg-slate-100',
      title: t('trust.noSurveillance'),
      desc: t('trust.noSurveillanceDesc'),
    },
    {
      icon: FileText,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      title: t('trust.transparency'),
      desc: t('trust.transparencyDesc'),
    },
  ]

  const FAQ_ITEMS: FaqItem[] = [
    { q: t('trust.q1'), a: t('trust.a1') },
    { q: t('trust.q2'), a: t('trust.a2') },
    { q: t('trust.q3'), a: t('trust.a3') },
    { q: t('trust.q4'), a: t('trust.a4') },
    { q: t('trust.q5'), a: t('trust.a5') },
    { q: t('trust.q6'), a: t('trust.a6') },
  ]

  const COMMITMENTS = [
    t('trust.commitment1'),
    t('trust.commitment2'),
    t('trust.commitment3'),
    t('trust.commitment4'),
  ]

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      {/* Hero */}
      <div className="mb-8 rounded-2xl bg-gradient-to-br from-ink to-slate-800 p-8 text-white">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-8 w-8 text-green-400" />
          <h1 className="text-2xl font-bold">{t('trust.title')}</h1>
        </div>
        <p className="mt-3 max-w-xl text-base leading-relaxed text-white/80">{t('trust.subtitle')}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/20 px-3 py-1 text-xs font-semibold text-green-300 ring-1 ring-green-500/30">
            <CheckCircle className="h-3.5 w-3.5" /> {t('trust.gdprBadge')}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/20 px-3 py-1 text-xs font-semibold text-blue-300 ring-1 ring-blue-500/30">
            <FlaskConical className="h-3.5 w-3.5" /> {t('trust.modelBadge')}
          </span>
        </div>
      </div>

      {/* Principles */}
      <section className="mb-8">
        <h2 className="mb-4 text-lg font-bold text-ink">{t('trust.principles')}</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {PRINCIPLES.map((p) => (
            <PrincipleCard key={p.title} {...p} />
          ))}
        </div>
      </section>

      {/* Commitments */}
      <section className="mb-8">
        <h2 className="mb-4 text-lg font-bold text-ink">{t('trust.commitments')}</h2>
        <div className="rounded-2xl bg-white p-5 shadow-card">
          <ul className="flex flex-col gap-3">
            {COMMITMENTS.map((c) => (
              <li key={c} className="flex items-start gap-3">
                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                <span className="text-sm text-ink">{c}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* FAQ */}
      <section className="mb-8">
        <h2 className="mb-4 text-lg font-bold text-ink">{t('trust.faq')}</h2>
        <FaqAccordion items={FAQ_ITEMS} />
      </section>

      {/* Contact */}
      <div className="rounded-2xl border border-brand-100 bg-brand-50 p-5">
        <div className="flex items-center gap-2 text-brand-700">
          <Mail className="h-4 w-4" />
          <p className="text-sm font-semibold">{t('trust.contact')}</p>
        </div>
        <a
          href={`mailto:${t('trust.contactEmail')}`}
          className="mt-1 text-sm text-brand-600 underline underline-offset-2 hover:text-brand-700"
        >
          {t('trust.contactEmail')}
        </a>
      </div>
    </div>
  )
}

export default TrustView
