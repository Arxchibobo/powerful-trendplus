import React from 'react';
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';
import { VKSDataPoint } from '../../hooks/useTrendData';

interface Props {
  data: VKSDataPoint[];
}

export function VKSChart({ data }: Props) {
  return (
    <div className="w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            {/* Heatmap Gradient: 
                Top (High VKS) = Spark (Red/Orange) 
                Bottom (Low VKS) = Pulse (Blue) 
            */}
            <linearGradient id="vksHeatmap" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ff6b35" stopOpacity={0.8}/>
              <stop offset="50%" stopColor="#a855f7" stopOpacity={0.5}/>
              <stop offset="95%" stopColor="#00d4ff" stopOpacity={0.2}/>
            </linearGradient>
            
            {/* Stroke Gradient for the line itself */}
            <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ff6b35" />
              <stop offset="95%" stopColor="#00d4ff" />
            </linearGradient>
          </defs>
          
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" strokeOpacity={0.5} />
          
          <XAxis 
            dataKey="time" 
            tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }} 
            tickLine={false}
            axisLine={false}
            interval={10}
          />
          <YAxis 
            hide 
            domain={[0, 120]} // Fixed domain to keep gradient stable
          />
          
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#0a0e1a', 
              borderColor: '#333', 
              boxShadow: '0 0 15px rgba(0,0,0,0.5)' 
            }}
            itemStyle={{ fontFamily: 'monospace', fontSize: '12px' }}
            labelStyle={{ color: '#94a3b8', fontSize: '10px', fontFamily: 'monospace', marginBottom: '5px' }}
            formatter={(value: number) => [value, 'VKS Score']}
          />
          
          <Area 
            type="monotone" 
            dataKey="vks" 
            stroke="url(#lineGradient)" 
            strokeWidth={3}
            fill="url(#vksHeatmap)" 
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}