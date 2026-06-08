import React from 'react';

export default function HudPanel({ 
  children, 
  title = '', 
  variant = 'cyan', // 'cyan', 'violet', 'default'
  className = '', 
  scanner = false, 
  glow = true 
}) {
  let borderClass = 'border-slate-800';
  let glowClass = '';

  if (variant === 'cyan') {
    borderClass = 'border-cyan-500/30';
    if (glow) glowClass = 'shadow-[0_0_15px_rgba(0,240,255,0.06)]';
  } else if (variant === 'violet') {
    borderClass = 'border-purple-500/30';
    if (glow) glowClass = 'shadow-[0_0_15px_rgba(189,0,255,0.06)]';
  } else if (variant === 'green') {
    borderClass = 'border-emerald-500/30';
    if (glow) glowClass = 'shadow-[0_0_15px_rgba(16,185,129,0.06)]';
  }

  return (
    <div className={`hud-panel relative overflow-hidden flex flex-col ${borderClass} ${glowClass} ${className}`}>
      {scanner && <div className="scanner-glow" />}
      
      {/* HUD Panel Corners decoration */}
      <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-cyan-400/50" />
      <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-cyan-400/50" />
      <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-cyan-400/50" />
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-cyan-400/50" />

      {title && (
        <div className="px-4 py-2 border-b border-slate-800/80 bg-slate-950/40 flex items-center justify-between text-xs tracking-widest font-mono text-slate-400 select-none">
          <span className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${variant === 'cyan' ? 'bg-cyan-400' : variant === 'violet' ? 'bg-purple-400' : 'bg-slate-400'} pulse-glow`} />
            {title.toUpperCase()}
          </span>
          <span className="text-[10px] text-slate-600">SYS_V2.0</span>
        </div>
      )}
      
      <div className="p-4 flex-1 flex flex-col">
        {children}
      </div>
    </div>
  );
}
