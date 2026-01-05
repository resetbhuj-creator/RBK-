import React, { useMemo } from 'react';
import { Voucher, VoucherItem, LedgerEntry } from '../types';

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
  const baseCurrency = activeCompany?.currencyConfig?.code || 'USD';
  const vchCurrency = voucher.currency || baseCurrency;

  const amountInWords = (num: number) => {
    return vchCurrency + " " + num.toLocaleString().toUpperCase() + " ONLY";
  };

  const getNativeDimensions = () => {
    let baseWidth = 794; 
    let baseHeight = 1123;
    if (paperSize === 'Letter') { baseWidth = 816; baseHeight = 1056; }
    else if (paperSize === 'A5') { baseWidth = 559; baseHeight = 794; }
    return orientation === 'Landscape' ? { width: baseHeight, height: baseWidth } : { width: baseWidth, height: baseHeight };
  };

  const { width, height } = getNativeDimensions();
  const isCompact = layout === 'COMPACT';
  const isGst = layout === 'GST_TAX_INVOICE';
  const hasItems = voucher.items && voucher.items.length > 0;
  const hasEntries = voucher.entries && voucher.entries.length > 0;

  const tableCellPadding = isCompact ? 'p-2' : 'p-4';

  const hsnSummary = useMemo(() => {
    if (!hasItems || !isGst) return [];
    const map: Record<string, { hsn: string, taxable: number, cgst: number, sgst: number, igst: number, total: number }> = {};
    
    voucher.items!.forEach(item => {
      const code = item.hsn || 'N/A';
      if (!map[code]) {
        map[code] = { hsn: code, taxable: 0, cgst: 0, sgst: 0, igst: 0, total: 0 };
      }
      // All values normalized to line currency
      const lineTax = (item.taxAmount || 0);
      map[code].taxable += item.amount;
      if (voucher.supplyType === 'Local') {
        map[code].cgst += lineTax / 2;
        map[code].sgst += lineTax / 2;
      } else {
        map[code].igst += lineTax;
      }
      map[code].total += lineTax;
    });
    return Object.values(map);
  }, [voucher.items, voucher.supplyType, isGst]);

  return (
    <div 
      style={{ 
        width: `${width}px`, 
        minHeight: `${height}px`,
        transform: `scale(${scale})`,
        transformOrigin: 'top center',
      }}
      className={`bg-white ${isCompact ? 'p-8' : 'p-16'} flex flex-col font-sans relative text-slate-900 border border-slate-200 overflow-hidden shadow-2xl transition-all duration-300`}
    >
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]"></div>
      
      {watermark !== 'NONE' && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-[10px] border-indigo-600/5 px-16 py-8 rotate-[35deg] opacity-10 rounded-3xl z-0 pointer-events-none">
          <span className="text-indigo-600 font-black text-8xl uppercase tracking-[0.3em] whitespace-nowrap">{watermark} COPY</span>
        </div>
      )}

      {/* Header Architecture */}
      <div className={`flex justify-between items-start border-b-4 border-slate-900 ${isCompact ? 'pb-8 mb-8' : 'pb-12 mb-12'} relative z-10`}>
         <div className="space-y-6">
            <div className={`${isCompact ? 'text-2xl' : 'text-5xl'} font-black italic tracking-tighter text-slate-900 uppercase leading-none`}>
              {activeCompany.name}
            </div>
            <div className="max-w-md space-y-1.5">
              <p className="text-[10px] font-bold text-slate-500 uppercase leading-relaxed">{activeCompany.address}</p>
              <div className="flex items-center space-x-6 mt-4 text-[10px] font-black text-indigo-600 uppercase">
                <p>TAX ID: <span className="text-slate-900">{activeCompany.taxId || 'N/A'}</span></p>
                <p>REG: <span className="text-slate-900">{activeCompany.panNumber || 'N/A'}</span></p>
              </div>
            </div>
         </div>
         <div className="text-right flex flex-col items-end">
            <div className={`${isCompact ? 'text-2xl' : 'text-4xl'} font-black italic uppercase tracking-tighter text-indigo-600 mb-6 underline decoration-indigo-200 underline-offset-8`}>
              {voucher.type === 'Purchase Order' ? 'PURCHASE ORDER' : (isGst ? 'TAX INVOICE' : `${voucher.type.toUpperCase()} VOUCHER`)}
            </div>
            <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div className="flex justify-between w-56 text-[10px] font-black border-b border-slate-200 pb-1">
                <span className="text-slate-400 uppercase tracking-widest">Document No:</span>
                <span className="text-slate-900">{voucher.id}</span>
              </div>
              <div className="flex justify-between w-56 text-[10px] font-black border-b border-slate-200 pb-1">
                <span className="text-slate-400 uppercase tracking-widest">Execution Moment:</span>
                <span className="text-slate-900">{voucher.date}</span>
              </div>
              {voucher.exchangeRate && voucher.exchangeRate !== 1 && (
                <div className="flex justify-between w-56 text-[8px] font-black text-indigo-400">
                  <span>EXCH RATE: 1 {vchCurrency} =</span>
                  <span>{voucher.exchangeRate} {baseCurrency}</span>
                </div>
              )}
            </div>
         </div>
      </div>

      <div className="grid grid-cols-2 gap-12 mb-12 relative z-10">
         <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-200">
            <div className="text-[9px] font-black text-indigo-600 uppercase tracking-[0.3em] mb-3 border-b border-indigo-100 pb-2">Counterparty Identity</div>
            <div className="text-xl font-black text-slate-900 uppercase italic leading-tight">{voucher.party}</div>
            <p className="text-[9px] font-bold text-slate-400 mt-4 uppercase tracking-widest italic">Consignee Node verified through master ledger.</p>
         </div>
         <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-200">
            <div className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mb-3 border-b border-slate-200 pb-2">Institutional Context</div>
            <div className="text-[10px] font-black text-slate-600 space-y-1">
              <p className="flex justify-between"><span>Voucher Category:</span> <span className="text-slate-900">{voucher.type}</span></p>
              <p className="flex justify-between"><span>Supply Protocol:</span> <span className="text-slate-900 uppercase">{voucher.supplyType || 'N/A'}</span></p>
              <p className="flex justify-between"><span>Anchor Currency:</span> <span className="text-slate-900 font-mono">{vchCurrency}</span></p>
            </div>
         </div>
      </div>

      {/* Main Table Structure */}
      <div className="flex-1 relative z-10">
         <table className={`w-full text-left border-collapse border-2 ${isGst ? 'border-slate-900' : 'border-slate-200'}`}>
            <thead className="bg-slate-900 text-white">
               <tr className="text-[9px] font-black uppercase tracking-widest">
                  <th className={`${tableCellPadding} w-12 text-center border-r border-slate-700`}>#</th>
                  <th className={tableCellPadding}>{hasItems ? 'Resource Particulars' : 'Ledger Allocations'}</th>
                  {hasItems && isGst && <th className={`${tableCellPadding} border-r border-slate-700 text-center`}>HSN/SAC</th>}
                  {hasItems ? (
                    <>
                      <th className={`${tableCellPadding} text-center w-24 border-l border-slate-700`}>Qty</th>
                      <th className={`${tableCellPadding} text-right w-32 border-l border-slate-700`}>Unit Price</th>
                      <th className={`${tableCellPadding} text-right w-40 border-l border-slate-700`}>Line Value ({vchCurrency})</th>
                    </>
                  ) : (
                    <>
                      <th className={`${tableCellPadding} text-center w-24 border-l border-slate-700`}>Protocol</th>
                      <th className={`${tableCellPadding} text-right w-40 border-l border-slate-700`}>Debit</th>
                      <th className={`${tableCellPadding} text-right w-40 border-l border-slate-700`}>Credit</th>
                    </>
                  )}
               </tr>
            </thead>
            <tbody>
               {hasItems ? (
                 voucher.items!.map((item, i) => (
                    <tr key={i} className="text-[11px] font-black border-b border-slate-200 hover:bg-slate-50 transition-colors">
                       <td className={`${tableCellPadding} border-r border-slate-200 text-center text-slate-400 font-mono`}>{i + 1}</td>
                       <td className={`${tableCellPadding} border-r border-slate-200`}>
                          <div className="italic uppercase tracking-tight">{item.name}</div>
                          {item.batchNo && <div className="text-[8px] font-bold text-indigo-500 mt-0.5">BATCH: {item.batchNo}</div>}
                       </td>
                       {isGst && <td className={`${tableCellPadding} border-r border-slate-200 text-center font-mono text-slate-400`}>{item.hsn}</td>}
                       <td className={`${tableCellPadding} border-r border-slate-200 text-center text-slate-900`}>{item.qty} <span className="text-[8px] text-slate-400">{item.unit}</span></td>
                       <td className={`${tableCellPadding} border-r border-slate-200 text-right tabular-nums`}>
                          {item.rate.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          {item.currency && item.currency !== vchCurrency && <div className="text-[7px] text-indigo-400">({item.currency})</div>}
                       </td>
                       <td className={`${tableCellPadding} text-right tabular-nums font-bold`}>
                          {item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                       </td>
                    </tr>
                 ))
               ) : (
                  voucher.entries?.map((entry, i) => (
                    <tr key={i} className="text-[11px] font-black border-b border-slate-200 hover:bg-slate-50 transition-colors">
                       <td className={`${tableCellPadding} border-r border-slate-200 text-center text-slate-400 font-mono`}>{i + 1}</td>
                       <td className={`${tableCellPadding} border-r border-slate-200 uppercase italic tracking-tighter`}>{entry.ledgerName}</td>
                       <td className={`${tableCellPadding} border-r border-slate-200 text-center`}>
                         <span className={`px-2 py-0.5 rounded text-[8px] font-black ${entry.type === 'Dr' ? 'bg-indigo-50 text-indigo-600' : 'bg-rose-50 text-rose-600'}`}>{entry.type === 'Dr' ? 'DEBIT' : 'CREDIT'}</span>
                       </td>
                       <td className={`${tableCellPadding} border-r border-slate-200 text-right tabular-nums ${entry.type === 'Dr' ? 'text-indigo-600' : 'text-slate-200'}`}>
                          {entry.type === 'Dr' ? (entry.amount + (entry.taxAmount || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                       </td>
                       <td className={`${tableCellPadding} text-right tabular-nums ${entry.type === 'Cr' ? 'text-rose-600' : 'text-slate-200'}`}>
                          {entry.type === 'Cr' ? (entry.amount + (entry.taxAmount || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                       </td>
                    </tr>
                  ))
               )}
               {/* Padding rows to fill table space */}
               {[...Array(Math.max(0, 8 - (voucher.items?.length || voucher.entries?.length || 0)))].map((_, i) => (
                 <tr key={`pad-${i}`} className="border-b border-slate-100 h-10">
                    <td className="border-r border-slate-100"></td>
                    <td className="border-r border-slate-100"></td>
                    {isGst && <td className="border-r border-slate-100"></td>}
                    <td className="border-r border-slate-100"></td>
                    <td className="border-r border-slate-100"></td>
                    <td></td>
                 </tr>
               ))}
            </tbody>
         </table>

         <div className={`flex border-2 border-t-0 ${isGst ? 'border-slate-900' : 'border-slate-200'}`}>
            <div className="flex-1 p-8 space-y-6">
               <div className="space-y-1">
                  <span className="text-[9px] font-black uppercase text-slate-400 tracking-[0.3em] block">Aggregate Resolved Word Node</span>
                  <span className="text-[11px] font-black italic text-slate-800 uppercase leading-none border-b border-slate-200 pb-2 block">{amountInWords(voucher.amount)}</span>
               </div>
               {voucher.narration && (
                  <div className="space-y-1">
                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-[0.3em] block">Audit Narrative</span>
                    <p className="text-[10px] text-slate-600 italic leading-relaxed">{voucher.narration}</p>
                  </div>
               )}
            </div>
            <div className="w-80 border-l-2 border-slate-900 divide-y divide-slate-100">
               <div className="flex justify-between px-6 py-3 text-xs font-black">
                  <span className="text-slate-400 uppercase tracking-widest">Gross Value</span>
                  <span>${(voucher.subTotal || voucher.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
               </div>
               <div className="flex justify-between px-6 py-3 text-xs font-black text-indigo-600">
                  <span className="uppercase tracking-widest">Statutory Tax</span>
                  <span>+ ${(voucher.taxTotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
               </div>
               <div className="flex justify-between px-6 py-8 bg-slate-900 text-white font-black italic">
                  <div className="flex flex-col">
                    <span className="uppercase tracking-tighter text-[9px] self-start leading-none mb-1 opacity-50">Grand Total</span>
                    <span className="text-[10px] uppercase font-mono">{vchCurrency}</span>
                  </div>
                  <span className="text-2xl tabular-nums">${voucher.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
               </div>
               {voucher.exchangeRate && voucher.exchangeRate !== 1 && (
                 <div className="flex justify-between px-6 py-3 bg-indigo-50 text-[9px] font-black text-indigo-800 uppercase italic">
                    <span>In {baseCurrency} (Anchor)</span>
                    <span>${(voucher.amount * voucher.exchangeRate).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                 </div>
               )}
            </div>
         </div>
      </div>

      {/* Statutory Aggregator Tables */}
      {isGst && hsnSummary.length > 0 && (
         <div className="mt-8 relative z-10 animate-in fade-in slide-in-from-bottom-2 duration-700">
            <div className="text-[10px] font-black uppercase text-slate-400 tracking-[0.4em] mb-4 border-b border-slate-100 pb-2">HSN / SAC Regulatory Reconstruction</div>
            <table className="w-full text-left border-collapse border border-slate-200">
               <thead className="bg-slate-50 text-[8px] font-black uppercase text-slate-500 border-b border-slate-200">
                  <tr>
                     <th className="p-3 border-r border-slate-200 w-24">Code Node</th>
                     <th className="p-3 border-r border-slate-200 text-right">Taxable Point</th>
                     <th className="p-3 border-r border-slate-200 text-right">Central (CGST)</th>
                     <th className="p-3 border-r border-slate-200 text-right">State (SGST)</th>
                     <th className="p-3 border-r border-slate-200 text-right">Integrated (IGST)</th>
                     <th className="p-3 text-right">Total Yield</th>
                  </tr>
               </thead>
               <tbody className="text-[10px] font-bold text-slate-800 italic">
                  {hsnSummary.map((h, i) => (
                     <tr key={i} className="border-b border-slate-200">
                        <td className="p-3 border-r border-slate-200 font-mono">{h.hsn}</td>
                        <td className="p-3 border-r border-slate-200 text-right">${h.taxable.toLocaleString()}</td>
                        <td className="p-3 border-r border-slate-200 text-right text-slate-400">${h.cgst.toLocaleString()}</td>
                        <td className="p-3 border-r border-slate-200 text-right text-slate-400">${h.sgst.toLocaleString()}</td>
                        <td className="p-3 border-r border-slate-200 text-right text-indigo-600">${h.igst.toLocaleString()}</td>
                        <td className="p-3 text-right font-black text-slate-900 tabular-nums">${h.total.toLocaleString()}</td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      )}

      {/* Signature & Seal Footer */}
      <div className="mt-auto pt-16 border-t-4 border-slate-900 flex justify-between items-end relative z-10">
         <div className="space-y-12">
            <div className="flex items-center space-x-4 px-6 py-4 bg-slate-50 rounded-2xl border border-slate-100">
               <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white text-xs">✓</div>
               <div>
                  <div className="text-[9px] font-black uppercase text-slate-900">Signed Digitally</div>
                  <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">NX-SECURE-ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}</div>
               </div>
            </div>
            <div className="text-[9px] text-slate-300 font-black uppercase tracking-[0.5em]">NEXUS CORE ERP • STATUTORY VERIFIED • AUDIT TRAIL ACTIVE</div>
         </div>
         <div className="w-80 text-center space-y-4">
            <div className="text-xs font-black uppercase text-slate-900 tracking-widest italic">For {activeCompany.name}</div>
            <div className="w-full h-24 bg-slate-50 border-2 border-slate-200 rounded-3xl flex flex-col items-center justify-center relative overflow-hidden group shadow-inner">
               <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none -rotate-12 scale-150"><span className="text-4xl font-black">VALIDATED</span></div>
               <div className="w-12 h-1 bg-slate-200 rounded-full mb-2"></div>
               <div className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Institutional Seal</div>
            </div>
            <div className="text-[10px] font-black uppercase text-slate-900 border-t border-slate-900 pt-3 tracking-[0.2em]">Authorized Institutional Signatory</div>
         </div>
      </div>
      
      <div className="absolute bottom-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 via-indigo-600 to-slate-900"></div>
    </div>
  );
};

export default PrintLayout;