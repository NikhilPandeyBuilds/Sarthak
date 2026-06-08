'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import HudPanel from '@/components/HudPanel';
import AiStatusBadge from '@/components/AiStatusBadge';

export default function UploadConfig() {
  const router = useRouter();
  
  // State variables
  const [company, setCompany] = useState('Google');
  const [role, setRole] = useState('AI/ML Engineer');
  const [experienceLevel, setExperienceLevel] = useState('Fresher');
  const [file, setFile] = useState(null);
  const [resumeText, setResumeText] = useState('');
  const [uploadMode, setUploadMode] = useState('file'); // 'file' | 'text'
  
  const [isParsing, setIsParsing] = useState(false);
  const [parseLogs, setParseLogs] = useState([]);
  const [parsedResume, setParsedResume] = useState(null);
  const [resumeId, setResumeId] = useState(null);

  // File Handlers
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  // Convert File to Base64
  const fileToBase64 = (fileObj) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(fileObj);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  // Submit to Resume Analyzer API
  const handleParse = async () => {
    setIsParsing(true);
    setParseLogs(["[SYS] INGESTING FILE PATH...", "[SYS] INITIALIZING MULTIMODAL RESUME SCAN..."]);
    
    try {
      let payload = {};
      if (uploadMode === 'file' && file) {
        setParseLogs(prev => [...prev, `[SYS] CONVERTING "${file.name}" TO DATA STREAM...`]);
        const base64 = await fileToBase64(file);
        payload = {
          fileBase64: base64,
          fileName: file.name
        };
      } else {
        if (!resumeText.trim()) {
          alert('Please enter resume text.');
          setIsParsing(false);
          return;
        }
        setParseLogs(prev => [...prev, "[SYS] INGESTING TEXT RAW CLIPBOARD..."]);
        payload = {
          resumeText: resumeText
        };
      }

      setParseLogs(prev => [...prev, "[SYS] SENDING DOCUMENT TO GEMINI_INTELLIGENCE_ENGINE..."]);
      
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('API parse failed');
      }

      const resData = await response.json();
      setParseLogs(prev => [
        ...prev, 
        "[SUCCESS] PARSING SCHEMATICS COMPLETE.",
        `[SUCCESS] DETECTED DOMAIN: ${resData.analysis.domain_specialization}`,
        `[SUCCESS] IDENTIFIED SKILLS: ${resData.analysis.skills.slice(0, 5).join(', ')}...`
      ]);

      setParsedResume(resData.analysis);
      setResumeId(resData.resumeId);
    } catch (err) {
      console.error(err);
      setParseLogs(prev => [...prev, "[ERROR] PARSING PIPELINE INTERRUPTED. SYSTEM FAIL."]);
      alert('Parsing failed. Make sure your API Key is configured or retry.');
    } finally {
      setIsParsing(false);
    }
  };

  // Start interview session
  const handleStartInterview = async () => {
    if (!resumeId) return;
    setIsParsing(true);
    setParseLogs(prev => [...prev, `[SYS] SYNCING CORE WITH TARGET: ${company}...`]);

    try {
      const response = await fetch('/api/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeId,
          company,
          role,
          experienceLevel
        })
      });

      if (!response.ok) {
        throw new Error('Failed to start interview');
      }

      const startData = await response.json();
      // Route candidate to prep page first
      router.push(`/prep?sessionId=${startData.sessionId}`);
    } catch (err) {
      console.error(err);
      alert('Failed to boot interview session. Please try again.');
      setIsParsing(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#030712] flex flex-col p-4 sm:p-6 md:p-8 cyber-grid-bg">
      <header className="flex flex-wrap justify-between items-center gap-3 max-w-6xl w-full mx-auto border-b border-slate-900 pb-4 mb-8 select-none font-mono text-[10px] tracking-widest text-slate-500">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
          <span>SAKSHAT // PROFILE_CALIBRATION</span>
        </div>
        <div className="flex items-center gap-3">
          <AiStatusBadge />
          <button onClick={() => router.push('/')} className="hover:text-cyan-400 font-mono transition-colors">
            [ EXIT_PORTAL ]
          </button>
        </div>
      </header>

      <div className="max-w-6xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10 flex-1">
        
        {/* Left Side: Document Scanning Deck (5 Columns) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <HudPanel title="Resume Scan Deck" variant={parsedResume ? 'green' : 'cyan'} scanner={isParsing} className="flex-1">
            
            {/* Toggle Modes */}
            <div className="flex gap-2 border-b border-slate-900 pb-3 mb-4 select-none">
              <button 
                type="button"
                onClick={() => { setUploadMode('file'); setParsedResume(null); }}
                className={`px-3 py-1 font-mono text-[10px] tracking-wider rounded border transition-colors cursor-pointer
                  ${uploadMode === 'file' ? 'border-cyan-500/50 bg-cyan-950/20 text-cyan-400' : 'border-slate-800 text-slate-500 hover:text-slate-300'}
                `}
              >
                [ PDF_STREAM ]
              </button>
              <button 
                type="button"
                onClick={() => { setUploadMode('text'); setParsedResume(null); }}
                className={`px-3 py-1 font-mono text-[10px] tracking-wider rounded border transition-colors cursor-pointer
                  ${uploadMode === 'text' ? 'border-cyan-500/50 bg-cyan-950/20 text-cyan-400' : 'border-slate-800 text-slate-500 hover:text-slate-300'}
                `}
              >
                [ TEXT_PASTE ]
              </button>
            </div>

            {/* Ingestion Widget */}
            {!parsedResume ? (
              <div className="flex-1 flex flex-col justify-center gap-4">
                {uploadMode === 'file' ? (
                  <div className="border border-dashed border-slate-800 hover:border-cyan-500/50 rounded-lg p-8 text-center bg-slate-950/20 flex flex-col items-center justify-center gap-3 transition-colors relative group">
                    <svg viewBox="0 0 24 24" className="w-10 h-10 stroke-slate-600 group-hover:stroke-cyan-400 fill-none transition-colors">
                      <path d="M12 4v16m-8-8h16" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                    <div className="font-mono text-xs text-slate-400">
                      {file ? file.name : "DRAG & DROP RESUME OR CLICK"}
                    </div>
                    <div className="text-[10px] text-slate-600 uppercase font-mono">
                      pdf format only
                    </div>
                    <input 
                      type="file" 
                      accept="application/pdf"
                      onChange={handleFileChange}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </div>
                ) : (
                  <textarea 
                    placeholder="Paste your plain resume text here..."
                    value={resumeText}
                    onChange={(e) => setResumeText(e.target.value)}
                    className="w-full h-48 bg-slate-950/40 border border-slate-800 rounded p-3 font-mono text-xs text-slate-300 focus:outline-none focus:border-cyan-500/50 resize-none"
                  />
                )}

                <button 
                  type="button"
                  onClick={handleParse}
                  disabled={isParsing || (uploadMode === 'file' ? !file : !resumeText)}
                  className="cyber-btn w-full py-3 rounded text-xs font-mono select-none cursor-pointer"
                >
                  [ ANALYZE PROFILE DATA ]
                </button>
              </div>
            ) : (
              // Parsed Output Deck
              <div className="flex flex-col gap-4 font-mono text-xs flex-1">
                <div className="border border-emerald-500/20 bg-emerald-950/5 p-3 rounded flex items-center justify-between text-emerald-400">
                  <span>STATUS: SCAN COMPLETE</span>
                  <span>[OK]</span>
                </div>
                
                <div className="flex flex-col gap-1 select-text">
                  <span className="text-slate-500 uppercase text-[9px]">Domain Focus</span>
                  <span className="text-slate-200">{parsedResume.domain_specialization}</span>
                </div>

                <div className="flex flex-col gap-1 select-text">
                  <span className="text-slate-500 uppercase text-[9px]">Technical Depth</span>
                  <span className="text-slate-200">{parsedResume.technical_depth}</span>
                </div>

                <div className="flex flex-col gap-1 select-text">
                  <span className="text-slate-500 uppercase text-[9px]">Identified Core Skills</span>
                  <div className="flex flex-wrap gap-1.5 mt-1 select-none">
                    {parsedResume.skills.slice(0, 8).map(skill => (
                      <span key={skill} className="bg-slate-900 border border-slate-800 text-[10px] text-cyan-400 px-2 py-0.5 rounded">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <button 
                  type="button"
                  onClick={() => setParsedResume(null)}
                  disabled={isParsing}
                  className="border border-slate-800 hover:border-slate-700 hover:text-slate-300 py-2 rounded text-[10px] text-slate-500 mt-auto transition-colors cursor-pointer"
                >
                  [ RESET PROFILE SCAN ]
                </button>
              </div>
            )}

            {/* Diagnostic Scanner outputs */}
            {parseLogs.length > 0 && (
              <div className="border-t border-slate-900 pt-3 mt-4 h-24 overflow-y-auto text-[9px] font-mono text-cyan-400/70 select-none">
                {parseLogs.map((log, i) => (
                  <div key={i}>{log}</div>
                ))}
              </div>
            )}

          </HudPanel>
        </div>

        {/* Right Side: Setup parameters (7 Columns) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <HudPanel title="System Configuration" variant="violet" className="flex-1 justify-between">
            
            <div className="flex flex-col gap-6">
              {/* Company selection */}
              <div className="flex flex-col gap-2.5">
                <label className="font-mono text-xs uppercase tracking-wider text-slate-500 select-none">
                  [01] SELECT TARGET ENTERPRISE
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {['Google', 'OpenAI', 'NVIDIA'].map(comp => (
                    <button
                      key={comp}
                      type="button"
                      onClick={() => setCompany(comp)}
                      className={`cyber-card flex flex-col items-center justify-center p-4 rounded-lg text-center cursor-pointer select-none
                        ${company === comp ? 'active' : ''}
                      `}
                    >
                      <span className="font-mono text-xs font-semibold text-slate-200">{comp}</span>
                      <span className="text-[9px] text-slate-500 font-mono mt-1 uppercase">
                        {comp === 'Google' ? 'Fundamentals' : comp === 'OpenAI' ? 'Safety/Theory' : 'Performance'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Role selection */}
              <div className="flex flex-col gap-2.5">
                <label className="font-mono text-xs uppercase tracking-wider text-slate-500 select-none">
                  [02] SELECT SPECIALIZATION ROLE
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {['AI/ML Engineer', 'Backend Engineer'].map(r => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`cyber-card p-4 rounded-lg font-mono text-xs cursor-pointer select-none
                        ${role === r ? 'active' : ''}
                      `}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Experience selection */}
              <div className="flex flex-col gap-2.5">
                <label className="font-mono text-xs uppercase tracking-wider text-slate-500 select-none">
                  [03] EVALUATION BANDWIDTH
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {['Student', 'Fresher', 'Experienced'].map(exp => (
                    <button
                      key={exp}
                      type="button"
                      onClick={() => setExperienceLevel(exp)}
                      className={`cyber-card p-3 rounded-lg font-mono text-xs cursor-pointer select-none
                        ${experienceLevel === exp ? 'active' : ''}
                      `}
                    >
                      {exp}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Launch Block */}
            <div className="mt-8 border-t border-slate-900 pt-6">
              <button
                type="button"
                onClick={handleStartInterview}
                disabled={!resumeId || isParsing}
                className="cyber-btn cyber-btn-violet w-full py-4 rounded text-sm tracking-widest font-mono select-none cursor-pointer"
              >
                [ BOOT INTERVIEW CHAMBER CORE ]
              </button>
              {!resumeId && (
                <div className="text-center font-mono text-[9px] text-slate-600 mt-2 select-none uppercase">
                  * MUST COMPLETE RESUME SCAN ABOVE TO SYNC CORE
                </div>
              )}
            </div>

          </HudPanel>
        </div>

      </div>
    </main>
  );
}
