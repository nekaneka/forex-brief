// Pure render functions: each takes plain data and returns an HTML string. Nothing here touches
// the DOM at import time, so test/core.test.mjs can import and render these under Node.

export const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'AUD', 'NZD', 'CAD'];

// History-chart hues, fixed per currency: colour follows the entity, never its rank. Validated as
// an 8-slot categorical set on the panel surface #12161b (CVD ΔE ≥ 8.4, normal-vision ΔE ≥ 19.3).
const SERIES = ['#3987e5', '#d95926', '#199e70', '#c98500', '#d55181', '#008300', '#9085e9', '#e66767'];

export const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const fmt = (v, options = {}) => (v
  ? new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Vienna', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', ...options }).format(new Date(v))
  : 'Not available');

const sign = (v) => (v > 0 ? `+${v}` : v < 0 ? `−${Math.abs(v)}` : '0');

const safeLink = (url, label) => {
  try {
    const u = new URL(url);
    return u.protocol === 'https:'
      ? `<a href="${esc(u.href)}" target="_blank" rel="noopener noreferrer">${esc(label)}</a>`
      : esc(label);
  } catch {
    return esc(label);
  }
};

// Direction is never carried by colour alone: every use pairs the colour class with a glyph and a word.
const DIRECTION = {
  LONG: { cls: 'up', glyph: '▲', word: 'LONG' },
  SHORT: { cls: 'down', glyph: '▼', word: 'SHORT' },
  NEUTRAL: { cls: 'flat', glyph: '■', word: 'NEUTRAL' },
  UNRATED: { cls: 'unrated', glyph: '◇', word: 'UNRATED' },
};
const direction = (d) => DIRECTION[d] || DIRECTION.UNRATED;
const pill = (d) => {
  const x = direction(d);
  return `<span class="pill ${x.cls}"><span aria-hidden="true">${x.glyph}</span> ${x.word}</span>`;
};

// Bias bands follow the model's classification: 60+ bullish, below 40 bearish, otherwise neutral.
const tone = (score) => (score >= 60 ? 'up' : score < 40 ? 'down' : 'flat');

function handoff(p) {
  if (!p || p.direction === 'UNRATED') return 'Unrated — insufficient verified evidence';
  if (p.direction === 'NEUTRAL') return 'Neutral — wait for clearer fundamental separation';
  return `Only look for ${p.direction} setups`;
}

function panel(title, body, { note = '', action = '', cls = '' } = {}) {
  return `<section class="panel ${cls}">
    <header class="panel-bar"><h2>${esc(title)}</h2>${note ? `<span class="panel-note">${note}</span>` : ''}${action}</header>
    ${body}
  </section>`;
}

// Every cell carries its column name, so narrow screens can stack rows without losing the header.
function table(headers, rows, cls = '') {
  return `<div class="table-wrap"><table class="${cls}">
    <thead><tr>${headers.map((h) => `<th scope="col">${esc(h)}</th>`).join('')}</tr></thead>
    <tbody>${rows.map((r) => `<tr>${r.map((v, i) => `<td data-label="${esc(headers[i])}">${v}</td>`).join('')}</tr>`).join('')}</tbody>
  </table></div>`;
}

/** Scheduled start times come from methodology.json, so the page cannot drift from the scheduler. */
export function scheduleText(method = {}) {
  const s = method.schedule;
  if (!s || !Array.isArray(s.sessions) || !s.sessions.length) return 'Schedule: see Method';
  const times = s.sessions.map((x) => esc(x.time)).join(' · ');
  return `Scheduled starts ${times} Vienna${s.weekdaysOnly ? ' · weekdays' : ''}`;
}

// ── Overview ─────────────────────────────────────────────────────────────────────────────────

