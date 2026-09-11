export interface WordTiming {
  word: string;
  start: number;
  end: number;
  colorOverride?: string;
}

export interface CaptionSegment {
  id: string;
  start: number;
  end: number;
  text: string;
  words: WordTiming[];
}

export type AnimationType =
  | 'pop'         // Punchy scale pop (Hormozi / Viral)
  | 'bounce'      // Playful vertical spring bounce
  | 'wave'        // Wobbly rotational wave
  | 'elastic'     // Squash & stretch kinetic animation (Image 7)
  | 'slide_up'    // Smooth vertical slide reveal
  | 'glow_pulse'  // Pulsing radiant neon aura (Image 1, Image 4)
  | 'karaoke'     // Smooth progressive sweep
  | 'none';

export type WordHighlightStyle =
  | 'color'          // Color only
  | 'pill'           // Capsule pill tag behind active word (Image 3, Image 10)
  | 'box'            // Rectangle box behind active word (Image 3, Image 6, Image 7)
  | 'tilted_box'     // Kinetic skewed angled box (Image 6)
  | 'underline'      // Chunky marker underline beneath active word (Image 6, 7)
  | 'neon_outline'   // Radiant glowing outline (Image 1, Image 3)
  | 'hollow_outline' // Inactive words are hollow strokes, active word is solid (Image 7)
  | 'gradient_fill'; // Multi-color gradient fill on active word (Image 4, Image 5)

export type ShadowStyleType =
  | 'soft'      // Soft diffuse cinema shadow (Image 4 style 2)
  | 'hard_3d'   // Chunky 3D extruded block shadow (Image 8, 9)
  | 'neon_glow' // Radiant colorful neon glow (Image 1, 4)
  | 'none';

export type BadgeType = 'none' | 'box' | 'pill' | 'highlight';
export type TextCasing = 'uppercase' | 'capitalize' | 'none';

export interface CaptionStyle {
  presetId: string;
  fontFamily: string;
  fontSize: number; // in pixels relative to 1080x1920 base (e.g. 56)
  textTransform: TextCasing;
  primaryColor: string;
  highlightColor: string;
  gradientSecondaryColor?: string; // For dual-color gradient / karaoke pop
  strokeColor: string;
  strokeWidth: number;
  shadowColor: string;
  shadowBlur: number;
  shadowType?: ShadowStyleType;
  
  // Word-level highlight style & badge
  wordHighlightStyle?: WordHighlightStyle;
  wordBgColor?: string;
  wordBgOpacity?: number;
  wordBgTextColor?: string; // Text color when active word is inside a pill/box (e.g. black or white)

  // Full-line Backdrop (Image 2 "Backdrop", Image 3, Image 4)
  badgeType: BadgeType;
  badgeColor: string;
  badgeOpacity: number;

  animationType: AnimationType;
  positionY: number; // percentage from top (0-100), default 72
  positionX: number; // percentage from left (0-100), default 50
  wordsPerLine: number; // 1, 2, 3, 4, or 0 (all in segment)
  rotation: number; // in degrees (-15 to 15)
  isItalic?: boolean;
}

export interface PresetStyle {
  id: string;
  name: string;
  description: string;
  previewClass?: string;
  style: CaptionStyle;
}

export interface VideoInfo {
  url: string;
  name: string;
  duration: number;
  width: number;
  height: number;
  isSample?: boolean;
}

export interface ExportProgress {
  isExporting: boolean;
  progress: number; // 0 to 100
  stage: string; // 'Preparing audio...', 'Rendering frames...', 'Packaging video...'
  downloadUrl?: string;
  error?: string;
}
