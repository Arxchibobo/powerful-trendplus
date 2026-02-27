
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
