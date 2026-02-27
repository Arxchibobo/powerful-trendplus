
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Loader2, CheckCircle2, Server, Globe, Cpu } from 'lucide-react';

interface IntroLoaderProps {
    isDataReady: boolean;
    onComplete: () => void;
}

const LOADING_STEPS = [
    { text: "INITIALIZING CORE SYSTEMS...", icon: Cpu },
    { text: "ESTABLISHING NEURAL UPLINK...", icon: Server },
    { text: "SCANNING GLOBAL VISUAL FEEDS...", icon: Globe }, // This is where we wait for data
    { text: "PROCESSING SIGNAL INTELLIGENCE...", icon: Search },
    { text: "SYSTEM READY.", icon: CheckCircle2 }
];

export function IntroLoader({ isDataReady, onComplete }: IntroLoaderProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);
  
  // 1. Minimum Branding Timer (Reduced for faster response)
  useEffect(() => {
    const timer = setTimeout(() => {
        setMinTimeElapsed(true);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  // 2. Step Sequencer
  useEffect(() => {
      // Step 0 -> 1 -> 2 (Scanning)
      if (stepIndex < 2) {
          const timeout = setTimeout(() => setStepIndex(prev => prev + 1), 200);
          return () => clearTimeout(timeout);
      }
      
      // Step 2 -> 3 (Only if data is ready)
      if (stepIndex === 2 && isDataReady) {
           setStepIndex(3);
      }

      // Step 3 -> 4 (Final processing)
      if (stepIndex === 3) {
          const timeout = setTimeout(() => setStepIndex(4), 150);
          return () => clearTimeout(timeout);
      }

      // Step 4 -> Complete (Wait for min time)
      if (stepIndex === 4 && minTimeElapsed) {
          const timeout = setTimeout(() => {
              onComplete();
          }, 200); // Reduced buffer
          return () => clearTimeout(timeout);
      }

  }, [stepIndex, isDataReady, minTimeElapsed, onComplete]);

  // Calculate Progress
  // Base progress based on steps, capped at 90% if data isn't ready
  let progressPercent = 0;
  if (stepIndex === 0) progressPercent = 10;
  else if (stepIndex === 1) progressPercent = 30;
  else if (stepIndex === 2) progressPercent = 60; // Waiting for data
  else if (stepIndex === 3) progressPercent = 90;
  else if (stepIndex === 4) progressPercent = 100;

  // Visual text & Icon
  const CurrentIcon = LOADING_STEPS[Math.min(stepIndex, LOADING_STEPS.length - 1)].icon;
  const currentText = LOADING_STEPS[Math.min(stepIndex, LOADING_STEPS.length - 1)].text;

  return (
    <motion.div 
        className="fixed inset-0 z-[9999] bg-[#050505] flex flex-col items-center justify-center font-sans"
        exit={{ opacity: 0, scale: 1.1, filter: "blur(20px)" }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
    >
        {/* Background Grid & Aurora */}
        <div className="absolute inset-0 opacity-[0.1]" 
             style={{ 
               backgroundImage: `radial-gradient(#00d4ff 1px, transparent 1px)`, 
               backgroundSize: '30px 30px' 
             }} 
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] bg-gradient-to-tr from-indigo-900/40 to-purple-900/40 rounded-full blur-[120px] pointer-events-none animate-pulse" />

        {/* --- BRAND LOGO: Crystal Butterfly --- */}
        <div className="mb-20 relative group perspective-1000">
             
             {/* Glass Squircle Container - Thick & High Fidelity */}
             <motion.div 
                initial={{ rotateX: 10, rotateY: -10, y: 20, opacity: 0 }}
                animate={{ rotateX: [10, -5, 10], rotateY: [-10, 5, -10], y: 0, opacity: 1 }}
                transition={{ 
                    y: { duration: 1, ease: "easeOut" },
                    opacity: { duration: 1 },
                    default: { duration: 8, ease: "easeInOut", repeat: Infinity }
                }}
                className="relative w-64 h-64 bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[3rem] flex items-center justify-center shadow-[0_20px_80px_rgba(0,0,0,0.6),inset_0_0_20px_rgba(255,255,255,0.05)] overflow-hidden"
             >
                {/* Edge Highlights */}
                <div className="absolute inset-0 rounded-[3rem] border border-white/20 opacity-50" />
                <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
                
                {/* The Butterfly SVG */}
                <svg width="180" height="180" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative z-10 drop-shadow-[0_0_30px_rgba(189,0,255,0.4)]">
                    <defs>
                        {/* Iridescent Gradient */}
                        <linearGradient id="wingGradient" x1="0" y1="0" x2="200" y2="200" gradientUnits="userSpaceOnUse">
                            <stop offset="0%" stopColor="#00F0FF" /> {/* Cyan */}
                            <stop offset="50%" stopColor="#BD00FF" /> {/* Purple */}
                            <stop offset="100%" stopColor="#FF7E5F" /> {/* Pink */}
                        </linearGradient>
                    </defs>
                    
                    {/* Right Wing (Foreground) - Organic Shape with Morphing */}
                    <motion.path 
                        d="M100 120 C 100 120, 140 40, 180 60 C 200 80, 180 140, 140 160 C 120 170, 100 170, 100 170" 
                        fill="url(#wingGradient)" 
                        fillOpacity="0.6"
                        stroke="white"
                        strokeWidth="0.5"
                        strokeOpacity="0.5"
                        animate={{ 
                            d: [
                                "M100 120 C 100 120, 140 40, 180 60 C 200 80, 180 140, 140 160 C 120 170, 100 170, 100 170",
                                "M100 125 C 100 125, 130 50, 170 70 C 190 90, 170 150, 135 165 C 115 175, 100 175, 100 175",
                                "M100 120 C 100 120, 140 40, 180 60 C 200 80, 180 140, 140 160 C 120 170, 100 170, 100 170"
                            ]
                        }}
                        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                    />

                     {/* Left Wing (Background) */}
                     <motion.path 
                        d="M100 120 C 100 120, 60 40, 20 60 C 0 80, 20 140, 60 160 C 80 170, 100 170, 100 170" 
                        fill="url(#wingGradient)" 
                        fillOpacity="0.3"
                        stroke="white"
                        strokeWidth="0.5"
                        strokeOpacity="0.3"
                        animate={{ 
                            d: [
                                "M100 120 C 100 120, 60 40, 20 60 C 0 80, 20 140, 60 160 C 80 170, 100 170, 100 170",
                                "M100 125 C 100 125, 70 50, 30 70 C 10 90, 30 150, 65 165 C 85 175, 100 175, 100 175",
                                "M100 120 C 100 120, 60 40, 20 60 C 0 80, 20 140, 60 160 C 80 170, 100 170, 100 170"
                            ]
                        }}
                        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
                    />
                    
                    {/* Tech Nodes Overlay */}
                    <g className="mix-blend-overlay">
                        <motion.circle cx="140" cy="60" r="3" fill="white" animate={{ r: [2, 4, 2], opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }} />
                        <motion.circle cx="180" cy="100" r="2" fill="#00F0FF" animate={{ r: [1, 3, 1], opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity, delay: 0.5 }} />
                        <motion.circle cx="60" cy="160" r="2" fill="#FF7E5F" animate={{ r: [1, 3, 1], opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity, delay: 1 }} />
                    </g>

                    {/* Central Body */}
                    <ellipse cx="100" cy="140" rx="4" ry="40" fill="white" opacity="0.8" filter="blur(4px)" />
                    <ellipse cx="100" cy="140" rx="2" ry="30" fill="white" />
                </svg>
             </motion.div>
        </div>

        {/* Loading Text & Sequence */}
        <div className="w-[90%] max-w-sm flex flex-col items-center gap-4">
            
            <AnimatePresence mode='wait'>
                <motion.div 
                    key={stepIndex}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center gap-3 text-[#00F0FF] h-6"
                >
                    <CurrentIcon size={16} className={stepIndex < 4 ? "animate-pulse" : ""} />
                    <span className="font-mono text-xs font-bold tracking-[0.2em] uppercase text-center min-w-[240px]">
                        {currentText}
                    </span>
                </motion.div>
            </AnimatePresence>
            
            {/* High Tech Progress Bar */}
            <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden relative border border-white/5">
                {/* Background Scanline */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-[shimmer_2s_infinite] w-full" />
                
                {/* Fill Bar */}
                <motion.div 
                    initial={{ width: "0%" }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 1, ease: "easeInOut" }}
                    className={`h-full relative shadow-[0_0_15px_rgba(0,240,255,0.5)] ${stepIndex === 4 ? 'bg-green-500' : 'bg-gradient-to-r from-[#00F0FF] to-[#BD00FF]'}`}
                >
                    <div className="absolute right-0 top-0 bottom-0 w-4 bg-white blur-[4px]" />
                </motion.div>
            </div>

            {/* Version / Metadata */}
            <div className="flex justify-between w-full text-[9px] font-mono text-slate-600 mt-2 uppercase tracking-widest">
                <span>Core v3.4.1</span>
                <span>Signal: {isDataReady ? 'LOCKED' : 'SEARCHING...'}</span>
            </div>
        </div>

        {/* Disclaimer */}
        <div className="absolute bottom-8 text-[10px] text-slate-700 font-mono">
            SECURE CONNECTION // TREND PULSE AI
        </div>
    </motion.div>
  );
}
