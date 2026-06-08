'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import HudPanel from '@/components/HudPanel';

export default function Home() {
  const [logs, setLogs] = useState([]);
  
  const bootLogs = [
    "[SYS] INITIALIZING SAKSHAT_CORE_V2.0...",
    "[SYS] ESTABLISHING HEURISTIC LINK...",
    "[SYS] ADAPTIVE ASSESSMENT MATRIX: ONLINE",
    "[SYS] DYNAMIC COMPETENCY GRAPH: READY",
    "[SYS] GOOGLE_MODE CONFIG: SYNCED",
    "[SYS] OPENAI_MODE CONFIG: SYNCED",
    "[SYS] NVIDIA_MODE CONFIG: SYNCED",
    "[SYS] CLIENT SPEECH API: ACTIVE",
    "[SYS] SYSTEM SECURE. CHAMBER UNLOCKED."
  ];

  useEffect(() => {
    let currentIdx = 0;
    const interval = setInterval(() => {
      if (currentIdx < bootLogs.length) {
        setLogs(prev => [...prev, bootLogs[currentIdx]]);
        currentIdx++;
      } else {
        clearInterval(interval);
      }
    }, 450);

    return () => clearInterval(interval);
  }, []);

  return (
    <main className="min-h-screen bg-[#030712] flex flex-col justify-between p-4 sm:p-6 md:p-8 cyber-grid-bg relative overflow-hidden">
      
      {/* HUD Header */}
      <header className="flex justify-between items-center max-w-6xl w-full mx-auto border-b border-slate-900 pb-4 mb-4 select-none font-mono text-[10px] tracking-widest text-slate-500">
        <div>SAKSHAT // ASSESSMENT_SYSTEM</div>
        <div>STATUS: <span className="text-cyan-400">ONLINE</span></div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col justify-center items-center max-w-4xl w-full mx-auto gap-8 my-8 relative z-10">
        
        {/* Animated HUD Core Logo */}
        <div className="relative w-64 h-64 flex items-center justify-center select-none">
          <div className="absolute inset-0 rounded-full border border-dashed border-cyan-500/20 animate-[spin_60s_linear_infinite]" />
          <div className="absolute inset-4 rounded-full border border-dotted border-purple-500/30 animate-[spin_30s_linear_infinite_reverse]" />
          
          {/* Central geometric design */}
          <svg viewBox="0 0 100 100" className="w-40 h-40 animate-[pulse_4s_ease-in-out_infinite]">
            <polygon 
              points="50,5 95,25 95,75 50,95 5,75 5,25" 
              fill="none" 
              stroke="#00f0ff" 
              strokeWidth="0.8" 
              className="drop-shadow-[0_0_8px_rgba(0,240,255,0.4)]"
            />
            <polygon 
              points="50,15 80,30 80,70 50,85 20,70 20,30" 
              fill="none" 
              stroke="#bd00ff" 
              strokeWidth="0.5" 
            />
            <circle cx="50" cy="50" r="10" fill="none" stroke="#00f0ff" strokeWidth="1.5" />
            <circle cx="50" cy="50" r="4" fill="#00f0ff" />
          </svg>
          
          {/* Subtext glow */}
          <div className="absolute -bottom-4 text-center">
            <h1 className="text-4xl font-extrabold tracking-[0.25em] text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-slate-100 to-purple-400 drop-shadow-sm">
              SAKSHAT
            </h1>
            <p className="text-[10px] uppercase font-mono tracking-[0.4em] text-slate-500 mt-1">
              Heuristic Interview Chamber
            </p>
          </div>
        </div>

        {/* Project short explanation */}
        <div className="text-center max-w-xl px-4 mt-6">
          <p className="text-sm text-slate-400 leading-relaxed font-sans font-light">
            An elite, adaptive technical assessment platform. Engage with a simulated Principal Engineer who analyzes your resume claims, tracks competency nodes, and adapts dynamically to map your engineering thresholds.
          </p>
        </div>

        {/* Boot diagnostic text logs */}
        <div className="w-full max-w-md mt-4">
          <HudPanel title="System Diagnostics" variant="default" className="h-32 text-[10px] font-mono text-cyan-400/80 p-0 overflow-y-auto">
            <div className="flex flex-col gap-1 text-left px-2 py-1 select-none">
              {logs.map((log, index) => (
                <div key={index} className="opacity-90 animate-[fadeIn_0.2s_ease-out]">
                  {log}
                </div>
              ))}
              {logs.length < bootLogs.length && (
                <div className="w-1.5 h-3 bg-cyan-400 animate-pulse inline-block" />
              )}
            </div>
          </HudPanel>
        </div>

        {/* Trigger Button */}
        <div className="mt-4">
          <Link href="/upload">
            <button className="cyber-btn px-8 py-3.5 rounded text-sm tracking-widest font-mono cursor-pointer">
              [ INITIATE CHAMBER BOOT ]
            </button>
          </Link>
        </div>
      </div>

      {/* HUD Footer */}
      <footer className="max-w-6xl w-full mx-auto border-t border-slate-950 pt-4 flex flex-col sm:flex-row justify-between items-center gap-2 font-mono text-[9px] text-slate-600 select-none">
        <div>SAKSHAT // HACKATHON_DEMO_2026</div>
        <div>BUILT FOR GOOGLE / NVIDIA / OPENAI EVALUATION</div>
      </footer>
    </main>
  );
}
