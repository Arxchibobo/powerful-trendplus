
import React, { useState, useEffect, useCallback } from 'react';
import { TrendItem, AnalysisResult } from '../types';
import { analyzeDeepDive, generateTrendImage } from '../services/geminiService';
import { Abstract3DAnchor } from './effects/Abstract3DAnchor';
import { 
    Loader2, Sparkles, Target, Zap, Camera, Layers, Copy, Check, Scissors, Package, PenTool, Layout, Palette, TrendingUp, Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Props {
  trend: TrendItem | null;
  t: any;
  lang: 'en' | 'zh';
}

const AnalysisPanel: React.FC<Props> = ({ trend, t, lang }) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [generatingImg, setGeneratingImg] = useState(false);
  const [generatedImg, setGeneratedImg] = useState<string | null>(null);
  const [imgSize, setImgSize] = useState<'1K' | '2K' | '4K'>('1K');
  const [activeTab, setActiveTab] = useState<'intel' | 'strategy'>('intel');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (trend) {
      setLoading(true);
      setResult(null);
      setGeneratedImg(null);
      analyzeDeepDive(trend, lang)
        .then(setResult)
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [trend, lang]);

  const handleGenImage = useCallback(async () => {
    if (!result?.visualPrompt) return;
    setGeneratingImg(true);
    const img = await generateTrendImage(typeof result.visualPrompt === 'string' ? result.visualPrompt : JSON.stringify(result.visualPrompt), imgSize);
    if (img) setGeneratedImg(img);
    setGeneratingImg(false);
  }, [result, imgSize]);

  const copyPrompt = () => {
    if (result?.visualPrompt) {
        navigator.clipboard.writeText(result.visualPrompt);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!trend) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-500 font-mono relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20 pointer-events-none">
             <Abstract3DAnchor type="sphere" className="w-96 h-96" color="#333" />
        </div>
        <Target size={64} className="mb-6 opacity-40 animate-pulse text-slate-400" />
        <h2 className="text-xl tracking-[0.3em] uppercase font-black text-slate-400">{t.targetNotAcquired}</h2>
        <p className="text-sm mt-4 font-bold text-slate-500 uppercase tracking-widest">{t.initScan}</p>
      </div>
    );
  }

  const NeonBar = ({ value, color }: { value: number, color: string }) => (
      <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden shadow-inner border border-white/5">
          <motion.div initial={{ width: 0 }} animate={{ width: `${value}%` }} transition={{ duration: 1.5 }}
            className="h-full rounded-full neon-capsule" style={{ backgroundColor: color }} />
      </div>
  );

  return (
    <div className="h-full flex flex-col overflow-hidden relative bg-black/20">
      <div className="p-8 pb-4 border-b border-white/10 relative shrink-0">
         <div className="absolute right-10 top-2 w-32 h-32 opacity-80 pointer-events-none">
             <Abstract3DAnchor type="donut" className="w-full h-full" color={trend.trendScore && trend.trendScore > 80 ? '#FF7E5F' : '#00F0FF'} />
         </div>
         <div className="relative z-10 pr-32">
            <div className="flex items-center gap-3 mb-4">
                <span className="px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest bg-pulse/20 text-pulse border border-pulse/30 backdrop-blur-md">
                    {String(trend.category)}
                </span>
                <span className="text-[10px] text-slate-500 font-mono font-bold uppercase tracking-widest">SIGNAL_ID: {trend.id.split('-')[1]}</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter leading-[0.95] uppercase mb-8 drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
                {String(trend.topic)}
            </h1>
            <div className="relative w-full max-w-[420px] h-14 p-1.5 rounded-2xl bg-black/40 border border-white/10 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)] backdrop-blur-2xl flex">
                <motion.div className="absolute top-1.5 bottom-1.5 rounded-xl z-0" animate={{ left: activeTab === 'intel' ? '6px' : '50%', right: activeTab === 'intel' ? '50%' : '6px' }}
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}>
                     <div className={`w-full h-full rounded-xl relative border border-white/20 backdrop-blur-xl shadow-xl transition-all duration-500 ${activeTab === 'intel' ? 'bg-pulse/20' : 'bg-spark/20'}`} />
                </motion.div>
                <button onClick={() => setActiveTab('intel')} className="flex-1 relative z-10 flex items-center justify-center"><span className={`text-[11px] font-black uppercase tracking-[0.2em] ${activeTab === 'intel' ? 'text-white' : 'text-slate-500'}`}>{t.tabIntel}</span></button>
                <button onClick={() => setActiveTab('strategy')} className="flex-1 relative z-10 flex items-center justify-center"><span className={`text-[11px] font-black uppercase tracking-[0.2em] ${activeTab === 'strategy' ? 'text-white' : 'text-slate-500'}`}>{t.tabStrategy}</span></button>
            </div>
         </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 no-scrollbar">
        {loading ? (
            <div className="h-full flex flex-col items-center justify-center space-y-6">
                <Abstract3DAnchor type="sphere" className="w-20 h-20 animate-spin-slow" color="#00F0FF" />
                <p className="text-[10px] font-black text-pulse animate-pulse uppercase tracking-[0.3em]">{t.statusScanning}</p>
            </div>
        ) : result ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-10 pb-20">
                {activeTab === 'intel' && (
                    <div className="grid grid-cols-12 gap-8">
                        <div className="col-span-12 lg:col-span-4 space-y-6 order-2 lg:order-1">
                            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] px-1">{t.impactRadar}</h3>
                            <div className="space-y-6 bg-white/[0.03] p-8 rounded-[2rem] border border-white/10 backdrop-blur-md shadow-2xl transition-all">
                                {Object.entries(result.scores).map(([key, value]) => (
                                    <div key={key}>
                                        <div className="flex justify-between text-[10px] text-slate-400 uppercase font-black mb-2 tracking-widest">
                                            <span>{t[key as keyof typeof t] || key}</span>
                                            <span className="text-white">{Number(value)}</span>
                                        </div>
                                        <NeonBar value={Number(value)} color={key === 'monetization' ? '#22c55e' : key === 'virality' ? '#a855f7' : key === 'feasibility' ? '#3b82f6' : '#ef4444'} />
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="col-span-12 lg:col-span-8 order-1 lg:order-2 space-y-8">
                             <div className="bg-white/[0.05] border border-white/10 p-10 rounded-[2.5rem] relative overflow-hidden shadow-2xl">
                                 <div className="absolute -top-24 -right-24 w-80 h-80 bg-pulse/10 rounded-full blur-[100px] pointer-events-none" />
                                 <h3 className="text-xs font-black text-pulse uppercase tracking-[0.3em] mb-6 flex items-center gap-2 relative z-10">
                                     <Zap size={16} fill="currentColor" /> {t.situationReport}
                                 </h3>
                                 <p className="text-xl text-slate-100 leading-[1.6] font-medium relative z-10">
                                     {typeof result.deepDive === 'string' ? result.deepDive : JSON.stringify(result.deepDive)}
                                 </p>
                                 <div className="mt-10 grid grid-cols-3 gap-10 relative z-10 border-t border-white/10 pt-8">
                                     <div>
                                         <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest block mb-2">{t.targetAudience}</span>
                                         <p className="text-sm font-black text-white uppercase tracking-tight">{String(result.marketFit)}</p>
                                     </div>
                                     <div>
                                         <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest block mb-2">{t.searchVol}</span>
                                         <p className="text-sm font-black text-pulse uppercase tracking-tight">{trend.searchVolume || 'N/A'}</p>
                                     </div>
                                     <div>
                                         <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest block mb-2">{t.riskAssess}</span>
                                         <div className="flex items-center gap-2.5">
                                             <div className={`w-3.5 h-3.5 rounded-full ${trend.riskLevel === 'high' ? 'bg-red-500 shadow-[0_0_12px_red]' : 'bg-green-500 shadow-[0_0_12px_green]'}`} />
                                             <span className="text-sm font-black text-white uppercase tracking-tight">{String(trend.riskLevel || 'Unknown')}</span>
                                         </div>
                                     </div>
                                 </div>

                                 {/* Trend Timeline Graph */}
                                 <div className="mt-10 relative z-10 border-t border-white/10 pt-8">
                                     <div className="flex items-center justify-between mb-6">
                                         <h3 className="text-xs font-black text-white uppercase tracking-[0.3em] flex items-center gap-2">
                                             <Activity size={16} className="text-pulse" /> {t.trendTimeline || "Trend Timeline"}
                                         </h3>
                                         <div className="flex gap-2">
                                             <span className="px-2 py-1 rounded bg-white/5 text-[9px] font-black text-slate-400 uppercase tracking-widest border border-white/5">
                                                 {trend.timePeriod === '1w' ? t.time1w : trend.timePeriod === '3m' ? t.time3m : t.time1m}
                                             </span>
                                         </div>
                                     </div>
                                     <div className="h-[200px] w-full bg-black/20 rounded-3xl p-4 border border-white/5">
                                         <ResponsiveContainer width="100%" height="100%">
                                             <AreaChart data={trend.history.map((val, i) => ({ time: i, score: val }))}>
                                                 <defs>
                                                     <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                                                         <stop offset="5%" stopColor="#00F0FF" stopOpacity={0.3}/>
                                                         <stop offset="95%" stopColor="#00F0FF" stopOpacity={0}/>
                                                     </linearGradient>
                                                 </defs>
                                                 <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                                 <XAxis dataKey="time" hide />
                                                 <YAxis domain={[0, 100]} hide />
                                                 <Tooltip 
                                                     contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '10px', color: '#fff' }}
                                                     itemStyle={{ color: '#00F0FF' }}
                                                     labelStyle={{ display: 'none' }}
                                                 />
                                                 <Area type="monotone" dataKey="score" stroke="#00F0FF" strokeWidth={3} fillOpacity={1} fill="url(#trendGradient)" />
                                             </AreaChart>
                                         </ResponsiveContainer>
                                     </div>
                                 </div>

                                 {trend.relatedPosts && trend.relatedPosts.length > 0 && (
                                     <div className="mt-8 relative z-10 border-t border-white/10 pt-8">
                                         <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest block mb-4">{t.relatedPosts}</span>
                                         <div className="flex flex-col gap-3">
                                             {trend.relatedPosts.map((post, idx) => (
                                                 <a key={idx} href={post.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/20 transition-all group">
                                                     <div className="w-8 h-8 rounded-lg bg-pulse/20 flex items-center justify-center text-pulse group-hover:scale-110 transition-transform">
                                                         <Zap size={14} />
                                                     </div>
                                                     <span className="text-sm font-bold text-slate-200 truncate">{post.title}</span>
                                                 </a>
                                             ))}
                                         </div>
                                     </div>
                                 )}
                             </div>
                        </div>
                    </div>
                )}
                {activeTab === 'strategy' && (
                    <div className="grid grid-cols-12 gap-8">
                        <div className="col-span-12 lg:col-span-7 space-y-8">
                             {/* Technical Header */}
                             <div className="flex items-center justify-between px-2">
                                <div className="flex flex-col">
                                    <h3 className="text-2xl font-black text-white tracking-tight uppercase">{t.creatorSOP}</h3>
                                    <p className="text-[10px] font-bold text-slate-500 tracking-[0.2em] uppercase mt-1">{t.classification}: {result.guideline?.matchedCategory || 'General'}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-pulse animate-pulse shadow-[0_0_8px_#00F0FF]" />
                                    <span className="text-[10px] font-black text-pulse uppercase tracking-widest">{t.opsReady}</span>
                                </div>
                             </div>

                             {/* Visual Prompt Module */}
                             <div className="bg-white/[0.05] border border-white/10 rounded-[2.5rem] p-8 relative shadow-2xl overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><Camera size={120} /></div>
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-[10px] font-black text-spark uppercase tracking-[0.3em] flex items-center gap-2">
                                        <PenTool size={16} /> {t.techPrompt}
                                    </h3>
                                    <button onClick={copyPrompt} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 border border-white/10 text-[10px] font-black text-white hover:bg-white hover:text-black transition-all uppercase tracking-widest">
                                        {copied ? <Check size={14} /> : <Copy size={14} />}
                                        {copied ? t.promptCopied : t.copyPrompt}
                                    </button>
                                </div>
                                <div className="bg-black/40 p-6 rounded-2xl border border-white/5 font-mono text-sm text-slate-300 leading-relaxed italic select-all shadow-inner">
                                    {result.visualPrompt}
                                </div>
                                <div className="mt-4 flex items-center gap-4 text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                                    <span>{t.engine}: Midjourney v6.1 / Flux.1</span>
                                    <span>{t.aspect}: 1:1</span>
                                </div>
                             </div>

                             {/* Production Checklist Grid */}
                             <div className="grid grid-cols-2 gap-8">
                                <div className="bg-white/[0.05] border border-white/10 rounded-[2.5rem] p-8 shadow-2xl">
                                    <h3 className="text-[10px] font-black text-pulse uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                                        <Package size={16} /> {t.assetChecklist}
                                    </h3>
                                    <ul className="space-y-4">
                                        {result.guideline?.requiredAssets?.map((asset: any, idx: number) => (
                                            <li key={idx} className="flex gap-4 items-center text-sm font-bold text-slate-300">
                                                <div className="w-2 h-2 rounded bg-pulse/30 border border-pulse/50 flex items-center justify-center">
                                                    <Check size={8} className="text-pulse" />
                                                </div>
                                                {String(asset)}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div className="bg-white/[0.05] border border-white/10 rounded-[2.5rem] p-8 shadow-2xl">
                                    <h3 className="text-[10px] font-black text-yellow-500 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                                        <Scissors size={16} /> {t.recStack}
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {result.guideline?.recommendedTools?.map((tool: any, idx: number) => (
                                            <span key={idx} className="px-3 py-1.5 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-[10px] font-black text-yellow-500 uppercase tracking-widest">
                                                {String(tool)}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                             </div>

                             {/* Step-by-Step SOP */}
                             <div className="bg-white/[0.05] border border-white/10 rounded-[3rem] p-10 relative shadow-2xl">
                                 <div className="relative z-10">
                                     <h3 className="text-3xl font-black text-white mb-8 tracking-tighter uppercase leading-none">
                                         {t.prodWorkflow}
                                     </h3>
                                     <div className="space-y-10">
                                         {result.guideline?.productionSteps?.map((step: any, idx: number) => (
                                             <div key={idx} className="flex gap-6 items-start">
                                                 <div className="flex-shrink-0 w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-xs font-black text-white shadow-xl">
                                                     {idx+1}
                                                 </div>
                                                 <div className="flex flex-col gap-1 pt-1">
                                                     <p className="text-lg font-bold text-slate-100 leading-tight">
                                                         {String(step)}
                                                     </p>
                                                     <div className="w-12 h-0.5 bg-pulse/30 rounded-full mt-2" />
                                                 </div>
                                             </div>
                                         ))}
                                     </div>
                                 </div>
                             </div>
                        </div>

                        {/* Visual Prototype Preview */}
                        <div className="col-span-12 lg:col-span-5">
                             <div className="sticky top-0 space-y-8">
                                <div className="bg-white/[0.03] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl">
                                    <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                                        <div className="flex items-center gap-2 text-[11px] font-black text-white uppercase tracking-[0.15em]">
                                            <Camera size={16} className="text-pulse" />
                                            <span>{t.visualProto}</span>
                                        </div>
                                        <div className="flex gap-1.5">
                                            {['1K', '2K', '4K'].map(s => (
                                                <button key={s} onClick={() => setImgSize(s as any)} className={`px-2 py-0.5 rounded text-[9px] font-black border transition-all ${imgSize === s ? 'bg-white text-black border-white' : 'bg-transparent text-slate-500 border-white/10 hover:border-white/30'}`}>{s}</button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="aspect-square bg-black/60 relative flex flex-col items-center justify-center p-6 group">
                                        {generatedImg ? (
                                            <AnimatePresence>
                                                <motion.img initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} src={generatedImg} alt="Generated Concept" className="w-full h-full object-cover rounded-2xl relative z-10 shadow-2xl" />
                                                <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity z-20 flex items-center justify-center gap-4 backdrop-blur-md">
                                                    <button onClick={handleGenImage} className="h-12 px-8 bg-pulse text-black rounded-xl font-black text-[10px] tracking-widest hover:scale-105 transition-all shadow-[0_0_20px_#00F0FF]">{t.regenerate}</button>
                                                </div>
                                            </AnimatePresence>
                                        ) : (
                                            <div className="text-center space-y-6 max-w-[280px]">
                                                {generatingImg ? <Abstract3DAnchor type="capsule" className="w-24 h-24 mx-auto" color="#00F0FF" /> : <Sparkles size={48} className="text-slate-700 mx-auto animate-pulse" />}
                                                <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">{generatingImg ? `${t.rendering} ${imgSize}` : t.awaitingSynthesis}</p>
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-8 bg-black/40">
                                        <button onClick={handleGenImage} disabled={generatingImg || !result.visualPrompt}
                                            className="w-full py-5 rounded-[1.5rem] bg-white text-black font-black uppercase tracking-[0.2em] text-[11px] hover:shadow-[0_0_40px_rgba(255,255,255,0.4)] hover:-translate-y-1 active:translate-y-0 transition-all disabled:opacity-30 flex items-center justify-center gap-3">
                                            {generatingImg ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
                                            {generatingImg ? t.synthesizing : t.genPrototype}
                                        </button>
                                    </div>
                                </div>

                                {/* Commercial Potential Widget */}
                                <div className="bg-white/[0.05] border border-white/10 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden">
                                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-green-500/10 rounded-full blur-[40px]" />
                                    <div className="flex justify-between items-end relative z-10">
                                        <div>
                                            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{t.commercialValue}</h4>
                                            <span className="text-3xl font-black text-green-500 tracking-tighter uppercase">{result.guideline?.commercialPotential || t.calculating}</span>
                                        </div>
                                        <Layout size={32} className="text-green-500/50" />
                                    </div>
                                </div>
                             </div>
                        </div>
                    </div>
                )}
            </motion.div>
        ) : null}
      </div>
    </div>
  );
};

export default AnalysisPanel;
