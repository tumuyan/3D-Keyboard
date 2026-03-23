import React, { useState, useRef } from 'react';
import { KeyboardScene, PROFILES, FONTS } from './components/Keyboard3D';
import { Upload, Download, Code, Settings2, Type, ImageIcon, SlidersHorizontal, Palette, Box } from 'lucide-react';

const DEFAULT_KLE = `[
  [{"a":7},"Q","W","E","R","T","Y","U","I","O","P"],
  [{"x":0.5},"A","S","D","F","G","H","J","K","L"],
  [{"w":1.5},"Shift","Z","X","C","V","B","N","M",{"w":1.5},"Del"],
  [{"w":2},"123",",",{"w":4},"",".",{"w":2},"Enter"]
]`;

export default function App() {
  const [kleData, setKleData] = useState(DEFAULT_KLE);
  const [textureUrl, setTextureUrl] = useState<string | null>(null);
  
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
  const [outOfBoundsMode, setOutOfBoundsMode] = useState('clamp'); // clamp, transparent, repeat, mirror
  const [textureMapping, setTextureMapping] = useState('projected'); // fitted, unfolded, projected, per-key
  const [showShadows, setShowShadows] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setTextureUrl(url);
    }
  };

  const handleExport = () => {
    if (canvasRef.current) {
      const dataUrl = canvasRef.current.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = 'keyboard-3d.png';
      link.href = dataUrl;
      link.click();
    }
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 text-slate-900 font-sans">
      {/* Sidebar */}
      <div className="w-96 flex-shrink-0 border-r border-slate-200 bg-white flex flex-col shadow-sm z-10">
        <div className="p-6 border-b border-slate-100">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Code className="w-6 h-6 text-indigo-600" />
            Keycap 3D
          </h1>
          <p className="text-sm text-slate-500 mt-1">Visualize custom keyboard layouts with global textures.</p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* KLE Input */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Code className="w-4 h-4" />
              KLE JSON
            </label>
            <textarea
              value={kleData}
              onChange={(e) => setKleData(e.target.value)}
              className="w-full h-32 p-3 font-mono text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all resize-none"
              spellCheck={false}
            />
          </div>

          {/* Keycap Settings */}
          <div className="space-y-4">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 border-b border-slate-100 pb-2">
              <Settings2 className="w-4 h-4" />
              Keycap Settings
            </label>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Profile</span>
                <select 
                  value={profile} 
                  onChange={(e) => setProfile(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-sm rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  {Object.keys(PROFILES).map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Keycap Color</span>
                <input 
                  type="color" 
                  value={keycapColor} 
                  onChange={(e) => setKeycapColor(e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Key Gap X</span>
                  <span>{keyGapX.toFixed(2)}</span>
                </div>
                <input 
                  type="range" 
                  min="0" max="0.3" step="0.01" 
                  value={keyGapX} 
                  onChange={(e) => setKeyGapX(parseFloat(e.target.value))} 
                  className="w-full accent-indigo-600" 
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Key Gap Y</span>
                  <span>{keyGapY.toFixed(2)}</span>
                </div>
                <input 
                  type="range" 
                  min="0" max="0.3" step="0.01" 
                  value={keyGapY} 
                  onChange={(e) => setKeyGapY(parseFloat(e.target.value))} 
                  className="w-full accent-indigo-600" 
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Height Above Case</span>
                  <span>{keycapHeightAboveCase.toFixed(2)}</span>
                </div>
                <input 
                  type="range" 
                  min="0" max="0.5" step="0.01" 
                  value={keycapHeightAboveCase} 
                  onChange={(e) => setKeycapHeightAboveCase(parseFloat(e.target.value))} 
                  className="w-full accent-indigo-600" 
                />
              </div>
            </div>
          </div>

          {/* Keyboard Case Settings */}
          <div className="space-y-4">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 border-b border-slate-100 pb-2">
              <Box className="w-4 h-4" />
              Keyboard Case
            </label>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Shadows</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={showShadows} onChange={(e) => setShowShadows(e.target.checked)} />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Base Color</span>
                <input 
                  type="color" 
                  value={baseColor} 
                  onChange={(e) => setBaseColor(e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Top Edge Bevel</span>
                  <span>{caseTopEdgeBevel.toFixed(2)}</span>
                </div>
                <input 
                  type="range" min="0" max="0.4" step="0.01" 
                  value={caseTopEdgeBevel} onChange={(e) => setCaseTopEdgeBevel(parseFloat(e.target.value))}
                  className="w-full accent-indigo-600"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Bottom Edge Bevel</span>
                  <span>{caseBottomEdgeBevel.toFixed(2)}</span>
                </div>
                <input 
                  type="range" min="0" max="0.4" step="0.01" 
                  value={caseBottomEdgeBevel} onChange={(e) => setCaseBottomEdgeBevel(parseFloat(e.target.value))}
                  className="w-full accent-indigo-600"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Side Edge Bevel</span>
                  <span>{caseSideEdgeBevel.toFixed(2)}</span>
                </div>
                <input 
                  type="range" min="0" max="0.4" step="0.01" 
                  value={caseSideEdgeBevel} onChange={(e) => setCaseSideEdgeBevel(parseFloat(e.target.value))}
                  className="w-full accent-indigo-600"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Top Corner Radius</span>
                  <span>{caseTopCornerRadius.toFixed(2)}</span>
                </div>
                <input 
                  type="range" min="0" max="0.5" step="0.01" 
                  value={caseTopCornerRadius} onChange={(e) => setCaseTopCornerRadius(parseFloat(e.target.value))}
                  className="w-full accent-indigo-600"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Bottom Corner Radius</span>
                  <span>{caseBottomCornerRadius.toFixed(2)}</span>
                </div>
                <input 
                  type="range" min="0" max="0.5" step="0.01" 
                  value={caseBottomCornerRadius} onChange={(e) => setCaseBottomCornerRadius(parseFloat(e.target.value))}
                  className="w-full accent-indigo-600"
                />
              </div>
            </div>
          </div>

          {/* Label Settings */}
          <div className="space-y-4">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 border-b border-slate-100 pb-2">
              <Type className="w-4 h-4" />
              Label Settings
            </label>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Show Labels</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={showLabels} onChange={(e) => setShowLabels(e.target.checked)} />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              {showLabels && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Position</span>
                    <select 
                      value={labelPosition} 
                      onChange={(e) => setLabelPosition(e.target.value)}
                      className="bg-slate-50 border border-slate-200 text-sm rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
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
                    <span className="text-sm text-slate-600">Font</span>
                    <select 
                      value={fontName} 
                      onChange={(e) => setFontName(e.target.value)}
                      className="bg-slate-50 border border-slate-200 text-sm rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      {Object.keys(FONTS).map(f => (
                        <option key={f} value={f}>{f}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Fill Color</span>
                    <input 
                      type="color" 
                      value={labelColor} 
                      onChange={(e) => setLabelColor(e.target.value)}
                      className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Stroke Color</span>
                    <input 
                      type="color" 
                      value={labelOutlineColor} 
                      onChange={(e) => setLabelOutlineColor(e.target.value)}
                      className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-slate-600">
                      <span>Stroke Width</span>
                      <span>{labelOutlineWidth.toFixed(3)}</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" max="0.05" step="0.001" 
                      value={labelOutlineWidth} 
                      onChange={(e) => setLabelOutlineWidth(parseFloat(e.target.value))} 
                      className="w-full accent-indigo-600" 
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Texture Settings */}
          <div className="space-y-4">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 border-b border-slate-100 pb-2">
              <ImageIcon className="w-4 h-4" />
              Global Texture
            </label>
            
            <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-slate-200 border-dashed rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors group">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-6 h-6 mb-1 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                <p className="text-xs text-slate-500">
                  <span className="font-semibold text-indigo-600">Upload Image</span>
                </p>
              </div>
              <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
            </label>

            {textureUrl && (
              <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <SlidersHorizontal className="w-3 h-3" /> Adjustments
                  </span>
                  <button onClick={() => setTextureUrl(null)} className="text-xs text-red-500 hover:text-red-700 font-medium">Remove</button>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>Scale</span>
                    <span>{textureScale.toFixed(2)}x</span>
                  </div>
                  <input type="range" min="0.1" max="3" step="0.01" value={textureScale} onChange={(e) => setTextureScale(parseFloat(e.target.value))} className="w-full accent-indigo-600" />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>Offset X</span>
                    <span>{textureOffsetX.toFixed(2)}</span>
                  </div>
                  <input type="range" min="-1" max="1" step="0.01" value={textureOffsetX} onChange={(e) => setTextureOffsetX(parseFloat(e.target.value))} className="w-full accent-indigo-600" />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>Offset Y</span>
                    <span>{textureOffsetY.toFixed(2)}</span>
                  </div>
                  <input type="range" min="-1" max="1" step="0.01" value={textureOffsetY} onChange={(e) => setTextureOffsetY(parseFloat(e.target.value))} className="w-full accent-indigo-600" />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>Aspect Ratio</span>
                    <span>{textureAspect.toFixed(2)}</span>
                  </div>
                  <input type="range" min="0.5" max="2" step="0.01" value={textureAspect} onChange={(e) => setTextureAspect(parseFloat(e.target.value))} className="w-full accent-indigo-600" />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>Rotation</span>
                    <span>{textureRotation}°</span>
                  </div>
                  <input type="range" min="0" max="360" step="1" value={textureRotation} onChange={(e) => setTextureRotation(parseFloat(e.target.value))} className="w-full accent-indigo-600" />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>Keycap Opacity</span>
                    <span>{Math.round(textureOpacity * 100)}%</span>
                  </div>
                  <input type="range" min="0" max="1" step="0.01" value={textureOpacity} onChange={(e) => setTextureOpacity(parseFloat(e.target.value))} className="w-full accent-indigo-600" />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>Base Plate Opacity</span>
                    <span>{Math.round(baseOpacity * 100)}%</span>
                  </div>
                  <input type="range" min="0" max="1" step="0.01" value={baseOpacity} onChange={(e) => setBaseOpacity(parseFloat(e.target.value))} className="w-full accent-indigo-600" />
                </div>

                <div className="pt-2 border-t border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-600">Out of Bounds Mode</span>
                  </div>
                  <select 
                    value={outOfBoundsMode} 
                    onChange={(e) => setOutOfBoundsMode(e.target.value)}
                    className="w-full text-xs p-1 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="clamp">Clamp to Edge</option>
                    <option value="transparent">Transparent</option>
                    <option value="repeat">Repeat</option>
                    <option value="mirror">Mirror Repeat</option>
                  </select>
                </div>

                <div className="pt-2 border-t border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-600">Texture Mapping</span>
                  </div>
                  <select 
                    value={textureMapping} 
                    onChange={(e) => setTextureMapping(e.target.value)}
                    className="w-full text-xs p-1 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
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
        <div className="p-6 border-t border-slate-100 bg-slate-50">
          <button
            onClick={handleExport}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-xl transition-all shadow-sm hover:shadow-md active:scale-[0.98]"
          >
            <Download className="w-5 h-5" />
            Export 3D Image
          </button>
        </div>
      </div>

      {/* Main 3D View */}
      <div className="flex-1 relative bg-slate-100">
        <KeyboardScene 
          kleData={kleData} 
          textureUrl={textureUrl} 
          canvasRef={canvasRef}
          textureScale={textureScale}
          textureOffsetX={textureOffsetX}
          textureOffsetY={textureOffsetY}
          textureAspect={textureAspect}
          textureRotation={textureRotation}
          textureOpacity={textureOpacity}
          baseOpacity={baseOpacity}
          outOfBoundsMode={outOfBoundsMode}
          textureMapping={textureMapping}
          showLabels={showLabels}
          labelPosition={labelPosition}
          profile={profile}
          labelColor={labelColor}
          labelOutlineColor={labelOutlineColor}
          labelOutlineWidth={labelOutlineWidth}
          fontUrl={FONTS[fontName]}
          keycapColor={keycapColor}
          baseColor={baseColor}
          keyGapX={keyGapX}
          keyGapY={keyGapY}
          caseTopEdgeBevel={caseTopEdgeBevel}
          caseBottomEdgeBevel={caseBottomEdgeBevel}
          caseSideEdgeBevel={caseSideEdgeBevel}
          caseTopCornerRadius={caseTopCornerRadius}
          caseBottomCornerRadius={caseBottomCornerRadius}
          keycapHeightAboveCase={keycapHeightAboveCase}
          showShadows={showShadows}
        />
        
        {/* Overlay instructions */}
        <div className="absolute bottom-6 left-6 bg-white/80 backdrop-blur-md px-4 py-2 rounded-lg shadow-sm border border-slate-200/50 text-sm text-slate-600 pointer-events-none">
          Left click to rotate • Right click to pan • Scroll to zoom
        </div>
      </div>
    </div>
  );
}
