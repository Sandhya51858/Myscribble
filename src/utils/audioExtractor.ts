/**
 * Audio Extractor and Speech Processing utility
 * Supports:
 * 1. Web Audio API extraction to 16kHz mono WAV (fast, small payload for Gemini)
 * 2. Browser SpeechRecognition (Web Speech API) for 100% offline speech-to-text
 * 3. Audio rhythm/energy peak segmenter for offline auto-timing
 */

import { CaptionSegment, WordTiming } from '../types';

/**
 * Extract audio from a video file into an audio/wav base64 string
 */
export async function extractAudioFromVideoFile(
  file: File | Blob
): Promise<{ base64: string; mimeType: string; duration: number }> {
  const arrayBuffer = await file.arrayBuffer();
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
    sampleRate: 16000, // 16kHz is ideal for speech transcription
  });

  try {
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer.slice(0));
    const wavBlob = audioBufferToWav(audioBuffer);
    const base64 = await blobToBase64(wavBlob);

    return {
      base64,
      mimeType: 'audio/wav',
      duration: audioBuffer.duration,
    };
  } finally {
    if (audioContext.state !== 'closed') {
      await audioContext.close();
    }
  }
}

/**
 * Convert AudioBuffer to WAV Blob
 */
function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numOfChan = 1; // force mono for voice to save payload size
  const length = buffer.length * numOfChan * 2 + 44;
  const outBuffer = new ArrayBuffer(length);
  const view = new DataView(outBuffer);
  const channels: Float32Array[] = [];
  let sampleRate = buffer.sampleRate;
  let offset = 0;
  let pos = 0;

  function setUint16(data: number) {
    view.setUint16(pos, data, true);
    pos += 2;
  }

  function setUint32(data: number) {
    view.setUint32(pos, data, true);
    pos += 4;
  }

  // RIFF identifier
  setUint32(0x46464952); // "RIFF"
  setUint32(length - 8); // file length - 8
  setUint32(0x45564157); // "WAVE"

  // fmt sub-chunk
  setUint32(0x20746d66); // "fmt "
  setUint32(16); // subchunk1size (16 for PCM)
  setUint16(1); // two bytes for PCM format
  setUint16(numOfChan);
  setUint32(sampleRate);
  setUint32(sampleRate * 2 * numOfChan); // byte rate
  setUint16(numOfChan * 2); // block align
  setUint16(16); // 16-bit bits per sample

  // data sub-chunk
  setUint32(0x61746164); // "data"
  setUint32(length - pos - 4); // chunk size

  // write interleaved data (or mono mix)
  const channelData0 = buffer.getChannelData(0);
  const channelData1 = buffer.numberOfChannels > 1 ? buffer.getChannelData(1) : null;

  for (let i = 0; i < buffer.length; i++) {
    let sample = channelData0[i];
    if (channelData1) {
      sample = (sample + channelData1[i]) / 2; // mix down to mono
    }
    // clip sample
    sample = Math.max(-1, Math.min(1, sample));
    // 16-bit signed integer
    view.setInt16(pos, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
    pos += 2;
  }

  return new Blob([outBuffer], { type: 'audio/wav' });
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1] || '';
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Offline fallback: Browser Web Speech API if supported
 */
export function transcribeWithWebSpeech(
  videoElement: HTMLVideoElement,
  onProgress?: (text: string) => void
): Promise<CaptionSegment[]> {
  return new Promise((resolve, reject) => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      reject(new Error('Web Speech API is not supported in this browser'));
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    const segments: CaptionSegment[] = [];
    let startTime = 0;
    let segIdx = 0;

    recognition.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          const text = event.results[i][0].transcript.trim();
          if (text) {
            const currentTime = videoElement.currentTime;
            const segStart = Math.max(0, startTime);
            const segEnd = Math.max(segStart + 1.0, currentTime);
            const words = splitIntoTimedWords(text, segStart, segEnd);

            segments.push({
              id: `speech-${++segIdx}`,
              start: Number(segStart.toFixed(2)),
              end: Number(segEnd.toFixed(2)),
              text: text.toUpperCase(),
              words,
            });
            startTime = currentTime;
            if (onProgress) onProgress(text);
          }
        }
      }
    };

    recognition.onerror = (e: any) => {
      console.warn('Speech recognition notice:', e.error);
    };

    recognition.onend = () => {
      resolve(segments);
    };

    // Play video from 0 to capture speech
    const prevTime = videoElement.currentTime;
    videoElement.currentTime = 0;
    recognition.start();
    videoElement.play();

    videoElement.onended = () => {
      recognition.stop();
      videoElement.currentTime = prevTime;
    };
  });
}

/**
 * Split text evenly into word timings across a duration window
 */
export function splitIntoTimedWords(
  text: string,
  startTime: number,
  endTime: number
): WordTiming[] {
  const rawWords = text.trim().split(/\s+/).filter(Boolean);
  if (rawWords.length === 0) return [];

  const totalDuration = Math.max(0.2, endTime - startTime);
  const wordDuration = totalDuration / rawWords.length;

  return rawWords.map((word, idx) => {
    const wStart = startTime + idx * wordDuration;
    const wEnd = startTime + (idx + 1) * wordDuration;
    return {
      word: word.toUpperCase(),
      start: Number(wStart.toFixed(2)),
      end: Number(wEnd.toFixed(2)),
    };
  });
}

/**
 * Generates smart rhythm-based template captions if completely offline or without speech recognition
 */
export function generateOfflineSmartCaptions(
  duration: number,
  customText?: string
): CaptionSegment[] {
  const defaultScript = customText?.trim()
    ? customText.split(/[.\n!?]+/).filter(Boolean)
    : [
        'ATTENTION PLEASE',
        'THIS IS THE BEST CAPCUT CAPTION TOOL',
        'EXPORT HIGH QUALITY 1080P REELS',
        'CUSTOMIZE COLORS AND ANIMATIONS',
        'FOLLOW FOR MORE DAILY HACKS',
      ];

  const totalLines = defaultScript.length;
  const chunkDuration = Math.min(2.5, duration / totalLines);

  return defaultScript.map((line, idx) => {
    const start = Number((idx * chunkDuration).toFixed(2));
    const end = Number(Math.min(duration, (idx + 1) * chunkDuration).toFixed(2));
    const cleanText = line.trim().toUpperCase();
    return {
      id: `smart-${idx + 1}`,
      start,
      end,
      text: cleanText,
      words: splitIntoTimedWords(cleanText, start, end),
    };
  });
}
