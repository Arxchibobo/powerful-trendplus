
import { FacebookAd, AdsAnalysis } from '../types';

const FB_ADS_TOKEN = import.meta.env.VITE_FB_ADS_TOKEN || '';
const FB_ADS_BASE = 'https://graph.facebook.com/v19.0/ads_archive';

const COMPETITOR_PAGES = [
  'Lensa AI', 'FaceApp', 'Remini', 'PhotoRoom',
  'Fotor', 'Picsart', 'Remove.bg', 'Cutout.pro', 'Pixlr'
];

/**
 * Search Facebook Ads Library for competitor ads
 */
export async function searchFacebookAds(
  searchTerms: string = 'ai photo editor',
  limit: number = 25
): Promise<FacebookAd[]> {
  if (!FB_ADS_TOKEN) return getMockAds();

  try {
    const params = new URLSearchParams({
      access_token: FB_ADS_TOKEN,
      search_terms: searchTerms,
      ad_reached_countries: "['US']",
      ad_active_status: 'ALL',
      fields: 'page_name,page_id,ad_snapshot_url,ad_delivery_start_time,ad_delivery_stop_time,ad_creative_bodies,ad_creative_link_titles,publisher_platforms,languages',
      limit: String(limit),
    });

    const resp = await fetch(`${FB_ADS_BASE}?${params}`);
    if (!resp.ok) throw new Error(`FB Ads API error: ${resp.status}`);
    const json = await resp.json();
    return (json.data || []).map(parseAd);
  } catch (e) {
    console.warn('[Facebook Ads] API call failed, using mock:', e);
    return getMockAds();
  }
}

/**
 * Search ads by specific page/advertiser name
 */
export async function searchAdsByPage(pageName: string): Promise<FacebookAd[]> {
  if (!FB_ADS_TOKEN) return getMockAds().filter(a => a.pageName.toLowerCase().includes(pageName.toLowerCase()));

  try {
    const params = new URLSearchParams({
      access_token: FB_ADS_TOKEN,
      search_page_ids: '',
      search_terms: pageName,
      ad_reached_countries: "['US']",
      fields: 'page_name,page_id,ad_snapshot_url,ad_delivery_start_time,ad_delivery_stop_time,ad_creative_bodies,ad_creative_link_titles,publisher_platforms,languages',
      limit: '10',
    });

    const resp = await fetch(`${FB_ADS_BASE}?${params}`);
    if (!resp.ok) throw new Error(`FB Ads API error: ${resp.status}`);
    const json = await resp.json();
    return (json.data || []).map(parseAd);
  } catch (e) {
    console.warn(`[Facebook Ads] Page search failed for ${pageName}, using mock:`, e);
    return getMockAds().filter(a => a.pageName.toLowerCase().includes(pageName.toLowerCase()));
  }
}

/**
 * Full ads analysis: search all competitors
 */
export async function runAdsAnalysis(): Promise<AdsAnalysis> {
  const allAds: FacebookAd[] = [];

  // Search by general AI photo terms
  const generalAds = await searchFacebookAds('ai photo editor');
  allAds.push(...generalAds);

  // Search top 3 competitors specifically
  const competitorResults = await Promise.all(
    COMPETITOR_PAGES.slice(0, 3).map(name => searchAdsByPage(name))
  );
  for (const result of competitorResults) {
    allAds.push(...result);
  }

  // Deduplicate by ad ID
  const seen = new Set<string>();
  const uniqueAds = allAds.filter(ad => {
    if (seen.has(ad.id)) return false;
    seen.add(ad.id);
    return true;
  });

  // Compute top advertisers
  const advertiserCounts = new Map<string, number>();
  for (const ad of uniqueAds) {
    advertiserCounts.set(ad.pageName, (advertiserCounts.get(ad.pageName) || 0) + 1);
  }
  const topAdvertisers = Array.from(advertiserCounts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    ads: uniqueAds,
    fetchedAt: Date.now(),
    source: FB_ADS_TOKEN ? 'api' : 'mock',
    totalActive: uniqueAds.filter(a => a.isActive).length,
    topAdvertisers,
  };
}

// ---- Parser ----

