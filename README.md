# TRAFIQO Dashboard

Adaptive urban-mobility dashboard for Budapest — Vite + React + TypeScript +
Tailwind, deployed to GitHub Pages. Live TomTom traffic map (Leaflet),
role-based personalised KPIs, customisable metrics, gamification, and a
**Human Behaviour Prediction** engine.

_Demola Budapest 2026 · MTAI (Miracle Traffic AI) as technology partner._

## Getting started

```bash
npm install
cp .env.example .env   # optional — fill in keys you have
npm run dev            # http://localhost:5173
npm run build          # type-check + production build
```

All keys are optional. Without them the app degrades gracefully: no TomTom key →
modelled-traffic fallback layer; no Supabase → local mock auth; no Anthropic key
→ the behaviour explainer uses its built-in deterministic explanation.

---

## Human Behaviour Prediction — model note (for the pitch deck)

The **Behaviour** tab predicts how travellers switch mode (car / transit / bike /
walk) in response to a policy — a congestion charge, a fare change, a green
nudge, a new bike lane. It is deliberately a **lightweight, interpretable
choice model**, not an agent-based or LLM-per-traveller simulation. Everything
runs client-side in a few milliseconds, and **every predicted shift is traceable
to a specific coefficient** (see the on-screen *Utility breakdown* table). No
black box.

### Theoretical basis

**1. Random Utility Maximization (RUM / multinomial logit).**
Each traveller assigns a utility to every mode and chooses probabilistically:

```
U_mode = β_time · time + β_cost · cost + β_green · greenScore + ASC_mode
P(mode) = exp(U_mode) / Σ_alt exp(U_alt)          ← softmax / logit
```

`ASC_mode` is an alternative-specific constant capturing baseline preference
(comfort, habit, feasibility) not explained by the measured attributes — a
standard RUM component. The implied **Value of Time** for a segment is simply
`β_time / β_cost` (HUF per minute) and is shown in the UI.

**2. Latent Class Logit (heterogeneous agents).**
Rather than estimating a continuous distribution of tastes, we treat the **8
dashboard roles as discrete latent classes** — one coefficient set per role
(`ROLE_COEFFICIENTS` in `src/lib/behaviorModel.ts`). A private driver, a taxi
driver and an emergency responder weight time, cost and green-ness very
differently, which is exactly what latent classes are for.

**3. Reference dependence (light Prospect-Theory / Random-Regret flavour).**
Each class carries an **adaptive reference point** — an exponential moving
average (EMA) of the time and cost it has recently experienced (in production,
fed each tick from live TomTom flow data). Outcomes **worse** than the reference
(losses: more congestion, higher price) are weighted **~2× more** than
equal-sized improvements (gains):

```
v(x) = ref + λ·(x − ref)   if x > ref   (loss — amplified, λ ≈ 2)
v(x) = x                   if x ≤ ref   (gain — linear)
```

This is loss aversion without the full CPT parameter machinery. It produces an
emergent **peak-spreading** dynamic: when conditions deteriorate, the currently
dominant mode's disutility is amplified, travellers shift away sharply
(over-shoot at `t₀`), and as the reference habituates over subsequent ticks the
shift partially relaxes — visible in the *Adaptation trajectory* chart. The
reference is initialised to its **habituation fixed point**, so with *no*
intervention the model predicts *zero* shift: any movement is genuinely caused
by the intervention.

### Scenario engine

`runScenario(role, intervention)` and `runAggregateScenario(intervention)`
compute the modal-choice distribution **before vs. after** an intervention, per
role and population-weighted across all classes, plus the tick-by-tick
trajectory. Interventions are a simple typed object (`carCostDelta`,
`congestionDelta`, `transitCostDelta`, `nudge`, `bikeTimeFactor`,
`transitTimeFactor`).

### Explainability (optional)

Per scenario run — **never per agent** — the panel can produce a plain-language
"why did behaviour shift" note. The default is a deterministic explanation
assembled directly from the utility breakdown (always available, fully
traceable). If `VITE_ANTHROPIC_API_KEY` is set, one Claude call rewrites the
same structured facts as a polished paragraph for demos; it falls back to the
local explanation on any error, so the model's predictions never depend on it.

### ⚠️ Data grounding — read before quoting numbers

All coefficients are **illustrative, hand-tuned placeholders** chosen for
legible demo behaviour. They are **not** estimated parameters and must not be
presented as precise forecasts. They are **calibratable** against
stated-preference / GPS survey data — the **BKK 2025 Budapest mobility report**
provides usable demographic and seasonal modal-share reference data for future
calibration. The architecture (RUM + latent classes + reference dependence) is
the deliverable; the numbers are priors pending calibration.

### Key files

| File | Purpose |
| --- | --- |
| `src/lib/behaviorModel.ts` | Utility model, softmax, adaptive reference, scenario engine, per-role coefficients |
| `src/lib/behaviorExplain.ts` | Deterministic + optional Claude explanation (one call per run) |
| `src/components/behavior/BehaviorPredictionPanel.tsx` | UI: segment selector, intervention controls, before/after split, trajectory, utility breakdown |
