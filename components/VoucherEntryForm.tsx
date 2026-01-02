import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Voucher, Ledger, LedgerEntry } from '../types';

interface VoucherEntryFormProps {
  isReadOnly?: boolean;
  ledgers: Ledger[];
  onSubmit: (data: Omit<Voucher, 'id' | 'status'>) => void;
  onCancel: () => void;
  getNextId: (type: string) => string;
}

type VType = 'Payment' | 'Receipt' | 'Contra' | 'Journal';

const VoucherEntryForm: React.FC<VoucherEntryFormProps> = ({ isReadOnly, ledgers, onSubmit, onCancel, getNextId }) => {
  const [vchType, setVchType] = useState<VType>('Payment');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [narration, setNarration] = useState('');
  const [entries, setEntries] = useState<LedgerEntry[]>([
    { id: '1', ledgerId: '', ledgerName: '', type: 'Dr', amount: 0 },
    { id: '2', ledgerId: '', ledgerName: '', type: 'Cr', amount: 0 }
  ]);

  // Derived next sequence preview based on active type
  const nextIdPreview = useMemo(() => getNextId(vchType), [vchType, getNextId]);

  const addEntry = () => {
    setEntries(prev => [...prev, { 
      id: Math.random().toString(36).substr(2, 9), 
      ledgerId: '', 
      ledgerName: '', 
      type: entries[entries.length - 1].type === 'Dr' ? 'Cr' : 'Dr', 
      amount: 0 
    }]);
  };

  const removeEntry = (id: string) => {
    if (entries.length <= 2) return;
    setEntries(prev => prev.filter(e => e.id !== id));
  };

  const updateEntry = (id: string, field: keyof LedgerEntry, value: any) => {
    setEntries(prev => prev.map(e => {
      if (e.id === id) {
        if (field === 'ledgerId') {
          const ledger = ledgers.find(l => l.id === value);
          return { ...e, ledgerId: value, ledgerName: ledger?.name || '' };
        }
        return { ...e, [field]: value };
      }
      return e;
    }));
  };

  const totals = useMemo(() => {
    const dr = entries.filter(e => e.type === 'Dr').reduce((acc, e) => acc + e.amount, 0);
    const cr = entries.filter(e => e.type === 'Cr').reduce((acc, e) => acc + e.amount, 0);
    return { dr, cr, diff: Math.abs(dr - cr) };
  }, [entries]);

  const isBalanced = totals.diff < 0.01 && totals.dr > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isBalanced || isReadOnly) return;
    
    // We treat the first Dr or Cr as the "Party" for simple listing purposes
    const primaryEntry = entries.find(e => e.type === (vchType === 'Payment' ? 'Cr' : 'Dr')) || entries[0];

    onSubmit({
      type: vchType,
      date,
      party: primaryEntry.ledgerName,
      amount: totals.dr,
      narration,
      entries
    });
  };

  const typeConfig = {
    Payment: { color: 'rose', label: 'Payment', icon: '💸', desc: 'Outward Fund Transfer' },
    Receipt: { color: 'emerald', label: 'Receipt', icon: '📥', desc: 'Inward Revenue Collection' },
    Contra: { color: 'blue', label: 'Contra', icon: '🔄', desc: 'Internal Bank/Cash Transfer' },
    Journal: { color: 'amber', label: 'Journal', icon: '⚖️', desc: 'Adjustment & Provisions' }
  };

  const active = typeConfig[vchType];

  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl overflow-hidden max-w-6xl mx-auto animate-in zoom-in-95 duration-300">
      <div className={`px-10 py-10 bg-${active.color}-600 text-white flex justify-between items-center relative overflow-hidden`}>
        <div className="flex items-center space-x-6 relative z-10">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-3xl border border-white/10 backdrop-blur-md shadow-inner transform -rotate-3">
            {active.icon}
          </div>
          <div>
            <div className="flex items-center space-x-4">
              <h3 className="text-3xl font-black uppercase italic tracking-tighter leading-none">{active.label} Entry</h3>
              <div className="px-4 py-1 bg-black/20 rounded-lg border border-white/10 flex items-center space-x-2">
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
                 <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Next ID: {nextIdPreview}</span>
              </div>
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-80 mt-2 italic">{active.desc} • Auto-Sequencing Active</p>
          </div>
        </div>
        <button type="button" onClick={onCancel} className="relative z-10 p-3 hover:bg-white/10 rounded-full transition-all border border-white/10">
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
        <div className="absolute top-0 right-0 w-80 h-80 bg-white rounded-full blur-[120px] opacity-10 -mr-40 -mt-40"></div>
      </div>

      <form onSubmit={handleSubmit} className="p-10 space-y-10">
        <div className="flex flex-col md:flex-row gap-10">
          <div className="flex-1 space-y-8">
            <div className="grid grid-cols-2 gap-8">
               <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Voucher Class</label>
                  <div className="flex p-1.5 bg-slate-100 rounded-2xl border border-slate-200 shadow-inner">
                    {(['Payment', 'Receipt', 'Contra', 'Journal'] as VType[]).map(t => (
                      <button key={t} type="button" onClick={() => setVchType(t)} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-tighter rounded-xl transition-all ${vchType === t ? 'bg-white text-indigo-600 shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>{t}</button>
                    ))}
                  </div>
               </div>
               <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Posting Date</label>
                  <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full px-6 py-4 rounded-2xl border border-slate-200 bg-slate-50 text-sm font-black text-slate-800 outline-none focus:ring-4 focus:ring-indigo-500/10 shadow-inner" />
               </div>
            </div>

            <div className="bg-white rounded-3xl border-2 border-slate-100 overflow-hidden shadow-xl">
               <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-950 text-[9px] font-black uppercase text-slate-500 tracking-widest">
                     <tr>
                        <th className="px-8 py-5 text-center w-24">Nature</th>
                        <th className="px-8 py-5">Account Head / Ledger</th>
                        <th className="px-8 py-5 text-right w-48">Amount (USD)</th>
                        <th className="px-8 py-5 w-16"></th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                     {entries.map((entry) => (
                       <tr key={entry.id} className="animate-in slide-in-from-left-2 duration-300 group">
                          <td className="px-8 py-4">
                             <button 
                              type="button" 
                              onClick={() => updateEntry(entry.id, 'type', entry.type === 'Dr' ? 'Cr' : 'Dr')}
                              className={`w-full py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${entry.type === 'Dr' ? 'bg-indigo-50 text-indigo-600 border border-indigo-200' : 'bg-rose-50 text-rose-600 border border-rose-200'}`}
                             >
                               {entry.type}
                             </button>
                          </td>
                          <td className="px-8 py-4">
                             <select 
                              value={entry.ledgerId} 
                              onChange={e => updateEntry(entry.id, 'ledgerId', e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-black text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
                             >
                               <option value="">-- Choose Account --</option>
                               {ledgers.map(l => <option key={l.id} value={l.id}>{l.name} [{l.group}]</option>)}
                             </select>
                          </td>
                          <td className="px-8 py-4">
                             <input 
                              type="number" 
                              value={entry.amount || ''} 
                              placeholder="0.00"
                              onChange={e => updateEntry(entry.id, 'amount', parseFloat(e.target.value) || 0)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-right text-xs font-black text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 tabular-nums"
                             />
                          </td>
                          <td className="px-8 py-4 text-center">
                             <button type="button" onClick={() => removeEntry(entry.id)} className="text-slate-200 hover:text-rose-500 transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                          </td>
                       </tr>
                     ))}
                  </tbody>
               </table>
               <button type="button" onClick={addEntry} className="w-full py-4 bg-slate-50 text-[10px] font-black uppercase text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all tracking-[0.3em]">+ APPEND LEDGER LINE</button>
            </div>
          </div>

          <div className="w-full md:w-80 space-y-8">
             <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl border-t-8 border-indigo-600">
                <div className="relative z-10 space-y-8">
                   <div className="space-y-4">
                      <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-500 tracking-widest">
                         <span>Total Debits</span>
                         <span className="text-white font-mono">${totals.dr.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-500 tracking-widest">
                         <span>Total Credits</span>
                         <span className="text-white font-mono">${totals.cr.toLocaleString()}</span>
                      </div>
                      <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                         <span className="text-[10px] font-black uppercase text-indigo-400 tracking-widest italic">Variance</span>
                         <span className={`text-xl font-black italic tabular-nums ${totals.diff === 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                           {totals.diff === 0 ? '✓ PROOF OK' : `$${totals.diff.toLocaleString()}`}
                         </span>
                      </div>
                   </div>
                   
                   <div className={`p-4 rounded-2xl border-2 text-center transition-all ${isBalanced ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' : 'bg-rose-500/10 border-rose-500/50 text-rose-400'}`}>
                      <span className="text-[9px] font-black uppercase tracking-widest">{isBalanced ? 'Trial Symmetry Verified' : 'Unbalanced Transaction'}</span>
                   </div>
                </div>
             </div>

             <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Voucher Narration</label>
                <textarea 
                  value={narration}
                  onChange={e => setNarration(e.target.value)}
                  placeholder="Mandatory business logic for auditing..."
                  className="w-full h-48 p-6 rounded-[2rem] border border-slate-200 bg-slate-50 text-xs font-medium italic resize-none shadow-inner outline-none focus:ring-4 focus:ring-indigo-500/10"
                />
             </div>

             <div className="pt-4 flex flex-col space-y-3">
                <button 
                  type="submit" 
                  disabled={!isBalanced || isReadOnly}
                  className={`w-full py-6 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl transition-all transform active:scale-95 border-b-8 border-slate-950 ${isBalanced ? 'bg-slate-900 text-white hover:bg-black' : 'bg-slate-200 text-slate-400 cursor-not-allowed border-none'}`}
                >
                   Authorize Post
                </button>
                <button type="button" onClick={onCancel} className="w-full py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest hover:text-rose-500 transition-colors">Discard Draft</button>
             </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default VoucherEntryForm;