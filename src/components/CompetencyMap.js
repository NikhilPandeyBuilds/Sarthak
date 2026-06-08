import React from 'react';
import { COMPETENCY_GRAPHS } from '@/lib/competencies';

export default function CompetencyMap({ 
  role = 'Backend Engineer', 
  activeCompetency = '', 
  scores = {}, // { 'Mathematics': 8.0 }
  mode = 'sidebar' // 'sidebar' | 'radar'
}) {
  const competencies = Object.keys(COMPETENCY_GRAPHS[role] || {});

  if (mode === 'sidebar') {
    return (
      <div className="flex flex-col gap-3 font-mono text-xs select-none">
        {competencies.map((comp, idx) => {
          const isVisited = scores[comp] !== undefined;
          const isActive = comp === activeCompetency;
          const score = scores[comp];

          return (
            <div 
              key={comp}
              className={`flex items-center justify-between p-2.5 rounded border transition-all duration-300
                ${isActive 
                  ? 'border-cyan-400 bg-cyan-950/20 text-cyan-400 shadow-[0_0_12px_rgba(0,240,255,0.1)]' 
                  : isVisited 
                    ? 'border-emerald-500/30 bg-emerald-950/5 text-emerald-400' 
                    : 'border-slate-800 bg-slate-950/10 text-slate-500'
                }
              `}
            >
              <div className="flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full 
                  ${isActive ? 'bg-cyan-400 animate-ping' : isVisited ? 'bg-emerald-400' : 'bg-slate-700'}
                `} />
                <span>{comp}</span>
              </div>
              <div className="text-[10px]">
                {isActive ? (
                  <span className="text-cyan-400 animate-pulse">[TESTING]</span>
                ) : isVisited ? (
                  <span className="font-semibold text-emerald-400 bg-emerald-950/30 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                    {score.toFixed(1)}
                  </span>
                ) : (
                  <span className="text-slate-600">[PENDING]</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // -------------------------------------------------------------
  // RADAR CHART (PURE SVG DESIGN)
  // -------------------------------------------------------------
  const N = competencies.length;
  if (N === 0) return null;

  const center = 150;
  const radius = 100;

  // Compute points for a given score mapping
  const getCoordinates = (index, val) => {
    // Offset by -Math.PI / 2 to start at top center
    const angle = (index * 2 * Math.PI) / N - Math.PI / 2;
    // Map score value (0 to 10) to radius fraction
    const r = (val / 10) * radius;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return { x, y, angle };
  };

  // Concentric background grid polygons (5 levels: 2, 4, 6, 8, 10)
  const gridLevels = [2, 4, 6, 8, 10];
  const gridPolygons = gridLevels.map(level => {
    const points = [];
    for (let i = 0; i < N; i++) {
      const { x, y } = getCoordinates(i, level);
      points.push(`${x},${y}`);
    }
    return points.join(' ');
  });

  // Candidate score polygon
  const scorePoints = [];
  for (let i = 0; i < N; i++) {
    const comp = competencies[i];
    const scoreVal = scores[comp] !== undefined ? scores[comp] : 0; // Default to 0 if untested
    const { x, y } = getCoordinates(i, scoreVal);
    scorePoints.push(`${x},${y}`);
  }
  const scorePolygon = scorePoints.join(' ');

  // Labels positioning
  const labels = competencies.map((comp, i) => {
    // Pull slightly outwards from grid boundary
    const { x, y, angle } = getCoordinates(i, 12);
    // Align text anchor based on angle sector
    let textAnchor = 'middle';
    if (Math.cos(angle) > 0.1) textAnchor = 'start';
    if (Math.cos(angle) < -0.1) textAnchor = 'end';
    
    return { name: comp, x, y, textAnchor };
  });

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <svg 
        viewBox="0 0 300 300" 
        className="w-full max-w-[280px] sm:max-w-[320px] h-auto select-none overflow-visible"
      >
        <defs>
          {/* Glowing gradient fill for user scores */}
          <radialGradient id="radarGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#00f0ff" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#bd00ff" stopOpacity="0.45" />
          </radialGradient>
          
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Concentric grid lines */}
        {gridPolygons.map((points, idx) => (
          <polygon 
            key={idx} 
            points={points} 
            fill="none" 
            stroke="rgba(30, 41, 59, 0.5)" 
            strokeWidth="0.8" 
          />
        ))}

        {/* Axes lines from center */}
        {competencies.map((_, i) => {
          const { x, y } = getCoordinates(i, 10);
          return (
            <line 
              key={i} 
              x1={center} 
              y1={center} 
              x2={x} 
              y2={y} 
              stroke="rgba(30, 41, 59, 0.6)" 
              strokeWidth="0.8"
              strokeDasharray="2 3"
            />
          );
        })}

        {/* Shaded Candidate Data Polygon */}
        {scorePoints.length > 0 && (
          <polygon 
            points={scorePolygon} 
            fill="url(#radarGrad)" 
            stroke="#00f0ff" 
            strokeWidth="1.8"
            style={{ filter: 'url(#glow)' }}
          />
        )}

        {/* Outer dots on candidate scores */}
        {competencies.map((comp, i) => {
          const scoreVal = scores[comp] !== undefined ? scores[comp] : 0;
          if (scoreVal === 0) return null;
          const { x, y } = getCoordinates(i, scoreVal);
          return (
            <circle 
              key={i} 
              cx={x} 
              cy={y} 
              r="3.5" 
              fill="#bd00ff" 
              stroke="#00f0ff" 
              strokeWidth="1" 
            />
          );
        })}

        {/* Competency labels */}
        {labels.map((label, i) => {
          const scoreVal = scores[label.name] !== undefined ? scores[label.name] : 0;
          return (
            <text 
              key={i}
              x={label.x}
              y={label.y}
              fill={scoreVal > 0 ? '#e2e8f0' : '#475569'}
              fontSize="8"
              fontFamily="monospace"
              textAnchor={label.textAnchor}
              alignmentBaseline="middle"
              className="tracking-tighter"
            >
              {label.name} {scoreVal > 0 ? `(${scoreVal.toFixed(1)})` : ''}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
