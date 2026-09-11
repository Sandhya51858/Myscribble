import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Eye,
  Move,
  RotateCw,
  Maximize2,
  Sliders,
  Sparkles,
} from 'lucide-react';
import { CaptionSegment, CaptionStyle } from '../types';
import { renderCaptionsToCanvas } from '../utils/captionRenderer';

interface VideoPlayerProps {
  videoUrl: string;
  captions: CaptionSegment[];
  style: CaptionStyle;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  onTimeUpdate: (time: number) => void;
  onDurationChange: (duration: number) => void;
  onPlayPause: () => void;
  onStyleChange: (style: Partial<CaptionStyle>) => void;
  videoRef: React.RefObject<HTMLVideoElement | null>;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoUrl,
  captions,
  style,
  currentTime,
  duration,
  isPlaying,
  onTimeUpdate,
  onDurationChange,
  onPlayPause,
  onStyleChange,
  videoRef,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSafeZones, setShowSafeZones] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Drag tracking refs to avoid stale closures
  const dragStartRef = useRef<{
    startX: number;
    startY: number;
    initialPosX: number;
    initialPosY: number;
    pointerId: number;
  } | null>(null);

  // Render function for canvas
  const renderCanvas = useCallback(
    (time: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      if (canvas.width !== 1080 || canvas.height !== 1920) {
        canvas.width = 1080;
        canvas.height = 1920;
      }

      ctx.clearRect(0, 0, 1080, 1920);
      // Pass previewMode: !isPlaying so paused state always displays the caption
      renderCaptionsToCanvas(ctx, time, captions, style, 1080, 1920, !isPlaying);
    },
    [captions, style, isPlaying]
  );

  // Render canvas on time, captions, or style changes
  useEffect(() => {
    renderCanvas(currentTime);
  }, [currentTime, renderCanvas]);

  // Ensure canvas re-renders when custom & Google Web Fonts finish loading
  useEffect(() => {
    if (typeof document !== 'undefined' && document.fonts) {
      if (document.fonts.ready) {
        document.fonts.ready.then(() => {
          renderCanvas(currentTime);
        });
      }
      if (document.fonts.load && style.fontFamily) {
        document.fonts.load(`900 48px "${style.fontFamily}"`).then(() => {
          renderCanvas(currentTime);
        }).catch(() => {});
      }
    }
  }, [currentTime, renderCanvas, style.fontFamily]);

  // Real-time 60fps rendering loop while video is actively playing
  useEffect(() => {
    if (!isPlaying) return;

    let animId: number;
    const loop = () => {
      if (videoRef.current) {
        const now = videoRef.current.currentTime;
        renderCanvas(now);
      }
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, renderCanvas, videoRef]);

  // Dedicated Drag Handler for the Caption Box
  const handleDragPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.preventDefault();

    if (!containerRef.current) return;

    e.currentTarget.setPointerCapture(e.pointerId);

    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialPosX: style.positionX ?? 50,
      initialPosY: style.positionY ?? 72,
      pointerId: e.pointerId,
    };

    setIsDragging(true);
  };

  const handleDragPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !dragStartRef.current || !containerRef.current) return;
    e.stopPropagation();
    e.preventDefault();

    const rect = containerRef.current.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const deltaX = e.clientX - dragStartRef.current.startX;
    const deltaY = e.clientY - dragStartRef.current.startY;

    const deltaPercentX = (deltaX / rect.width) * 100;
    const deltaPercentY = (deltaY / rect.height) * 100;

    const newX = Math.round(Math.min(85, Math.max(15, dragStartRef.current.initialPosX + deltaPercentX)));
    const newY = Math.round(Math.min(88, Math.max(12, dragStartRef.current.initialPosY + deltaPercentY)));

    onStyleChange({
      positionX: newX,
      positionY: newY,
    });
  };

  const handleDragPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    e.stopPropagation();
    e.preventDefault();

    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // Ignore if pointer capture already released
    }

    dragStartRef.current = null;
    setIsDragging(false);
  };

  // Safe background click to toggle play/pause (without moving captions)
  const pointerDownLocation = useRef<{ x: number; y: number; time: number } | null>(null);

  const handleContainerPointerDown = (e: React.PointerEvent) => {
    // Only track if clicked directly on video container (not on controls/drag handle)
    pointerDownLocation.current = {
      x: e.clientX,
      y: e.clientY,
      time: Date.now(),
    };
  };

  const handleContainerPointerUp = (e: React.PointerEvent) => {
    if (!pointerDownLocation.current) return;
    const dist = Math.hypot(
      e.clientX - pointerDownLocation.current.x,
      e.clientY - pointerDownLocation.current.y
    );
    const durationMs = Date.now() - pointerDownLocation.current.time;

    // If it was a quick click without dragging
    if (dist < 8 && durationMs < 400) {
      onPlayPause();
    }
    pointerDownLocation.current = null;
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleSpeedChange = () => {
    const rates = [1, 1.25, 1.5, 0.75];
    const nextRate = rates[(rates.indexOf(playbackRate) + 1) % rates.length];
    if (videoRef.current) {
      videoRef.current.playbackRate = nextRate;
    }
    setPlaybackRate(nextRate);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
    onTimeUpdate(time);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    const ms = Math.floor((secs % 1) * 10);
    return `${m}:${s < 10 ? '0' : ''}${s}.${ms}`;
  };

  const resetToReelsCenter = (e: React.MouseEvent) => {
    e.stopPropagation();
    onStyleChange({
      positionX: 50,
      positionY: 72,
    });
  };

  return (
    <div id="video-player-container" className="flex flex-col items-center justify-center w-full h-full max-h-full min-h-0 mx-auto select-none py-1">
      {/* Phone Mockup Frame (9:16 Vertical Shorts & Reels) */}
      <div
        ref={containerRef}
        onPointerDown={handleContainerPointerDown}
        onPointerUp={handleContainerPointerUp}
        style={{
          maxHeight: 'min(calc(100vh - 210px), 640px)',
        }}
        className="relative aspect-[9/16] h-full w-auto max-w-full bg-black rounded-3xl overflow-hidden shadow-2xl border-4 border-zinc-800 ring-1 ring-zinc-700/50 group shrink"
      >
        {/* Actual Video */}
        <video
          ref={videoRef}
          src={videoUrl}
          playsInline
          crossOrigin="anonymous"
          onTimeUpdate={() => {
            if (videoRef.current) onTimeUpdate(videoRef.current.currentTime);
          }}
          onLoadedMetadata={() => {
            if (videoRef.current) onDurationChange(videoRef.current.duration);
          }}
          onEnded={() => {
            if (videoRef.current) {
              videoRef.current.currentTime = 0;
              videoRef.current.play();
            }
          }}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        />

        {/* Center Play Button Overlay (Only when paused) - z-10 so it never covers captions */}
        {!isPlaying && (
          <div
            id="center-play-button-overlay"
            onClick={(e) => {
              e.stopPropagation();
              onPlayPause();
            }}
            className="absolute inset-0 z-10 flex items-center justify-center bg-black/15 cursor-pointer transition-all duration-200"
          >
            <div className="w-16 h-16 rounded-full bg-amber-400 text-black flex items-center justify-center shadow-xl shadow-amber-400/30 transform hover:scale-110 active:scale-95 transition-transform">
              <Play className="w-8 h-8 fill-current ml-1" />
            </div>
          </div>
        )}

        {/* Dynamic High-DPI Captions Canvas Overlay - z-20 so captions are ALWAYS in foreground */}
        <canvas
          ref={canvasRef}
          width={1080}
          height={1920}
          className="absolute inset-0 w-full h-full pointer-events-none z-20"
        />

        {/* DEDICATED DRAGGABLE CAPTION BOUNDING BOX - Clean, transparent frame with floating tab above */}
        <div
          id="draggable-caption-handle"
          onPointerDown={handleDragPointerDown}
          onPointerMove={handleDragPointerMove}
          onPointerUp={handleDragPointerUp}
          onPointerCancel={handleDragPointerUp}
          style={{
            left: `${style.positionX ?? 50}%`,
            top: `${style.positionY ?? 72}%`,
            transform: `translate(-50%, -50%) rotate(${style.rotation || 0}deg)`,
          }}
          title="Drag to position captions anywhere on your Reel/Short"
          className={`absolute z-30 cursor-grab active:cursor-grabbing p-3 min-w-[220px] min-h-[58px] rounded-2xl transition-colors touch-none flex flex-col items-center justify-center select-none group/drag ${
            isDragging
              ? 'ring-2 ring-amber-400 bg-amber-400/10 shadow-2xl shadow-amber-400/20'
              : 'border border-dashed border-white/40 hover:border-amber-400 hover:bg-black/10'
          }`}
        >
          {/* Floating Drag Grip Tab positioned ABOVE the text so it NEVER obscures the caption */}
          <div className="absolute -top-7 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-black/90 backdrop-blur-md border border-amber-400/50 text-amber-300 text-[10px] font-bold shadow-lg pointer-events-none select-none whitespace-nowrap">
            <Move className="w-3 h-3 text-amber-400 stroke-[2.5]" />
            <span>Drag Captions</span>
            <span className="font-mono text-[9px] text-zinc-300 ml-0.5">
              ({style.positionX ?? 50}%, {style.positionY ?? 72}%)
            </span>
          </div>

          {/* Quick Backdrop Pill Button beneath captions (Ref Image 2 "Backdrop Edit") */}
          <div
            onPointerDown={(e) => e.stopPropagation()}
            className="absolute -bottom-7 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-950/90 backdrop-blur-md border border-zinc-700 text-zinc-300 text-[10px] shadow-lg whitespace-nowrap opacity-0 group-hover/drag:opacity-100 transition-opacity"
          >
            <span className="text-zinc-400 text-[9px]">Backdrop:</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                const nextType = style.badgeType === 'none' ? 'box' : style.badgeType === 'box' ? 'pill' : 'none';
                onStyleChange({ badgeType: nextType });
              }}
              className="px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 font-bold hover:bg-amber-400 hover:text-black transition-colors"
            >
              {style.badgeType === 'none' ? 'Off' : style.badgeType === 'box' ? 'Dark Box' : 'Capsule'}
            </button>
          </div>
        </div>

        {/* Shorts / Reels UI Safe Zones Overlay */}
        {showSafeZones && (
          <div className="absolute inset-0 pointer-events-none z-25 flex flex-col justify-between p-4 bg-red-500/10 border-2 border-red-500/30">
            {/* Top Bar Area */}
            <div className="bg-red-500/30 text-red-200 text-[10px] font-mono px-2.5 py-1 rounded-lg">
              ⚠️ Top Safe Zone (Search & Navigation)
            </div>

            {/* Right Action Icons Simulation (Like, Comments, Share) */}
            <div className="self-end flex flex-col gap-3 items-center opacity-80 mr-1">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-[10px]">❤️</div>
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-[10px]">💬</div>
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-[10px]">✈️</div>
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-[10px]">🎵</div>
            </div>

            {/* Bottom Bar Area (Description, Audio Name) */}
            <div className="bg-red-500/30 text-red-200 text-[10px] font-mono px-2.5 py-1.5 rounded-lg">
              ⚠️ Bottom Safe Zone (Username, Caption & Audio Tag)
            </div>
          </div>
        )}

        {/* Top Floating Controls inside phone */}
        <div className="absolute top-3 left-3 right-3 z-30 flex items-center justify-between pointer-events-auto">
          {/* Position Reset Button */}
          <button
            id="reset-caption-pos-btn"
            type="button"
            onClick={resetToReelsCenter}
            title="Reset position to Reels sweet spot (Center, 72%)"
            className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-black/60 backdrop-blur-md text-zinc-300 hover:text-white border border-white/10 hover:border-amber-400 flex items-center gap-1 transition-all"
          >
            <RotateCcw className="w-3 h-3 text-amber-400" />
            <span>Reset Position</span>
          </button>

          {/* Safe Zones Guide Toggle */}
          <button
            id="toggle-safezones-btn"
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowSafeZones(!showSafeZones);
            }}
            title="Toggle YouTube Shorts / Instagram Reels Safe Zones"
            className={`px-2.5 py-1 rounded-full text-[10px] font-semibold flex items-center gap-1.5 transition-all ${
              showSafeZones
                ? 'bg-red-500 text-white shadow-lg'
                : 'bg-black/60 backdrop-blur-md text-zinc-300 hover:text-white border border-white/10'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Reels Guide</span>
          </button>
        </div>
      </div>

      {/* Playback Controls & Scrubber */}
      <div className="w-full max-w-[360px] mt-2 bg-zinc-900/90 backdrop-blur-md border border-zinc-800 rounded-2xl px-3 py-2 shadow-xl shrink-0">
        {/* Scrubber slider */}
        <div className="relative mb-2 group">
          <input
            id="video-timeline-scrubber"
            type="range"
            min={0}
            max={duration || 10}
            step={0.05}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-400 focus:outline-none"
          />
          {/* Subtitle segment markers on timeline */}
          <div className="absolute top-0 left-0 right-0 h-1.5 pointer-events-none rounded-lg overflow-hidden flex">
            {captions.map((seg) => {
              if (!duration) return null;
              const left = (seg.start / duration) * 100;
              const width = Math.max(1, ((seg.end - seg.start) / duration) * 100);
              return (
                <div
                  key={seg.id}
                  style={{ left: `${left}%`, width: `${width}%` }}
                  className="absolute h-full bg-amber-400/30 border-r border-amber-400/50"
                />
              );
            })}
          </div>
        </div>

        {/* Buttons Row */}
        <div className="flex items-center justify-between text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <button
              id="player-play-btn"
              type="button"
              onClick={onPlayPause}
              className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white flex items-center justify-center transition-colors"
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
            </button>

            <button
              id="player-restart-btn"
              type="button"
              onClick={() => {
                if (videoRef.current) {
                  videoRef.current.currentTime = 0;
                  onTimeUpdate(0);
                }
              }}
              title="Restart video"
              className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <button
              id="player-mute-btn"
              type="button"
              onClick={toggleMute}
              className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center transition-colors"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
            </button>

            <button
              id="player-speed-btn"
              type="button"
              onClick={handleSpeedChange}
              className="px-2 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono text-[11px] font-bold flex items-center transition-colors"
            >
              {playbackRate}x
            </button>
          </div>

          <div className="font-mono text-zinc-300 text-xs font-semibold">
            <span className="text-amber-400">{formatTime(currentTime)}</span> / {formatTime(duration)}
          </div>
        </div>
      </div>
    </div>
  );
};
