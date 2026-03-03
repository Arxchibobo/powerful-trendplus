
import React, { useState, useMemo } from 'react';
import { DedupAnalysis } from '../../types';
import { CheckCircle, XCircle, AlertCircle, Database, FileText, Globe, Filter } from 'lucide-react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface Props {
  data: DedupAnalysis | null;
  loading: boolean;
  t: Record<string, string>;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: typeof CheckCircle }> = {
  new: { label: 'New', color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/30', icon: CheckCircle },
  exists_sitemap: { label: 'In Sitemap', color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/30', icon: AlertCircle },
  exists_cms: { label: 'In CMS', color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/30', icon: AlertCircle },
  exists_notion: { label: 'In Notion', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/30', icon: Database },
  duplicate: { label: 'Duplicate', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/30', icon: XCircle },
};

const COLORS = ['#22c55e', '#eab308', '#f97316', '#3b82f6', '#ef4444'];

const DedupPanel: React.FC<Props> = ({ data, loading, t }) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filteredEntries = useMemo(() => {
    if (!data) return [];
    if (filterStatus === 'all') return data.entries;
    return data.entries.filter(e => e.status === filterStatus);
  }, [data, filterStatus]);

  const statusCounts = useMemo(() => {
    if (!data) return [];
    const counts = new Map<string, number>();
    for (const entry of data.entries) {
      counts.set(entry.status, (counts.get(entry.status) || 0) + 1);
    }
    return Array.from(counts.entries()).map(([name, value]) => ({
      name: STATUS_CONFIG[name]?.label || name,
      value,
      status: name,
    }));
  }, [data]);

  const newCount = data?.entries.filter(e => e.status === 'new').length || 0;
  const existsCount = data?.entries.filter(e => e.status !== 'new').length || 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="w-12 h-12 border-t-2 border-green-500 rounded-full mx-auto" />
          <p className="text-[10px] font-black text-green-500 uppercase tracking-[0.3em]">{t.selLoadingDedup}</p>
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
          { label: t.selTotalChecked, value: data.entries.length, color: 'text-pulse' },
          { label: t.selNewOpps, value: newCount, color: 'text-green-500' },
          { label: t.selExisting, value: existsCount, color: 'text-yellow-500' },
          { label: t.selDataSources, value: '3', color: 'text-spark' },
        ].map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 text-center">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">{stat.label}</p>
            <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Charts & Sources */}
      <div className="grid grid-cols-2 gap-6">
        {/* Status Distribution Pie */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
          <h3 className="text-[10px] font-black text-pulse uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
            <Database size={14} /> {t.selStatusDist}
          </h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusCounts} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {statusCounts.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: 'rgba(0,0,0,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Data Sources Summary */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 space-y-4">
          <h3 className="text-[10px] font-black text-spark uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
            <FileText size={14} /> {t.selDataSourcesSummary}
          </h3>
          {[
            { icon: Globe, label: 'Sitemap', sublabel: 'art.myshell.ai/sitemap.xml', count: data.sitemapSlugs.length, color: 'text-pulse' },
            { icon: Database, label: 'Base44 CMS', sublabel: 'app.base44.com/api', count: data.base44Bots.length, color: 'text-spark' },
            { icon: FileText, label: 'Notion DB', sublabel: 'Bot Database', count: data.notionBots.length, color: 'text-purple-400' },
          ].map((source, i) => (
            <div key={i} className="flex items-center gap-4 p-4 bg-black/30 rounded-xl border border-white/5">
              <div className={`p-2 rounded-lg bg-white/5 ${source.color}`}>
                <source.icon size={18} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-black text-white">{source.label}</p>
                <p className="text-[10px] text-slate-500 font-mono">{source.sublabel}</p>
              </div>
              <span className="text-lg font-black text-white">{source.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        <Filter size={14} className="text-slate-500" />
        <div className="flex bg-black/40 rounded-xl p-1 border border-white/10">
          <button onClick={() => setFilterStatus('all')}
            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${filterStatus === 'all' ? 'bg-white text-black' : 'text-slate-500 hover:text-white'}`}>
            {t.selAll}
          </button>
          {Object.entries(STATUS_CONFIG).map(([key, config]) => (
            <button key={key} onClick={() => setFilterStatus(key)}
              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${filterStatus === key ? 'bg-white text-black' : `${config.color} hover:text-white`}`}>
              {config.label}
            </button>
          ))}
        </div>
      </div>

      {/* Entries Table */}
      <div className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="px-4 py-3 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">{t.selKeyword}</th>
              <th className="px-4 py-3 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Slug</th>
              <th className="px-4 py-3 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest">Sitemap</th>
              <th className="px-4 py-3 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest">Base44</th>
              <th className="px-4 py-3 text-center text-[10px] font-black text-slate-500 uppercase tracking-widest">Notion</th>
              <th className="px-4 py-3 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">{t.selStatus}</th>
            </tr>
          </thead>
          <tbody>
            {filteredEntries.map((entry, i) => {
              const config = STATUS_CONFIG[entry.status] || STATUS_CONFIG.new;
              const StatusIcon = config.icon;
              return (
                <motion.tr key={`${entry.keyword}-${i}`}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                  className="border-b border-white/5 hover:bg-white/[0.03] transition-colors"
                >
                  <td className="px-4 py-3 text-sm font-bold text-white">{entry.keyword}</td>
                  <td className="px-4 py-3 text-xs font-mono text-slate-500">{entry.slug}</td>
                  <td className="px-4 py-3 text-center">
                    {entry.inSitemap ? <CheckCircle size={14} className="text-green-400 mx-auto" /> : <span className="text-slate-700">—</span>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {entry.inBase44 ? <CheckCircle size={14} className="text-green-400 mx-auto" /> : <span className="text-slate-700">—</span>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {entry.inNotionDB ? <CheckCircle size={14} className="text-green-400 mx-auto" /> : <span className="text-slate-700">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${config.bg} ${config.color}`}>
                      <StatusIcon size={10} />
                      {config.label}
                    </span>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DedupPanel;
