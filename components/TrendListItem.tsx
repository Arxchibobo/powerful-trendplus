
import React from 'react';
import { TrendItem } from '../types';
import { Twitter, Linkedin, Video, MessageCircle, Instagram, Zap, ShieldAlert, Facebook, TrendingUp, TrendingDown } from 'lucide-react';
import { motion } from 'framer-motion';
import TrendLine from './TrendLine';

interface Props {
  trend: TrendItem;
  variant: 'trending' | 'agent' | 'risk';
  onClick: (trend: TrendItem) => void;
  isSelected: boolean;
  t: any;
}

const COLORS = {
  PULSE: '#00F0FF',
  SPARK: '#FF7E5F',
  SURGE: '#BD00FF'
};

const TrendListItem: React.FC<Props> = ({ trend, variant, onClick, isSelected, t }) => {
  
  const renderPlatformIcon = (p: string) => {
    const lower = (p || '').toLowerCase();
    const props = { size: 14, className: isSelected ? "text-white" : "text-slate-500" };
    if (lower.includes('x')) return <Twitter key={p} {...props} />;
    if (lower.includes('linkedin')) return <Linkedin key={p} {...props} />;
    if (lower.includes('tiktok')) return <Video key={p} {...props} />;
    if (lower.includes('instagram')) return <Instagram key={p} {...props} />;
    if (lower.includes('facebook')) return <Facebook key={p} {...props} />;
    return <MessageCircle key={p} {...props} />;
  };

  const baseClasses = `
    relative p-6 rounded-[2rem] border cursor-pointer transition-all duration-500 overflow-hidden
    ${isSelected 
        ? 'bg-white/15 border-white/20 shadow-2xl z-10 translate-x-3 scale-[1.02]' 
        : 'bg-white/[0.03] border-white/5 hover:bg-white/10 hover:border-white/10 hover:translate-x-1'
    }
  `;

  const score = trend.trendScore || 0;
  let scoreColor = '#94a3b8';
  if (score >= 90) scoreColor = COLORS.SPARK;
  else if (score >= 75) scoreColor = COLORS.SURGE;
  else if (score >= 50) scoreColor = COLORS.PULSE;

  const isRising = trend.history && trend.history[trend.history.length - 1] > trend.history[0];

  return (
    <motion.div 
        onClick={() => onClick(trend)}
        className={baseClasses}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
    >
        {isSelected && (
            <div className="absolute inset-0 bg-gradient-to-r from-pulse/5 to-transparent pointer-events-none" />
        )}

        <div className="flex justify-between items-center mb-4 relative z-10">
             <div className="flex gap-2.5">
                {(trend.platforms || []).slice(0, 4).map(renderPlatformIcon)}
             </div>
             <div className="flex items-center gap-2">
                {isRising ? (
                    <TrendingUp size={14} className="text-green-500" />
                ) : (
                    <TrendingDown size={14} className="text-red-500" />
                )}
                {trend.riskLevel === 'high' ? (
                    <ShieldAlert size={16} className="text-red-500 animate-pulse" />
                ) : trend.agentReady ? (
                    <Zap size={16} className="text-green-500 fill-green-500" />
                ) : (
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                )}
             </div>
        </div>

        <h4 className={`text-base font-black leading-snug transition-colors mb-3 uppercase tracking-tight ${isSelected ? 'text-white' : 'text-slate-200'}`}>
            {trend.topic}
        </h4>

        <div className="flex items-center gap-4 mb-5 relative z-10">
            {trend.views && (
                <div className="flex flex-col">
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{t.views}</span>
                    <span className="text-[10px] font-black text-white">{trend.views}</span>
                </div>
            )}
            {trend.discussionCount && (
                <div className="flex flex-col">
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{t.discussions}</span>
                    <span className="text-[10px] font-black text-white">{trend.discussionCount}</span>
                </div>
            )}
            <div className="flex-1 h-10 ml-4 opacity-60">
                <TrendLine data={trend.history} color={scoreColor} />
            </div>
        </div>

        <div className="flex items-center gap-4 relative z-10">
            <div className="flex-1 h-2 bg-black/40 rounded-full overflow-hidden border border-white/5 shadow-inner">
                <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${score}%` }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: scoreColor, boxShadow: `0 0 10px ${scoreColor}` }}
                />
            </div>
            <span className="text-xs font-black font-mono tracking-widest" style={{ color: scoreColor }}>{score}</span>
        </div>
        
        {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-pulse shadow-[0_0_20px_#00F0FF] rounded-r-full" />}
    </motion.div>
  );
};

export default TrendListItem;
