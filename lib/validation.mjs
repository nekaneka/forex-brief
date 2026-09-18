import { FACTORS, CALENDAR_FACTORS, allowedDomains } from './config.mjs';
export function allowedUrl(raw) {
  try {
    const u = new URL(raw);
    return (
      u.protocol === 'https:' &&
      !u.username &&
      !u.password &&
      allowedDomains.some(
        (d) => u.hostname === d || u.hostname.endsWith('.' + d),
      )
    );
  } catch {
    return false;
  }
}
function canonical(raw) {
  try {
    const u = new URL(raw);
    u.hash = '';
    return u.href.replace(/\/$/, '');
  } catch {
    return '';
  }
}
export function extractSources(response) {
  const sources = [];
  for (const o of response.output || []) {
    for (const s of o.action?.sources || []) if (s.url) sources.push(s.url);
    for (const c of o.content || [])
      for (const a of c.annotations || []) if (a.url) sources.push(a.url);
  }
  return [...new Set(sources)];
}
export function validateResearch(data, group, sources, cutoff) {
  if (
    !Array.isArray(data.evidence) ||
    !Array.isArray(data.events) ||
    !Array.isArray(data.calendarChecks)
  )
    throw Error('Research response missing required arrays');
  const consulted = new Set(sources.map(canonical));
  const sourced = (url) => allowedUrl(url) && consulted.has(canonical(url));
  const seen = new Set();
  const warnings = [];
  for (const row of data.evidence) {
    const key = `${row.currency}:${row.factor}`;
    if (
      !group.includes(row.currency) ||
      !FACTORS.includes(row.factor) ||
      seen.has(key)
    )
      throw Error('Duplicate or unexpected evidence category');
    seen.add(key);
    row.id = key;
    row.retrievedAt = cutoff;
    if (!row.searchQuery?.trim())
      throw Error(`Missing search record for ${key}`);
    if (row.status === 'verified') {
      if (
        !sourced(row.sourceUrl) ||
        !row.sourceDate ||
        !/^\d{4}-\d{2}-\d{2}(T.*)?$/.test(row.sourceDate) ||
        !Number.isFinite(Date.parse(row.sourceDate)) ||
        Date.parse(row.sourceDate) > Date.parse(cutoff) ||
        !row.referencePeriod?.trim() ||
        !row.reading?.trim() ||
        (!['central_bank', 'rate_decision'].includes(row.factor) &&
          !Number.isFinite(row.actual))
      ) {
        row.status = 'unavailable';
        row.notes +=
          ' Source provenance, value, reference period, or release date could not be validated.';
        warnings.push(key);
      }
      if (
        row.consensus !== null &&
        (!sourced(row.consensusSourceUrl) ||
          !Number.isFinite(row.consensus) ||
          !row.comparisonMatched)
      ) {
        row.consensus = null;
        row.comparisonMatched = false;
        row.notes +=
          ' Consensus not source-backed or comparable; surprise scoring withheld.';
      }
    }
  }
  for (const c of group)
    for (const f of FACTORS)
      if (!seen.has(`${c}:${f}`))
        throw Error(`Missing searched category ${c}:${f}`);
  const start = cutoff.slice(0, 10),
    end = new Date(Date.parse(cutoff) + 7 * 86400000)
      .toISOString()
      .slice(0, 10);
  data.events = data.events.filter((e) => {
    if (
      !group.includes(e.currency) ||
      !CALENDAR_FACTORS.includes(e.category) ||
      !sourced(e.sourceUrl) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(e.date) ||
      e.date < start ||
      e.date > end
    )
      return false;
    if (e.instant) {
      if (
        !/T.*(Z|[+-]\d{2}:\d{2})$/.test(e.instant) ||
        !Number.isFinite(Date.parse(e.instant)) ||
        Date.parse(e.instant) < Date.parse(cutoff) ||
        Date.parse(e.instant) >= Date.parse(cutoff) + 7 * 86400000
      )
        return false;
    }
    if (e.time && (!e.timezone || !e.instant)) {
      e.time = null;
      e.timezone = null;
    }
    return true;
  });
  const checks = new Set();
  for (const check of data.calendarChecks) {
    const key = `${check.currency}:${check.category}`;
    if (
      !group.includes(check.currency) ||
      !CALENDAR_FACTORS.includes(check.category) ||
      checks.has(key)
    )
      throw Error('Unexpected calendar check');
    checks.add(key);
    if (!sourced(check.sourceUrl)) {
      check.status = 'unavailable';
      check.note = 'Calendar coverage could not be verified.';
    }
    if (
      check.status === 'scheduled' &&
      !data.events.some(
        (e) => e.currency === check.currency && e.category === check.category,
      )
    ) {
      check.status = 'unavailable';
      check.note = 'Scheduled event could not be validated.';
    }
  }
  for (const c of group)
    for (const f of CALENDAR_FACTORS)
      if (!checks.has(`${c}:${f}`))
        throw Error(`Missing calendar search ${c}:${f}`);
  const risk = data.risk;
  const age = (Date.parse(cutoff) - Date.parse(risk?.asOf)) / 3600000;
  const valid =
    Number.isFinite(risk?.equityChangePct) &&
    Number.isFinite(risk?.vixChangePct) &&
    age >= 0 &&
    age <= 36 &&
    sourced(risk.equitySourceUrl) &&
    sourced(risk.vixSourceUrl);
  data.risk = {
    ...risk,
    verified: valid,
    regime:
      valid && risk.equityChangePct >= 0.5 && risk.vixChangePct <= -5
        ? 'risk_on'
        : valid && risk.equityChangePct <= -0.5 && risk.vixChangePct >= 5
          ? 'risk_off'
          : 'mixed',
    reason: valid
      ? `S&P 500 daily change ${risk.equityChangePct}%; VIX daily change ${risk.vixChangePct}%, as of ${risk.asOf}. Risk-on requires equities ≥+0.5% and VIX ≤−5%; risk-off requires equities ≤−0.5% and VIX ≥+5%. Otherwise mixed.`
      : 'Fresh source-backed S&P 500 and VIX changes unavailable; no risk adjustment.',
  };
  return { ...data, warnings };
}
