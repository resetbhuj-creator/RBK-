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
  // Load preferences from persistence layer
  const [printLayout, setPrintLayout] = useState<LayoutType>(() => (localStorage.getItem('nx_print_layout') as LayoutType) || 'GST_TAX_INVOICE');
  const [paperSize, setPaperSize] = useState<PaperSize>(() => (localStorage.getItem('nx_paper_size') as PaperSize) || 'A4');
  const [orientation, setOrientation] = useState<Orientation>(() => (localStorage.getItem('nx_orientation') as Orientation) || 'Portrait');
  const [watermark, setWatermark] = useState<Watermark>(() => (localStorage.getItem('nx_watermark') as Watermark) || 'ORIGINAL');
  const [fontSizeScale, setFontSizeScale] = useState(() => parseFloat(localStorage.getItem('nx_font_scale') || '1.0'));
  const [marginScale, setMarginScale] = useState(() => parseFloat(localStorage.getItem('nx_margin_scale') || '1.0'));

  const [selectedVchIds, setSelectedVchIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [scale, setScale] = useState(0.85);
  const [isAutoFit, setIsAutoFit] = useState(true);
  const [fitMode, setFitMode] = useState<'PAGE' | 'WIDTH'>('PAGE');
  const [isSpooling, setIsSpooling] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);

  // Persist settings whenever they change
  useEffect(() => {
    localStorage.setItem('nx_print_layout', printLayout);
    localStorage.setItem('nx_paper_size', paperSize);
    localStorage.setItem('nx_orientation', orientation);
    localStorage.setItem('nx_watermark', watermark);
    localStorage.setItem('nx_font_scale', fontSizeScale.toString());
    localStorage.setItem('nx_margin_scale', marginScale.toString());
  }, [printLayout, paperSize, orientation, watermark, fontSizeScale, marginScale]);

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
      const gutter = 80;
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

  return (
    <div className="grid grid-cols-1 xl:grid-cols-5 gap-8 animate-in fade-in duration-500 h-[calc(100vh-160px)]">
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page { 
            margin: ${10 * marginScale}mm; 
            size: ${paperSize.toLowerCase()} ${orientation.toLowerCase()}; 
          }
          body * { visibility: hidden; }
          #batch-spool-output, #batch-spool-output * { visibility: visible; }
          #batch-spool-output { position: absolute; left: 0; top: 0; width: 100%; }
          .break-page { break-before: page; page-break-before: always; }
        }
      ` }} />

      {/* Control Pane */}
      <div className="xl:col-span-2 flex flex-col space-y-6 min-h-0">
        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col flex-1">
          <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50 shrink-0 space-y-4">
             <div className="flex items-center justify-between">
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-800">Spool Registry</h3>
                <button 
                  onClick={() => setSelectedVchIds(selectedVchIds.length === filteredVouchers.length ? [] : filteredVouchers.map(v => v.id))} 
                  className="text-[10px] font-black text-indigo-600 uppercase hover:underline tracking-widest transition-all"
                >
                   {selectedVchIds.length === filteredVouchers.length ? 'Deselect All' : 'Select Visible'}
                </button>
             </div>
             
             <div className="grid grid-cols-2 gap-3">
                <div className="relative group">
                   <input 
                     value={searchQuery}
                     onChange={e => setSearchQuery(e.target.value)}
                     placeholder="Filter nodes..."
                     className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all shadow-inner italic"
                   />
                   <svg className="w-4 h-4 absolute left-3 top-3 text-slate-300 group-focus-within:text-indigo-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
                <select 
                  value={typeFilter}
                  onChange={e => setTypeFilter(e.target.value)}
                  className="px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black text-indigo-600 outline-none cursor-pointer hover:border-indigo-300 transition-all"
                >
                  <option value="All">All Types</option>
                  <option value="Sales">Sales</option>
                  <option value="Purchase">Purchase</option>
                  <option value="Payment">Payment</option>
                  <option value="Receipt">Receipt</option>
                </select>
             </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-slate-50 bg-slate-50/20">
             {filteredVouchers.map(v => (
               <div 
                key={v.id} 
                onClick={() => setSelectedVchIds(prev => prev.includes(v.id) ? prev.filter(id => id !== v.id) : [v.id, ...prev])} 
                className={`p-5 cursor-pointer transition-all hover:bg-white flex items-center justify-between group ${selectedVchIds.includes(v.id) ? 'bg-indigo-50/60 border-l-4 border-indigo-600' : 'border-l-4 border-transparent'}`}
               >
                  <div className="flex items-center space-x-4">
                     <div className={`w-5 h-5 rounded-lg border-2 transition-all flex items-center justify-center ${selectedVchIds.includes(v.id) ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white border-slate-200 group-hover:border-indigo-300'}`}>
                        {selectedVchIds.includes(v.id) && <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={4}><path d="M5 13l4 4L19 7" /></svg>}
                     </div>
                     <div className="min-w-0">
                        <div className="text-xs font-black text-slate-800 uppercase italic leading-none group-hover:text-indigo-600 transition-colors truncate">{v.party}</div>
                        <div className="text-[9px] font-bold text-slate-400 uppercase mt-1.5 flex items-center">
                           <span className="font-mono text-indigo-400 mr-2">{v.id}</span>
                           <span className="text-slate-300 opacity-50 mr-2">|</span>
                           <span>{v.date}</span>
                        </div>
                     </div>
                  </div>
                  <div className="text-right shrink-0">
                     <div className="text-xs font-black text-slate-900 tabular-nums italic">${v.amount.toLocaleString()}</div>
                     <span className={`text-[8px] font-black uppercase tracking-tighter ${v.status === 'Posted' ? 'text-emerald-500' : 'text-amber-500'}`}>{v.status}</span>
                  </div>
               </div>
             ))}
             {filteredVouchers.length === 0 && (
               <div className="py-20 text-center opacity-30 italic">
                  <p className="text-[10px] font-black uppercase tracking-widest">Registry exhausted</p>
               </div>
             )}
          </div>
          
          <div className="p-6 border-t border-slate-100 bg-slate-900 flex justify-between items-center shrink-0">
             <div className="space-y-1">
                <span className="text-[9px] font-black uppercase text-indigo-400 tracking-[0.2em] block">Payload Staged</span>
                <div className="text-white text-lg font-black italic tracking-tighter tabular-nums">{batchStats.count} Objects</div>
             </div>
             <div className="text-right">
                <span className="text-[9px] font-black uppercase text-slate-500 tracking-[0.2em] block">Total Transacted</span>
                <div className="text-white text-lg font-black italic tracking-tighter tabular-nums">${batchStats.value.toLocaleString()}</div>
             </div>
          </div>
        </div>

        {/* Persistent Configuration Panel */}
        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm shrink-0 space-y-6">
           <div className="flex items-center justify-between border-b border-slate-50 pb-4">
              <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em]">Device Defaults</h3>
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]"></div>
           </div>
           
           <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Page Architecture</label>
                    <select 
                      value={paperSize} 
                      onChange={e => setPaperSize(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-[10px] font-black text-indigo-600 outline-none hover:bg-white transition-all shadow-sm"
                    >
                       <option value="A4">A4 (ISO Standard)</option>
                       <option value="Letter">US Letter</option>
                       <option value="A5">A5 (Compact)</option>
                    </select>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Render Orientation</label>
                    <select 
                      value={orientation} 
                      onChange={e => setOrientation(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-[10px] font-black text-indigo-600 outline-none hover:bg-white transition-all shadow-sm"
                    >
                       <option value="Portrait">Portrait</option>
                       <option value="Landscape">Landscape</option>
                    </select>
                 </div>
              </div>

              <div className="space-y-2">
                 <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Document Identity (Blueprint)</label>
                 <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'STANDARD', label: 'Classic', icon: '📄' },
                      { id: 'COMPACT', label: 'Minimal', icon: '📏' },
                      { id: 'GST_TAX_INVOICE', label: 'Statutory', icon: '🏛️' }
                    ].map(l => (
                      <button key={l.id} onClick={() => setPrintLayout(l.id as any)} className={`p-3 rounded-xl border-2 flex flex-col items-center justify-center transition-all ${printLayout === l.id ? 'bg-indigo-50 border-indigo-600 text-indigo-900 shadow-md' : 'bg-slate-50 border-transparent text-slate-400 hover:border-slate-200'}`}>
                         <span className="text-lg mb-1">{l.icon}</span>
                         <span className="text-[8px] font-black uppercase tracking-tighter">{l.label}</span>
                      </button>
                    ))}
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-6 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                 <div className="space-y-2">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex justify-between">
                       <span>Font Scale</span>
                       <span className="text-indigo-600">{Math.round(fontSizeScale * 100)}%</span>
                    </label>
                    <input 
                      type="range" min="0.5" max="1.5" step="0.05" 
                      value={fontSizeScale} 
                      onChange={e => setFontSizeScale(parseFloat(e.target.value))}
                      className="w-full h-1 bg-slate-200 rounded-full appearance-none accent-indigo-600 cursor-pointer" 
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex justify-between">
                       <span>Margins</span>
                       <span className="text-indigo-600">{Math.round(marginScale * 100)}%</span>
                    </label>
                    <input 
                      type="range" min="0.2" max="2.0" step="0.1" 
                      value={marginScale} 
                      onChange={e => setMarginScale(parseFloat(e.target.value))}
                      className="w-full h-1 bg-slate-200 rounded-full appearance-none accent-indigo-600 cursor-pointer" 
                    />
                 </div>
              </div>

              <div className="space-y-2">
                 <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Institutional Marking</label>
                 <div className="grid grid-cols-5 gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200">
                    {['NONE', 'DRAFT', 'ORIGINAL', 'DUPLICATE', 'TRIPLICATE'].map(w => (
                      <button 
                        key={w} 
                        onClick={() => setWatermark(w as any)}
                        className={`py-2 px-1 rounded-lg text-[7px] font-black uppercase transition-all ${watermark === w ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-700'}`}
                      >
                         {w === 'TRIPLICATE' ? 'TRIP' : w.substring(0, 4)}
                      </button>
                    ))}
                 </div>
              </div>
           </div>

           <button 
            onClick={triggerBatchPrint}
            disabled={selectedVchIds.length === 0 || isSpooling}
            className={`w-full py-5 rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.4em] shadow-2xl transition-all transform active:scale-95 flex items-center justify-center space-x-4 border-b-8 border-slate-950 ${selectedVchIds.length === 0 || isSpooling ? 'bg-slate-200 text-slate-400 border-transparent' : 'bg-slate-900 text-white hover:bg-black'}`}
           >
              {isSpooling ? (
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 border-3 border-white/20 border-t-white rounded-full animate-spin"></div>
                  <span>Syncing Shards...</span>
                </div>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                  <span>Transmit to Cluster</span>
                </>
              )}
           </button>
        </div>
      </div>

      {/* Preview Viewport */}
      <div className="xl:col-span-3 flex flex-col min-h-0 bg-slate-200/40 rounded-[3rem] border border-slate-200 overflow-hidden shadow-inner relative">
         <div className="bg-white px-10 py-5 flex items-center justify-between border-b border-slate-200 shrink-0">
            <div className="flex items-center space-x-6">
               <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 shadow-inner">
                  <button onClick={() => { setFitMode('PAGE'); setIsAutoFit(true); }} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isAutoFit && fitMode === 'PAGE' ? 'bg-white text-indigo-600 shadow-lg' : 'text-slate-400'}`}>Fit Page</button>
                  <button onClick={() => { setFitMode('WIDTH'); setIsAutoFit(true); }} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isAutoFit && fitMode === 'WIDTH' ? 'bg-white text-indigo-600 shadow-lg' : 'text-slate-400'}`}>Fit Width</button>
               </div>
               <span className="text-[8px] font-black uppercase text-slate-300 tracking-[0.2em] italic">Live Mirroring Shard 01</span>
            </div>

            <div className="flex items-center space-x-4 bg-slate-50 p-2 rounded-2xl border border-slate-200 shadow-sm">
               <button onClick={() => handleZoom(-ZOOM_STEP)} className="w-10 h-10 flex items-center justify-center bg-white rounded-xl text-slate-400 hover:text-indigo-600 transition-colors shadow-sm active:scale-90"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path d="M20 12H4" /></svg></button>
               <span className="text-xs font-black text-slate-800 tabular-nums italic w-12 text-center">{Math.round(scale * 100)}%</span>
               <button onClick={() => handleZoom(ZOOM_STEP)} className="w-10 h-10 flex items-center justify-center bg-white rounded-xl text-slate-400 hover:text-indigo-600 transition-colors shadow-sm active:scale-90"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path d="M12 4v16m8-8H4" /></svg></button>
            </div>
         </div>

         <div ref={containerRef} className="flex-1 overflow-auto custom-scrollbar p-16 relative scroll-smooth bg-slate-300/10">
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
                 <div className="flex flex-col items-center justify-center h-64 text-slate-400 space-y-8 opacity-40 mt-40">
                    <div className="w-24 h-24 bg-white rounded-[2.5rem] flex items-center justify-center shadow-inner border border-slate-200">
                      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                    </div>
                    <p className="text-sm font-black uppercase tracking-[0.5em] italic">Spool Buffer Offline</p>
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