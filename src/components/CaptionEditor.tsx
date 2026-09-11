import React, { useState } from 'react';
import {
  Sparkles,
  Plus,
  Trash2,
  Clock,
  Split,
  Merge,
  Search,
  Check,
  ChevronRight,
  Mic,
  FileText,
  HelpCircle,
  RotateCw,
  ClipboardList,
  X,
} from 'lucide-react';
import { CaptionSegment, WordTiming } from '../types';
import { splitIntoTimedWords, generateOfflineSmartCaptions } from '../utils/audioExtractor';

interface CaptionEditorProps {
  captions: CaptionSegment[];
  currentTime: number;
  duration: number;
  onCaptionsChange: (captions: CaptionSegment[]) => void;
  onSeek: (time: number) => void;
  onTranscribeAI: (language: string, engine?: string) => void;
  isTranscribing: boolean;
  transcriptionError?: string | null;
}

export const CaptionEditor: React.FC<CaptionEditorProps> = ({
  captions,
  currentTime,
  duration,
  onCaptionsChange,
  onSeek,
  onTranscribeAI,
  isTranscribing,
  transcriptionError,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('auto');
  const [selectedEngine, setSelectedEngine] = useState('mistral');
  const [isPasteScriptOpen, setIsPasteScriptOpen] = useState(false);
  const [scriptInput, setScriptInput] = useState('');

  // Clean error message if it looks like raw JSON
  const formatErrorMessage = (msg: string) => {
    if (msg.includes('503') || msg.includes('high demand') || msg.includes('UNAVAILABLE')) {
      return 'AI transcription model is temporarily experiencing high cloud demand. Offline smart captions are active so you can continue editing seamlessly!';
    }
    try {
      if (msg.startsWith('{') && msg.endsWith('}')) {
        const parsed = JSON.parse(msg);
        return parsed?.error?.message || parsed?.message || msg;
      }
    } catch {
      // not json
    }
    return msg;
  };

  // Update text of a segment and re-compute word timings
  const handleTextChange = (id: string, newText: string) => {
    const updated = captions.map((seg) => {
      if (seg.id === id) {
        const words = splitIntoTimedWords(newText, seg.start, seg.end);
        return {
          ...seg,
          text: newText,
          words,
        };
      }
      return seg;
    });
    onCaptionsChange(updated);
  };

  // Update specific word in a segment
  const handleWordChange = (segId: string, wordIdx: number, newWord: string) => {
    const updated = captions.map((seg) => {
      if (seg.id === segId) {
        const newWords = [...seg.words];
        if (newWords[wordIdx]) {
          newWords[wordIdx] = { ...newWords[wordIdx], word: newWord };
        }
        const fullText = newWords.map((w) => w.word).join(' ');
        return {
          ...seg,
          text: fullText,
          words: newWords,
        };
      }
      return seg;
    });
    onCaptionsChange(updated);
  };

  // Adjust timing
  const handleTimingChange = (
    id: string,
    field: 'start' | 'end',
    val: number
  ) => {
    const clampedVal = Math.max(0, Math.min(duration || 600, Number(val.toFixed(2))));
    const updated = captions.map((seg) => {
      if (seg.id === id) {
        const newStart = field === 'start' ? Math.min(clampedVal, seg.end - 0.1) : seg.start;
        const newEnd = field === 'end' ? Math.max(clampedVal, seg.start + 0.1) : seg.end;
        const words = splitIntoTimedWords(seg.text, newStart, newEnd);
        return {
          ...seg,
          start: newStart,
          end: newEnd,
          words,
        };
      }
      return seg;
    });
    onCaptionsChange(updated);
  };

  // Delete segment
  const handleDeleteSegment = (id: string) => {
    onCaptionsChange(captions.filter((seg) => seg.id !== id));
  };

  // Add new segment at current video time
  const handleAddSegment = () => {
    const start = Number(currentTime.toFixed(2));
    const end = Number(Math.min(duration || start + 2, start + 2).toFixed(2));
    const newSeg: CaptionSegment = {
      id: `custom-${Date.now()}`,
      start,
      end,
      text: 'NEW VIRAL CAPTION',
      words: splitIntoTimedWords('NEW VIRAL CAPTION', start, end),
    };
    const updated = [...captions, newSeg].sort((a, b) => a.start - b.start);
    onCaptionsChange(updated);
  };

  // Split segment into two
  const handleSplitSegment = (seg: CaptionSegment) => {
    const midTime = Number(((seg.start + seg.end) / 2).toFixed(2));
    const words = seg.text.trim().split(/\s+/);
    const half = Math.ceil(words.length / 2);
    const part1 = words.slice(0, half).join(' ');
    const part2 = words.slice(half).join(' ');

    const seg1: CaptionSegment = {
      id: `${seg.id}-a`,
      start: seg.start,
      end: midTime,
      text: part1,
      words: splitIntoTimedWords(part1, seg.start, midTime),
    };
    const seg2: CaptionSegment = {
      id: `${seg.id}-b`,
      start: midTime,
      end: seg.end,
      text: part2 || '...',
      words: splitIntoTimedWords(part2 || '...', midTime, seg.end),
    };

    const updated = captions
      .flatMap((s) => (s.id === seg.id ? [seg1, seg2] : [s]))
      .sort((a, b) => a.start - b.start);

    onCaptionsChange(updated);
  };

  // Merge segment with next
  const handleMergeNext = (idx: number) => {
    if (idx >= captions.length - 1) return;
    const current = captions[idx];
    const next = captions[idx + 1];

    const mergedText = `${current.text} ${next.text}`;
    const mergedSeg: CaptionSegment = {
      id: current.id,
      start: current.start,
      end: next.end,
      text: mergedText,
      words: splitIntoTimedWords(mergedText, current.start, next.end),
    };

    const updated = captions.filter((_, i) => i !== idx && i !== idx + 1);
    updated.splice(idx, 0, mergedSeg);
    onCaptionsChange(updated);
  };

  // Search & Replace
  const handleSearchReplace = () => {
    if (!searchQuery.trim()) return;
    const regex = new RegExp(searchQuery, 'gi');
    const updated = captions.map((seg) => {
      if (seg.text.match(regex)) {
        const newText = seg.text.replace(regex, replaceQuery);
        return {
          ...seg,
          text: newText,
          words: splitIntoTimedWords(newText, seg.start, seg.end),
        };
      }
      return seg;
    });
    onCaptionsChange(updated);
  };

  // Handle manual script paste & auto-timing
  const handleApplyPastedScript = () => {
    if (!scriptInput.trim()) return;
    const smartSegs = generateOfflineSmartCaptions(duration || 15, scriptInput);
    onCaptionsChange(smartSegs);
    setIsPasteScriptOpen(false);
    setScriptInput('');
  };

  return (
    <div id="caption-editor-panel" className="flex flex-col h-full min-h-0 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl overflow-hidden backdrop-blur-md">
      {/* Header bar */}
      <div className="p-3.5 border-b border-zinc-800 flex flex-col gap-2.5 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-400">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide">Captions & Words Editor</h2>
              <p className="text-[11px] text-zinc-400">
                {captions.length} segments • Click any word to edit spelling
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              id="paste-script-toggle-btn"
              type="button"
              onClick={() => setIsPasteScriptOpen(!isPasteScriptOpen)}
              title="Paste your script to auto-generate timed captions"
              className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold flex items-center gap-1 border border-zinc-700 transition-colors"
            >
              <ClipboardList className="w-3.5 h-3.5 text-amber-400" />
              <span>Paste Script</span>
            </button>

            <button
              id="add-new-caption-btn"
              type="button"
              onClick={handleAddSegment}
              className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all border border-zinc-700 active:scale-95"
            >
              <Plus className="w-3.5 h-3.5 text-amber-400" />
              <span>Add Line</span>
            </button>
          </div>
        </div>

        {/* Paste Script Modal / Box */}
        {isPasteScriptOpen && (
          <div className="p-3 bg-zinc-950 border border-amber-400/30 rounded-xl space-y-2 animate-fade-in">
            <div className="flex justify-between items-center text-xs font-bold text-white">
              <span>Paste Your Script / Reel Dialogues:</span>
              <button
                type="button"
                onClick={() => setIsPasteScriptOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <textarea
              rows={3}
              value={scriptInput}
              onChange={(e) => setScriptInput(e.target.value)}
              placeholder="Paste dialogue here in Hindi, Hinglish, or English. E.g.
Agar aap bhi successful hona chahte ho
Then stop scrolling right now!
Focus on one high value skill daily..."
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400"
            />
            <button
              type="button"
              onClick={handleApplyPastedScript}
              disabled={!scriptInput.trim()}
              className="w-full py-1.5 bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-black font-bold text-xs rounded-lg transition-colors"
            >
              Generate Timed Captions From Script
            </button>
          </div>
        )}

        {/* AI Auto-Transcribe Box */}
        <div className="bg-gradient-to-r from-amber-500/10 via-zinc-900 to-zinc-900 p-3 rounded-xl border border-amber-500/20 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
              <div>
                <div className="text-xs font-bold text-white">AI Audio to Text (Voxtral / Gemini)</div>
                <div className="text-[10px] text-zinc-400">Supports Mistral AI Voxtral & Google Gemini</div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              {/* AI Engine Choice */}
              <select
                id="transcription-engine-select"
                value={selectedEngine}
                onChange={(e) => setSelectedEngine(e.target.value)}
                className="bg-zinc-800 text-amber-300 font-semibold text-xs px-2.5 py-1.5 rounded-lg border border-zinc-700 focus:outline-none focus:border-amber-400 cursor-pointer"
                title="Choose between Mistral AI Voxtral or Google Gemini"
              >
                <option value="mistral">⚡ Mistral AI (Voxtral)</option>
                <option value="gemini">✨ Google Gemini</option>
                <option value="auto">🤖 Auto (Best Available)</option>
              </select>

              {/* Language Choice */}
              <select
                id="transcription-lang-select"
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="bg-zinc-800 text-zinc-300 text-xs px-2.5 py-1.5 rounded-lg border border-zinc-700 focus:outline-none focus:border-amber-400 cursor-pointer"
              >
                <option value="auto">🌐 Auto Detect</option>
                <option value="hi">🇮🇳 Hindi / Hinglish</option>
                <option value="en">🇺🇸 English</option>
              </select>
            </div>

            <button
              id="ai-auto-transcribe-btn"
              type="button"
              disabled={isTranscribing}
              onClick={() => onTranscribeAI(selectedLanguage, selectedEngine)}
              className="px-3.5 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-black text-xs font-bold flex items-center gap-1.5 shadow-md transition-all active:scale-95"
            >
              {isTranscribing ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <span>Transcribing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 fill-current" />
                  <span>Auto-Transcribe</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Human-friendly Notice / Error Banner with Retry */}
        {transcriptionError && (
          <div className="text-[11px] text-amber-300 bg-amber-400/10 border border-amber-400/30 p-2.5 rounded-xl flex items-start justify-between gap-2">
            <div className="flex-1">
              <span className="font-bold mr-1">⚡ Notice:</span>
              <span>{formatErrorMessage(transcriptionError)}</span>
            </div>
            <button
              type="button"
              onClick={() => onTranscribeAI(selectedLanguage, selectedEngine)}
              disabled={isTranscribing}
              className="px-2 py-1 bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 border border-amber-400/40 rounded-lg text-[10px] font-bold shrink-0 flex items-center gap-1 transition-colors"
            >
              <RotateCw className="w-3 h-3" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Search & Replace */}
        <div className="flex items-center gap-1.5 bg-zinc-950 p-1.5 rounded-xl border border-zinc-800 text-xs">
          <Search className="w-3.5 h-3.5 text-zinc-500 ml-1.5" />
          <input
            id="search-caption-input"
            type="text"
            placeholder="Find word..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-24 bg-transparent text-zinc-200 placeholder-zinc-500 focus:outline-none text-xs"
          />
          <ChevronRight className="w-3 h-3 text-zinc-600" />
          <input
            id="replace-caption-input"
            type="text"
            placeholder="Replace with..."
            value={replaceQuery}
            onChange={(e) => setReplaceQuery(e.target.value)}
            className="flex-1 bg-transparent text-zinc-200 placeholder-zinc-500 focus:outline-none text-xs"
          />
          <button
            id="apply-replace-btn"
            type="button"
            onClick={handleSearchReplace}
            disabled={!searchQuery.trim()}
            className="px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-[11px] font-semibold text-amber-300 transition-colors"
          >
            Replace All
          </button>
        </div>
      </div>

      {/* Captions List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 custom-scrollbar min-h-0">
        {captions.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-center p-6 text-zinc-500">
            <FileText className="w-10 h-10 mb-2 stroke-[1.5] text-zinc-600" />
            <p className="text-sm font-medium text-zinc-400">No captions yet</p>
            <p className="text-xs text-zinc-500 mt-1 max-w-xs">
              Click "Auto-Transcribe" to generate captions from audio, or click "Paste Script" to paste dialogue!
            </p>
          </div>
        ) : (
          captions.map((seg, idx) => {
            const isActive = seg.start <= currentTime && currentTime <= seg.end;

            return (
              <div
                key={seg.id}
                id={`caption-card-${seg.id}`}
                onClick={() => onSeek(seg.start)}
                className={`p-3 rounded-xl border transition-all cursor-pointer ${
                  isActive
                    ? 'bg-amber-400/10 border-amber-400/60 shadow-lg ring-1 ring-amber-400/30'
                    : 'bg-zinc-950/60 hover:bg-zinc-900/80 border-zinc-800/80'
                }`}
              >
                {/* Top Row: Timestamp and Controls */}
                <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-2">
                  <div className="flex items-center gap-1.5 font-mono">
                    <Clock className="w-3 h-3 text-amber-400" />
                    <input
                      type="number"
                      step={0.1}
                      min={0}
                      max={duration || 100}
                      value={seg.start}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => handleTimingChange(seg.id, 'start', parseFloat(e.target.value))}
                      className="w-13 bg-zinc-800 border border-zinc-700 rounded px-1 text-center text-white focus:outline-none focus:border-amber-400"
                    />
                    <span>→</span>
                    <input
                      type="number"
                      step={0.1}
                      min={0}
                      max={duration || 100}
                      value={seg.end}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => handleTimingChange(seg.id, 'end', parseFloat(e.target.value))}
                      className="w-13 bg-zinc-800 border border-zinc-700 rounded px-1 text-center text-white focus:outline-none focus:border-amber-400"
                    />
                    <span className="text-zinc-500 text-[10px]">
                      ({(seg.end - seg.start).toFixed(1)}s)
                    </span>
                  </div>

                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      title="Split caption at half"
                      onClick={() => handleSplitSegment(seg)}
                      className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                    >
                      <Split className="w-3.5 h-3.5" />
                    </button>

                    {idx < captions.length - 1 && (
                      <button
                        type="button"
                        title="Merge with next line"
                        onClick={() => handleMergeNext(idx)}
                        className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
                      >
                        <Merge className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      type="button"
                      title="Delete this caption"
                      onClick={() => handleDeleteSegment(seg.id)}
                      className="p-1 rounded hover:bg-red-500/20 text-zinc-500 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Main Full Line Input */}
                <input
                  type="text"
                  value={seg.text}
                  onClick={(e) => e.stopPropagation()}
                  onChange={(e) => handleTextChange(seg.id, e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700/80 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-white focus:outline-none focus:border-amber-400 tracking-wide"
                />

                {/* Word Chips Row with active highlight preview */}
                <div className="mt-2.5 pt-2 border-t border-zinc-800/60 flex flex-wrap gap-1.5 items-center">
                  <span className="text-[10px] text-zinc-500 font-mono mr-1">Words:</span>
                  {seg.words.map((w, wIdx) => {
                    const isWordActive = w.start <= currentTime && currentTime <= w.end;
                    return (
                      <div
                        key={wIdx}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSeek(w.start);
                        }}
                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-bold transition-colors ${
                          isWordActive
                            ? 'bg-amber-400 text-black shadow-sm ring-1 ring-amber-300'
                            : 'bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300'
                        }`}
                      >
                        <input
                          type="text"
                          value={w.word}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => handleWordChange(seg.id, wIdx, e.target.value)}
                          className="bg-transparent border-none focus:outline-none text-center min-w-[20px] max-w-[90px]"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
