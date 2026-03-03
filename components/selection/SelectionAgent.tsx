
import React, { useState, useEffect, useCallback } from 'react';
import { SelectionAgentData } from '../../types';
import { runFullAnalysis } from '../../services/dataAggregator';
import SEOPanel from './SEOPanel';
import AdsPanel from './AdsPanel';
import DedupPanel from './DedupPanel';
import { Search, Megaphone, Database, BarChart3, RefreshCw, Clock, Zap, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface Props {
  t: Record<string, string>;
  lang: 'en' | 'zh';
}

type AgentTab = 'overview' | 'seo' | 'ads' | 'dedup';

const COLORS = ['#22c55e', '#3b82f6', '#eab308', '#ef4444'];
const REC_COLORS: Record<string, string> = {
  high_priority: '#22c55e',
  worth_exploring: '#3b82f6',
  low_priority: '#eab308',
  skip: '#ef4444',
};

const SelectionAgent: React.FC<Props> = ({ t, lang }) => {
  const [activeTab, setActiveTab] = useState<AgentTab>('overview');
  const [data, setData] = useState<SelectionAgentData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await runFullAnalysis();
      setData(result);
    } catch (e) {
      console.error('[SelectionAgent] Analysis failed:', e);
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const tabs = [
    { id: 'overview' as const, label: t.selOverview, icon: BarChart3 },
    { id: 'seo' as const, label: t.selSEO, icon: Search },
    { id: 'ads' as const, label: t.selAds, icon: Megaphone },
    { id: 'dedup' as const, label: t.selDedup, icon: Database },
  ];

  const recCounts = data ? {
    high_priority: data.opportunities.filter(o => o.recommendation === 'high_priority').length,
    worth_exploring: data.opportunities.filter(o => o.recommendation === 'worth_exploring').length,
    low_priority: data.opportunities.filter(o => o.recommendation === 'low_priority').length,
    skip: data.opportunities.filter(o => o.recommendation === 'skip').length,
  } : null;

  const topOpps = data?.opportunities.slice(0, 10) || [];

  const overviewChartData = topOpps.map(o => ({
    name: o.keyword.length > 15 ? o.keyword.slice(0, 13) + '…' : o.keyword,
    score: o.totalScore,
    seo: o.seoScore,
    ads: o.adsScore,
    recommendation: o.recommendation,
  }));

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Tab Navigation */}
      <div className="shrink-0 px-8 pt-6 pb-4 border-b border-white/10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tighter uppercase">{t.selTitle}</h1>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mt-1">{t.selSubtitle}</p>
          </div>
          <div className="flex items-center gap-4">
            {data && (
              <span className="text-[10px] font-mono text-slate-500 flex items-center gap-2">
                <Clock size={12} />
                {new Date(data.lastUpdated).toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={fetchData}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 border border-white/10 text-[10px] font-black text-white hover:bg-white hover:text-black transition-all uppercase tracking-widest disabled:opacity-50"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              {loading ? t.selRefreshing : t.selRefresh}
            </button>
          </div>
        </div>

        <div className="flex gap-2">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                activeTab === tab.id
                  ? 'bg-white text-black border-transparent shadow-xl'
                  : 'text-slate-400 border-white/5 hover:bg-white/10 hover:text-white'
              }`}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8 no-scrollbar">
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-bold">
            {error}
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            {activeTab === 'overview' && (
              <OverviewContent
                data={data}
                loading={loading}
                recCounts={recCounts}
                overviewChartData={overviewChartData}
                topOpps={topOpps}
                t={t}
              />
            )}
            {activeTab === 'seo' && <SEOPanel data={data?.seo || null} loading={loading} t={t} />}
            {activeTab === 'ads' && <AdsPanel data={data?.ads || null} loading={loading} t={t} />}
            {activeTab === 'dedup' && <DedupPanel data={data?.dedup || null} loading={loading} t={t} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

// ---- Overview Sub-component ----

interface OverviewProps {
  data: SelectionAgentData | null;
  loading: boolean;
  recCounts: Record<string, number> | null;
  overviewChartData: any[];
  topOpps: any[];
  t: Record<string, string>;
}

const OverviewContent: React.FC<OverviewProps> = ({ data, loading, recCounts, overviewChartData, topOpps, t }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-6">
          <motion.div className="relative w-24 h-24 mx-auto">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 border-t-4 border-pulse rounded-full" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Zap size={32} className="text-pulse" />
            </div>
          </motion.div>
          <div>
            <p className="text-lg font-black text-white uppercase tracking-widest">{t.selAnalyzing}</p>
            <p className="text-[10px] text-slate-500 mt-2 uppercase tracking-[0.3em]">{t.selAnalyzingDesc}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: t.selHighPriority, value: recCounts?.high_priority || 0, icon: TrendingUp, color: 'text-green-500', bg: 'bg-green-500/10' },
          { label: t.selWorthExploring, value: recCounts?.worth_exploring || 0, icon: Search, color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { label: t.selLowPriority, value: recCounts?.low_priority || 0, icon: AlertTriangle, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
          { label: t.selSkip, value: recCounts?.skip || 0, icon: CheckCircle, color: 'text-red-500', bg: 'bg-red-500/10' },
        ].map((card, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 relative overflow-hidden"
          >
            <div className={`absolute top-3 right-3 p-2 rounded-lg ${card.bg}`}>
              <card.icon size={18} className={card.color} />
            </div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">{card.label}</p>
            <p className={`text-4xl font-black ${card.color}`}>{card.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Top Opportunities Chart */}
      <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
        <h3 className="text-[10px] font-black text-pulse uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
          <BarChart3 size={14} /> {t.selTopOpportunities}
        </h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={overviewChartData} margin={{ bottom: 40 }}>
              <XAxis dataKey="name" tick={{ fill: '#aaa', fontSize: 10 }} angle={-30} textAnchor="end" />
              <YAxis tick={{ fill: '#666', fontSize: 10 }} domain={[0, 100]} />
              <Tooltip
                contentStyle={{ backgroundColor: 'rgba(0,0,0,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '11px' }}
                labelStyle={{ color: '#fff' }}
              />
              <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                {overviewChartData.map((entry, i) => (
                  <Cell key={i} fill={REC_COLORS[entry.recommendation] || '#666'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Opportunities Table */}
      <div className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-white/10">
          <h3 className="text-sm font-black text-white uppercase tracking-widest">{t.selRankedOpps}</h3>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              {[t.selKeyword, t.selCategory, t.selTotalScore, 'SEO', t.selAds, t.selStatus, t.selRecommendation].map(h => (
                <th key={h} className="px-4 py-3 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.opportunities.map((opp, i) => (
              <motion.tr key={opp.id}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                className="border-b border-white/5 hover:bg-white/[0.03] transition-colors"
              >
                <td className="px-4 py-3 text-sm font-bold text-white">{opp.keyword}</td>
                <td className="px-4 py-3">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-white/5 px-2 py-1 rounded">{opp.category}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-lg font-black ${opp.totalScore >= 60 ? 'text-green-400' : opp.totalScore >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {opp.totalScore}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm font-mono text-pulse">{opp.seoScore}</td>
                <td className="px-4 py-3 text-sm font-mono text-spark">{opp.adsScore}</td>
                <td className="px-4 py-3">
                  <span className={`text-[10px] font-black uppercase tracking-widest ${
                    opp.dedupStatus === 'new' ? 'text-green-400' :
                    opp.dedupStatus === 'duplicate' ? 'text-red-400' : 'text-yellow-400'
                  }`}>{opp.dedupStatus}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                    opp.recommendation === 'high_priority' ? 'bg-green-500/10 text-green-400 border-green-500/30' :
                    opp.recommendation === 'worth_exploring' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' :
                    opp.recommendation === 'low_priority' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' :
                    'bg-red-500/10 text-red-400 border-red-500/30'
                  }`}>
                    {opp.recommendation.replace('_', ' ')}
                  </span>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SelectionAgent;
