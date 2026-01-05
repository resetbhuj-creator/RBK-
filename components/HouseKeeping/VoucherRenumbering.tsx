import React, { useState, useMemo } from 'react';
import { Voucher } from '../../types';

interface VoucherRenumberingProps {
  vouchers: Voucher[];
  setVouchers?: React.Dispatch<React.SetStateAction<Voucher[]>>;
  activeCompany: any;
}

const VoucherRenumbering: React.FC<VoucherRenumberingProps> = ({ vouchers, setVouchers, activeCompany }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedType, setSelectedType] = useState('All');
  const [renumberingMode, setRenumberingMode] = useState<'CHRONOLOGICAL' | 'KEEP_EXISTING'>('CHRONOLOGICAL');

  const vTypes = useMemo(() => ['All', ...Array.from(new Set(vouchers.map(v => v.type)))], [vouchers]);

  const executeRenumbering = () => {
    if (!setVouchers) return;
    if (!confirm("CRITICAL PROTOCOL: This will permanently rewrite voucher identifiers to enforce chronological sequence. Existing physical references may become invalid. Proceed?")) return;

    setIsProcessing(true);
    setProgress(0);

    // Simulation delay for heavy processing feel
    let p = 0;
    const interval = setInterval(() => {
      p += 5;
      if (p >= 100) {
        clearInterval(interval);
        
        // Actual logic
        const prefixMap: Record<string, string> = {
          'Sales': 'SL', 'Purchase': 'PR', 'Sales Return': 'SR', 'Purchase Return': 'PR-RET',
          'Payment': 'PY', 'Receipt': 'RC', 'Contra': 'CN', 'Journal': 'JR',
          'Delivery Note': 'DN', 'Goods Receipt Note (GRN)': 'GRN', 'Stock Adjustment': 'SA', 'Purchase Order': 'PO'
        };

        const fy = activeCompany.years[activeCompany.years.length - 1];
        const yearParts = fy.split(' - ').map((y: string) => y.trim().slice(-2));
        const yearPart = yearParts.join('-');

        const renumbered = [...vouchers].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        // Counter per type
        const counters: Record<string, number> = {};

        const finalVouchers = renumbered.map(v => {
          if (selectedType !== 'All' && v.type !== selectedType) return v;
          
          const type = v.type;
          counters[type] = (counters[type] || 0) + 1;
          const prefix = prefixMap[type] || 'VCH';
          const newId = `${prefix}/${yearPart}/${counters[type].toString().padStart(5, '0')}`;
          
          return { ...v, id: newId };
        });

        setVouchers(finalVouchers);
        setIsProcessing(false);
        alert("Sequence Integrity Restored: All voucher identifiers have been chronologically aligned.");
      }
      setProgress(p);
    }, 50);
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500 max-w-4xl mx-auto">
      <div className="bg-white rounded-[3rem] border border-slate-200 p-12 shadow-sm relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center space-x-4 mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-[1.5rem] flex items-center justify-center text-white shadow-xl shadow-blue-100">
               <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" /></svg>
            </div>
            <div>
               <h3 className="text-2xl font-black italic uppercase tracking-tight text-slate-800 leading-none">Sequence Alignment Engine</h3>
               <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mt-3">Statutory Audit Re-Numbering Utility</p>
            </div>
          </div>

          <div className="space-y-10">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-3">
                   <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Target Module Class</label>
                   <select value={selectedType} onChange={e => setSelectedType(e.target.value)} className="w-full px-6 py-4 rounded-2xl border border-slate-200 bg-slate-50 text-sm font-black text-blue-600 outline-none focus:ring-4 focus:ring-blue-500/10 shadow-inner">
                      {vTypes.map(t => <option key={t} value={t}>{t}</option>)}
                   </select>
                </div>
                <div className="space-y-3">
                   <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Ordering Logic</label>
                   <div className="flex p-1 bg-slate-100 rounded-2xl border border-slate-200">
                      {(['CHRONOLOGICAL', 'KEEP_EXISTING'] as const).map(m => (
                        <button key={m} onClick={() => setRenumberingMode(m)} className={`flex-1 py-3 text-[9px] font-black uppercase rounded-xl transition-all ${renumberingMode === m ? 'bg-white text-blue-600 shadow-md' : 'text-slate-400'}`}>
                          {m.replace('_', ' ')}
                        </button>
                      ))}
                   </div>
                </div>
             </div>

             <div className="p-8 bg-blue-50 rounded-[2.5rem] border border-blue-100 space-y-6">
                <div className="flex items-start space-x-6">
                   <div className="text-3xl mt-1">🚧</div>
                   <div>
                      <h4 className="text-sm font-black text-blue-900 uppercase italic">Audit Integrity Warning</h4>
                      <p className="text-[11px] text-blue-700/70 font-medium leading-relaxed mt-1">
                        Executing this utility will overwrite the `Voucher_Hash` for the entire dataset. This is typically used at the end of a financial year or after a bulk import where serials have become non-contiguous.
                      </p>
                   </div>
                </div>
             </div>

             <div className="pt-6">
                {isProcessing ? (
                  <div className="space-y-6 animate-in zoom-in-95 duration-500">
                    <div className="flex justify-between items-end px-2">
                       <span className="text-[10px] font-black uppercase text-blue-500 animate-pulse">Rewriting Organizational Registry...</span>
                       <span className="text-2xl font-black italic">{progress}%</span>
                    </div>
                    <div className="h-4 bg-slate-100 rounded-full overflow-hidden border border-slate-200 shadow-inner p-1">
                       <div className="h-full bg-blue-600 rounded-full transition-all duration-200 shadow-[0_0_12px_rgba(37,99,235,0.5)]" style={{ width: `${progress}%` }}></div>
                    </div>
                  </div>
                ) : (
                  <button onClick={executeRenumbering} className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.4em] shadow-2xl hover:bg-blue-600 transition-all transform active:scale-95 border-b-8 border-slate-950">
                    Execute Master Sequence Shift
                  </button>
                )}
             </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600 rounded-full blur-[120px] opacity-10 -mr-40 -mt-40 pointer-events-none"></div>
      </div>
    </div>
  );
};

export default VoucherRenumbering;