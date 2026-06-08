'use client';

import React, { useEffect, useState } from 'react';

export default function AiStatusBadge({ className = '' }) {
  const [status, setStatus] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch('/api/ai-status');
        const data = await res.json();
        if (!cancelled) setStatus(data);
      } catch {
        if (!cancelled) {
          setStatus({
            mode: 'mock',
            reason: 'Could not reach AI status endpoint.',
          });
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!status) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded border border-slate-700 bg-slate-950/60 font-mono text-[9px] tracking-widest text-slate-500 uppercase ${className}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-pulse" />
        AI STATUS...
      </span>
    );
  }

  const isLive = status.mode === 'live';

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded border font-mono text-[9px] tracking-widest uppercase select-none ${className}
        ${
          isLive
            ? 'border-emerald-500/40 bg-emerald-950/30 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.15)]'
            : 'border-amber-500/40 bg-amber-950/25 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.1)]'
        }
      `}
      title={status.reason || (isLive ? `Model: ${status.model || 'gemini'}` : 'Using local mock AI')}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}
      />
      {isLive ? 'LIVE GEMINI AI' : 'OFFLINE MOCK MODE'}
    </span>
  );
}
