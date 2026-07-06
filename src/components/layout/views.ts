/** App views — the dashboard is a single page with a lightweight client-side view switcher
 *  (no router dependency). Later build steps fill in each view's content. */
export type AppView =
  | 'dashboard'
  | 'map'
  | 'routes'
  | 'roles'
  | 'behavior'
  | 'metrics'
  | 'stats'
  | 'rewards'
  | 'profile'
  | 'cityControl'
  | 'trust'

/** Primary modules shown in the header nav. */
export const PRIMARY_NAV: { view: AppView; labelKey: string }[] = [
  { view: 'map', labelKey: 'nav.map' },
  { view: 'routes', labelKey: 'nav.routes' },
  { view: 'roles', labelKey: 'nav.roles' },
  { view: 'behavior', labelKey: 'nav.behavior' },
  { view: 'metrics', labelKey: 'nav.metrics' },
  { view: 'stats', labelKey: 'nav.stats' },
  { view: 'rewards', labelKey: 'nav.rewards' },
  { view: 'trust', labelKey: 'nav.trust' },
]
