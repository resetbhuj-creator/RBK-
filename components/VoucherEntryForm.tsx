import React, { useState, useMemo, useEffect } from 'react';
import { Voucher, Ledger, LedgerEntry } from '../types';

interface VoucherEntryFormProps {
  isReadOnly?: boolean;
  ledgers: Ledger[];
  vouchers?: Voucher[];
  onSubmit: (data: Omit<Voucher, 'id' | 'status'>) => void;
  onCancel: () => void;
  getNextId: (type: string) => string;
}

type VType = 'Payment' | 'Receipt' | 'Contra' | 'Journal';

const VoucherEntryForm: React.FC<VoucherEntryFormProps> = ({ isReadOnly, ledgers, vouchers = [], onSubmit, onCancel, getNextId }) => {
  const [vchType, setVchType] = useState<VType>('Payment');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [narration, setNarration] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
  
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([
    { id: '1', ledgerId: '', ledgerName: '', type: 'Dr', amount: 0 },
    { id: '2', ledgerId: '', ledgerName: '', type: 'Cr', amount: 0 }
  ]);

  const nextIdPreview = useMemo(() => getNextId(vchType), [vchType, getNextId]);

  const getLiveBalance = (lId: string) => {
    const l = ledgers.find(x => x.id === lId);
    if (!l) return 0;
    let bal = l.openingBalance;
    vouchers.forEach(v => {
      if (v.ledgerId === lId) bal += (l.type === 'Debit' ? v.amount : -v.amount);
      if (v.secondaryLedgerId === lId) bal += (l.type === 'Debit' ? -v.amount : v.amount);
      v.entries?.forEach(e => {
        if (e.ledgerId === lId) {
          if (e.type === 'Dr') bal += (l.type === 'Debit' ? e.amount : -e.amount);
          else bal += (l.type === 'Debit' ? -e.amount : e.amount);
        }
      });
    });
    return bal;
  };

  const totals = useMemo(() => {
    const dr = ledgerEntries.filter(e => e.type === 'Dr').reduce((acc, e) => acc + e.amount, 0);
    const cr = ledgerEntries.filter(e => e.type === 'Cr').reduce((acc, e) => acc + e.amount, 0);
    return { dr, cr, diff: Math.abs(dr - cr) };
  }, [ledgerEntries]);

  const isBalanced = totals.diff < 0.01 && totals.dr > 0 && ledgerEntries.every(e => e.ledgerId !== '');

  const addLedgerEntry = () => {
    setLedgerEntries(prev => [...prev, { 
      id: Math.random().toString(36).substr(2, 9), 
      ledgerId: '', 
      ledgerName: '', 
      type: ledgerEntries[ledgerEntries.length - 1].type === 'Dr' ? 'Cr' : 'Dr', 
      amount: 0 
    }]);
  };

  const autoBalance = () => {
    if (totals.diff === 0) return;
    const lastIdx = ledgerEntries.length - 1;
    const lastEntry = ledgerEntries[lastIdx];
    const newAmount = lastEntry.type === 'Dr' ? lastEntry.amount + (totals.cr - totals.dr) : lastEntry.amount + (totals.dr - totals.cr);
    if (newAmount >= 0) {
      setLedgerEntries(prev => prev.map((e, i) => i === lastIdx ? { ...e, amount: newAmount } : e));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isBalanced || isReadOnly || isAssigning) return;
    setIsAssigning(true);
    setTimeout(() => {
      const primaryEntry = ledgerEntries.find(e => e.type === (vchType === 'Payment' ? 'Cr' : 'Dr')) || ledgerEntries[0];
      onSubmit({
        type: vchType,
        date,
        party: primaryEntry.ledgerName,
        amount: totals.dr,
        narration,
        entries: ledgerEntries
      });
      setIsAssigning(false);
    }, 600);
  };

  const typeConfig = {
    Payment: { color: 'rose', icon: '💸', label: 'Payment' },
    Receipt: { color: 'emerald', icon: '📥', label: 'Receipt' },
    Contra: { color: 'blue', icon: '🔄', label: 'Contra' },
    Journal: { color: 'amber', icon: '⚖️', label: 'Journal' }
  };

  const active = typeConfig[vchType];

  return (
    <div className="bg-white rounded-[3.5rem] border border-slate-200 shadow-2xl overflow-hidden max-w-7xl mx-auto animate-in zoom-in-95 duration-300">
      <div className={`px-10 py-12 bg-${active.color}-600 text-white flex justify-between items-center transition-all duration-500 relative overflow-hidden`}>
        <div className="flex items-center space-x-8 relative z-10">
          <div className="w-20 h-20 bg-white/20 rounded-[2rem] flex items-center justify-center text-4xl border border-white/10 backdrop-blur-md shadow-2xl transform -rotate-3 transition-transform hover:rotate-0">
            {active.icon}
          </div>
          <div>
            <div className="flex items-center space-x-5">
              <h3 className="text-4xl font-black uppercase italic tracking-tighter leading-none">{active.label} Node</h3>
              <div className="px-5 py-1.5 bg-black/20 rounded-xl border border-white/10 flex items-center space-x-3">
                 <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                 <span className="text-[11px] font-black uppercase tracking-widest text-emerald-400">Node Seq: {nextIdPreview}</span>
              </div>
            </div>
            <p className="text-xs font-black uppercase tracking-[0.4em] opacity-70 mt-3 italic">Verified Ledger Stream • Nexus Protocol 5.0</p>
          </div>
        </div>
        <button type="button" onClick={onCancel} className="p-4 hover:bg-white/10 rounded-full transition-all border border-white/10 group"><svg className="w-8 h-8 group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg></button>
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white rounded-full blur-[150px] opacity-10 -mr-64 -mt-64"></div>
      </div>

      <form onSubmit={handleSubmit} className="p-12 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 bg-slate-50/50 p-10 rounded-[3.5rem] border border-slate-100 shadow-inner">
           <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Voucher Class</label>
              <select value={vchType} onChange={e => setVchType(e.target.value as VType)} className="w-full px-8 py-5 rounded-2xl border border-slate-200 bg-white text-sm font-black text-slate-800 outline-none focus:ring-8 focus:ring-indigo-500/5 shadow-sm appearance-none cursor-pointer">
                {['Payment', 'Receipt', 'Contra', 'Journal'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
           </div>
           <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Execution Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full px-8 py-5 rounded-2xl border border-slate-200 bg-white text-sm font-black text-slate-800 outline-none focus:ring-8 focus:ring-indigo-500/5 shadow-sm" />
           </div>
           <div className="md:col-span-2 flex items-center justify-end">
              <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-xl flex space-x-10">
                 <div className="text-center">
                    <div className="text-[9px] font-black uppercase text-slate-400 mb-1">Debit Sum</div>
                    <div className="text-xl font-black text-indigo-600 tabular-nums">${totals.dr.toLocaleString()}</div>
                 </div>
                 <div className="w-px h-10 bg-slate-100"></div>
                 <div className="text-center">
                    <div className="text-[9px] font-black uppercase text-slate-400 mb-1">Credit Sum</div>
                    <div className="text-xl font-black text-rose-500 tabular-nums">${totals.cr.toLocaleString()}</div>
                 </div>
              </div>
           </div>
        </div>

        <div className="bg-white rounded-[3.5rem] border-2 border-slate-100 overflow-hidden shadow-2xl relative">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-900 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">
              <tr>
                <th className="px-10 py-7 text-center w-32">Integrity</th>
                <th className="px-10 py-7">Account Descriptor</th>
                <th className="px-10 py-7 text-right w-64">Value ($)</th>
                <th className="px-10 py-7 w-20"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {ledgerEntries.map((entry, idx) => (
                <tr key={entry.id} className="group hover:bg-slate-50/50 transition-colors animate-in fade-in slide-in-from-left-4 duration-300">
                  <td className="px-10 py-6">
                    <button 
                      type="button" 
                      onClick={() => setLedgerEntries(prev => prev.map(e => e.id === entry.id ? {...e, type: e.type === 'Dr' ? 'Cr' : 'Dr'} : e))}
                      className={`w-full py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all transform active:scale-95 shadow-md ${entry.type === 'Dr' ? 'bg-indigo-600 text-white shadow-indigo-900/20' : 'bg-rose-600 text-white shadow-rose-900/20'}`}
                    >
                      {entry.type}
                    </button>
                  </td>
                  <td className="px-10 py-6">
                    <div className="space-y-2">
                      <select 
                        value={entry.ledgerId} 
                        onChange={e => {
                          const l = ledgers.find(x => x.id === e.target.value);
                          setLedgerEntries(prev => prev.map(le => le.id === entry.id ? {...le, ledgerId: e.target.value, ledgerName: l?.name || ''} : le));
                        }}
                        className="w-full bg-slate-100 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-black text-slate-700 outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500/5 transition-all shadow-inner"
                      >
                        <option value="">-- Choose Target Account --</option>
                        {ledgers.map(l => <option key={l.id} value={l.id}>{l.name} [{l.group}]</option>)}
                      </select>
                      {entry.ledgerId && (
                        <div className="flex items-center space-x-4 px-2">
                           <div className="flex items-center text-[10px] font-black text-slate-400 uppercase tracking-tighter italic">
                              Live Position: <span className={`ml-2 ${getLiveBalance(entry.ledgerId) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>${getLiveBalance(entry.ledgerId).toLocaleString()}</span>
                           </div>
                           <div className="w-1 h-1 rounded-full bg-slate-200"></div>
                           <div className="text-[10px] font-black text-slate-400 uppercase tracking-tighter italic">
                              Node ID: <span className="text-slate-800 ml-2">#{entry.ledgerId.toUpperCase()}</span>
                           </div>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-10 py-6">
                    <input 
                      type="number" 
                      value={entry.amount || ''} 
                      onChange={e => setLedgerEntries(prev => prev.map(le => le.id === entry.id ? {...le, amount: parseFloat(e.target.value) || 0} : le))}
                      className="w-full bg-slate-100 border border-slate-200 rounded-2xl px-6 py-4 text-right text-lg font-black tabular-nums text-slate-900 outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500/5 transition-all shadow-inner"
                      placeholder="0.00"
                    />
                  </td>
                  <td className="px-10 py-6 text-center">
                    <button type="button" onClick={() => setLedgerEntries(prev => prev.filter(le => le.id !== entry.id))} className="text-slate-200 hover:text-rose-600 transition-all p-3 rounded-xl hover:bg-rose-50"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex bg-slate-50 border-t border-slate-100 divide-x divide-slate-100">
             <button type="button" onClick={addLedgerEntry} className="flex-1 py-6 text-[11px] font-black uppercase text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all tracking-[0.4em] shadow-inner">+ APPEND RESOURCE LINE</button>
             {totals.diff > 0 && (
               <button type="button" onClick={autoBalance} className="px-12 py-6 text-[11px] font-black uppercase text-rose-600 hover:bg-rose-600 hover:text-white transition-all tracking-[0.4em] animate-pulse">
                  Apply Balance Delta (${totals.diff.toLocaleString()})
               </button>
             )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12 pt-8">
           <div className="lg:col-span-3 space-y-4">
              <label className="text-[11px] font-black uppercase text-slate-400 ml-4 tracking-[0.4em]">Audit Narrative & Context</label>
              <textarea 
                value={narration}
                onChange={e => setNarration(e.target.value)}
                placeholder="Document institutional context for this movement..."
                className="w-full h-48 px-10 py-8 rounded-[3.5rem] border border-slate-200 bg-slate-50/50 text-sm font-medium italic resize-none shadow-inner outline-none focus:ring-8 focus:ring-indigo-500/5 leading-relaxed"
              />
           </div>
           <div className="space-y-8">
              <div className={`p-8 rounded-[3rem] border-2 text-center transition-all duration-500 ${isBalanced ? 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-xl' : 'bg-rose-50 border-rose-200 text-rose-700 shadow-inner opacity-60'}`}>
                 <div className={`w-16 h-16 mx-auto rounded-[1.5rem] flex items-center justify-center mb-5 shadow-2xl transition-all ${isBalanced ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white animate-pulse'}`}>
                    {isBalanced ? <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg> : <span className="text-2xl font-black">!</span>}
                 </div>
                 <h5 className="text-[12px] font-black uppercase tracking-[0.2em]">{isBalanced ? 'Integrity Verified' : 'Symmetry Violation'}</h5>
                 <p className="text-[10px] font-bold italic opacity-60 mt-1">{isBalanced ? 'Ledger is in equilibrium.' : 'Debit/Credit delta detected.'}</p>
              </div>

              <div className="space-y-4">
                <button 
                  type="submit" 
                  disabled={!isBalanced || isReadOnly || isAssigning}
                  className={`w-full py-8 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.4em] shadow-2xl transition-all transform active:scale-95 border-b-8 border-slate-950 ${isBalanced && !isAssigning ? 'bg-slate-900 text-white hover:bg-black group' : 'bg-slate-200 text-slate-400 cursor-not-allowed border-none'}`}
                >
                   {isAssigning ? (
                     <div className="flex items-center justify-center space-x-3">
                        <div className="w-4 h-4 border-4 border-slate-400 border-t-white rounded-full animate-spin"></div>
                        <span>Syncing Registry...</span>
                     </div>
                   ) : <span className="group-hover:scale-110 transition-transform block">Authorize Transmission</span>}
                </button>
                <button type="button" onClick={onCancel} className="w-full py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest hover:text-rose-500 transition-colors">Abort Sequence</button>
              </div>
           </div>
        </div>
      </form>
    </div>
  );
};

export default VoucherEntryForm;