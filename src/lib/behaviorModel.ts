/**
 * TRAFIQO — Human Behaviour Prediction engine
 * ============================================
 *
 * A lightweight, interpretable behavioural choice model for urban mode choice.
 * This is NOT an agent-based / LLM simulation — it is a closed-form discrete
 * choice model that runs entirely client-side in a few milliseconds.
 *
 * Theoretical basis (kept deliberately transparent for the pitch):
 *
 *   1. Random Utility Maximization (RUM / Multinomial Logit).
 *      Each traveller assigns a utility to every travel mode and picks
 *      probabilistically via the softmax (logit) rule. See {@link modeProbabilities}.
 *
 *   2. Latent Class Logit (heterogeneous agents).
 *      Instead of estimating a continuous distribution of tastes, we use the
 *      8 dashboard roles as discrete "latent classes" — one coefficient set per
 *      class. See {@link ROLE_COEFFICIENTS}.
 *
 *   3. Reference dependence (light Prospect-Theory / Random-Regret flavour).
 *      Each class keeps an adaptive reference point (an EMA of recently
 *      experienced time & cost). Outcomes *worse* than the reference (losses:
 *      more congestion / higher price) are weighted ~2x more heavily than
 *      equal-sized improvements (gains). This loss aversion produces emergent
 *      "peak-spreading" — a sharp modal shift when conditions deteriorate that
 *      partially relaxes as the reference habituates — WITHOUT simulating
 *      individual cognition. See {@link valueFunction} and {@link updateReference}.
 *
 * ── Data grounding ─────────────────────────────────────────────────────────
 * ALL coefficients below are ILLUSTRATIVE PLACEHOLDERS chosen to give sensible,
 * legible demo behaviour. They are calibratable: the intended calibration source
 * is stated-preference / GPS survey data (e.g. the BKK Budapest 2025 mobility
 * report provides demographic & seasonal modal-share reference data). Do not
 * present these numbers as estimated parameters — they are hand-tuned priors
 * pending calibration. Every predicted shift is fully traceable to these
 * coefficients (see {@link utilityBreakdown}); there is no black box.
 */

import type { UserRole } from './userProfile'

/** A concrete role (the empty-string "unselected" state is excluded). */
export type Role = Exclude<UserRole, ''>

/** The travel modes travellers choose among. */
export type Mode = 'car' | 'transit' | 'bike' | 'walk'

export const MODES: readonly Mode[] = ['car', 'transit', 'bike', 'walk'] as const

/** Modes considered "sustainable" — the target of green nudges. */
export const SUSTAINABLE_MODES: readonly Mode[] = ['transit', 'bike', 'walk'] as const

/** Observable attributes of a mode for a representative trip. */
export interface ModeAttributes {
  /** Door-to-door travel time, minutes. */
  time: number
  /** Out-of-pocket cost, HUF. */
  cost: number
  /** Green score 0–100 (higher = lower emissions / healthier). */
  green: number
}

/**
 * Baseline attributes for a representative ~5–6 km inner-Budapest trip under
 * NORMAL conditions. Placeholder values — calibratable against BKK 2025 data.
 */
export const BASE_MODE_ATTRS: Record<Mode, ModeAttributes> = {
  car: { time: 22, cost: 620, green: 22 },
  transit: { time: 30, cost: 450, green: 82 },
  bike: { time: 26, cost: 80, green: 96 },
  walk: { time: 52, cost: 0, green: 100 },
}

/**
 * Per-role (latent-class) taste coefficients.
 *
 *  - `betaTime`  (< 0): dis-utility per minute of travel time.
 *  - `betaCost`  (< 0): dis-utility per HUF — the marginal utility of money.
 *  - `betaGreen` (> 0): utility per green-score point (pro-environmental taste).
 *  - `asc`: alternative-specific constants — the baseline preference for each
 *           mode that is NOT explained by time/cost/green (comfort, habit,
 *           professional constraints, feasibility). Strongly negative values
 *           encode "this class effectively cannot use this mode".
 *  - `lambda` (≈ 2): loss-aversion multiplier for outcomes above the reference.
 *  - `emaAlpha` (0–1): how fast the reference point adapts each tick
 *           (higher = habituates faster / less inertia).
 *  - `populationShare`: weight used when aggregating classes into a city total.
 *
 * The willingness-to-pay for time (Value of Time) implied by a class is simply
 * betaTime / betaCost (HUF per minute) — a directly interpretable quantity.
 */
