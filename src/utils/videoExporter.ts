import { CaptionSegment, CaptionStyle } from '../types';
import { renderCaptionsToCanvas } from './captionRenderer';

export interface ExportOptions {
  videoElement: HTMLVideoElement;
  captions: CaptionSegment[];
  style: CaptionStyle;
  quality?: '1080p' | '720p';
  onProgress: (progress: number, stage: string) => void;
  onComplete: (downloadUrl: string, blob: Blob) => void;
  onError: (error: Error) => void;
}

/**
 * High quality video exporter with synchronized audio and burned-in animated captions
 */
export async function exportHighQualityVideo(options: ExportOptions): Promise<{ abort: () => void }> {
  const { videoElement, captions, style, quality = '1080p', onProgress, onComplete, onError } = options;

  let isAborted = false;

  // Determine export dimensions (default 9:16 vertical standard for Shorts/Reels)
  const targetWidth = quality === '1080p' ? 1080 : 720;
  const targetHeight = quality === '1080p' ? 1920 : 1280;

  // Offscreen rendering canvas
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });

  if (!ctx) {
    onError(new Error('Unable to initialize canvas rendering context'));
    return { abort: () => {} };
  }

  // Audio setup
  let audioContext: AudioContext | null = null;
  let audioDestination: MediaStreamAudioDestinationNode | null = null;
  let combinedStream: MediaStream;

  try {
    const videoStream = canvas.captureStream(60); // 60fps smooth export

    // Attempt to tap into audio from video
    let audioTrack: MediaStreamTrack | null = null;
    try {
      const vidCapture = (videoElement as any).captureStream
        ? (videoElement as any).captureStream()
        : (videoElement as any).mozCaptureStream
        ? (videoElement as any).mozCaptureStream()
        : null;

      if (vidCapture && vidCapture.getAudioTracks().length > 0) {
        audioTrack = vidCapture.getAudioTracks()[0];
      }
    } catch (e) {
      console.warn('Direct stream capture not permitted, using Web Audio routing:', e);
    }

    if (audioTrack) {
      combinedStream = new MediaStream([...videoStream.getVideoTracks(), audioTrack]);
    } else {
      // Fallback to videoStream
      combinedStream = videoStream;
    }

    // MediaRecorder options
    const mimeTypes = [
      'video/mp4;codecs=avc1,mp4a.40.2',
      'video/mp4',
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
    ];

    let selectedMimeType = '';
    for (const type of mimeTypes) {
      if (MediaRecorder.isTypeSupported(type)) {
        selectedMimeType = type;
        break;
      }
    }

    const recordedChunks: Blob[] = [];
    const mediaRecorder = new MediaRecorder(combinedStream, {
      mimeType: selectedMimeType || undefined,
      videoBitsPerSecond: quality === '1080p' ? 10_000_000 : 5_000_000, // 10 Mbps for crisp HD
    });

    mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        recordedChunks.push(e.data);
      }
    };

    mediaRecorder.onstop = () => {
      if (isAborted) return;
      onProgress(100, 'Finishing high quality video...');
      const blob = new Blob(recordedChunks, { type: selectedMimeType || 'video/mp4' });
      const downloadUrl = URL.createObjectURL(blob);
      onComplete(downloadUrl, blob);
    };

    // Prepare video playback from start
    const originalTime = videoElement.currentTime;
    const originalPaused = videoElement.paused;
    const duration = videoElement.duration || 10;

    // Wait for fonts to be ready so exported canvas renders custom typography
    if (typeof document !== 'undefined' && document.fonts) {
      try {
        await document.fonts.ready;
        if (document.fonts.load && style.fontFamily) {
          await document.fonts.load(`900 48px "${style.fontFamily}"`);
        }
      } catch (e) {
        // Fallback gracefully
      }
    }

    videoElement.currentTime = 0;
    onProgress(5, 'Preparing video and audio streams...');

    // Wait for seek to 0
    await new Promise<void>((resolve) => {
      const handleSeeked = () => {
        videoElement.removeEventListener('seeked', handleSeeked);
        resolve();
      };
      videoElement.addEventListener('seeked', handleSeeked);
      videoElement.currentTime = 0;
    });

    mediaRecorder.start(100);
    videoElement.play();

    // Render loop
    let animationFrameId: number;

    const renderFrame = () => {
      if (isAborted) {
        if (mediaRecorder.state !== 'inactive') mediaRecorder.stop();
        videoElement.pause();
        videoElement.currentTime = originalTime;
        return;
      }

      const currentTime = videoElement.currentTime;
      const progressPercent = Math.min(99, Math.round((currentTime / duration) * 90) + 5);
      onProgress(progressPercent, `Rendering frame at ${currentTime.toFixed(1)}s / ${duration.toFixed(1)}s...`);

      // 1. Draw video frame covering 9:16 canvas (crop to fill or contain)
      const vWidth = videoElement.videoWidth || targetWidth;
      const vHeight = videoElement.videoHeight || targetHeight;

      // Aspect ratio math: center crop to 9:16
      const targetAspect = targetWidth / targetHeight;
      const videoAspect = vWidth / vHeight;

      let sx = 0, sy = 0, sWidth = vWidth, sHeight = vHeight;

      if (videoAspect > targetAspect) {
        // Video is wider than 9:16 -> crop left/right
        sWidth = vHeight * targetAspect;
        sx = (vWidth - sWidth) / 2;
      } else {
        // Video is taller or same
        sHeight = vWidth / targetAspect;
        sy = (vHeight - sHeight) / 2;
      }

      ctx.drawImage(videoElement, sx, sy, sWidth, sHeight, 0, 0, targetWidth, targetHeight);

      // 2. Draw styled animated captions
      renderCaptionsToCanvas(ctx, currentTime, captions, style, targetWidth, targetHeight);

      if (!videoElement.ended && currentTime < duration - 0.05) {
        animationFrameId = requestAnimationFrame(renderFrame);
      } else {
        // Finished recording
        if (mediaRecorder.state !== 'inactive') {
          mediaRecorder.stop();
        }
        videoElement.pause();
        videoElement.currentTime = originalTime;
        if (!originalPaused) videoElement.play();
      }
    };

    renderFrame();

    return {
      abort: () => {
        isAborted = true;
        cancelAnimationFrame(animationFrameId);
        if (mediaRecorder.state !== 'inactive') mediaRecorder.stop();
        videoElement.pause();
        videoElement.currentTime = originalTime;
      },
    };
  } catch (err: any) {
    onError(err);
    return { abort: () => {} };
  }
}