function decision(report) {
  const usd = report.currencies.find((x) => x.currency === 'USD');
  const gbp = report.currencies.find((x) => x.currency === 'GBP');
  const focus = report.focus;
  const gap = gbp.score - usd.score;
  const d = direction(focus?.direction);
  const bias = focus?.direction === 'UNRATED' ? 'Unrated'
    : focus?.direction === 'NEUTRAL' ? 'Neutral'
      : gap > 0 ? 'Bullish' : 'Bearish';
  const evidence = report.demo ? 'Preview' : (focus?.quality || '—');
  return `<section class="panel decision dir-${d.cls}" aria-labelledby="focus-title">
    <header class="panel-bar"><h2 id="focus-title">GBPUSD · focus pair</h2><span class="panel-note">${esc(focus?.edgeClass || '')}</span></header>
    <div class="decision-body">
      <div class="verdict"><span class="verdict-glyph" aria-hidden="true">${d.glyph}</span><span class="verdict-word">${d.word}</span></div>
      <p class="handoff">${handoff(focus)}</p>
    </div>
    <dl class="stat-row">
      <div><dt>GBP</dt><dd class="num">${gbp.score}</dd></div>
      <div><dt>USD</dt><dd class="num">${usd.score}</dd></div>
      <div><dt>Gap</dt><dd class="num ${d.cls}">${sign(gap)}</dd></div>
    </dl>
    <p class="decision-meta"><span>Bias <b>${esc(bias)}</b></span><span>Evidence <b>${esc(evidence)}</b></span><span>GBP − USD, points</span></p>
    <p class="decision-note">${focus?.direction === 'UNRATED'
    ? 'Evidence quality is insufficient for a directional handoff.'
    : 'Execution: wait for a liquidity sweep, MSS/CISD, a fair value gap and an entry trigger.'}</p>
  </section>`;
}

function keyStats(report) {
  const ranked = report.currencies;
  const top = ranked[0];
  const bottom = ranked.at(-1);
  const rated = ranked.filter((c) => !c.provisional).length;
  const coverage = report.demo ? 'Preview'
    : ranked.every((c) => c.quality === 'High') ? 'High'
      : ranked.some((c) => c.quality === 'Low') ? 'Mixed' : 'Medium';
  const cell = (label, value, note, cls = '') => `<div><dt>${esc(label)}</dt><dd class="${cls}">${value}</dd><small>${esc(note)}</small></div>`;
  return `<dl class="key-stats" aria-label="Key figures">
    ${cell('Strongest', `${top.currency} <span class="num">${top.score}</span>`, top.bias + (top.provisional ? ' · provisional' : ''), tone(top.score))}
    ${cell('Weakest', `${bottom.currency} <span class="num">${bottom.score}</span>`, bottom.bias + (bottom.provisional ? ' · provisional' : ''), tone(bottom.score))}
    ${cell('Max separation', `<span class="num">${top.score - bottom.score}</span> pts`, `${top.currency} / ${bottom.currency}`)}
    ${cell('Evidence', esc(coverage), report.demo ? 'Synthetic · not live' : `${rated}/8 eligible for direction`)}
  </dl>`;
}

function strength(report) {
  const ranked = report.currencies;
  const rows = ranked.map((c) => {
    const delta = c.score - 50;
    const width = Math.min(Math.abs(delta), 50);
    const side = delta >= 0 ? 'right' : 'left';
    return `<button class="strength-row" data-currency="${c.currency}" aria-label="${c.currency}, rank ${c.rank}, score ${c.score}, ${esc(c.bias)}. View breakdown">
      <span class="rank num">${c.rank}</span>
      <span class="ccy">${c.currency}</span>
      <span class="bar" aria-hidden="true"><span class="bar-fill ${tone(c.score)} ${side}" style="width:${width}%"></span></span>
      <span class="score num">${c.score}${c.provisional ? '<sup title="Provisional">*</sup>' : ''}</span>
      <span class="bias ${tone(c.score)}">${esc(c.bias)}</span>
    </button>`;
  }).join('');
  const notes = ['Tap a currency for its score breakdown. Equal scores share a rank.'];
  if (ranked.some((c) => c.provisional)) notes.push('* Provisional: limited evidence.');
  return panel('Currency strength', `
    <div class="axis" aria-hidden="true"><span>0 · bearish</span><span>50</span><span>bullish · 100</span></div>
    <div class="strength-list">${rows}</div>
    <p class="fine">${notes.join(' ')}</p>`,
  { note: 'Bias 0–100', action: '<button class="link-button" data-view="evidence">Evidence →</button>' });
}

