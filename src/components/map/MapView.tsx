import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Maximize2, Minimize2, Layers, Activity, FlaskConical } from 'lucide-react'
import BudapestMap from './BudapestMap'
import { hasTomTom } from '@/lib/tomtom'

export function MapView() {
  const { t } = useTranslation()
  const live = hasTomTom()
  const [fullscreen, setFullscreen] = useState(false)
  const [showTraffic, setShowTraffic] = useState(true)

  useEffect(() => {
    if (!fullscreen) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setFullscreen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [fullscreen])

  const containerCls = fullscreen
    ? 'fixed inset-0 z-[60] bg-white'
    : 'relative flex-1 min-h-[60vh]'

  return (
    <div className={containerCls}>
      <div className="absolute inset-0">
        <BudapestMap showTraffic={showTraffic} resizeTrigger={fullscreen} />
      </div>

      {/* Top-left: title + data-source / model label */}
      <div className="pointer-events-none absolute left-3 top-3 z-[500] flex flex-col gap-2">
        <div className="pointer-events-auto inline-flex items-center gap-2 rounded-xl bg-white/95 px-3 py-2 shadow-card ring-1 ring-slate-200 backdrop-blur">
          <Activity className="h-4 w-4 text-brand-500" />
          <span className="text-sm font-semibold text-ink">{t('map.title')}</span>
          {live ? (
            <span className="ml-1 inline-flex items-center gap-1 rounded-md bg-green-50 px-1.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide text-green-700 ring-1 ring-green-100">
              {t('map.sourceLive')}
            </span>
          ) : (
            <span className="ml-1 inline-flex items-center gap-1 rounded-md bg-brand-50 px-1.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide text-brand-700 ring-1 ring-brand-100">
              <FlaskConical className="h-3 w-3" />
              {t('map.modelLabel')}
            </span>
          )}
        </div>
      </div>

      {/* Top-right: controls */}
      <div className="absolute right-3 top-3 z-[500] flex items-center gap-2">
        {live && (
          <button
            type="button"
            onClick={() => setShowTraffic((v) => !v)}
            aria-pressed={showTraffic}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium shadow-card ring-1 backdrop-blur transition ${
              showTraffic
                ? 'bg-brand-500 text-white ring-brand-600'
                : 'bg-white/95 text-ink-soft ring-slate-200 hover:bg-white'
            }`}
          >
            <Layers className="h-4 w-4" />
            <span className="hidden sm:inline">{t('map.trafficLayer')}</span>
          </button>
        )}
        <button
          type="button"
          onClick={() => setFullscreen((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-white/95 px-3 py-2 text-sm font-medium text-ink-soft shadow-card ring-1 ring-slate-200 backdrop-blur transition hover:bg-white"
        >
          {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          <span className="hidden sm:inline">
            {fullscreen ? t('map.exitFullscreen') : t('map.fullscreen')}
          </span>
        </button>
      </div>

      {/* Bottom-left: legend */}
      <div className="absolute bottom-5 left-3 z-[500] rounded-xl bg-white/95 px-3 py-2.5 shadow-card ring-1 ring-slate-200 backdrop-blur">
        <p className="mb-1.5 text-[0.7rem] font-semibold uppercase tracking-wide text-ink-muted">
          {t('map.legendTitle')}
        </p>
        <div className="flex flex-col gap-1 text-xs text-ink-soft">
          <span className="flex items-center gap-2">
            <span className="h-1.5 w-5 rounded-full bg-green-500" /> {t('map.legendFree')}
          </span>
          <span className="flex items-center gap-2">
            <span className="h-1.5 w-5 rounded-full bg-amber-500" /> {t('map.legendModerate')}
          </span>
          <span className="flex items-center gap-2">
            <span className="h-1.5 w-5 rounded-full bg-red-500" /> {t('map.legendHeavy')}
          </span>
        </div>
        {!live && (
          <p className="mt-2 max-w-[12rem] text-[0.65rem] leading-snug text-ink-muted">
            {t('map.modelNote')}
          </p>
        )}
      </div>
    </div>
  )
}

export default MapView
