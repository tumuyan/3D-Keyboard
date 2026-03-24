import React, { useState, useRef, useEffect, useCallback } from 'react';
import { KeyboardScene, PROFILES, FONTS } from './components/Keyboard3D';
import { Upload, Download, Code, Settings2, Type, ImageIcon, SlidersHorizontal, Box, ChevronDown, X } from 'lucide-react';

const DEFAULT_KLE = `[
  [{"a":7},"Q","W","E","R","T","Y","U","I","O","P"],
  [{"x":0.5},"A","S","D","F","G","H","J","K","L"],
  [{"w":1.5},"Shift","Z","X","C","V","B","N","M",{"w":1.5},"Del"],
  [{"w":2},"123",",",{"w":4},"",".",{"w":2},"Enter"]
]`;

export default function App() {
  const [kleData, setKleData] = useState(DEFAULT_KLE);
  const [textureUrl, setTextureUrl] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Controls
  const [profile, setProfile] = useState('OEM');
  const [keycapColor, setKeycapColor] = useState('#e2e8f0');
  const [baseColor, setBaseColor] = useState('#cbd5e1');
  const [keyGapX, setKeyGapX] = useState(0.1);
  const [keyGapY, setKeyGapY] = useState(0.1);

  const [caseTopEdgeBevel, setCaseTopEdgeBevel] = useState(0.3);
  const [caseBottomEdgeBevel, setCaseBottomEdgeBevel] = useState(0.3);
  const [caseSideEdgeBevel, setCaseSideEdgeBevel] = useState(0.01);
  const [caseTopCornerRadius, setCaseTopCornerRadius] = useState(0.05);
  const [caseBottomCornerRadius, setCaseBottomCornerRadius] = useState(0.05);
  const [keycapHeightAboveCase, setKeycapHeightAboveCase] = useState(0.02);

  const [showLabels, setShowLabels] = useState(true);
  const [labelPosition, setLabelPosition] = useState('top-left');
  const [labelColor, setLabelColor] = useState('#334155');
  const [labelOutlineColor, setLabelOutlineColor] = useState('#000000');
  const [labelOutlineWidth, setLabelOutlineWidth] = useState(0);
  const [fontName, setFontName] = useState('Inter');

  const [textureScale, setTextureScale] = useState(1);
  const [textureOffsetX, setTextureOffsetX] = useState(0);
  const [textureOffsetY, setTextureOffsetY] = useState(0);
  const [textureAspect, setTextureAspect] = useState(1);
  const [textureRotation, setTextureRotation] = useState(0);
  const [textureOpacity, setTextureOpacity] = useState(1);
  const [baseOpacity, setBaseOpacity] = useState(1);
  const [outOfBoundsMode, setOutOfBoundsMode] = useState('clamp');
  const [textureMapping, setTextureMapping] = useState('projected');
  const [showShadows, setShowShadows] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Responsive detection
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Mobile bottom panel: draggable height & collapse
  const [mobilePanelOpen, setMobilePanelOpen] = useState(true);
  const [mobilePanelHeight, setMobilePanelHeight] = useState(55); // percent of viewport
  const [isDragging, setIsDragging] = useState(false);
  const dragStartY = useRef(0);
  const dragStartHeight = useRef(0);

  const handleDragStart = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    setIsDragging(true);
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    dragStartY.current = clientY;
    dragStartHeight.current = mobilePanelHeight;
  }, [mobilePanelHeight]);

  const handleDragMove = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (!isDragging) return;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const delta = dragStartY.current - clientY;
    const vh = window.innerHeight;
    const deltaPercent = (delta / vh) * 100;
    const newHeight = Math.min(85, Math.max(30, dragStartHeight.current + deltaPercent));
    setMobilePanelHeight(newHeight);
  }, [isDragging]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (!isDragging) return;
    const onTouchMove = (e: TouchEvent) => handleDragMove(e as unknown as React.TouchEvent);
    const onTouchEnd = () => handleDragEnd();
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);
    window.addEventListener('mousemove', onTouchMove);
    window.addEventListener('mouseup', onTouchEnd);
    return () => {
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('mousemove', onTouchMove);
      window.removeEventListener('mouseup', onTouchEnd);
    };
  }, [isDragging, handleDragMove, handleDragEnd]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setTextureUrl(url);
    }
  };

  const [exportFormat, setExportFormat] = useState<'png' | 'jpg' | 'webp'>('png');

  const FORMAT_MIME: Record<string, string> = { png: 'image/png', jpg: 'image/jpeg', webp: 'image/webp' };

  const handleExport = () => {
    if (canvasRef.current) {
      const mime = FORMAT_MIME[exportFormat] || 'image/png';
      const dataUrl = canvasRef.current.toDataURL(mime, 0.95);
      const link = document.createElement('a');
      link.download = `keyboard-3d.${exportFormat}`;
      link.href = dataUrl;
      link.click();
    }
  };

  const keyboardSceneProps = {
    kleData,
    textureUrl,
    canvasRef,
    textureScale,
    textureOffsetX,
    textureOffsetY,
    textureAspect,
    textureRotation,
    textureOpacity,
    baseOpacity,
    outOfBoundsMode,
    textureMapping,
    showLabels,
    labelPosition,
    profile,
    labelColor,
    labelOutlineColor,
    labelOutlineWidth,
    fontUrl: FONTS[fontName],
    keycapColor,
    baseColor,
    keyGapX,
    keyGapY,
    caseTopEdgeBevel,
    caseBottomEdgeBevel,
    caseSideEdgeBevel,
    caseTopCornerRadius,
    caseBottomCornerRadius,
    keycapHeightAboveCase,
    showShadows,
  };

  return isMobile ? (
    <div className="flex flex-col h-[100dvh] w-full bg-slate-50 text-slate-900 font-sans overflow-hidden select-none">
      {/* Top: 3D Preview */}
      <div className="flex-1 relative bg-slate-100 touch-none min-h-0">
        <KeyboardScene {...keyboardSceneProps} />

        {/* Floating export button with format selector */}
        <div className="absolute top-3 right-3 z-10 flex items-center gap-1 bg-white/90 backdrop-blur-md rounded-xl shadow-md border border-slate-200/50 overflow-hidden">
          {(['png', 'jpg', 'webp'] as const).map(fmt => (
            <button
              key={fmt}
              onClick={() => { setExportFormat(fmt); handleExport(); }}
              className={`px-2.5 py-1.5 text-[10px] font-semibold uppercase transition-colors ${exportFormat === fmt ? 'bg-indigo-600 text-white' : 'text-slate-600 active:bg-slate-100'}`}
            >
              {fmt}
            </button>
          ))}
        </div>

        {/* Open panel button when panel is closed */}
        {!mobilePanelOpen && (
          <button
            onClick={() => setMobilePanelOpen(true)}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 text-white text-xs font-semibold rounded-full shadow-lg active:scale-95 transition-transform"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Parameters
          </button>
        )}

        {/* Instructions - top left */}
        <div className="absolute top-3 left-3 bg-white/80 backdrop-blur-md px-2.5 py-1.5 rounded-lg shadow-sm border border-slate-200/50 text-[10px] text-slate-500 pointer-events-none">
          Touch to rotate • Pinch to zoom
        </div>
      </div>

      {/* Bottom: Control Panel (draggable) */}
      {!mobilePanelOpen ? null : (
      <div
        className="relative bg-white border-t border-slate-200 flex flex-col shadow-[0_-4px_20px_rgba(0,0,0,0.08)]"
        style={{ height: `${mobilePanelHeight}dvh`, minHeight: '30dvh', maxHeight: '85dvh' }}
      >
        {/* Drag Handle */}
        <div
          className="flex-shrink-0 flex justify-center pt-2.5 pb-1.5 cursor-grab active:cursor-grabbing touch-none z-10"
          onTouchStart={handleDragStart}
          onMouseDown={handleDragStart}
        >
          <div className={`w-10 h-1 rounded-full transition-colors ${isDragging ? 'bg-indigo-400' : 'bg-slate-300'}`} />
        </div>

        {/* Collapsible Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain min-h-0 px-4 pb-6 space-y-5 scroll-smooth">
          {/* Compact header */}
          <div className="flex items-center justify-between pt-1 pb-2 border-b border-slate-100">
            <h1 className="text-base font-bold tracking-tight text-slate-900 flex items-center gap-1.5">
              <Code className="w-4 h-4 text-indigo-600" />
              Keycap 3D
            </h1>
            <div className="flex items-center gap-2">
              <button onClick={handleExport} className="text-[10px] text-indigo-600 font-semibold px-2 py-1 bg-indigo-50 rounded-lg active:bg-indigo-100">
                Export {exportFormat.toUpperCase()}
              </button>
              <button
                onClick={() => setMobilePanelOpen(false)}
                className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>

          {/* KLE Input */}
          <details className="group">
            <summary className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer list-none py-1">
              <Code className="w-3.5 h-3.5" />
              KLE JSON
              <ChevronDown className="w-3.5 h-3.5 ml-auto transition-transform group-open:rotate-180" />
            </summary>
            <textarea
              value={kleData}
              onChange={(e) => setKleData(e.target.value)}
              className="w-full h-20 p-2 font-mono text-[10px] bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-none mt-1"
              spellCheck={false}
            />
          </details>

          {/* Keycap Settings */}
          <details className="group" open>
            <summary className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer list-none py-1 border-b border-slate-100">
              <Settings2 className="w-3.5 h-3.5" />
              Keycap Settings
              <ChevronDown className="w-3.5 h-3.5 ml-auto transition-transform group-open:rotate-180" />
            </summary>
            <div className="space-y-2 mt-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-600">Profile</span>
                <select value={profile} onChange={(e) => setProfile(e.target.value)} className="bg-slate-50 border border-slate-200 text-[11px] rounded-lg px-2 py-1 focus:ring-2 focus:ring-indigo-500 outline-none">
                  {Object.keys(PROFILES).map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-600">Color</span>
                <input type="color" value={keycapColor} onChange={(e) => setKeycapColor(e.target.value)} className="w-7 h-7 rounded cursor-pointer border-0 p-0" />
              </div>

              <SliderControl label="Gap X" value={keyGapX} min={0} max={0.3} step={0.01} onChange={setKeyGapX} />
              <SliderControl label="Gap Y" value={keyGapY} min={0} max={0.3} step={0.01} onChange={setKeyGapY} />
              <SliderControl label="Height Above Case" value={keycapHeightAboveCase} min={0} max={0.5} step={0.01} onChange={setKeycapHeightAboveCase} />
            </div>
          </details>

          {/* Keyboard Case */}
          <details className="group">
            <summary className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer list-none py-1 border-b border-slate-100">
              <Box className="w-3.5 h-3.5" />
              Keyboard Case
              <ChevronDown className="w-3.5 h-3.5 ml-auto transition-transform group-open:rotate-180" />
            </summary>
            <div className="space-y-2 mt-2">
              <ToggleControl label="Shadows" checked={showShadows} onChange={setShowShadows} />
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-600">Base Color</span>
                <input type="color" value={baseColor} onChange={(e) => setBaseColor(e.target.value)} className="w-7 h-7 rounded cursor-pointer border-0 p-0" />
              </div>
              <SliderControl label="Top Bevel" value={caseTopEdgeBevel} min={0} max={0.4} step={0.01} onChange={setCaseTopEdgeBevel} />
              <SliderControl label="Bottom Bevel" value={caseBottomEdgeBevel} min={0} max={0.4} step={0.01} onChange={setCaseBottomEdgeBevel} />
              <SliderControl label="Side Bevel" value={caseSideEdgeBevel} min={0} max={0.4} step={0.01} onChange={setCaseSideEdgeBevel} />
              <SliderControl label="Top Corner" value={caseTopCornerRadius} min={0} max={0.5} step={0.01} onChange={setCaseTopCornerRadius} />
              <SliderControl label="Bottom Corner" value={caseBottomCornerRadius} min={0} max={0.5} step={0.01} onChange={setCaseBottomCornerRadius} />
            </div>
          </details>

          {/* Label Settings */}
          <details className="group">
            <summary className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer list-none py-1 border-b border-slate-100">
              <Type className="w-3.5 h-3.5" />
              Label Settings
              <ChevronDown className="w-3.5 h-3.5 ml-auto transition-transform group-open:rotate-180" />
            </summary>
            <div className="space-y-2 mt-2">
              <ToggleControl label="Show Labels" checked={showLabels} onChange={setShowLabels} />
              {showLabels && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-600">Position</span>
                    <select value={labelPosition} onChange={(e) => setLabelPosition(e.target.value)} className="bg-slate-50 border border-slate-200 text-[11px] rounded-lg px-2 py-1 focus:ring-2 focus:ring-indigo-500 outline-none">
                      <option value="top-left">Top Left</option>
                      <option value="top-center">Top Center</option>
                      <option value="top-right">Top Right</option>
                      <option value="mid-left">Mid Left</option>
                      <option value="mid-center">Mid Center</option>
                      <option value="mid-right">Mid Right</option>
                      <option value="bot-left">Bot Left</option>
                      <option value="bot-center">Bot Center</option>
                      <option value="bot-right">Bot Right</option>
                      <option value="front-left">Front Left</option>
                      <option value="front-center">Front Center</option>
                      <option value="front-right">Front Right</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-600">Font</span>
                    <select value={fontName} onChange={(e) => setFontName(e.target.value)} className="bg-slate-50 border border-slate-200 text-[11px] rounded-lg px-2 py-1 focus:ring-2 focus:ring-indigo-500 outline-none">
                      {Object.keys(FONTS).map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-600">Fill</span>
                    <input type="color" value={labelColor} onChange={(e) => setLabelColor(e.target.value)} className="w-7 h-7 rounded cursor-pointer border-0 p-0" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-600">Stroke</span>
                    <input type="color" value={labelOutlineColor} onChange={(e) => setLabelOutlineColor(e.target.value)} className="w-7 h-7 rounded cursor-pointer border-0 p-0" />
                  </div>
                  <SliderControl label="Stroke Width" value={labelOutlineWidth} min={0} max={0.05} step={0.001} onChange={setLabelOutlineWidth} decimals={3} />
                </>
              )}
            </div>
          </details>

          {/* Texture Settings */}
          <details className="group" open>
            <summary className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer list-none py-1 border-b border-slate-100">
              <ImageIcon className="w-3.5 h-3.5" />
              Global Texture
              <ChevronDown className="w-3.5 h-3.5 ml-auto transition-transform group-open:rotate-180" />
            </summary>
            <div className="space-y-2 mt-2">
              <label className="flex flex-col items-center justify-center w-full h-16 border-2 border-slate-200 border-dashed rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors group">
                <div className="flex flex-col items-center justify-center">
                  <Upload className="w-5 h-5 mb-0.5 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                  <p className="text-[10px] text-slate-500"><span className="font-semibold text-indigo-600">Upload Image</span></p>
                </div>
                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
              </label>

              {textureUrl && (
                <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <SlidersHorizontal className="w-3 h-3" /> Adjustments
                    </span>
                    <button onClick={() => setTextureUrl(null)} className="text-[10px] text-red-500 hover:text-red-700 font-medium">Remove</button>
                  </div>

                  <SliderControl label="Scale" value={textureScale} min={0.1} max={3} step={0.01} onChange={setTextureScale} suffix="x" />
                  <SliderControl label="Offset X" value={textureOffsetX} min={-1} max={1} step={0.01} onChange={setTextureOffsetX} />
                  <SliderControl label="Offset Y" value={textureOffsetY} min={-1} max={1} step={0.01} onChange={setTextureOffsetY} />
                  <SliderControl label="Aspect Ratio" value={textureAspect} min={0.5} max={2} step={0.01} onChange={setTextureAspect} />
                  <SliderControl label="Rotation" value={textureRotation} min={0} max={360} step={1} onChange={setTextureRotation} suffix="°" decimals={0} />
                  <SliderControl label="Keycap Opacity" value={textureOpacity} min={0} max={1} step={0.01} onChange={setTextureOpacity} suffix="%" displayPercent />
                  <SliderControl label="Base Opacity" value={baseOpacity} min={0} max={1} step={0.01} onChange={setBaseOpacity} suffix="%" displayPercent />

                  <div className="pt-2 border-t border-slate-200 space-y-2">
                    <div>
                      <span className="text-[10px] text-slate-600">Out of Bounds</span>
                      <select value={outOfBoundsMode} onChange={(e) => setOutOfBoundsMode(e.target.value)} className="w-full text-[11px] p-1 mt-1 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500">
                        <option value="clamp">Clamp to Edge</option>
                        <option value="transparent">Transparent</option>
                        <option value="repeat">Repeat</option>
                        <option value="mirror">Mirror Repeat</option>
                      </select>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-600">Mapping</span>
                      <select value={textureMapping} onChange={(e) => setTextureMapping(e.target.value)} className="w-full text-[11px] p-1 mt-1 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500">
                        <option value="fitted">Fitted (No Overlap)</option>
                        <option value="unfolded">Unfolded (Overlap)</option>
                        <option value="projected">Planar (Smear)</option>
                        <option value="per-key">Per-Keycap</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </details>

          {/* Bottom padding for safe area */}
          <div className="h-safe-bottom" />
        </div>
      </div>
      )}
    </div>
  ) : (
    (/* Desktop Layout */
    <div className="flex h-screen w-full bg-slate-50 text-slate-900 font-sans overflow-hidden">
      {/* Sidebar */}
      <div className={`${isSidebarOpen ? 'w-96' : 'hidden'} flex-shrink-0 border-r border-slate-200 bg-white flex flex-col shadow-sm transition-all`}>
        <div className="p-4 md:p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <Code className="w-5 h-5 md:w-6 md:h-6 text-indigo-600" />
              Keycap 3D
            </h1>
            <p className="text-xs md:text-sm text-slate-500 mt-1">Visualize custom keyboard layouts with global textures.</p>
          </div>
          {isSidebarOpen && (
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 md:space-y-8">
          {/* KLE Input */}
          <div className="space-y-2 md:space-y-3">
            <label className="flex items-center gap-2 text-xs md:text-sm font-semibold text-slate-700">
              <Code className="w-4 h-4" />
              KLE JSON
            </label>
            <textarea
              value={kleData}
              onChange={(e) => setKleData(e.target.value)}
              className="w-full h-24 md:h-32 p-2 md:p-3 font-mono text-[10px] md:text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-none"
              spellCheck={false}
            />
          </div>

          {/* Keycap Settings */}
          <div className="space-y-3 md:space-y-4">
            <label className="flex items-center gap-2 text-xs md:text-sm font-semibold text-slate-700 border-b border-slate-100 pb-2">
              <Settings2 className="w-4 h-4" />
              Keycap Settings
            </label>
            <div className="space-y-2 md:space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs md:text-sm text-slate-600">Profile</span>
                <select value={profile} onChange={(e) => setProfile(e.target.value)} className="bg-slate-50 border border-slate-200 text-xs md:text-sm rounded-lg px-2 md:px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 outline-none">
                  {Object.keys(PROFILES).map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs md:text-sm text-slate-600">Keycap Color</span>
                <input type="color" value={keycapColor} onChange={(e) => setKeycapColor(e.target.value)} className="w-6 h-6 md:w-8 md:h-8 rounded cursor-pointer border-0 p-0" />
              </div>
              <DesktopSlider label="Key Gap X" value={keyGapX} min={0} max={0.3} step={0.01} onChange={setKeyGapX} />
              <DesktopSlider label="Key Gap Y" value={keyGapY} min={0} max={0.3} step={0.01} onChange={setKeyGapY} />
              <DesktopSlider label="Height Above Case" value={keycapHeightAboveCase} min={0} max={0.5} step={0.01} onChange={setKeycapHeightAboveCase} />
            </div>
          </div>

          {/* Keyboard Case Settings */}
          <div className="space-y-3 md:space-y-4">
            <label className="flex items-center gap-2 text-xs md:text-sm font-semibold text-slate-700 border-b border-slate-100 pb-2">
              <Box className="w-4 h-4" />
              Keyboard Case
            </label>
            <div className="space-y-2 md:space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs md:text-sm text-slate-600">Shadows</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={showShadows} onChange={(e) => setShowShadows(e.target.checked)} />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs md:text-sm text-slate-600">Base Color</span>
                <input type="color" value={baseColor} onChange={(e) => setBaseColor(e.target.value)} className="w-6 h-6 md:w-8 md:h-8 rounded cursor-pointer border-0 p-0" />
              </div>
              <DesktopSlider label="Top Edge Bevel" value={caseTopEdgeBevel} min={0} max={0.4} step={0.01} onChange={setCaseTopEdgeBevel} />
              <DesktopSlider label="Bottom Edge Bevel" value={caseBottomEdgeBevel} min={0} max={0.4} step={0.01} onChange={setCaseBottomEdgeBevel} />
              <DesktopSlider label="Side Edge Bevel" value={caseSideEdgeBevel} min={0} max={0.4} step={0.01} onChange={setCaseSideEdgeBevel} />
              <DesktopSlider label="Top Corner Radius" value={caseTopCornerRadius} min={0} max={0.5} step={0.01} onChange={setCaseTopCornerRadius} />
              <DesktopSlider label="Bottom Corner Radius" value={caseBottomCornerRadius} min={0} max={0.5} step={0.01} onChange={setCaseBottomCornerRadius} />
            </div>
          </div>

          {/* Label Settings */}
          <div className="space-y-3 md:space-y-4">
            <label className="flex items-center gap-2 text-xs md:text-sm font-semibold text-slate-700 border-b border-slate-100 pb-2">
              <Type className="w-4 h-4" />
              Label Settings
            </label>
            <div className="space-y-2 md:space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs md:text-sm text-slate-600">Show Labels</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={showLabels} onChange={(e) => setShowLabels(e.target.checked)} />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
              {showLabels && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-xs md:text-sm text-slate-600">Position</span>
                    <select value={labelPosition} onChange={(e) => setLabelPosition(e.target.value)} className="bg-slate-50 border border-slate-200 text-xs md:text-sm rounded-lg px-2 md:px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 outline-none">
                      <option value="top-left">Top Left</option>
                      <option value="top-center">Top Center</option>
                      <option value="top-right">Top Right</option>
                      <option value="mid-left">Mid Left</option>
                      <option value="mid-center">Mid Center</option>
                      <option value="mid-right">Mid Right</option>
                      <option value="bot-left">Bot Left</option>
                      <option value="bot-center">Bot Center</option>
                      <option value="bot-right">Bot Right</option>
                      <option value="front-left">Front Left</option>
                      <option value="front-center">Front Center</option>
                      <option value="front-right">Front Right</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs md:text-sm text-slate-600">Font</span>
                    <select value={fontName} onChange={(e) => setFontName(e.target.value)} className="bg-slate-50 border border-slate-200 text-xs md:text-sm rounded-lg px-2 md:px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 outline-none">
                      {Object.keys(FONTS).map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs md:text-sm text-slate-600">Fill Color</span>
                    <input type="color" value={labelColor} onChange={(e) => setLabelColor(e.target.value)} className="w-6 h-6 md:w-8 md:h-8 rounded cursor-pointer border-0 p-0" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs md:text-sm text-slate-600">Stroke Color</span>
                    <input type="color" value={labelOutlineColor} onChange={(e) => setLabelOutlineColor(e.target.value)} className="w-6 h-6 md:w-8 md:h-8 rounded cursor-pointer border-0 p-0" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] md:text-xs text-slate-600">
                      <span>Stroke Width</span>
                      <span>{labelOutlineWidth.toFixed(3)}</span>
                    </div>
                    <input type="range" min="0" max="0.05" step="0.001" value={labelOutlineWidth} onChange={(e) => setLabelOutlineWidth(parseFloat(e.target.value))} className="w-full h-2 accent-indigo-600" />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Texture Settings */}
          <div className="space-y-3 md:space-y-4">
            <label className="flex items-center gap-2 text-xs md:text-sm font-semibold text-slate-700 border-b border-slate-100 pb-2">
              <ImageIcon className="w-4 h-4" />
              Global Texture
            </label>
            <label className="flex flex-col items-center justify-center w-full h-20 md:h-24 border-2 border-slate-200 border-dashed rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors group">
              <div className="flex flex-col items-center justify-center pt-4 md:pt-5 pb-4 md:pb-6">
                <Upload className="w-5 h-5 md:w-6 md:h-6 mb-1 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                <p className="text-[10px] md:text-xs text-slate-500">
                  <span className="font-semibold text-indigo-600">Upload Image</span>
                </p>
              </div>
              <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
            </label>

            {textureUrl && (
              <div className="space-y-3 md:space-y-4 bg-slate-50 p-3 md:p-4 rounded-xl border border-slate-100">
                <div className="flex items-center justify-between mb-1 md:mb-2">
                  <span className="text-[10px] md:text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <SlidersHorizontal className="w-3 h-3" /> Adjustments
                  </span>
                  <button onClick={() => setTextureUrl(null)} className="text-[10px] md:text-xs text-red-500 hover:text-red-700 font-medium">Remove</button>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] md:text-xs text-slate-600"><span>Scale</span><span>{textureScale.toFixed(2)}x</span></div>
                  <input type="range" min="0.1" max="3" step="0.01" value={textureScale} onChange={(e) => setTextureScale(parseFloat(e.target.value))} className="w-full h-2 accent-indigo-600" />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] md:text-xs text-slate-600"><span>Offset X</span><span>{textureOffsetX.toFixed(2)}</span></div>
                  <input type="range" min="-1" max="1" step="0.01" value={textureOffsetX} onChange={(e) => setTextureOffsetX(parseFloat(e.target.value))} className="w-full h-2 accent-indigo-600" />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] md:text-xs text-slate-600"><span>Offset Y</span><span>{textureOffsetY.toFixed(2)}</span></div>
                  <input type="range" min="-1" max="1" step="0.01" value={textureOffsetY} onChange={(e) => setTextureOffsetY(parseFloat(e.target.value))} className="w-full h-2 accent-indigo-600" />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] md:text-xs text-slate-600"><span>Aspect Ratio</span><span>{textureAspect.toFixed(2)}</span></div>
                  <input type="range" min="0.5" max="2" step="0.01" value={textureAspect} onChange={(e) => setTextureAspect(parseFloat(e.target.value))} className="w-full h-2 accent-indigo-600" />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] md:text-xs text-slate-600"><span>Rotation</span><span>{textureRotation}°</span></div>
                  <input type="range" min="0" max="360" step="1" value={textureRotation} onChange={(e) => setTextureRotation(parseFloat(e.target.value))} className="w-full h-2 accent-indigo-600" />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] md:text-xs text-slate-600"><span>Keycap Opacity</span><span>{Math.round(textureOpacity * 100)}%</span></div>
                  <input type="range" min="0" max="1" step="0.01" value={textureOpacity} onChange={(e) => setTextureOpacity(parseFloat(e.target.value))} className="w-full h-2 accent-indigo-600" />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] md:text-xs text-slate-600"><span>Base Plate Opacity</span><span>{Math.round(baseOpacity * 100)}%</span></div>
                  <input type="range" min="0" max="1" step="0.01" value={baseOpacity} onChange={(e) => setBaseOpacity(parseFloat(e.target.value))} className="w-full h-2 accent-indigo-600" />
                </div>
                <div className="pt-2 border-t border-slate-200">
                  <div className="flex items-center justify-between mb-2"><span className="text-xs text-slate-600">Out of Bounds Mode</span></div>
                  <select value={outOfBoundsMode} onChange={(e) => setOutOfBoundsMode(e.target.value)} className="w-full text-xs p-1 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500">
                    <option value="clamp">Clamp to Edge</option>
                    <option value="transparent">Transparent</option>
                    <option value="repeat">Repeat</option>
                    <option value="mirror">Mirror Repeat</option>
                  </select>
                </div>
                <div className="pt-2 border-t border-slate-200">
                  <div className="flex items-center justify-between mb-2"><span className="text-xs text-slate-600">Texture Mapping</span></div>
                  <select value={textureMapping} onChange={(e) => setTextureMapping(e.target.value)} className="w-full text-xs p-1 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500">
                    <option value="fitted">Fitted (No Overlap)</option>
                    <option value="unfolded">Unfolded (Overlap)</option>
                    <option value="projected">Planar (Smear)</option>
                    <option value="per-key">Per-Keycap</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 md:p-6 border-t border-slate-100 bg-slate-50">
          <button
            onClick={handleExport}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 md:py-3 px-4 rounded-xl transition-all shadow-sm hover:shadow-md active:scale-[0.98] text-xs md:text-sm"
          >
            <Download className="w-4 h-4 md:w-5 md:h-5" />
            Export as {exportFormat.toUpperCase()}
          </button>
        </div>
      </div>

      {/* Main 3D View */}
      <div className="flex-1 relative bg-slate-100 touch-none">
        {!isSidebarOpen && (
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="absolute top-4 left-4 z-10 p-2 bg-white rounded-lg shadow-md hover:bg-slate-50 transition-colors"
          >
            <SlidersHorizontal className="w-5 h-5 text-slate-700" />
          </button>
        )}

        {/* Floating export button with format selector */}
        <div className="absolute top-4 right-4 z-10 flex items-center bg-white rounded-lg shadow-md border border-slate-200/50 overflow-hidden">
          {(['png', 'jpg', 'webp'] as const).map(fmt => (
            <button
              key={fmt}
              onClick={() => { setExportFormat(fmt); handleExport(); }}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors ${exportFormat === fmt ? 'bg-indigo-600 text-white' : 'text-slate-700 hover:bg-slate-50'}`}
              title={`Export as ${fmt.toUpperCase()}`}
            >
              {fmt === exportFormat && <Download className="w-3.5 h-3.5" />}
              <span>{fmt.toUpperCase()}</span>
            </button>
          ))}
        </div>

        <KeyboardScene {...keyboardSceneProps} />

        <div className="absolute bottom-4 left-4 md:bottom-6 md:left-6 bg-white/80 backdrop-blur-md px-3 py-1.5 md:px-4 md:py-2 rounded-lg shadow-sm border border-slate-200/50 text-[10px] md:text-sm text-slate-600 pointer-events-none">
          Left click to rotate • Right click to pan • Scroll to zoom
        </div>
      </div>
    </div>
  )
  );
}

/* Reusable Mobile Slider Control */
function SliderControl({ label, value, min, max, step, onChange, suffix = '', decimals, displayPercent }: {
  label: string; value: number; min: number; max: number; step: number;
  onChange: (v: number) => void; suffix?: string; decimals?: number; displayPercent?: boolean;
}) {
  const displayVal = displayPercent
    ? `${Math.round(value * 100)}${suffix}`
    : `${value.toFixed(decimals ?? 2)}${suffix}`;
  return (
    <div className="space-y-0.5">
      <div className="flex justify-between text-[10px] text-slate-600">
        <span>{label}</span><span>{displayVal}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 accent-indigo-600" />
    </div>
  );
}

/* Reusable Mobile Toggle Control */
function ToggleControl({ label, checked, onChange }: {
  label: string; checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[11px] text-slate-600">{label}</span>
      <label className="relative inline-flex items-center cursor-pointer">
        <input type="checkbox" className="sr-only peer" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
      </label>
    </div>
  );
}

/* Reusable Desktop Slider */
function DesktopSlider({ label, value, min, max, step, onChange }: {
  label: string; value: number; min: number; max: number; step: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px] md:text-xs text-slate-600">
        <span>{label}</span><span>{value.toFixed(2)}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-2 accent-indigo-600" />
    </div>
  );
}