export interface RoleCoefficients {
  betaTime: number
  betaCost: number
  betaGreen: number
  asc: Record<Mode, number>
  lambda: number
  emaAlpha: number
  populationShare: number
}

/**
 * ILLUSTRATIVE placeholder coefficient sets — one latent class per dashboard
 * role. Tuned for legible demo behaviour, NOT estimated from data.
 */
export const ROLE_COEFFICIENTS: Record<Role, RoleCoefficients> = {
  // Comfort- and habit-driven; time matters, money less so; weak green taste.
  // Bike is a real option but faces an access/weather barrier (negative ASC).
  privateDriver: {
    betaTime: -0.055, betaCost: -0.0012, betaGreen: 0.006,
    asc: { car: 1.4, transit: -0.3, bike: -1.6, walk: -1.9 },
    lambda: 2.0, emaAlpha: 0.2, populationShare: 0.30,
  },
  // Professional driver — time is literally money; essentially always in a car.
  taxiDriver: {
    betaTime: -0.09, betaCost: -0.0010, betaGreen: 0.002,
    asc: { car: 3.0, transit: -3.0, bike: -3.5, walk: -4.0 },
    lambda: 1.6, emaAlpha: 0.3, populationShare: 0.05,
  },
  // Cost-sensitive, strongly pro-transit identity, meaningful green taste.
  transitRider: {
    betaTime: -0.040, betaCost: -0.0022, betaGreen: 0.014,
    asc: { car: -0.4, transit: 1.9, bike: -1.2, walk: -0.2 },
    lambda: 2.2, emaAlpha: 0.18, populationShare: 0.28,
  },
  // Time-tolerant, strong green taste, prefers the bike.
  cyclist: {
    betaTime: -0.035, betaCost: -0.0015, betaGreen: 0.022,
    asc: { car: -0.9, transit: -0.2, bike: 2.0, walk: -0.2 },
    lambda: 2.0, emaAlpha: 0.2, populationShare: 0.10,
  },
  // Very cost-averse, maximal green taste, prefers walking; no bike access.
  pedestrian: {
    betaTime: -0.030, betaCost: -0.0028, betaGreen: 0.020,
    asc: { car: -1.1, transit: 0.3, bike: -0.6, walk: 1.6 },
    lambda: 2.0, emaAlpha: 0.2, populationShare: 0.07,
  },
  // Dispatch/response — extreme time sensitivity, cost-insensitive, car-locked.
  police: {
    betaTime: -0.11, betaCost: -0.0002, betaGreen: 0.001,
    asc: { car: 3.5, transit: -3.5, bike: -4.0, walk: -4.5 },
    lambda: 1.4, emaAlpha: 0.35, populationShare: 0.05,
  },
  // Maximal time sensitivity, cost-agnostic, fully car-locked (inelastic).
  emergency: {
    betaTime: -0.14, betaCost: -0.0001, betaGreen: 0.000,
    asc: { car: 4.0, transit: -4.5, bike: -5.0, walk: -5.5 },
    lambda: 1.3, emaAlpha: 0.4, populationShare: 0.05,
  },
  // Fleet economics — both time and cost matter; van-based, cargo-bike capable.
  logistics: {
    betaTime: -0.070, betaCost: -0.0020, betaGreen: 0.004,
    asc: { car: 2.4, transit: -2.8, bike: -1.8, walk: -3.8 },
    lambda: 1.8, emaAlpha: 0.25, populationShare: 0.10,
  },
}

/** The adaptive reference point held per class (Prospect-Theory anchor). */
export interface Reference {
  /** Habituated "normal" travel time, minutes. */
  time: number
  /** Habituated "normal" trip cost, HUF. */
  cost: number
}

