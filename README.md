# TrendPulse AI

**Real-time social intelligence and omni-channel product selection platform for AI content creators.**

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite)](https://vitejs.dev)
[![Gemini AI](https://img.shields.io/badge/Gemini_AI-powered-4285F4?logo=google)](https://ai.google.dev)

---

## Overview

TrendPulse AI is a two-module intelligence platform designed for AI-powered content products (photo editing, avatar generation, image tools, etc.). It helps product and content teams answer two questions:

1. **What's trending right now?** — Scan real-time signals across 7 social platforms and surface emerging trends with scoring, risk assessment, creator guidance, and AI-generated visuals.
2. **What should we build next?** — Aggregate SEO keyword data, Facebook ad activity, and deduplication checks into a single gap-score ranking that identifies the highest-opportunity topics.

---

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

---

## Features

### Trends Intelligence
- **Gemini-powered search** with real-time Google Search grounding
- **Multi-platform tracking** — X, TikTok, Reddit, LinkedIn, YouTube, Instagram, Facebook
- **Velocity-Kinetic Score (VKS)** — Real-time momentum metric streamed via Server-Sent Events
- **Deep dive analysis** — Trend scoring, risk assessment, creator production SOPs
- **AI image generation** — Visual prototypes via Gemini image models
- **Bilingual UI** — English and Chinese (zh-CN)

### Selection Agent
- **SEO Intelligence** (Semrush API)
  - Competitor keyword lists with rankings, traffic, and difficulty scores
  - Related competitor domain discovery
  - Regional search volume analysis
  - Filtering: excludes low-value regions, high difficulty (KD > 70), low volume (< 100)
  - Interactive charts: traffic bar chart, volume vs. difficulty scatter plot

- **Ads Intelligence** (Facebook Ads Library API)
  - Competitor ad monitoring across Facebook, Instagram, and Audience Network
  - Ad creative analysis: copy, titles, active/inactive status, platforms, languages
  - Top advertiser rankings with platform distribution charts

- **Deduplication Engine**
  - Sitemap crawling (`art.myshell.ai/sitemap.xml`)
  - Base44 CMS bot matching
  - Notion Database cross-reference
  - Status classification: `new`, `exists_sitemap`, `exists_cms`, `exists_notion`, `duplicate`

- **Data Aggregator & Gap Scoring**
  - Weighted composite score: SEO (40%) + Ads (25%) + Social (20%) + Dedup penalty (15%)
  - Recommendation engine: `high_priority` / `worth_exploring` / `low_priority` / `skip`
  - Ranked opportunities table with per-keyword reasoning

### Research Pipeline (Python)
- Server-side script (`scripts/run_full_research.py`) pulls from Semrush and Facebook Ads, runs deduplication, computes gap scores, and outputs dated JSON reports to `data/`

---

## Competitors Monitored

| Domain | Focus |
|---|---|
| photoroom.com | Background removal, product photos |
| lensaai.com | AI portraits, magic avatars |
| faceapp.com | Face editing, age transformation |
| remini.ai | Photo enhancement, restoration |
| fotor.com | Photo editing, AI headshots |
| picsart.com | Creative platform, filters |
| remove.bg | Background removal |
| cutout.pro | Smart background editing |
| pixlr.com | Online photo editor |

---

## Requirements

- Node.js ≥ 18
- Python ≥ 3.9 (research pipeline only)
- A Gemini API key (see [Configuration](#configuration))

---

## Setup

### 1. Clone and install

```bash
git clone https://github.com/Arxchibobo/powerful-trendplus.git
cd powerful-trendplus
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` with your API keys:

| Variable | Required | Description |
|---|---|---|
| `VITE_GEMINI_API_KEY` | **Yes** | Google Gemini API key — trend search and analysis |
| `VITE_SEMRUSH_API_KEY` | No | Semrush API key — SEO intelligence |
| `VITE_FB_ADS_TOKEN` | No | Facebook Ads Library access token |
| `TIKHUB_API_KEY` | No | TikHub API key — social signal crawling |
| `NOTION_API_KEY` | No | Notion integration token — deduplication |

All optional APIs have comprehensive mock data fallbacks — the app runs fully without them.

### 3. Start the development server

```bash
npm run dev
# http://localhost:3000
```

### 4. Build for production

```bash
npm run build
npm run preview
```

---

## Research Pipeline (Python)

Run the full keyword research pipeline to generate a fresh data snapshot:

```bash
pip install requests
python3 scripts/run_full_research.py
```

Output: `data/research_YYYY-MM-DD.json` with per-keyword gap scores, priorities, Facebook ad counts, and deduplication status.

**Pipeline filters applied:**
- Minimum search volume: 1,000
- Maximum keyword difficulty: 80
- Excludes India, Bangladesh, Pakistan traffic
- Excludes brand terms, text generators, and font tools

---

## API Details

### Gemini (Required)
- Get a key at [Google AI Studio](https://aistudio.google.com/apikey)
- Models used: `gemini-3-flash-preview`, `gemini-3-pro-preview`, `gemini-3-pro-image-preview`

### Semrush (Optional)
- [Semrush API docs](https://www.semrush.com/api/)
- Endpoints: `domain_organic`, `domain_organic_organic`, `phrase_this`

### Facebook Ads Library (Optional)
- Requires a Facebook Business Manager System User with `ads_read` permission
- [Facebook Ads Library API setup](https://www.facebook.com/ads/library/api/?source=onboarding)

---

## Project Structure

```
├── App.tsx                     # Root — page navigation and state
├── types.ts                    # All TypeScript interfaces
├── i18n.ts                     # English / zh-CN translations
├── constants.ts                # Keyword taxonomy and categories
├── services/
│   ├── geminiService.ts        # Gemini AI — trend search, deep dive, image gen
│   ├── semrushService.ts       # Semrush — competitor keyword analysis
│   ├── facebookAdsService.ts   # Facebook Ads Library — ad monitoring
│   ├── dedupService.ts         # Deduplication — sitemap, Base44, Notion
│   ├── dataAggregator.ts       # Gap score computation and ranking
│   └── tikHubService.ts        # TikHub — social signal crawling
├── hooks/
│   └── useTrendData.ts         # VKS streaming via Server-Sent Events
├── components/
│   ├── AnalysisPanel.tsx       # Trend deep-dive view
│   ├── selection/
│   │   ├── SelectionAgent.tsx  # Selection dashboard (Overview/SEO/Ads/Dedup tabs)
│   │   ├── SEOPanel.tsx        # SEO keywords and charts
│   │   ├── AdsPanel.tsx        # Facebook ads intelligence
│   │   └── DedupPanel.tsx      # Deduplication status
│   ├── layout/                 # Header, Sidebar, AnimatedBackground, IntroLoader
│   ├── effects/                # GlitchTicker, VKSSpark, RollingNumber, Abstract3D
│   ├── admin/                  # Admin dashboard, VKS charts, task management
│   └── creator/                # Creator-focused dashboard
├── scripts/
│   └── run_full_research.py    # Server-side research orchestration
└── data/
    └── research_YYYY-MM-DD.json  # Research output snapshots
```

---

## Tech Stack

| Technology | Version | Purpose |
|---|---|---|
| React | 19.2 | UI framework |
| Vite | 6.2 | Build tool and dev server |
| TypeScript | 5.8 | Type safety |
| Recharts | 3.5 | Data visualization |
| Framer Motion | 11.13 | Animations |
| Lucide React | 0.555 | Icons |
| @google/genai | 1.30 | Gemini API client |
| Tailwind CSS | CDN | Styling (cyberpunk dark theme) |
| Python + requests | — | Research pipeline |

---

## Design System

- **Theme**: Cyberpunk dark (`#020205` background)
- **Glass panels**: `.glass-high` class with backdrop blur and saturation
- **Accent colors**: Pulse `#00F0FF` · Spark `#FF7E5F` · Surge `#BD00FF`
- **Typography**: SF Pro Display / Inter, all-caps `tracking-widest` for labels
- **Animations**: Framer Motion page transitions, breathing cards, glitch effects
- **Charts**: Recharts with dark theme styling
