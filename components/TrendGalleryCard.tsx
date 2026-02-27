
import React from 'react';
import { TrendItem } from '../types';
import { motion } from 'framer-motion';
import { Zap, ShieldAlert, TrendingUp, AlertTriangle } from 'lucide-react';
import TrendLine from './TrendLine';

interface Props {
  trend: TrendItem;
  variant: 'trending' | 'agent' | 'risk';
  onClick: (trend: TrendItem) => void;
  isSelected: boolean;
  t: any;
}

const TrendGalleryCard: React.FC<Props> = ({ trend, variant, onClick, isSelected, t }) => {
  const baseClasses = `
    relative p-3 rounded-lg border cursor-pointer transition-all duration-300 flex flex-col justify-between h-[120px]
    ${isSelected 
        ? 'bg-pulse/10 border-pulse/50 shadow-[0_0_15px_rgba(0,212,255,0.2)]' 
        : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 hover:-translate-y-1'
    }
  `;

  // Dynamic Border Color based on variant
  const borderColor = 
      variant === 'risk' ? (isSelected ? 'border-red-500' : 'hover:border-red-500/50') :
      variant === 'agent' ? (isSelected ? 'border-green-500' : 'hover:border-green-500/50') :
      (isSelected ? 'border-pulse' : 'hover:border-pulse/50');

  return (
    <motion.div
        onClick={() => onClick(trend)}
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`${baseClasses} ${borderColor} group overflow-hidden`}
    >
        {/* Background Gradient & Pattern */}
        <div className="absolute inset-0 opacity-10 bg-gradient-to-br from-transparent to-black pointer-events-none" />
        
        {/* Header */}
        <div className="relative z-10 flex justify-between items-start">
            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider truncate max-w-[70%]">
                {trend.category}
            </span>
            {variant === 'risk' ? (
                 <ShieldAlert size={12} className="text-red-500" />
            ) : variant === 'agent' ? (
                 <Zap size={12} className="text-green-500" />
            ) : (
                 <span className={`text-xs font-black font-mono ${trend.trendScore && trend.trendScore > 80 ? 'text-spark' : 'text-pulse'}`}>
                     {trend.trendScore}
                 </span>
            )}
        </div>

        {/* Content */}
        <div className="relative z-10 mt-1">
             <h4 className="text-xs font-bold text-slate-200 leading-tight line-clamp-2 group-hover:text-white transition-colors">
                 {trend.topic}
             </h4>
             <div className="flex items-center gap-2 mt-2">
                {trend.views && (
                    <div className="flex items-center gap-1">
                        <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest">{t.views}</span>
                        <span className="text-[8px] font-black text-white">{trend.views}</span>
                    </div>
                )}
                <div className="flex-1 h-6 opacity-40">
                    <TrendLine data={trend.history} color={trend.trendScore && trend.trendScore > 80 ? '#FF7E5F' : '#00F0FF'} />
                </div>
             </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 mt-auto pt-2 flex items-center gap-2">
            {variant === 'risk' ? (
                 <div className="flex items-center gap-1 text-[9px] text-red-400 font-mono bg-red-900/20 px-1.5 py-0.5 rounded">
                     <AlertTriangle size={8} />
                     {t.highRisk}
                 </div>
            ) : variant === 'agent' ? (
                 <div className="flex items-center gap-1 text-[9px] text-green-400 font-mono bg-green-900/20 px-1.5 py-0.5 rounded">
                     <Zap size={8} />
                     {t.ready}
                 </div>
            ) : (
                 <div className="flex items-center gap-1 text-[9px] text-slate-500 font-mono">
                     <TrendingUp size={8} />
                     {trend.platforms[0] || 'Web'}
                 </div>
            )}
        </div>
        
        {/* Selection Indicator */}
        {isSelected && <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${variant === 'risk' ? 'bg-red-500' : variant === 'agent' ? 'bg-green-500' : 'bg-pulse'}`} />}
    </motion.div>
  );
};

export default TrendGalleryCard;
