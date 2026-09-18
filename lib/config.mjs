export const CURRENCIES = [
  'USD',
  'EUR',
  'GBP',
  'JPY',
  'CHF',
  'AUD',
  'NZD',
  'CAD',
];
export const FACTORS = [
  'central_bank',
  'rate_decision',
  'headline_cpi',
  'core_cpi',
  'employment',
  'unemployment',
  'gdp',
  'pmi',
  'retail_sales',
];
export const LABELS = {
  central_bank: 'Central-bank guidance',
  rate_decision: 'Policy-rate decision',
  headline_cpi: 'Headline inflation',
  core_cpi: 'Core inflation',
  inflation: 'Inflation',
  employment: 'Employment',
  unemployment: 'Unemployment',
  gdp: 'GDP',
  pmi: 'PMI',
  retail_sales: 'Retail / household spending',
  risk: 'Risk sentiment',
};
export const SOURCES = {
  USD: {
    name: 'United States',
    bank: [
      'Federal Reserve',
      'https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm',
    ],
    stats: [
      ['BLS', 'https://www.bls.gov/bls/newsrels.htm'],
      ['BEA', 'https://www.bea.gov/news/schedule'],
      ['Census Bureau', 'https://www.census.gov/retail/index.html'],
    ],
    pmi: [
      'S&P Global',
      'https://www.pmi.spglobal.com/Public/Home/PressRelease',
    ],
    series: {
      headline_cpi: 'CPI all items, seasonally adjusted m/m %',
      core_cpi: 'CPI excluding food and energy, seasonally adjusted m/m %',
      employment: 'Nonfarm payroll change, thousands, seasonally adjusted',
      unemployment: 'U-3 unemployment rate, %, seasonally adjusted',
      gdp: 'Real GDP q/q annualized %, seasonally adjusted',
      pmi: 'S&P Global composite output PMI, latest flash or final',
      retail_sales:
        'Total retail and food services sales, seasonally adjusted m/m %',
    },
  },
  EUR: {
    name: 'Euro area',
    bank: [
      'ECB',
      'https://www.ecb.europa.eu/press/govcdec/mopo/html/index.en.html',
    ],
    stats: [
      ['Eurostat', 'https://ec.europa.eu/eurostat/news/release-calendar'],
    ],
    pmi: [
      'S&P Global',
      'https://www.pmi.spglobal.com/Public/Home/PressRelease',
    ],
    series: {
      headline_cpi: 'Euro-area all-items HICP y/y %',
      core_cpi:
        'Euro-area HICP excluding energy, food, alcohol and tobacco y/y %',
      employment: 'Euro-area employment q/q %, seasonally adjusted',
      unemployment: 'Euro-area unemployment rate %, seasonally adjusted',
      gdp: 'Euro-area real GDP q/q %, seasonally adjusted',
      pmi: 'S&P Global eurozone composite output PMI, latest flash or final',
      retail_sales: 'Euro-area retail trade volume m/m %, seasonally adjusted',
    },
  },
  GBP: {
    name: 'United Kingdom',
    bank: [
      'Bank of England',
      'https://www.bankofengland.co.uk/monetary-policy',
    ],
    stats: [['ONS', 'https://www.ons.gov.uk/releasecalendar']],
    pmi: [
      'S&P Global',
      'https://www.pmi.spglobal.com/Public/Home/PressRelease',
    ],
    series: {
      headline_cpi: 'CPI y/y %',
      core_cpi: 'CPI excluding energy, food, alcohol and tobacco y/y %',
      employment:
        'Employment change over three months, thousands, seasonally adjusted',
      unemployment: 'ILO unemployment rate %, seasonally adjusted',
      gdp: 'Quarterly real GDP q/q %, seasonally adjusted',
      pmi: 'S&P Global UK composite output PMI, latest flash or final',
      retail_sales:
        'Retail sales volume including automotive fuel m/m %, seasonally adjusted',
    },
  },
  JPY: {
    name: 'Japan',
    bank: ['Bank of Japan', 'https://www.boj.or.jp/en/mopo/index.htm'],
    stats: [
      ['Statistics Bureau', 'https://www.stat.go.jp/english/'],
      ['Cabinet Office', 'https://www.esri.cao.go.jp/en/sna/menu.html'],
      ['METI', 'https://www.meti.go.jp/english/statistics/'],
    ],
    pmi: [
      'S&P Global',
      'https://www.pmi.spglobal.com/Public/Home/PressRelease',
    ],
    series: {
      headline_cpi: 'National CPI all items y/y %',
      core_cpi:
        'National CPI excluding fresh food y/y %; do not substitute Tokyo CPI',
      employment: 'Employment change m/m, thousands, seasonally adjusted',
      unemployment: 'Unemployment rate %, seasonally adjusted',
      gdp: 'Real GDP q/q %, seasonally adjusted, NOT annualized',
      pmi: 'S&P Global Japan composite output PMI, latest flash or final',
      retail_sales: 'Retail sales m/m %, seasonally adjusted',
    },
  },
  CHF: {
    name: 'Switzerland',
    bank: [
      'Swiss National Bank',
      'https://www.snb.ch/en/the-snb/mandates-goals/monetary-policy',
    ],
    stats: [
      [
        'Federal Statistical Office',
        'https://www.bfs.admin.ch/bfs/en/home.html',
      ],
      ['SECO', 'https://www.seco.admin.ch/en/economic-situation'],
    ],
    pmi: ['procure.ch', 'https://www.procure.ch/'],
    series: {
      headline_cpi: 'CPI y/y %',
      core_cpi: 'FSO core inflation 1 y/y %',
      employment:
        'Total employment q/q %, same official definition for actual and consensus',
      unemployment: 'SECO registered unemployment rate %, seasonally adjusted',
      gdp: 'Real GDP adjusted for sporting events q/q %, seasonally adjusted',
      pmi: 'procure.ch manufacturing PMI',
      retail_sales: 'Real retail sales y/y %, calendar adjusted',
    },
  },
  AUD: {
    name: 'Australia',
    bank: [
      'Reserve Bank of Australia',
      'https://www.rba.gov.au/monetary-policy/',
    ],
    stats: [['ABS', 'https://www.abs.gov.au/release-calendar/latest-releases']],
    pmi: [
      'S&P Global',
      'https://www.pmi.spglobal.com/Public/Home/PressRelease',
    ],
    series: {
      headline_cpi: 'Monthly CPI all groups y/y %',
      core_cpi: 'Monthly trimmed mean inflation y/y %',
      employment: 'Employment change, thousands, seasonally adjusted',
      unemployment: 'Unemployment rate %, seasonally adjusted',
      gdp: 'Real GDP q/q %, seasonally adjusted',
      pmi: 'S&P Global Australia composite output PMI, latest flash or final',
      retail_sales:
        'Monthly Household Spending Indicator m/m %, current prices, seasonally adjusted; replaces ceased Retail Trade',
    },
  },
  NZD: {
    name: 'New Zealand',
    bank: [
      'Reserve Bank of New Zealand',
      'https://www.rbnz.govt.nz/monetary-policy',
    ],
    stats: [['Stats NZ', 'https://www.stats.govt.nz/release-calendar/']],
    pmi: [
      'BNZ / BusinessNZ',
      'https://www.bnz.co.nz/institutional-banking/research/publications',
    ],
    series: {
      headline_cpi: 'Quarterly CPI y/y %',
      core_cpi:
        'RBNZ sectoral factor model core inflation y/y %, named local core measure',
      employment: 'Employment q/q %, seasonally adjusted',
      unemployment: 'Unemployment rate %, seasonally adjusted',
      gdp: 'Production GDP q/q %, seasonally adjusted',
      pmi: 'BNZ-BusinessNZ manufacturing PMI',
      retail_sales: 'Quarterly retail sales volumes q/q %, seasonally adjusted',
    },
  },
  CAD: {
    name: 'Canada',
    bank: [
      'Bank of Canada',
      'https://www.bankofcanada.ca/core-functions/monetary-policy/',
    ],
    stats: [['Statistics Canada', 'https://www.statcan.gc.ca/en/start']],
    pmi: [
      'S&P Global',
      'https://www.pmi.spglobal.com/Public/Home/PressRelease',
    ],
    series: {
      headline_cpi: 'CPI all items y/y %',
      core_cpi:
        'CPI-trim y/y %, chosen core series; do not switch to CPI-median',
      employment: 'Employment change, thousands, seasonally adjusted',
      unemployment: 'Unemployment rate %, seasonally adjusted',
      gdp: 'Real GDP q/q annualized %, seasonally adjusted',
      pmi: 'S&P Global Canada composite output PMI; if unavailable mark missing, do not substitute Ivey',
      retail_sales: 'Retail sales m/m %, seasonally adjusted, current prices',
    },
  },
};
export const EXTRA_DOMAINS = [
  'tradingeconomics.com',
  'investing.com',
  'forexfactory.com',
  'spglobal.com',
  'pmi.spglobal.com',
  'bnz.co.nz',
  'businessnz.org.nz',
  'procure.ch',
  'ubs.com',
  'cboe.com',
  'stlouisfed.org',
  'fred.stlouisfed.org',
];
export const allowedDomains = [
  ...new Set([
    ...Object.values(SOURCES)
      .flatMap((s) => [s.bank, ...s.stats, s.pmi])
      .map(([, u]) => new URL(u).hostname.replace(/^www\./, '')),
    ...EXTRA_DOMAINS,
  ]),
];
export const CALENDAR_FACTORS = [
  'inflation',
  'employment',
  'gdp',
  'pmi',
  'retail_sales',
  'central_bank',
];
export const MODEL_VERSION = '1.0.0';
// Research thresholds are explicit heuristics, not statistically calibrated trading signals.
export const THRESHOLDS = {
  USD: {
    cpi: [0.05, 0.2],
    employment: [10, 75],
    gdp: [0.1, 0.5],
    retail: 0.05,
  },
  EUR: {
    cpi: [0.05, 0.2],
    employment: [0.05, 0.2],
    gdp: [0.05, 0.3],
    retail: 0.05,
  },
  GBP: {
    cpi: [0.05, 0.2],
    employment: [10, 75],
    gdp: [0.05, 0.3],
    retail: 0.05,
  },
  JPY: {
    cpi: [0.05, 0.2],
    employment: [10, 75],
    gdp: [0.05, 0.3],
    retail: 0.05,
  },
  CHF: {
    cpi: [0.05, 0.2],
    employment: [0.05, 0.2],
    gdp: [0.05, 0.3],
    retail: 0.05,
  },
  AUD: {
    cpi: [0.05, 0.2],
    employment: [5, 25],
    gdp: [0.05, 0.3],
    retail: 0.05,
  },
  NZD: {
    cpi: [0.05, 0.2],
    employment: [0.05, 0.3],
    gdp: [0.05, 0.3],
    retail: 0.05,
  },
  CAD: { cpi: [0.05, 0.2], employment: [5, 25], gdp: [0.1, 0.5], retail: 0.05 },
};
export function maxAge(currency, factor) {
  if (['central_bank', 'rate_decision'].includes(factor)) return 120;
  if (
    factor === 'gdp' ||
    (currency === 'NZD' && factor !== 'pmi') ||
    (['EUR', 'CHF'].includes(currency) && factor === 'employment')
  )
    return 120;
  return 50;
}
