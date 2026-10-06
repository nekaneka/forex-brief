# Forex Brief

Public Forex fundamental dashboard for USD, EUR, GBP, JPY, CHF, AUD, NZD and CAD. English reports include currency-strength diagrams, 28 pairs, GBPUSD focus, source evidence, a seven-day calendar and archived scores.

## Cloud operation

Research runs in ChatGPT cloud Work through the connected GitHub plugin, using the ChatGPT subscription and free public sources. GitHub Actions publishes the static dashboard after report commits. The user's laptop can be off. This route does not use a separately billed model API or paid data subscription.

Weekday scheduled starts are 06:30 and 13:30 Europe/Vienna, following Austrian daylight saving. These are starts, not guaranteed publication times. Research duration, service availability and subscription usage limits can delay or prevent a report; the last successful report keeps its original timestamp.

The first cloud report is 2026-10-06-morning, published manually after review. It verified 69/72 factor observations and sourced 38 numeric consensus observations; one of 48 calendar categories was unavailable. Japan employment and Switzerland core inflation/employment were unavailable. The dated review audit is under work/research/cloud-test-2026-10-06/ . A successful validator does not guarantee every extracted figure is correct.

The recurring tasks live in the ChatGPT web account, not this repository or a local desktop automation. See docs/cloud-runbook.md for the standalone procedure and docs/cloud-research-brief.md for the original analyst brief. Keep the GitHub connector authorized for this repository. The legacy Scheduled Forex research GitHub workflow is disabled; Publish Forex Brief remains enabled.

## Research and publication

The cloud task reads current main and checks whether today's session is already published. It browses underlying releases for all 72 currency/factor combinations and 48 calendar categories, then records genuinely consulted URLs separately. Unsupported figures and consensus stay null; previous is never used as consensus. Official sources are preferred, with allowed free secondary sources for gaps.

Create a research envelope containing cutoff (UTC ISO timestamp), session (morning or afternoon), research (matching researchSchema), and consultedSources (actual consulted URLs). In the cloud checkout, run:

```text
node scripts/import-research.mjs envelope.json
npm test
npm run check
```

The importer validates the complete schema, source provenance and categories, calculates scores through the existing model, renders the seven-section report with exactly five summary bullets, records limitations and prevents duplicate session overwrites. It rejects future/stale cutoffs and reports with fewer than half of their observations verified. Commit all generated report, index, latest, status and session-state files together on main, preserving unrelated changes. Verify both Pages deployment and the exact live report ID.

A broad research or validation failure retains the previous report. Do not weaken verification to force a new report. A partial evidence set can meet the model's quality thresholds; the model status verified does not mean every factor is available. Review source notes and limitations.

## Scoring

lib/config.mjs defines exact series, surprise thresholds and freshness windows. lib/scoring.mjs calculates adjustments from a neutral 50, bounded 0–100 scores, ranks and pair differences. Missing consensus cannot award a surprise comparison against the prior. CPI contributes once; rate decisions contextualize one guidance component. Low-quality currencies are provisional and their pair directions are UNRATED.

Implementation choices added to the original brief include numeric surprise thresholds, 40/60 headline/core CPI weighting, numeric S&P500/VIX risk thresholds, freshness windows and quality gates. These are model heuristics, not calibrated probabilities or proven trading advantages. History shows research scores, not trading returns. Stale observations may be displayed but do not score.

Australia uses the Household Spending Indicator following discontinued Retail Trade. New Zealand and Switzerland use explicitly configured local core/PMI series. Missing exact series remain unavailable.

## Output

- dist/data/latest.json: latest successful report, never a demo.
- dist/data/reports/: session JSON and full Markdown report.
- dist/data/index.json: archive and score history.
- dist/data/status.json: latest outcome shown on the site.
- state/runs.json: completed session IDs.
- work/research/: source evidence and audit, stored deliberately through GitHub tools.

Only dist is deployed. Visitor traffic cannot trigger model calls. The synthetic preview remains explicitly labelled and separate from real reports. Retrieved text is escaped and external links use noopener/noreferrer. There is no broker connection, trade execution, entry price, stop, target, leverage or position sizing.

## Local development and legacy API route

Node.js 22 or later; no npm dependencies are required.

```text
npm test
npm run check
npm run dev
```

Open http://127.0.0.1:4173 . npm run demo regenerates only the synthetic preview. lib/schedule.mjs and scripts/export-config.mjs maintain public schedule metadata and the retained legacy workflow cron; checks reject configuration drift.

scripts/run-report.mjs is the legacy separately billed API collector. It is retained for reference and testing and is not part of subscription cloud operation. It requires OPENAI_API_KEY and separate API billing; ChatGPT subscriptions do not fund that endpoint. Its budget ledger/estimates apply only to that legacy route. Do not enable that workflow or invoke the runner for this user's subscription-only setup.

Tests cover scoring boundaries, missing/mismatched consensus, CPI reconciliation, stale/future data, pairs and ties, low-quality suppression, Austrian DST, duplicate protection, schema/provenance failures and preserving the last report. The cloud import and publication path was tested independently; recurring execution also depends on the account's scheduled-task and connector availability.
