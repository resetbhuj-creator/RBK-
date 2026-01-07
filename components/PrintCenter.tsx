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
  const [printLayout, setPrintLayout] = useState<LayoutType>(() => (localStorage.getItem('nx_print_layout') as LayoutType) || 'GST_TAX_INVOICE');
  const [paperSize, setPaperSize] = useState<PaperSize>(() => (localStorage.getItem('nx_paper_size') as PaperSize) || 'A4');
  const [orientation, setOrientation] = useState<Orientation>(() => (localStorage.getItem('nx_orientation') as Orientation) || 'Portrait');
  const [watermark, setWatermark] = useState<Watermark>(() => (localStorage.getItem('nx_watermark') as Watermark) || 'ORIGINAL');
  const [fontSizeScale, setFontSizeScale] = useState(() => parseFloat(localStorage.getItem('nx_font_scale') || '1.0'));
  
  // Advanced Toggles
  const [showCompanySeal, setShowCompanySeal] = useState(true);
  const [showAuditHash, setShowAuditHash] = useState(true);
  const [hideNarration, setHideNarration] = useState(false);
  const [grayscaleMode, setGrayscaleMode] = useState(false);

  const [selectedVchIds, setSelectedVchIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [scale, setScale] = useState(0.85);
  const [isAutoFit, setIsAutoFit] = useState(true);
  const [fitMode, setFitMode] = useState<'PAGE' | 'WIDTH'>('PAGE');
  const [isSpooling, setIsSpooling] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('nx_print_layout', printLayout);
    localStorage.setItem('nx_paper_size', paperSize);
    localStorage.setItem('nx_orientation', orientation);
    localStorage.setItem('nx_watermark', watermark);
    localStorage.setItem('nx_font_scale', fontSizeScale.toString());
  }, [printLayout, paperSize, orientation, watermark, fontSizeScale]);

  const filteredVouchers = useMemo(() => {
    return vouchers.filter(v => {
      const matchesSearch = v.party.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           v.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = typeFilter === 'All' || v.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [vouchers, searchQuery, typeFilter]);

  const previewVch = useMemo(() => {
    return vouchers.find(v => v.id === selectedVchIds[0]) || filteredVouchers[0] || null;
  }, [vouchers, selectedVchIds, filteredVouchers]);

  const batchStats = useMemo(() => {
    const selected = vouchers.filter(v => selectedVchIds.includes(v.id));
    const totalValue = selected.reduce((acc, v) => acc + v.amount, 0);
    return { count: selected.length, value: totalValue };
  }, [vouchers, selectedVchIds]);

  const getDocDimensions = () => {
    let docW = 794; 
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
      const gutter = 100;
      const containerW = containerRef.current.clientWidth - gutter;
      const containerH = containerRef.current.clientHeight - gutter;
      if (containerW <= 0) return;

      const scaleW = containerW / docW;
      const scaleH = containerH / docH;
      const finalScale = fitMode === 'PAGE' ? Math.min(scaleW, scaleH) : scaleW;
      setScale(Math.max(MIN_ZOOM, Math.min(finalScale, MAX_ZOOM)));
      setIsAutoFit(true);
    }
  };

  const triggerBatchPrint = () => {
    setIsSpooling(true);
    setTimeout(() => {
      window.print();
      setIsSpooling(false);
    }, 1500);
  };

  useEffect(() => {
    const observer = new ResizeObserver(() => {
      if (isAutoFit) applyFit();
    });
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [isAutoFit, fitMode, paperSize, orientation, previewVch]);

  const Toggle = ({ label, value, onToggle }: { label: string, value: boolean, onToggle: () => void }) => (
    <div className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0 group cursor-pointer" onClick={onToggle}>
       <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter group-hover:text-indigo-600 transition-colors">{label}</span>
       <div className={`w-8 h-4 rounded-full relative transition-all ${value ? 'bg-indigo-600' : 'bg-slate-200'}`}>
          <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow-sm transition-all ${value ? 'right-0.5' : 'left-0.5'}`}></div>
       </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 xl:grid-cols-5 gap-8 animate-in fade-in duration-500 h-[calc(100vh-160px)]">
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page { size: ${paperSize.toLowerCase()} ${orientation.toLowerCase()}; margin: 10mm; }
          body * { visibility: hidden; }
          #batch-spool-output, #batch-spool-output * { visibility: visible; }
          #batch-spool-output { position: absolute; left: 0; top: 0; width: 100%; }
          .break-page { break-before: page; page-break-before: always; }
          ${grayscaleMode ? 'body { filter: grayscale(100%); }' : ''}
        }
      ` }} />

      {/* Control Pane */}
      <div className="xl:col-span-2 flex flex-col space-y-6 min-h-0">
        <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col flex-1">
          <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 shrink-0 space-y-4">
             <div className="flex items-center justify-between">
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 italic">Spool Sequence</h3>
                <button 
                  onClick={() => setSelectedVchIds(selectedVchIds.length === filteredVouchers.length ? [] : filteredVouchers.map(v => v.id))} 
                  className="text-[9px] font-black text-indigo-600 uppercase hover:text-indigo-800 tracking-widest transition-all"
                >
                   {selectedVchIds.length === filteredVouchers.length ? 'Flush Selection' : 'Select All In View'}
                </button>
             </div>
             
             <div className="grid grid-cols-2 gap-3">
                <div className="relative group">
                   <input 
                     value={searchQuery}
                     onChange={e => setSearchQuery(e.target.value)}
                     placeholder="Query identities..."
                     className="w-full pl-9 pr-3 py-3 bg-white border border-slate-200 rounded-2xl text-[10px] font-black outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all shadow-inner italic"
                   />
                   <svg className="w-4 h-4 absolute left-3 top-3.5 text-slate-300 group-focus-within:text-indigo-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
                <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="px-3 py-3 bg-white border border-slate-200 rounded-2xl text-[10px] font-black text-indigo-600 outline-none cursor-pointer hover:border-indigo-300 transition-all shadow-sm appearance-none">
                  <option value="All">All Vouchers</option>
                  <option value="Sales">Sales</option>
                  <option value="Purchase">Purchase</option>
                  <option value="Payment">Payment</option>
                  <option value="Receipt">Receipt</option>
                </select>
             </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-slate-50 bg-slate-50/10">
             {filteredVouchers.map(v => (
               <div key={v.id} onClick={() => setSelectedVchIds(prev => prev.includes(v.id) ? prev.filter(id => id !== v.id) : [v.id, ...prev])} 
                className={`p-5 cursor-pointer transition-all hover:bg-white flex items-center justify-between group ${selectedVchIds.includes(v.id) ? 'bg-indigo-50/80 border-r-4 border-indigo-600' : 'border-r-4 border-transparent'}`}
               >
                  <div className="flex items-center space-x-4">
                     <div className={`w-5 h-5 rounded-lg border-2 transition-all flex items-center justify-center ${selectedVchIds.includes(v.id) ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg scale-110' : 'bg-white border-slate-200 group-hover:border-indigo-300'}`}>
                        {selectedVchIds.includes(v.id) && <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={4}><path d="M5 13l4 4L19 7" /></svg>}
                     </div>
                     <div className="min-w-0">
                        <div className="text-xs font-black text-slate-800 uppercase italic leading-none group-hover:text-indigo-600 transition-colors truncate">{v.party}</div>
                        <div className="text-[9px] font-bold text-slate-400 uppercase mt-2 font-mono">{v.id} • {v.date}</div>
                     </div>
                  </div>
                  <div className="text-right shrink-0">
                     <div className="text-xs font-black text-slate-900 tabular-nums italic">${v.amount.toLocaleString()}</div>
                     <span className={`text-[8px] font-black uppercase tracking-tighter ${v.status === 'Posted' ? 'text-emerald-500' : 'text-amber-500'}`}>{v.status}</span>
                  </div>
               </div>
             ))}
          </div>
          
          <div className="p-8 border-t border-slate-100 bg-slate-900 flex justify-between items-center shrink-0">
             <div className="space-y-1">
                <span className="text-[9px] font-black uppercase text-indigo-400 tracking-[0.4em] block">Payload Payload Staged</span>
                <div className="text-white text-2xl font-black italic tracking-tighter tabular-nums">{batchStats.count} Objects</div>
             </div>
             <div className="text-right">
                <span className="text-[9px] font-black uppercase text-slate-500 tracking-[0.4em] block">Aggregate Value</span>
                <div className="text-white text-2xl font-black italic tracking-tighter tabular-nums">${batchStats.value.toLocaleString()}</div>
             </div>
          </div>
        </div>

        {/* Persistent Configuration Panel */}
        <div className="bg-white rounded-[3rem] p-8 border border-slate-200 shadow-sm shrink-0 space-y-8">
           <div className="flex items-center justify-between border-b border-slate-50 pb-5">
              <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.4em]">Engine Directives</h3>
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded text-[7px] font-black uppercase">v4.4 STABLE</span>
           </div>
           
           <div className="grid grid-cols-2 gap-8">
              <div className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Page Architecture</label>
                    <select value={paperSize} onChange={e => setPaperSize(e.target.value as any)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-[9px] font-black text-indigo-600 outline-none hover:bg-white transition-all shadow-sm">
                       <option value="A4">A4 (ISO)</option>
                       <option value="Letter">US Letter</option>
                       <option value="A5">A5 (Compact)</option>
                    </select>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Rendering Protocol</label>
                    <select value={printLayout} onChange={e => setPrintLayout(e.target.value as any)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-[9px] font-black text-indigo-600 outline-none hover:bg-white transition-all shadow-sm">
                       <option value="GST_TAX_INVOICE">Statutory (GST)</option>
                       <option value="STANDARD">Classic Standard</option>
                       <option value="COMPACT">Minimal Density</option>
                    </select>
                 </div>
              </div>

              <div className="space-y-1 bg-slate-50 p-4 rounded-[1.5rem] border border-slate-100">
                 <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-2">Advanced Filters</label>
                 <Toggle label="Show Seal" value={showCompanySeal} onToggle={() => setShowCompanySeal(!showCompanySeal)} />
                 <Toggle label="Audit Hash" value={showAuditHash} onToggle={() => setShowAuditHash(!showAuditHash)} />
                 <Toggle label="Hide Narr." value={hideNarration} onToggle={() => setHideNarration(!hideNarration)} />
                 <Toggle label="Eco Mode" value={grayscaleMode} onToggle={() => setGrayscaleMode(!grayscaleMode)} />
              </div>
           </div>

           <button 
            onClick={triggerBatchPrint}
            disabled={selectedVchIds.length === 0 || isSpooling}
            className={`w-full py-6 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.5em] shadow-2xl transition-all transform active:scale-95 flex items-center justify-center space-x-4 border-b-8 border-slate-950 ${selectedVchIds.length === 0 || isSpooling ? 'bg-slate-200 text-slate-400 border-transparent' : 'bg-slate-900 text-white hover:bg-black'}`}
           >
              {isSpooling ? <div className="animate-pulse">SPOOLING ENGINE...</div> : <span>TRANSMIT TO CLUSTER</span>}
           </button>
        </div>
      </div>

      {/* Preview Viewport */}
      <div className="xl:col-span-3 flex flex-col min-h-0 bg-slate-200/50 rounded-[4rem] border border-slate-200 overflow-hidden shadow-inner relative">
         <div className="bg-white px-10 py-6 flex items-center justify-between border-b border-slate-200 shrink-0">
            <div className="flex items-center space-x-6">
               <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-inner">
                  <button onClick={() => { setFitMode('PAGE'); setIsAutoFit(true); }} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isAutoFit && fitMode === 'PAGE' ? 'bg-white text-indigo-600 shadow-lg scale-105' : 'text-slate-400'}`}>Full Page</button>
                  <button onClick={() => { setFitMode('WIDTH'); setIsAutoFit(true); }} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isAutoFit && fitMode === 'WIDTH' ? 'bg-white text-indigo-600 shadow-lg scale-105' : 'text-slate-400'}`}>Width Fit</button>
               </div>
               <span className="text-[9px] font-black uppercase text-slate-300 tracking-[0.3em] italic">Live Shard Preview</span>
            </div>

            <div className="flex items-center space-x-4 bg-slate-50 p-2.5 rounded-[1.8rem] border border-slate-200 shadow-sm">
               <button onClick={() => handleZoom(-ZOOM_STEP)} className="w-10 h-10 flex items-center justify-center bg-white rounded-xl text-slate-400 hover:text-indigo-600 transition-colors shadow-sm active:scale-90 border border-slate-100"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={4}><path d="M20 12H4" /></svg></button>
               <span className="text-xs font-black text-slate-800 tabular-nums italic w-14 text-center">{Math.round(scale * 100)}%</span>
               <button onClick={() => handleZoom(ZOOM_STEP)} className="w-10 h-10 flex items-center justify-center bg-white rounded-xl text-slate-400 hover:text-indigo-600 transition-colors shadow-sm active:scale-90 border border-slate-100"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={4}><path d="M12 4v16m8-8H4" /></svg></button>
            </div>
         </div>

         <div ref={containerRef} className="flex-1 overflow-auto custom-scrollbar p-16 relative scroll-smooth bg-slate-400/5">
            <div className="flex justify-center min-h-full">
               {previewVch ? (
                 <div 
                   style={{ 
                     width: `${docW * scale}px`, 
                     height: `${docH * scale}px`,
                     transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1), height 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                   }}
                   className="relative origin-top"
                 >
                   <div className="absolute -inset-2 bg-slate-900/5 blur-xl rounded-[1.5rem] pointer-events-none"></div>
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
                 <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-8 opacity-20 mt-20">
                    <div className="text-9xl grayscale">📦</div>
                    <p className="text-lg font-black uppercase tracking-[0.5em] italic">Spool Offline</p>
                 </div>
               )}
            </div>
            
            {/* Hidden output for the print stream */}
            <div id="batch-spool-output" className="hidden">
               {(selectedVchIds.length > 0 ? selectedVchIds : (filteredVouchers.length > 0 ? [filteredVouchers[0].id] : [])).map((id, idx) => {
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