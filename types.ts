
export interface TrendItem {
  id: string;
  topic: string;
  category: string;
  volume: number;
  velocity: number;
  sentiment: 'positive' | 'negative' | 'neutral';
  platforms: string[];
  summary?: string;
  timestamp: number;
  history: number[];
  
  // Scoring & Meta
  trendScore?: number;
  agentReady?: boolean;
  agentType?: 'portrait' | 'filter' | 'tool' | 'video' | 'other';
  riskLevel?: 'low' | 'medium' | 'high';
  saturation?: 'low' | 'medium' | 'high';

  // Real Evidence (Grounding)
  evidence?: {
      source: string;
      snippet: string;
      url?: string;
      publishedTime?: string;
  }[];

  // Performance Metrics & Context
  views?: string;
  discussionCount?: string;
  searchVolume?: string;
  relatedPosts?: { title: string; url: string; thumbnail?: string }[];
  region?: string;
  type?: string;
  timePeriod?: '1w' | '1m' | '3m';
}

export interface ContentStrategy {
  platform: 'Twitter' | 'LinkedIn' | 'TikTok' | 'Generic';
  hook: string;
  body: string;
  hashtags: string[];
}

export interface CreatorGuideline {
    matchedCategory: string; // e.g., "1.1 Style-driven Portrait"
    coreKeyword: string; // e.g., "cyberpunk portrait"
    productionSteps: string[]; // Step by step how to make it
    recommendedTools: string[]; // e.g., "Midjourney v6", "Flux"
    requiredAssets: string[]; // e.g., "High-contrast portraits", "Neon overlays"
    commercialPotential: 'Low' | 'Medium' | 'High';
}

export interface AnalysisResult {
  trendId: string;
  deepDive: string; 
  marketFit: string; 
  strategies: ContentStrategy[];
  relatedLinks: { title: string; url: string }[];
  visualPrompt?: string; 
  imageUrl?: string;
  
  // New: Dictionary Integration
  guideline?: CreatorGuideline;
  
  // Radar Metrics (0-100)
  scores: {
      monetization: number;
      virality: number;
      feasibility: number;
      competition: number; 
  }
}

export enum DataStreamStatus {
  IDLE = 'IDLE',
  SCANNING = 'SCANNING',
  ANALYZING = 'ANALYZING',
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR',
  INGESTING = 'INGESTING'
}

// Added missing interface for TrendReportItem to fix module export errors
export interface TrendReportItem {
  platform: string;
  keyword: string;
  date: string;
  category: string;
  author?: string;
  sample_content: string;
  metrics: {
    search_index: number;
    posts: number;
  };
  scores: {
    trend_score: number;
    V: number;
    F: number;
  };
  lifecycle: 'flash' | 'rising' | 'sustained' | 'evergreen' | 'declining';
  agent_ready: boolean;
  build_plan: {
    expected_time_to_ship_days: number;
  };
  risks: {
    ip_risk: 'low' | 'medium' | 'high';
    saturation_risk: 'low' | 'medium' | 'high';
  };
}

// ============================================
// Omni-Channel Selection Agent Types
// ============================================

/** SEO keyword data from Semrush API */
export interface SEOKeyword {
  keyword: string;
  position: number;
  searchVolume: number;
  cpc: number;
  competition: number;
  kd: number;
  traffic: number;
  trafficPercent: number;
  url: string;
  domain: string;
  region: string;
}

/** Semrush competitor domain data */
export interface SEOCompetitor {
  domain: string;
  commonKeywords: number;
  organicKeywords: number;
  organicTraffic: number;
  adwordsKeywords: number;
}

/** Regional search volume for a phrase */
export interface SEORegionVolume {
  keyword: string;
  region: string;
  volume: number;
  cpc: number;
  competition: number;
}

/** Aggregated SEO analysis result */
export interface SEOAnalysis {
  keywords: SEOKeyword[];
  competitors: SEOCompetitor[];
  regionVolumes: SEORegionVolume[];
  fetchedAt: number;
  source: 'api' | 'mock';
}

/** Facebook Ad entry from Ads Library API */
export interface FacebookAd {
  id: string;
  pageName: string;
  pageId: string;
  adSnapshotUrl: string;
  adDeliveryStartTime: string;
  adDeliveryStopTime: string | null;
  adCreativeBodies: string[];
  adCreativeLinkTitles: string[];
  publisherPlatforms: string[];
  languages: string[];
  isActive: boolean;
}

/** Aggregated ads analysis */
export interface AdsAnalysis {
  ads: FacebookAd[];
  fetchedAt: number;
  source: 'api' | 'mock';
  totalActive: number;
  topAdvertisers: { name: string; count: number }[];
}

/** Dedup status for a keyword/slug */
export interface DedupEntry {
  keyword: string;
  slug: string;
  inSitemap: boolean;
  inBase44: boolean;
  inNotionDB: boolean;
  existingUrl?: string;
  existingBotId?: string;
  existingBotName?: string;
  status: 'new' | 'exists_sitemap' | 'exists_cms' | 'exists_notion' | 'duplicate';
}

/** Dedup analysis result */
export interface DedupAnalysis {
  entries: DedupEntry[];
  sitemapSlugs: string[];
  base44Bots: string[];
  notionBots: string[];
  fetchedAt: number;
  source: 'api' | 'mock';
}

/** Scored product opportunity from data aggregator */
export interface ProductOpportunity {
  id: string;
  keyword: string;
  category: string;
  source: 'seo' | 'social' | 'ads' | 'combined';
  seoScore: number;
  socialScore: number;
  adsScore: number;
  dedupStatus: DedupEntry['status'];
  totalScore: number;
  searchVolume: number;
  kd: number;
  traffic: number;
  adCount: number;
  region: string;
  recommendation: 'high_priority' | 'worth_exploring' | 'low_priority' | 'skip';
  reasoning: string;
}

/** Full aggregated selection agent data */
export interface SelectionAgentData {
  seo: SEOAnalysis;
  ads: AdsAnalysis;
  dedup: DedupAnalysis;
  opportunities: ProductOpportunity[];
  lastUpdated: number;
}
