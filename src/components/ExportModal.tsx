import React, { useState } from 'react';
import {
  Download,
  X,
  CheckCircle,
  Video,
  FileText,
  Sparkles,
  AlertTriangle,
  Play,
  RotateCcw,
} from 'lucide-react';
import { CaptionSegment, CaptionStyle, ExportProgress } from '../types';
import { exportToSRT, exportToVTT } from '../utils/srtParser';
import { exportHighQualityVideo } from '../utils/videoExporter';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoElement: HTMLVideoElement | null;
  captions: CaptionSegment[];
  style: CaptionStyle;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  videoElement,
  captions,
  style,
}) => {
  const [quality, setQuality] = useState<'1080p' | '720p'>('1080p');
  const [exportState, setExportState] = useState<ExportProgress>({
    isExporting: false,
    progress: 0,
    stage: '',
  });
  const [abortHandler, setAbortHandler] = useState<{ abort: () => void } | null>(null);

  if (!isOpen) return null;

  const handleStartExport = async () => {
    if (!videoElement) {
      alert('Video element is not ready. Please try again.');
      return;
    }

    setExportState({
      isExporting: true,
      progress: 0,
      stage: 'Initializing HD Canvas & Audio stream...',
      downloadUrl: undefined,
      error: undefined,
    });

    const handler = await exportHighQualityVideo({
      videoElement,
      captions,
      style,
      quality,
      onProgress: (progress, stage) => {
        setExportState((prev) => ({ ...prev, progress, stage }));
      },
      onComplete: (downloadUrl) => {
        setExportState({
          isExporting: false,
          progress: 100,
          stage: 'Export complete!',
          downloadUrl,
        });
      },
      onError: (err) => {
        setExportState({
          isExporting: false,
          progress: 0,
          stage: 'Export failed',
          error: err.message || 'An error occurred during video rendering',
        });
      },
    });

    setAbortHandler(handler);
  };

  const handleCancelExport = () => {
    if (abortHandler) {
      abortHandler.abort();
    }
    setExportState({
      isExporting: false,
      progress: 0,
      stage: 'Export cancelled',
    });
  };

  // Download Subtitles as SRT file
  const handleDownloadSRT = () => {
    const srtContent = exportToSRT(captions);
    const blob = new Blob([srtContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `subtitles_${Date.now()}.srt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Download Subtitles as VTT file
  const handleDownloadVTT = () => {
    const vttContent = exportToVTT(captions);
    const blob = new Blob([vttContent], { type: 'text/vtt;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `subtitles_${Date.now()}.vtt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Download JSON transcript
  const handleDownloadJSON = () => {
    const jsonContent = JSON.stringify(captions, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `captions_data_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div id="export-modal-backdrop" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div id="export-modal-card" className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl relative text-zinc-200">
        {/* Close Button */}
        <button
          id="close-export-modal-btn"
          type="button"
          onClick={onClose}
          disabled={exportState.isExporting}
          className="absolute top-5 right-5 p-2 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors disabled:opacity-30"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-amber-400 text-black flex items-center justify-center shadow-lg shadow-amber-400/20">
            <Download className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-wide">Export Reel / Short</h3>
            <p className="text-xs text-zinc-400">
              High quality 9:16 vertical video with CapCut animated captions
            </p>
          </div>
        </div>

        {/* Export Progress View */}
        {exportState.isExporting ? (
          <div className="space-y-4 py-4">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-white animate-pulse">
                {exportState.stage}
              </span>
              <span className="font-mono font-bold text-amber-400">
                {exportState.progress}%
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-3 bg-zinc-800 rounded-full overflow-hidden p-0.5 border border-zinc-700">
              <div
                style={{ width: `${exportState.progress}%` }}
                className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full transition-all duration-200 shadow-md"
              />
            </div>

            <p className="text-[11px] text-zinc-400 text-center">
              Please keep this browser tab active while frames are being rendered at 60 FPS...
            </p>

            <button
              id="cancel-export-btn"
              type="button"
              onClick={handleCancelExport}
              className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-xs transition-colors"
            >
              Cancel Export
            </button>
          </div>
        ) : exportState.downloadUrl ? (
          /* Finished Download View */
          <div className="space-y-5 py-4 text-center">
            <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 stroke-[2]" />
            </div>

            <div>
              <h4 className="text-base font-bold text-white">Your High Quality Video is Ready!</h4>
              <p className="text-xs text-zinc-400 mt-1">
                Rendered with animated captions in vertical 9:16 format.
              </p>
            </div>

            <a
              id="download-video-file-btn"
              href={exportState.downloadUrl}
              download={`reel-captions-${Date.now()}.mp4`}
              className="w-full py-3.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-extrabold text-sm flex items-center justify-center gap-2 shadow-xl shadow-amber-400/20 transition-all transform active:scale-98"
            >
              <Download className="w-5 h-5 stroke-[2.5]" />
              <span>Download High Quality Video (.MP4)</span>
            </a>

            <button
              type="button"
              onClick={() => setExportState({ isExporting: false, progress: 0, stage: '' })}
              className="text-xs text-zinc-400 hover:text-white underline underline-offset-4"
            >
              Render again with different settings
            </button>
          </div>
        ) : (
          /* Normal Settings View */
          <div className="space-y-5">
            {/* Resolution Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Resolution & Quality
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setQuality('1080p')}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    quality === '1080p'
                      ? 'bg-amber-400/10 border-amber-400 shadow-md ring-1 ring-amber-400/40'
                      : 'bg-zinc-950 border-zinc-800 hover:bg-zinc-800/60'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-white text-sm">1080p Full HD</span>
                    {quality === '1080p' && <Sparkles className="w-3.5 h-3.5 text-amber-400" />}
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-1">1080 × 1920 (Best for Shorts & Reels)</p>
                </button>

                <button
                  type="button"
                  onClick={() => setQuality('720p')}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    quality === '720p'
                      ? 'bg-amber-400/10 border-amber-400 shadow-md ring-1 ring-amber-400/40'
                      : 'bg-zinc-950 border-zinc-800 hover:bg-zinc-800/60'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-white text-sm">720p Fast</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-1">720 × 1280 (Lightweight & Faster)</p>
                </button>
              </div>
            </div>

            {exportState.error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{exportState.error}</span>
              </div>
            )}

            {/* Render Button */}
            <button
              id="start-high-quality-render-btn"
              type="button"
              onClick={handleStartExport}
              className="w-full py-3.5 px-4 rounded-2xl bg-amber-400 hover:bg-amber-300 text-black font-extrabold text-sm flex items-center justify-center gap-2 shadow-xl shadow-amber-400/20 transition-all transform active:scale-98"
            >
              <Video className="w-5 h-5 stroke-[2.5]" />
              <span>Start High Quality Render ({quality})</span>
            </button>

            {/* Subtitle Files Export Options */}
            <div className="pt-4 border-t border-zinc-800 space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                Export Subtitles Separately
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  id="export-srt-btn"
                  type="button"
                  onClick={handleDownloadSRT}
                  className="py-2 px-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-xs font-semibold text-zinc-300 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <FileText className="w-3.5 h-3.5 text-amber-400" />
                  <span>.SRT File</span>
                </button>

                <button
                  id="export-vtt-btn"
                  type="button"
                  onClick={handleDownloadVTT}
                  className="py-2 px-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-xs font-semibold text-zinc-300 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <FileText className="w-3.5 h-3.5 text-sky-400" />
                  <span>.VTT File</span>
                </button>

                <button
                  id="export-json-btn"
                  type="button"
                  onClick={handleDownloadJSON}
                  className="py-2 px-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-xs font-semibold text-zinc-300 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <FileText className="w-3.5 h-3.5 text-emerald-400" />
                  <span>.JSON</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
