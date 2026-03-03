
import React, { useState, useMemo } from 'react';
import { AdsAnalysis } from '../../types';
import { Megaphone, ExternalLink, Calendar, Globe, Filter } from 'lucide-react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface Props {
  data: AdsAnalysis | null;
  loading: boolean;
  t: Record<string, string>;
}

const COLORS = ['#00F0FF', '#FF7E5F', '#BD00FF', '#22c55e', '#eab308', '#3b82f6', '#ef4444', '#f97316'];

const AdsPanel: React.FC<Props> = ({ data, loading, t }) => {
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');
  const [filterAdvertiser, setFilterAdvertiser] = useState('all');

  const advertisers = useMemo(() => {
    if (!data) return [];
    return Array.from(new Set(data.ads.map(a => a.pageName)));
  }, [data]);

  const filteredAds = useMemo(() => {
    if (!data) return [];
    let ads = [...data.ads];
    if (filterActive === 'active') ads = ads.filter(a => a.isActive);
    if (filterActive === 'inactive') ads = ads.filter(a => !a.isActive);
    if (filterAdvertiser !== 'all') ads = ads.filter(a => a.pageName === filterAdvertiser);
    return ads;
  }, [data, filterActive, filterAdvertiser]);

  const platformDistribution = useMemo(() => {
    if (!data) return [];
    const counts = new Map<string, number>();
    for (const ad of data.ads) {
      for (const p of ad.publisherPlatforms) {
        counts.set(p, (counts.get(p) || 0) + 1);
      }
    }
    return Array.from(counts.entries()).map(([name, value]) => ({ name: name.toUpperCase(), value }));
  }, [data]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="w-12 h-12 border-t-2 border-spark rounded-full mx-auto" />
          <p className="text-[10px] font-black text-spark uppercase tracking-[0.3em]">{t.selLoadingAds}</p>
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
          { label: t.selTotalAds, value: data.ads.length, color: 'text-pulse' },
          { label: t.selActiveAds, value: data.totalActive, color: 'text-green-500' },
          { label: t.selAdvertisers, value: data.topAdvertisers.length, color: 'text-spark' },
          { label: t.selDataSource, value: data.source.toUpperCase(), color: 'text-yellow-500' },
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
        {/* Top Advertisers */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
          <h3 className="text-[10px] font-black text-pulse uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
            <Megaphone size={14} /> {t.selTopAdvertisers}
          </h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.topAdvertisers.slice(0, 8)} layout="vertical" margin={{ left: 80 }}>
                <XAxis type="number" tick={{ fill: '#666', fontSize: 10 }} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#aaa', fontSize: 10 }} width={80} />
                <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '11px' }} />
                <Bar dataKey="count" fill="#FF7E5F" radius={[0, 4, 4, 0]}>
                  {data.topAdvertisers.slice(0, 8).map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Platform Distribution */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
          <h3 className="text-[10px] font-black text-spark uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
            <Globe size={14} /> {t.selPlatformDist}
          </h3>
          <div className="h-[250px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={platformDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {platformDistribution.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex bg-black/40 rounded-xl p-1 border border-white/10">
          {(['all', 'active', 'inactive'] as const).map(f => (
            <button key={f} onClick={() => setFilterActive(f)}
              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${filterActive === f ? 'bg-white text-black' : 'text-slate-500 hover:text-white'}`}>
              {f === 'all' ? t.selAll : f === 'active' ? t.selActive : t.selInactive}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-slate-500" />
          <select
            value={filterAdvertiser}
            onChange={e => setFilterAdvertiser(e.target.value)}
            className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs font-bold text-white appearance-none cursor-pointer"
          >
            <option value="all">{t.selAllAdvertisers}</option>
            {advertisers.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
      </div>

      {/* Ads Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredAds.map((ad, i) => (
          <motion.div key={ad.id}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 hover:bg-white/[0.05] transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className="text-sm font-black text-white">{ad.pageName}</h4>
                <p className="text-[10px] text-slate-500 font-mono mt-1">ID: {ad.pageId}</p>
              </div>
              <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${ad.isActive ? 'bg-green-500/10 text-green-400 border border-green-500/30' : 'bg-red-500/10 text-red-400 border border-red-500/30'}`}>
                {ad.isActive ? t.selActive : t.selInactive}
              </span>
            </div>

            {ad.adCreativeLinkTitles.length > 0 && (
              <p className="text-xs font-bold text-pulse mb-2">{ad.adCreativeLinkTitles[0]}</p>
            )}

            {ad.adCreativeBodies.length > 0 && (
              <p className="text-xs text-slate-400 leading-relaxed mb-4 line-clamp-2">{ad.adCreativeBodies[0]}</p>
            )}

            <div className="flex items-center gap-4 flex-wrap text-[10px] text-slate-500">
              <span className="flex items-center gap-1">
                <Calendar size={10} />
                {ad.adDeliveryStartTime}
              </span>
              <span className="flex items-center gap-1">
                {ad.publisherPlatforms.map(p => p.toUpperCase()).join(', ')}
              </span>
              <span>{ad.languages.join(', ')}</span>
              {ad.adSnapshotUrl && (
                <a href={ad.adSnapshotUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-pulse hover:underline">
                  {t.selViewAd} <ExternalLink size={10} />
                </a>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default AdsPanel;
