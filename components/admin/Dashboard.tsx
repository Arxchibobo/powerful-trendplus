
import React, { useState } from 'react';
import { useTrendData, ConnectionStatus } from '../../hooks/useTrendData';
import { VKSChart } from './VKSChart';
import { ActiveOps } from './ActiveOps'; // Replaced TaskTable
import { TrendIgnitionWidget } from './TrendIgnitionWidget';
import { VKSSpark } from '../../components/effects/VKSSpark';
import { Activity, Radio, AlertTriangle, Power, Zap, Network, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// 连接状态显示配置
const CONNECTION_STATUS_CONFIG: Record<ConnectionStatus, { color: string; text: string; icon: typeof Wifi }> = {
  disconnected: { color: 'text-slate-500', text: '未连接', icon: WifiOff },
  connecting: { color: 'text-yellow-500 animate-pulse', text: '连接中...', icon: Wifi },
  connected: { color: 'text-green-500', text: '已连接', icon: Wifi },
  error: { color: 'text-red-500', text: '连接错误', icon: WifiOff },
};

export function Dashboard() {
  // 从 hook 获取完整的状态数据
  const { data, currentVKS, currentHashtag, connectionStatus, dataSource, reconnect } = useTrendData();
  const [showKillModal, setShowKillModal] = useState(false);

  // 获取连接状态配置
  const statusConfig = CONNECTION_STATUS_CONFIG[connectionStatus];

  // Metric Cards Data - Updated to be more Data-Centric
  const metrics = [
    { label: 'Active Streams', value: '1,024', unit: 'Signals', icon: Network, color: 'text-pulse' },
    { label: 'Current VKS', value: currentVKS, unit: 'Score', icon: Activity, color: currentVKS > 80 ? 'text-spark animate-pulse' : 'text-pulse' },
    // "System Load" visual element
    { type: 'widget', component: <TrendIgnitionWidget vks={currentVKS} /> },
    { label: 'Total Reach', value: '2.4M', unit: 'Imp', icon: Radio, color: 'text-surge' },
  ];

  return (
    <div className="h-full flex flex-col p-6 space-y-6 overflow-y-auto relative">
      
      {/* --- WOW FACTOR: Particle Explosion Trigger --- */}
      <VKSSpark active={currentVKS > 90} />

      {/* Header & Controls */}
      <div className="flex justify-between items-center relative z-10">
        <div>
          <h1 className="text-2xl font-bold font-mono tracking-tight text-white flex items-center gap-2">
            COMMAND_CENTER <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded">V3.0 CONFLUENT + FLINK</span>
          </h1>
          <div className="flex items-center gap-4 mt-1">
            {/* 连接状态指示器 */}
            <div className="flex items-center gap-1.5">
              <statusConfig.icon size={12} className={statusConfig.color} />
              <span className={`text-[10px] font-mono ${statusConfig.color}`}>{statusConfig.text}</span>
            </div>
            {/* 数据源指示器 */}
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
              dataSource === 'backend'
                ? 'bg-green-900/30 text-green-400 border border-green-500/30'
                : 'bg-yellow-900/30 text-yellow-400 border border-yellow-500/30'
            }`}>
              {dataSource === 'backend' ? '🔴 LIVE DATA' : '⚡ SIMULATION'}
            </span>
            {/* 当前监控的 hashtag */}
            {currentHashtag && (
              <span className="text-[10px] font-mono text-pulse">
                监控: {currentHashtag}
              </span>
            )}
            {/* 重连按钮（仅在错误状态显示） */}
            {connectionStatus === 'error' && (
              <button
                onClick={reconnect}
                className="flex items-center gap-1 text-[10px] font-mono text-yellow-400 hover:text-yellow-300 transition-colors"
              >
                <RefreshCw size={10} />
                重连
              </button>
            )}
          </div>
        </div>
        
        {/* KILL SWITCH */}
        <button 
          onClick={() => setShowKillModal(true)}
          className="group relative px-5 py-2 overflow-hidden rounded bg-red-900/20 border border-red-900/50 hover:bg-red-600 hover:border-red-500 transition-all duration-300"
        >
          <div className="flex items-center gap-2">
             <Power size={16} className="text-red-500 group-hover:text-white transition-colors" />
             <span className="text-xs font-bold text-red-500 group-hover:text-white tracking-widest uppercase transition-colors">
               Emergency Stop
             </span>
          </div>
          {/* Scanning line effect */}
          <div className="absolute top-0 left-[-100%] h-full w-[20%] bg-gradient-to-r from-transparent via-red-500/50 to-transparent skew-x-12 group-hover:animate-[shimmer_1s_infinite]"></div>
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10">
        {metrics.map((m, idx) => {
          if (m.type === 'widget') {
             return (
                 <div key={idx} className="bg-card/50 backdrop-blur border border-white/5 rounded relative overflow-hidden group">
                     {m.component}
                 </div>
             );
          }
          return (
            <div key={idx} className="bg-card/50 backdrop-blur border border-white/5 p-4 rounded relative overflow-hidden group flex flex-col justify-between">
              <div className="flex justify-between items-start mb-2">
                <span className="text-[10px] uppercase font-mono text-slate-500 tracking-wider">{m.label}</span>
                {m.icon && <m.icon size={16} className={`${m.color} opacity-80`} />}
              </div>
              <div className="flex items-end gap-1">
                <span className="text-2xl font-bold text-slate-100">{m.value}</span>
                <span className="text-[10px] text-slate-500 font-mono mb-1">{m.unit}</span>
              </div>
              {/* Hover Glow */}
              <div className={`absolute -bottom-4 -right-4 w-16 h-16 blur-2xl opacity-0 group-hover:opacity-20 transition-opacity ${m.color?.replace('text-', 'bg-')}`}></div>
            </div>
          );
        })}
      </div>

      {/* Main Chart Section */}
      <div className="flex-1 min-h-[300px] bg-card/30 backdrop-blur border border-white/5 rounded p-1 relative flex flex-col z-10">
        <div className="absolute top-4 left-4 z-10 flex flex-col">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Activity size={14} className="text-pulse" />
                Real-time Kinetic Monitor
                {currentHashtag && (
                  <span className="text-spark font-mono">{currentHashtag}</span>
                )}
            </h3>
            <span className="text-[10px] text-slate-500 font-mono">
              Metric: VKS (Viral Kinetic Score) |
              数据源: {dataSource === 'backend' ? 'Confluent Kafka + Flink SQL' : '本地模拟'}
            </span>
        </div>
        <VKSChart data={data} />
      </div>

      {/* New Active Ops Dashboard Table (Replacing old Task Table) */}
      <div className="h-[500px] relative z-10">
         <ActiveOps />
      </div>

      {/* Kill Switch Modal */}
      <AnimatePresence>
        {showKillModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
              onClick={() => setShowKillModal(false)}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-md bg-[#0a0000] border border-red-600/50 shadow-[0_0_50px_rgba(220,38,38,0.2)] p-6 rounded overflow-hidden"
            >
              {/* Danger stripes */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-[repeating-linear-gradient(45deg,#dc2626,#dc2626_10px,#000_10px,#000_20px)]"></div>
              
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="h-16 w-16 rounded-full bg-red-900/30 flex items-center justify-center border border-red-500/30">
                  <AlertTriangle size={32} className="text-red-500 animate-pulse" />
                </div>
                
                <h2 className="text-xl font-bold text-red-500 tracking-widest uppercase">Emergency Override</h2>
                <p className="text-slate-400 text-sm font-mono">
                  Are you sure you want to execute <span className="text-white">KILL_SWITCH_PROTOCOL</span>? 
                  This will immediately sever connections to all active agents and halt data ingestion.
                </p>
                
                <div className="flex gap-3 w-full pt-4">
                  <button 
                    onClick={() => setShowKillModal(false)}
                    className="flex-1 py-3 text-xs font-bold uppercase tracking-wider text-slate-400 border border-slate-800 hover:bg-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => { alert('SYSTEM HALTED.'); setShowKillModal(false); }}
                    className="flex-1 py-3 text-xs font-bold uppercase tracking-wider text-black bg-red-600 hover:bg-red-500 transition-colors shadow-[0_0_20px_rgba(220,38,38,0.4)]"
                  >
                    Confirm Halt
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