function pairs(report) {
  const row = (p) => [`<span class="pair">${esc(p.pair)}</span>`, pill(p.direction), `<span class="num">${p.edge}</span>`, esc(p.edgeClass)];
  return panel('Relative value', `
    ${table(['Pair', 'Bias', 'Gap', 'Edge class'], report.pairs.slice(0, 8).map(row), 'pairs')}
    <details class="more"><summary>All 28 pairs</summary>${table(['Pair', 'Bias', 'Gap', 'Edge class'], report.pairs.map(row), 'pairs')}</details>
    <p class="fine">Shared currencies can create overlapping exposure. Edge classes are model labels, not proven trading advantages.</p>`,
  { note: 'Largest separations' });
}

function brief(report) {
  return panel('Session brief', `<ol class="brief">${report.summary.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>`, { note: 'Five points' });
}

function changes(report, index) {
  const prev = index.find((r) => r.generatedAt < report.generatedAt);
  if (report.demo || !prev) return '';
  const cells = report.currencies.map((c) => {
    const d = c.score - prev.scores[c.currency];
    return `<div><span class="ccy">${c.currency}</span><span class="num ${d > 0 ? 'up' : d < 0 ? 'down' : 'flat'}">${sign(d)}</span></div>`;
  }).join('');
  return panel('Since previous brief', `<div class="changes">${cells}</div>`, { note: esc(fmt(prev.generatedAt)) });
}

function heatmap(report) {
  const byCcy = Object.fromEntries(report.currencies.map((c) => [c.currency, c]));
  const head = `<span></span>${CURRENCIES.map((c) => `<span class="hm-head">${c}</span>`).join('')}`;
  const body = CURRENCIES.map((a) => `<span class="hm-head">${a}</span>${CURRENCIES.map((b) => {
    if (a === b) return '<span class="hm-cell self" aria-hidden="true">·</span>';
    const n = byCcy[a].score - byCcy[b].score;
    const level = Math.abs(n) > 40 ? 's3' : Math.abs(n) > 20 ? 's2' : Math.abs(n) > 10 ? 's1' : 's0';
    const cls = Math.abs(n) <= 10 ? 'flat' : n > 0 ? 'up' : 'down';
    const prov = byCcy[a].provisional || byCcy[b].provisional ? '; provisional' : '';
    return `<span class="hm-cell ${cls} ${level}" title="${a} minus ${b}: ${n} points${prov}">${sign(n)}</span>`;
  }).join('')}`).join('');
  return panel('Pair separation', `
    <div class="heatmap" role="img" aria-label="Score differences: row currency minus column currency">${head}${body}</div>
    <p class="fine">Row minus column. Positive favours the row currency; within ±10 is no edge. Scores are not probabilities.</p>`,
  { note: 'Row − column' });
}

export function overview({ report, index = [] }) {
  return `<div class="overview">
    <div class="col-main">${decision(report)}${keyStats(report)}${strength(report)}${pairs(report)}</div>
    <div class="col-side">${brief(report)}${changes(report, index)}${heatmap(report)}</div>
  </div>`;
}

// ── Evidence ─────────────────────────────────────────────────────────────────────────────────

function filter(currencyFilter) {
  return `<div class="filter-row"><label for="currency-filter">Currency</label>
    <select id="currency-filter"><option value="all">All</option>${CURRENCIES.map((c) => `<option ${currencyFilter === c ? 'selected' : ''}>${c}</option>`).join('')}</select></div>`;
}

