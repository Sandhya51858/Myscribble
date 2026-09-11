import React, { useState } from 'react';
import {
  Palette,
  Type,
  Sparkles,
  Sliders,
  Check,
  Tag,
  Activity,
  Layers,
  Italic,
  Box,
  Flame,
  Sun,
  Zap,
  Search,
} from 'lucide-react';
import {
  CaptionStyle,
  AnimationType,
  BadgeType,
  TextCasing,
  WordHighlightStyle,
  ShadowStyleType,
} from '../types';
import { CAPTION_PRESETS, AVAILABLE_FONTS, COLOR_PALETTE } from '../data/presets';

interface StyleControlsProps {
  style: CaptionStyle;
  onChange: (updated: Partial<CaptionStyle>) => void;
}

export const StyleControls: React.FC<StyleControlsProps> = ({ style, onChange }) => {
  const [activeTab, setActiveTab] = useState<'presets' | 'highlight' | 'font' | 'colors' | 'anim'>('presets');
  const [fontSearch, setFontSearch] = useState('');
  const [fontCategoryFilter, setFontCategoryFilter] = useState<'All' | 'Trendy' | 'Luxury' | 'Viral' | 'Script'>('All');

  const filteredFonts = AVAILABLE_FONTS.filter((f) => {
    const matchesSearch =
      f.name.toLowerCase().includes(fontSearch.toLowerCase()) ||
      f.value.toLowerCase().includes(fontSearch.toLowerCase()) ||
      f.category.toLowerCase().includes(fontSearch.toLowerCase());
    if (!matchesSearch) return false;
    if (fontCategoryFilter === 'All') return true;
    if (fontCategoryFilter === 'Trendy') {
      return (
        f.name.includes('Ref') ||
        f.category.includes('Trendy') ||
        f.category.includes('Aggressive') ||
        f.category.includes('Experimental') ||
        f.category.includes('Swiss')
      );
    }
    if (fontCategoryFilter === 'Luxury') {
      return f.category.includes('Luxury') || f.name.includes('Luxury') || f.name.includes('Garamond');
    }
    if (fontCategoryFilter === 'Viral') {
      return f.category.includes('Viral') || f.category.includes('Wide') || f.category.includes('Impact') || f.category.includes('Condensed');
    }
    if (fontCategoryFilter === 'Script') {
      return f.category.includes('Script');
    }
    return true;
  });

  return (
    <div id="style-controls-panel" className="flex flex-col h-full min-h-0 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl overflow-hidden backdrop-blur-md">
      {/* 5 Compact Navigation Tabs */}
      <div className="flex border-b border-zinc-800 p-1.5 gap-1 bg-zinc-950/60 shrink-0">
        <button
          id="tab-presets-btn"
          type="button"
          onClick={() => setActiveTab('presets')}
          className={`flex-1 py-1.5 px-1.5 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition-all ${
            activeTab === 'presets'
              ? 'bg-amber-400 text-black shadow-md'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Presets</span>
        </button>

        <button
          id="tab-highlight-btn"
          type="button"
          onClick={() => setActiveTab('highlight')}
          className={`flex-1 py-1.5 px-1.5 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition-all ${
            activeTab === 'highlight'
              ? 'bg-amber-400 text-black shadow-md'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
          }`}
        >
          <Tag className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Badge</span>
        </button>

        <button
          id="tab-font-btn"
          type="button"
          onClick={() => setActiveTab('font')}
          className={`flex-1 py-1.5 px-1.5 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition-all ${
            activeTab === 'font'
              ? 'bg-amber-400 text-black shadow-md'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
          }`}
        >
          <Type className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Font</span>
        </button>

        <button
          id="tab-colors-btn"
          type="button"
          onClick={() => setActiveTab('colors')}
          className={`flex-1 py-1.5 px-1.5 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition-all ${
            activeTab === 'colors'
              ? 'bg-amber-400 text-black shadow-md'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
          }`}
        >
          <Palette className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Colors</span>
        </button>

        <button
          id="tab-anim-btn"
          type="button"
          onClick={() => setActiveTab('anim')}
          className={`flex-1 py-1.5 px-1.5 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition-all ${
            activeTab === 'anim'
              ? 'bg-amber-400 text-black shadow-md'
              : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Motion</span>
        </button>
      </div>

      {/* Tab Content Container */}
      <div className="flex-1 overflow-y-auto p-3.5 custom-scrollbar space-y-4 text-zinc-300 text-xs min-h-0">
        
        {/* ======================================================== */}
        {/* 1. PRESETS GALLERY TAB (Ref Image 1, 3, 4, 10)           */}
        {/* ======================================================== */}
        {activeTab === 'presets' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                Creator & Viral Presets ({CAPTION_PRESETS.length})
              </span>
              <span className="text-[10px] text-amber-400 font-mono">Click to Apply</span>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {CAPTION_PRESETS.map((preset) => {
                const isSelected = style.presetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    id={`preset-btn-${preset.id}`}
                    type="button"
                    onClick={() =>
                      onChange({
                        ...preset.style,
                        positionX: style.positionX ?? 50,
                        positionY: style.positionY ?? 72,
                      })
                    }
                    className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden group ${
                      isSelected
                        ? 'bg-amber-400/10 border-amber-400 shadow-lg ring-1 ring-amber-400/40'
                        : 'bg-zinc-950/60 hover:bg-zinc-900 border-zinc-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-white text-xs sm:text-sm">{preset.name}</div>
                      {isSelected && (
                        <span className="w-5 h-5 rounded-full bg-amber-400 text-black flex items-center justify-center">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                      {preset.description}
                    </p>

                    {/* Accurate Mini Visual Card Preview */}
                    <div className="mt-2 pt-2 border-t border-zinc-800/60 flex items-center gap-2 text-xs">
                      <span
                        style={{
                          color: preset.style.primaryColor,
                          fontFamily: preset.style.fontFamily,
                          textShadow:
                            preset.style.shadowType === 'neon_glow'
                              ? `0 0 10px ${preset.style.highlightColor}`
                              : `0 2px 4px ${preset.style.shadowColor}`,
                        }}
                        className="font-black tracking-wide"
                      >
                        TO GET
                      </span>

                      {/* Highlighted Word Preview Tag */}
                      <span
                        style={{
                          color:
                            preset.style.wordHighlightStyle === 'pill' || preset.style.wordHighlightStyle === 'box'
                              ? preset.style.wordBgTextColor || '#FFF'
                              : preset.style.highlightColor,
                          backgroundColor:
                            preset.style.wordHighlightStyle === 'pill' || preset.style.wordHighlightStyle === 'box'
                              ? preset.style.wordBgColor || preset.style.highlightColor
                              : preset.style.wordHighlightStyle === 'tilted_box'
                              ? preset.style.wordBgColor || '#7C3AED'
                              : 'transparent',
                          fontFamily: preset.style.fontFamily,
                          borderRadius: preset.style.wordHighlightStyle === 'pill' ? '9999px' : '4px',
                          textDecoration: preset.style.wordHighlightStyle === 'underline' ? 'underline' : 'none',
                          borderBottom: preset.style.wordHighlightStyle === 'underline' ? `3px solid ${preset.style.highlightColor}` : 'none',
                          boxShadow:
                            preset.style.shadowType === 'hard_3d'
                              ? '3px 3px 0px #000'
                              : preset.style.shadowType === 'neon_glow'
                              ? `0 0 12px ${preset.style.highlightColor}`
                              : 'none',
                        }}
                        className="px-2 py-0.5 font-black tracking-wide transform group-hover:scale-105 transition-transform"
                      >
                        STARTED
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 2. HIGHLIGHT & BADGE TAB (Ref Image 1, 3, 6, 7, 10)      */}
        {/* ======================================================== */}
        {activeTab === 'highlight' && (
          <div className="space-y-4">
            {/* Active Word Highlight Style */}
            <div className="space-y-2">
              <label className="font-bold text-white flex items-center justify-between">
                <span>Active Word Highlight Style</span>
                <span className="text-[10px] text-amber-400 font-mono">Ref Images 3, 6, 10</span>
              </label>

              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'color', label: 'Color Only', desc: 'Standard text tint' },
                  { id: 'pill', label: 'Capsule Pill', desc: 'Rounded pill tag (Ref 10)' },
                  { id: 'box', label: 'Solid Box', desc: 'Square block tag (Ref 3)' },
                  { id: 'tilted_box', label: 'Kinetic Skewed', desc: 'Angled box (Ref 6)' },
                  { id: 'underline', label: 'Marker Underline', desc: 'Thick strip (Ref 6)' },
                  { id: 'neon_outline', label: 'Neon Glow Outline', desc: 'Radiant halo (Ref 1)' },
                  { id: 'gradient_fill', label: 'Gradient Pop', desc: 'Karaoke 2-color (Ref 4)' },
                  { id: 'hollow_outline', label: 'Hollow Kinetic', desc: 'Hollow outline (Ref 7)' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onChange({ wordHighlightStyle: item.id as WordHighlightStyle })}
                    className={`p-2 rounded-xl border text-left transition-all ${
                      (style.wordHighlightStyle || 'color') === item.id
                        ? 'bg-amber-400 text-black border-amber-400 font-bold shadow-md'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
                    }`}
                  >
                    <div className="text-xs">{item.label}</div>
                    <div className={`text-[10px] ${(style.wordHighlightStyle || 'color') === item.id ? 'text-black/80' : 'text-zinc-500'}`}>
                      {item.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Pill/Box Tag Background Color */}
            {(style.wordHighlightStyle === 'pill' ||
              style.wordHighlightStyle === 'box' ||
              style.wordHighlightStyle === 'tilted_box') && (
              <div className="space-y-2 pt-3 border-t border-zinc-800">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-white">Word Tag Background Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={style.wordBgColor || style.highlightColor}
                      onChange={(e) => onChange({ wordBgColor: e.target.value })}
                      className="w-7 h-7 rounded-lg border border-zinc-700 bg-transparent cursor-pointer"
                    />
                    <span className="font-mono text-[11px] text-zinc-400">{style.wordBgColor || style.highlightColor}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {COLOR_PALETTE.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      title={c.name}
                      style={{ backgroundColor: c.value }}
                      onClick={() => onChange({ wordBgColor: c.value })}
                      className={`w-6 h-6 rounded-full border border-black/30 shadow-sm transition-transform ${
                        (style.wordBgColor || style.highlightColor).toLowerCase() === c.value.toLowerCase()
                          ? 'scale-125 ring-2 ring-amber-400'
                          : 'hover:scale-110'
                      }`}
                    />
                  ))}
                </div>

                {/* Word Tag Text Color */}
                <div className="flex items-center justify-between pt-2">
                  <span className="text-zinc-400">Word Text Inside Tag</span>
                  <div className="flex gap-1">
                    {['#FFFFFF', '#000000', '#FACC15', '#00F0FF'].map((tc) => (
                      <button
                        key={tc}
                        type="button"
                        onClick={() => onChange({ wordBgTextColor: tc })}
                        style={{ backgroundColor: tc }}
                        className={`w-6 h-6 rounded-lg border border-zinc-700 ${
                          (style.wordBgTextColor || '#FFFFFF') === tc ? 'ring-2 ring-amber-400' : ''
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* FULL-LINE BACKDROP BAR (Ref Image 2 "Backdrop Edit", Image 4 Style 5) */}
            <div className="space-y-2 pt-3 border-t border-zinc-800">
              <label className="font-bold text-white flex items-center justify-between">
                <span>Full-Line Backdrop Bar</span>
                <span className="text-[10px] text-zinc-400">Ref Image 2 & 4</span>
              </label>

              <div className="grid grid-cols-3 gap-2">
                {(['none', 'box', 'pill'] as BadgeType[]).map((badge) => (
                  <button
                    key={badge}
                    type="button"
                    onClick={() => onChange({ badgeType: badge })}
                    className={`py-1.5 rounded-lg border text-center font-semibold capitalize text-xs transition-all ${
                      style.badgeType === badge
                        ? 'bg-amber-400 text-black border-amber-400'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {badge === 'none' ? 'No Backdrop' : badge === 'box' ? 'Dark Box' : 'Capsule Bar'}
                  </button>
                ))}
              </div>

              {style.badgeType !== 'none' && (
                <div className="space-y-2 mt-2 pt-2 border-t border-zinc-800/60">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400">Backdrop Opacity</span>
                    <span className="font-mono text-zinc-300">{Math.round(style.badgeOpacity * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min={0.2}
                    max={1}
                    step={0.05}
                    value={style.badgeOpacity}
                    onChange={(e) => onChange({ badgeOpacity: parseFloat(e.target.value) })}
                    className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 3. FONT & TYPOGRAPHY TAB (Ref Image 1, 2, 4, 8, 9, 10)    */}
        {/* ======================================================== */}
        {activeTab === 'font' && (
          <div className="space-y-4">
            {/* Font Family Selection */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="font-bold text-white flex items-center gap-1.5">
                  <Type className="w-4 h-4 text-amber-400" />
                  <span>Font Family ({filteredFonts.length})</span>
                </label>
                <span className="text-[10px] text-amber-400 font-mono">Trendy & Luxury Collection</span>
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 custom-scrollbar">
                {(['All', 'Trendy', 'Luxury', 'Viral', 'Script'] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setFontCategoryFilter(cat)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all ${
                      fontCategoryFilter === cat
                        ? 'bg-amber-400 text-black shadow-sm'
                        : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search fonts (e.g. Batica, Craos, Butler)..."
                  value={fontSearch}
                  onChange={(e) => setFontSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-zinc-950/80 border border-zinc-800 rounded-xl text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Font List */}
              <div className="grid grid-cols-1 gap-1.5 max-h-60 overflow-y-auto custom-scrollbar p-1">
                {filteredFonts.length === 0 ? (
                  <div className="py-6 text-center text-xs text-zinc-500">
                    No fonts found matching "{fontSearch}".
                  </div>
                ) : (
                  filteredFonts.map((f) => (
                    <button
                      key={f.value}
                      type="button"
                      style={{ fontFamily: f.value }}
                      onClick={() => onChange({ fontFamily: f.value })}
                      className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between group ${
                        style.fontFamily === f.value
                          ? 'bg-amber-400 text-black border-amber-400 shadow-md'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex flex-col">
                        <span className="text-sm font-bold tracking-tight">{f.name}</span>
                        <span
                          className={`text-[10px] font-sans ${
                            style.fontFamily === f.value ? 'text-black/80' : 'text-zinc-500 group-hover:text-zinc-400'
                          }`}
                        >
                          Preview: The quick brown fox jumps
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-sans px-2 py-0.5 rounded-md shrink-0 ml-2 ${
                          style.fontFamily === f.value
                            ? 'bg-black/10 text-black font-semibold'
                            : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
                        }`}
                      >
                        {f.category}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Font Size & Italic */}
            <div className="space-y-2 pt-3 border-t border-zinc-800">
              <div className="flex items-center justify-between">
                <label className="font-bold text-white">Font Size</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onChange({ isItalic: !style.isItalic })}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold border flex items-center gap-1 ${
                      style.isItalic ? 'bg-amber-400 text-black border-amber-400' : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                    }`}
                  >
                    <Italic className="w-3 h-3" />
                    <span>Italic</span>
                  </button>
                  <span className="font-mono text-zinc-300">{style.fontSize}px</span>
                </div>
              </div>
              <input
                id="font-size-slider"
                type="range"
                min={34}
                max={92}
                step={2}
                value={style.fontSize}
                onChange={(e) => onChange({ fontSize: parseInt(e.target.value) })}
                className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
              />
            </div>

            {/* Letter Casing */}
            <div className="space-y-2 pt-3 border-t border-zinc-800">
              <label className="font-bold text-white">Letter Casing</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'ALL CAPS', val: 'uppercase' },
                  { label: 'Title Case', val: 'capitalize' },
                  { label: 'Normal', val: 'none' },
                ].map((c) => (
                  <button
                    key={c.val}
                    type="button"
                    onClick={() => onChange({ textTransform: c.val as TextCasing })}
                    className={`py-1.5 rounded-lg border text-center font-semibold text-[11px] transition-all ${
                      style.textTransform === c.val
                        ? 'bg-amber-400 text-black border-amber-400'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Words Per Screen */}
            <div className="space-y-2 pt-3 border-t border-zinc-800">
              <label className="font-bold text-white">Words Per Line</label>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { label: '1 Word', val: 1 },
                  { label: '2 Words', val: 2 },
                  { label: '3 Words', val: 3 },
                  { label: 'Full Line', val: 0 },
                ].map((w) => (
                  <button
                    key={w.val}
                    type="button"
                    onClick={() => onChange({ wordsPerLine: w.val })}
                    className={`py-1.5 rounded-lg border text-center font-semibold text-[11px] transition-all ${
                      style.wordsPerLine === w.val
                        ? 'bg-amber-400 text-black border-amber-400'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {w.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Rotation Tilt Slider */}
            <div className="space-y-2 pt-3 border-t border-zinc-800">
              <div className="flex items-center justify-between">
                <label className="font-bold text-white">Tilt Angle (Kinetic Skew)</label>
                <span className="font-mono text-zinc-300">{style.rotation || 0}°</span>
              </div>
              <input
                type="range"
                min={-12}
                max={12}
                step={1}
                value={style.rotation || 0}
                onChange={(e) => onChange({ rotation: parseInt(e.target.value) })}
                className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
              />
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 4. COLORS, STROKE & 3D SHADOWS TAB (Ref Image 1, 4, 8, 9) */}
        {/* ======================================================== */}
        {activeTab === 'colors' && (
          <div className="space-y-4">
            {/* Active Word Highlight Color */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-bold text-white">Active Word Highlight Color</label>
                <div className="flex items-center gap-2">
                  <input
                    id="highlight-color-picker"
                    type="color"
                    value={style.highlightColor}
                    onChange={(e) => onChange({ highlightColor: e.target.value })}
                    className="w-7 h-7 rounded-lg border border-zinc-700 bg-transparent cursor-pointer"
                  />
                  <span className="font-mono text-[11px] text-zinc-400">{style.highlightColor}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {COLOR_PALETTE.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    title={c.name}
                    style={{ backgroundColor: c.value }}
                    onClick={() => onChange({ highlightColor: c.value })}
                    className={`w-6 h-6 rounded-full border border-black/30 shadow-sm transition-transform ${
                      style.highlightColor.toLowerCase() === c.value.toLowerCase() ? 'scale-125 ring-2 ring-amber-400' : 'hover:scale-110'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Gradient Secondary Color (When using Karaoke / Gradient fill) */}
            {style.wordHighlightStyle === 'gradient_fill' && (
              <div className="space-y-2 pt-3 border-t border-zinc-800">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-white">Gradient 2nd Color (Karaoke Pop)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={style.gradientSecondaryColor || '#06B6D4'}
                      onChange={(e) => onChange({ gradientSecondaryColor: e.target.value })}
                      className="w-7 h-7 rounded-lg border border-zinc-700 bg-transparent cursor-pointer"
                    />
                    <span className="font-mono text-[11px] text-zinc-400">{style.gradientSecondaryColor || '#06B6D4'}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Primary Words Color */}
            <div className="space-y-2 pt-3 border-t border-zinc-800">
              <div className="flex items-center justify-between">
                <label className="font-bold text-white">Primary Words Color</label>
                <div className="flex items-center gap-2">
                  <input
                    id="primary-color-picker"
                    type="color"
                    value={style.primaryColor}
                    onChange={(e) => onChange({ primaryColor: e.target.value })}
                    className="w-7 h-7 rounded-lg border border-zinc-700 bg-transparent cursor-pointer"
                  />
                  <span className="font-mono text-[11px] text-zinc-400">{style.primaryColor}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {COLOR_PALETTE.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    title={c.name}
                    style={{ backgroundColor: c.value }}
                    onClick={() => onChange({ primaryColor: c.value })}
                    className={`w-6 h-6 rounded-full border border-black/30 shadow-sm transition-transform ${
                      style.primaryColor.toLowerCase() === c.value.toLowerCase() ? 'scale-125 ring-2 ring-amber-400' : 'hover:scale-110'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Stroke / Outline */}
            <div className="space-y-2 pt-3 border-t border-zinc-800">
              <div className="flex items-center justify-between">
                <label className="font-bold text-white">Stroke / Outline Width</label>
                <div className="flex items-center gap-2">
                  <input
                    id="stroke-color-picker"
                    type="color"
                    value={style.strokeColor}
                    onChange={(e) => onChange({ strokeColor: e.target.value })}
                    className="w-7 h-7 rounded-lg border border-zinc-700 bg-transparent cursor-pointer"
                  />
                  <span className="font-mono text-[11px] text-zinc-400">{style.strokeWidth}px</span>
                </div>
              </div>
              <input
                id="stroke-width-slider"
                type="range"
                min={0}
                max={18}
                step={1}
                value={style.strokeWidth}
                onChange={(e) => onChange({ strokeWidth: parseInt(e.target.value) })}
                className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
              />
            </div>

            {/* SHADOW & 3D EXTRUSION (Ref Image 1, 4, 8, 9) */}
            <div className="space-y-2 pt-3 border-t border-zinc-800">
              <label className="font-bold text-white flex items-center justify-between">
                <span>Shadow & 3D Depth</span>
                <span className="text-[10px] text-amber-400 font-mono">Ref Images 4, 8, 9</span>
              </label>

              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'soft', label: 'Soft Cinema', desc: 'Smooth diffuse shadow (Ref 4)' },
                  { id: 'hard_3d', label: '3D Block Shadow', desc: 'Extruded solid depth (Ref 8/9)' },
                  { id: 'neon_glow', label: 'Radiant Glow', desc: 'Neon aura (Ref 1 & 4)' },
                  { id: 'none', label: 'No Shadow', desc: 'Flat clean text' },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => onChange({ shadowType: s.id as ShadowStyleType })}
                    className={`p-2 rounded-xl border text-left transition-all ${
                      (style.shadowType || 'soft') === s.id
                        ? 'bg-amber-400 text-black border-amber-400 font-bold shadow-md'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
                    }`}
                  >
                    <div className="text-xs">{s.label}</div>
                    <div className={`text-[10px] ${(style.shadowType || 'soft') === s.id ? 'text-black/80' : 'text-zinc-500'}`}>
                      {s.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 5. MOTION & KINETIC ANIMATIONS TAB (Ref Image 1, 6, 7)    */}
        {/* ======================================================== */}
        {activeTab === 'anim' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="font-bold text-white flex items-center justify-between">
                <span>Active Word Animation</span>
                <span className="text-[10px] text-amber-400 font-mono">60fps Smooth</span>
              </label>

              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'pop', name: '💥 Scale Pop', desc: 'Hormozi punchy jump' },
                  { id: 'bounce', name: '🦘 Vertical Hop', desc: 'Elastic bouncy spring' },
                  { id: 'elastic', name: '⚡ Kinetic Elastic', desc: 'Squash & stretch (Ref 7)' },
                  { id: 'wave', name: '🌊 Wobbly Tilt', desc: 'Rotational kinetic wave' },
                  { id: 'glow_pulse', name: '✨ Glow Pulse', desc: 'Radiant aura pulse (Ref 1)' },
                  { id: 'slide_up', name: '⬆️ Slide Up', desc: 'Smooth upward enter' },
                  { id: 'karaoke', name: '🎤 Karaoke Sweep', desc: 'Progressive color fill' },
                  { id: 'none', name: '⏸️ Static', desc: 'Color only, no movement' },
                ].map((anim) => (
                  <button
                    key={anim.id}
                    type="button"
                    onClick={() => onChange({ animationType: anim.id as AnimationType })}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      style.animationType === anim.id
                        ? 'bg-amber-400 text-black border-amber-400 font-bold shadow-md'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
                    }`}
                  >
                    <div className="text-xs">{anim.name}</div>
                    <div className={`text-[10px] ${style.animationType === anim.id ? 'text-black/80' : 'text-zinc-500'}`}>
                      {anim.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Vertical Position (Y-Axis) */}
            <div className="space-y-2 pt-3 border-t border-zinc-800">
              <div className="flex items-center justify-between">
                <label className="font-bold text-white">Vertical Position (Y-Axis)</label>
                <span className="font-mono text-zinc-300">{style.positionY}%</span>
              </div>
              <input
                id="position-y-slider"
                type="range"
                min={15}
                max={88}
                step={1}
                value={style.positionY}
                onChange={(e) => onChange({ positionY: parseInt(e.target.value) })}
                className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
              />
              <div className="grid grid-cols-4 gap-1 pt-1">
                {[
                  { label: 'Top', val: 20 },
                  { label: 'Center', val: 50 },
                  { label: 'Reels', val: 72 },
                  { label: 'Bottom', val: 82 },
                ].map((pos) => (
                  <button
                    key={pos.val}
                    type="button"
                    onClick={() => onChange({ positionY: pos.val })}
                    className={`py-1 rounded text-[10px] font-semibold border transition-all ${
                      style.positionY === pos.val
                        ? 'bg-amber-400 text-black border-amber-400'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {pos.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
