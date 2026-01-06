import React, { useState, useMemo } from 'react';
import { Voucher, Ledger } from '../types';
import ActionMenu from './ActionMenu';

interface Gstr2ReportProps {
  vouchers: Voucher[];
  ledgers: Ledger[];
  activeCompany: any;
  onViewVoucher: (id: string) => void;
}

interface FilingError {
  vId: string;
  party: string;
  message: string;
  severity: 'CRITICAL' | 'WARNING';
}

const Gstr2Report: React.FC<Gstr2ReportProps> = ({ vouchers, ledgers, activeCompany, onViewVoucher }) => {
  const [isValidationVisible, setIsValidationVisible] = useState(false);
  const [filingErrors, setFilingErrors] = useState<FilingError[]>([]);
  const [dateRange, setDateRange] = useState({ 
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0], 
    end: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0] 
  });

  const reportData = useMemo(() => {
    const inwardVouchers = vouchers.filter(v => {
      const vDate = new Date(v.date);
      const inRange = vDate >= new Date(dateRange.start) && vDate <= new Date(dateRange.end);
      return inRange && (v.type === 'Purchase' || v.type === 'Purchase Return' || v.type === 'Debit Note' || v.type === 'Goods Receipt Note (GRN)');
    });

    const vouchersWithDetails = inwardVouchers.map(v => {
      const partyLedger = ledgers.find(l => l.name === v.party || l.id === v.ledgerId);
      const factor = (v.type === 'Purchase Return' || v.type === 'Debit Note') ? -1 : 1;
      return {
        ...v,
        supplierGst: partyLedger?.taxId || 'URP',
        taxableVal: (v.subTotal || v.amount) * factor,
        taxAmount: (v.taxTotal || 0) * factor,
        grandTotal: v.amount * factor
      };
    });

    return { list: vouchersWithDetails };
  }, [vouchers, ledgers, dateRange]);

  const handlePrepareForFiling = () => {
    const errors: FilingError[] = [];
    
    reportData.list.forEach(v => {
      if (v.supplierGst === 'URP' && v.grandTotal > 5000) {
        errors.push({ vId: v.id, party: v.party, message: 'Unregistered Supplier detected for high-value inward supply. Verify ITC eligibility.', severity: 'WARNING' });
      }

      if (!v.taxAmount || v.taxAmount === 0) {
        errors.push({ vId: v.id, party: v.party, message: 'Zero tax component detected. Ensure invoice is marked as Exempt/Nil if correct.', severity: 'WARNING' });
      }

      if (!v.supplyType) {
        errors.push({ vId: v.id, party: v.party, message: 'Place of Supply (Jurisdiction) not defined.', severity: 'CRITICAL' });
      }
    });

    setFilingErrors(errors);
    setIsValidationVisible(true);
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500 max-w-7xl mx-auto pb-20">
      <div className="bg-emerald-950 rounded-[3.5rem] p-12 text-white relative overflow-hidden shadow-2xl border-b-8 border-emerald-600">
         <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-12">
            <div>
               <div className="flex items-center space-x-6 mb-6">
                  <div className="w-16 h-16 rounded-[1.5rem] bg-emerald-600 flex items-center justify-center shadow-2xl border-4 border-emerald-400/20 transform rotate-3 transition-transform hover:rotate-0">
                    <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13l-3 3m0 0l-3-3m3 3V8m0 13a9 9 0 110-18 9 9 0 010 18z" /></svg>
                  </div>
                  <div>
                    <h2 className="text-4xl font-black italic uppercase tracking-tighter leading-none">GSTR-2 Inward Supplies</h2>
                    <p className="text-xs text-emerald-400 font-bold uppercase tracking-[0.4em] mt-3 italic">Verified Purchase Registry • ITC Audit Mode</p>
                  </div>
               </div>
               <div className="flex items-center space-x-2 bg-white/5 p-4 rounded-2xl border border-white/10 backdrop-blur-md">
                  <input type="date" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} className="bg-emerald-900/50 border border-emerald-700 rounded-xl px-4 py-2 text-xs font-black text-white outline-none" />
                  <span className="text-emerald-700 font-black text-[9px]">TO</span>
                  <input type="date" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})} className="bg-emerald-900/50 border border-emerald-700 rounded-xl px-4 py-2 text-xs font-black text-white outline-none" />
               </div>
            </div>
            <button onClick={handlePrepareForFiling} className="px-10 py-5 bg-white text-emerald-900 rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all transform active:scale-95 shadow-2xl">Prepare for Filing</button>
         </div>
         <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-600 rounded-full blur-[180px] opacity-10 -mr-64 -mt-64 pointer-events-none"></div>
      </div>

      <div className="bg-white rounded-[4rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[600px] animate-in slide-in-from-bottom-2 duration-500">
         <div className="overflow-x-auto flex-1 custom-scrollbar">
            <table className="w-full text-left border-collapse">
               <thead className="bg-slate-950 text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-900 sticky top-0 z-10">
                  <tr>
                     <th className="px-12 py-7">Supplier GSTIN / Node</th>
                     <th className="px-12 py-7">Invoice Number</th>
                     <th className="px-12 py-7">Date</th>
                     <th className="px-12 py-7 text-right">Invoice Value</th>
                     <th className="px-12 py-7 text-center">Protocol (POS)</th>
                     <th className="px-12 py-7 text-right">Taxable Point</th>
                     <th className="px-12 py-7 text-right">ITC Potential ($)</th>
                     <th className="px-12 py-7 text-right">Action</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50 bg-white">
                  {reportData.list.map((v) => {
                       const pos = v.supplyType === 'Local' ? activeCompany.state : 'Inter-State';
                       return (
                          <tr key={v.id} onClick={() => onViewVoucher(v.id)} className="hover:bg-emerald-50/20 group transition-all cursor-pointer border-b border-slate-50 last:border-0">
                             <td className="px-12 py-8">
                                <div className={`text-[10px] font-black uppercase tracking-widest ${v.supplierGst === 'URP' ? 'text-slate-400' : 'text-indigo-600'}`}>{v.supplierGst}</div>
                                <div className="text-[11px] font-black text-slate-800 uppercase italic mt-1 group-hover:text-emerald-700 transition-colors">{v.party}</div>
                             </td>
                             <td className="px-12 py-8 font-mono text-xs font-black text-emerald-600 italic">#{v.id}</td>
                             <td className="px-12 py-8 text-xs font-bold text-slate-400 uppercase">{v.date}</td>
                             <td className="px-12 py-8 text-right font-black text-slate-900 tabular-nums">${v.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                             <td className="px-12 py-8 text-center">
                                <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase border shadow-sm ${v.supplyType === 'Local' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-indigo-50 text-indigo-600 border-indigo-100'}`}>
                                   {pos}
                                </span>
                             </td>
                             <td className="px-12 py-8 text-right font-black tabular-nums italic text-slate-500">${v.taxableVal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                             <td className="px-12 py-8 text-right font-black tabular-nums text-emerald-600 italic">${v.taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                             <td className="px-12 py-8 text-right" onClick={e => e.stopPropagation()}>
                                <ActionMenu label="Inspect" actions={[{ label: 'View Shard', icon: '👁️', onClick: () => onViewVoucher(v.id), variant: 'primary' }]} />
                             </td>
                          </tr>
                       );
                    })}
               </tbody>
            </table>
         </div>
      </div>

      {isValidationVisible && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-300">
           <div className="w-full max-w-4xl bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-slate-200">
              <div className="px-10 py-8 bg-emerald-950 text-white flex justify-between items-center">
                 <h3 className="text-xl font-black uppercase tracking-tight italic">Inward Integrity Validator</h3>
                 <button onClick={() => setIsValidationVisible(false)} className="p-2 hover:bg-white/10 rounded-full transition-all"><svg className="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
              </div>
              <div className="p-12 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
                 {filingErrors.length === 0 ? (
                    <div className="text-center py-20">
                       <div className="w-24 h-24 bg-emerald-50 rounded-[3rem] flex items-center justify-center mx-auto mb-8 border-2 border-emerald-100"><svg className="w-12 h-12 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg></div>
                       <h4 className="text-2xl font-black text-slate-800 uppercase italic mb-2">Audit Cleared</h4>
                       <p className="text-sm text-slate-400 font-medium">Inward supply data aligns with regulatory expectations.</p>
                    </div>
                 ) : (
                    filingErrors.map((err, i) => (
                       <div key={i} className={`p-6 rounded-[2rem] border-2 transition-all flex items-start space-x-6 ${err.severity === 'CRITICAL' ? 'bg-rose-50 border-rose-100' : 'bg-amber-50 border-amber-100'}`}>
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-black italic shadow-lg shrink-0 ${err.severity === 'CRITICAL' ? 'bg-rose-600' : 'bg-amber-600'}`}>!</div>
                          <div className="flex-1">
                             <div className="flex items-center justify-between"><span className="text-xs font-black text-slate-900 italic uppercase">Ref: {err.vId}</span><button onClick={() => { onViewVoucher(err.vId); setIsValidationVisible(false); }} className="text-[9px] font-black text-indigo-600 uppercase hover:underline">Correct &rarr;</button></div>
                             <p className={`text-xs font-medium mt-1 italic ${err.severity === 'CRITICAL' ? 'text-rose-900' : 'text-amber-900'}`}>"{err.message}" - Supplier: {err.party}</p>
                          </div>
                       </div>
                    ))
                 )}
              </div>
              <div className="p-10 border-t border-slate-100 flex justify-end gap-4 bg-slate-50/50">
                 <button onClick={() => setIsValidationVisible(false)} className="px-10 py-5 rounded-[1.5rem] text-slate-400 font-black text-xs uppercase tracking-widest hover:bg-white transition-all">Dismiss</button>
                 <button className="px-14 py-5 bg-emerald-600 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:bg-emerald-700 transition-all transform active:scale-95">Finalize ITC Shards</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Gstr2Report;