/**
 * Network / policy conditions applied on top of the baseline mode attributes.
 * `1` (or `0`) means "no change from baseline".
 */
export interface Conditions {
  /** Multiplier on car travel time — the live congestion signal (1 = normal). */
  congestion: number
  /** HUF added to the car trip (e.g. a congestion charge). */
  carCostDelta: number
  /** HUF added to a transit trip (negative = fare subsidy). */
  transitCostDelta: number
  /** Multiplier on transit time (<1 = service improvement, e.g. express bus). */
  transitTimeFactor: number
  /** Multiplier on bike time (<1 = new protected bike lane). */
  bikeTimeFactor: number
  /** Green-nudge strength 0–1 — a utility boost applied to sustainable modes. */
  nudge: number
}

export const BASELINE_CONDITIONS: Conditions = {
  congestion: 1,
  carCostDelta: 0,
  transitCostDelta: 0,
  transitTimeFactor: 1,
  bikeTimeFactor: 1,
  nudge: 0,
}

/** Utility (in "utils") a full-strength nudge adds to each sustainable mode. */
export const NUDGE_STRENGTH = 0.8

/** A mode split — probabilities per mode, summing to 1. */
export type ModeSplit = Record<Mode, number>

/** Per-mode decomposition of utility into its named, traceable components. */
export interface UtilityTerms {
  asc: number
  time: number
  cost: number
  green: number
  nudge: number
  total: number
}

// ───────────────────────────────────────────────────────────────────────────
// Core model
// ───────────────────────────────────────────────────────────────────────────

/**
 * Apply live/policy {@link Conditions} to the baseline attributes, returning the
 * effective attributes actually experienced on each mode.
 */
export function applyConditions(conditions: Conditions): Record<Mode, ModeAttributes> {
  const b = BASE_MODE_ATTRS
  return {
    car: {
      time: b.car.time * conditions.congestion,
      cost: b.car.cost + conditions.carCostDelta,
      green: b.car.green,
    },
    transit: {
      time: b.transit.time * conditions.transitTimeFactor,
      cost: Math.max(0, b.transit.cost + conditions.transitCostDelta),
      green: b.transit.green,
    },
    bike: {
      time: b.bike.time * conditions.bikeTimeFactor,
      cost: b.bike.cost,
      green: b.bike.green,
    },
    walk: { ...b.walk },
  }
}

/**
 * Reference-dependent value function (loss aversion).
 *
 * For a "cost-like" attribute where higher = worse (time, money), an outcome
 * `x` above the reference `r` is a LOSS and is amplified by `lambda`; an outcome
 * below `r` is a GAIN and enters linearly. Returns the *perceived* attribute
 * value that then multiplies the (negative) beta coefficient.
 *
 *   v(x) = r + lambda·(x − r)   if x > r   (loss — amplified)
 *   v(x) = x                    if x ≤ r   (gain — as-is)
 */
export function valueFunction(x: number, reference: number, lambda: number): number {
  const deviation = x - reference
  return deviation > 0 ? reference + lambda * deviation : x
}

/**
 * Decompose the utility of a single mode into its named components, so any
 * predicted shift can be traced back to specific coefficients. Losses (time/cost
 * above the reference) are amplified via {@link valueFunction}.
 */
export function utilityBreakdown(
  role: Role,
  mode: Mode,
  attrs: ModeAttributes,
  reference: RuntimeReference,
): UtilityTerms {
  const c = ROLE_COEFFICIENTS[role]
  const perceivedTime = valueFunction(attrs.time, reference.time, c.lambda)
  const perceivedCost = valueFunction(attrs.cost, reference.cost, c.lambda)

  const asc = c.asc[mode]
  const time = c.betaTime * perceivedTime
  const cost = c.betaCost * perceivedCost
  const green = c.betaGreen * attrs.green
  const nudge = SUSTAINABLE_MODES.includes(mode) ? NUDGE_STRENGTH * reference.nudgeStrength : 0

  return { asc, time, cost, green, nudge, total: asc + time + cost + green + nudge }
}

