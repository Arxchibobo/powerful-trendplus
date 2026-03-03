
import { DedupEntry, DedupAnalysis } from '../types';

const SITEMAP_URL = 'https://art.myshell.ai/sitemap.xml';
const BASE44_API = 'https://app.base44.com/api';

/**
 * Fetch sitemap and extract slugs from <loc> elements
 */
export async function fetchSitemapSlugs(): Promise<string[]> {
  try {
    const resp = await fetch(SITEMAP_URL);
    if (!resp.ok) throw new Error(`Sitemap fetch failed: ${resp.status}`);
    const text = await resp.text();
    const locMatches = text.match(/<loc>([^<]+)<\/loc>/g) || [];
    return locMatches.map(loc => {
      const url = loc.replace(/<\/?loc>/g, '');
      const parts = url.split('/');
      return parts[parts.length - 1] || parts[parts.length - 2] || '';
    }).filter(Boolean);
  } catch (e) {
    console.warn('[Dedup] Sitemap fetch failed, using mock:', e);
    return getMockSitemapSlugs();
  }
}

/**
 * Fetch existing bots from Base44 CMS
 */
export async function fetchBase44Bots(): Promise<string[]> {
  try {
    const resp = await fetch(`${BASE44_API}/bots`, {
      headers: { 'Accept': 'application/json' },
    });
    if (!resp.ok) throw new Error(`Base44 API error: ${resp.status}`);
    const data = await resp.json();
    return (data || []).map((bot: any) => (bot.slug_id || bot.title || '').toLowerCase());
  } catch (e) {
    console.warn('[Dedup] Base44 fetch failed, using mock:', e);
    return getMockBase44Bots();
  }
}

/**
 * Fetch existing bots from Notion database
 * Note: Notion API requires server-side proxy in production
 */
export async function fetchNotionBots(): Promise<string[]> {
  // Notion API requires secret key and server-side call - use mock for frontend
  console.log('[Dedup] Notion DB check - using mock data (requires backend proxy)');
  return getMockNotionBots();
}

/**
 * Check a list of keywords against all dedup sources
 */
export function checkDedupStatus(
  keywords: string[],
  sitemapSlugs: string[],
  base44Bots: string[],
  notionBots: string[]
): DedupEntry[] {
  const sitemapSet = new Set(sitemapSlugs.map(s => s.toLowerCase()));
  const base44Set = new Set(base44Bots.map(s => s.toLowerCase()));
  const notionSet = new Set(notionBots.map(s => s.toLowerCase()));

  return keywords.map(keyword => {
    const slug = keyword.toLowerCase().replace(/\s+/g, '-');
    const inSitemap = sitemapSet.has(slug) || sitemapSlugs.some(s => s.includes(slug) || slug.includes(s));
    const inBase44 = base44Set.has(slug) || base44Bots.some(s => s.includes(slug) || slug.includes(s));
    const inNotionDB = notionSet.has(slug) || notionBots.some(s => s.includes(slug) || slug.includes(s));

    let status: DedupEntry['status'] = 'new';
    if (inSitemap && inBase44) status = 'duplicate';
    else if (inSitemap) status = 'exists_sitemap';
    else if (inBase44) status = 'exists_cms';
    else if (inNotionDB) status = 'exists_notion';

    return {
      keyword,
      slug,
      inSitemap,
      inBase44,
      inNotionDB,
      existingUrl: inSitemap ? `https://art.myshell.ai/${slug}` : undefined,
      existingBotId: inBase44 ? `bot-${slug}` : undefined,
      existingBotName: inNotionDB ? keyword : undefined,
      status,
    };
  });
}

/**
 * Full dedup analysis
 */
export async function runDedupAnalysis(keywords: string[]): Promise<DedupAnalysis> {
  const [sitemapSlugs, base44Bots, notionBots] = await Promise.all([
    fetchSitemapSlugs(),
    fetchBase44Bots(),
    fetchNotionBots(),
  ]);

  const entries = checkDedupStatus(keywords, sitemapSlugs, base44Bots, notionBots);

  return {
    entries,
    sitemapSlugs,
    base44Bots,
    notionBots,
    fetchedAt: Date.now(),
    source: 'mock', // Always mock in frontend-only mode
  };
}

// ---- Mock Data ----

function getMockSitemapSlugs(): string[] {
  return [
    'ai-photo-editor',
    'remove-background',
    'ai-headshot-generator',
    'face-swap',
    'ai-avatar-maker',
    'photo-enhancer',
    'cartoon-filter',
    'passport-photo',
    'old-photo-restoration',
    'ai-portrait',
    'anime-filter',
    'background-remover',
    'linkedin-headshot',
    'ai-art-generator',
    'image-upscaler',
  ];
}

function getMockBase44Bots(): string[] {
  return [
    'ai-photo-editor',
    'background-remover',
    'face-swap-online',
    'ai-headshot',
    'cartoon-selfie',
    'photo-colorizer',
    'ai-avatar',
    'passport-photo-maker',
    'image-enhancer',
    'ai-portrait-studio',
  ];
}

function getMockNotionBots(): string[] {
  return [
    'ai-anime-filter',
    'ghibli-style-filter',
    'ai-pet-portrait',
    'cyberpunk-portrait',
    'ai-background-generator',
    'virtual-try-on',
    'ai-video-generator',
    'face-enhancer',
  ];
}
