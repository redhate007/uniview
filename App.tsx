import React, { useState, useRef } from 'react';
import { AppState, ExpansionSettings } from './types';
import { expandImage } from './services/gemini';
import { UploadIcon, MagicWandIcon, DownloadIcon, RefreshIcon, ArrowLeftIcon } from './components/Icon';
import CanvasEditor, { CanvasEditorHandle } from './components/CanvasEditor';

const INITIAL_SETTINGS: ExpansionSettings = {
  top: 0,
  bottom: 0,
  left: 0,
  right: 0,
  prompt: "A beautiful, realistic continuation of the scene"
};

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [settings, setSettings] = useState<ExpansionSettings>(INITIAL_SETTINGS);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const canvasRef = useRef<CanvasEditorHandle>(null);

  // Handle File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setOriginalImage(event.target.result as string);
          setAppState(AppState.EDITING);
          // Reset settings
          setSettings({ ...INITIAL_SETTINGS, right: 50 }); // Default expand right 50%
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle Generation
  const handleGenerate = async () => {
    if (!canvasRef.current) return;
    
    // Check if any expansion is applied
    if (settings.top === 0 && settings.bottom === 0 && settings.left === 0 && settings.right === 0) {
      setErrorMsg("Please add some expansion area (Top, Bottom, Left, or Right) before generating.");
      return;
    }

    try {
      setAppState(AppState.GENERATING);
      setErrorMsg(null);
      const canvasDataUrl = canvasRef.current.getCanvasDataUrl();
      const result = await expandImage(canvasDataUrl, settings.prompt);
      setGeneratedImage(result);
      setAppState(AppState.COMPLETE);
    } catch (err: any) {
      setAppState(AppState.ERROR);
      setErrorMsg(err.message || "Failed to generate image. Please try again.");
    }
  };

  const handleReset = () => {
    setAppState(AppState.IDLE);
    setOriginalImage(null);
    setGeneratedImage(null);
    setSettings(INITIAL_SETTINGS);
    setErrorMsg(null);
  };

  const handleBackToEdit = () => {
    setAppState(AppState.EDITING);
    setGeneratedImage(null);
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center p-4 md:p-8">
      
      {/* Header */}
      <header className="w-full max-w-5xl flex justify-between items-center mb-8">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-2 rounded-lg">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">InfiniView</h1>
            <p className="text-xs text-slate-400">AI Image Expander</p>
          </div>
        </div>
        
        {appState !== AppState.IDLE && (
          <button 
            onClick={handleReset}
            className="text-slate-400 hover:text-white transition-colors text-sm font-medium flex items-center gap-1"
          >
            New Image
          </button>
        )}
      </header>

      {/* Main Content Area */}
      <main className="w-full max-w-5xl flex-1 flex flex-col items-center justify-start gap-8">
        
        {/* State: IDLE - Upload Area */}
        {appState === AppState.IDLE && (
          <div className="w-full max-w-2xl mt-12 animate-in fade-in zoom-in duration-500">
            <div className="border-2 border-dashed border-slate-700 rounded-2xl bg-slate-800/50 hover:bg-slate-800 transition-all p-12 text-center group cursor-pointer relative">
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center gap-4 group-hover:scale-105 transition-transform duration-300">
                <div className="p-4 bg-slate-700 rounded-full text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <UploadIcon />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Upload an Image</h2>
                  <p className="text-slate-400">Drag and drop or click to select</p>
                  <p className="text-slate-500 text-sm mt-2">Supports JPG, PNG, WEBP</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* State: EDITING & GENERATING - Editor */}
        {(appState === AppState.EDITING || appState === AppState.GENERATING || appState === AppState.ERROR) && originalImage && (
          <div className="w-full flex flex-col lg:flex-row gap-8 items-start animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* Editor Controls (Sidebar) */}
            <div className="w-full lg:w-80 flex flex-col gap-6 order-2 lg:order-1">
              <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-xl">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <span className="w-1 h-6 bg-blue-500 rounded-full"></span>
                  Expansion Controls
                </h3>
                
                <div className="space-y-6">
                  {/* Direction Sliders */}
                  <div className="space-y-4">
                    <p className="text-sm font-medium text-slate-400 uppercase tracking-wider text-xs">Directions (%)</p>
                    
                    <div className="grid grid-cols-2 gap-4">
                      {/* Top */}
                      <div className="col-span-2">
                        <div className="flex justify-between text-xs mb-1">
                          <span>Top</span>
                          <span className="text-blue-400">{settings.top}%</span>
                        </div>
                        <input 
                          type="range" min="0" max="100" step="10"
                          value={settings.top}
                          onChange={(e) => setSettings(s => ({...s, top: Number(e.target.value)}))}
                          className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                        />
                      </div>

                      {/* Left */}
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span>Left</span>
                          <span className="text-blue-400">{settings.left}%</span>
                        </div>
                        <input 
                          type="range" min="0" max="100" step="10"
                          value={settings.left}
                          onChange={(e) => setSettings(s => ({...s, left: Number(e.target.value)}))}
                          className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                        />
                      </div>

                      {/* Right */}
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span>Right</span>
                          <span className="text-blue-400">{settings.right}%</span>
                        </div>
                        <input 
                          type="range" min="0" max="100" step="10"
                          value={settings.right}
                          onChange={(e) => setSettings(s => ({...s, right: Number(e.target.value)}))}
                          className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                        />
                      </div>

                      {/* Bottom */}
                      <div className="col-span-2">
                        <div className="flex justify-between text-xs mb-1">
                          <span>Bottom</span>
                          <span className="text-blue-400">{settings.bottom}%</span>
                        </div>
                        <input 
                          type="range" min="0" max="100" step="10"
                          value={settings.bottom}
                          onChange={(e) => setSettings(s => ({...s, bottom: Number(e.target.value)}))}
                          className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Prompt */}
                  <div className="space-y-2">
                     <p className="text-sm font-medium text-slate-400 uppercase tracking-wider text-xs">AI Guidance</p>
                     <textarea 
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                        rows={3}
                        placeholder="Describe the extended scene..."
                        value={settings.prompt}
                        onChange={(e) => setSettings(s => ({...s, prompt: e.target.value}))}
                     />
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={handleGenerate}
                    disabled={appState === AppState.GENERATING}
                    className={`w-full py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all ${
                      appState === AppState.GENERATING 
                        ? 'bg-slate-700 cursor-wait text-slate-400' 
                        : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/25'
                    }`}
                  >
                    {appState === AppState.GENERATING ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Dreaming...
                      </>
                    ) : (
                      <>
                        <MagicWandIcon />
                        Expand Image
                      </>
                    )}
                  </button>
                  
                  {errorMsg && (
                    <div className="p-3 bg-red-900/50 border border-red-800 text-red-200 text-xs rounded-lg">
                      {errorMsg}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Canvas Area (Main) */}
            <div className="flex-1 w-full order-1 lg:order-2 flex flex-col items-center">
               <CanvasEditor 
                 ref={canvasRef}
                 imageSrc={originalImage}
                 settings={settings}
                 className="w-full"
               />
               <p className="mt-4 text-slate-500 text-sm text-center">
                 Adjust the sliders to add whitespace. The AI will paint over the white areas.
               </p>
            </div>
          </div>
        )}

        {/* State: COMPLETE - Result View */}
        {appState === AppState.COMPLETE && generatedImage && (
          <div className="w-full flex flex-col items-center gap-8 animate-in fade-in zoom-in-95 duration-500">
             <div className="flex gap-4">
                <button 
                  onClick={handleBackToEdit}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-full border border-slate-700 flex items-center gap-2 text-sm font-medium transition-colors"
                >
                  <ArrowLeftIcon className="w-4 h-4" />
                  Edit Settings
                </button>
                <a 
                  href={generatedImage} 
                  download="expanded-image.png"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-full flex items-center gap-2 text-sm font-medium shadow-lg shadow-blue-900/50 transition-colors"
                >
                  <DownloadIcon className="w-4 h-4" />
                  Download
                </a>
                <button
                   onClick={handleReset}
                   className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-full border border-slate-700 flex items-center gap-2 text-sm font-medium transition-colors"
                >
                  <RefreshIcon className="w-4 h-4" />
                  Start Over
                </button>
             </div>

             <div className="w-full max-w-4xl bg-slate-800 p-2 rounded-xl border border-slate-700 shadow-2xl">
               <img 
                 src={generatedImage} 
                 alt="Expanded Result" 
                 className="w-full h-auto rounded-lg"
               />
             </div>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="w-full max-w-5xl mt-12 py-6 border-t border-slate-800 text-center text-slate-500 text-sm">
        <p>Powered by Google Gemini 2.5 Flash</p>
      </footer>
    </div>
  );
};

export default App;
