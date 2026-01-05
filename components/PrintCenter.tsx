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

const ZOOM_STEP = 0.1;
const MIN_ZOOM = 0.1;
const MAX_ZOOM = 3.0;

const PrintCenter: React.FC<PrintCenterProps> = ({ vouchers, activeCompany }) => {
  const [selectedVchIds, setSelectedVchIds] = useState<string[]>([]);
  const [printLayout, setPrintLayout] = useState<LayoutType>('GST_TAX_INVOICE');
  const [paperSize, setPaperSize] = useState<PaperSize>('A4');
  const [orientation, setOrientation] = useState<Orientation>('Portrait');
  const [watermark, setWatermark] = useState<Watermark>('ORIGINAL');
  
  // Advanced Viewport State
  const [scale, setScale] = useState(0.85);
  const [isAutoFit, setIsAutoFit] = useState(true);
  const [fitMode, setFitMode] = useState<'PAGE' | 'WIDTH'>('PAGE');
  
  const containerRef = useRef<HTMLDivElement>(null);

  const previewVch = useMemo(() => {
    return vouchers.find(v => v.id === selectedVchIds[0]) || null;
  }, [vouchers, selectedVchIds]);

  const getDocDimensions = () => {
    let docW = 794; // A4 @ 96dpi
    let docH = 1123;
    
    if (paperSize === 'Letter') { docW = 816; docH = 1056; }
    else if (paperSize === 'A5') { docW = 559; docH = 794; }

    return orientation === 'Landscape' ? { width: docH, height: docW } : { width: docW, height: docH };
  };

  const { width: docW, height: docH } = getDocDimensions();

  const handleZoom = (delta: number) => {
    setIsAutoFit(false);
    setScale(prev => Math.min(Math.max(prev + delta, MIN_ZOOM), MAX_ZOOM));
  };

  const applyFit = () => {
    if (containerRef.current && previewVch) {
      const gutter = 80; // Margin within the viewport
      const containerW = containerRef.current.clientWidth - gutter;
      const containerH = containerRef.current.clientHeight - gutter;
      
      const scaleW = containerW / docW;
      const scaleH = containerH / docH;
      
      const finalScale = fitMode === 'PAGE' ? Math.min(scaleW, scaleH) : scaleW;
      setScale(Math.max(MIN_ZOOM, Math.min(finalScale, MAX_ZOOM)));
      setIsAutoFit(true);
    }
  };

  useEffect(() => {
    const handleGlobalKeys = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === '=' || e.key === '+') { e.preventDefault(); handleZoom(ZOOM_STEP); }
        if (e.key === '-') { e.preventDefault(); handleZoom(-ZOOM_STEP); }
        if (e.key === '0') { e.preventDefault(); setScale(1.0); setIsAutoFit(false); }
      }
    };
    window.addEventListener('keydown', handleGlobalKeys);
    return () => window.removeEventListener('keydown', handleGlobalKeys);
  }, []);

  useEffect(() => {
    const observer = new ResizeObserver(() => {
      if (isAutoFit) applyFit();
    });
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [isAutoFit, fitMode, paperSize, orientation]);

  const toggleSelectAll = () => {
    if (selectedVchIds.length === vouchers.length) setSelectedVchIds([]);
    else setSelectedVchIds(vouchers.map(v => v.id));
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-5 gap-8 animate-in fade-in duration-500 h-[calc(100vh-160px)]">
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page { margin: 0mm; size: auto; }
          body * { visibility: hidden; }
          #batch-spool-output, #batch-spool-output * { visibility: visible; }
          #batch-spool-output { position: absolute; left: 0; top: 0; width: 100%; }
          .break-page { break-before: page; page-break-before: always; }
        }
      ` }} />

      {/* Control Pane */}
      <div className="xl:col-span-2 flex flex-col space-y-6 min-h-0">
        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col flex-1">
          <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
             <h3 className="text-sm font-black uppercase tracking-widest text-slate-800">Print Spooler</h3>
             <div className="flex items-center space-x-3">
                <button onClick={toggleSelectAll} className="text-[10px] font-black text-indigo-600 uppercase hover:underline underline-offset-4 decoration-indigo-200">
                   {selectedVchIds.length === vouchers.length ? 'Deselect' : 'Select All'}
                </button>
                <div className="w-px h-3 bg-slate-200"></div>
                <button onClick={() => setSelectedVchIds([])} className="text-[10px] font-black text-rose-500 uppercase hover:underline">Clear</button>
             </div>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-slate-50">
             {vouchers.map(v => (
               <div 
                key={v.id} 
                onClick={() => setSelectedVchIds(prev => prev.includes(v.id) ? prev.filter(id => id !== v.id) : [v.id, ...prev])} 
                className={`p-5 cursor-pointer transition-all hover:bg-slate-50 flex items-center justify-between group ${selectedVchIds.includes(v.id) ? 'bg-indigo-50/40' : ''}`}
               >
                  <div className="flex items-center space-x-4">
                     <div className={`w-5 h-5 rounded border-2 transition-all flex items-center justify-center ${selectedVchIds.includes(v.id) ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-200 group-hover:border-indigo-300'}`}>
                        {selectedVchIds.includes(v.id) && <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={4}><path d="M5 13l4 4L19 7" /></svg>}
                     </div>
                     <div>
                        <div className="text-xs font-black text-slate-800 uppercase italic">{v.party}</div>
                        <div className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">{v.id} • {v.date}</div>
                     </div>
                  </div>
                  <div className="text-right">
                     <div className="text-xs font-black text-slate-900">${v.amount.toLocaleString()}</div>
                     <span className="text-[8px] font-black text-slate-400 uppercase">{v.type}</span>
                  </div>
               </div>
             ))}
          </div>
        </div>

        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl border-t-4 border-indigo-500 shrink-0">
           <h3 className="text-[10px] font-black uppercase text-indigo-400 tracking-[0.3em] mb-6">Template Configuration</h3>
           <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Layout', val: printLayout, set: setPrintLayout, opts: ['GST_TAX_INVOICE', 'STANDARD', 'COMPACT'] },
                { label: 'Paper', val: paperSize, set: setPaperSize, opts: ['A4', 'Letter', 'A5'] },
                { label: 'Flow', val: orientation, set: setOrientation, opts: ['Portrait', 'Landscape'] },
                { label: 'Stamp', val: watermark, set: setWatermark, opts: ['ORIGINAL', 'DUPLICATE', 'TRIPLICATE', 'DRAFT', 'NONE'] }
              ].map((cfg, i) => (
                <div key={i} className="space-y-1.5">
                  <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-1">{cfg.label}</label>
                  <select 
                    value={cfg.val} 
                    onChange={e => { cfg.set(e.target.value as any); if (isAutoFit) setTimeout(applyFit, 50); }} 
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-[10px] font-black text-white outline-none cursor-pointer hover:bg-white/10 transition-colors"
                  >
                    {cfg.opts.map(o => <option key={o} value={o} className="bg-slate-900">{o.replace(/_/g, ' ')}</option>)}
                  </select>
                </div>
              ))}
           </div>
           <button 
            onClick={() => selectedVchIds.length > 0 && window.print()}
            disabled={selectedVchIds.length === 0}
            className={`mt-8 w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-xl transition-all transform active:scale-95 flex items-center justify-center space-x-3 ${selectedVchIds.length === 0 ? 'bg-slate-800 text-slate-600 cursor-not-allowed' : 'bg-white text-slate-900 hover:bg-indigo-600 hover:text-white'}`}
           >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
              <span>Transmit Stream ({selectedVchIds.length})</span>
           </button>
        </div>
      </div>

      {/* Preview Viewport */}
      <div className="xl:col-span-3 flex flex-col min-h-0 bg-slate-100 rounded-[3rem] border border-slate-200 overflow-hidden shadow-inner">
         <div className="bg-white px-8 py-4 flex items-center justify-between border-b border-slate-200 shrink-0">
            <div className="flex items-center space-x-4">
               <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-inner">
                  <button 
                    onClick={() => { setFitMode('PAGE'); setIsAutoFit(true); }}
                    className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${isAutoFit && fitMode === 'PAGE' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
                  >Fit Page</button>
                  <button 
                    onClick={() => { setFitMode('WIDTH'); setIsAutoFit(true); }}
                    className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${isAutoFit && fitMode === 'WIDTH' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
                  >Fit Width</button>
               </div>
            </div>

            <div className="flex items-center space-x-6">
               <div className="flex items-center space-x-3 bg-slate-50 p-1.5 rounded-xl border border-slate-200 shadow-sm">
                  <button onClick={() => handleZoom(-ZOOM_STEP)} className="w-8 h-8 flex items-center justify-center bg-white rounded-lg text-slate-400 hover:text-indigo-600 transition-colors shadow-sm"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path d="M20 12H4" /></svg></button>
                  <div className="w-16 text-center">
                    <span className="text-[11px] font-black text-slate-800 tabular-nums italic">{Math.round(scale * 100)}%</span>
                  </div>
                  <button onClick={() => handleZoom(ZOOM_STEP)} className="w-8 h-8 flex items-center justify-center bg-white rounded-lg text-slate-400 hover:text-indigo-600 transition-colors shadow-sm"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path d="M12 4v16m8-8H4" /></svg></button>
               </div>
               
               <div className="flex space-x-2">
                 {[0.5, 1, 1.5, 2].map(z => (
                   <button 
                    key={z} 
                    onClick={() => { setScale(z); setIsAutoFit(false); }}
                    className={`px-3 py-2 rounded-lg text-[9px] font-black uppercase border transition-all ${scale === z && !isAutoFit ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-400 border-slate-200 hover:border-indigo-300'}`}
                   >
                     {z * 100}%
                   </button>
                 ))}
               </div>
            </div>
         </div>

         <div 
          ref={containerRef} 
          className="flex-1 overflow-auto custom-scrollbar p-10 relative scroll-smooth bg-slate-200/50"
         >
            <div className="flex justify-center min-h-full">
               {previewVch ? (
                 <div 
                   style={{ 
                     width: `${docW * scale}px`, 
                     height: `${docH * scale}px`,
                     transition: 'width 0.2s cubic-bezier(0.4, 0, 0.2, 1), height 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                   }}
                   className="relative origin-top"
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
                 <div className="flex flex-col items-center justify-center h-64 text-slate-400 space-y-6 opacity-40 animate-pulse mt-40">
                    <div className="w-20 h-20 bg-white rounded-[2rem] flex items-center justify-center shadow-inner border border-slate-200">
                      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    </div>
                    <p className="text-xs font-black uppercase tracking-[0.4em] italic">Viewport Offline</p>
                 </div>
               )}
            </div>
            
            <div id="batch-spool-output" className="hidden">
               {selectedVchIds.map((id, idx) => {
                  const v = vouchers.find(x => x.id === id);
                  if (!v) return null;
                  return (
                     <div key={v.id} className={idx > 0 ? "break-page" : ""}>
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
         </div>
      </div>
    </div>
  );
};

export default PrintCenter;