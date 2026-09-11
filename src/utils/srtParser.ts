import { CaptionSegment } from '../types';

/**
 * Format seconds to SRT timestamp: 00:00:01,500
 */
function formatSrtTimestamp(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const millis = Math.floor((seconds % 1) * 1000);

  const pad = (n: number, z = 2) => String(n).padStart(z, '0');
  return `${pad(hrs)}:${pad(mins)}:${pad(secs)},${pad(millis, 3)}`;
}

/**
 * Format seconds to VTT timestamp: 00:00:01.500
 */
function formatVttTimestamp(seconds: number): string {
  return formatSrtTimestamp(seconds).replace(',', '.');
}

/**
 * Export captions array to SRT format string
 */
export function exportToSRT(segments: CaptionSegment[]): string {
  return segments
    .map((seg, idx) => {
      const index = idx + 1;
      const start = formatSrtTimestamp(seg.start);
      const end = formatSrtTimestamp(seg.end);
      return `${index}\n${start} --> ${end}\n${seg.text}\n`;
    })
    .join('\n');
}

/**
 * Export captions array to WebVTT format string
 */
export function exportToVTT(segments: CaptionSegment[]): string {
  const header = 'WEBVTT\n\n';
  const body = segments
    .map((seg, idx) => {
      const start = formatVttTimestamp(seg.start);
      const end = formatVttTimestamp(seg.end);
      return `${idx + 1}\n${start} --> ${end}\n${seg.text}\n`;
    })
    .join('\n');
  return header + body;
}

/**
 * Parse an uploaded SRT or VTT file into CaptionSegment array
 */
export function parseSubtitleFile(content: string): CaptionSegment[] {
  const clean = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const blocks = clean.split(/\n\s*\n/);
  const segments: CaptionSegment[] = [];

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i].trim();
    if (!block || block === 'WEBVTT') continue;

    const lines = block.split('\n');
    let timeLine = '';
    let textLines: string[] = [];

    for (const line of lines) {
      if (line.includes('-->')) {
        timeLine = line;
      } else if (timeLine) {
        textLines.push(line.trim());
      }
    }

    if (timeLine && textLines.length > 0) {
      const [startStr, endStr] = timeLine.split('-->').map((s) => s.trim());
      const start = parseTimestamp(startStr);
      const end = parseTimestamp(endStr);
      const text = textLines.join(' ');

      if (!isNaN(start) && !isNaN(end) && text) {
        const words = text.split(/\s+/).filter(Boolean);
        const dur = Math.max(0.2, end - start);
        const wordDur = dur / words.length;

        segments.push({
          id: `sub-${segments.length + 1}`,
          start: Number(start.toFixed(2)),
          end: Number(end.toFixed(2)),
          text: text.toUpperCase(),
          words: words.map((w, wIdx) => ({
            word: w.toUpperCase(),
            start: Number((start + wIdx * wordDur).toFixed(2)),
            end: Number((start + (wIdx + 1) * wordDur).toFixed(2)),
          })),
        });
      }
    }
  }

  return segments;
}

function parseTimestamp(str: string): number {
  const parts = str.replace(',', '.').split(':');
  if (parts.length === 3) {
    const hrs = parseFloat(parts[0]);
    const mins = parseFloat(parts[1]);
    const secs = parseFloat(parts[2]);
    return hrs * 3600 + mins * 60 + secs;
  } else if (parts.length === 2) {
    const mins = parseFloat(parts[0]);
    const secs = parseFloat(parts[1]);
    return mins * 60 + secs;
  }
  return 0;
}
