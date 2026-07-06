/**
 * Place search / autocomplete via the TomTom Search API (typeahead Fuzzy Search),
 * biased to Budapest / Hungary. Returns suggestions with coordinates that feed
 * straight into the existing live routing.
 *
 * The key is read from import.meta.env (never hardcoded). When no key is present
 * (or the call fails) it falls back to a small built-in list so the field still works.
 */
import { env, hasTomTom } from './env'
import { BUDAPEST_LOCATIONS } from './routing'

export interface PlaceSuggestion {
  id: string
  title: string
  subtitle: string
  lat: number
  lon: number
}

/** Budapest centre — used to bias the search toward the city. */
const BP = { lat: 47.4979, lon: 19.0402 }

interface TomTomResult {
  id?: string
  poi?: { name?: string }
  address?: {
    freeformAddress?: string
    municipality?: string
    municipalitySubdivision?: string
  }
  position: { lat: number; lon: number }
}

/**
 * Search places matching `query`. Returns [] for queries shorter than 3 chars.
 * `lang` is the i18n language ('hu' | 'en') used for result localisation.
 */
export async function searchPlaces(query: string, lang: string): Promise<PlaceSuggestion[]> {
  const q = query.trim()
  if (q.length < 3) return []

  if (hasTomTom()) {
    const language = lang.startsWith('hu') ? 'hu-HU' : 'en-US'
    const url =
      `https://api.tomtom.com/search/2/search/${encodeURIComponent(q)}.json` +
      `?key=${env.tomtomKey}&typeahead=true&limit=6&countrySet=HU` +
      `&lat=${BP.lat}&lon=${BP.lon}&radius=30000&language=${language}`
    try {
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        const results: TomTomResult[] = data.results ?? []
        return results.map((r, i) => {
          const name = r.poi?.name
          const addr = r.address?.freeformAddress ?? ''
          return {
            id: r.id ?? `tt-${i}`,
            title: name || addr || q,
            subtitle: name
              ? addr
              : r.address?.municipalitySubdivision || r.address?.municipality || '',
            lat: r.position.lat,
            lon: r.position.lon,
          }
        })
      }
      const body = await res.text().catch(() => '')
      console.error(`[search] TomTom Search ${res.status} ${res.statusText}`, body.slice(0, 200))
    } catch (err) {
      console.error('[search] TomTom Search request failed (CORS / domain / network):', err)
    }
  }

  return localFallback(q, lang)
}

/** Offline fallback: fuzzy match over the known Budapest landmarks. */
function localFallback(q: string, lang: string): PlaceSuggestion[] {
  const ql = q.toLowerCase()
  const hu = lang.startsWith('hu')
  return BUDAPEST_LOCATIONS.filter(
    (l) => l.name.toLowerCase().includes(ql) || l.nameHu.toLowerCase().includes(ql),
  )
    .slice(0, 6)
    .map((l, i) => ({
      id: `local-${i}`,
      title: hu ? l.nameHu : l.name,
      subtitle: 'Budapest',
      lat: l.lat,
      lon: l.lon,
    }))
}
