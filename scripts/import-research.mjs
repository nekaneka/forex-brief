// Subscription-backed cloud research enters here. This command never calls a model API.
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { CURRENCIES } from '../lib/config.mjs';
import { researchSchema } from '../lib/schema.mjs';
import { validateResearch } from '../lib/validation.mjs';
import { buildReport } from '../lib/scoring.mjs';
import { markdownReport } from '../lib/markdown.mjs';
import { viennaParts } from '../lib/schedule.mjs';
import { readJson, writeJson } from '../lib/storage.mjs';

// Evaluate the small JSON Schema vocabulary used by researchSchema. Fail on new
// unsupported keywords instead of silently accepting a weaker schema.
function assertSchema(value, schema, at = 'research') {
  const supported = ['type', 'enum', 'required', 'properties', 'additionalProperties', 'items'];
  if (Object.keys(schema).some(key => !supported.includes(key))) throw Error('UNSUPPORTED_SCHEMA_KEYWORD');
  const type = value === null ? 'null' : Array.isArray(value) ? 'array' : typeof value;
  const types = Array.isArray(schema.type) ? schema.type : [schema.type];
  if (!types.includes(type) || (type === 'number' && !Number.isFinite(value)) ||
      (schema.enum && !schema.enum.includes(value))) throw Error(`SCHEMA_MISMATCH: ${at}`);
  if (type === 'object') {
    for (const key of schema.required || []) if (!Object.hasOwn(value, key)) throw Error(`SCHEMA_MISSING: ${at}.${key}`);
    for (const key of Object.keys(value)) {
      if (schema.additionalProperties === false && !Object.hasOwn(schema.properties || {}, key)) throw Error(`SCHEMA_EXTRA: ${at}.${key}`);
      if (schema.properties?.[key]) assertSchema(value[key], schema.properties[key], `${at}.${key}`);
    }
  }
  if (type === 'array' && schema.items) value.forEach((item, i) => assertSchema(item, schema.items, `${at}[${i}]`));
}

export function prepareCloudReport(input, now = new Date()) {
  if (!['morning', 'afternoon'].includes(input.session)) throw Error('INVALID_SESSION');
  const cutoffMs = Date.parse(input.cutoff);
  if (!Number.isFinite(cutoffMs) || cutoffMs > now.getTime() || now.getTime() - cutoffMs > 36 * 3600000)
    throw Error('INVALID_OR_STALE_CUTOFF');
  if (!Array.isArray(input.consultedSources) || !input.consultedSources.length ||
      input.consultedSources.some(url => typeof url !== 'string'))
    throw Error('CONSULTED_SOURCES_REQUIRED');
  const id = `${viennaParts(new Date(cutoffMs)).date}-${input.session}`;
  if (input.id && input.id !== id) throw Error('REPORT_ID_MISMATCH');
  assertSchema(input.research, researchSchema);
  const validated = validateResearch(structuredClone(input.research), CURRENCIES, input.consultedSources, input.cutoff);
  const verified = validated.evidence.filter(row => row.status === 'verified').length;
  // Match the existing API runner's publication gate; never replace a report with mostly unverified evidence.
  if (verified < validated.evidence.length / 2) throw Error('INSUFFICIENT_VERIFIED_COVERAGE');
  const report = buildReport(validated.evidence, validated.risk, validated.events, validated.calendarChecks,
    { id, cutoff: input.cutoff, session: input.session, generatedAt: now.toISOString() });
  report.researchMode = 'subscription-cloud';
  report.validationWarnings = validated.warnings;
  report.consultedSources = [...new Set(input.consultedSources)];
  const unavailable = validated.evidence.filter(row => row.status !== 'verified');
  const missingConsensus = validated.evidence.filter(row => !['central_bank', 'rate_decision'].includes(row.factor) && row.consensus === null);
  const calendarGaps = validated.calendarChecks.filter(row => row.status === 'unavailable');
  if (unavailable.length) report.limitations.push(`Unavailable evidence: ${unavailable.map(row => row.id).join(', ')}. See each source note.`);
  if (missingConsensus.length) report.limitations.push(`${missingConsensus.length} numeric observations lack a comparable sourced consensus; prior values are not used as consensus.`);
  if (calendarGaps.length) report.limitations.push(`${calendarGaps.length}/48 calendar categories could not be verified. No listed event is not a guarantee against unscheduled events.`);
  if (!validated.risk.verified) report.limitations.push(validated.risk.reason);
  return report;
}

export async function importCloudResearch(input, { dataDir = 'dist/data', stateDir = 'state', now = new Date() } = {}) {
  const report = prepareCloudReport(input, now);
  const index = await readJson(`${dataDir}/index.json`, []);
  const state = await readJson(`${stateDir}/runs.json`, { completed: [] });
  if (index.some(row => row.id === report.id) || state.completed.includes(report.id))
    throw Error('REPORT_ID_EXISTS');
  // Validate everything before writing. Publish these files together in one Git commit.
  await mkdir(`${dataDir}/reports`, { recursive: true });
  await writeJson(`${dataDir}/reports/${report.id}.json`, report);
  await writeFile(`${dataDir}/reports/${report.id}.md`, markdownReport(report));
  index.unshift({ id: report.id, generatedAt: report.generatedAt, cutoff: report.cutoff,
    session: report.session, status: report.status, modelVersion: report.modelVersion,
    scores: Object.fromEntries(report.currencies.map(row => [row.currency, row.score])) });
  await writeJson(`${dataDir}/index.json`, index);
  await writeJson(`${dataDir}/latest.json`, report);
  await writeJson(`${stateDir}/runs.json`, { ...state, completed: [...state.completed, report.id] });
  await writeJson(`${dataDir}/status.json`, { attemptedAt: input.cutoff, runId: report.id,
    session: report.session, status: 'success', lastSuccess: report.generatedAt,
    researchMode: report.researchMode,
    message: report.status === 'partial' ? 'Cloud report published with some incomplete evidence.' : 'Cloud report published.' });
  return report;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const file = process.argv[2];
  if (!file) throw Error('Usage: node scripts/import-research.mjs research-envelope.json');
  const input = JSON.parse(await readFile(file, 'utf8'));
  const report = await importCloudResearch(input, {
    dataDir: process.env.REPORT_DATA_DIR || 'dist/data',
    stateDir: process.env.REPORT_STATE_DIR || 'state',
  });
  console.log(`Prepared ${report.id}: ${report.evidence.filter(row => row.status === 'verified').length}/72 verified evidence rows, ${report.validationWarnings.length} validation warnings. Commit the generated report files together.`);
}
