# TrendPulse AI - Omni-Channel Social Intelligence & Selection Agent

Real-time social trend intelligence platform with an integrated omni-channel product selection agent. Built with React 19, Vite 6, TypeScript 5.8, and a cyberpunk dark theme.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    TrendPulse AI                     │
├─────────────────┬───────────────────────────────────┤
│  Trends Page    │  Selection Agent Page              │
│  ┌───────────┐  │  ┌─────────────────────────────┐  │
│  │ Gemini AI │  │  │ Overview  │ SEO │ Ads │ Dedup│  │
│  │ Search    │  │  ├─────────────────────────────┤  │
│  │ TikHub    │  │  │ Semrush API (3 endpoints)   │  │
│  │ Crawling  │  │  │ Facebook Ads Library API     │  │
│  │ VKS       │  │  │ Sitemap + Base44 + Notion   │  │
│  └───────────┘  │  │ Data Aggregator & Scoring   │  │
│                 │  └─────────────────────────────┘  │
└─────────────────┴───────────────────────────────────┘
```

## Features

### Trends Page (Existing)
- **Gemini-powered search** with real-time Google Search grounding
- **Multi-platform tracking**: X, TikTok, Reddit, LinkedIn, YouTube, Instagram, Facebook
- **Deep analysis**: Trend scoring, risk assessment, creator production SOPs
- **AI image generation**: Visual prototypes via Gemini 3 Pro
- **i18n**: English & Chinese (zh-CN)

### Selection Agent (New)
- **SEO Intelligence** (Semrush API)
  - `domain_organic`: Competitor keyword lists with rankings, traffic, KD
  - `domain_organic_organic`: Related competitor domain discovery
  - `phrase_this`: Regional search volume queries
  - Filtering: Excludes low-value regions (India), high KD (>70), low volume (<100)
  - Interactive charts: Traffic bar chart, Volume vs Difficulty scatter plot

- **Ads Intelligence** (Facebook Ads Library API)
  - Competitor ad monitoring across Facebook, Instagram, Audience Network
  - Ad creative analysis: bodies, titles, platforms, languages
  - Active/inactive status tracking
  - Top advertiser rankings with platform distribution charts

- **Dedup Engine**
  - Sitemap crawling (`art.myshell.ai/sitemap.xml`)
  - Base44 CMS bot matching (`app.base44.com/api`)
  - Notion Database cross-reference
  - Status classification: new, exists_sitemap, exists_cms, exists_notion, duplicate

- **Data Aggregator**
  - Weighted scoring: SEO (40%) + Social (20%) + Ads (25%) + Dedup penalty (15%)
  - Recommendation engine: high_priority / worth_exploring / low_priority / skip
  - Ranked opportunities table with reasoning

## Competitors Monitored

| Domain | Category |
|--------|----------|
| photoroom.com | Background removal, product photos |
| lensaai.com | AI portraits, magic avatars |
| faceapp.com | Face editing, age transformation |
| remini.ai | Photo enhancement, restoration |
| fotor.com | Photo editing, AI headshots |
| picsart.com | Creative platform, filters |
| remove.bg | Background removal |
| cutout.pro | Smart background editing |
| pixlr.com | Online photo editor |

## Tech Stack

| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 19.2 | UI framework |
| Vite | 6.2 | Build tool & dev server |
| TypeScript | 5.8 | Type safety |
| Recharts | 3.5 | Data visualization |
| Framer Motion | 11.13 | Animations |
| Lucide React | 0.555 | Icons |
| @google/genai | 1.30 | Gemini API client |
| Tailwind CSS | CDN | Styling (cyberpunk dark theme) |

## Setup

### 1. Clone & Install

```bash
git clone <repo-url>
cd trendpulse-ai
npm install
```

### 2. Environment Variables

```bash
cp .env.example .env
```

Edit `.env` and add your API keys:

```env
# Required - Gemini API for trend search & analysis
VITE_GEMINI_API_KEY=your_gemini_key

