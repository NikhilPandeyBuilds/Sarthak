import React from 'react';

export default function CoreVisualizer({ state = 'idle' }) {
  // state can be: 'idle', 'speaking', 'thinking'
  
  return (
    <div className="flex flex-col items-center justify-center py-6 select-none">
      <div className="relative w-48 h-48 flex items-center justify-center">
        
        {/* Glow Filters */}
        <svg className="absolute w-0 h-0">
          <defs>
            <filter id="neon-glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="neon-glow-violet" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
        </svg>

        {/* Ambient Ring background */}
        <div className="absolute w-56 h-56 rounded-full border border-slate-900/50 flex items-center justify-center">
          <div className="w-48 h-48 rounded-full border border-slate-900/30" />
        </div>

        {/* Dynamic Core Orb */}
        <div 
          className={`relative w-36 h-36 rounded-full flex items-center justify-center transition-all duration-700
            ${state === 'idle' ? 'core-avatar-idle bg-indigo-950/20 border border-purple-500/20' : ''}
            ${state === 'speaking' ? 'core-avatar-speaking bg-cyan-950/30 border border-cyan-400/40' : ''}
            ${state === 'thinking' ? 'core-avatar-thinking border-[4px]' : ''}
          `}
        >
          {/* Inner details based on state */}
          {state === 'thinking' ? (
            // Swirling dashboard core
            <div className="w-24 h-24 rounded-full border border-dashed border-cyan-400/30 animate-spin flex items-center justify-center">
              <div className="w-16 h-16 rounded-full border border-dotted border-purple-500/50 animate-bounce flex items-center justify-center">
                <div className="w-8 h-8 rounded-full bg-cyan-400/20 blur-sm" />
              </div>
            </div>
          ) : (
            // Concentric SVG rings
            <svg 
              viewBox="0 0 100 100" 
              className="w-full h-full p-2"
            >
              {/* Radial Gradient */}
              <defs>
                <radialGradient id="coreGrad" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor={state === 'speaking' ? '#00f0ff' : '#bd00ff'} stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#030712" stopOpacity="0" />
                </radialGradient>
              </defs>
              
              <circle cx="50" cy="50" r="45" fill="url(#coreGrad)" />
              
              {/* Outer ring */}
              <circle 
                cx="50" 
                cy="50" 
                r="40" 
                fill="none" 
                stroke={state === 'speaking' ? '#00f0ff' : '#bd00ff'} 
                strokeWidth="0.8" 
                strokeDasharray="4 8 16 8"
                className="origin-center animate-[spin_30s_linear_infinite]"
                style={{ filter: `url(#neon-glow-${state === 'speaking' ? 'cyan' : 'violet'})` }}
              />
              
              {/* Inner ring */}
              <circle 
                cx="50" 
                cy="50" 
                r="30" 
                fill="none" 
                stroke={state === 'speaking' ? '#22d3ee' : '#c084fc'} 
                strokeWidth="0.5" 
                strokeDasharray="20 5 10 5"
                className="origin-center animate-[spin_15s_linear_infinite_reverse]"
              />

              {/* Center Core dot */}
              <circle 
                cx="50" 
                cy="50" 
                r="10" 
                fill={state === 'speaking' ? '#00f0ff' : '#bd00ff'} 
                fillOpacity="0.6"
                className="pulse-glow"
              />
            </svg>
          )}

          {/* Soundwave bars mapping speakers (speaking state decoration) */}
          {state === 'speaking' && (
            <div className="absolute inset-0 flex items-center justify-around px-8 pointer-events-none opacity-40">
              <div className="w-1 h-8 bg-cyan-400 rounded animate-[bounce_0.8s_infinite]" />
              <div className="w-1 h-14 bg-cyan-300 rounded animate-[bounce_0.5s_infinite_0.15s]" />
              <div className="w-1 h-10 bg-cyan-400 rounded animate-[bounce_0.6s_infinite_0.3s]" />
              <div className="w-1 h-6 bg-cyan-300 rounded animate-[bounce_0.7s_infinite_0.1s]" />
            </div>
          )}
        </div>

        {/* State Tag Overlay */}
        <div className="absolute -bottom-2 bg-slate-950 border border-slate-800 px-3 py-0.5 rounded text-[9px] font-mono tracking-widest uppercase select-none text-slate-500">
          CORE: <span className={
            state === 'speaking' ? 'text-cyan-400' : state === 'thinking' ? 'text-purple-400' : 'text-slate-400'
          }>{state}</span>
        </div>
      </div>
    </div>
  );
}
