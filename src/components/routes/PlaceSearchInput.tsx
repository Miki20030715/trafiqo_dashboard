import { useEffect, useId, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MapPin, Loader2, X } from 'lucide-react'
import { searchPlaces, type PlaceSuggestion } from '@/lib/search'

export interface SelectedPlace {
  lat: number
  lon: number
  name: string
}

interface PlaceSearchInputProps {
  label: string
  /** Tailwind colour class for the pin icon, e.g. 'text-green-500'. */
  pinColor: string
  placeholder: string
  /** Called when a place is chosen (or cleared with null). */
  onSelect: (place: SelectedPlace | null) => void
}

const DEBOUNCE_MS = 300
const MIN_CHARS = 3

export function PlaceSearchInput({ label, pinColor, placeholder, onSelect }: PlaceSearchInputProps) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const listId = useId()

  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [active, setActive] = useState(-1)
  const [chosen, setChosen] = useState(false)

  const wrapRef = useRef<HTMLDivElement>(null)
  const reqId = useRef(0)

  // Debounced search whenever the query changes (and a result isn't already chosen).
  useEffect(() => {
    if (chosen) return
    const q = query.trim()
    if (q.length < MIN_CHARS) {
      setSuggestions([])
      setLoading(false)
      return
    }
    setLoading(true)
    const myId = ++reqId.current
    const handle = window.setTimeout(async () => {
      const res = await searchPlaces(q, lang)
      if (myId !== reqId.current) return // a newer query superseded this one
      setSuggestions(res)
      setActive(-1)
      setLoading(false)
      setOpen(true)
    }, DEBOUNCE_MS)
    return () => window.clearTimeout(handle)
  }, [query, lang, chosen])

  // Close the dropdown when clicking outside.
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  function pick(s: PlaceSuggestion) {
    setQuery(s.title)
    setChosen(true)
    setOpen(false)
    setSuggestions([])
    onSelect({ lat: s.lat, lon: s.lon, name: s.title })
  }

  function clear() {
    setQuery('')
    setChosen(false)
    setSuggestions([])
    setOpen(false)
    onSelect(null)
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open || suggestions.length === 0) {
      if (e.key === 'Enter' && suggestions.length > 0) pick(suggestions[0])
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((a) => Math.min(a + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => Math.max(a - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      pick(suggestions[active >= 0 ? active : 0])
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  const showNoResults =
    open && !loading && !chosen && query.trim().length >= MIN_CHARS && suggestions.length === 0

  return (
    <div className="relative" ref={wrapRef}>
      <label className="mb-1.5 block text-sm font-medium text-ink">
        <MapPin className={`mr-1 inline h-4 w-4 ${pinColor}`} />
        {label}
      </label>
      <div className="relative">
        <input
          type="text"
          value={query}
          placeholder={placeholder}
          autoComplete="off"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          onChange={(e) => {
            setQuery(e.target.value)
            setChosen(false)
            onSelect(null)
          }}
          onFocus={() => {
            if (suggestions.length > 0) setOpen(true)
          }}
          onKeyDown={onKeyDown}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 pr-9 text-sm text-ink placeholder:text-ink-muted focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-ink-muted" />
          ) : query ? (
            <button
              type="button"
              onClick={clear}
              aria-label={t('common.close')}
              className="pointer-events-auto rounded p-0.5 text-ink-muted hover:text-ink"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </span>
      </div>

      {open && suggestions.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 top-full z-[1200] mt-1 max-h-72 overflow-auto rounded-xl border border-slate-200 bg-white py-1 shadow-card-hover"
        >
          {suggestions.map((s, i) => (
            <li key={s.id} role="option" aria-selected={i === active}>
              <button
                type="button"
                onMouseEnter={() => setActive(i)}
                onClick={() => pick(s)}
                className={`flex w-full items-start gap-2 px-3 py-2 text-left ${
                  i === active ? 'bg-brand-50' : 'hover:bg-slate-50'
                }`}
              >
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-ink-muted" />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-ink">{s.title}</span>
                  {s.subtitle && (
                    <span className="block truncate text-xs text-ink-muted">{s.subtitle}</span>
                  )}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {showNoResults && (
        <div className="absolute left-0 right-0 top-full z-[1200] mt-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-ink-muted shadow-card-hover">
          {t('routes.noResults')}
        </div>
      )}
    </div>
  )
}

export default PlaceSearchInput