function sourceRegistry(method) {
  const items = Object.entries(method.sources || {}).map(([c, s]) => `<div class="source-item">
      <div><span class="ccy">${c}</span> <span class="muted">${esc(s.name)}</span></div>
      <div class="source-links">${[s.bank, ...s.stats, s.pmi].map(([name, url]) => safeLink(url, name)).join('')}</div>
    </div>`).join('');
  return panel('Research sources', `<div class="source-list">${items}</div>
    <p class="fine">Calendar and consensus: ${safeLink('https://tradingeconomics.com/calendar', 'Trading Economics')}, ${safeLink('https://www.forexfactory.com/calendar', 'Forex Factory')}, ${safeLink('https://www.investing.com/economic-calendar/', 'Investing.com')}. Missing estimates remain unavailable.</p>`,
  { note: 'Official releases first' });
}

export function evidence({ report, method = {}, currencyFilter = 'all' }) {
  const rows = (report.evidence || []).filter((e) => currencyFilter === 'all' || e.currency === currencyFilter);
  const body = rows.length
    ? table(['Factor', 'Reading', 'Source / release', 'Consensus / prior', 'Notes'], rows.map((e) => [
      `<b>${esc(method.labels?.[e.factor] || e.factor)}</b><small>${e.currency}</small>`,
      `<span class="num">${esc(e.status === 'verified' ? e.reading : 'Unavailable')}</span><small>${esc(e.referencePeriod)}</small>`,
      `${safeLink(e.sourceUrl, e.sourceName || 'Source unavailable')}<small>${esc(e.sourceDate || 'Date unavailable')}${e.carriedForward ? ' · retained observation' : ''}</small>`,
      `<span class="num">${esc(e.consensus ?? 'Unavailable')} / ${esc(e.prior ?? 'Unavailable')}</span><small>${e.consensusSourceUrl ? safeLink(e.consensusSourceUrl, 'Consensus source') : ''}</small>`,
      `<span class="fine">${esc(e.notes)}</span>`,
    ]), 'evidence-table')
    : '<div class="empty">The preview has no claimed economic readings.<br>Live reports show all 72 factor checks, with dated sources and comparison values.</div>';
  const download = report.demo ? '' : `<a class="link-button" href="data/reports/${esc(report.id)}.md" download>Full seven-section report ↓</a>`;
  return panel('Data verification', `${filter(currencyFilter)}${body}`, { note: 'Release dates, comparisons, sources', action: download })
    + sourceRegistry(method);
}

// ── Calendar ─────────────────────────────────────────────────────────────────────────────────

export function calendar({ report, currencyFilter = 'all' }) {
  const events = (report.events || [])
    .filter((e) => currencyFilter === 'all' || e.currency === currencyFilter)
    .sort((a, b) => (a.instant || a.date).localeCompare(b.instant || b.date));
  const time = (e) => (e.instant ? new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Vienna', hour: '2-digit', minute: '2-digit' }).format(new Date(e.instant)) : 'TBA');
  const day = (e) => (e.instant ? new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Vienna', weekday: 'short', day: '2-digit', month: 'short' }).format(new Date(e.instant)) : esc(e.date));
  const list = events.length
    ? `<div class="events">${events.map((e) => `<div class="event">
        <div class="event-time"><span class="num">${time(e)}</span><small>${day(e)}</small></div>
        <div class="event-body"><div class="event-title"><span class="ccy-tag">${esc(e.currency)}</span>${esc(e.event)}</div>
        <p>${esc(e.relevance)} ${e.consensus ? `Consensus <span class="num">${esc(e.consensus)}</span>. ` : ''}${safeLink(e.sourceUrl, 'Source ↗')}</p></div>
      </div>`).join('')}</div>`
    : `<div class="empty">${report.demo ? 'The preview contains no invented event schedule.' : 'No upcoming events have been verified for this selection.'}<br>Check calendar coverage below before reading an empty list as a quiet week.</div>`;
  const coverage = report.calendarChecks?.length
    ? table(['Currency', 'Category', 'Result', 'Notes'], report.calendarChecks
      .filter((c) => currencyFilter === 'all' || c.currency === currencyFilter)
      .map((c) => [`<span class="ccy">${c.currency}</span>`, esc(c.category), esc(c.status.replaceAll('_', ' ')), `<span class="fine">${esc(c.note)} ${c.sourceUrl ? safeLink(c.sourceUrl, 'Source') : ''}</span>`]))
    : '<p class="fine">Awaiting the first live calendar search.</p>';
  return panel('Next seven days', `${filter(currencyFilter)}${list}`, { note: 'Times in Vienna when verified' })
    + panel('Calendar coverage', coverage, { note: '“None verified” ≠ “unavailable”' });
}

// ── History ──────────────────────────────────────────────────────────────────────────────────

function historyChart(recent) {
  const w = 760; const h = 260; const left = 34; const right = 12; const top = 12; const bottom = 28;
  const x = (i) => left + (i * (w - left - right)) / (recent.length - 1);
  const y = (s) => top + ((100 - s) * (h - top - bottom)) / 100;
  const grid = [0, 25, 50, 75, 100].map((n) => `<line class="${n === 50 ? 'mid' : 'grid'}" x1="${left}" y1="${y(n)}" x2="${w - right}" y2="${y(n)}"/><text class="tick" x="${left - 6}" y="${y(n) + 4}" text-anchor="end">${n}</text>`).join('');
  const lines = CURRENCIES.map((c, i) => `<polyline class="series" stroke="${SERIES[i]}" points="${recent.map((r, j) => `${x(j)},${y(r.scores[c])}`).join(' ')}"/>`).join('');
  const ends = CURRENCIES.map((c, i) => `<circle class="end" cx="${x(recent.length - 1)}" cy="${y(recent.at(-1).scores[c])}" r="4" fill="${SERIES[i]}"/>`).join('');
  const payload = esc(JSON.stringify({ x: recent.map((_, j) => x(j)), reports: recent.map((r) => ({ at: r.generatedAt, scores: r.scores })) }));
  return `<div class="chart-wrap">
    <svg class="history-chart" viewBox="0 0 ${w} ${h}" role="img" aria-label="Fundamental scores for eight currencies over the last ${recent.length} reports" data-history="${payload}">
      ${grid}${lines}${ends}
      <line class="crosshair" x1="0" x2="0" y1="${top}" y2="${h - bottom}" visibility="hidden"/>
      <text class="tick" x="${left}" y="${h - 8}">${esc(recent[0].id.slice(0, 10))}</text>
      <text class="tick" x="${w - right}" y="${h - 8}" text-anchor="end">${esc(recent.at(-1).id.slice(0, 10))}</text>
    </svg>
    <div class="chart-tip" role="status" hidden></div>
  </div>
  <div class="legend">${CURRENCIES.map((c, i) => `<span><i style="background:${SERIES[i]}"></i>${c}</span>`).join('')}</div>`;
}

export function history({ index = [] }) {
  const recent = [...index].reverse().slice(-30);
  let chart = '<div class="empty">History starts with the first published report.<br>No simulated track record is shown.</div>';
  if (recent.length >= 2) {
    const scoreRows = [...recent].reverse().map((r) => [esc(r.id), ...CURRENCIES.map((c) => `<span class="num">${r.scores[c]}</span>`)]);
    chart = `${historyChart(recent)}
      <details class="more"><summary>Scores as a table</summary>${table(['Report', ...CURRENCIES], scoreRows, 'scores-table')}</details>`;
  } else if (recent.length === 1) {
    chart = '<div class="empty">One report recorded. The trend chart appears after the next report.</div>';
  }
  const archive = index.length
    ? table(['Report', 'Published (Vienna)', 'Evidence', 'Open'], index.map((r) => [esc(r.id), esc(fmt(r.generatedAt)), esc(r.status), `<button class="link-button" data-report="${esc(r.id)}">Read report →</button>`]))
    : '<div class="empty">The archive fills automatically once live research is active.</div>';
  return panel('Strength over time', chart, { note: 'Published scores only · not investment performance' })
    + panel('Report archive', archive, { note: `${index.length} published` });
}

/** Hover layer for the history chart: a crosshair plus a tooltip with all eight scores. Browser-only. */
export function bindHistoryChart(root) {
  const svg = root.querySelector('.history-chart');
  if (!svg) return;
  const data = JSON.parse(svg.dataset.history);
  const cross = svg.querySelector('.crosshair');
  const tip = root.querySelector('.chart-tip');
  const width = svg.viewBox.baseVal.width;
  const show = (clientX) => {
    const box = svg.getBoundingClientRect();
    const vx = ((clientX - box.left) / box.width) * width;
    let i = 0;
    data.x.forEach((px, j) => { if (Math.abs(px - vx) < Math.abs(data.x[i] - vx)) i = j; });
    const r = data.reports[i];
    cross.setAttribute('x1', data.x[i]);
    cross.setAttribute('x2', data.x[i]);
    cross.setAttribute('visibility', 'visible');
    const order = [...CURRENCIES].sort((a, b) => r.scores[b] - r.scores[a]);
    tip.innerHTML = `<b>${esc(fmt(r.at))}</b>${order.map((c) => `<span><i style="background:${SERIES[CURRENCIES.indexOf(c)]}"></i>${c}<em class="num">${r.scores[c]}</em></span>`).join('')}`;
    tip.hidden = false;
    const centre = (data.x[i] / width) * box.width;
    tip.style.left = `${Math.min(Math.max(centre - tip.offsetWidth / 2, 0), box.width - tip.offsetWidth)}px`;
  };
  const hide = () => { cross.setAttribute('visibility', 'hidden'); tip.hidden = true; };
  svg.addEventListener('pointermove', (e) => show(e.clientX));
  svg.addEventListener('pointerdown', (e) => show(e.clientX));
  svg.addEventListener('pointerleave', hide);
}

// ── Method ───────────────────────────────────────────────────────────────────────────────────

export function methodology({ method = {} }) {
  const rules = table(['Component', 'Rule'], [
    ['Central bank', 'Strong / moderate hawkish: +15 / +10; neutral or mixed: 0; moderate / strong dovish: −10 / −15. Rate decision is context, not a second adjustment.'],
    ['Inflation', 'Headline 40%, core 60%; component surprise scores combined and rounded to nearest 5. Opposing surprises: 0. If only one has consensus, use it once and lower coverage.'],
    ['Employment', 'Strong beat +10; small beat +5; in line 0; miss −10. Exact series and units are fixed for each country.'],
    ['Unemployment', 'Falling by at least 0.05 percentage points: +5; rising: −5; unchanged: 0. Compare the same series with its prior.'],
    ['GDP', 'Strong beat +10; beat +5; in line 0; miss −5; large miss −10. Annualized and nonannualized rates never mix.'],
    ['PMI', 'Below 45: −10; 45 to below 50: −5; 50 through 55: +3; above 55: +5. One configured series; latest final replaces flash.'],
    ['Retail / spending', 'Above comparable consensus: +5; below: −5; differences below 0.05 pp: 0. Australia uses household spending.'],
    ['Risk', 'Risk-on: S&P 500 daily change ≥+0.5% and VIX ≤−5%, adding +5 to AUD/NZD. Risk-off: equities ≤−0.5% and VIX ≥+5%, adding +5 to USD/CHF/JPY. Same session, ≤36 hours old. Otherwise mixed, 0.'],
  ].map(([a, b]) => [`<b>${esc(a)}</b>`, esc(b)]), 'rules');
  const thresholds = table(['Currency', 'CPI small / large', 'Employment small / large', 'GDP small / large'], CURRENCIES.map((c) => [
    `<span class="ccy">${c}</span>`,
    `<span class="num">${esc(method.thresholds?.[c]?.cpi.join(' / ') || '')}</span>`,
    `<span class="num">${esc(method.thresholds?.[c]?.employment.join(' / ') || '')}</span>`,
    `<span class="num">${esc(method.thresholds?.[c]?.gdp.join(' / ') || '')}</span>`,
  ]));
  return panel('How the score works', `<div class="prose">
      <p>Each currency starts at <b>50</b>. Eligible evidence adds or deducts points, with the result bounded between 0 and 100. The score expresses a fundamental bias. It is not a success probability, price forecast, or calibrated trading signal.</p>
      <p><b>Missing evidence is not neutral evidence.</b> Missing, stale, or incomparable observations receive no adjustment and reduce evidence quality. A currency with low evidence quality is provisional; its pairs receive no directional handoff.</p>
    </div>${rules}<div class="prose"><p><b>Pair gap:</b> absolute score difference. 0–10 No Edge; 11–20 Weak Edge; 21–40 Tradable Edge; 41–60 Strong Edge; 61+ Exceptional Edge. These requested labels do not establish profitability. Conventional pair notation determines LONG or SHORT. Ties share a rank. A directional edge needs more than 10 points and adequate evidence in both currencies.</p></div>`,
  { note: `Research model ${esc(method.version || '1.0.0')}` })
    + panel('Surprise thresholds', `${thresholds}<div class="prose">
      <p>High evidence quality requires 8/9 current observations and 7/8 eligible scoring components; Medium requires 6/9 and 4/8. Otherwise Low. This measures research coverage, not the chance of a winning trade. Headline and core consensus are both required for full inflation coverage.</p>
      <p>Freshness limits: 50 days for monthly releases and PMI; 120 days for GDP, central-bank guidance and decisions, New Zealand quarterly data, and euro-area / Swiss quarterly employment. Older verified readings remain visible but do not affect scores.</p>
      <p>${scheduleText(method)}. These are scheduled start times, not guaranteed publication times. Scheduling delays, missing data, or exhausted budgets leave the previous report visible with its original timestamp.</p>
    </div>`, { note: 'Version 1 heuristics' })
    + sourceRegistry(method);
}

// ── Currency breakdown dialog ────────────────────────────────────────────────────────────────

export function details(report, currency) {
  const c = report.currencies.find((x) => x.currency === currency);
  const cls = (p) => (p > 0 ? 'up' : p < 0 ? 'down' : 'flat');
  const evidenceLines = (f) => (f.evidenceIds || []).map((id) => {
    const e = (report.evidence || []).find((x) => x.id === id);
    return e ? `<p class="fine">${safeLink(e.sourceUrl, e.sourceName || 'Source unavailable')} · ${esc(e.sourceDate || 'Date unavailable')} · ${esc(e.reading)}</p>` : '';
  }).join('');
  return `<div class="detail-head">
      <span class="eyebrow">${report.demo ? 'Synthetic example' : 'Currency breakdown'}</span>
      <h2 id="detail-title"><span class="ccy">${currency}</span> <span class="num ${tone(c.score)}">${c.score}</span><span class="muted">/100</span></h2>
      <p class="fine">${esc(c.bias)} · Evidence ${esc(c.quality)} · Agreement ${esc(c.agreement)}</p>
    </div>
    <div class="factors">
      <div class="factor base"><div><b>Neutral starting point</b></div><span class="num">50</span></div>
      ${c.factors.map((f) => `<div class="factor"><div><b>${esc(f.label)}</b><p>${esc(f.reason)}</p>${evidenceLines(f)}</div><span class="num ${cls(f.points)}">${sign(f.points)}</span></div>`).join('')}
      <div class="factor total"><div><b>Final score</b> <span class="fine">bounded 0–100</span></div><span class="num ${tone(c.score)}">${c.score}</span></div>
    </div>`;
}
