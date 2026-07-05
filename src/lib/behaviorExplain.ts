/**
 * Scenario explainability layer.
 *
 * Two paths, both "one call per scenario run" — never per agent:
 *
 *  1. {@link explainScenarioLocal} — a deterministic, fully-traceable explanation
 *     assembled from the utility breakdown. Always available, no network, no key.
 *     This is the interpretability guarantee: every sentence maps to a coefficient.
 *
 *  2. {@link explainScenarioWithClaude} — an OPTIONAL single Claude API call that
 *     turns the same structured facts into a polished natural-language paragraph
 *     for the pitch/demo. Gated behind VITE_ANTHROPIC_API_KEY; on any failure it
 *     falls back to the local explanation. This is presentation polish, not core
 *     logic — the model's predictions never depend on it.
 */

import { env, hasAnthropic } from './env'
import {
  MODES,
  MODE_META,
  ROLE_COEFFICIENTS,
  valueOfTime,
  type Intervention,
  type Mode,
  type ModeSplit,
  type Role,
  type ScenarioResult,
} from './behaviorModel'

/** Which modes moved most, with signed percentage-point deltas. */
export interface ShiftSummary {
  mode: Mode
  /** Signed change in share, percentage points. */
  pp: number
}

/** Compact, model-derived facts about a scenario — the input to any explainer. */
export interface ScenarioFacts {
  role: Role
  interventionLabel: string
  vot: number
  before: ModeSplit
  after: ModeSplit
  shifts: ShiftSummary[]
}

function pp(before: number, after: number): number {
  return Math.round((after - before) * 1000) / 10
}

/** Reduce a {@link ScenarioResult} to the handful of facts an explanation needs. */
export function summariseScenario(
  result: ScenarioResult,
  intervention: Intervention,
): ScenarioFacts {
  const shifts = MODES.map((mode) => ({ mode, pp: pp(result.before[mode], result.afterAdapted[mode]) }))
    .filter((s) => Math.abs(s.pp) >= 0.5)
    .sort((a, b) => Math.abs(b.pp) - Math.abs(a.pp))

  return {
    role: result.role,
    interventionLabel: intervention.label,
    vot: valueOfTime(result.role),
    before: result.before,
    after: result.afterAdapted,
    shifts,
  }
}

function modeName(mode: Mode): string {
  return mode.charAt(0).toUpperCase() + mode.slice(1)
}

/**
 * Deterministic explanation, assembled from the utility coefficients and the
 * computed shift. No black box: the "why" clause names the exact coefficient
 * that drove the largest utility change.
 */
export function explainScenarioLocal(facts: ScenarioFacts): string {
  const c = ROLE_COEFFICIENTS[facts.role]

  if (facts.shifts.length === 0) {
    return `No meaningful shift. This segment's value of time (${facts.vot.toFixed(0)} HUF/min) and strong mode preference make it inelastic to "${facts.interventionLabel}" — the intervention does not change which mode maximises utility.`
  }

  const gainers = facts.shifts.filter((s) => s.pp > 0)
  const losers = facts.shifts.filter((s) => s.pp < 0)

  const fmt = (s: ShiftSummary) => `${modeName(s.mode)} ${s.pp > 0 ? '+' : ''}${s.pp.toFixed(1)} pp`
  const parts: string[] = []

  parts.push(
    `Under "${facts.interventionLabel}", predicted modal share shifts: ${facts.shifts.map(fmt).join(', ')}.`,
  )

  if (losers.length && gainers.length) {
    const from = losers[0]
    const to = gainers[0]
    // Name the driving coefficient behind the substitution.
    const driver = 'the resulting change in generalised cost (β_time, β_cost)'
    parts.push(
      `Travellers move away from ${modeName(from.mode)} toward ${modeName(to.mode)}: the intervention pushes ${modeName(
        from.mode,
      )}'s time/cost above this segment's adaptive reference point, and loss aversion (λ=${c.lambda}) amplifies that penalty ~${c.lambda}× before it feeds the logit choice probabilities.`,
    )
    parts.push(
      `This segment weights time at ${facts.vot.toFixed(0)} HUF/min (β_time/β_cost), so ${driver} is the dominant lever here.`,
    )
  } else if (gainers.length) {
    parts.push(
      `Sustainable modes gain because the intervention improves their relative utility while the reference point holds the previous option's disutility elevated.`,
    )
  }

  return parts.join(' ')
}

/**
 * Optional: a single Claude call that rewrites the structured facts as a short,
 * plain-language paragraph. Falls back to {@link explainScenarioLocal} whenever
 * no key is configured or the request fails — the demo never breaks.
 */
export async function explainScenarioWithClaude(
  facts: ScenarioFacts,
  roleLabel: string,
): Promise<{ text: string; source: 'claude' | 'local' }> {
  const local = explainScenarioLocal(facts)
  if (!hasAnthropic()) return { text: local, source: 'local' }

  const prompt = [
    'You are a transport-planning analyst explaining a discrete-choice model result to a non-technical city stakeholder.',
    'Write ONE short paragraph (max 60 words), plain language, no jargon, no bullet points.',
    'Explain WHY behaviour shifts, grounded ONLY in the facts below. Do not invent numbers.',
    '',
    `Traveller segment: ${roleLabel}`,
    `Intervention: ${facts.interventionLabel}`,
    `Segment value of time: ${facts.vot.toFixed(0)} HUF per minute`,
    `Predicted modal-share shift (percentage points): ${facts.shifts
      .map((s) => `${s.mode} ${s.pp > 0 ? '+' : ''}${s.pp.toFixed(1)}`)
      .join(', ') || 'no meaningful shift'}`,
    'The model uses Random Utility Maximization with reference-dependent loss aversion (losses weighted ~2x).',
  ].join('\n')

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': env.anthropicKey,
        'anthropic-version': '2023-06-01',
        // Required to allow direct browser calls; the key is demo-only.
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: env.anthropicModel,
        max_tokens: 200,
        messages: [{ role: 'user', content: prompt }],
      }),
    })
    if (!res.ok) return { text: local, source: 'local' }
    const data = (await res.json()) as { content?: { type: string; text?: string }[] }
    const text = data.content?.find((b) => b.type === 'text')?.text?.trim()
    return text ? { text, source: 'claude' } : { text: local, source: 'local' }
  } catch {
    return { text: local, source: 'local' }
  }
}

/** Small helper for the panel: a coloured legend entry per mode. */
export function modeColor(mode: Mode): string {
  return MODE_META[mode].color
}
