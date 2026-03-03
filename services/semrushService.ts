
import { SEOKeyword, SEOCompetitor, SEORegionVolume, SEOAnalysis } from '../types';

const SEMRUSH_API_KEY = import.meta.env.VITE_SEMRUSH_API_KEY || '';
const SEMRUSH_BASE = 'https://api.semrush.com';

const COMPETITORS = [
  'photoroom.com', 'lensaai.com', 'faceapp.com', 'remini.ai',
  'fotor.com', 'picsart.com', 'remove.bg', 'cutout.pro', 'pixlr.com'
];

// Excluded regions (low-value traffic)
const EXCLUDED_REGIONS = ['in', 'bd', 'pk'];
const MAX_KD = 70; // Max keyword difficulty threshold

/**
 * Endpoint 1: domain_organic - Get competitor keywords with ranking, traffic, KD
 */
export async function fetchDomainOrganic(domain: string, region: string = 'us', limit: number = 50): Promise<SEOKeyword[]> {
  if (!SEMRUSH_API_KEY) return getMockDomainOrganic(domain);

  try {
    const url = `${SEMRUSH_BASE}/?type=domain_organic&key=${SEMRUSH_API_KEY}&display_limit=${limit}&export_columns=Ph,Po,Nq,Cp,Co,Kd,Tr,Tc,Ur&domain=${domain}&database=${region}`;
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`Semrush API error: ${resp.status}`);
    const text = await resp.text();
    return parseSemrushCSV(text, domain, region);
  } catch (e) {
    console.warn(`[Semrush] domain_organic failed for ${domain}, using mock:`, e);
    return getMockDomainOrganic(domain);
  }
}

/**
 * Endpoint 2: domain_organic_organic - Discover related competitor domains
 */
export async function fetchCompetitorDomains(domain: string, region: string = 'us'): Promise<SEOCompetitor[]> {
  if (!SEMRUSH_API_KEY) return getMockCompetitors(domain);

  try {
    const url = `${SEMRUSH_BASE}/?type=domain_organic_organic&key=${SEMRUSH_API_KEY}&display_limit=20&export_columns=Dn,Np,Or,Ot,Ad&domain=${domain}&database=${region}`;
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`Semrush API error: ${resp.status}`);
    const text = await resp.text();
    return parseCompetitorCSV(text);
  } catch (e) {
    console.warn(`[Semrush] domain_organic_organic failed, using mock:`, e);
    return getMockCompetitors(domain);
  }
}

/**
 * Endpoint 3: phrase_this - Get search volume for a keyword in a specific region
 */
export async function fetchPhraseVolume(phrase: string, region: string = 'us'): Promise<SEORegionVolume> {
  if (!SEMRUSH_API_KEY) return getMockPhraseVolume(phrase, region);

  try {
    const url = `${SEMRUSH_BASE}/?type=phrase_this&key=${SEMRUSH_API_KEY}&export_columns=Ph,Nq,Cp,Co&phrase=${encodeURIComponent(phrase)}&database=${region}`;
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`Semrush API error: ${resp.status}`);
    const text = await resp.text();
    const lines = text.trim().split('\n');
    if (lines.length < 2) return getMockPhraseVolume(phrase, region);
    const cols = lines[1].split(';');
    return {
      keyword: cols[0] || phrase,
      region,
      volume: parseInt(cols[1]) || 0,
      cpc: parseFloat(cols[2]) || 0,
      competition: parseFloat(cols[3]) || 0,
    };
  } catch (e) {
    console.warn(`[Semrush] phrase_this failed, using mock:`, e);
    return getMockPhraseVolume(phrase, region);
  }
}

/**
 * Filter keywords: remove low-value regions and high difficulty
 */
export function filterKeywords(keywords: SEOKeyword[]): SEOKeyword[] {
  return keywords.filter(kw => {
    if (EXCLUDED_REGIONS.includes(kw.region.toLowerCase())) return false;
    if (kw.kd > MAX_KD) return false;
    if (kw.searchVolume < 100) return false;
    return true;
  });
}

/**
 * Full SEO analysis: fetch all competitors, aggregate & filter
 */
export async function runSEOAnalysis(domains: string[] = COMPETITORS): Promise<SEOAnalysis> {
  const allKeywords: SEOKeyword[] = [];
  const allCompetitors: SEOCompetitor[] = [];

  // Fetch top 3 competitors in parallel for speed
  const targetDomains = domains.slice(0, 3);
  const [kw1, kw2, kw3] = await Promise.all(
    targetDomains.map(d => fetchDomainOrganic(d))
  );
  allKeywords.push(...kw1, ...kw2, ...kw3);

  // Fetch competitor discovery for primary domain
  const competitors = await fetchCompetitorDomains(domains[0]);
  allCompetitors.push(...competitors);

  // Get US volume for top keywords
  const topKeywords = allKeywords.slice(0, 5);
  const regionVolumes = await Promise.all(
    topKeywords.map(kw => fetchPhraseVolume(kw.keyword, 'us'))
  );

  const filtered = filterKeywords(allKeywords);

  return {
    keywords: filtered,
    competitors: allCompetitors,
    regionVolumes,
    fetchedAt: Date.now(),
    source: SEMRUSH_API_KEY ? 'api' : 'mock',
  };
}