/**
 * Numerically stable softmax over an array of utilities → choice probabilities.
 */
export function softmax(utilities: number[]): number[] {
  const max = Math.max(...utilities)
  const exps = utilities.map((u) => Math.exp(u - max))
  const sum = exps.reduce((a, b) => a + b, 0)
  return exps.map((e) => e / sum)
}

/**
 * Mode-choice probabilities for a class, given effective attributes and the
 * class's current reference point. This is the RUM/logit core: P(m) ∝ exp(U_m).
 */
export function modeProbabilities(
  role: Role,
  attrs: Record<Mode, ModeAttributes>,
  reference: RuntimeReference,
): ModeSplit {
  const utilities = MODES.map((m) => utilityBreakdown(role, m, attrs[m], reference).total)
  const probs = softmax(utilities)
  const split = {} as ModeSplit
  MODES.forEach((m, i) => (split[m] = probs[i]))
  return split
}

/**
 * The reference the model carries at runtime: the {@link Reference} anchor plus
 * the currently-active nudge strength (nudges are perceptual, not part of the
 * habituated anchor, so they live alongside it).
 */
export interface RuntimeReference extends Reference {
  nudgeStrength: number
}

/**
 * Probability-weighted experienced time & cost under a split — i.e. what the
 * class actually lives through this tick (uses REAL attributes, not the
 * loss-transformed perception, because the reference tracks reality).
 */
export function experiencedOutcome(
  attrs: Record<Mode, ModeAttributes>,
  split: ModeSplit,
): Reference {
  let time = 0
  let cost = 0
  for (const m of MODES) {
    time += split[m] * attrs[m].time
    cost += split[m] * attrs[m].cost
  }
  return { time, cost }
}

/**
 * EMA update of the reference point toward this tick's experienced outcome.
 * Higher `emaAlpha` → faster habituation (the loss shrinks sooner).
 */
export function updateReference(
  reference: RuntimeReference,
  experienced: Reference,
  emaAlpha: number,
): RuntimeReference {
  return {
    time: emaAlpha * experienced.time + (1 - emaAlpha) * reference.time,
    cost: emaAlpha * experienced.cost + (1 - emaAlpha) * reference.cost,
    nudgeStrength: reference.nudgeStrength,
  }
}

/**
 * Initialise a class's reference point to what it is habituated to under a given
 * set of conditions (the "normal" it has adapted to).
 *
 * Bootstrapped with a loss-neutral logit (Infinity references → no losses), then
 * the EMA is iterated to its FIXED POINT — the stationary reference where
 * ref = experienced(choice(ref)). This matters: a stationary anchor guarantees
 * that with no intervention the model predicts zero shift (nothing changed →
 * nothing moves), so any predicted shift is genuinely caused by the intervention.
 */
export function initReference(role: Role, conditions: Conditions = BASELINE_CONDITIONS): RuntimeReference {
  const attrs = applyConditions(conditions)
  const emaAlpha = ROLE_COEFFICIENTS[role].emaAlpha

  const bootstrap = experiencedOutcome(
    attrs,
    modeProbabilities(role, attrs, { time: Infinity, cost: Infinity, nudgeStrength: conditions.nudge }),
  )
  let ref: RuntimeReference = { time: bootstrap.time, cost: bootstrap.cost, nudgeStrength: conditions.nudge }

  // Converge to the habituation fixed point (cheap: contraction under the EMA).
  for (let i = 0; i < 40; i++) {
    const split = modeProbabilities(role, attrs, ref)
    ref = updateReference(ref, experiencedOutcome(attrs, split), emaAlpha)
  }
  return ref
}

// ───────────────────────────────────────────────────────────────────────────
// Scenario engine
// ───────────────────────────────────────────────────────────────────────────

/**
 * A policy intervention: any subset of condition changes plus a human label.
 * Omitted fields default to "no change".
 */
