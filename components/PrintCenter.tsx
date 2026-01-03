import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Voucher } from '../types';
import ActionMenu, { ActionItem } from './ActionMenu';
import PrintLayout from './PrintLayout';

interface PrintCenterProps {
  vouchers: Voucher[];
  activeCompany: any;
}

type PaperSize = 'A4' | 'A5' | 'Letter';
type Orientation = 'Portrait' | 'Landscape';
type LayoutType = 'GST_TAX_INVOICE' | 'STANDARD' | 'COMPACT';
type Watermark = 'DRAFT' | 'ORIGINAL' | 'DUPLICATE' | 'TRIPLICATE' | 'NONE';

const PrintCenter: React.FC<PrintCenterProps> = ({ vouchers, activeCompany }) => {
  const [selectedVchIds, setSelectedVchIds] = useState<string[]>([]);
  const [printLayout, setPrintLayout] = useState<LayoutType>('GST_TAX_INVOICE');
  const [paperSize, setPaperSize] = useState<PaperSize>('A4');
  const [orientation, setOrientation] = useState<Orientation>('Portrait');
  const [watermark, setWatermark] = useState<Watermark>('ORIGINAL');
  
  // Viewport & Zoom State
  const [scale, setScale] = useState(0.85);
  const [isAutoFit, setIsAutoFit] = useState(true);
  const [fitMode, setFitMode] = useState<'PAGE' | 'WIDTH'>('PAGE');
  
  const containerRef = useRef<HTMLDivElement>(null);

  const previewVch = useMemo(() => {
    return vouchers.find(v => v.id === selectedVchIds[0]) || null;
  }, [vouchers, selectedVchIds]);

  const getDocDimensions = () => {
    let docW = 794; // A4 Standard @ 96dpi
    let docH = 1123;
    
    if (paperSize === 'Letter') {
      docW = 816;
      docH = 1056;
    } else if (paperSize === 'A5') {
      docW = 559;
      docH = 794;
    }

    if (orientation === 'Landscape') {
      return { width: docH, height: docW };
    }
    return { width: docW, height: docH };
  };

  const { width: docW, height: docH } = getDocDimensions();

  const handleZoom = (delta: number) => {
    setIsAutoFit(false);
    setScale(prev => Math.min(Math.max(prev + delta, 0.10), 3.0));
  };

  const applyFit = () => {
    if (containerRef.current && previewVch) {
      // Calculate available space dynamically
      const gutter = 40; // Aesthetic margin around doc
      const containerW = containerRef.current.clientWidth - (gutter * 2);
      const containerH = containerRef.current.clientHeight - (gutter * 2);
      
      const scaleW = containerW / docW;
      const scaleH = containerH / docH;
      
      const finalScale = fitMode === 'PAGE' 
        ? Math.min(scaleW, scaleH) 
        : scaleW;
        
      // Ensure we stay within reasonable bounds
      setScale(Math.max(0.1, Math.min(finalScale, 2.5)));
      setIsAutoFit(true);
    }
  };

  const toggleSelectAll = () => {
    if (selectedVchIds.length === vouchers.length) {
      setSelectedVchIds([]);
    } else {
      setSelectedVchIds(vouchers.map(v => v.id));
    }
  };

  // Keyboard and Wheel Zoom Interaction Node
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.05 : 0.05;
        handleZoom(delta);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey) {
        if (e.key === '=' || e.key === '+') { e.preventDefault(); handleZoom(0.1); }
        if (e.key === '-') { e.preventDefault(); handleZoom(-0.1); }
        if (e.key === '0') { e.preventDefault(); setScale(1.0); setIsAutoFit(false); }
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      if (container) container.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Re-calculate fit on environment changes
  useEffect(() => { 
    if (isAutoFit) {
      const timer = setTimeout(applyFit, 60);
      return () => clearTimeout(timer);
    }
  }, [previewVch?.id, orientation, paperSize, printLayout, isAutoFit, fitMode]);

  // Robust Resize Observation
  useEffect(() => {
    const observer = new ResizeObserver(() => {
      if (isAutoFit) applyFit();
    });
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [isAutoFit, fitMode, paperSize, orientation]);

  const handleManualPrint = () => {
    if (selectedVchIds.length === 0) return;
    window.print();
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-5 gap-10 animate-in fade-in duration-500 pb-20 h-[calc(100vh-140px)]">
      {/* Statutory Batch Print Styles Injected */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page { margin: 0mm; size: auto; }
          body { background: white !important; margin: 0 !important; padding: 0 !important; }
          /* Hide ERP Structural Shell for Clean Feed */
          #root, header, aside, .xl\\:col-span-2, .bg-white.border.border-slate-200.rounded-t-\\[4rem\\], .xl\\:col-span-5 > div:not(#batch-spool-output) { 
            display: none !important; 
          }
          main { padding: 0 !important; margin: 0 !important; }
          /* Expose Hidden Spool Aggregate */
          #batch-spool-output { 
            display: block !important; 
            position: static !important;
            visibility: visible !important;
          }
          /* Neutralize Component UI during output */
          #batch-spool-output > div > div {
            border: none !important;
            box-shadow: none !important;
            margin: 0 !important;
            transform: scale(1) !important;
          }
          .break-before-page {
            break-before: page;
            page-break-before: always;
          }
        }
      ` }} />

      {/* Control Pane: Spooler & Settings */}
      <div className="xl:col-span-2 space-y-8 flex flex-col min-h-0">
        <div className="bg-white rounded-[3.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col flex-1 min-h-[300px]">
          <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
             <h3 className="text-xl font-black italic uppercase text-slate-800 tracking-tight leading-none">Transmission Pool</h3>
             <div className="flex items-center space-x-3">
                <button onClick={toggleSelectAll} className="text-[10px] font-black text-indigo-600 uppercase hover:underline underline-offset-4 decoration-indigo-200">
                   {selectedVchIds.length === vouchers.length ? 'Deselect All' : 'Select All'}
                </button>
                <div className="w-px h-3 bg-slate-200"></div>
                <button onClick={() => setSelectedVchIds([])} className="text-[10px] font-black text-rose-500 uppercase hover:underline underline-offset-4 decoration-rose-200">Flush</button>
             </div>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
             {vouchers.map(v => (
               <div key={v.id} onClick={() => setSelectedVchIds(prev => prev.includes(v.id) ? prev.filter(id => id !== v.id) : [v.id, ...prev])} className={`p-6 border-b border-slate-50 cursor-pointer transition-all hover:bg-slate-50 flex items-center justify-between group ${selectedVchIds.includes(v.id) ? 'bg-indigo-50/30 border-indigo-100' : ''}`}>
                  <div className="flex items-center space-x-6">
                     <div className={`w-6 h-6 rounded-lg border-2 transition-all flex items-center justify-center ${selectedVchIds.includes(v.id) ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-200 group-hover:border-indigo-300'}`}>
                        {selectedVchIds.includes(v.id) && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>}
                     </div>
                     <div>
                        <div className="text-xs font-black text-slate-800 uppercase tracking-tight italic">{v.party}</div>
                        <div className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">{v.id} • {v.date}</div>
                     </div>
                  </div>
                  <div className="text-right">
                     <div className="text-sm font-black text-slate-900 italic tracking-tighter">${v.amount.toLocaleString()}</div>
                     <span className={`text-[9px] font-black uppercase tracking-tighter ${v.type === 'Sales' ? 'text-emerald-500' : 'text-indigo-500'}`}>{v.type}</span>
                  </div>
               </div>
             ))}
          </div>
        </div>

        <div className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl border-t-8 border-indigo-500 shrink-0">
           <h3 className="text-[11px] font-black uppercase text-indigo-400 tracking-[0.4em] mb-10">Output Parameters</h3>
           <div className="space-y-8">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Template Engine</label>
                  <select value={printLayout} onChange={e => setPrintLayout(e.target.value as LayoutType)} className="w-full bg-white/5 border border-white/10 rounded-[1.5rem] px-5 py-4 text-xs font-black text-indigo-400 outline-none cursor-pointer appearance-none">
                    <option value="GST_TAX_INVOICE" className="bg-slate-900">GST Statutory</option>
                    <option value="STANDARD" className="bg-slate-900">Standard Doc</option>
                    <option value="COMPACT" className="bg-slate-900">Compact List</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Sheet Size</label>
                  <select value={paperSize} onChange={e => setPaperSize(e.target.value as PaperSize)} className="w-full bg-white/5 border border-white/10 rounded-[1.5rem] px-5 py-4 text-xs font-black text-white outline-none cursor-pointer appearance-none">
                    <option value="A4" className="bg-slate-900">A4 ISO</option>
                    <option value="Letter" className="bg-slate-900">US Letter</option>
                    <option value="A5" className="bg-slate-900">A5 Booklet</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Page Geometry</label>
                  <select value={orientation} onChange={e => setOrientation(e.target.value as Orientation)} className="w-full bg-white/5 border border-white/10 rounded-[1.5rem] px-5 py-4 text-xs font-black text-white outline-none cursor-pointer appearance-none">
                    <option value="Portrait" className="bg-slate-900">Portrait</option>
                    <option value="Landscape" className="bg-slate-900">Landscape</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Audit Legend</label>
                  <select value={watermark} onChange={e => setWatermark(e.target.value as Watermark)} className="w-full bg-white/5 border border-white/10 rounded-[1.5rem] px-5 py-4 text-xs font-black text-indigo-400 outline-none cursor-pointer appearance-none">
                    {['ORIGINAL', 'DUPLICATE', 'TRIPLICATE', 'DRAFT', 'NONE'].map(w => <option key={w} value={w} className="bg-slate-900">{w} COPY</option>)}
                  </select>
                </div>
              </div>

              <div className="pt-6 border-t border-white/5">
                <button onClick={handleManualPrint} disabled={selectedVchIds.length === 0} className={`w-full py-6 rounded-[2rem] font-black text-xs uppercase tracking-[0.4em] shadow-2xl transition-all transform active:scale-95 flex items-center justify-center space-x-5 ${selectedVchIds.length === 0 ? 'bg-slate-800 text-slate-600 cursor-not-allowed' : 'bg-white text-slate-900 hover:bg-indigo-600 hover:text-white'}`}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                  <span>Dispatch Stream ({selectedVchIds.length})</span>
                </button>
              </div>
           </div>
           <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600 rounded-full blur-3xl opacity-20 -mr-16 -mt-16"></div>
        </div>
      </div>

      {/* Main Preview: Advanced Viewport Node */}
      <div className="xl:col-span-3 flex flex-col min-h-0">
         <div className="bg-white border border-slate-200 rounded-t-[4rem] p-6 flex flex-col sm:flex-row items-center justify-between shadow-lg z-10 mx-6 mb-[-1px] relative shrink-0 gap-6">
            <div className="flex items-center space-x-5">
               <div className="px-6 py-3 bg-slate-900 text-white rounded-full flex items-center space-x-4 shadow-xl border border-slate-800">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_12px_#10b981]"></div>
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] italic">Statutory Preview Node</span>
               </div>
               {isAutoFit && (
                 <span className="animate-in fade-in zoom-in text-[9px] font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full uppercase tracking-tighter border border-indigo-100 flex items-center">
                   <svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                   Dynamic Scaling Active
                 </span>
               )}
            </div>
            
            <div className="flex items-center space-x-6 flex-1 justify-end">
               <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-inner overflow-hidden shrink-0">
                 <button 
                  onClick={() => { setFitMode('PAGE'); setIsAutoFit(true); }}
                  className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${isAutoFit && fitMode === 'PAGE' ? 'bg-indigo-600 text-white shadow-lg scale-105' : 'text-slate-400 hover:text-slate-600'}`}
                 >
                   Fit Page
                 </button>
                 <button 
                  onClick={() => { setFitMode('WIDTH'); setIsAutoFit(true); }}
                  className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${isAutoFit && fitMode === 'WIDTH' ? 'bg-indigo-600 text-white shadow-lg scale-105' : 'text-slate-400 hover:text-slate-600'}`}
                 >
                   Fit Width
                 </button>
               </div>

               <div className="flex items-center space-x-4 bg-slate-50 p-2.5 rounded-2xl border border-slate-200 shadow-sm flex-1 max-w-[280px]">
                  <button onClick={() => handleZoom(-0.1)} className="w-9 h-9 flex items-center justify-center bg-white rounded-xl text-slate-600 hover:text-indigo-600 shadow-sm border border-slate-100 active:scale-90 transition-all"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M20 12H4" /></svg></button>
                  <div className="flex-1 px-2">
                    <input 
                      type="range" 
                      min="0.10" 
                      max="3.0" 
                      step="0.05"
                      value={scale} 
                      onChange={e => { setScale(parseFloat(e.target.value)); setIsAutoFit(false); }}
                      className="w-full h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-indigo-600"
                    />
                  </div>
                  <button onClick={() => handleZoom(0.1)} className="w-9 h-9 flex items-center justify-center bg-white rounded-xl text-slate-600 hover:text-indigo-600 shadow-sm border border-slate-100 active:scale-90 transition-all"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg></button>
                  <div className="min-w-[50px] text-right font-black text-xs text-slate-800 italic tabular-nums">{Math.round(scale * 100)}%</div>
               </div>
               
               <button onClick={() => { setScale(1.0); setIsAutoFit(false); }} className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-[9px] font-black text-slate-500 uppercase hover:border-indigo-200 hover:text-indigo-600 transition-all shadow-sm">100%</button>
            </div>
         </div>

         {/* Precision Rendering Container */}
         <div 
          ref={containerRef} 
          className="bg-slate-800 rounded-b-[4rem] border-4 border-slate-900 flex-1 overflow-auto custom-scrollbar shadow-2xl relative scroll-smooth bg-[radial-gradient(circle_at_center,_var(--tw-gradient-from)_0%,_var(--tw-gradient-to)_100%)] from-slate-800 to-slate-900 select-none"
         >
            <div className="flex justify-center min-h-full p-20 pt-10">
               {previewVch ? (
                 <div 
                   style={{ 
                     width: `${docW * scale}px`, 
                     height: `${docH * scale}px`,
                     transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1), height 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
                   }}
                   className="relative flex items-start justify-center"
                 >
                   <PrintLayout 
                    voucher={previewVch} 
                    activeCompany={activeCompany} 
                    scale={scale} 
                    layout={printLayout}
                    watermark={watermark}
                    paperSize={paperSize}
                    orientation={orientation}
                  />
                 </div>
               ) : (
                 <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-8 animate-pulse mt-40">
                    <div className="w-28 h-28 bg-slate-700/40 rounded-[2.5rem] flex items-center justify-center border border-white/10 shadow-2xl">
                      <svg className="w-14 h-14 opacity-20 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    </div>
                    <div className="text-center space-y-2">
                       <p className="text-base font-black uppercase tracking-[0.4em] italic text-white/50">Engine Offline</p>
                       <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Select target vouchers from the spooler pool</p>
                    </div>
                 </div>
               )}
            </div>
            
            {/* Hidden Batch Print Spool Output (Triggered during @media print) */}
            <div id="batch-spool-output" className="hidden">
               {selectedVchIds.map((id, idx) => {
                  const v = vouchers.find(x => x.id === id);
                  if (!v) return null;
                  return (
                     <div key={v.id} className={idx > 0 ? "break-before-page" : ""}>
                        <PrintLayout 
                          voucher={v} 
                          activeCompany={activeCompany} 
                          scale={1} 
                          layout={printLayout}
                          watermark={watermark}
                          paperSize={paperSize}
                          orientation={orientation}
                        />
                     </div>
                  );
               })}
            </div>

            {/* Viewport Lighting Overlays */}
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_-20%,_rgba(99,102,241,0.06)_0%,_transparent_50%)]"></div>
         </div>
      </div>
    </div>
  );
};

export default PrintCenter;