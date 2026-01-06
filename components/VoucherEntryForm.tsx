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

// Fix: Added 'Credit Note' and 'Debit Note' to VType to resolve type errors in TransactionModule
type VType = Extract<VoucherType, 'Payment' | 'Receipt' | 'Contra' | 'Journal' | 'Credit Note' | 'Debit Note'>;

const CURRENCIES = [
  { code: 'USD', symbol: '$' },
  { code: 'EUR', symbol: '€' },
  { code: 'GBP', symbol: '£' },
  { code: 'INR', symbol: '₹' }
];

const VoucherEntryForm: React.FC<VoucherEntryFormProps> = ({ isReadOnly, ledgers, onSubmit, onCancel, getNextId, activeCompany, forcedVType }) => {
  const [vchType, setVchType] = useState<VType>(forcedVType || 'Payment');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [narration, setNarration] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [exchangeRate, setExchangeRate] = useState(1);
  const [supplyType, setSupplyType] = useState<'Local' | 'Central'>('Local');

  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([
    { id: '1', ledgerId: '', ledgerName: '', type: 'Dr', amount: 0, taxRate: 0, taxAmount: 0, cgst: 0, sgst: 0, igst: 0 },
    { id: '2', ledgerId: '', ledgerName: '', type: 'Cr', amount: 0, taxRate: 0, taxAmount: 0, cgst: 0, sgst: 0, igst: 0 }
  ]);

  const updateEntry = (id: string, field: keyof LedgerEntry, value: any) => {
    setLedgerEntries(prev => prev.map(e => {
      if (e.id === id) {
        let updated = { ...e, [field]: value };
        if (field === 'ledgerId') {
          updated.ledgerName = ledgers.find(l => l.id === value)?.name || '';
        }
        if (field === 'amount' || field === 'taxRate') {
          const taxAmt = (updated.amount * (updated.taxRate || 0)) / 100;
          updated.taxAmount = taxAmt;
          updated.cgst = supplyType === 'Local' ? taxAmt / 2 : 0;
          updated.sgst = supplyType === 'Local' ? taxAmt / 2 : 0;
          updated.igst = supplyType === 'Central' ? taxAmt : 0;
        }
        return updated;
      }
      return e;
    }));
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
      entries: ledgerEntries,
      supplyType,
      taxTotal: ledgerEntries.reduce((acc, e) => acc + (e.taxAmount || 0), 0),
      gstClassification: vchType === 'Receipt' ? 'Input' : 'Output'
    });
  };

  return (
    <div className="bg-white rounded-[3.5rem] border border-slate-200 shadow-2xl overflow-hidden max-w-6xl mx-auto p-12 space-y-10 animate-in zoom-in-95">
      <div className="flex items-center justify-between border-b border-slate-100 pb-10">
        <div>
          <h2 className="text-4xl font-black italic uppercase tracking-tighter text-slate-800">{vchType} Shard</h2>
          <p className="text-[10px] font-black uppercase text-indigo-400 tracking-[0.4em] mt-3">Node Hash Sequence: {getNextId(vchType)}</p>
        </div>
        <div className="flex items-center space-x-4">
           <div className="space-y-1 text-right">
              <label className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Base Currency</label>
              <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                 {CURRENCIES.map(c => (
                   <button key={c.code} type="button" onClick={() => setCurrency(c.code)} className={`px-3 py-1.5 text-[10px] font-black rounded-lg transition-all ${currency === c.code ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400'}`}>{c.code}</button>
                 ))}
              </div>
           </div>
           <div className="space-y-1">
              <label className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Exch. Rate</label>
              <input type="number" step="0.01" value={exchangeRate} onChange={e => setExchangeRate(parseFloat(e.target.value))} className="w-20 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-center" />
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
         <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Post Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full px-6 py-4 rounded-2xl border border-slate-200 bg-slate-50 text-sm font-black outline-none focus:ring-8 focus:ring-indigo-500/5 shadow-inner" />
         </div>
         <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Jurisdiction</label>
            <div className="flex bg-slate-200/50 p-1 rounded-2xl border border-slate-200">
               {(['Local', 'Central'] as const).map(s => (
                 <button key={s} type="button" onClick={() => setSupplyType(s)} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${supplyType === s ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-500 hover:text-slate-700'}`}>{s}</button>
               ))}
            </div>
         </div>
      </div>

      <div className="bg-slate-50 rounded-[3rem] border border-slate-200 overflow-hidden shadow-inner p-8">
         <table className="w-full text-left">
            <thead className="text-[9px] font-black uppercase text-slate-400">
               <tr>
                  <th className="px-6 pb-4 w-24">Type</th>
                  <th className="px-6 pb-4">Ledger Identity</th>
                  <th className="px-6 pb-4 text-right w-44">Value</th>
                  <th className="px-6 pb-4 text-right w-24">GST%</th>
               </tr>
            </thead>
            <tbody className="space-y-2">
               {ledgerEntries.map(entry => (
                 <tr key={entry.id}>
                    <td className="px-3 py-2">
                       <select value={entry.type} onChange={e => updateEntry(entry.id, 'type', e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-2 py-3 text-xs font-black text-indigo-600">
                          <option value="Dr">Dr</option>
                          <option value="Cr">Cr</option>
                       </select>
                    </td>
                    <td className="px-3 py-2">
                       <select value={entry.ledgerId} onChange={e => updateEntry(entry.id, 'ledgerId', e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-800 italic">
                          <option value="">-- Choose Account --</option>
                          {ledgers.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                       </select>
                    </td>
                    <td className="px-3 py-2">
                       <input type="number" value={entry.amount || ''} onChange={e => updateEntry(entry.id, 'amount', parseFloat(e.target.value) || 0)} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-right font-black text-sm" placeholder="0.00" />
                    </td>
                    <td className="px-3 py-2">
                       <input type="number" value={entry.taxRate || ''} onChange={e => updateEntry(entry.id, 'taxRate', parseFloat(e.target.value) || 0)} className="w-full bg-white border border-slate-200 rounded-xl px-2 py-3 text-center font-black text-xs text-indigo-400" placeholder="0%" />
                    </td>
                 </tr>
               ))}
            </tbody>
         </table>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
         <div className="relative z-10">
            <div className="text-[10px] font-black uppercase text-indigo-400 tracking-[0.4em] mb-4">Verification Registry</div>
            <div className="flex items-end space-x-10">
               <div>
                  <div className="text-[8px] font-black uppercase text-slate-500 mb-1">Debit Balance</div>
                  <div className="text-3xl font-black italic tabular-nums">${totals.dr.toLocaleString()}</div>
               </div>
               <div>
                  <div className="text-[8px] font-black uppercase text-slate-500 mb-1">Credit Balance</div>
                  <div className="text-3xl font-black italic tabular-nums">${totals.cr.toLocaleString()}</div>
               </div>
               <div className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase border-2 ${totals.balanced ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' : 'bg-rose-500/10 border-rose-500 text-rose-400 animate-pulse'}`}>
                  {totals.balanced ? 'Symmetric ✓' : 'Variance Detected ⚠'}
               </div>
            </div>
         </div>
         <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600 rounded-full blur-[100px] opacity-10 -mr-24 -mt-24"></div>
      </div>

      <div className="pt-10 border-t border-slate-100 flex justify-end space-x-6">
         <button type="button" onClick={onCancel} className="px-10 py-5 rounded-2xl text-slate-400 font-black text-xs uppercase tracking-widest hover:bg-slate-50">Abort</button>
         <button type="submit" disabled={!totals.balanced || isReadOnly} className="px-16 py-5 bg-slate-900 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.4em] shadow-2xl hover:bg-indigo-600 transition-all transform active:scale-95 disabled:bg-slate-100 disabled:text-slate-300">Commit Transaction</button>
      </div>
    </div>
  );
};

export default VoucherEntryForm;