// ---- CSV Parsers ----

function parseSemrushCSV(csv: string, domain: string, region: string): SEOKeyword[] {
  const lines = csv.trim().split('\n');
  if (lines.length < 2) return [];
  return lines.slice(1).map(line => {
    const c = line.split(';');
    return {
      keyword: c[0] || '',
      position: parseInt(c[1]) || 0,
      searchVolume: parseInt(c[2]) || 0,
      cpc: parseFloat(c[3]) || 0,
      competition: parseFloat(c[4]) || 0,
      kd: parseInt(c[5]) || 0,
      traffic: parseInt(c[6]) || 0,
      trafficPercent: parseFloat(c[7]) || 0,
      url: c[8] || '',
      domain,
      region,
    };
  });
}

function parseCompetitorCSV(csv: string): SEOCompetitor[] {
  const lines = csv.trim().split('\n');
  if (lines.length < 2) return [];
  return lines.slice(1).map(line => {
    const c = line.split(';');
    return {
      domain: c[0] || '',
      commonKeywords: parseInt(c[1]) || 0,
      organicKeywords: parseInt(c[2]) || 0,
      organicTraffic: parseInt(c[3]) || 0,
      adwordsKeywords: parseInt(c[4]) || 0,
    };
  });
}

// ---- Mock Data ----

function getMockDomainOrganic(domain: string): SEOKeyword[] {
  const mockKeywords = [
    { kw: 'ai photo editor', vol: 135000, kd: 42, traffic: 28500, pos: 3, cpc: 1.85 },
    { kw: 'remove background from image', vol: 301000, kd: 38, traffic: 42000, pos: 5, cpc: 0.92 },
    { kw: 'ai portrait generator', vol: 74000, kd: 35, traffic: 18200, pos: 2, cpc: 2.15 },
    { kw: 'photo enhancer ai', vol: 49500, kd: 29, traffic: 12800, pos: 4, cpc: 1.45 },
    { kw: 'ai headshot generator', vol: 60500, kd: 44, traffic: 15300, pos: 6, cpc: 3.20 },
    { kw: 'face swap online', vol: 110000, kd: 52, traffic: 22400, pos: 8, cpc: 0.75 },
    { kw: 'ai image upscaler', vol: 40500, kd: 31, traffic: 9800, pos: 3, cpc: 1.10 },
    { kw: 'cartoon selfie ai', vol: 33100, kd: 25, traffic: 8900, pos: 1, cpc: 0.65 },
    { kw: 'ai avatar maker', vol: 55000, kd: 40, traffic: 14200, pos: 7, cpc: 1.90 },
    { kw: 'old photo restoration ai', vol: 22200, kd: 22, traffic: 7500, pos: 2, cpc: 1.35 },
    { kw: 'ai background generator', vol: 27100, kd: 33, traffic: 6800, pos: 5, cpc: 1.55 },
    { kw: 'passport photo maker', vol: 165000, kd: 48, traffic: 35200, pos: 9, cpc: 2.80 },
    { kw: 'ai anime filter', vol: 88000, kd: 28, traffic: 21500, pos: 1, cpc: 0.55 },
    { kw: 'virtual try on clothes', vol: 45000, kd: 45, traffic: 11000, pos: 10, cpc: 2.45 },
    { kw: 'ai photo colorize', vol: 18500, kd: 19, traffic: 5200, pos: 3, cpc: 0.80 },
  ];

  return mockKeywords.map((m, i) => ({
    keyword: m.kw,
    position: m.pos,
    searchVolume: m.vol,
    cpc: m.cpc,
    competition: Math.random() * 0.8 + 0.1,
    kd: m.kd,
    traffic: m.traffic,
    trafficPercent: m.traffic / 500000 * 100,
    url: `https://${domain}/${m.kw.replace(/\s+/g, '-')}`,
    domain,
    region: 'us',
  }));
}

function getMockCompetitors(domain: string): SEOCompetitor[] {
  return COMPETITORS.filter(d => d !== domain).slice(0, 8).map(d => ({
    domain: d,
    commonKeywords: Math.floor(Math.random() * 500) + 100,
    organicKeywords: Math.floor(Math.random() * 10000) + 2000,
    organicTraffic: Math.floor(Math.random() * 500000) + 50000,
    adwordsKeywords: Math.floor(Math.random() * 200) + 10,
  }));
}

function getMockPhraseVolume(phrase: string, region: string): SEORegionVolume {
  return {
    keyword: phrase,
    region,
    volume: Math.floor(Math.random() * 100000) + 5000,
    cpc: Math.random() * 3 + 0.5,
    competition: Math.random() * 0.8 + 0.1,
  };
}
