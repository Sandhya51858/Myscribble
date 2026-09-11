import { CaptionSegment, CaptionStyle, WordTiming } from '../types';

/**
 * Renders animated captions onto a 2D canvas context:
 * - Word-by-word highlights: pill capsules, solid boxes, tilted boxes, underlines, neon outlines, hollow outlines, gradient fills
 * - 3D extruded block shadows, soft cinema shadows, and radiant neon glows
 * - Full-line backdrops and translucent bars
 * - Dynamic kinetic animations: Pop, Bounce, Wave, Elastic, Slide Up, Glow Pulse, Karaoke
 * - Custom typography with Google Fonts, casing, and rotation
 */
export function renderCaptionsToCanvas(
  ctx: CanvasRenderingContext2D,
  currentTime: number,
  captions: CaptionSegment[],
  style: CaptionStyle,
  canvasWidth: number,
  canvasHeight: number,
  previewMode: boolean = false
) {
  // 1. Find current active segment strictly by timestamp
  let activeSegment: CaptionSegment | undefined = captions.find(
    (seg) => seg.start <= currentTime && currentTime <= seg.end
  );

  // 2. Controlled fallback ONLY for initial design preview when video is paused at start or when no captions exist
  if (!activeSegment) {
    if (previewMode && captions.length === 0) {
      activeSegment = {
        id: 'placeholder-preview',
        start: 0,
        end: 9999,
        text: 'YOUR CAPTIONS HERE',
        words: [
          { word: 'YOUR', start: 0, end: 1 },
          { word: 'CAPTIONS', start: 1, end: 2 },
          { word: 'HERE', start: 2, end: 3 },
        ],
      };
    } else if (previewMode && captions.length > 0 && currentTime <= (captions[0]?.start ?? 0)) {
      // Paused at the very beginning of the video before first speech: preview the first segment
      activeSegment = captions[0];
    } else {
      // In pauses between sentences, or after captions complete:
      // Keep canvas clean with NO captions so words from the previous sentence never flash
      return;
    }
  }

  // Ensure activeSegment has words
  let words = activeSegment.words;
  if (!words || words.length === 0) {
    const rawText = activeSegment.text?.trim() || 'CAPTIONS';
    const splitWords = rawText.split(/\s+/).filter(Boolean);
    const duration = Math.max(0.5, activeSegment.end - activeSegment.start);
    const step = duration / Math.max(1, splitWords.length);
    words = splitWords.map((w, idx) => ({
      word: w,
      start: activeSegment!.start + idx * step,
      end: activeSegment!.start + (idx + 1) * step,
    }));
  }

  if (!words || words.length === 0) return;

  // Determine active word index with robust gap protection
  // 1. Exact match if currentTime falls within a word's duration
  let activeWordIndex = words.findIndex(
    (w) => w.start <= currentTime && currentTime <= w.end
  );

  // 2. If currentTime falls in a pause/gap between words within the active segment:
  if (activeWordIndex === -1) {
    if (currentTime < words[0].start) {
      // Before first word starts: queue first word
      activeWordIndex = 0;
    } else if (currentTime > words[words.length - 1].end) {
      // After last word ended (before segment ends): stay on last word and last chunk!
      activeWordIndex = words.length - 1;
    } else {
      // In a gap between word i and word i+1: keep the word that just finished
      for (let i = words.length - 1; i >= 0; i--) {
        if (words[i].end <= currentTime) {
          activeWordIndex = i;
          break;
        }
      }
      if (activeWordIndex === -1) activeWordIndex = 0;
    }
  }

  // Determine which words to show based on wordsPerLine
  // If wordsPerLine is 0, show the full line
  const wordsPerLine = style.wordsPerLine > 0 ? style.wordsPerLine : words.length;

  let displayWords: WordTiming[] = words;

  if (words.length > wordsPerLine) {
    const chunkStart = Math.floor(activeWordIndex / wordsPerLine) * wordsPerLine;
    displayWords = words.slice(chunkStart, chunkStart + wordsPerLine);
  }

  if (displayWords.length === 0) return;

  // Scale font size relative to 1080x1920 base canvas
  const scale = canvasWidth / 1080;
  const rawFontSize = style.fontSize || 56;
  const fontSize = Math.max(20, Math.round(rawFontSize * scale));
  const strokeWidth = Math.round((style.strokeWidth ?? 8) * scale);
  const shadowBlur = Math.round((style.shadowBlur ?? 10) * scale);

  ctx.save();

  // Position calculation with safe fallbacks
  const posX = ((style.positionX ?? 50) / 100) * canvasWidth;
  const posY = ((style.positionY ?? 72) / 100) * canvasHeight;

  ctx.translate(posX, posY);

  if (style.rotation && style.rotation !== 0) {
    ctx.rotate((style.rotation * Math.PI) / 180);
  }

  // Font setup with intelligent font weights and fallback stacks
  const fontFamily = style.fontFamily || 'Montserrat';
  const italicPrefix = style.isItalic ? 'italic ' : '';

  let fontFallback = '"Arial Black", Impact, sans-serif';
  let fontWeight = '900';

  if (
    fontFamily === 'Apple Garamond' ||
    fontFamily.includes('Garamond') ||
    fontFamily === 'Playfair Display' ||
    fontFamily === 'Cinzel' ||
    fontFamily === 'Craos' ||
    fontFamily === 'Butler' ||
    fontFamily === 'Voga' ||
    fontFamily === 'Soria' ||
    fontFamily === 'Sanford' ||
    fontFamily === 'Italiana' ||
    fontFamily === 'Prata' ||
    fontFamily === 'Theano Didot' ||
    fontFamily === 'Yeseva One'
  ) {
    fontFallback = '"Playfair Display", Didot, "Times New Roman", Georgia, serif';
    fontWeight = fontFamily === 'Craos' || fontFamily === 'Italiana' ? '600' : '700';
  } else if (fontFamily === 'Tempting' || fontFamily === 'Arizonia' || fontFamily === 'Alex Brush' || fontFamily === 'Caveat' || fontFamily === 'Pacifico') {
    fontFallback = 'cursive, "Brush Script MT", "Apple Chancery", sans-serif';
    fontWeight = '600';
  } else if (fontFamily === 'Monar' || fontFamily === 'Morganite' || fontFamily === 'Brunson' || fontFamily === 'Bebas Neue' || fontFamily === 'Anton') {
    fontFallback = '"Bebas Neue", Impact, Haettenschweiler, "Arial Narrow", sans-serif';
    fontWeight = '800';
  } else if (fontFamily === 'Akira Expanded') {
    fontFallback = 'Impact, "Syne", "Arial Black", sans-serif';
    fontWeight = '800';
  } else if (fontFamily === 'Monument Extended') {
    fontFallback = '"Syne", Impact, "Arial Black", sans-serif';
    fontWeight = '800';
  } else if (fontFamily === 'Impact') {
    fontFallback = 'Haettenschweiler, "Arial Black", sans-serif';
    fontWeight = '900';
  } else if (fontFamily === 'Batica Sans' || fontFamily === 'Coco' || fontFamily === 'Caviar Dreams' || fontFamily.includes('Helvetica') || fontFamily === 'Inter') {
    fontFallback = 'Helvetica, Arial, -apple-system, BlinkMacSystemFont, sans-serif';
    fontWeight = fontFamily === 'Caviar Dreams' ? '700' : '800';
  }

  ctx.font = `${italicPrefix}${fontWeight} ${fontSize}px "${fontFamily}", ${fontFallback}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Format words text casing
  const formattedWords = displayWords.map((w) => {
    let t = w.word || '';
    if (style.textTransform === 'uppercase') t = t.toUpperCase();
    else if (style.textTransform === 'capitalize') {
      t = t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
    }
    const isTargetWord =
      w === words[activeWordIndex] ||
      (w.start === words[activeWordIndex]?.start && w.end === words[activeWordIndex]?.end);
    return { ...w, displayText: t, isTargetWord };
  });

  // Measure word widths to layout horizontally
  const wordSpacings = Math.max(14 * scale, fontSize * 0.32);
  const wordMetrics = formattedWords.map((w) => {
    const metrics = ctx.measureText(w.displayText);
    const measuredW = metrics.width || (w.displayText.length * fontSize * 0.6);
    return {
      ...w,
      width: Math.max(measuredW, 16 * scale),
    };
  });

  const totalWidth =
    wordMetrics.reduce((sum, w) => sum + w.width, 0) +
    (wordMetrics.length - 1) * wordSpacings;

  // 1. FULL-LINE BACKDROP / BANNER (Ref Image 2 "Backdrop", Image 3, Image 4 Style 5)
  if (style.badgeType !== 'none') {
    const paddingX = 26 * scale;
    const paddingY = 16 * scale;
    const boxWidth = totalWidth + paddingX * 2;
    const boxHeight = fontSize * 1.5 + paddingY;
    const radius = style.badgeType === 'pill' ? boxHeight / 2 : 12 * scale;

    ctx.save();
    ctx.globalAlpha = style.badgeOpacity ?? 0.8;
    ctx.fillStyle = style.badgeColor || '#000000';

    drawRoundedRect(
      ctx,
      -boxWidth / 2,
      -boxHeight / 2,
      boxWidth,
      boxHeight,
      radius
    );
    ctx.fill();
    ctx.restore();
  }

  // 2. DRAW EACH WORD
  let currentX = -totalWidth / 2;

  wordMetrics.forEach((w) => {
    const isExactCurrent = w.start <= currentTime && currentTime <= w.end;
    const isHoldingCurrent =
      !isExactCurrent &&
      Boolean(w.isTargetWord) &&
      currentTime < (words[activeWordIndex + 1]?.start ?? (w.end + 0.15));
    const isCurrent = isExactCurrent || isHoldingCurrent;

    const wordProgress = Math.min(
      1,
      Math.max(0, (currentTime - w.start) / Math.max(0.05, w.end - w.start))
    );

    ctx.save();

    // Calculate word center
    const wordCenterX = currentX + w.width / 2;
    ctx.translate(wordCenterX, 0);

    // KINETIC ANIMATIONS: Pop, Bounce, Wave, Elastic, Slide Up, Glow Pulse
    if (isCurrent) {
      if (style.animationType === 'pop') {
        const popScale = 1.0 + 0.24 * Math.sin(wordProgress * Math.PI);
        ctx.scale(popScale, popScale);
      } else if (style.animationType === 'bounce') {
        const bounceY = -12 * scale * Math.sin(wordProgress * Math.PI);
        ctx.translate(0, bounceY);
        ctx.scale(1.12, 1.12);
      } else if (style.animationType === 'wave') {
        const waveAngle = Math.sin(currentTime * 14) * 0.1;
        ctx.rotate(waveAngle);
        ctx.scale(1.14, 1.14);
      } else if (style.animationType === 'elastic') {
        // Elastic squash & stretch (Ref Image 7)
        const stretchX = 1 + 0.18 * Math.sin(wordProgress * Math.PI * 2) * Math.exp(-wordProgress * 3);
        const stretchY = 1 - 0.12 * Math.sin(wordProgress * Math.PI * 2) * Math.exp(-wordProgress * 3);
        ctx.scale(stretchX, stretchY);
      } else if (style.animationType === 'slide_up') {
        const slideY = (1 - Math.min(1, wordProgress * 2.8)) * (16 * scale);
        ctx.translate(0, slideY);
      } else if (style.animationType === 'glow_pulse') {
        const pulse = 1.0 + 0.08 * Math.sin(currentTime * 10);
        ctx.scale(pulse, pulse);
      }
    }

    // A. ACTIVE WORD BADGE CAPSULE / BOX / UNDERLINE (Ref Image 1, 3, 6, 7, 10)
    if (isCurrent && style.wordHighlightStyle && style.wordHighlightStyle !== 'color') {
      const padX = 18 * scale;
      const padY = 10 * scale;
      const bgW = w.width + padX * 2;
      const bgH = fontSize * 1.35 + padY;

      ctx.save();
      const badgeColor = style.wordBgColor || style.highlightColor;
      ctx.fillStyle = badgeColor;
      ctx.globalAlpha = style.wordBgOpacity ?? 1.0;

      if (style.wordHighlightStyle === 'pill') {
        // Rounded capsule pill tag (Ref Image 10 "Wizards Jump", Image 3 "QUICK")
        drawRoundedRect(ctx, -bgW / 2, -bgH / 2, bgW, bgH, bgH / 2);
        ctx.fill();
      } else if (style.wordHighlightStyle === 'box') {
        // Solid rectangular box (Ref Image 3, Image 10)
        drawRoundedRect(ctx, -bgW / 2, -bgH / 2, bgW, bgH, 8 * scale);
        ctx.fill();
      } else if (style.wordHighlightStyle === 'tilted_box') {
        // Skewed kinetic box (Ref Image 6 "Creative Box Titles")
        ctx.rotate((-3.5 * Math.PI) / 180);
        drawRoundedRect(ctx, -bgW / 2, -bgH / 2, bgW, bgH, 6 * scale);
        ctx.fill();
        ctx.rotate((3.5 * Math.PI) / 180);
      } else if (style.wordHighlightStyle === 'underline') {
        // Chunky marker underline (Ref Image 6, Image 7)
        const lineH = Math.max(6 * scale, fontSize * 0.16);
        const lineY = fontSize * 0.65;
        drawRoundedRect(ctx, -w.width / 2 - 4 * scale, lineY, w.width + 8 * scale, lineH, lineH / 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // B. 3D HARD EXTRUDED BLOCK SHADOW (Ref Image 8 & 9 "TEN SIXTY FIVE")
    if (style.shadowType === 'hard_3d') {
      const shadowOffset = Math.max(3, Math.round(5 * scale));
      ctx.save();
      ctx.fillStyle = style.shadowColor || '#000000';
      ctx.strokeStyle = style.shadowColor || '#000000';
      ctx.lineWidth = Math.max(2, strokeWidth * 0.8);
      ctx.lineJoin = 'round';

      // Layered extrusion slices for solid 3D depth
      for (let s = 1; s <= 4; s++) {
        const off = (s / 4) * shadowOffset;
        ctx.fillText(w.displayText, off, off);
        if (strokeWidth > 0) {
          ctx.strokeText(w.displayText, off, off);
        }
      }
      ctx.restore();
    } else if (style.shadowType === 'neon_glow' || isCurrent && style.animationType === 'glow_pulse') {
      // Radiant multi-layer neon glow aura (Ref Image 1 & Image 4 Style 6)
      const glowColor = isCurrent ? style.highlightColor : style.shadowColor || style.highlightColor;
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = Math.max(16 * scale, shadowBlur * 2);
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
    } else if (style.shadowBlur > 0 && style.shadowType !== 'none') {
      // Standard smooth soft shadow (Ref Image 4 Style 2)
      ctx.shadowColor = style.shadowColor;
      ctx.shadowBlur = shadowBlur;
      ctx.shadowOffsetX = 2 * scale;
      ctx.shadowOffsetY = 4 * scale;
    }

    // C. STROKE / OUTLINE
    if (strokeWidth > 0 && style.wordHighlightStyle !== 'hollow_outline') {
      ctx.strokeStyle = style.strokeColor;
      ctx.lineWidth = strokeWidth;
      ctx.lineJoin = 'round';
      ctx.miterLimit = 2;
      ctx.strokeText(w.displayText, 0, 0);
    }

    // D. FILL TEXT
    if (style.wordHighlightStyle === 'hollow_outline') {
      // Hollow outline inactive words with solid filled active word (Ref Image 7)
      if (isCurrent) {
        ctx.fillStyle = style.highlightColor;
        ctx.fillText(w.displayText, 0, 0);
      } else {
        ctx.strokeStyle = style.strokeColor || '#FFFFFF';
        ctx.lineWidth = Math.max(3 * scale, strokeWidth);
        ctx.lineJoin = 'round';
        ctx.strokeText(w.displayText, 0, 0);
      }
    } else if (isCurrent && style.wordHighlightStyle === 'gradient_fill') {
      // Multi-color karaoke gradient pop (Ref Image 4 Style 3 & Image 5)
      const grad = ctx.createLinearGradient(-w.width / 2, -fontSize / 2, w.width / 2, fontSize / 2);
      grad.addColorStop(0, style.highlightColor);
      grad.addColorStop(1, style.gradientSecondaryColor || '#38BDF8');
      ctx.fillStyle = grad;
      ctx.fillText(w.displayText, 0, 0);
    } else if (isCurrent && (style.wordHighlightStyle === 'pill' || style.wordHighlightStyle === 'box' || style.wordHighlightStyle === 'tilted_box')) {
      // Text color inside active word tag
      ctx.fillStyle = style.wordBgTextColor || '#FFFFFF';
      ctx.fillText(w.displayText, 0, 0);
    } else {
      // Standard word coloring
      ctx.fillStyle = isCurrent ? style.highlightColor : style.primaryColor;
      ctx.fillText(w.displayText, 0, 0);
    }

    ctx.restore();

    currentX += w.width + wordSpacings;
  });

  ctx.restore();
}

/**
 * Draw smooth rounded rectangle
 */
function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