# Optional - Semrush API for SEO intelligence (mock data fallback)
VITE_SEMRUSH_API_KEY=your_semrush_key

# Optional - Facebook Ads Library API (mock data fallback)
VITE_FB_ADS_TOKEN=your_fb_ads_token
```

### 3. Run Development Server

```bash
npm run dev
```

Open `http://localhost:3000`

### 4. Build for Production

```bash
npm run build
```

## API Integration Details

### Gemini API (Required)
- Get an API key at [Google AI Studio](https://aistudio.google.com/apikey)
- Used for: trend search, deep analysis, image generation
- Models: `gemini-3-flash-preview`, `gemini-3-pro-preview`, `gemini-3-pro-image-preview`

### Semrush API (Optional)
- Get an API key at [Semrush API](https://www.semrush.com/api/)
- Endpoints used:
  - `domain_organic` - Competitor keyword data
  - `domain_organic_organic` - Related competitor discovery
  - `phrase_this` - Regional search volume
- Falls back to realistic mock data when key is missing

### Facebook Ads Library API (Optional)
- Requires Facebook Business Manager setup:
  1. Create a System User in Business Manager
  2. Assign App + `ads_read` permission
  3. Generate a long-lived Access Token
- [Setup Guide](https://www.facebook.com/ads/library/api/?source=onboarding)
- Falls back to realistic mock data when token is missing

### Dedup Sources
- **Sitemap**: Fetches `https://art.myshell.ai/sitemap.xml` and extracts URL slugs
- **Base44 CMS**: Queries `https://app.base44.com/api/bots` for existing bots
- **Notion DB**: Requires server-side proxy (uses mock data in frontend)

## Project Structure

```
├── App.tsx                          # Main app with page navigation
├── types.ts                         # All TypeScript interfaces
├── i18n.ts                          # English & Chinese translations
├── constants.ts                     # Keyword dictionary & config
├── index.tsx                        # React entry point
├── index.html                       # HTML with Tailwind config
├── env.d.ts                         # Vite env type declarations
├── .env.example                     # Environment variables template
├── vite.config.ts                   # Vite configuration
├── tsconfig.json                    # TypeScript configuration
├── services/
│   ├── geminiService.ts             # Gemini AI search & analysis
│   ├── tikHubService.ts             # TikHub social media crawler
│   ├── semrushService.ts            # Semrush SEO API (3 endpoints)
│   ├── facebookAdsService.ts        # Facebook Ads Library API
│   ├── dedupService.ts              # Dedup engine (Sitemap/Base44/Notion)
│   └── dataAggregator.ts            # Channel aggregation & scoring
├── components/
│   ├── AnalysisPanel.tsx            # Trend deep analysis view
│   ├── TrendListItem.tsx            # Trend list item component
│   ├── TrendGalleryCard.tsx         # Trend gallery card component
│   ├── selection/
│   │   ├── SelectionAgent.tsx       # Main selection dashboard with tabs
│   │   ├── SEOPanel.tsx             # SEO keywords & charts
│   │   ├── AdsPanel.tsx             # Facebook ads intelligence
│   │   └── DedupPanel.tsx           # Dedup analysis & status
│   ├── layout/
│   │   ├── AnimatedBackground.tsx   # Animated bg effects
│   │   ├── Header.tsx               # Header component
│   │   ├── IntroLoader.tsx          # Loading screen
│   │   └── ...
│   └── effects/
│       ├── Abstract3DAnchor.tsx     # 3D decorative elements
│       └── ...
└── hooks/
    └── useTrendData.ts              # Trend data hook
```

## Design System

- **Theme**: Cyberpunk dark (`#020205` background)
- **Glass panels**: `.glass-high` class with backdrop blur
- **Colors**: Pulse (`#00F0FF`), Spark (`#FF7E5F`), Surge (`#BD00FF`)
- **Typography**: SF Pro Display / Inter, all-caps tracking-widest for labels
- **Animations**: Framer Motion for page transitions, loading states
- **Charts**: Recharts with dark theme styling
