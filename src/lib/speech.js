/**
 * Browser speech utilities (client-only). Safe to import from 'use client' components.
 */

export const SPEECH_ERROR_MESSAGES = {
  unsupported:
    'Speech recognition is not supported in this browser. Use typing mode in the text box below.',
  'not-secure':
    'Speech recognition requires HTTPS or localhost. Use typing mode below.',
  'no-speech':
    'No speech detected. Speak clearly or type your answer in the box below.',
  aborted: 'Recording stopped.',
  'audio-capture':
    'No microphone found or capture failed. Use typing mode below.',
  network:
    'Speech service network error. Check your connection or use typing mode below.',
  'not-allowed':
    'Microphone permission denied. Allow mic access in browser settings or use typing mode below.',
  'service-not-allowed':
    'Speech recognition blocked by browser policy. Use typing mode below.',
  'bad-grammar': 'Speech grammar error. Use typing mode below.',
  'language-not-supported':
    'Language not supported for speech recognition. Use typing mode below.',
  unknown:
    'Speech recognition failed. Use typing mode in the text box below.',
};

export function getSpeechRecognitionClass() {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

export function getBrowserSpeechSupport() {
  if (typeof window === 'undefined') {
    return {
      tts: false,
      stt: false,
      browser: 'server',
      secureContext: false,
      sttEngine: null,
      recommendation: 'Use Chrome or Edge on desktop for voice input.',
    };
  }

  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const isFirefox = /Firefox/i.test(ua);
  const isSafari = /Safari/i.test(ua) && !/Chrome/i.test(ua);
  const sttClass = getSpeechRecognitionClass();

  let recommendation = 'Voice input ready.';
  if (isFirefox) {
    recommendation =
      'Firefox does not support Web Speech recognition. Use Chrome or Edge, or type your answers.';
  } else if (isSafari) {
    recommendation =
      'Safari has limited speech recognition. Chrome or Edge recommended, or use typing mode.';
  } else if (!sttClass) {
    recommendation = 'Use Chrome or Edge for voice input, or type your answers below.';
  } else if (!window.isSecureContext) {
    recommendation = 'Open the app on https:// or localhost for microphone access.';
  }

  return {
    tts: 'speechSynthesis' in window,
    stt: Boolean(sttClass),
    browser: isFirefox ? 'firefox' : isSafari ? 'safari' : 'chromium',
    secureContext: window.isSecureContext,
    sttEngine: sttClass
      ? window.webkitSpeechRecognition
        ? 'webkit'
        : 'standard'
      : null,
    recommendation,
  };
}

export function formatSpeechRecognitionError(errorCode = 'unknown') {
  const code = errorCode || 'unknown';
  return {
    code,
    message:
      SPEECH_ERROR_MESSAGES[code] ||
      `Speech recognition error (${code}). Use typing mode in the text box below.`,
  };
}

export async function requestMicrophonePermission() {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    return {
      granted: false,
      error: 'unsupported',
      message: SPEECH_ERROR_MESSAGES.unsupported,
    };
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((track) => track.stop());
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('sakshat_mic_granted', 'true');
    }
    return {
      granted: true,
      error: null,
      message: 'Microphone access granted.',
    };
  } catch (err) {
    const name = err?.name || 'unknown';
    let code = 'unknown';
    if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
      code = 'not-allowed';
    } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
      code = 'audio-capture';
    }
    const { message } = formatSpeechRecognitionError(code);
    return { granted: false, error: code, message };
  }
}

export function wasMicrophoneGrantedInSession() {
  if (typeof sessionStorage === 'undefined') return false;
  return sessionStorage.getItem('sakshat_mic_granted') === 'true';
}
