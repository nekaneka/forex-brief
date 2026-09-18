import { overview, evidence, calendar, history, methodology, details, esc, fmt, scheduleText, bindHistoryChart } from './views.js';

const $ = (s) => document.querySelector(s);
const VIEWS = { overview, evidence, calendar, history, method: methodology };
const STALE_HOURS = 18;

let report = null;
let view = 'overview';
let index = [];
let method = {};
let runStatus = {};
let currencyFilter = 'all';
let loadVersion = 0; // guards against an older, slower load overwriting a newer selection

async function json(url, fallback) {
  try {
    const response = await fetch(url, { cache: 'no-store' });
    return response.ok ? await response.json() : fallback;
  } catch {
    return fallback;
  }
}

/**
 * One freshness state drives both the banner colour and the header badge. A demo can never be
 * "live"; an archived report is labelled archived, and a current run failure is only reported
 * against the latest report, never against a historical one.
 */
function freshness() {
  if (report.demo) return { label: 'Preview', cls: 'warn' };
  const archived = $('#report-select').value !== 'latest';
  if (archived) return { label: 'Archive', cls: 'muted' };
  const age = (Date.now() - Date.parse(report.generatedAt)) / 3600000;
  if (runStatus.status === 'failed') return { label: 'Update failed', cls: 'warn' };
  if (age > STALE_HOURS) return { label: 'Stale', cls: 'warn' };
  if (Number.isFinite(age) && age >= 0 && age <= STALE_HOURS && runStatus.status === 'success' && report.status === 'verified') return { label: 'Live', cls: 'live' };
  if (report.status === 'partial') return { label: 'Partial', cls: 'warn' };
  return { label: 'Published', cls: 'muted' };
}

function updateBanner() {
  const banner = $('#status-banner');
  const badge = $('#freshness');
  const state = freshness();
  badge.textContent = state.label;
  badge.className = `badge ${state.cls}`;
  banner.classList.remove('live');

  if (report.demo) {
    banner.textContent = 'Illustrative preview · All scores are synthetic. Live reporting is not connected or this preview was selected.';
    return;
  }
  const age = (Date.now() - Date.parse(report.generatedAt)) / 3600000;
  const archived = $('#report-select').value !== 'latest';
  const parts = [archived ? 'Archived report' : `Published ${fmt(report.generatedAt)}`, `Data cutoff ${fmt(report.cutoff)}`];
  if (!archived && runStatus.status === 'failed') parts.push(runStatus.message);
  if (!archived && age > STALE_HOURS) parts.push('Outdated: check for newer releases before using this bias.');
  if (report.status === 'partial') parts.push('Partial evidence: some currencies are provisional.');
  if (!archived && runStatus.status === 'running') parts.push('Next report is being researched.');
  if (!archived && Number.isFinite(age) && age >= 0 && age <= STALE_HOURS && runStatus.status === 'success' && report.status === 'verified') banner.classList.add('live');
  banner.textContent = parts.join(' · ');
}

function render() {
  document.querySelectorAll('.tab').forEach((el) => {
    const active = el.dataset.view === view;
    el.classList.toggle('active', active);
    el.setAttribute('aria-current', active ? 'page' : 'false');
  });
  $('#schedule-note').innerHTML = scheduleText(method);
  if (!report) {
    $('#content').innerHTML = '<section class="panel"><div class="empty">The dashboard data could not be loaded. Use refresh to try again.</div></section>';
    return;
  }
  $('#model-version').textContent = `Model ${report.modelVersion}`;
  $('#report-edition').textContent = report.demo ? 'Illustrative preview' : `${report.session} brief · ${fmt(report.generatedAt)}`;
  updateBanner();
  $('#content').innerHTML = VIEWS[view]({ report, index, method, currencyFilter });
  if (view === 'history') bindHistoryChart($('#content'));
}

async function load(selected = $('#report-select').value) {
  const version = ++loadVersion;
  $('#refresh').disabled = true;
  const [latest, demo, archive, config, status] = await Promise.all([
    json('data/latest.json', null),
    json('data/demo.json', null),
    json('data/index.json', []),
    json('data/methodology.json', {}),
    json('data/status.json', {}),
  ]);
  const next = selected === 'demo' ? demo
    : selected === 'latest' ? latest
      : await json(`data/reports/${encodeURIComponent(selected)}.json`, null);
  if (version !== loadVersion) return;

  index = archive;
  method = config;
  runStatus = status;
  // A report is only shown if it is complete; anything else falls back to the labelled preview.
  const valid = next?.currencies?.length === 8 && next?.pairs?.length === 28 && next?.summary?.length === 5;
  report = valid ? next : demo;

  $('#report-select').innerHTML = `<option value="latest">Latest report</option><option value="demo">Illustrative preview</option>${index.map((r) => `<option value="${esc(r.id)}">${esc(r.id)}</option>`).join('')}`;
  $('#report-select').value = selected;
  $('#refresh').disabled = false;
  render();
  if (selected !== 'latest' && selected !== 'demo' && !valid) {
    $('#status-banner').textContent = 'The requested archive could not be loaded. Showing the labelled preview instead.';
  }
}

document.addEventListener('click', async (e) => {
  const nav = e.target.closest('[data-view]');
  if (nav) {
    view = nav.dataset.view;
    render();
    window.scrollTo({ top: 0 });
  }
  const c = e.target.closest('[data-currency]');
  if (c && report) {
    $('#detail-content').innerHTML = details(report, c.dataset.currency);
    $('#detail').showModal();
  }
  const r = e.target.closest('[data-report]');
  if (r) {
    view = 'overview';
    await load(r.dataset.report);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
});

document.addEventListener('change', (e) => {
  if (e.target.id === 'currency-filter') {
    currencyFilter = e.target.value;
    render();
  }
});

$('#close-detail').onclick = () => $('#detail').close();
$('#detail').addEventListener('click', (e) => { if (e.target === $('#detail')) $('#detail').close(); });
$('#refresh').onclick = () => load();
$('#report-select').onchange = () => load();

function clock() {
  $('#vienna-clock').textContent = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Vienna', hour: '2-digit', minute: '2-digit', timeZoneName: 'short' }).format(new Date());
  if (report) updateBanner();
}
clock();
setInterval(clock, 60000);
load();
