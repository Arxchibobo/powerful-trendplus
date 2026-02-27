
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TrendItem } from './types';
import { searchGlobalTrends, getSearchSuggestions } from './services/geminiService';
import TrendListItem from './components/TrendListItem';
import TrendGalleryCard from './components/TrendGalleryCard';
import AnalysisPanel from './components/AnalysisPanel';
import { AnimatedBackground } from './components/layout/AnimatedBackground';
import { IntroLoader } from './components/layout/IntroLoader';
import { TRANSLATIONS } from './i18n';
import {
    Flame, BrainCircuit, AlertTriangle, Search, Zap,
    Twitter, Linkedin, Video, MessageCircle, Youtube, LayoutGrid,
    Instagram, Facebook, Moon, Sun, Languages, ArrowUpLeft, RefreshCw,
    List, Grid, CornerDownLeft, Activity, ArrowDown, X, Shield, Terminal, Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- CONFIG ---
type PageView = 'search' | 'dashboard';
type Lang = 'en' | 'zh';
type ViewMode = 'list' | 'gallery';
type FeedFilter = 'trending' | 'opportunity' | 'risk';

const INITIAL_QUERY = "Trending Visual Styles AI Filters";

const getPlatforms = (t: any) => [
    { id: 'ALL', label: t.tabAll, icon: LayoutGrid, color: 'text-white' },
    { id: 'X', label: t.twitter, icon: Twitter, color: 'text-white' }, 
    { id: 'TIKTOK', label: t.tiktok, icon: Video, color: 'text-white' },
    { id: 'REDDIT', label: t.reddit, icon: MessageCircle, color: 'text-white' },
    { id: 'LINKEDIN', label: t.linkedin, icon: Linkedin, color: 'text-white' },
    { id: 'YOUTUBE', label: t.youtube, icon: Youtube, color: 'text-white' },
    { id: 'INSTAGRAM', label: t.instagram, icon: Instagram, color: 'text-white' },
    { id: 'FACEBOOK', label: t.facebook, icon: Facebook, color: 'text-white' },
];

const App: React.FC = () => {
  const [loadingApp, setLoadingApp] = useState(true);
  const [isDataReady, setIsDataReady] = useState(false);
  const [trends, setTrends] = useState<TrendItem[]>([]);
  const [initialTrends, setInitialTrends] = useState<TrendItem[]>([]);
  const [selectedTrend, setSelectedTrend] = useState<TrendItem | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [activeSearchTag, setActiveSearchTag] = useState<string | null>(null);
  const [activePlatform, setActivePlatform] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [activeFeedFilter, setActiveFeedFilter] = useState<FeedFilter>('trending');
  const [lang, setLang] = useState<Lang>('en'); // Changed default to 'en'
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [timePeriod, setTimePeriod] = useState<'1w' | '1m' | '3m'>('1m');
  const [region, setRegion] = useState('Global');

  const t = TRANSLATIONS[lang];
  const PLATFORMS = getPlatforms(t);

  const REGIONS = [
    { id: 'Global', label: t.regionGlobal },
    { id: 'USA', label: t.regionUSA },
    { id: 'Europe', label: t.regionEurope },
    { id: 'Asia', label: t.regionAsia },
  ];

  const PERIODS = [
    { id: '1w', label: t.time1w },
    { id: '1m', label: t.time1m },
    { id: '3m', label: t.time3m },
  ];

  useEffect(() => {
    const initData = async () => {
        try {
            // Re-fetch when language changes to get localized content
            const results = await searchGlobalTrends(INITIAL_QUERY, lang, timePeriod, region);
            setInitialTrends(results);
            setTrends(results);
            if (results.length > 0) setSelectedTrend(results[0]);
            setIsDataReady(true);
        } catch (e) {
            setIsDataReady(true);
        }
    };
    initData();
  }, [lang, timePeriod, region]);

  useEffect(() => {
      const fetchSuggestions = async () => {
          if (searchQuery.length >= 2) {
              const results = await getSearchSuggestions(searchQuery);
              setSuggestions(results);
              setShowSuggestions(true);
          } else {
              setSuggestions([]);
              setShowSuggestions(false);
          }
      };
      const timer = setTimeout(fetchSuggestions, 300);
      return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearch = async (query: string) => {
      if (!query.trim()) return;
      setShowSuggestions(false);
      setIsScanning(true);
      setActiveSearchTag(query);
      
      try {
          const results = await searchGlobalTrends(query, lang, timePeriod, region);
          setTrends(results);
          setActiveFeedFilter('trending');
          setActivePlatform('ALL');
          if (results.length > 0) setSelectedTrend(results[0]);
      } catch (e) { 
          console.error(e); 
      } finally { 
          setIsScanning(false);
      }
  };

  const handleLoadMore = async () => {
      if (isScanning) return;
      setIsScanning(true);
      try {
          const query = activeSearchTag || INITIAL_QUERY;
          const newResults = await searchGlobalTrends(query, lang, timePeriod, region);
          
          setTrends(prev => {
              // Append new results directly without filtering by topic name to ensure "Load More" always adds content
              return [...prev, ...newResults];
          });
      } catch (e) {
          console.error("Sync error", e);
      } finally {
          setIsScanning(false);
      }
  };

  const resetSearch = () => {
      setActiveSearchTag(null);
      setSearchQuery("");
      setTrends(initialTrends);
      setActiveFeedFilter('trending');
      setActivePlatform('ALL');
      if (initialTrends.length > 0) setSelectedTrend(initialTrends[0]);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      handleSearch(searchQuery);
  };

  const filteredTrends = trends.filter(tr => {
      if (activePlatform === 'ALL') return true;
      return tr.platforms.some(p => p.toUpperCase().includes(activePlatform));
  });

  const trendingNow = filteredTrends.filter(tr => (tr.trendScore || 0) > 40); 
  const risks = filteredTrends.filter(tr => tr.riskLevel === 'high' || tr.sentiment === 'negative');
  const agents = filteredTrends.filter(tr => (tr.trendScore || 0) > 60 && tr.riskLevel !== 'high');

  const renderTrendSection = (items: TrendItem[], variant: 'trending' | 'agent' | 'risk') => {
      if (items.length === 0) return (
          <div className="py-12 text-center border border-dashed border-white/10 rounded-[2rem] bg-white/5 flex flex-col items-center gap-2">
              <Search className="text-slate-600 opacity-50" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{t.noSignals}</span>
          </div>
      );
      const ItemComponent = viewMode === 'gallery' ? TrendGalleryCard : TrendListItem;
      return (
          <div className={viewMode === 'gallery' ? "grid grid-cols-2 gap-4" : "space-y-4"}>
              {items.map(tr => (
                  <ItemComponent key={tr.id} trend={tr} variant={variant} onClick={setSelectedTrend} isSelected={selectedTrend?.id === tr.id} t={t} />
              ))}
          </div>
      );
  };

  return (
    <div className="flex h-screen bg-transparent font-sans text-text overflow-hidden relative selection:bg-pulse/30">
      <AnimatePresence>
          {loadingApp && <IntroLoader isDataReady={isDataReady} onComplete={() => setLoadingApp(false)} />}
          {isScanning && (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-[60px] flex flex-col items-center justify-center"
              >
                  <div className="w-48 h-48 relative mb-12">
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 border-t-4 border-pulse rounded-full shadow-[0_0_20px_rgba(0,240,255,0.5)]" />
                      <div className="absolute inset-0 flex items-center justify-center">
                          <Terminal size={48} className="text-pulse animate-pulse" />
                      </div>
                  </div>
                  <h2 className="text-3xl font-black text-white tracking-[0.5em] uppercase mb-4">{t.statusScanning}</h2>
                  <div className="w-64 h-1 bg-white/10 rounded-full overflow-hidden border border-white/5">
                      <motion.div initial={{ width: 0 }} animate={{ width: "100%" }} transition={{ duration: 1.5 }} className="h-full bg-pulse shadow-[0_0_15px_#00F0FF]" />
                  </div>
              </motion.div>
          )}
      </AnimatePresence>

      <AnimatedBackground theme={theme} />

      <div className="flex-1 flex flex-col p-6 gap-6 h-full overflow-hidden w-full relative">
          <header className="h-20 shrink-0 glass-high rounded-[2rem] px-8 flex items-center justify-between z-30 gap-6">
              <div className="flex items-center gap-4 shrink-0">
                <div className="p-2.5 bg-white/5 rounded-2xl border border-white/10 shadow-lg backdrop-blur-md">
                    <Zap size={22} className="text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" />
                </div>
                <div className="flex flex-col">
                    <span className="text-xl font-black italic tracking-tighter text-white leading-none">TREND</span>
                    <span className="text-[10px] font-black tracking-[0.4em] text-white/60">PULSE</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar flex-1 px-4 justify-end">
                 {PLATFORMS.map((p) => (
                   <button key={p.id} onClick={() => setActivePlatform(p.id)} className={`flex items-center gap-2 px-5 py-2.5 rounded-full transition-all shrink-0 uppercase tracking-widest text-[10px] font-black ${activePlatform === p.id ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.3)]' : 'text-slate-400 hover:text-white'}`}>
                       {p.id !== 'ALL' && <p.icon size={14} />}
                       <span>{p.label}</span>
                   </button>
                 ))}
                 
                 <div className="h-full w-px bg-white/10 mx-2" />
                 
                 <button onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')} className="p-2.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-all">
                    <Languages size={18}/>
                 </button>
              </div>
          </header>

          <div className="flex items-center justify-between px-8 py-4 glass-high rounded-[1.5rem] z-20 gap-4">
              <div className="flex items-center gap-6">
                  <div className="flex items-center gap-3">
                      <Globe size={14} className="text-slate-500" />
                      <div className="flex bg-black/40 rounded-xl p-1 border border-white/10">
                          {REGIONS.map(r => (
                              <button key={r.id} onClick={() => setRegion(r.id)} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${region === r.id ? 'bg-white text-black' : 'text-slate-500 hover:text-white'}`}>{r.label}</button>
                          ))}
                      </div>
                  </div>
                  <div className="h-6 w-px bg-white/10" />
                  <div className="flex items-center gap-3">
                      <Activity size={14} className="text-slate-500" />
                      <div className="flex bg-black/40 rounded-xl p-1 border border-white/10">
                          {PERIODS.map(p => (
                              <button key={p.id} onClick={() => setTimePeriod(p.id as any)} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${timePeriod === p.id ? 'bg-white text-black' : 'text-slate-500 hover:text-white'}`}>{p.label}</button>
                          ))}
                      </div>
                  </div>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  {t.statusLive}
              </div>
          </div>

          <div className="flex-1 flex gap-6 overflow-hidden">
              <div className="w-[450px] min-w-[450px] glass-high rounded-[2.5rem] flex flex-col overflow-hidden relative z-10 border border-white/5">
                  <div className="p-8 pb-6 border-b border-white/10 flex flex-col gap-6">
                      <div className="flex justify-between items-start">
                          <div>
                              <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-2 block">{t.incomingStream}</span>
                              <div className="flex items-center gap-3">
                                  <h2 className="text-2xl font-black text-white tracking-tighter uppercase">{t.globalFeed}</h2>
                                  <span className="text-[10px] font-mono text-pulse bg-pulse/10 px-2 py-0.5 rounded border border-pulse/20">{filteredTrends.length}</span>
                              </div>
                          </div>
                          <div className="flex bg-black/40 rounded-xl p-1 border border-white/10">
                              <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white text-black shadow-xl' : 'text-slate-500 hover:text-white'}`}><List size={18} /></button>
                              <button onClick={() => setViewMode('gallery')} className={`p-2 rounded-lg transition-all ${viewMode === 'gallery' ? 'bg-white text-black shadow-xl' : 'text-slate-500 hover:text-white'}`}><Grid size={18} /></button>
                          </div>
                      </div>

                      <AnimatePresence>
                        {activeSearchTag && (
                            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                                className="flex items-center gap-3 p-1 pl-4 rounded-xl bg-pulse/10 border border-pulse/30 backdrop-blur-md"
                            >
                                <Shield size={14} className="text-pulse" />
                                <span className="flex-1 text-[11px] font-black uppercase text-pulse tracking-[0.1em] truncate">{t.queryLabel}: {activeSearchTag}</span>
                                <button onClick={resetSearch} className="p-2 hover:bg-pulse/20 rounded-lg text-pulse transition-all"><X size={14} /></button>
                            </motion.div>
                        )}
                      </AnimatePresence>

                      <div className="flex gap-2">
                          {[
                            {id: 'trending', label: t.sectionTrending, icon: Flame, color: 'text-spark'},
                            {id: 'opportunity', label: t.sectionOpportunity, icon: BrainCircuit, color: 'text-pulse'},
                            {id: 'risk', label: t.sectionRisk, icon: AlertTriangle, color: 'text-yellow-500'}
                          ].map(f => (
                            <button key={f.id} onClick={() => setActiveFeedFilter(f.id as FeedFilter)} className={`flex-1 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] flex items-center justify-center gap-2 border transition-all ${activeFeedFilter === f.id ? 'bg-white text-black border-transparent shadow-xl scale-105' : 'bg-white/5 text-slate-500 border-white/5 hover:bg-white/10 hover:text-white'}`}>
                                <f.icon size={14} className={activeFeedFilter === f.id ? f.color : ''} />
                                {f.label}
                            </button>
                          ))}
                      </div>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-8 space-y-6 no-scrollbar mask-gradient-b">
                      <AnimatePresence mode='wait'>
                          <motion.div key={`${activeFeedFilter}-${activeSearchTag}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                              {renderTrendSection(activeFeedFilter === 'trending' ? trendingNow : activeFeedFilter === 'opportunity' ? agents : risks, activeFeedFilter as any)}
                          </motion.div>
                      </AnimatePresence>
                      <button 
                        onClick={handleLoadMore}
                        disabled={isScanning}
                        className="w-full py-8 rounded-3xl border-2 border-dashed border-white/5 text-slate-500 font-black text-[11px] uppercase tracking-[0.4em] hover:bg-white/5 hover:text-white transition-all flex items-center justify-center gap-3 mt-10 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                          {isScanning ? <RefreshCw size={18} className="animate-spin" /> : <ArrowDown size={18} />} 
                          {isScanning ? t.syncing : t.syncMore}
                      </button>
                  </div>
              </div>

              <div className="flex-1 glass-high rounded-[2.5rem] overflow-hidden relative z-10 shadow-2xl border border-white/5">
                  <AnalysisPanel trend={selectedTrend} t={t} lang={lang} />
              </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 z-[150] flex justify-center pointer-events-none group/dock">
             {/* Trigger Zone - Fixed height at bottom */}
             <div className="absolute bottom-0 w-full h-24 bg-transparent pointer-events-auto z-0" />
             
             {/* Container for Bar - Positioned relative to bottom */}
             <div className="w-full max-w-4xl px-6 pb-8 pointer-events-auto z-10 transition-all duration-500 ease-out transform translate-y-[120%] opacity-0 group-hover/dock:translate-y-0 group-hover/dock:opacity-100 group-focus-within/dock:translate-y-0 group-focus-within/dock:opacity-100">
                <div className="relative group/bar">
                    {/* Global Hover Glow - Enhanced */}
                    <div className="absolute inset-0 rounded-[2.5rem] bg-pulse/20 blur-[60px] opacity-0 group-hover/bar:opacity-100 transition-opacity duration-700 -z-10" />
                    
                    <AnimatePresence>
                      {showSuggestions && suggestions.length > 0 && (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
                            className="absolute bottom-full mb-8 left-0 right-0 glass-high border border-white/10 rounded-[3rem] shadow-2xl overflow-hidden p-4 backdrop-blur-3xl"
                        >
                            <div className="grid grid-cols-2 gap-3">
                            {suggestions.map((s, i) => (
                                <button key={i} onClick={() => { setSearchQuery(s); handleSearch(s); }} className="w-full text-left px-8 py-5 hover:bg-white/10 rounded-2xl text-sm text-slate-300 font-black tracking-widest transition-all flex items-center gap-4 group/item uppercase">
                                    <ArrowUpLeft size={18} className="text-pulse group-hover/item:scale-125 transition-transform" />
                                    {s}
                                </button>
                            ))}
                            </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <form onSubmit={handleManualSubmit} className="relative rounded-[2.5rem] flex items-center p-3 pl-10 bg-[#0a0a0f]/95 backdrop-blur-[60px] border border-white/10 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.9)] ring-1 ring-white/10 group-hover/bar:border-pulse/60 group-hover/bar:shadow-[0_0_30px_rgba(0,240,255,0.15)] transition-all duration-500">
                        <Search size={24} className="mr-8 text-slate-600 group-focus-within:text-pulse transition-colors" strokeWidth={3} />
                        <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={t.scanPlaceholder}
                            className="flex-1 bg-transparent border-none outline-none text-white font-black text-lg tracking-tight placeholder:text-slate-700 h-14 selection:bg-pulse/40" />
                        <button type="submit" className="h-14 px-10 rounded-[1.8rem] bg-white text-black flex items-center gap-5 hover:bg-pulse hover:text-black transition-all group/btn active:scale-95 shadow-2xl font-black">
                            <span className="text-[10px] font-black uppercase tracking-widest">{t.enter}</span>
                            <CornerDownLeft size={18} strokeWidth={3} />
                        </button>
                    </form>
                </div>
             </div>
          </div>
      </div>
    </div>
  );
};

export default App;
