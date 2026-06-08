'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import HudPanel from '@/components/HudPanel';
import CoreVisualizer from '@/components/CoreVisualizer';
import CompetencyMap from '@/components/CompetencyMap';
import AiStatusBadge from '@/components/AiStatusBadge';
import {
  getBrowserSpeechSupport,
  getSpeechRecognitionClass,
  formatSpeechRecognitionError,
  requestMicrophonePermission,
} from '@/lib/speech';

export default function InterviewChamber() {
  const router = useRouter();
  const { sessionId } = useParams();

  // Core interview state
  const [session, setSession] = useState(null);
  const [question, setQuestion] = useState(null);
  const [answerText, setAnswerText] = useState('');
  const [history, setHistory] = useState([]);
  const [coreState, setCoreState] = useState('idle'); // 'idle' | 'speaking' | 'thinking'
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [questionTimer, setQuestionTimer] = useState(0);
  
  // Interface states
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [intelLogs, setIntelLogs] = useState([]);
  const [isComplete, setIsComplete] = useState(false);
  const [reportId, setReportId] = useState(null);
  const [error, setError] = useState('');

  const [speechError, setSpeechError] = useState('');
  const [speechErrorCode, setSpeechErrorCode] = useState('');
  const [speechSupport, setSpeechSupport] = useState(null);
  const [useTypingFallback, setUseTypingFallback] = useState(false);

  const recognitionRef = useRef(null);
  const isTranscribingRef = useRef(false);

  // 1. Fetch Session and initial state
  useEffect(() => {
    if (!sessionId) return;

    const initChamber = async () => {
      setCoreState('thinking');
      try {
        const res = await fetch(`/api/report/${sessionId}`);
        if (!res.ok) throw new Error('Failed to load session data');
        const data = await res.json();
        
        setSession(data.session);
        setHistory(data.history);

        // Find the latest question (answered or unanswered)
        const qHistory = data.history || [];
        if (qHistory.length > 0) {
          const latestQ = qHistory[qHistory.length - 1];
          // If the latest question already has an answer, then we finished it.
          if (latestQ.answer_text && data.session.status === 'completed') {
            setIsComplete(true);
            setCoreState('idle');
          } else {
            setQuestion(latestQ);
            setCoreState('idle');
            // Add initial log
            if (latestQ.adaptation_log) {
              setIntelLogs([latestQ.adaptation_log]);
            }
          }
        }
      } catch (err) {
        console.error(err);
        setError('Failed to sync chamber state. Please retry.');
        setCoreState('idle');
      }
    };

    initChamber();
  }, [sessionId]);

  // 2. Global Interview Timer
  useEffect(() => {
    if (isComplete) return;
    const interval = setInterval(() => {
      setTimerSeconds(prev => prev + 1);
      setQuestionTimer(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isComplete]);

  // 3. Speech Synthesis (TTS) - Read question when it updates
  useEffect(() => {
    if (!question || isComplete) return;
    
    // Auto-read question aloud
    speakText(question.question_text);

    // Push new log to Intelligence Console
    if (question.adaptation_log) {
      setIntelLogs(prev => [...prev, question.adaptation_log]);
    }
  }, [question, isComplete]);

  // Speech synthesis utility
  const speakText = (text) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 0.9; // Deep, calm voice
      utterance.onstart = () => setCoreState('speaking');
      utterance.onend = () => setCoreState('idle');
      utterance.onerror = () => setCoreState('idle');
      
      // Select premium english voice if available
      const voices = window.speechSynthesis.getVoices();
      const idealVoice = voices.find(v => v.name.includes('Google US English') || v.name.includes('Natural') || v.lang === 'en-US');
      if (idealVoice) {
        utterance.voice = idealVoice;
      }

      window.speechSynthesis.speak(utterance);
    }
  };

  // 4. Speech Recognition (STT) — browser support + persistent instance
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const support = getBrowserSpeechSupport();
    setSpeechSupport(support);

    if (!support.stt) {
      setUseTypingFallback(true);
      const { code, message } = formatSpeechRecognitionError('unsupported');
      setSpeechErrorCode(code);
      setSpeechError(message);
      return;
    }

    if (!support.secureContext) {
      setUseTypingFallback(true);
      const { code, message } = formatSpeechRecognitionError('not-secure');
      setSpeechErrorCode(code);
      setSpeechError(message);
      return;
    }

    const SpeechRec = getSpeechRecognitionClass();
    if (!SpeechRec) return;

    const rec = new SpeechRec();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';

    rec.onstart = () => {
      isTranscribingRef.current = true;
      setIsTranscribing(true);
      setSpeechError('');
      setSpeechErrorCode('');
      window.speechSynthesis.cancel();
      setCoreState('idle');
    };

    rec.onresult = (event) => {
      let finalTrans = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTrans += event.results[i][0].transcript + ' ';
        }
      }
      if (finalTrans) {
        setAnswerText((prev) => prev + finalTrans);
      }
    };

    rec.onerror = (e) => {
      const code = e.error || 'unknown';
      const { message } = formatSpeechRecognitionError(code);
      console.error('Speech recognition error', code, e);
      setSpeechErrorCode(code);
      setSpeechError(message);
      setUseTypingFallback(true);
      isTranscribingRef.current = false;
      setIsTranscribing(false);
    };

    rec.onend = () => {
      isTranscribingRef.current = false;
      setIsTranscribing(false);
    };

    recognitionRef.current = rec;

    return () => {
      try {
        rec.abort();
      } catch {
        /* ignore */
      }
      recognitionRef.current = null;
    };
  }, []);

  const toggleSpeechRecognition = async () => {
    if (typeof window === 'undefined') return;

    if (useTypingFallback && !speechSupport?.stt) {
      return;
    }

    if (isTranscribing) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          /* ignore */
        }
      }
      isTranscribingRef.current = false;
      setIsTranscribing(false);
      return;
    }

    const support = speechSupport || getBrowserSpeechSupport();
    if (!support.stt) {
      const { code, message } = formatSpeechRecognitionError('unsupported');
      setSpeechErrorCode(code);
      setSpeechError(message);
      setUseTypingFallback(true);
      return;
    }

    if (!support.secureContext) {
      const { code, message } = formatSpeechRecognitionError('not-secure');
      setSpeechErrorCode(code);
      setSpeechError(message);
      setUseTypingFallback(true);
      return;
    }

    const mic = await requestMicrophonePermission();
    if (!mic.granted) {
      setSpeechErrorCode(mic.error || 'not-allowed');
      setSpeechError(mic.message);
      setUseTypingFallback(true);
      return;
    }

    const rec = recognitionRef.current;
    if (!rec) {
      const { code, message } = formatSpeechRecognitionError('unsupported');
      setSpeechErrorCode(code);
      setSpeechError(message);
      setUseTypingFallback(true);
      return;
    }

    try {
      setSpeechError('');
      setSpeechErrorCode('');
      setUseTypingFallback(false);
      rec.start();
    } catch (err) {
      const code = err?.message?.includes('already') ? 'aborted' : 'unknown';
      const { message } = formatSpeechRecognitionError(code);
      setSpeechErrorCode(code);
      setSpeechError(message);
      setUseTypingFallback(true);
      console.error('Speech recognition start failed', err);
    }
  };

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined') {
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          /* ignore */
        }
      }
    };
  }, []);

  // 5. Transmit response to Evaluation Engine
  const handleTransmit = async (skipped = false) => {
    if (isTransmitting) return;
    
    // Stop recording first
    if (isTranscribing && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsTranscribing(false);
    }

    setIsTransmitting(true);
    setCoreState('thinking');
    setIntelLogs(prev => [...prev, "[SYS.EVAL] INGESTING RESPONSE... RUNNING HEURISTICS MAPPING."]);

    const finalAnswer = skipped ? 'Candidate skipped the question.' : answerText;

    try {
      const response = await fetch('/api/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          questionId: question.id,
          answerText: finalAnswer,
          durationSeconds: questionTimer
        })
      });

      if (!response.ok) {
        throw new Error('Evaluation request failed');
      }

      const resData = await response.json();

      if (resData.evaluation) {
        const ev = resData.evaluation;
        const kw =
          ev.keyword_matches?.length > 0
            ? ` Keywords matched: ${ev.keyword_matches.slice(0, 4).join(', ')}.`
            : '';
        setIntelLogs((prev) => [
          ...prev,
          `[SYS.EVAL] Score: ${ev.score}/10.${kw} ${ev.is_refusal ? 'Non-answer detected.' : ''}`,
          ev.critique ? `[SYS.CRITIQUE] ${ev.critique}` : '',
        ].filter(Boolean));
      }

      if (resData.isComplete) {
        setIntelLogs(prev => [...prev, "[SYS.REPORT] INTERVIEW SEQUENCE CONCLUDED. GENERATING DOSSIER..."]);
        setReportId(resData.reportId);
        setIsComplete(true);
        setCoreState('idle');
      } else {
        // Sync history and set next question
        setQuestion(resData.question);
        
        // Refresh full history
        const refetchRes = await fetch(`/api/report/${sessionId}`);
        const refetchData = await refetchRes.json();
        setHistory(refetchData.history);
        setSession(refetchData.session);

        // Reset variables
        setAnswerText('');
        setQuestionTimer(0);
        setCoreState('idle');
      }
    } catch (err) {
      console.error(err);
      setError('Transmission failed. Check internet link and try again.');
      setCoreState('idle');
    } finally {
      setIsTransmitting(false);
    }
  };

  // Helper to format session stopwatch time
  const formatTime = (totalSecs) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (error) {
    return (
      <main className="min-h-screen bg-[#030712] flex items-center justify-center p-4">
        <HudPanel title="System Interrupt" variant="default" className="max-w-md w-full">
          <div className="text-center font-mono text-xs text-rose-400 p-4">
            {error}
          </div>
          <button onClick={() => router.push('/upload')} className="cyber-btn py-2 text-xs font-mono mt-4">
            [ RETURN TO COMMAND ]
          </button>
        </HudPanel>
      </main>
    );
  }

  if (!session || !question) {
    return (
      <main className="min-h-screen bg-[#030712] flex items-center justify-center p-4">
        <div className="font-mono text-xs text-cyan-400 animate-pulse uppercase select-none">
          Initializing Chamber Systems...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#030712] flex flex-col p-4 sm:p-6 md:p-8 cyber-grid-bg">
      
      {/* Top Bar HUD */}
      <header className="flex justify-between items-center max-w-7xl w-full mx-auto border-b border-slate-900 pb-3 mb-6 select-none font-mono text-[10px] tracking-widest text-slate-500">
        <div className="flex items-center gap-3">
          <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping" />
          <span>SAKSHAT // LIVE_EVALUATION</span>
        </div>
        <div className="flex flex-wrap gap-3 items-center justify-end">
          <AiStatusBadge />
          <span className="text-slate-400 border border-slate-800 bg-slate-950/40 px-2.5 py-0.5 rounded">
            {session.company.toUpperCase()} // {session.role.toUpperCase()}
          </span>
          <span className="text-cyan-400 bg-cyan-950/20 border border-cyan-500/20 px-2 py-0.5 rounded">
            ELAPSED: {formatTime(timerSeconds)}
          </span>
        </div>
      </header>

      <div className="max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10 flex-1 items-stretch">
        
        {/* Left Column: Interactive Logs & Adaptations (8 Columns) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* AI core visualizer (Left panel of grid) */}
            <div className="md:col-span-5 flex flex-col justify-center">
              <CoreVisualizer state={coreState} />
            </div>
            
            {/* Live Question Display Console (Right panel of grid) */}
            <div className="md:col-span-7 h-full flex flex-col justify-center">
              <HudPanel 
                title={`Question ${question.question_number} of 6`} 
                variant={coreState === 'speaking' ? 'cyan' : coreState === 'thinking' ? 'violet' : 'default'}
                className="h-full flex-1 justify-center"
              >
                <div className="flex flex-col gap-2.5 justify-center flex-1">
                  <div className="font-mono text-[9px] text-slate-500 select-none uppercase tracking-wider flex gap-4">
                    <span>Competency: <span className="text-cyan-400 font-semibold">{question.competency}</span></span>
                    <span>Origin: <span className="text-purple-400 font-semibold">{question.origin.replace('_', ' ')}</span></span>
                  </div>
                  <p className="font-mono text-sm leading-relaxed text-slate-100 select-text">
                    {question.question_text}
                  </p>
                  <button 
                    onClick={() => speakText(question.question_text)} 
                    disabled={coreState === 'thinking'}
                    className="text-[9px] font-mono text-cyan-500/50 hover:text-cyan-400 text-left w-fit select-none cursor-pointer mt-1"
                  >
                    [ REPLAY_AUDIO_VOICE ]
                  </button>
                </div>
              </HudPanel>
            </div>
          </div>

          {/* User Response deck */}
          <div className="flex-1 flex flex-col">
            <HudPanel title="Candidate Input deck" variant={isTranscribing ? 'cyan' : 'default'} className="flex-1 justify-between gap-4">

              {(speechError || useTypingFallback) && (
                <div
                  className={`font-mono text-[9px] p-2.5 rounded border select-none ${
                    useTypingFallback && !isTranscribing
                      ? 'border-cyan-500/30 bg-cyan-950/15 text-cyan-300/90'
                      : 'border-amber-500/30 bg-amber-950/20 text-amber-300'
                  }`}
                  role="alert"
                >
                  {useTypingFallback && (
                    <div className="font-semibold uppercase text-cyan-400 mb-1">
                      [ TYPING MODE ] — Type your answer in the box below
                    </div>
                  )}
                  {speechError && <p className="leading-relaxed">{speechError}</p>}
                  {speechErrorCode && (
                    <p className="text-rose-400/90 mt-1 uppercase">
                      Error code: <span className="font-bold">{speechErrorCode}</span>
                    </p>
                  )}
                </div>
              )}
              
              <div className="relative flex-1 flex flex-col">
                <textarea
                  placeholder={
                    useTypingFallback
                      ? 'Typing mode: enter your answer here. Voice input is unavailable or disabled.'
                      : 'Formulate your response here. Press the record button below to speak, or type manually...'
                  }
                  value={answerText}
                  onChange={(e) => setAnswerText(e.target.value)}
                  disabled={isTransmitting || isComplete}
                  className="w-full flex-1 min-h-[160px] bg-slate-950/40 border border-slate-800 rounded p-4 font-mono text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50 resize-none"
                />
                
                {isTranscribing && (
                  <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-cyan-950/50 border border-cyan-500/30 px-2 py-0.5 rounded text-[8px] font-mono text-cyan-400 select-none">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                    <span>AUDIOSTREAM ACTIVE</span>
                  </div>
                )}
              </div>

              {/* Controls */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 select-none">
                <button
                  type="button"
                  onClick={toggleSpeechRecognition}
                  disabled={isTransmitting || isComplete || (useTypingFallback && !speechSupport?.stt)}
                  className={`px-5 py-3 rounded text-xs font-mono tracking-wider border w-full sm:w-auto transition-colors flex items-center justify-center gap-2
                    ${useTypingFallback && !speechSupport?.stt
                      ? 'border-slate-800 text-slate-600 cursor-not-allowed opacity-60'
                      : isTranscribing
                        ? 'border-cyan-400 bg-cyan-950/20 text-cyan-400 shadow-[0_0_12px_rgba(0,240,255,0.2)] animate-pulse cursor-pointer'
                        : 'border-slate-800 text-slate-400 hover:border-cyan-500/50 hover:text-cyan-400 cursor-pointer'
                    }
                  `}
                >
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 stroke-current fill-none">
                    <rect x="9" y="4" width="6" height="11" rx="3" strokeWidth="2" />
                    <path d="M5 11c0 3.87 3.13 7 7 7s7-3.13 7-7M12 18v2.5" strokeWidth="2" />
                  </svg>
                  {useTypingFallback && !speechSupport?.stt
                    ? '[ VOICE UNAVAILABLE ]'
                    : isTranscribing
                      ? '[ MUTE RECORDING ]'
                      : '[ ACTIVATE SPEECH ]'}
                </button>

                <div className="flex gap-3 w-full sm:w-auto">
                  {!isComplete ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleTransmit(true)}
                        disabled={isTransmitting}
                        className="border border-slate-800 hover:border-rose-500/30 hover:text-rose-400 px-5 py-3 rounded text-xs font-mono text-slate-500 transition-colors cursor-pointer w-full sm:w-auto"
                      >
                        [ SKIP ]
                      </button>
                      <button
                        type="button"
                        onClick={() => handleTransmit(false)}
                        disabled={isTransmitting || !answerText.trim()}
                        className="cyber-btn px-6 py-3 rounded text-xs font-mono cursor-pointer w-full sm:w-auto"
                      >
                        {isTransmitting ? '[ EVALUATING... ]' : '[ TRANSMIT RESPONSE ]'}
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => router.push(`/report/${sessionId}`)}
                      className="cyber-btn cyber-btn-violet px-8 py-3.5 rounded text-xs font-mono cursor-pointer w-full"
                    >
                      [ OPEN INTELLIGENCE DOSSIER ]
                    </button>
                  )}
                </div>
              </div>

            </HudPanel>
          </div>

          {/* HUD Intelligence Console (Dynamic logs showing AI adaptations) */}
          <div className="h-32 select-none">
            <HudPanel title="HUD Intelligence Console" variant="violet" className="h-full p-0">
              <div className="flex-1 overflow-y-auto px-3 py-2 font-mono text-[9px] text-purple-400/80 flex flex-col gap-1.5">
                <div className="text-slate-600">[SYS.BOOT] Dynamic evaluation link established successfully.</div>
                {intelLogs.map((log, index) => (
                  <div key={index} className="opacity-95">
                    {log}
                  </div>
                ))}
                {isTransmitting && (
                  <div className="text-cyan-400 animate-pulse">[SYS.CALC] Analysing response vectors against resume parameters...</div>
                )}
                {isComplete && !reportId && (
                  <div className="text-purple-400 animate-pulse">[SYS.CALC] Compiling Dossier nodes... Generating evaluation scores.</div>
                )}
              </div>
            </HudPanel>
          </div>

        </div>

        {/* Right Column: Tracked Competencies (4 Columns) */}
        <div className="lg:col-span-4 flex flex-col">
          <HudPanel title="Competency Map Tracker" variant="cyan" className="h-full">
            <div className="flex-1 flex flex-col gap-4">
              <div className="font-sans text-[10px] text-slate-400 select-none">
                The AI adapts question topics and grading criteria to probe the following nodes. Completed nodes show latest scores.
              </div>
              <div className="flex-1 overflow-y-auto pr-1">
                <CompetencyMap 
                  role={session.role} 
                  activeCompetency={isComplete ? '' : question.competency} 
                  scores={session.competency_scores || {}} 
                  mode="sidebar" 
                />
              </div>
            </div>
          </HudPanel>
        </div>

      </div>
    </main>
  );
}
