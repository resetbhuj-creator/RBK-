import React, { useState, useMemo } from 'react';
import { Voucher } from '../types';

interface PrintCenterProps {
  vouchers: Voucher[];
  activeCompany: any;
}

type PaperSize = 'A4' | 'A5' | 'Letter';
type Orientation = 'Portrait' | 'Landscape';
type LayoutType = 'STANDARD' | 'COMPACT' | 'GST_TAX_INVOICE';

const PrintCenter: React.FC<PrintCenterProps> = ({ vouchers, activeCompany }) => {
  const [selectedVchId, setSelectedVchId] = useState<string | null>(null);
  const [printLayout, setPrintLayout] = useState<LayoutType>('GST_TAX_INVOICE');
  const [paperSize, setPaperSize] = useState<PaperSize>('A4');
  const [orientation, setOrientation] = useState<Orientation>('Portrait');

  const selectedVch = vouchers.find(v => v.id === selectedVchId);

  // Dimension mapping for preview (scaled)
  const getPreviewDimensions = () => {
    const baseWidth = paperSize === 'A4' ? 800 : paperSize === 'A5' ? 560 : 780;
    const aspectRatio = paperSize === 'A4' ? 1.414 : paperSize === 'A5' ? 1.414 : 1.29;
    
    if (orientation === 'Landscape') {
      return { width: baseWidth * aspectRatio, minHeight: baseWidth };
    }
    return { width: baseWidth, minHeight: baseWidth * aspectRatio };
  };

  const InvoicePreview = () => {
    if (!selectedVch) return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-6">
        <svg className="w-20 h-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
        <p className="text-sm font-black uppercase tracking-widest italic">Select a voucher from registry to load preview</p>
      </div>
    );

    const dims = getPreviewDimensions();
    const isCompact = printLayout === 'COMPACT';

    return (
      <div 
        style={{ width: `${dims.width}px`, minHeight: `${dims.minHeight}px` }}
        className={`bg-white p-12 shadow-2xl border border-slate-200 rounded-3xl animate-in zoom-in-95 duration-500 flex flex-col font-serif mx-auto transition-all ${isCompact ? 'scale-90' : ''}`}
      >
        {/* Statutory Header */}
        <div className={`flex justify-between items-start border-b-2 border-slate-900 pb-10 mb-10 ${isCompact ? 'pb-6 mb-6' : ''}`}>
           <div className="space-y-4">
              <div className={`${isCompact ? 'text-2xl' : 'text-4xl'} font-black italic tracking-tighter text-slate-900 uppercase`}>{activeCompany.name}</div>
              <div className="text-xs text-slate-600 font-sans max-w-sm leading-relaxed">{activeCompany.address}</div>
              <div className="text-[10px] font-black text-slate-900 font-sans uppercase">Tax ID / {activeCompany.taxLaw || 'GST'}: {activeCompany.taxId}</div>
           </div>
           <div className="text-right space-y-2">
              <h2 className={`${isCompact ? 'text-xl' : 'text-3xl'} font-black uppercase italic tracking-tighter font-sans text-indigo-600`}>
                {printLayout === 'GST_TAX_INVOICE' ? 'Tax Invoice' : selectedVch.type}
              </h2>
              <p className="text-xs font-bold text-slate-400 font-sans uppercase">Original for Recipient</p>
           </div>
        </div>

        {/* Party Details */}
        <div className="grid grid-cols-2 gap-20 mb-12 font-sans">
           <div>
              <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Billed To:</div>
              <div className="text-lg font-black text-slate-900 uppercase italic">{selectedVch.party}</div>
           </div>
           <div className="text-right">
              <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Invoice Particulars:</div>
              <div className="text-sm font-black text-slate-800">Doc No: {selectedVch.id}</div>
              <div className="text-sm font-bold text-slate-500">Date: {selectedVch.date}</div>
              {selectedVch.reference && <div className="text-xs font-medium text-slate-400 italic">Ref: {selectedVch.reference}</div>}
           </div>
        </div>

        {/* Item Grid */}
        <div className="flex-1 font-sans">
           <table className="w-full text-left">
              <thead className="bg-slate-50 border-y border-slate-200">
                 <tr className="text-[10px] font-black uppercase text-slate-400">
                    <th className="py-4 px-4">#</th>
                    <th className="py-4 px-4">Item Descriptor</th>
                    <th className="py-4 px-4 text-center">HSN</th>
                    <th className="py-4 px-4 text-center">Qty</th>
                    <th className="py-4 px-4 text-right">Rate</th>
                    <th className="py-4 px-4 text-right">Amount</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                 {selectedVch.items?.map((item, i) => (
                    <tr key={i} className="text-sm font-bold text-slate-800">
                       <td className="py-4 px-4">{i + 1}</td>
                       <td className="py-4 px-4 italic">{item.name}</td>
                       <td className="py-4 px-4 text-center font-mono text-[10px] text-slate-400">{item.hsn}</td>
                       <td className="py-4 px-4 text-center">{item.qty} {item.unit}</td>
                       <td className="py-4 px-4 text-right tabular-nums">${item.rate.toLocaleString()}</td>
                       <td className="py-4 px-4 text-right tabular-nums">${item.amount.toLocaleString()}</td>
                    </tr>
                 ))}
                 {!selectedVch.items && (
                   <tr className="text-sm font-bold text-slate-800">
                      <td className="py-8 px-4" colSpan={5}>General Accounting Ledger Posting</td>
                      <td className="py-8 px-4 text-right tabular-nums">${selectedVch.amount.toLocaleString()}</td>
                   </tr>
                 )}
              </tbody>
           </table>
        </div>

        {/* Totals */}
        <div className="mt-12 flex justify-end font-sans">
           <div className="w-72 space-y-3">
              <div className="flex justify-between text-xs font-bold text-slate-500">
                 <span>Sub-Total</span>
                 <span>${(selectedVch.subTotal || selectedVch.amount).toLocaleString()}</span>
              </div>
              {selectedVch.taxTotal && (
                 <div className="flex justify-between text-xs font-bold text-slate-500">
                    <span>Applicable Tax ({activeCompany.taxLaw})</span>
                    <span>${selectedVch.taxTotal.toLocaleString()}</span>
                 </div>
              )}
              <div className="flex justify-between items-center py-4 border-t-2 border-slate-900">
                 <span className="text-sm font-black uppercase italic">Grand Total</span>
                 <span className={`${isCompact ? 'text-xl' : 'text-2xl'} font-black tracking-tighter text-indigo-600`}>${selectedVch.amount.toLocaleString()}</span>
              </div>
           </div>
        </div>

        {/* Statutory Footer */}
        <div className="mt-auto pt-10 border-t border-slate-100 font-sans">
           <div className="text-[10px] font-black uppercase text-slate-400 mb-2">Narration / Footnotes:</div>
           <p className="text-[11px] text-slate-500 leading-relaxed italic">{selectedVch.narration || 'E. & O.E. Payments due upon receipt.'}</p>
           <div className="mt-10 flex justify-between items-end">
              <div className="text-[9px] text-slate-300 font-black uppercase tracking-widest italic">Generated via Nexus ERP Suite v1.1</div>
              <div className="text-center w-48 border-t border-slate-200 pt-2">
                 <div className="text-[10px] font-black uppercase text-slate-900">Authorized Signatory</div>
              </div>
           </div>
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-5 gap-8 animate-in fade-in duration-500">
      <div className="xl:col-span-2 space-y-6">
        <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
             <h3 className="text-xl font-black italic uppercase text-slate-800 tracking-tight">Print Registry</h3>
             <div className="flex bg-slate-200/50 p-1 rounded-xl">
                {['Sales', 'Payment'].map(t => (
                  <button key={t} className="px-4 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-lg text-slate-500 hover:text-indigo-600 transition-colors">{t}</button>
                ))}
             </div>
          </div>
          <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
             {vouchers.map(v => (
               <div 
                key={v.id} 
                onClick={() => setSelectedVchId(v.id)}
                className={`p-6 border-b border-slate-50 cursor-pointer transition-all hover:bg-slate-50 flex items-center justify-between ${selectedVchId === v.id ? 'bg-indigo-50/50 border-indigo-100 ring-2 ring-inset ring-indigo-500' : ''}`}
               >
                  <div className="flex items-center space-x-4">
                     <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-[10px] font-black ${v.type === 'Sales' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>{v.type.charAt(0)}</div>
                     <div>
                        <div className="text-xs font-black text-slate-800 uppercase tracking-tight">{v.party}</div>
                        <div className="text-[9px] font-bold text-slate-400 uppercase">{v.id} • {v.date}</div>
                     </div>
                  </div>
                  <div className="text-right">
                     <div className="text-xs font-black text-slate-900">${v.amount.toLocaleString()}</div>
                     <div className="text-[8px] font-black text-slate-400 uppercase">{v.status}</div>
                  </div>
               </div>
             ))}
          </div>
        </div>

        <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl">
           <h3 className="text-[10px] font-black uppercase text-indigo-400 tracking-[0.3em] mb-10">Output Configuration</h3>
           <div className="space-y-6">
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Document Template</label>
                 <select 
                   value={printLayout} 
                   onChange={e => setPrintLayout(e.target.value as LayoutType)} 
                   className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-xs font-black text-indigo-400 outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer"
                 >
                    <option value="GST_TAX_INVOICE" className="bg-slate-900">Statutory Tax Invoice</option>
                    <option value="STANDARD" className="bg-slate-900">Standard Business Letter</option>
                    <option value="COMPACT" className="bg-slate-900">Compact POS Receipt</option>
                 </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Paper Size</label>
                  <select 
                    value={paperSize} 
                    onChange={e => setPaperSize(e.target.value as PaperSize)} 
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-xs font-black text-indigo-400 outline-none appearance-none cursor-pointer"
                  >
                    {['A4', 'A5', 'Letter'].map(s => <option key={s} value={s} className="bg-slate-900">{s}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Orientation</label>
                  <select 
                    value={orientation} 
                    onChange={e => setOrientation(e.target.value as Orientation)} 
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-xs font-black text-indigo-400 outline-none appearance-none cursor-pointer"
                  >
                    {['Portrait', 'Landscape'].map(o => <option key={o} value={o} className="bg-slate-900">{o}</option>)}
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-white/5">
                <button 
                  onClick={() => window.print()} 
                  disabled={!selectedVchId} 
                  className={`w-full py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl transition-all transform active:scale-95 flex items-center justify-center space-x-4 ${!selectedVchId ? 'bg-slate-800 text-slate-600 cursor-not-allowed' : 'bg-indigo-600 text-white shadow-indigo-900/40 hover:bg-indigo-500'}`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                  <span>Initiate Hardcopy Print</span>
                </button>
              </div>
           </div>
           <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600 rounded-full blur-[100px] opacity-10 -mr-32 -mt-32"></div>
        </div>
      </div>

      <div className="xl:col-span-3">
         <div className="bg-slate-200/50 rounded-[3.5rem] p-12 border-4 border-dashed border-slate-300 min-h-[900px] flex flex-col items-center overflow-x-auto custom-scrollbar">
            <div className="inline-block px-4 py-1 bg-slate-900 text-white rounded-full text-[9px] font-black uppercase tracking-widest mb-8 shrink-0">Virtual Rendering Node</div>
            <div className="w-full">
               <InvoicePreview />
            </div>
         </div>
      </div>
    </div>
  );
};

export default PrintCenter;