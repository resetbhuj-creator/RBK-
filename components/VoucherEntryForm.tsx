import React, { useState, useMemo, useEffect } from 'react';
import { Voucher, Ledger, LedgerEntry, VoucherType } from '../types';

interface VoucherEntryFormProps {
  isReadOnly?: boolean;
  ledgers: Ledger[];
  vouchers?: Voucher[];
  onSubmit: (data: Omit<Voucher, 'id' | 'status'>) => void;
  onCancel: () => void;
  getNextId: (type: string) => string;
  activeCompany?: any;
  forcedVType?: VType;
}

type VType = Extract<VoucherType, 'Payment' | 'Receipt' | 'Contra' | 'Journal' | 'Credit Note' | 'Debit Note'>;

const CURRENCIES = [
  { code: 'USD', symbol: '$' },
  { code: 'EUR', symbol: '€' },
  { code: 'GBP', symbol: '£' },
  { code: 'INR', symbol: '₹' },
  { code: 'AED', symbol: 'د.إ' }
];

const VoucherEntryForm: React.FC<VoucherEntryFormProps> = ({ isReadOnly, ledgers, onSubmit, onCancel, getNextId, activeCompany, forcedVType }) => {
  const [vchType, setVchType] = useState<VType>(forcedVType || 'Payment');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [narration, setNarration] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [exchangeRate, setExchangeRate] = useState(1);

  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([
    { id: '1', ledgerId: '', ledgerName: '', type: 'Dr', amount: 0, taxRate: 0, taxAmount: 0 },
    { id: '2', ledgerId: '', ledgerName: '', type: 'Cr', amount: 0, taxRate: 0, taxAmount: 0 }
  ]);

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
    <div className="bg-white rounded-[3.5rem] border border-slate-200 shadow-2xl overflow-hidden max-w-6xl mx-auto p-12 space-y-10 animate-in zoom-in-95">
      <div className="flex items-center justify-between border-b border-slate-100 pb-10">
        <div>
          <h2 className="text-4xl font-black italic uppercase tracking-tighter text-slate-800">{vchType} Protocol</h2>
          <p className="text-[10px] font-black uppercase text-indigo-400 tracking-[0.4em] mt-3">Node Chain Index: {getNextId(vchType)}</p>
        </div>
        <div className="flex items-center space-x-6">
           <div className="space-y-2 text-right">
              <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest block">Anchor Currency</label>
              <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                 {CURRENCIES.map(c => (
                   <button key={c.code} type="button" onClick={() => setCurrency(c.code)} className={`px-3 py-1.5 text-[10px] font-black rounded-lg transition-all ${currency === c.code ? 'bg-white text-indigo-600 shadow-md scale-105' : 'text-slate-400'}`}>{c.code}</button>
                 ))}
              </div>
           </div>
           <div className="space-y-2">
              <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest block">Exchange Ratio</label>
              <input type="number" step="0.001" value={exchangeRate} onChange={e => setExchangeRate(parseFloat(e.target.value))} className="w-24 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-center outline-none focus:ring-4 focus:ring-indigo-500/5 shadow-inner" />
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
         <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Execution Moment (Date)</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full px-6 py-4 rounded-2xl border border-slate-200 bg-slate-50 text-sm font-black outline-none focus:ring-8 focus:ring-indigo-500/5 shadow-inner" />
         </div>
         <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Modular Classification</label>
            <div className="flex bg-slate-200/50 p-1 rounded-2xl border border-slate-200 shadow-inner">
               {(['Payment', 'Receipt', 'Contra', 'Journal'] as VType[]).map(v => (
                 <button key={v} type="button" onClick={() => setVchType(v)} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${vchType === v ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-500 hover:text-slate-700'}`}>{v}</button>
               ))}
            </div>
         </div>
      </div>

      <div className="bg-slate-50 rounded-[3rem] border border-slate-200 overflow-hidden shadow-inner p-8">
         <table className="w-full text-left border-separate border-spacing-y-2">
            <thead className="text-[9px] font-black uppercase text-slate-400">
               <tr>
                  <th className="px-6 pb-2 w-24">Nature</th>
                  <th className="px-6 pb-2">Ledger Identity</th>
                  <th className="px-6 pb-2 text-right w-44">Taxable Value</th>
                  <th className="px-6 pb-2 text-center w-24">GST%</th>
                  <th className="px-6 pb-2 text-right w-44">Net Aggregate</th>
               </tr>
            </thead>
            <tbody>
               {ledgerEntries.map(entry => (
                 <tr key={entry.id} className="group">
                    <td className="px-3">
                       <select value={entry.type} onChange={e => updateEntry(entry.id, 'type', e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-4 text-xs font-black text-indigo-600 shadow-sm focus:ring-4 focus:ring-indigo-500/5 outline-none">
                          <option value="Dr">Debit</option>
                          <option value="Cr">Credit</option>
                       </select>
                    </td>
                    <td className="px-3">
                       <select value={entry.ledgerId} onChange={e => updateEntry(entry.id, 'ledgerId', e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-6 py-4 text-xs font-bold text-slate-800 italic shadow-sm focus:ring-4 focus:ring-indigo-500/5 outline-none">
                          <option value="">-- Locate Account Node --</option>
                          {ledgers.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                       </select>
                    </td>
                    <td className="px-3">
                       <input type="number" value={entry.amount || ''} onChange={e => updateEntry(entry.id, 'amount', parseFloat(e.target.value) || 0)} className="w-full bg-white border border-slate-200 rounded-xl px-6 py-4 text-right font-black text-sm shadow-sm focus:ring-4 focus:ring-indigo-500/5 outline-none" placeholder="0.00" />
                    </td>
                    <td className="px-3">
                       <input type="number" value={entry.taxRate || ''} onChange={e => updateEntry(entry.id, 'taxRate', parseFloat(e.target.value) || 0)} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-4 text-center font-black text-xs text-indigo-400 shadow-sm focus:ring-4 focus:ring-indigo-500/5 outline-none" placeholder="0%" />
                    </td>
                    <td className="px-6 py-4 text-right">
                       <div className="text-sm font-black text-slate-900 tabular-nums italic">
                         ${(entry.amount + (entry.taxAmount || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                       </div>
                    </td>
                 </tr>
               ))}
            </tbody>
         </table>
         <button type="button" onClick={addEntryRow} className="w-full py-4 mt-4 bg-white/50 border-2 border-dashed border-slate-200 rounded-2xl text-[10px] font-black uppercase text-slate-400 hover:bg-white hover:text-indigo-600 hover:border-indigo-200 transition-all tracking-widest">+ Append Transaction Shard</button>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center bg-slate-900 rounded-[3rem] p-12 text-white shadow-2xl relative overflow-hidden border-b-8 border-indigo-600">
         <div className="relative z-10">
            <div className="text-[11px] font-black uppercase text-indigo-400 tracking-[0.5em] mb-6 flex items-center">
               <div className="w-2 h-2 rounded-full bg-emerald-500 mr-3 animate-pulse"></div>
               Symmetry Verification Engine
            </div>
            <div className="flex items-end space-x-12">
               <div>
                  <div className="text-[9px] font-black uppercase text-slate-500 mb-2">Aggregate Debit</div>
                  <div className="text-4xl font-black italic tabular-nums">${totals.dr.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
               </div>
               <div>
                  <div className="text-[9px] font-black uppercase text-slate-500 mb-2">Aggregate Credit</div>
                  <div className="text-4xl font-black italic tabular-nums">${totals.cr.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
               </div>
               <div className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] border-2 transition-all ${totals.balanced ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]' : 'bg-rose-500/10 border-rose-500 text-rose-400 animate-pulse'}`}>
                  {totals.balanced ? 'SYSTEM EQUILIBRIUM ✓' : 'VARIANCE DETECTED ⚠'}
               </div>
            </div>
         </div>
         <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600 rounded-full blur-[120px] opacity-10 -mr-32 -mt-32"></div>
      </div>

      <div className="space-y-3">
        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Audit Narrative (Narration)</label>
        <textarea value={narration} onChange={e => setNarration(e.target.value)} className="w-full h-32 px-8 py-6 rounded-[2.5rem] border border-slate-200 bg-slate-50 text-sm font-medium italic outline-none focus:ring-8 focus:ring-indigo-500/5 focus:bg-white transition-all shadow-inner resize-none" placeholder="State the rationale for this ledger shift..." />
      </div>

      <div className="pt-10 border-t border-slate-100 flex flex-col sm:flex-row justify-end space-y-4 sm:space-y-0 sm:space-x-6">
         <button type="button" onClick={onCancel} className="px-10 py-5 rounded-2xl text-slate-400 font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all">Abort Sequence</button>
         <button type="submit" disabled={!totals.balanced || isReadOnly} onClick={handlePost} className="px-20 py-5 bg-slate-900 text-white rounded-[2rem] font-black text-sm uppercase tracking-[0.4em] shadow-2xl hover:bg-indigo-600 transition-all transform active:scale-95 disabled:bg-slate-100 disabled:text-slate-300 border-b-8 border-black/40">Authorize Posting</button>
      </div>
    </div>
  );
};

export default VoucherEntryForm;