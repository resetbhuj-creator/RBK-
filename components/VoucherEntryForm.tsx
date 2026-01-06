import React, { useState, useMemo, useEffect } from 'react';
import { Voucher, Ledger, LedgerEntry, VoucherType, PermissionLevel } from '../types';

interface VoucherEntryFormProps {
  isReadOnly?: boolean;
  ledgers: Ledger[];
  vouchers?: Voucher[];
  onSubmit: (data: Omit<Voucher, 'id' | 'status'>) => void;
  onCancel: () => void;
  getNextId: (type: string) => string;
  activeCompany?: any;
  forcedVType?: VType;
  editingVoucher?: Voucher;
}

type VType = Extract<VoucherType, 'Payment' | 'Receipt' | 'Contra' | 'Journal' | 'Credit Note' | 'Debit Note'>;

const CURRENCIES = [
  { code: 'USD', symbol: '$' },
  { code: 'EUR', symbol: '€' },
  { code: 'GBP', symbol: '£' },
  { code: 'INR', symbol: '₹' },
  { code: 'AED', symbol: 'د.إ' }
];

const VoucherEntryForm: React.FC<VoucherEntryFormProps> = ({ 
  isReadOnly, ledgers, onSubmit, onCancel, getNextId, activeCompany, forcedVType, editingVoucher 
}) => {
  const [vchType, setVchType] = useState<VType>(forcedVType || (editingVoucher?.type as VType) || 'Payment');
  const [date, setDate] = useState(editingVoucher?.date || new Date().toISOString().split('T')[0]);
  const [narration, setNarration] = useState(editingVoucher?.narration || '');
  const [currency, setCurrency] = useState(editingVoucher?.currency || 'USD');
  const [exchangeRate, setExchangeRate] = useState(editingVoucher?.exchangeRate || 1);

  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>(() => {
    if (editingVoucher?.entries) return editingVoucher.entries;
    return [
      { id: '1', ledgerId: '', ledgerName: '', type: 'Dr', amount: 0, taxRate: 0, taxAmount: 0 },
      { id: '2', ledgerId: '', ledgerName: '', type: 'Cr', amount: 0, taxRate: 0, taxAmount: 0 }
    ];
  });

  const updateEntry = (id: string, field: keyof LedgerEntry, value: any) => {
    setLedgerEntries(prev => prev.map(e => {
      if (e.id === id) {
        let updated = { ...e, [field]: value };
        if (field === 'ledgerId') {
          updated.ledgerName = ledgers.find(l => l.id === value)?.name || '';
        }
        if (field === 'amount' || field === 'taxRate') {
           updated.taxAmount = (updated.amount * (updated.taxRate || 0)) / 100;
        }
        return updated;
      }
      return e;
    }));
  };

  const addEntryRow = () => {
      const lastType = ledgerEntries[ledgerEntries.length-1]?.type || 'Dr';
      setLedgerEntries([...ledgerEntries, { id: Date.now().toString(), ledgerId: '', ledgerName: '', type: lastType === 'Dr' ? 'Cr' : 'Dr', amount: 0, taxRate: 0 }]);
  };

  const removeEntryRow = (id: string) => {
    if (ledgerEntries.length <= 2) return;
    setLedgerEntries(prev => prev.filter(e => e.id !== id));
  };

  const totals = useMemo(() => {
    const dr = ledgerEntries.filter(e => e.type === 'Dr').reduce((acc, e) => acc + e.amount + (e.taxAmount || 0), 0);
    const cr = ledgerEntries.filter(e => e.type === 'Cr').reduce((acc, e) => acc + e.amount + (e.taxAmount || 0), 0);
    return { dr, cr, balanced: Math.abs(dr - cr) < 0.001 };
  }, [ledgerEntries]);

  const handlePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!totals.balanced || isReadOnly) return;
    
    const primaryEntry = ledgerEntries.find(e => e.type === (vchType === 'Payment' ? 'Cr' : 'Dr')) || ledgerEntries[0];
    onSubmit({
      type: vchType,
      date,
      party: primaryEntry.ledgerName,
      amount: totals.dr,
      narration,
      currency,
      exchangeRate,
      entries: ledgerEntries
    });
  };

  return (
    <div className="bg-white rounded-[3.5rem] border border-slate-200 shadow-2xl overflow-hidden max-w-7xl mx-auto p-12 space-y-12 animate-in zoom-in-95 duration-500">
      <div className="flex flex-col md:flex-row items-center justify-between border-b border-slate-100 pb-12 gap-8">
        <div>
          <h2 className="text-4xl font-black italic uppercase tracking-tighter text-slate-800">{vchType} Batch Node</h2>
          <p className="text-[10px] font-black uppercase text-indigo-400 tracking-[0.4em] mt-3 italic">Identity Context: {editingVoucher?.id || 'PROVISIONAL'}</p>
        </div>
        <div className="flex items-center space-x-6 shrink-0">
           <div className="space-y-2 text-right">
              <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest block">Anchor Currency</label>
              <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
                 {CURRENCIES.map(c => (
                   <button key={c.code} type="button" onClick={() => setCurrency(c.code)} className={`px-4 py-2 text-[10px] font-black rounded-xl transition-all ${currency === c.code ? 'bg-white text-indigo-600 shadow-lg scale-105' : 'text-slate-400 hover:text-slate-700'}`}>{c.code}</button>
                 ))}
              </div>
           </div>
           <div className="space-y-2">
              <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest block">Exchange Ratio</label>
              <input type="number" step="0.001" value={exchangeRate} onChange={e => setExchangeRate(parseFloat(e.target.value))} className="w-24 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-center outline-none focus:ring-8 focus:ring-indigo-500/5 shadow-inner" />
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
         <div className="space-y-3">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Execution Timeline (Date)</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full px-8 py-5 rounded-[2rem] border border-slate-200 bg-slate-50 text-sm font-black outline-none focus:ring-8 focus:ring-indigo-500/5 shadow-inner" />
         </div>
         {!forcedVType && !editingVoucher && (
           <div className="space-y-3">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Protocol Classification</label>
              <div className="flex bg-slate-200/50 p-1 rounded-[2.2rem] border border-slate-200 shadow-inner">
                 {(['Payment', 'Receipt', 'Contra', 'Journal'] as VType[]).map(v => (
                   <button key={v} type="button" onClick={() => setVchType(v)} className={`flex-1 py-5 text-[10px] font-black uppercase tracking-[0.2em] rounded-[1.8rem] transition-all ${vchType === v ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-500 hover:text-slate-800'}`}>{v}</button>
                 ))}
              </div>
           </div>
         )}
      </div>

      <div className="bg-slate-50/50 rounded-[3rem] border border-slate-200 overflow-hidden shadow-inner p-10">
         <table className="w-full text-left border-separate border-spacing-y-3">
            <thead className="text-[9px] font-black uppercase text-slate-400 tracking-widest">
               <tr>
                  <th className="px-6 pb-2 w-28">Nature</th>
                  <th className="px-6 pb-2">Ledger Identity Node</th>
                  <th className="px-6 pb-2 text-right w-44">Taxable Value ($)</th>
                  <th className="px-6 pb-2 text-center w-24">GST %</th>
                  <th className="px-6 pb-2 text-right w-48">Net Resolved ({currency})</th>
                  <th className="px-6 pb-2 w-10"></th>
               </tr>
            </thead>
            <tbody>
               {ledgerEntries.map(entry => (
                 <tr key={entry.id} className="animate-in slide-in-from-left-2">
                    <td className="px-2">
                       <select value={entry.type} onChange={e => updateEntry(entry.id, 'type', e.target.value)} className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-4 text-xs font-black text-indigo-600 shadow-sm focus:ring-8 focus:ring-indigo-500/5 outline-none appearance-none cursor-pointer">
                          <option value="Dr">DEBIT</option>
                          <option value="Cr">CREDIT</option>
                       </select>
                    </td>
                    <td className="px-2">
                       <select value={entry.ledgerId} onChange={e => updateEntry(entry.id, 'ledgerId', e.target.value)} className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-4 text-xs font-black text-slate-800 italic shadow-sm focus:ring-8 focus:ring-indigo-500/5 outline-none appearance-none cursor-pointer">
                          <option value="">-- Choose Master Cluster --</option>
                          {ledgers.map(l => <option key={l.id} value={l.id}>{l.name} [{l.group}]</option>)}
                       </select>
                    </td>
                    <td className="px-2">
                       <input type="number" value={entry.amount || ''} onChange={e => updateEntry(entry.id, 'amount', parseFloat(e.target.value) || 0)} className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-4 text-right font-black text-sm shadow-sm focus:ring-8 focus:ring-indigo-500/5 outline-none" placeholder="0.00" />
                    </td>
                    <td className="px-2">
                       <input type="number" value={entry.taxRate || ''} onChange={e => updateEntry(entry.id, 'taxRate', parseFloat(e.target.value) || 0)} className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-4 text-center font-black text-xs text-indigo-400 shadow-sm focus:ring-8 focus:ring-indigo-500/5 outline-none" placeholder="0%" />
                    </td>
                    <td className="px-6 py-4 text-right">
                       <div className="text-base font-black text-slate-900 tabular-nums italic">
                         ${(entry.amount + (entry.taxAmount || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                       </div>
                    </td>
                    <td className="px-2">
                       <button type="button" onClick={() => removeEntryRow(entry.id)} className="p-3 text-slate-300 hover:text-rose-500 transition-colors">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth={4}/></svg>
                       </button>
                    </td>
                 </tr>
               ))}
            </tbody>
         </table>
         <button type="button" onClick={addEntryRow} className="w-full py-6 mt-6 bg-white/50 border-4 border-dashed border-slate-200 rounded-[2.5rem] text-[10px] font-black uppercase text-slate-400 hover:bg-white hover:text-indigo-600 hover:border-indigo-200 transition-all tracking-[0.5em] shadow-sm">+ Append Partition Segment</button>
      </div>

      {/* Proofing Panel */}
      <div className="bg-slate-900 rounded-[3.5rem] p-12 text-white relative overflow-hidden border-b-[10px] border-indigo-600 group">
         <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="flex flex-col items-center md:items-start space-y-4">
                <span className="text-[11px] font-black uppercase text-indigo-400 tracking-[0.6em] flex items-center">
                   <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 mr-3 animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.8)]"></div>
                   Aggregate Symmetry
                </span>
                <div className="flex items-baseline space-x-6">
                  <div className={`text-6xl font-black italic tabular-nums transition-all duration-500 ${totals.balanced ? 'text-white' : 'text-rose-400 animate-pulse'}`}>${totals.dr.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                  <span className="text-slate-500 font-bold uppercase text-xs tracking-widest italic underline decoration-slate-800">DR Sum</span>
                </div>
            </div>

            <div className="flex flex-col items-center md:items-end space-y-4">
                <div className="flex items-baseline space-x-6">
                  <span className="text-slate-500 font-bold uppercase text-xs tracking-widest italic underline decoration-slate-800">CR Sum</span>
                  <div className={`text-6xl font-black italic tabular-nums transition-all duration-500 ${totals.balanced ? 'text-white' : 'text-rose-400 animate-pulse'}`}>${totals.cr.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                </div>
                <div className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] border-2 transition-all duration-700 ${totals.balanced ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.2)]' : 'bg-rose-50 border-rose-500 text-rose-400'}`}>
                  {totals.balanced ? 'SHARDS IN SYMMETRY ✓' : 'EQUILIBRIUM VIOLATION ⚠'}
                </div>
            </div>
         </div>
         <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600 rounded-full blur-[150px] opacity-10 group-hover:opacity-20 transition-opacity"></div>
      </div>

      <div className="space-y-4">
        <label className="text-[11px] font-black uppercase text-slate-400 tracking-[0.4em] ml-4 italic">Forensic Narrative (Narration)</label>
        <textarea value={narration} onChange={e => setNarration(e.target.value)} className="w-full h-36 px-10 py-8 rounded-[3rem] border border-slate-200 bg-slate-50/50 text-sm font-medium italic outline-none focus:ring-12 focus:ring-indigo-500/5 focus:bg-white transition-all shadow-inner resize-none leading-relaxed" placeholder="State the institutional rationale for this ledger shift..." />
      </div>

      <div className="pt-10 border-t border-slate-100 flex flex-col sm:flex-row justify-end space-y-4 sm:space-y-0 sm:space-x-8">
         <button type="button" onClick={onCancel} className="px-12 py-6 rounded-[2rem] text-slate-400 font-black text-xs uppercase tracking-[0.3em] hover:bg-slate-50 transition-all transform active:scale-95">Abort Cycle</button>
         <button 
           type="submit" 
           disabled={!totals.balanced || isReadOnly} 
           onClick={handlePost} 
           className="px-24 py-6 bg-slate-950 text-white rounded-[2.2rem] font-black text-sm uppercase tracking-[0.5em] shadow-2xl hover:bg-indigo-600 transition-all transform active:scale-95 disabled:bg-slate-100 disabled:text-slate-300 disabled:shadow-none border-b-8 border-black/40"
         >
            Authorize Commit
         </button>
      </div>
    </div>
  );
};

export default VoucherEntryForm;
