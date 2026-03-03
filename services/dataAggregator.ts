
import { SEOAnalysis, AdsAnalysis, DedupAnalysis, ProductOpportunity, SelectionAgentData } from '../types';
import { runSEOAnalysis } from './semrushService';
import { runAdsAnalysis } from './facebookAdsService';
import { runDedupAnalysis } from './dedupService';

// Scoring weights
const WEIGHTS = {
  seo: 0.40,
  social: 0.20,
  ads: 0.25,
  dedup: 0.15, // penalty weight
};

/**
 * Compute SEO score for a keyword (0-100)
 * High volume + low difficulty + high traffic = high score
 */
function computeSEOScore(volume: number, kd: number, traffic: number): number {
  const volumeScore = Math.min(volume / 100000 * 40, 40);
  const difficultyScore = Math.max(0, (100 - kd) / 100 * 30);
  const trafficScore = Math.min(traffic / 50000 * 30, 30);
  return Math.round(volumeScore + difficultyScore + trafficScore);
}

/**
 * Compute ads presence score (0-100)
 * More competitor ads = more validated market
 */
function computeAdsScore(adCount: number, isActive: boolean): number {
  const countScore = Math.min(adCount * 15, 60);
  const activityBonus = isActive ? 40 : 20;
  return Math.min(Math.round(countScore + activityBonus), 100);
}

/**
 * Compute social score from trend data (placeholder for TikHub integration)
 */
function computeSocialScore(_keyword: string): number {
  // In production, cross-reference with TikHub social signals
  return Math.floor(Math.random() * 40) + 30;
}

/**
 * Determine recommendation based on total score and dedup status
 */
function getRecommendation(
  totalScore: number,
  dedupStatus: string
): ProductOpportunity['recommendation'] {
  if (dedupStatus === 'duplicate') return 'skip';
  if (dedupStatus === 'exists_sitemap' || dedupStatus === 'exists_cms') return 'low_priority';
  if (totalScore >= 70) return 'high_priority';
  if (totalScore >= 45) return 'worth_exploring';
  return 'low_priority';
}

/**
 * Generate reasoning text for a recommendation
 */
function generateReasoning(opp: Omit<ProductOpportunity, 'reasoning'>): string {
  const parts: string[] = [];
  if (opp.seoScore > 60) parts.push(`Strong SEO potential (vol: ${opp.searchVolume.toLocaleString()}, KD: ${opp.kd})`);
  if (opp.adsScore > 50) parts.push(`Validated by ${opp.adCount} competitor ads`);
  if (opp.dedupStatus === 'new') parts.push('New opportunity - not yet covered');
  if (opp.dedupStatus === 'duplicate') parts.push('Already exists in sitemap and CMS');
  if (opp.dedupStatus === 'exists_notion') parts.push('Listed in Notion DB - check status');
  if (opp.kd < 30) parts.push('Low keyword difficulty - easy to rank');
  return parts.join('. ') || 'Moderate opportunity worth reviewing';
}

/**
 * Aggregate all channels into scored product opportunities
 */
export function aggregateOpportunities(
  seo: SEOAnalysis,
  ads: AdsAnalysis,
  dedup: DedupAnalysis
): ProductOpportunity[] {
  const opportunities: ProductOpportunity[] = [];

  // Map ads by keyword mentions
  const adKeywordMap = new Map<string, number>();
  const activeAdKeywords = new Set<string>();
  for (const ad of ads.ads) {
    const texts = [...ad.adCreativeBodies, ...ad.adCreativeLinkTitles].join(' ').toLowerCase();
    for (const kw of seo.keywords) {
      const kwLower = kw.keyword.toLowerCase();
      const kwWords = kwLower.split(' ');
      if (kwWords.some(w => texts.includes(w))) {
        adKeywordMap.set(kwLower, (adKeywordMap.get(kwLower) || 0) + 1);
        if (ad.isActive) activeAdKeywords.add(kwLower);
      }
    }
  }

  // Map dedup entries
  const dedupMap = new Map(dedup.entries.map(e => [e.keyword.toLowerCase(), e]));

  // Score each SEO keyword
  for (const kw of seo.keywords) {
    const kwLower = kw.keyword.toLowerCase();
    const adCount = adKeywordMap.get(kwLower) || 0;
    const isActiveAd = activeAdKeywords.has(kwLower);
    const dedupEntry = dedupMap.get(kwLower);

    const seoScore = computeSEOScore(kw.searchVolume, kw.kd, kw.traffic);
    const socialScore = computeSocialScore(kw.keyword);
    const adsScore = computeAdsScore(adCount, isActiveAd);

    const dedupStatus = dedupEntry?.status || 'new';
    const dedupPenalty = dedupStatus === 'duplicate' ? 0.3 :
                         dedupStatus === 'exists_sitemap' ? 0.6 :
                         dedupStatus === 'exists_cms' ? 0.7 :
                         dedupStatus === 'exists_notion' ? 0.8 : 1.0;

    const rawScore = (seoScore * WEIGHTS.seo) + (socialScore * WEIGHTS.social) + (adsScore * WEIGHTS.ads);
    const totalScore = Math.round(rawScore * dedupPenalty);

    const opp: Omit<ProductOpportunity, 'reasoning'> = {
      id: `opp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      keyword: kw.keyword,
      category: categorizeKeyword(kw.keyword),
      source: 'combined',
      seoScore,
      socialScore,
      adsScore,
      dedupStatus,
      totalScore,
      searchVolume: kw.searchVolume,
      kd: kw.kd,
      traffic: kw.traffic,
      adCount,
      region: kw.region,
      recommendation: getRecommendation(totalScore, dedupStatus),
    };

    opportunities.push({
      ...opp,
      reasoning: generateReasoning(opp),
    });
  }

  // Sort by total score descending
  return opportunities.sort((a, b) => b.totalScore - a.totalScore);
}

/**
 * Categorize keyword into product type
 */
function categorizeKeyword(keyword: string): string {
  const kw = keyword.toLowerCase();
  if (kw.includes('portrait') || kw.includes('headshot') || kw.includes('selfie')) return 'Portrait';
  if (kw.includes('filter') || kw.includes('anime') || kw.includes('cartoon')) return 'Filter';
  if (kw.includes('remove') || kw.includes('background') || kw.includes('upscale') || kw.includes('enhance')) return 'Tool';
  if (kw.includes('video') || kw.includes('avatar')) return 'Video';
  if (kw.includes('swap') || kw.includes('cosplay')) return 'Cosplay';
  if (kw.includes('fashion') || kw.includes('try-on') || kw.includes('try on')) return 'Fashion';
  if (kw.includes('restoration') || kw.includes('colorize') || kw.includes('old photo')) return 'Nostalgia';
  return 'Other';
}

/**
 * Run full omni-channel analysis pipeline
 */
export async function runFullAnalysis(): Promise<SelectionAgentData> {
  // Run all channel analyses in parallel
  const [seo, ads] = await Promise.all([
    runSEOAnalysis(),
    runAdsAnalysis(),
  ]);

  // Run dedup using SEO keywords
  const keywords = seo.keywords.map(kw => kw.keyword);
  const dedup = await runDedupAnalysis(keywords);

  // Aggregate and score
  const opportunities = aggregateOpportunities(seo, ads, dedup);

  return {
    seo,
    ads,
    dedup,
    opportunities,
    lastUpdated: Date.now(),
  };
}
