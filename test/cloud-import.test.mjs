import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { CURRENCIES, FACTORS, CALENDAR_FACTORS } from '../lib/config.mjs';
import { prepareCloudReport, importCloudResearch } from '../scripts/import-research.mjs';
import { writeJson } from '../lib/storage.mjs';
const cutoff = '2026-10-06T11:30:00Z', now = new Date('2026-10-06T12:00:00Z');
const url = 'https://www.bls.gov/news.release/cpi.htm';
function envelope() {
  return { cutoff, session: 'afternoon', consultedSources: [url], research: {
    evidence: CURRENCIES.flatMap(currency => FACTORS.map(factor => ({ currency, factor,
      status: 'verified', actual: 1, unit: '%', reading: '1%', consensus: null, prior: null,
      referencePeriod: 'September 2026', sourceUrl: url, sourceDate: '2026-10-01',
      definitionMatched: true, comparisonMatched: false, tone: 'neutral', notes: 'Test fixture', searchQuery: `${currency} ${factor}` }))),
    calendarChecks: CURRENCIES.flatMap(currency => CALENDAR_FACTORS.map(category => ({currency, category,
      status: 'none_verified', sourceUrl: url, note: 'Test fixture'}))), events: [], risk: {},
  }};
}
test('cloud import rejects unsupported provenance and missing categories before changing published files', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'forex-cloud-'));
  try {
    await writeJson(`${dir}/latest.json`, { id: 'previous' });
    const input = envelope(); input.consultedSources = ['https://www.ecb.europa.eu/'];
    await assert.rejects(importCloudResearch(input, {dataDir: dir, stateDir: `${dir}/state`, now}), /INSUFFICIENT_VERIFIED_COVERAGE/);
    assert.equal(JSON.parse(await readFile(`${dir}/latest.json`)).id, 'previous');
    const incomplete = envelope(); incomplete.research.calendarChecks.pop();
    assert.throws(() => prepareCloudReport(incomplete, now), /Missing calendar search/);
  } finally { await rm(dir, {recursive: true, force: true}); }
});
test('cloud publication preserves archive and prevents duplicate session overwrite', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'forex-cloud-'));
  try {
    const opts = {dataDir: dir, stateDir: `${dir}/state`, now};
    const report = await importCloudResearch(envelope(), opts);
    assert.equal(report.id, '2026-10-06-afternoon');
    assert.equal(report.researchMode, 'subscription-cloud');
    assert.equal(report.summary.length, 5);
    assert.equal(report.pairs.length, 28);
    const before = await readFile(`${dir}/latest.json`, 'utf8');
    await assert.rejects(importCloudResearch(envelope(), opts), /REPORT_ID_EXISTS/);
    assert.equal(await readFile(`${dir}/latest.json`, 'utf8'), before);
    assert.equal(await readFile(`${dir}/reports/${report.id}.json`, 'utf8'), before);
  } finally { await rm(dir, {recursive: true, force: true}); }
});
test('cloud cutoff and session identity cannot silently relabel stale or future research', () => {
  const input = envelope();
  assert.throws(() => prepareCloudReport(input, new Date('2026-10-08')), /STALE_CUTOFF/);
  assert.throws(() => prepareCloudReport(input, new Date('2026-10-05')), /STALE_CUTOFF/);
  input.id = '2026-10-07-afternoon';
  assert.throws(() => prepareCloudReport(input, now), /REPORT_ID_MISMATCH/);
});