export interface Intervention {
  label: string
  /** Additional congestion multiplier on top of live conditions (e.g. +0.3). */
  congestionDelta?: number
  /** HUF added to the car trip (congestion charge). */
  carCostDelta?: number
  /** HUF added to a transit trip (negative = subsidy). */
  transitCostDelta?: number
  /** Multiplier applied to transit time (<1 = faster service). */
  transitTimeFactor?: number
  /** Multiplier applied to bike time (<1 = new bike lane). */
  bikeTimeFactor?: number
  /** Green-nudge strength 0–1. */
  nudge?: number
}

/** Compose an intervention onto a base set of conditions. */
export function applyIntervention(base: Conditions, iv: Intervention): Conditions {
  return {
    congestion: base.congestion + (iv.congestionDelta ?? 0),
    carCostDelta: base.carCostDelta + (iv.carCostDelta ?? 0),
    transitCostDelta: base.transitCostDelta + (iv.transitCostDelta ?? 0),
    transitTimeFactor: base.transitTimeFactor * (iv.transitTimeFactor ?? 1),
    bikeTimeFactor: base.bikeTimeFactor * (iv.bikeTimeFactor ?? 1),
    nudge: Math.max(0, Math.min(1, iv.nudge ?? base.nudge)),
  }
}

/** One row of the modal-share time series. */
export interface TimeseriesPoint extends ModeSplit {
  /** Tick index (0 = the moment the intervention lands). */
  tick: number
}

/** Full per-role scenario result. */
export interface ScenarioResult {
  role: Role
  /** Habituated modal split before the intervention. */
  before: ModeSplit
  /** Modal split the instant the intervention lands (full loss aversion). */
  afterImmediate: ModeSplit
  /** Modal split after the reference habituates over `ticks` ticks. */
  afterAdapted: ModeSplit
  /** Modal-share trajectory from the moment of intervention through adaptation. */
  timeseries: TimeseriesPoint[]
  /** Utility decomposition per mode at the immediate response (interpretability). */
  breakdown: Record<Mode, UtilityTerms>
  /** Signed change in each mode's share (afterAdapted − before). */
  delta: ModeSplit
}

/**
 * Run a before/after scenario for one class.
 *
 * The class starts habituated to `baseConditions`. At tick 0 the intervention
 * lands: loss aversion produces an immediate over-shoot (`afterImmediate`); over
 * `ticks` ticks the reference EMA adapts toward the new normal, relaxing the
 * over-shoot to `afterAdapted`. This transient IS the emergent peak-spreading.
 */
export function runScenario(
  role: Role,
  intervention: Intervention,
  baseConditions: Conditions = BASELINE_CONDITIONS,
  ticks = 12,
): ScenarioResult {
  const c = ROLE_COEFFICIENTS[role]

  // Habituated starting state.
  const reference = initReference(role, baseConditions)
  const beforeAttrs = applyConditions(baseConditions)
  const before = modeProbabilities(role, beforeAttrs, reference)

  // Intervention lands. Reference still anchored to the old normal → losses bite.
  const afterConditions = applyIntervention(baseConditions, intervention)
  const afterAttrs = applyConditions(afterConditions)
  const runtimeRef: RuntimeReference = { ...reference, nudgeStrength: afterConditions.nudge }

  const afterImmediate = modeProbabilities(role, afterAttrs, runtimeRef)
  const breakdown = {} as Record<Mode, UtilityTerms>
  for (const m of MODES) breakdown[m] = utilityBreakdown(role, m, afterAttrs[m], runtimeRef)

  // Evolve the reference; watch the split relax as habituation sets in.
  const timeseries: TimeseriesPoint[] = []
  let ref = runtimeRef
  let split = afterImmediate
  for (let tick = 0; tick <= ticks; tick++) {
    split = modeProbabilities(role, afterAttrs, ref)
    timeseries.push({ tick, ...split })
    const experienced = experiencedOutcome(afterAttrs, split)
    ref = updateReference(ref, experienced, c.emaAlpha)
  }
  const afterAdapted = split

  const delta = {} as ModeSplit
  for (const m of MODES) delta[m] = afterAdapted[m] - before[m]

  return { role, before, afterImmediate, afterAdapted, timeseries, breakdown, delta }
}

