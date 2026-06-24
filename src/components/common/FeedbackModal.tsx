import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { X, MessageSquarePlus, CheckCircle } from 'lucide-react'

interface FeedbackModalProps {
  open: boolean
  onClose: () => void
}

const STORAGE_KEY = 'trafiqo.feedback'

function saveFeedback(name: string, message: string) {
  const existing = (() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as unknown[]
    } catch {
      return []
    }
  })()
  existing.push({ name, message, date: new Date().toISOString() })
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing))
}

export function FeedbackModal({ open, onClose }: FeedbackModalProps) {
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !message.trim()) {
      setError(t('feedback.required'))
      return
    }
    saveFeedback(name.trim(), message.trim())
    setSubmitted(true)
    setError('')
  }

  function handleClose() {
    setName('')
    setMessage('')
    setError('')
    setSubmitted(false)
    onClose()
  }

  // Lock background scroll and close on Escape while the modal is open.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
    }
    window.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
    // handleClose only resets local state + calls onClose; stable enough for this effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  if (!open) return null

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t('feedback.title')}
      className="fixed inset-0 z-[2000] flex items-center justify-center overflow-y-auto overscroll-contain bg-black/50 p-4 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) handleClose() }}
    >
      <div className="my-auto max-h-[calc(100vh-2rem)] w-full max-w-md overflow-y-auto rounded-2xl bg-white shadow-xl ring-1 ring-black/5">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2 text-brand-700">
            <MessageSquarePlus className="h-5 w-5" />
            <h2 className="text-base font-semibold">{t('feedback.title')}</h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg p-1.5 text-ink-muted hover:bg-slate-100"
            aria-label={t('common.close')}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-6 py-5">
          {submitted ? (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <CheckCircle className="h-12 w-12 text-green-500" />
              <p className="text-base font-semibold text-ink">{t('feedback.successTitle')}</p>
              <p className="text-sm text-ink-muted">{t('feedback.successBody')}</p>
              <button
                type="button"
                onClick={handleClose}
                className="mt-2 rounded-xl bg-brand-500 px-6 py-2 text-sm font-semibold text-white transition hover:bg-brand-600"
              >
                {t('common.close')}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink">
                  {t('common.name')}
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('feedback.namePlaceholder')}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-muted focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-ink">
                  {t('feedback.title')}
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={t('feedback.messagePlaceholder')}
                  rows={4}
                  className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-muted focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
                />
              </div>
              {error && <p className="text-xs text-red-500">{error}</p>}
              <button
                type="submit"
                className="rounded-xl bg-brand-500 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600"
              >
                {t('feedback.submit')}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}

export default FeedbackModal
