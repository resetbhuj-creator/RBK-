import React from 'react';
import { Voucher } from '../types';

interface PrintLayoutProps {
  voucher: Voucher;
  activeCompany: any;
  layout?: 'GST_TAX_INVOICE' | 'STANDARD' | 'COMPACT';
  watermark?: 'DRAFT' | 'ORIGINAL' | 'DUPLICATE' | 'TRIPLICATE' | 'NONE';
  scale?: number;
  paperSize?: 'A4' | 'A5' | 'Letter';
  orientation?: 'Portrait' | 'Landscape';
}

const PrintLayout: React.FC<PrintLayoutProps> = ({ 
  voucher, 
  activeCompany, 
  layout = 'STANDARD', 
  watermark = 'NONE',
  scale = 1,
  paperSize = 'A4',
  orientation = 'Portrait'
}) => {
  const amountInWords = (num: number) => {
    return "USD " + num.toLocaleString().toUpperCase() + " ONLY";
  };

  const getNativeDimensions = () => {
    let baseWidth = 794; // A4 96dpi
    let baseHeight = 1123;
    let label = 'A4 Standard';

    if (paperSize === 'Letter') {
      baseWidth = 816;
      baseHeight = 1056;
      label = 'US Letter';
    } else if (paperSize === 'A5') {
      baseWidth = 559;
      baseHeight = 794;
      label = 'A5 Booklet';
    }

    if (orientation === 'Landscape') {
      return { width: baseHeight, height: baseWidth, label: `${label} (Landscape)` };
    }
    return { width: baseWidth, height: baseHeight, label: `${label} (Portrait)` };
  };

  const { width, height, label: dimLabel } = getNativeDimensions();

  // Layout-specific styling logic
  const isCompact = layout === 'COMPACT';
  const isGst = layout === 'GST_TAX_INVOICE';

  const containerPadding = isCompact ? 'p-6' : 'p-12';
  const headerSpacing = isCompact ? 'pb-6 mb-6' : 'pb-10 mb-10';
  const tableFontSize = isCompact ? 'text-[10px]' : 'text-xs';
  const sectionSpacing = isCompact ? 'mb-6' : 'mb-12';
  const tableCellPadding = isCompact ? 'p-2' : 'p-4';

  return (
    <div className="relative group">
      {/* Physical Dimension Helper (Visual Only) */}
      <div className="absolute -top-8 left-0 text-[10px] font-black uppercase text-white/30 tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
        {dimLabel} • {width}px × {height}px • Layout: {layout}
      </div>

      <div 
        style={{ 
          width: `${width}px`, 
          minHeight: `${height}px`,
          transform: `scale(${scale})`,
          transformOrigin: 'top center',
        }}
        className={`bg-white ${containerPadding} flex flex-col font-sans relative text-slate-900 border border-slate-200 overflow-hidden shadow-2xl transition-all duration-300`}
      >
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]"></div>
        
        {watermark !== 'NONE' && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-[10px] border-indigo-600/10 px-12 py-6 rotate-[35deg] opacity-20 rounded-2xl z-0 pointer-events-none">
            <span className="text-indigo-600 font-black text-7xl uppercase tracking-[0.3em] whitespace-nowrap">{watermark} COPY</span>
          </div>
        )}

        {/* Header */}
        <div className={`flex justify-between items-start border-b-4 border-slate-900 ${headerSpacing} relative z-10`}>
           <div className={isCompact ? 'space-y-2' : 'space-y-6'}>
              <div className={`${isCompact ? 'text-2xl' : 'text-5xl'} font-black italic tracking-tighter text-slate-900 uppercase leading-none`}>
                {activeCompany.name}
              </div>
              <div className="max-w-md space-y-1.5">
                <p className={`${isCompact ? 'text-[9px]' : 'text-xs'} font-bold text-slate-500 uppercase leading-relaxed`}>
                  {activeCompany.address}
                </p>
                <div className={`flex items-center space-x-6 mt-4 ${isCompact ? 'text-[10px]' : 'text-xs'} font-black text-indigo-600 uppercase`}>
                  <p>TAX ID: <span className="text-slate-900">{activeCompany.taxId || '27AAAAA0000A1Z5'}</span></p>
                  {!isCompact && <p>Email: <span className="text-slate-900 normal-case">{activeCompany.email || 'accounts@nexus-corp.com'}</span></p>}
                </div>
              </div>
           </div>
           <div className="text-right flex flex-col items-end">
              <div className={`${isCompact ? 'text-2xl' : 'text-4xl'} font-black italic uppercase tracking-tighter text-indigo-600 mb-6 underline decoration-indigo-200 underline-offset-8`}>
                {isGst ? 'TAX INVOICE' : voucher.type === 'Sales' ? 'SALES INVOICE' : 'FINANCIAL VOUCHER'}
              </div>
              <div className={`space-y-2 bg-slate-50 ${isCompact ? 'p-2' : 'p-4'} rounded-2xl border border-slate-100`}>
                <div className={`flex justify-between ${isCompact ? 'w-40 text-[10px]' : 'w-56 text-xs'} font-black border-b border-slate-200 pb-1`}>
                  <span className="text-slate-400 uppercase tracking-widest">Doc No:</span>
                  <span className="text-slate-900">{voucher.id}</span>
                </div>
                <div className={`flex justify-between ${isCompact ? 'w-40 text-[10px]' : 'w-56 text-xs'} font-black border-b border-slate-200 pb-1`}>
                  <span className="text-slate-400 uppercase tracking-widest">Dated:</span>
                  <span className="text-slate-900">{voucher.date}</span>
                </div>
              </div>
           </div>
        </div>

        {/* Parties */}
        <div className={`grid grid-cols-2 gap-12 ${sectionSpacing} relative z-10`}>
           <div className={`${isCompact ? 'p-4' : 'p-6'} bg-slate-50 rounded-[2rem] border border-slate-200`}>
              <div className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em] mb-2 border-b border-indigo-100 pb-2">
                {voucher.type === 'Sales' ? 'Billed To' : 'From (Supplier)'}
              </div>
              <div className={`${isCompact ? 'text-lg' : 'text-xl'} font-black text-slate-900 uppercase italic mb-1`}>
                {voucher.party}
              </div>
              {!isCompact && <p className="text-[10px] font-black text-slate-400 mt-4 uppercase tracking-widest">Identity Verified ✓</p>}
           </div>
           <div className={`${isCompact ? 'p-4' : 'p-6'} bg-slate-50 rounded-[2rem] border border-slate-200`}>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2 border-b border-slate-200 pb-2">Context</div>
              <div className={`${isCompact ? 'text-[10px]' : 'text-xs'} font-black text-slate-600 space-y-1`}>
                <p className="flex justify-between"><span>Supply:</span> <span className="text-slate-900">{voucher.supplyType || 'Standard'}</span></p>
                <p className="flex justify-between"><span>Ref:</span> <span className="text-slate-900 uppercase">{voucher.reference || 'N/A'}</span></p>
              </div>
           </div>
        </div>

        {/* Items Table */}
        <div className="flex-1 relative z-10">
           <table className={`w-full text-left border-collapse border-2 ${isGst ? 'border-slate-900' : 'border-slate-200'}`}>
              <thead className="bg-slate-900 text-white">
                 <tr className="text-[10px] font-black uppercase tracking-widest">
                    <th className={`${tableCellPadding} border-r border-slate-700 w-12 text-center`}>#</th>
                    <th className={tableCellPadding}>Description</th>
                    {isGst && <th className={`${tableCellPadding} border-r border-slate-700 text-center`}>HSN/SAC</th>}
                    <th className={`${tableCellPadding} text-center`}>Qty</th>
                    <th className={`${tableCellPadding} text-right`}>Rate</th>
                    <th className={`${tableCellPadding} text-right`}>Value</th>
                 </tr>
              </thead>
              <tbody>
                 {voucher.items && voucher.items.length > 0 ? (
                   voucher.items.map((item, i) => (
                      <tr key={i} className={`${tableFontSize} font-black border-b border-slate-200 hover:bg-slate-50 transition-colors`}>
                         <td className={`${tableCellPadding} border-r border-slate-200 text-center text-slate-400 font-mono`}>{i + 1}</td>
                         <td className={`${tableCellPadding} border-r border-slate-200 italic`}>{item.name}</td>
                         {isGst && <td className={`${tableCellPadding} border-r border-slate-200 text-center font-mono text-slate-500`}>{item.hsn}</td>}
                         <td className={`${tableCellPadding} border-r border-slate-200 text-center text-slate-900`}>{item.qty} {item.unit}</td>
                         <td className={`${tableCellPadding} border-r border-slate-200 text-right tabular-nums`}>${item.rate.toLocaleString()}</td>
                         <td className={`${tableCellPadding} text-right tabular-nums font-bold`}>${item.amount.toLocaleString()}</td>
                      </tr>
                   ))
                 ) : (
                   <tr className={`${tableFontSize} font-black border-b border-slate-200`}>
                      <td className={`${tableCellPadding} border-r border-slate-200 text-center text-slate-400 font-mono`}>1</td>
                      <td className={`${tableCellPadding} border-r border-slate-200 italic`} colSpan={isGst ? 4 : 3}>As per Journal: {voucher.narration}</td>
                      <td className={`${tableCellPadding} text-right tabular-nums font-bold`}>${voucher.amount.toLocaleString()}</td>
                   </tr>
                 )}
                 {/* Decorative padding rows for standard/gst layouts */}
                 {!isCompact && [...Array(Math.max(0, 5 - (voucher.items?.length || 1)))].map((_, i) => (
                   <tr key={`pad-${i}`} className="border-b border-slate-100 h-10">
                     <td className="p-4 border-r border-slate-100"></td>
                     <td className="p-4 border-r border-slate-100"></td>
                     {isGst && <td className="p-4 border-r border-slate-100"></td>}
                     <td className="p-4 border-r border-slate-100"></td>
                     <td className="p-4 border-r border-slate-100"></td>
                     <td className="p-4"></td>
                   </tr>
                 ))}
              </tbody>
           </table>

           <div className={`flex border-2 border-t-0 ${isGst ? 'border-slate-900' : 'border-slate-200'}`}>
              <div className={`flex-1 ${isCompact ? 'p-4' : 'p-8'} space-y-6`}>
                 <div className="space-y-2">
                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-[0.3em] block">Total Amount in Words</span>
                    <span className={`${isCompact ? 'text-[10px]' : 'text-xs'} font-black italic text-slate-800 uppercase leading-none border-b border-slate-200 pb-2 block`}>{amountInWords(voucher.amount)}</span>
                 </div>
                 {voucher.narration && (
                    <div className="space-y-1">
                      <span className="text-[9px] font-black uppercase text-slate-400 tracking-[0.3em] block">Narration</span>
                      <p className={`${isCompact ? 'text-[9px]' : 'text-[10px]'} text-slate-600 italic leading-tight`}>{voucher.narration}</p>
                    </div>
                 )}
              </div>
              <div className={`${isCompact ? 'w-64' : 'w-80'} border-l-2 ${isGst ? 'border-slate-900' : 'border-slate-200'} divide-y divide-slate-100`}>
                 <div className={`flex justify-between ${isCompact ? 'px-4 py-2' : 'px-6 py-3'} text-xs font-black`}>
                    <span className="text-slate-400 uppercase tracking-widest">Sub Total</span>
                    <span>${(voucher.subTotal || voucher.amount).toLocaleString()}</span>
                 </div>
                 {voucher.adjustments?.map((adj, i) => (
                    <div key={i} className={`flex justify-between ${isCompact ? 'px-4 py-2' : 'px-6 py-3'} text-xs font-black ${adj.type === 'Less' ? 'text-rose-600' : 'text-emerald-600'}`}>
                      <span className="uppercase tracking-widest">{adj.label}</span>
                      <span>{adj.type === 'Less' ? '-' : '+'}${adj.amount.toLocaleString()}</span>
                    </div>
                 ))}
                 <div className={`flex justify-between ${isCompact ? 'px-4 py-2 text-indigo-500' : 'px-6 py-3 text-indigo-600'} text-xs font-black`}>
                    <span className="uppercase tracking-widest">Tax Total</span>
                    <span>${(voucher.taxTotal || 0).toLocaleString()}</span>
                 </div>
                 <div className={`flex justify-between ${isCompact ? 'px-4 py-4 text-lg' : 'px-6 py-6 text-xl'} bg-slate-900 text-white font-black italic`}>
                    <span className="uppercase tracking-tighter text-sm self-center">Grand Total</span>
                    <span className="tabular-nums">${voucher.amount.toLocaleString()}</span>
                 </div>
              </div>
           </div>
        </div>

        {/* Footer */}
        <div className={`mt-auto ${isCompact ? 'pt-6' : 'pt-12'} border-t-4 border-slate-900 flex justify-between items-end relative z-10`}>
           <div className="space-y-8">
              <div className="text-[9px] text-slate-300 font-black uppercase tracking-[0.5em]">NEXUS ENTERPRISE CORE • VALID AUDIT DOC</div>
           </div>
           <div className={`${isCompact ? 'w-56' : 'w-80'} text-center space-y-4`}>
              <div className={`${isCompact ? 'text-[10px]' : 'text-xs'} font-black uppercase text-slate-900 tracking-widest italic`}>For {activeCompany.name}</div>
              <div className={`w-full ${isCompact ? 'h-12' : 'h-20'} bg-slate-50 border-2 border-slate-200 rounded-2xl flex items-center justify-center relative overflow-hidden group shadow-inner`}>
                 <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none -rotate-12 scale-150"><span className={`${isCompact ? 'text-xl' : 'text-4xl'} font-black`}>VALIDATED</span></div>
                 <svg className={`${isCompact ? 'w-6 h-6' : 'w-10 h-10'} text-indigo-600/20 rotate-12`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
              </div>
              <div className="text-[10px] font-black uppercase text-slate-900 border-t border-slate-900 pt-2 tracking-[0.2em]">Authorized Signatory</div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default PrintLayout;