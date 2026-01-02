import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Voucher } from '../types';

interface PrintCenterProps {
  vouchers: Voucher[];
  activeCompany: any;
}

type PaperSize = 'A4' | 'A5' | 'Letter';
type Orientation = 'Portrait' | 'Landscape';
type LayoutType = 'GST_MODERN' | 'CORPORATE_MINIMAL' | 'THERMAL_POS';
type Watermark = 'DRAFT' | 'ORIGINAL' | 'DUPLICATE' | 'TRIPLICATE' | 'NONE';

const PrintCenter: React.FC<PrintCenterProps> = ({ vouchers, activeCompany }) => {
  const [selectedVchIds, setSelectedVchIds] = useState<string[]>([]);
  const [printLayout, setPrintLayout] = useState<LayoutType>('GST_MODERN');
  const [paperSize, setPaperSize] = useState<PaperSize>('A4');
  const [orientation, setOrientation] = useState<Orientation>('Portrait');
  const [watermark, setWatermark] = useState<Watermark>('ORIGINAL');
  const [showSignatory, setShowSignatory] = useState(true);
  
  const [scale, setScale] = useState(0.85);
  const containerRef = useRef<HTMLDivElement>(null);

  const previewVch = useMemo(() => {
    return vouchers.find(v => v.id === selectedVchIds[0]) || null;
  }, [vouchers, selectedVchIds]);

  const handleZoom = (delta: number) => {
    setScale(prev => Math.min(Math.max(prev + delta, 0.15), 3.0));
  };

  const getNativeDimensions = () => {
    const isThermal = printLayout === 'THERMAL_POS';
    if (isThermal) return { width: 320, height: 800 }; // Standard 80mm
    
    // Pixels at 96 DPI
    let width = paperSize === 'A4' ? 794 : paperSize === 'A5' ? 559 : 816;
    let height = paperSize === 'A4' ? 1123 : paperSize === 'A5' ? 794 : 1056;

    if (orientation === 'Landscape') {
      [width, height] = [height, width];
    }
    return { width, height };
  };

  const handleFitWidth = () => {
    if (containerRef.current) {
      const { width: nativeWidth } = getNativeDimensions();
      const containerWidth = containerRef.current.clientWidth - 100;
      setScale(containerWidth / nativeWidth);
    }
  };

  const handleFitPage = () => {
    if (containerRef.current) {
      const { width: nativeWidth, height: nativeHeight } = getNativeDimensions();
      const containerWidth = containerRef.current.clientWidth - 100;
      const containerHeight = containerRef.current.clientHeight - 100;
      
      const scaleW = containerWidth / nativeWidth;
      const scaleH = containerHeight / nativeHeight;
      
      // Use the smaller scale to fit the "Whole Format"
      setScale(Math.min(scaleW, scaleH));
    }
  };

  // Default to Fit Page when a voucher is selected
  useEffect(() => { 
    if (previewVch) {
      // Small delay to ensure container dimensions are settled
      const timer = setTimeout(handleFitPage, 50);
      return () => clearTimeout(timer);
    }
  }, [previewVch?.id, orientation, paperSize, printLayout]);

  const amountInWords = (num: number) => {
    return "USD " + num.toLocaleString().toUpperCase() + " ONLY";
  };

  const InvoicePreview = () => {
    if (!previewVch) return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-6 animate-pulse">
        <svg className="w-24 h-24 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
        <p className="text-sm font-black uppercase tracking-[0.3em] italic opacity-40 text-white">Registry Selection Required</p>
      </div>
    );

    const { width, height } = getNativeDimensions();

    return (
      <div 
        style={{ 
          width: `${width}px`, 
          minHeight: `${height}px`,
          transform: `scale(${scale})`,
          transformOrigin: 'top center',
          boxShadow: `0 ${40 * scale}px ${100 * scale}px -20px rgba(0,0,0,0.7)`
        }}
        className="bg-white p-12 flex flex-col font-sans transition-all duration-500 ease-out relative text-slate-900 border border-slate-300 overflow-hidden"
      >
        {/* Paper Texture Overlay */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]"></div>
        
        {/* Statutory Header Copy Label */}
        {watermark !== 'NONE' && (
          <div className="absolute top-10 right-10 border-[3px] border-indigo-600 px-6 py-2 rotate-[15deg] opacity-70 rounded-md">
            <span className="text-indigo-600 font-black text-xs uppercase tracking-[0.2em]">{watermark} COPY</span>
          </div>
        )}

        {/* TOP SECTION: COMPANY IDENTITY */}
        <div className="flex justify-between items-start border-b-4 border-slate-900 pb-10 mb-10">
           <div className="space-y-6">
              <div className="text-5xl font-black italic tracking-tighter text-slate-900 uppercase leading-none">{activeCompany.name}</div>
              <div className="max-w-md space-y-1.5">
                <p className="text-xs font-bold text-slate-500 uppercase leading-relaxed">{activeCompany.address}</p>
                <div className="flex items-center space-x-6 mt-4">
                  <p className="text-xs font-black text-indigo-600 uppercase">GSTIN: <span className="text-slate-900">{activeCompany.taxId || '27AAAAA0000A1Z5'}</span></p>
                  <p className="text-xs font-black text-indigo-600 uppercase">Email: <span className="text-slate-900 normal-case">{activeCompany.email || 'accounts@nexus-corp.com'}</span></p>
                </div>
              </div>
           </div>
           <div className="text-right flex flex-col items-end">
              <div className="text-4xl font-black italic uppercase tracking-tighter text-indigo-600 mb-6 underline decoration-indigo-200 underline-offset-8">TAX INVOICE</div>
              <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div className="flex justify-between w-56 text-xs font-black border-b border-slate-200 pb-2">
                  <span className="text-slate-400 uppercase tracking-widest">Inv No:</span>
                  <span className="text-slate-900">{previewVch.id}</span>
                </div>
                <div className="flex justify-between w-56 text-xs font-black border-b border-slate-200 pb-2">
                  <span className="text-slate-400 uppercase tracking-widest">Dated:</span>
                  <span className="text-slate-900">{previewVch.date}</span>
                </div>
                <div className="flex justify-between w-56 text-xs font-black">
                  <span className="text-slate-400 uppercase tracking-widest">State:</span>
                  <span className="text-slate-900">{activeCompany.state}</span>
                </div>
              </div>
           </div>
        </div>

        {/* BILLING & SHIPPING NODES */}
        <div className="grid grid-cols-2 gap-12 mb-12">
           <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-200 relative overflow-hidden">
              <div className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em] mb-4 border-b border-indigo-100 pb-2">Billed To (Consignee)</div>
              <div className="text-xl font-black text-slate-900 uppercase italic mb-2">{previewVch.party}</div>
              <p className="text-xs font-medium text-slate-500 leading-relaxed">System Identity Node: P-90822-X</p>
              <p className="text-[10px] font-black text-slate-400 mt-4 uppercase tracking-widest">Master Registered Address Active ✓</p>
           </div>
           <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-200">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4 border-b border-slate-200 pb-2">Logistics / Compliance Details</div>
              <div className="text-xs font-black text-slate-600 space-y-2">
                <p className="flex justify-between"><span>Transport Mode:</span> <span className="text-slate-900">Road / Hand Delivery</span></p>
                <p className="flex justify-between"><span>Vehicle No:</span> <span className="text-slate-900">N/A (Local Supply)</span></p>
                <p className="flex justify-between"><span>Place of Supply:</span> <span className="text-slate-900 uppercase">{activeCompany.state}</span></p>
              </div>
           </div>
        </div>

        {/* TRANSACTIONAL TABLE */}
        <div className="flex-1">
           <table className="w-full text-left border-collapse border-2 border-slate-900">
              <thead className="bg-slate-900 text-white">
                 <tr className="text-[10px] font-black uppercase tracking-widest">
                    <th className="p-4 border-r border-slate-700 w-12 text-center">#</th>
                    <th className="p-4 border-r border-slate-700">Particulars / Description</th>
                    <th className="p-4 border-r border-slate-700 text-center">HSN/SAC</th>
                    <th className="p-4 border-r border-slate-700 text-center">Qty</th>
                    <th className="p-4 border-r border-slate-700 text-right">Rate</th>
                    <th className="p-4 text-right">Value</th>
                 </tr>
              </thead>
              <tbody>
                 {(previewVch.items || []).map((item, i) => (
                    <tr key={i} className="text-xs font-black border-b border-slate-200 hover:bg-slate-50 transition-colors">
                       <td className="p-4 border-r border-slate-200 text-center text-slate-400 font-mono">{i + 1}</td>
                       <td className="p-4 border-r border-slate-200 italic text-sm">{item.name}</td>
                       <td className="p-4 border-r border-slate-200 text-center font-mono text-[11px] text-slate-500">{item.hsn}</td>
                       <td className="p-4 border-r border-slate-200 text-center text-slate-900">{item.qty} {item.unit}</td>
                       <td className="p-4 border-r border-slate-200 text-right tabular-nums">${item.rate.toLocaleString()}</td>
                       <td className="p-4 text-right tabular-nums font-bold">${item.amount.toLocaleString()}</td>
                    </tr>
                 ))}
                 {/* Visual Padding for Whole Format Realism */}
                 {[...Array(Math.max(0, 8 - (previewVch.items?.length || 0)))].map((_, i) => (
                   <tr key={`pad-${i}`} className="border-b border-slate-100 h-14">
                     <td className="p-4 border-r border-slate-100"></td>
                     <td className="p-4 border-r border-slate-100"></td>
                     <td className="p-4 border-r border-slate-100"></td>
                     <td className="p-4 border-r border-slate-100"></td>
                     <td className="p-4 border-r border-slate-100"></td>
                     <td className="p-4"></td>
                   </tr>
                 ))}
              </tbody>
           </table>

           <div className="flex border-2 border-t-0 border-slate-900">
              <div className="flex-1 p-8 space-y-6">
                 <div className="space-y-2">
                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-[0.3em] block">Total Payable (Amount in Words)</span>
                    <span className="text-xs font-black italic text-slate-800 uppercase leading-none border-b border-slate-200 pb-2 block">{amountInWords(previewVch.amount)}</span>
                 </div>
                 <div className="space-y-2">
                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-[0.3em] block">Statutory Declaration</span>
                    <p className="text-[10px] font-medium text-slate-500 leading-relaxed italic">
                      We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct. E. & O. E.
                    </p>
                 </div>
              </div>
              <div className="w-80 border-l-2 border-slate-900 divide-y divide-slate-100">
                 <div className="flex justify-between px-6 py-3 text-xs font-black">
                    <span className="text-slate-400 uppercase tracking-widest">Taxable Value</span>
                    <span>${(previewVch.subTotal || previewVch.amount).toLocaleString()}</span>
                 </div>
                 <div className="flex justify-between px-6 py-3 text-xs font-black text-indigo-600">
                    <span className="uppercase tracking-widest">Output IGST Total</span>
                    <span>${(previewVch.taxTotal || 0).toLocaleString()}</span>
                 </div>
                 <div className="flex justify-between px-6 py-6 bg-slate-900 text-white text-xl font-black italic">
                    <span className="uppercase tracking-tighter text-sm self-center">Grand Total</span>
                    <span className="tabular-nums">${previewVch.amount.toLocaleString()}</span>
                 </div>
              </div>
           </div>
        </div>

        {/* HSN STATUTORY ANNEXURE */}
        <div className="mt-12 bg-slate-50 p-6 rounded-[1.5rem] border border-slate-200">
           <div className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mb-4 px-2">HSN/SAC Statutory Breakdown Summary</div>
           <table className="w-full text-center border-collapse text-[10px] font-black">
              <thead className="text-slate-500 border-b-2 border-slate-200">
                 <tr>
                    <th className="pb-2">HSN/SAC</th>
                    <th className="pb-2">Taxable Base</th>
                    <th className="pb-2 text-indigo-600">CGST</th>
                    <th className="pb-2 text-indigo-600">SGST</th>
                    <th className="pb-2">Total Tax</th>
                 </tr>
              </thead>
              <tbody>
                 {(previewVch.items || []).map((item, i) => (
                    <tr key={i} className="border-b border-slate-100">
                       <td className="py-3 font-mono text-slate-800">{item.hsn}</td>
                       <td className="py-3">${item.amount.toLocaleString()}</td>
                       <td className="py-3 text-indigo-600">${((item.taxAmount || 0)/2).toLocaleString()}</td>
                       <td className="py-3 text-indigo-600">${((item.taxAmount || 0)/2).toLocaleString()}</td>
                       <td className="py-3">${(item.taxAmount || 0).toLocaleString()}</td>
                    </tr>
                 ))}
              </tbody>
           </table>
        </div>

        {/* FOOTER & SIGNATORY */}
        <div className="mt-auto pt-12 border-t-4 border-slate-900 flex justify-between items-end">
           <div className="space-y-8">
              <div className="space-y-2 bg-slate-900 text-white p-6 rounded-3xl w-72 shadow-xl">
                 <div className="text-[10px] font-black uppercase tracking-widest text-indigo-400 border-b border-white/10 pb-2 mb-2">Settlement Registry</div>
                 <div className="text-xs font-black italic space-y-1">
                    <p className="flex justify-between opacity-60"><span>BANK:</span> <span>CITIBANK NA</span></p>
                    <p className="flex justify-between"><span>A/C:</span> <span>00129988445511</span></p>
                    <p className="flex justify-between opacity-60"><span>IFSC:</span> <span>CITI0000004</span></p>
                 </div>
              </div>
              <div className="text-[9px] text-slate-300 font-black uppercase tracking-[0.5em]">NEXUS ERP v4.8.2-STABLE • CORE NODE AUTHENTICATED</div>
           </div>
           
           {showSignatory && (
              <div className="w-80 text-center space-y-6">
                 <div className="text-xs font-black uppercase text-slate-900 tracking-widest italic">For {activeCompany.name}</div>
                 <div className="w-full h-32 bg-slate-50 border-2 border-slate-200 rounded-[2.5rem] flex items-center justify-center relative overflow-hidden group shadow-inner">
                    <div className="absolute inset-0 flex items-center justify-center opacity-[0.04] pointer-events-none -rotate-12 scale-150">
                       <span className="text-5xl font-black">NEXUS SIGNATURE</span>
                    </div>
                    <svg className="w-20 h-20 text-indigo-600/30 rotate-12 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                    <div className="absolute bottom-4 text-[9px] font-black text-indigo-500/40 uppercase tracking-[0.4em]">Digital Seal Active</div>
                 </div>
                 <div className="text-xs font-black uppercase text-slate-900 border-t-2 border-slate-900 pt-3 tracking-[0.2em]">Authorized Institutional Signatory</div>
              </div>
           )}
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-5 gap-10 animate-in fade-in duration-500 pb-20">
      {/* Sidebar Controls */}
      <div className="xl:col-span-2 space-y-8">
        <div className="bg-white rounded-[3.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[520px]">
          <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
             <h3 className="text-xl font-black italic uppercase text-slate-800 tracking-tight">Print Queue</h3>
             <div className="flex items-center space-x-3">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{selectedVchIds.length} Spooled</span>
                <button onClick={() => setSelectedVchIds([])} className="text-[10px] font-black text-rose-500 uppercase hover:underline decoration-rose-200 underline-offset-4">Reset</button>
             </div>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
             {vouchers.map(v => (
               <div 
                key={v.id} 
                onClick={() => toggleSelection(v.id)}
                className={`p-6 border-b border-slate-50 cursor-pointer transition-all hover:bg-slate-50 flex items-center justify-between group ${selectedVchIds.includes(v.id) ? 'bg-indigo-50/50 border-indigo-100' : ''}`}
               >
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

        <div className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl border-t-8 border-indigo-500">
           <h3 className="text-[11px] font-black uppercase text-indigo-400 tracking-[0.4em] mb-10">Formatting Engine</h3>
           <div className="space-y-8">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Template Style</label>
                  <select value={printLayout} onChange={e => setPrintLayout(e.target.value as LayoutType)} className="w-full bg-white/5 border border-white/10 rounded-[1.5rem] px-5 py-4 text-xs font-black text-indigo-400 outline-none cursor-pointer">
                    <option value="GST_MODERN" className="bg-slate-900">Modern Statutory GST</option>
                    <option value="CORPORATE_MINIMAL" className="bg-slate-900">Executive Minimalist</option>
                    <option value="THERMAL_POS" className="bg-slate-900">80mm POS Thermal</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Statutory Legend</label>
                  <select value={watermark} onChange={e => setWatermark(e.target.value as Watermark)} className="w-full bg-white/5 border border-white/10 rounded-[1.5rem] px-5 py-4 text-xs font-black text-indigo-400 outline-none cursor-pointer">
                    {['ORIGINAL', 'DUPLICATE', 'TRIPLICATE', 'DRAFT', 'NONE'].map(w => <option key={w} value={w} className="bg-slate-900">{w} COPY</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <button onClick={() => setOrientation(orientation === 'Portrait' ? 'Landscape' : 'Portrait')} className="flex items-center justify-between p-5 bg-white/5 rounded-[1.5rem] border border-white/10 group hover:bg-indigo-600 transition-all shadow-lg">
                   <div className="text-left">
                      <div className="text-[9px] font-black uppercase text-slate-500 group-hover:text-indigo-200 tracking-widest">Layout</div>
                      <div className="text-sm font-black uppercase italic tracking-tight">{orientation}</div>
                   </div>
                   <svg className={`w-6 h-6 transition-transform duration-700 ${orientation === 'Landscape' ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                </button>
                <button onClick={() => setShowSignatory(!showSignatory)} className={`flex items-center justify-between p-5 rounded-[1.5rem] border transition-all shadow-xl ${showSignatory ? 'bg-indigo-600 border-indigo-400' : 'bg-white/5 border-white/10 opacity-60'}`}>
                   <div className="text-left">
                      <div className="text-[9px] font-black uppercase text-indigo-200 tracking-widest">Auth Seal</div>
                      <div className="text-sm font-black uppercase italic tracking-tight">{showSignatory ? 'Visible' : 'Hidden'}</div>
                   </div>
                   <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                </button>
              </div>

              <div className="pt-6 border-t border-white/5">
                <button 
                  onClick={() => window.print()} 
                  disabled={selectedVchIds.length === 0} 
                  className={`w-full py-6 rounded-[2rem] font-black text-xs uppercase tracking-[0.4em] shadow-2xl transition-all transform active:scale-95 flex items-center justify-center space-x-5 ${selectedVchIds.length === 0 ? 'bg-slate-800 text-slate-600 cursor-not-allowed' : 'bg-white text-slate-900 hover:bg-indigo-600 hover:text-white'}`}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                  <span>Transmit Spooler</span>
                </button>
              </div>
           </div>
        </div>
      </div>

      {/* High-Fidelity Preview Area */}
      <div className="xl:col-span-3 flex flex-col h-[calc(100vh-180px)]">
         {/* Studio Toolbar */}
         <div className="bg-white border border-slate-200 rounded-t-[4rem] p-6 flex items-center justify-between shadow-lg z-10 mx-6 mb-[-1px] relative">
            <div className="flex items-center space-x-5">
               <div className="px-6 py-2.5 bg-slate-900 text-white rounded-full flex items-center space-x-4 shadow-xl border border-slate-800">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_12px_#10b981]"></div>
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] italic">Hi-Fi Format Preview</span>
               </div>
            </div>
            
            <div className="flex items-center space-x-2 bg-slate-100 p-1.5 rounded-[2rem] border border-slate-200 shadow-inner">
               <button onClick={() => handleZoom(-0.1)} className="w-12 h-12 flex items-center justify-center bg-white rounded-2xl text-slate-600 hover:text-indigo-600 shadow-sm transition-all transform active:scale-90 border border-slate-50"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M20 12H4" /></svg></button>
               <div className="px-6 min-w-[90px] text-center font-black text-sm text-slate-800 italic tabular-nums">{Math.round(scale * 100)}%</div>
               <button onClick={() => handleZoom(0.1)} className="w-12 h-12 flex items-center justify-center bg-white rounded-2xl text-slate-600 hover:text-indigo-600 shadow-sm transition-all transform active:scale-90 border border-slate-50"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg></button>
               
               <div className="w-px h-8 bg-slate-200 mx-3"></div>
               
               <button onClick={handleFitWidth} className="px-6 py-3 bg-white text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm hover:text-indigo-600 transition-all border border-slate-50">Width</button>
               <button onClick={handleFitPage} className="px-8 py-3 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl hover:bg-indigo-700 transition-all flex items-center space-x-3 transform active:scale-95">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" /></svg>
                  <span>Whole Format</span>
               </button>
            </div>

            <div className="hidden lg:flex items-center space-x-4 pr-6">
               <span className="text-[11px] font-black uppercase text-slate-400 tracking-[0.2em]">{paperSize} • {orientation}</span>
            </div>
         </div>

         {/* Rendering Canvas */}
         <div 
          ref={containerRef}
          className="bg-slate-800 rounded-b-[4rem] p-16 border-4 border-slate-900 flex-1 flex flex-col items-center overflow-auto custom-scrollbar shadow-2xl relative scroll-smooth"
         >
            <div className="w-full flex justify-center pb-32 pt-10">
               <InvoicePreview />
            </div>
            
            {/* Contextual Grid Backdrop */}
            <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, white 1.5px, transparent 1.5px)', backgroundSize: '40px 40px' }}></div>
            
            {/* Subtle Lighting Effect */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-white opacity-[0.02] blur-[120px] rounded-full pointer-events-none"></div>
         </div>
      </div>
    </div>
  );

  function toggleSelection(id: string) {
    setSelectedVchIds(prev => prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]);
  }
};

export default PrintCenter;