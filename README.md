# Forex Brief

A public, mobile-friendly Forex fundamental dashboard for USD, EUR, GBP, JPY, CHF, AUD, NZD and CAD. English reports target 08:30 Europe/Vienna daily and 14:45 on weekdays. The timezone follows Austrian daylight saving automatically. The UI is a static site; scheduled research runs securely in GitHub Actions.

## Current state

The dashboard includes an explicitly labelled synthetic preview. No live report or historical track record is preloaded. Live generation requires an OpenAI API key with API billing enabled, a GitHub repository, GitHub Pages, and enabled Actions. A ChatGPT subscription does not fund this API pipeline. Adding the key activates paid scheduled research within the application budget controls.

## One-time activation

1. Put this project in a public GitHub repository on its `main` branch.
2. In **Settings → Pages → Build and deployment**, choose **GitHub Actions** as the source.
3. In **Settings → Secrets and variables → Actions**, add the repository secret **OPENAI_API_KEY**. Enter it directly in GitHub; do not put it in chat, source files, or frontend code.
4. Under **Actions**, run **Publish Forex Brief** to deploy the dashboard.
5. Run **Scheduled Forex research** once, with `morning`, to verify real source coverage and API access. Subsequent eligible sessions run automatically. Successful reports replace the preview and fill the archive.

Scheduled starts are 08:03 and 14:33 Vienna time, with later retries. GitHub may delay or drop scheduled jobs, so target publication times are not guaranteed. The application rejects runs outside 08:00–08:59 / 14:31–14:59 and deduplicates successful session IDs. UTC triggers cover both DST offsets. Public repository schedules may disable after 60 days of inactivity. Saved report commits normally provide activity; monitor failed workflows.

## Budget

Default application budget: **USD 20 per UTC calendar month**. Model: `gpt-5.4-mini`, priced in this implementation at $0.75/M input tokens, $0.075/M cached input, $4.50/M output, and $0.01/web-search call (verified 2026-09-17). Prices are configuration assumptions and must be reviewed if OpenAI changes them. There are two bounded research batches per report, at most ten search calls and 16,000 output tokens per batch. Afternoon batches are given the preceding evidence and focus on updates; they still check every category.

`state/budget.json` records measured token/search estimates and a $1.25 reservation before each request. Known rejected requests release reservations; ambiguous failures keep them to avoid silently retrying possible paid calls. The budget guard stops future calls when insufficient room remains. **This is an estimated application spending guard, not a provider-enforced billing cap or guaranteed monthly price.** Set provider billing controls too. Costs, taxes, rounding, provider price changes, and ambiguous calls can differ. Full daily coverage might exhaust the budget before month end; never silently lower verification standards to keep publishing.

## Data and scoring

`lib/config.mjs` lists official sources, exact series, numeric surprise thresholds, and freshness windows. The web-enabled model gathers structured evidence, does not calculate totals, and must document all 72 currency/factor searches plus 48 calendar category checks. Source URLs must be on the allowlist and appear in the API's consulted sources/citations. This establishes source provenance, but cannot guarantee the model extracted every value correctly: review the first live reports against primary releases before relying on them.

`lib/scoring.mjs` calculates all adjustments, ranks, 28 conventionally quoted pairs, GBPUSD direction, and exactly five summary bullets. Scores recompute from 50. Missing consensus never becomes a surprise comparison with the prior. CPI is counted once; rate decisions contextualize one policy component. A low-quality currency is provisional and its pair directions are UNRATED. History records research scores, not returns or trading probabilities. Model thresholds are heuristics, not calibrated statistical confidence.

Australia's discontinued Retail Trade is replaced by household spending. New Zealand and Switzerland use explicitly named local core / PMI series. Unavailable configured series remain unavailable rather than switching definitions. The initial all-or-nothing collection quality gate requires at least half of new observations to validate. It keeps the last successful report during broad failures. Smaller gaps may retain dated previous observations and are disclosed. Stale observations are displayed but do not score.

## Local use

Node.js 22 or later; no npm dependencies or installation required.

```text
npm test
npm run check
npm run dev
```

Open http://127.0.0.1:4173. Set `OPENAI_API_KEY` securely in the process environment and use `npm run report -- --session morning` for a live run. The application does not load `.env` files automatically. `npm run demo` regenerates only synthetic preview data. `node scripts/export-config.mjs` refreshes the public methodology after a configuration edit.

## Output and failure behavior

- `dist/data/latest.json`: last successful report; never a demo.
- `dist/data/reports/`: immutable session JSON and full seven-section Markdown reports.
- `dist/data/index.json`: archive and score history.
- `dist/data/status.json`: last run outcome, displayed on the website.
- `state/`: session deduplication and estimated cost ledger, committed after attempts.
- `work/research/`: raw API output for local diagnostics, ignored by Git.

GitHub deploys only `dist`. Credentials are available only to the research step; visitor traffic cannot trigger paid model calls. There is no broker connection, trade execution, entry, stop, target, leverage, or position sizing. Treat retrieved content as untrusted data. Site links open with `noopener noreferrer`, and evidence text is escaped.

## Validation and limitations

Automated tests cover scoring boundaries, numeric surprise logic, missing consensus, mixed CPI signals, score clamping, stale and future data, pair direction and ties, low-quality handoff suppression, Austrian DST, duplicate sessions, provenance, budget guards, and retaining the last report when no API key is configured. Without a funded API key, the first real collection run and actual recurring costs remain unverified.

Official API docs: https://developers.openai.com/api/docs/guides/tools-web-search and https://developers.openai.com/api/docs/guides/structured-outputs

GitHub schedule docs: https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule
