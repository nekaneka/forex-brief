const safe = (v) =>
  String(v ?? '—')
    .replace(/\|/g, '/')
    .replace(/\n/g, ' ');
function table(headers, rows) {
  return [
    headers.map(safe).join(' | '),
    headers.map(() => '---').join(' | '),
    ...rows.map((r) => r.map(safe).join(' | ')),
  ].join('\n');
}
export function markdownReport(r) {
  const score = (c) => r.currencies.find((x) => x.currency === c).score;
  return `# Forex Brief — ${r.id}\n\nPublished: ${r.generatedAt} · Data cutoff: ${r.cutoff} · Display timezone: Europe/Vienna\n\nModel ${r.modelVersion}. Scores express fundamental bias, not probabilities. ${r.status === 'partial' ? 'Partial evidence: low-quality currencies are not eligible for directional handoff.' : ''}\n\n## Section 1 — Data Verification\n\n${table(
    [
      'Factor',
      'Currency',
      'Latest verified reading',
      'Source',
      'Source date',
      'Consensus / prior',
      'Notes',
    ],
    r.evidence.map((e) => [
      e.factor,
      e.currency,
      e.status === 'verified' ? e.reading : 'Unavailable',
      e.sourceUrl ? `[${e.sourceName}](${e.sourceUrl})` : '—',
      e.sourceDate,
      `${e.consensus ?? 'Unavailable'} / ${e.prior ?? 'Unavailable'}`,
      `${e.referencePeriod}; ${e.notes}`,
    ]),
  )}\n\n## Section 2 — Currency Strength Table\n\n${table(
    ['Currency', 'Score', 'Bias', 'Evidence quality', 'Score rationale'],
    r.currencies.map((c) => [
      c.currency,
      c.score,
      c.bias,
      c.quality,
      '50 ' +
        c.factors
          .map((f) => `${f.points >= 0 ? '+' : ''}${f.points} ${f.label}`)
          .join('; '),
    ]),
  )}\n\n${r.currencies.map((c) => `### ${c.currency}\n\n${c.factors.map((f) => `- ${f.label}: ${f.points >= 0 ? '+' : ''}${f.points}. ${f.reason}`).join('\n')}`).join('\n\n')}\n\n## Section 3 — Strongest to Weakest\n\n${r.currencies.map((c) => `${c.rank}. ${c.currency} — ${c.score}`).join('\n')}\n\nTied scores share a rank; currency display order is not a tie-break.\n\n## Section 4 — Top Forex Opportunities\n\n${table(
    ['Rank', 'Pair', 'Direction', 'Edge score', 'Edge class'],
    r.pairs
      .slice(0, 8)
      .map((p, i) => [i + 1, p.pair, p.direction, p.edge, p.edgeClass]),
  )}\n\nModel edge labels do not establish profitability. Low evidence quality makes a pair UNRATED. Shared currencies can imply overlapping exposure.\n\n## Section 5 — GBPUSD Analysis\n\nUSD: ${score('USD')}; GBP: ${score('GBP')}; GBP minus USD: ${r.focus.difference}.\n\n${r.focus.direction === 'UNRATED' ? 'Unrated — insufficient verified evidence.' : r.focus.direction === 'NEUTRAL' ? 'Neutral — wait for clearer fundamental separation.' : `${r.focus.direction === 'LONG' ? 'Bullish' : 'Bearish'}. Only look for ${r.focus.direction} setups.`}\n\nWait for a liquidity sweep, MSS/CISD, fair value gap, and entry trigger.\n\n## Section 6 — Upcoming Events\n\n${table(
    [
      'Date',
      'Time / timezone',
      'Currency',
      'Event',
      'Consensus',
      'Relevance',
      'Source',
    ],
    r.events.map((e) => [
      e.date,
      e.time ? `${e.time} ${e.timezone}` : 'Time not verified',
      e.currency,
      e.event,
      e.consensus,
      e.relevance,
      `[Source](${e.sourceUrl})`,
    ]),
  )}\n\n${table(
    ['Currency', 'Category', 'Calendar coverage', 'Notes'],
    r.calendarChecks.map((c) => [c.currency, c.category, c.status, c.note]),
  )}\n\n## Section 7 — Trader Summary\n\n${r.summary.map((s) => '- ' + s).join('\n')}\n`;
}
