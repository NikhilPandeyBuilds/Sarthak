'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import HudPanel from '@/components/HudPanel';
import CompetencyMap from '@/components/CompetencyMap';
import AiStatusBadge from '@/components/AiStatusBadge';

export default function HiringDossier() {
  const router = useRouter();
  const { sessionId } = useParams();

  const [session, setSession] = useState(null);
  const [report, setReport] = useState(null);
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Tab control for report sections
  const [activeTab, setActiveTab] = useState('dossier'); // 'dossier' | 'transcript'

  useEffect(() => {
    if (!sessionId) return;

    const fetchReport = async () => {
      try {
        const res = await fetch(`/api/report/${sessionId}`);
        if (res.status === 202) {
          // Report is still generating, retry shortly
          setTimeout(fetchReport, 2000);
          return;
        }
        if (!res.ok) throw new Error('Dossier not found');
        const data = await res.json();
        
        setSession(data.session);
        setReport(data.report);
        setHistory(data.history);
      } catch (err) {
        console.error(err);
        setError('Failed to load dossier report. Verify key setup and retry.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchReport();
  }, [sessionId]);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#030712] flex flex-col items-center justify-center gap-4 p-4">
        <AiStatusBadge />
        <div className="font-mono text-xs text-purple-400 animate-pulse uppercase select-none">
          Synthesizing Hiring Dossier...
        </div>
      </main>
    );
  }

  if (error || !report || !session) {
    return (
      <main className="min-h-screen bg-[#030712] flex items-center justify-center p-4">
        <HudPanel title="System Interrupt" variant="default" className="max-w-md w-full">
          <div className="text-center font-mono text-xs text-rose-400 p-4">
            {error || 'Hiring report is empty or missing.'}
          </div>
          <button onClick={() => router.push('/upload')} className="cyber-btn py-2 text-xs font-mono mt-4">
            [ RETURN TO CONFIG DECK ]
          </button>
        </HudPanel>
      </main>
    );
  }

  // Helper to calculate overall percentage indicator
  const overallPercentage = Math.round(
    (report.technical_score + report.problem_solving_score + report.communication_score) / 3
  );

  return (
    <main className="min-h-screen bg-[#030712] flex flex-col p-4 sm:p-6 md:p-8 cyber-grid-bg select-text">
      
      {/* Dossier Header */}
      <header className="flex flex-wrap justify-between items-center gap-3 max-w-7xl w-full mx-auto border-b border-slate-900 pb-4 mb-6 select-none font-mono text-[10px] tracking-widest text-slate-500">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse" />
          <span>SAKSHAT // HIRING_DOSSIER // CONFIDENTIAL</span>
        </div>
        <div className="flex items-center gap-3">
          <AiStatusBadge />
          <button onClick={() => router.push('/upload')} className="hover:text-cyan-400 font-mono transition-colors">
            [ BOOT NEW CHAMBER ]
          </button>
        </div>
      </header>

      {/* Profile Overview HUD */}
      <div className="max-w-7xl w-full mx-auto mb-6">
        <HudPanel title="Candidate Assessment Profile" variant="violet" className="p-0">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-4 select-none">
            <div className="flex flex-col gap-1">
              <div className="text-[10px] font-mono text-purple-400 uppercase tracking-widest">[SUBJECT IDENTIFICATION]</div>
              <h1 className="text-2xl font-bold text-slate-100 font-sans tracking-tight">ENGINEERING CANDIDATE</h1>
              <div className="text-xs font-mono text-slate-400 mt-1 select-text">
                Target: <span className="text-cyan-400 font-semibold">{session.company}</span> | Role: <span className="text-purple-400 font-semibold">{session.role}</span> | Band: {session.experience_level}
              </div>
            </div>

            {/* Dial fit percentage */}
            <div className="flex items-center gap-4 bg-slate-950/40 border border-slate-800 rounded-lg p-3 px-5">
              <div className="relative w-16 h-16 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-95">
                  <circle cx="32" cy="32" r="28" fill="transparent" stroke="rgba(30,41,59,0.3)" strokeWidth="4" />
                  <circle 
                    cx="32" 
                    cy="32" 
                    r="28" 
                    fill="transparent" 
                    stroke="url(#purpleCyanGrad)" 
                    strokeWidth="4" 
                    strokeDasharray={2 * Math.PI * 28}
                    strokeDashoffset={2 * Math.PI * 28 * (1 - overallPercentage / 100)}
                    strokeLinecap="round"
                  />
                  <defs>
                    <linearGradient id="purpleCyanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#bd00ff" />
                      <stop offset="100%" stopColor="#00f0ff" />
                    </linearGradient>
                  </defs>
                </svg>
                <span className="absolute font-mono text-sm font-extrabold text-cyan-400">{overallPercentage}%</span>
              </div>
              <div className="flex flex-col">
                <span className="font-mono text-[9px] text-slate-500 uppercase tracking-wider">Fit Indicator</span>
                <span className="font-sans text-xs font-semibold text-slate-200 uppercase mt-0.5">
                  {overallPercentage >= 80 ? 'EXCEPTIONAL FIT' : overallPercentage >= 65 ? 'STRONG POTENTIAL' : 'DEVELOPMENT REQUIRED'}
                </span>
              </div>
            </div>
          </div>

          {/* Selector Tabs */}
          <div className="flex border-t border-slate-900 font-mono text-xs select-none">
            <button 
              onClick={() => setActiveTab('dossier')}
              className={`flex-1 py-3 text-center border-r border-slate-900 transition-colors cursor-pointer
                ${activeTab === 'dossier' ? 'bg-purple-950/20 text-purple-400 border-b border-b-purple-500' : 'text-slate-500 hover:text-slate-300'}
              `}
            >
              [ ASSESSMENTS DOSSIER ]
            </button>
            <button 
              onClick={() => setActiveTab('transcript')}
              className={`flex-1 py-3 text-center transition-colors cursor-pointer
                ${activeTab === 'transcript' ? 'bg-cyan-950/20 text-cyan-400 border-b border-b-cyan-500' : 'text-slate-500 hover:text-slate-300'}
              `}
            >
              [ INTERVIEW LOG TRANSCRIPT ]
            </button>
          </div>
        </HudPanel>
      </div>

      {/* Main Sections based on Tab */}
      <div className="max-w-7xl w-full mx-auto flex-1 relative z-10">
        {activeTab === 'dossier' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            
            {/* Left Deck (Score Cards, Radar, Strengths - 7 Columns) */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              
              {/* Dimensions scores */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {[
                  { label: 'Technical', val: report.technical_score },
                  { label: 'Problem Solve', val: report.problem_solving_score },
                  { label: 'Communication', val: report.communication_score },
                  { label: 'Role Ready', val: report.role_readiness_score },
                  { label: 'Company Ready', val: report.company_readiness_score }
                ].map(item => (
                  <div key={item.label} className="border border-slate-900 bg-slate-950/30 p-2.5 rounded text-center flex flex-col justify-center">
                    <span className="font-mono text-[8px] text-slate-500 uppercase block leading-tight">{item.label}</span>
                    <span className="font-mono text-sm font-bold text-cyan-400 mt-1">{item.val}%</span>
                  </div>
                ))}
              </div>

              {/* Competencies Heatmap (Radar SVG) */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center border border-slate-900 bg-slate-950/20 p-4 rounded-lg">
                <div className="md:col-span-5 flex justify-center">
                  <CompetencyMap 
                    role={session.role} 
                    scores={report.competency_scores || {}} 
                    mode="radar" 
                  />
                </div>
                <div className="md:col-span-7 flex flex-col gap-3 font-sans text-xs">
                  <h3 className="font-mono text-[10px] text-purple-400 uppercase tracking-widest mb-1 select-none">[COMPETENCY GRID CALCULATION]</h3>
                  
                  <div className="flex flex-col gap-2 overflow-y-auto max-h-56 pr-1 select-text">
                    {Object.keys(report.scores_reasoning || {}).map(key => (
                      <div key={key} className="flex flex-col">
                        <span className="font-mono text-[9px] text-slate-500 uppercase font-semibold">{key.replace('_', ' ')}</span>
                        <p className="text-slate-350 leading-relaxed text-[11px] mt-0.5">{report.scores_reasoning[key]}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Strengths & Weaknesses */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Strengths (Cyan) */}
                <HudPanel title="Top 5 Demonstrated Strengths" variant="cyan">
                  <ul className="list-none font-mono text-[10px] text-slate-350 flex flex-col gap-2.5">
                    {(report.strengths || []).slice(0, 5).map((str, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-cyan-400 font-bold select-none">{i+1}.</span>
                        <span className="select-text">{str}</span>
                      </li>
                    ))}
                  </ul>
                </HudPanel>

                {/* Weaknesses (Violet) */}
                <HudPanel title="Top 5 Demonstrated Gaps" variant="violet">
                  <ul className="list-none font-mono text-[10px] text-slate-350 flex flex-col gap-2.5">
                    {(report.weaknesses || []).slice(0, 5).map((wk, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-purple-400 font-bold select-none">{i+1}.</span>
                        <span className="select-text">{wk}</span>
                      </li>
                    ))}
                  </ul>
                </HudPanel>

              </div>
              
            </div>

            {/* Right Deck (Claims Comparison, Failure Points, Roadmap - 5 Columns) */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              
              {/* Critical Failure Points alert (NVIDIA/Google style warning) */}
              {report.failure_points && report.failure_points.length > 0 && (
                <div className="border border-red-500/30 bg-red-950/10 p-4 rounded-lg flex flex-col gap-2 select-none">
                  <div className="flex items-center gap-2 text-rose-500 font-mono text-[10px] uppercase font-bold tracking-widest">
                    <svg viewBox="0 0 24 24" className="w-4.5 h-4.5 fill-none stroke-current">
                      <path d="M12 9v4m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    <span>CRITICAL FAIL BOUNDARIES DETECTED</span>
                  </div>
                  <ul className="list-disc pl-4 font-mono text-[10px] text-rose-300 flex flex-col gap-1.5 select-text">
                    {report.failure_points.map((fp, i) => (
                      <li key={i}>{fp}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Claim vs Demonstrated skill mapping */}
              <HudPanel title="Claim vs Demonstrated Skill Mapping" variant="default" className="flex-1">
                <div className="flex-1 flex flex-col gap-3 font-mono text-[10px]">
                  <div className="grid grid-cols-12 border-b border-slate-900 pb-1.5 text-slate-500 font-semibold uppercase tracking-wider select-none">
                    <span className="col-span-4">Claimed Node</span>
                    <span className="col-span-5">Demonstrated Level</span>
                    <span className="col-span-3 text-right">Alignment</span>
                  </div>
                  <div className="flex flex-col gap-3 overflow-y-auto max-h-52 pr-1 select-text">
                    {(report.claim_vs_demonstrated || []).map((cvd, idx) => (
                      <div key={idx} className="grid grid-cols-12 items-start py-0.5 border-b border-slate-950">
                        <span className="col-span-4 text-slate-200 font-medium truncate pr-1">{cvd.claim}</span>
                        <span className="col-span-5 text-slate-400 leading-tight text-[9px]">{cvd.demonstrated}</span>
                        <span className={`col-span-3 text-right select-none font-semibold uppercase
                          ${cvd.match_status === 'match' ? 'text-emerald-400' : cvd.match_status === 'mismatch' ? 'text-rose-400' : 'text-slate-600'}
                        `}>
                          [{cvd.match_status}]
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </HudPanel>

              {/* Suggested Roadmap */}
              <HudPanel title="Targeted Learning Roadmap" variant="violet" className="flex-1">
                <div className="flex-1 flex flex-col gap-4 font-sans text-xs">
                  <div className="flex flex-col gap-3 overflow-y-auto max-h-56 pr-1 select-text">
                    {(report.learning_recommendations || []).map((rec, i) => (
                      <div key={i} className="flex gap-3 items-start">
                        <div className="flex flex-col items-center">
                          <span className="w-5 h-5 rounded-full bg-purple-950 border border-purple-500/30 font-mono text-[10px] text-purple-400 flex items-center justify-center select-none font-bold">
                            {i+1}
                          </span>
                          {i < report.learning_recommendations.length - 1 && (
                            <div className="w-[1px] h-10 bg-slate-900" />
                          )}
                        </div>
                        <div className="flex-1 pt-0.5">
                          <p className="text-slate-300 leading-relaxed">{rec}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </HudPanel>

            </div>

          </div>
        ) : (
          // Transcript Log Tab
          <div className="flex flex-col gap-6">
            <HudPanel title="Assessment session transcripts" variant="cyan" className="p-0">
              <div className="flex flex-col divide-y divide-slate-900 select-text font-mono text-xs">
                {history.map((h, i) => (
                  <div key={h.id} className="p-4 flex flex-col gap-3.5 bg-slate-950/10">
                    {/* Header tag */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-950 pb-2 select-none">
                      <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">
                        Question {h.question_number} // Competency: {h.competency} (Level {h.difficulty_level}/5)
                      </span>
                      <div className="flex gap-4 text-[9px] text-slate-500">
                        <span>Origin: {h.origin.replace('_', ' ')}</span>
                        {h.evaluation && (
                          <span className="text-emerald-400 font-bold">
                            Score: {h.evaluation.score}/10
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Question text */}
                    <div className="flex flex-col gap-1.5">
                      <span className="text-slate-500 uppercase text-[9px] tracking-wider select-none">[AI QUESTION]</span>
                      <p className="text-slate-200 leading-relaxed">{h.question_text}</p>
                    </div>

                    {/* Candidate Answer */}
                    <div className="flex flex-col gap-1.5 border-l-2 border-cyan-500/20 pl-3">
                      <span className="text-slate-500 uppercase text-[9px] tracking-wider select-none">[CANDIDATE RESPONSE]</span>
                      <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{h.answer_text || '[Skipped]'}</p>
                      
                      {h.communication_analysis && (
                        <div className="flex flex-wrap gap-4 text-[9px] text-slate-500 mt-1 select-none">
                          <span>Pacing: <span className="text-slate-400 font-bold">{h.communication_analysis.words_per_minute} WPM</span></span>
                          <span>Filler Words: <span className="text-slate-400 font-bold">{h.communication_analysis.total_fillers}</span></span>
                          <span>Clarity Coherence: <span className="text-slate-400 font-bold">{h.communication_analysis.clarity.toUpperCase()}</span></span>
                        </div>
                      )}
                    </div>

                    {/* AI Evaluation / Critique */}
                    {h.evaluation && (
                      <div className="border-l-2 border-purple-500/20 pl-3 bg-purple-950/5 p-2 rounded">
                        <span className="text-purple-400 uppercase text-[9px] tracking-wider select-none">[AI CORE CRITIQUE]</span>
                        <p className="text-slate-400 leading-relaxed text-[11px] mt-1">{h.evaluation.critique}</p>
                        
                        {h.evaluation.mismatch?.has_mismatch && (
                          <div className="text-[9px] text-rose-400 mt-2 font-bold uppercase select-none border border-rose-500/20 bg-rose-950/20 px-2 py-0.5 rounded w-fit">
                            [WARNING] Resume mismatch: {h.evaluation.mismatch.claimed_skill}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </HudPanel>
          </div>
        )}
      </div>

    </main>
  );
}