/** A city-level aggregate scenario: population-share-weighted across classes. */
export interface AggregateResult {
  before: ModeSplit
  afterImmediate: ModeSplit
  afterAdapted: ModeSplit
  timeseries: TimeseriesPoint[]
  delta: ModeSplit
  perRole: Record<Role, ScenarioResult>
}

const ALL_ROLES = Object.keys(ROLE_COEFFICIENTS) as Role[]

function zeroSplit(): ModeSplit {
  return { car: 0, transit: 0, bike: 0, walk: 0 }
}

function accumulate(target: ModeSplit, add: ModeSplit, weight: number): void {
  for (const m of MODES) target[m] += add[m] * weight
}

/**
 * Aggregate the scenario across all 8 classes, weighting each by its
 * {@link RoleCoefficients.populationShare}. Also returns each class's own result.
 */
export function runAggregateScenario(
  intervention: Intervention,
  baseConditions: Conditions = BASELINE_CONDITIONS,
  ticks = 12,
): AggregateResult {
  const perRole = {} as Record<Role, ScenarioResult>
  const before = zeroSplit()
  const afterImmediate = zeroSplit()
  const afterAdapted = zeroSplit()
  const timeseries: TimeseriesPoint[] = Array.from({ length: ticks + 1 }, (_, tick) => ({ tick, ...zeroSplit() }))

  let totalWeight = 0
  for (const role of ALL_ROLES) {
    const w = ROLE_COEFFICIENTS[role].populationShare
    totalWeight += w
    const res = runScenario(role, intervention, baseConditions, ticks)
    perRole[role] = res
    accumulate(before, res.before, w)
    accumulate(afterImmediate, res.afterImmediate, w)
    accumulate(afterAdapted, res.afterAdapted, w)
    res.timeseries.forEach((pt, i) => accumulate(timeseries[i], pt, w))
  }

  // Normalise by total weight (defensive — shares are authored to sum to 1).
  const norm = (s: ModeSplit) => {
    if (totalWeight === 0) return
    for (const m of MODES) s[m] /= totalWeight
  }
  norm(before)
  norm(afterImmediate)
  norm(afterAdapted)
  timeseries.forEach(norm)

  const delta = zeroSplit()
  for (const m of MODES) delta[m] = afterAdapted[m] - before[m]

  return { before, afterImmediate, afterAdapted, timeseries, delta, perRole }
}

// ───────────────────────────────────────────────────────────────────────────
// Presentation helpers
// ───────────────────────────────────────────────────────────────────────────

/** Display metadata per mode (labels via i18n key, brand colour, emoji). */
export const MODE_META: Record<Mode, { color: string; emoji: string; i18nKey: string }> = {
  car: { color: '#EA4335', emoji: '🚗', i18nKey: 'behavior.modeCar' },
  transit: { color: '#1B72E8', emoji: '🚆', i18nKey: 'behavior.modeTransit' },
  bike: { color: '#2DA84A', emoji: '🚲', i18nKey: 'behavior.modeBike' },
  walk: { color: '#F8B500', emoji: '🚶', i18nKey: 'behavior.modeWalk' },
}

/** Value of Time implied by a class, HUF per minute (betaTime / betaCost). */
export function valueOfTime(role: Role): number {
  const c = ROLE_COEFFICIENTS[role]
  return c.betaCost !== 0 ? c.betaTime / c.betaCost : Infinity
}

/**
 * Rank the utility drivers behind a mode's share change, largest-magnitude
 * first — the raw material for a fully traceable, non-black-box explanation.
 */
export function rankDrivers(before: UtilityTerms, after: UtilityTerms): { term: keyof UtilityTerms; change: number }[] {
  const keys: (keyof UtilityTerms)[] = ['asc', 'time', 'cost', 'green', 'nudge']
  return keys
    .map((term) => ({ term, change: (after[term] as number) - (before[term] as number) }))
    .filter((d) => Math.abs(d.change) > 1e-6)
    .sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
}