function parseAd(raw: any): FacebookAd {
  return {
    id: raw.id || `ad-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    pageName: raw.page_name || 'Unknown',
    pageId: raw.page_id || '',
    adSnapshotUrl: raw.ad_snapshot_url || '',
    adDeliveryStartTime: raw.ad_delivery_start_time || '',
    adDeliveryStopTime: raw.ad_delivery_stop_time || null,
    adCreativeBodies: raw.ad_creative_bodies || [],
    adCreativeLinkTitles: raw.ad_creative_link_titles || [],
    publisherPlatforms: raw.publisher_platforms || ['facebook'],
    languages: raw.languages || ['en'],
    isActive: !raw.ad_delivery_stop_time,
  };
}

// ---- Mock Data ----

function getMockAds(): FacebookAd[] {
  const now = Date.now();
  return [
    {
      id: 'mock-ad-001',
      pageName: 'Lensa AI',
      pageId: '100123456789',
      adSnapshotUrl: 'https://www.facebook.com/ads/archive/render_ad/?id=001',
      adDeliveryStartTime: '2026-02-20',
      adDeliveryStopTime: null,
      adCreativeBodies: ['Upload your photos and let AI transform you into stunning artwork. Try Magic Avatars today!'],
      adCreativeLinkTitles: ['Turn selfies into art - Lensa AI'],
      publisherPlatforms: ['facebook', 'instagram'],
      languages: ['en'],
      isActive: true,
    },
    {
      id: 'mock-ad-002',
      pageName: 'FaceApp',
      pageId: '100987654321',
      adSnapshotUrl: 'https://www.facebook.com/ads/archive/render_ad/?id=002',
      adDeliveryStartTime: '2026-02-18',
      adDeliveryStopTime: null,
      adCreativeBodies: ['See how you really look with FaceApp. Hollywood-level face editing powered by AI.'],
      adCreativeLinkTitles: ['Your best look yet - FaceApp'],
      publisherPlatforms: ['facebook', 'instagram'],
      languages: ['en'],
      isActive: true,
    },
    {
      id: 'mock-ad-003',
      pageName: 'Remini',
      pageId: '100111222333',
      adSnapshotUrl: 'https://www.facebook.com/ads/archive/render_ad/?id=003',
      adDeliveryStartTime: '2026-02-15',
      adDeliveryStopTime: null,
      adCreativeBodies: ['Enhance your photos with AI. Restore old photos, create stunning portraits, and more.'],
      adCreativeLinkTitles: ['AI Photo Enhancer - Remini'],
      publisherPlatforms: ['facebook', 'instagram', 'audience_network'],
      languages: ['en'],
      isActive: true,
    },
    {
      id: 'mock-ad-004',
      pageName: 'PhotoRoom',
      pageId: '100444555666',
      adSnapshotUrl: 'https://www.facebook.com/ads/archive/render_ad/?id=004',
      adDeliveryStartTime: '2026-02-10',
      adDeliveryStopTime: '2026-02-25',
      adCreativeBodies: ['Remove backgrounds instantly. Create professional product photos with AI.'],
      adCreativeLinkTitles: ['Background Remover - PhotoRoom'],
      publisherPlatforms: ['facebook'],
      languages: ['en'],
      isActive: false,
    },
    {
      id: 'mock-ad-005',
      pageName: 'Picsart',
      pageId: '100777888999',
      adSnapshotUrl: 'https://www.facebook.com/ads/archive/render_ad/?id=005',
      adDeliveryStartTime: '2026-02-22',
      adDeliveryStopTime: null,
      adCreativeBodies: ['Create, edit, and share stunning visuals. AI-powered photo & video editor.'],
      adCreativeLinkTitles: ['All-in-One Creative Platform - Picsart'],
      publisherPlatforms: ['facebook', 'instagram'],
      languages: ['en', 'es'],
      isActive: true,
    },
    {
      id: 'mock-ad-006',
      pageName: 'Fotor',
      pageId: '100333222111',
      adSnapshotUrl: 'https://www.facebook.com/ads/archive/render_ad/?id=006',
      adDeliveryStartTime: '2026-01-28',
      adDeliveryStopTime: null,
      adCreativeBodies: ['Professional headshots in seconds. AI-powered portrait studio for LinkedIn & business.'],
      adCreativeLinkTitles: ['AI Headshot Generator - Fotor'],
      publisherPlatforms: ['facebook', 'instagram'],
      languages: ['en'],
      isActive: true,
    },
    {
      id: 'mock-ad-007',
      pageName: 'Cutout.pro',
      pageId: '100666555444',
      adSnapshotUrl: 'https://www.facebook.com/ads/archive/render_ad/?id=007',
      adDeliveryStartTime: '2026-02-05',
      adDeliveryStopTime: null,
      adCreativeBodies: ['Remove, replace, and edit backgrounds with precision AI. Perfect for e-commerce.'],
      adCreativeLinkTitles: ['Smart Background Editor - Cutout.pro'],
      publisherPlatforms: ['facebook'],
      languages: ['en', 'zh'],
      isActive: true,
    },
    {
      id: 'mock-ad-008',
      pageName: 'Pixlr',
      pageId: '100888777666',
      adSnapshotUrl: 'https://www.facebook.com/ads/archive/render_ad/?id=008',
      adDeliveryStartTime: '2026-02-12',
      adDeliveryStopTime: '2026-02-28',
      adCreativeBodies: ['Free online photo editor with AI tools. No download required.'],
      adCreativeLinkTitles: ['Free AI Photo Editor - Pixlr'],
      publisherPlatforms: ['facebook', 'instagram'],
      languages: ['en'],
      isActive: false,
    },
    {
      id: 'mock-ad-009',
      pageName: 'Lensa AI',
      pageId: '100123456789',
      adSnapshotUrl: 'https://www.facebook.com/ads/archive/render_ad/?id=009',
      adDeliveryStartTime: '2026-02-25',
      adDeliveryStopTime: null,
      adCreativeBodies: ['New: AI Pet Portraits! Transform your furry friends into works of art.'],
      adCreativeLinkTitles: ['Pet Portraits by AI - Lensa'],
      publisherPlatforms: ['facebook', 'instagram'],
      languages: ['en'],
      isActive: true,
    },
    {
      id: 'mock-ad-010',
      pageName: 'Remove.bg',
      pageId: '100222333444',
      adSnapshotUrl: 'https://www.facebook.com/ads/archive/render_ad/?id=010',
      adDeliveryStartTime: '2026-02-01',
      adDeliveryStopTime: null,
      adCreativeBodies: ['100% automatic background removal in 5 seconds. Used by 32M+ users worldwide.'],
      adCreativeLinkTitles: ['Remove Background - remove.bg'],
      publisherPlatforms: ['facebook'],
      languages: ['en', 'de'],
      isActive: true,
    },
  ];
}
