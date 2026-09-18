import { LABELS, MODEL_VERSION } from '../lib/config.mjs';
import { makePairs, classify } from '../lib/scoring.mjs';
import { writeJson } from '../lib/storage.mjs';
// Explicitly synthetic. Never enters latest.json or the live report archive.
const sample = {
  USD: [10, 5, 5, 5, 0, 3, 0, 0],
  CHF: [10, 0, 0, 5, 0, 3, 0, 0],
  GBP: [0, 5, 5, 0, 0, 0, 0, 0],
  EUR: [0, 0, 0, 0, 0, 3, 0, 0],
  JPY: [-10, 0, 0, 5, 0, 0, 0, 0],
  CAD: [-10, 0, 0, 0, 0, 0, 0, 0],
  AUD: [-10, -5, 0, 0, 0, 3, -5, 0],
  NZD: [-10, -5, -10, 0, 0, 0, 0, 0],
};
const ids = [
  'central_bank',
  'inflation',
  'employment',
  'unemployment',
  'gdp',
  'pmi',
  'retail_sales',
  'risk',
];
const currencies = Object.entries(sample).map(([currency, points], i) => ({
  currency,
  rank: i + 1,
  score: 50 + points.reduce((a, b) => a + b, 0),
  bias: classify(50 + points.reduce((a, b) => a + b, 0)),
  quality: 'Illustrative',
  provisional: false,
  agreement: 'Illustrative',
  verifiedFactors: 0,
  totalFactors: 9,
  factors: points.map((points, i) => ({
    id: ids[i],
    label: LABELS[ids[i]],
    points,
    reason:
      'Synthetic example only. This is not a claim about an economic release or current market conditions.',
    evidenceIds: [],
    eligible: false,
  })),
}));
const pairs = makePairs(currencies);
await writeJson('dist/data/demo.json', {
  id: 'illustrative-preview',
  demo: true,
  modelVersion: MODEL_VERSION,
  session: 'morning',
  currencies,
  pairs,
  focus: pairs.find((p) => p.pair === 'GBPUSD'),
  summary: [
    'USD leads this illustrative ranking at 78/100. These are synthetic example scores.',
    'NZD and AUD sit at the weaker end of the example spectrum.',
    'USD versus NZD has the largest example separation: 53 points.',
    'GBPUSD shows a bearish example bias, with an 18-point difference.',
    'Live event risks and source evidence appear after the first verified research run.',
  ],
  events: [],
  evidence: [],
  calendarChecks: [],
  limitations: [],
});
console.log('Demo created; live data unchanged.');
