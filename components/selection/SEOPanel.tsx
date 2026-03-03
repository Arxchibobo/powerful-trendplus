
import React, { useState, useMemo } from 'react';
import { SEOAnalysis } from '../../types';
import { Search, TrendingUp, Globe, Filter, ArrowUpDown, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ScatterChart, Scatter, CartesianGrid, Cell } from 'recharts';

interface Props {
  data: SEOAnalysis | null;
  loading: boolean;
  t: Record<string, string>;
}

type SortKey = 'searchVolume' | 'kd' | 'traffic' | 'position';

const SEOPanel: React.FC<Props> = ({ data, loading, t }) => {
  const [sortBy, setSortBy] = useState<SortKey>('traffic');
  const [sortAsc, setSortAsc] = useState(false);
  const [filterDomain, setFilterDomain] = useState<string>('all');
  const [searchFilter, setSearchFilter] = useState('');

  const domains = useMemo(() => {
    if (!data) return [];
    const d = new Set(data.keywords.map(k => k.domain));
    return Array.from(d);
  }, [data]);

  const filteredKeywords = useMemo(() => {
    if (!data) return [];
    let kws = [...data.keywords];
    if (filterDomain !== 'all') kws = kws.filter(k => k.domain === filterDomain);
    if (searchFilter) kws = kws.filter(k => k.keyword.toLowerCase().includes(searchFilter.toLowerCase()));
    kws.sort((a, b) => sortAsc ? a[sortBy] - b[sortBy] : b[sortBy] - a[sortBy]);
    return kws;
  }, [data, sortBy, sortAsc, filterDomain, searchFilter]);

  const chartData = useMemo(() =>
    filteredKeywords.slice(0, 10).map(k => ({
      name: k.keyword.length > 20 ? k.keyword.slice(0, 18) + '…' : k.keyword,
      volume: k.searchVolume,
      traffic: k.traffic,
      kd: k.kd,
    })),
  [filteredKeywords]);

  const scatterData = useMemo(() =>
    filteredKeywords.map(k => ({
      x: k.searchVolume,
      y: k.kd,
      z: k.traffic,
      name: k.keyword,
    })),
  [filteredKeywords]);

  const handleSort = (key: SortKey) => {
    if (sortBy === key) setSortAsc(!sortAsc);
    else { setSortBy(key); setSortAsc(false); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="w-12 h-12 border-t-2 border-pulse rounded-full mx-auto" />
          <p className="text-[10px] font-black text-pulse uppercase tracking-[0.3em]">{t.selLoadingSEO}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-8">
      {/* Header Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: t.selTotalKeywords, value: data.keywords.length, color: 'text-pulse' },
          { label: t.selCompetitors, value: data.competitors.length, color: 'text-spark' },
          { label: t.selAvgKD, value: Math.round(data.keywords.reduce((s, k) => s + k.kd, 0) / (data.keywords.length || 1)), color: 'text-yellow-500' },
          { label: t.selDataSource, value: data.source.toUpperCase(), color: 'text-green-500' },
        ].map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 text-center">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">{stat.label}</p>
            <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-2 gap-6">
        {/* Top Keywords by Traffic */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
          <h3 className="text-[10px] font-black text-pulse uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
            <TrendingUp size={14} /> {t.selTopByTraffic}
          </h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ left: 80 }}>
                <XAxis type="number" tick={{ fill: '#666', fontSize: 10 }} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#aaa', fontSize: 10 }} width={80} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'rgba(0,0,0,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '11px' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Bar dataKey="traffic" fill="#00F0FF" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Volume vs Difficulty Scatter */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
          <h3 className="text-[10px] font-black text-spark uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
            <Globe size={14} /> {t.selVolVsDifficulty}
          </h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis type="number" dataKey="x" name="Volume" tick={{ fill: '#666', fontSize: 10 }} label={{ value: 'Volume', position: 'bottom', fill: '#555', fontSize: 10 }} />
                <YAxis type="number" dataKey="y" name="KD" tick={{ fill: '#666', fontSize: 10 }} label={{ value: 'KD', angle: -90, position: 'insideLeft', fill: '#555', fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'rgba(0,0,0,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '11px' }}
                  formatter={(value: number, name: string) => [value.toLocaleString(), name]}
                />
                <Scatter data={scatterData} fill="#FF7E5F">
                  {scatterData.map((entry, i) => (
                    <Cell key={i} fill={entry.y < 35 ? '#22c55e' : entry.y < 55 ? '#eab308' : '#ef4444'} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-4 mt-2 justify-center">
            <span className="flex items-center gap-1 text-[9px] text-slate-500"><span className="w-2 h-2 rounded-full bg-green-500" /> KD &lt; 35</span>
            <span className="flex items-center gap-1 text-[9px] text-slate-500"><span className="w-2 h-2 rounded-full bg-yellow-500" /> KD 35-55</span>
            <span className="flex items-center gap-1 text-[9px] text-slate-500"><span className="w-2 h-2 rounded-full bg-red-500" /> KD &gt; 55</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2 bg-black/40 rounded-xl p-1 border border-white/10">
          <Search size={14} className="text-slate-500 ml-3" />
          <input
            type="text"
            value={searchFilter}
            onChange={e => setSearchFilter(e.target.value)}
            placeholder={t.selFilterKeywords}
            className="bg-transparent border-none outline-none text-white text-xs font-bold px-2 py-2 w-48 placeholder:text-slate-600"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-slate-500" />
          <select
            value={filterDomain}
            onChange={e => setFilterDomain(e.target.value)}
            className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs font-bold text-white appearance-none cursor-pointer"
          >
            <option value="all">{t.selAllDomains}</option>
            {domains.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </div>

      {/* Keywords Table */}
      <div className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              {[
                { key: 'keyword' as const, label: t.selKeyword },
                { key: 'searchVolume' as SortKey, label: t.selVolume },
                { key: 'kd' as SortKey, label: 'KD' },
                { key: 'traffic' as SortKey, label: t.selTraffic },
                { key: 'position' as SortKey, label: t.selPosition },
                { key: 'domain' as const, label: t.selDomain },
              ].map(col => (
                <th key={col.key}
                  onClick={() => col.key !== 'keyword' && col.key !== 'domain' && handleSort(col.key as SortKey)}
                  className={`px-4 py-3 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest ${col.key !== 'keyword' && col.key !== 'domain' ? 'cursor-pointer hover:text-white' : ''}`}
                >
                  <span className="flex items-center gap-1">
                    {col.label}
                    {col.key !== 'keyword' && col.key !== 'domain' && <ArrowUpDown size={10} />}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredKeywords.slice(0, 30).map((kw, i) => (
              <motion.tr key={`${kw.keyword}-${kw.domain}-${i}`}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                className="border-b border-white/5 hover:bg-white/[0.03] transition-colors"
              >
                <td className="px-4 py-3 text-sm font-bold text-white">{kw.keyword}</td>
                <td className="px-4 py-3 text-sm font-mono text-pulse">{kw.searchVolume.toLocaleString()}</td>
                <td className="px-4 py-3">
                  <span className={`text-sm font-black px-2 py-0.5 rounded ${
                    kw.kd < 35 ? 'text-green-400 bg-green-500/10' :
                    kw.kd < 55 ? 'text-yellow-400 bg-yellow-500/10' :
                    'text-red-400 bg-red-500/10'
                  }`}>{kw.kd}</span>
                </td>
                <td className="px-4 py-3 text-sm font-mono text-slate-300">{kw.traffic.toLocaleString()}</td>
                <td className="px-4 py-3 text-sm font-mono text-slate-400">#{kw.position}</td>
                <td className="px-4 py-3">
                  <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                    {kw.domain} <ExternalLink size={10} />
                  </span>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Competitor Discovery */}
      {data.competitors.length > 0 && (
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
          <h3 className="text-[10px] font-black text-spark uppercase tracking-[0.3em] mb-4">{t.selCompetitorDiscovery}</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {data.competitors.slice(0, 8).map((comp, i) => (
              <div key={i} className="bg-black/30 rounded-xl p-4 border border-white/5">
                <p className="text-sm font-black text-white mb-2">{comp.domain}</p>
                <div className="space-y-1 text-[10px] text-slate-400">
                  <p>{t.selCommonKW}: <span className="text-pulse font-mono">{comp.commonKeywords}</span></p>
                  <p>{t.selOrgTraffic}: <span className="text-spark font-mono">{comp.organicTraffic.toLocaleString()}</span></p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SEOPanel;
