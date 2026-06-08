'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import HudPanel from '@/components/HudPanel';
import AiStatusBadge from '@/components/AiStatusBadge';
import {
  getBrowserSpeechSupport,
  requestMicrophonePermission,
  wasMicrophoneGrantedInSession,
} from '@/lib/speech';

export default function PrepChamber() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('sessionId');

  const [logs, setLogs] = useState([]);
  const [ttsStatus, setTtsStatus] = useState('Checking...');
  const [sttStatus, setSttStatus] = useState('Checking...');
  const [browserNote, setBrowserNote] = useState('');
  const [sessionData, setSessionData] = useState(null);
  const [isCalibrated, setIsCalibrated] = useState(false);

  const [micStatus, setMicStatus] = useState('pending'); // pending | granted | denied | unsupported
  const [micErrorCode, setMicErrorCode] = useState('');
  const [micMessage, setMicMessage] = useState('');
  const [isRequestingMic, setIsRequestingMic] = useState(false);

  const calibrationSteps = [
    '[CALIBRATION] Core established. Fetching session token...',
    '[CALIBRATION] Loading company parameters...',
    '[CALIBRATION] Injecting emphasis weights...',
    '[CALIBRATION] Initializing speech synthetics layer...',
    '[CALIBRATION] Calibrating microphone inputs...',
    '[CALIBRATION] System status: OPTIMIZED.',
  ];

  useEffect(() => {
    if (!sessionId) {
      router.push('/upload');
      return;
    }

    const fetchSession = async () => {
      try {
        const res = await fetch(`/api/report/${sessionId}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        setSessionData(data.session);
      } catch (err) {
        console.error('Failed to load session info', err);
      }
    };
    fetchSession();

    if (typeof window !== 'undefined') {
      const support = getBrowserSpeechSupport();
      setTtsStatus(support.tts ? 'READY // NATIVE' : 'UNAVAILABLE (TEXT ONLY)');
      setSttStatus(
        support.stt
          ? `READY // ${support.sttEngine?.toUpperCase() || 'WEBKIT'}`
          : 'UNAVAILABLE (TYPING FALLBACK)'
      );
      setBrowserNote(support.recommendation);

      if (!support.stt) {
        setMicStatus('unsupported');
        setMicErrorCode('unsupported');
        setMicMessage(support.recommendation);
      } else if (!support.secureContext) {
        setMicStatus('unsupported');
        setMicErrorCode('not-secure');
        setMicMessage(support.recommendation);
      } else if (wasMicrophoneGrantedInSession()) {
        setMicStatus('granted');
        setMicMessage('Microphone access previously granted this session.');
      }
    }

    let idx = 0;
    const interval = setInterval(() => {
      if (idx < calibrationSteps.length) {
        setLogs((prev) => [...prev, calibrationSteps[idx]]);
        idx++;
      } else {
        setIsCalibrated(true);
        clearInterval(interval);
      }
    }, 600);

    return () => clearInterval(interval);
  }, [sessionId, router]);

  const handleRequestMicrophone = async () => {
    setIsRequestingMic(true);
    setMicErrorCode('');
    setMicMessage('');

    const support = getBrowserSpeechSupport();
    if (!support.stt) {
      setMicStatus('unsupported');
      setMicErrorCode('unsupported');
      setMicMessage(support.recommendation);
      setIsRequestingMic(false);
      return;
    }

    if (!support.secureContext) {
      setMicStatus('unsupported');
      setMicErrorCode('not-secure');
      setMicMessage(support.recommendation);
      setIsRequestingMic(false);
      return;
    }

    const result = await requestMicrophonePermission();
    if (result.granted) {
      setMicStatus('granted');
      setMicErrorCode('');
      setMicMessage(result.message);
      setLogs((prev) => [...prev, '[CALIBRATION] Microphone permission: GRANTED']);
    } else {
      setMicStatus('denied');
      setMicErrorCode(result.error || 'not-allowed');
      setMicMessage(result.message);
      setLogs((prev) => [
        ...prev,
        `[CALIBRATION] Microphone permission: DENIED (code: ${result.error || 'unknown'})`,
      ]);
    }
    setIsRequestingMic(false);
  };

  const handleEnterChamber = () => {
    if (!sessionId) return;

    if (typeof window !== 'undefined') {
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.6);
        gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.6);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.6);
      } catch (err) {
        console.warn('Audio synthesis failed or was blocked by browser permissions.', err);
      }
    }

    router.push(`/interview/${sessionId}`);
  };

  const canEnter =
    isCalibrated &&
    (micStatus === 'granted' || micStatus === 'unsupported' || micStatus === 'denied');

  return (
    <main className="min-h-screen bg-[#030712] flex flex-col justify-center items-center p-4 sm:p-6 md:p-8 cyber-grid-bg">
      <div className="max-w-xl w-full relative z-10 flex flex-col gap-3">
        <div className="flex justify-end">
          <AiStatusBadge />
        </div>

        <HudPanel title="System Calibration Chamber" variant="cyan" className="gap-5">
          <div className="text-center py-2 select-none border-b border-slate-900">
            <h2 className="font-mono text-xs text-slate-500 uppercase tracking-widest">
              Calibration Target
            </h2>
            <h1 className="text-xl font-bold text-slate-200 mt-1 select-text">
              {sessionData ? `${sessionData.company} // ${sessionData.role}` : 'LOADING MODULE...'}
            </h1>
            <p className="text-[10px] text-cyan-400 font-mono mt-1 select-text">
              BAND: {sessionData ? sessionData.experience_level.toUpperCase() : 'PENDING'}
            </p>
          </div>

          {sessionData && (
            <div className="border border-slate-800 bg-slate-950/40 p-3.5 rounded font-sans text-xs text-slate-400 select-none">
              <span className="font-mono text-cyan-400 text-[10px] block mb-1">
                [COMPANY EMULATOR BIAS: {sessionData.company.toUpperCase()}]
              </span>
              {sessionData.company === 'Google' &&
                'Google interview logic is active. Evaluation is biased towards computational complexity boundaries, system trade-offs, and algorithmic verification rules.'}
              {sessionData.company === 'OpenAI' &&
                'OpenAI interview logic is active. Evaluation is biased towards systems alignment, large scale AI safety issues, pre-training limits, and theoretical bounds.'}
              {sessionData.company === 'NVIDIA' &&
                'NVIDIA interview logic is active. Evaluation is biased towards GPU architecture properties, kernel optimization, memory bandwidth bottlenecks, and hardware efficiency parameters.'}
            </div>
          )}

          <div className="flex flex-col gap-2 font-mono text-[10px] border border-slate-900 bg-slate-950/20 p-3 rounded select-none">
            <span className="text-slate-500 uppercase tracking-wider mb-1">
              [SPEECH INTEGRATION STATUS]
            </span>
            <div className="flex justify-between items-center border-b border-slate-900 pb-1.5 mb-1.5">
              <span>Text-To-Speech (TTS):</span>
              <span
                className={
                  ttsStatus.includes('READY') ? 'text-emerald-400 font-semibold' : 'text-amber-500'
                }
              >
                {ttsStatus}
              </span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-900 pb-1.5 mb-1.5">
              <span>Speech-To-Text (STT):</span>
              <span
                className={
                  sttStatus.includes('READY') ? 'text-emerald-400 font-semibold' : 'text-amber-500'
                }
              >
                {sttStatus}
              </span>
            </div>
            {browserNote && (
              <p className="text-[9px] text-slate-500 leading-relaxed pt-1">{browserNote}</p>
            )}
          </div>

          <div className="flex flex-col gap-2 border border-slate-800 bg-slate-950/30 p-3 rounded">
            <span className="font-mono text-[10px] text-slate-500 uppercase tracking-wider">
              [MICROPHONE PERMISSION]
            </span>
            <p className="font-sans text-[11px] text-slate-400 leading-relaxed">
              Grant microphone access before entering the chamber. If voice fails, you can always type
              answers in the interview text box.
            </p>
            <button
              type="button"
              onClick={handleRequestMicrophone}
              disabled={isRequestingMic || micStatus === 'unsupported'}
              className="cyber-btn w-full py-2.5 rounded text-[10px] font-mono tracking-wider disabled:opacity-40"
            >
              {isRequestingMic
                ? '[ REQUESTING ACCESS... ]'
                : micStatus === 'granted'
                  ? '[ MICROPHONE READY — RE-TEST ]'
                  : '[ GRANT MICROPHONE ACCESS ]'}
            </button>
            {micMessage && (
              <div
                className={`font-mono text-[9px] p-2 rounded border ${
                  micStatus === 'granted'
                    ? 'border-emerald-500/30 bg-emerald-950/20 text-emerald-400'
                    : 'border-amber-500/30 bg-amber-950/20 text-amber-300'
                }`}
              >
                {micMessage}
                {micErrorCode && micStatus !== 'granted' && (
                  <div className="text-rose-400/90 mt-1 uppercase">
                    Error code: <span className="font-bold">{micErrorCode}</span>
                  </div>
                )}
              </div>
            )}
            {micStatus === 'unsupported' && (
              <p className="font-mono text-[9px] text-cyan-400/80">
                TYPING FALLBACK: You may enter the chamber and answer using the keyboard only.
              </p>
            )}
          </div>

          <div className="h-28 overflow-y-auto bg-slate-950/50 border border-slate-900 rounded p-2.5 font-mono text-[9px] text-cyan-400/80 flex flex-col gap-1 select-none">
            {logs.map((log, index) => (
              <div key={index} className="opacity-90">
                {log}
              </div>
            ))}
            {!isCalibrated && <div className="w-1 h-3 bg-cyan-400 animate-pulse inline-block" />}
          </div>

          {isCalibrated && micStatus === 'pending' && (
            <button
              type="button"
              onClick={() => {
                setMicStatus('denied');
                setMicErrorCode('skipped');
                setMicMessage(
                  'Microphone skipped. Use the text box in the interview chamber to type answers.'
                );
                setLogs((prev) => [
                  ...prev,
                  '[CALIBRATION] Microphone skipped — typing fallback enabled.',
                ]);
              }}
              className="w-full py-2 rounded text-[10px] font-mono border border-slate-800 text-slate-500 hover:text-cyan-400 hover:border-cyan-500/30 transition-colors"
            >
              [ SKIP MIC — TYPING ONLY ]
            </button>
          )}

          <button
            type="button"
            disabled={!canEnter}
            onClick={handleEnterChamber}
            className="cyber-btn w-full py-3.5 rounded text-xs tracking-widest font-mono select-none cursor-pointer disabled:opacity-40"
          >
            [ ENTER THE CHAMBER ]
          </button>
          {isCalibrated && micStatus === 'pending' && (
            <p className="text-center font-mono text-[9px] text-amber-400/90 uppercase">
              Grant microphone access above to use voice, or click deny and enter with typing only
            </p>
          )}
          {isCalibrated && micStatus === 'denied' && (
            <p className="text-center font-mono text-[9px] text-cyan-400/80 uppercase">
              Typing fallback active — voice disabled; answers via keyboard in chamber
            </p>
          )}
        </HudPanel>
      </div>
    </main>
  );
}
