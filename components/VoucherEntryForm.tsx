import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Voucher, Ledger, LedgerEntry, VoucherItem } from '../types';

interface VoucherEntryFormProps {
  isReadOnly?: boolean;
  ledgers: Ledger[];
  onSubmit: (data: Omit<Voucher, 'id' | 'status'>) => void;
  onCancel: () => void;
  getNextId: (type: string) => string;
}

type VType = 'Payment' | 'Receipt' | 'Contra' | 'Journal';
type EntryMode = 'LEDGER' | 'ITEMIZED';

const VoucherEntryForm: React.FC<VoucherEntryFormProps> = ({ isReadOnly, ledgers, onSubmit, onCancel, getNextId }) => {
  const [vchType, setVchType] = useState<VType>('Payment');
  const [entryMode, setEntryMode] = useState<EntryMode>('LEDGER');
  const [supplyType, setSupplyType] = useState<'Local' | 'Central'>('Local');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [partyLedgerId, setPartyLedgerId] = useState('');
  const [narration, setNarration] = useState('');
  
  // Ledger Mode State
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([
    { id: '1', ledgerId: '', ledgerName: '', type: 'Dr', amount: 0 },
    { id: '2', ledgerId: '', ledgerName: '', type: 'Cr', amount: 0 }
  ]);

  // Itemized Mode State
  const [items, setItems] = useState<VoucherItem[]>([
    { id: 'i1', itemId: '', name: '', hsn: '', qty: 1, unit: 'Pcs', rate: 0, amount: 0, igstRate: 18, cgstRate: 9, sgstRate: 9, taxAmount: 0 }
  ]);

  const nextIdPreview = useMemo(() => getNextId(vchType), [vchType, getNextId]);

  // Calculations for Ledger Mode
  const ledgerTotals = useMemo(() => {
    const dr = ledgerEntries.filter(e => e.type === 'Dr').reduce((acc, e) => acc + e.amount, 0);
    const cr = ledgerEntries.filter(e => e.type === 'Cr').reduce((acc, e) => acc + e.amount, 0);
    return { dr, cr, diff: Math.abs(dr - cr) };
  }, [ledgerEntries]);

  // Calculations for Itemized Mode
  const itemTotals = useMemo(() => {
    const taxableTotal = items.reduce((acc, i) => acc + i.amount, 0);
    const taxTotal = items.reduce((acc, i) => acc + (i.taxAmount || 0), 0);
    const cgstTotal = items.reduce((acc, i) => acc + (supplyType === 'Local' ? (i.taxAmount || 0) / 2 : 0), 0);
    const sgstTotal = items.reduce((acc, i) => acc + (supplyType === 'Local' ? (i.taxAmount || 0) / 2 : 0), 0);
    const igstTotal = items.reduce((acc, i) => acc + (supplyType === 'Central' ? (i.taxAmount || 0) : 0), 0);
    const grandTotal = taxableTotal + taxTotal;
    
    return { taxableTotal, taxTotal, cgstTotal, sgstTotal, igstTotal, grandTotal };
  }, [items, supplyType]);

  const isBalanced = entryMode === 'LEDGER' 
    ? (ledgerTotals.diff < 0.01 && ledgerTotals.dr > 0)
    : (items.length > 0 && itemTotals.grandTotal > 0 && partyLedgerId !== '');

  const addLedgerEntry = () => {
    setLedgerEntries(prev => [...prev, { 
      id: Math.random().toString(36).substr(2, 9), 
      ledgerId: '', 
      ledgerName: '', 
      type: ledgerEntries[ledgerEntries.length - 1].type === 'Dr' ? 'Cr' : 'Dr', 
      amount: 0 
    }]);
  };

  const addItem = () => {
    setItems(prev => [...prev, {
      id: `vi-${Date.now()}`,
      itemId: '',
      name: '',
      hsn: '',
      qty: 1,
      unit: 'Pcs',
      rate: 0,
      amount: 0,
      igstRate: 18,
      cgstRate: 9,
      sgstRate: 9,
      taxAmount: 0
    }]);
  };

  const updateItem = (id: string, field: keyof VoucherItem, value: any) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        // Recalculate amount and tax
        if (field === 'qty' || field === 'rate' || field === 'igstRate') {
          const qty = field === 'qty' ? parseFloat(value) || 0 : item.qty;
          const rate = field === 'rate' ? parseFloat(value) || 0 : item.rate;
          const gst = field === 'igstRate' ? parseFloat(value) || 0 : item.igstRate || 0;
          
          updated.amount = qty * rate;
          updated.taxAmount = updated.amount * (gst / 100);
          updated.cgstRate = gst / 2;
          updated.sgstRate = gst / 2;
        }
        return updated;
      }
      return item;
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isBalanced || isReadOnly) return;
    
    if (entryMode === 'LEDGER') {
      const primaryEntry = ledgerEntries.find(e => e.type === (vchType === 'Payment' ? 'Cr' : 'Dr')) || ledgerEntries[0];
      onSubmit({
        type: vchType,
        date,
        party: primaryEntry.ledgerName,
        amount: ledgerTotals.dr,
        narration,
        entries: ledgerEntries
      });
    } else {
      const partyLedger = ledgers.find(l => l.id === partyLedgerId);
      onSubmit({
        type: vchType,
        date,
        party: partyLedger?.name || 'Itemized Party',
        amount: itemTotals.grandTotal,
        narration,
        items: items,
        subTotal: itemTotals.taxableTotal,
        taxTotal: itemTotals.taxTotal,
        supplyType,
        gstClassification: vchType === 'Payment' ? 'Input' : 'Output'
      });
    }
  };

  const typeConfig = {
    Payment: { color: 'rose', icon: '💸', label: 'Payment' },
    Receipt: { color: 'emerald', icon: '📥', label: 'Receipt' },
    Contra: { color: 'blue', icon: '🔄', label: 'Contra' },
    Journal: { color: 'amber', icon: '⚖️', label: 'Journal' }
  };

  const active = typeConfig[vchType];

  return (
    <div className="bg-white rounded-[3rem] border border-slate-200 shadow-2xl overflow-hidden max-w-7xl mx-auto animate-in zoom-in-95 duration-300">
      {/* Dynamic Header */}
      <div className={`px-10 py-10 bg-${active.color}-600 text-white flex justify-between items-center transition-colors duration-500 relative overflow-hidden`}>
        <div className="flex items-center space-x-6 relative z-10">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-3xl border border-white/10 backdrop-blur-md shadow-inner transform -rotate-3">
            {active.icon}
          </div>
          <div>
            <div className="flex items-center space-x-4">
              <h3 className="text-3xl font-black uppercase italic tracking-tighter leading-none">{active.label} Protocol</h3>
              <div className="px-4 py-1 bg-black/20 rounded-lg border border-white/10 flex items-center space-x-2">
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
                 <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Next Hash: {nextIdPreview}</span>
              </div>
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-80 mt-2 italic">Nexus Statutory Engine v5.1 • Verification Active</p>
          </div>
        </div>
        <div className="flex items-center space-x-6 relative z-10">
           <div className="flex p-1.5 bg-black/20 rounded-2xl backdrop-blur-md border border-white/10 shadow-lg">
              {(['LEDGER', 'ITEMIZED'] as EntryMode[]).map(m => (
                <button key={m} type="button" onClick={() => setEntryMode(m)} className={`px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${entryMode === m ? 'bg-white text-indigo-600 shadow-xl scale-105' : 'text-white/60 hover:text-white'}`}>{m === 'LEDGER' ? 'Ledger Entry' : 'Itemized Entry'}</button>
              ))}
           </div>
           <button type="button" onClick={onCancel} className="p-3 hover:bg-white/10 rounded-full transition-all border border-white/10"><svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-[120px] opacity-10 -mr-48 -mt-48"></div>
      </div>

      <form onSubmit={handleSubmit} className="p-10 space-y-10">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-10">
          {/* Main Entry Side */}
          <div className="xl:col-span-3 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 bg-slate-50/50 p-8 rounded-[2.5rem] border border-slate-100 shadow-inner">
               <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Voucher Class</label>
                  <select value={vchType} onChange={e => setVchType(e.target.value as VType)} className="w-full px-6 py-4 rounded-2xl border border-slate-200 bg-white text-sm font-black text-slate-800 outline-none focus:ring-4 focus:ring-indigo-500/10 shadow-sm">
                    {['Payment', 'Receipt', 'Contra', 'Journal'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
               </div>
               <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Statutory Date</label>
                  <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full px-6 py-4 rounded-2xl border border-slate-200 bg-white text-sm font-black text-slate-800 outline-none focus:ring-4 focus:ring-indigo-500/10 shadow-sm" />
               </div>
               <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Operating Jurisdiction</label>
                  <div className="flex p-1.5 bg-slate-200 rounded-2xl border border-slate-300">
                    {(['Local', 'Central'] as const).map(s => (
                      <button key={s} type="button" onClick={() => setSupplyType(s)} className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${supplyType === s ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-500 hover:text-slate-800'}`}>{s}</button>
                    ))}
                  </div>
               </div>
               
               {entryMode === 'ITEMIZED' && (
                 <div className="md:col-span-3 space-y-1.5 animate-in slide-in-from-top-4 duration-500">
                    <label className="text-[10px] font-black uppercase text-indigo-600 tracking-widest ml-1">Party / Identity Node</label>
                    <select value={partyLedgerId} onChange={e => setPartyLedgerId(e.target.value)} className="w-full px-6 py-4 rounded-2xl border border-indigo-200 bg-white text-sm font-black text-indigo-700 outline-none focus:ring-4 focus:ring-indigo-500/10 shadow-lg">
                      <option value="">-- Choose Target Ledger --</option>
                      {ledgers.map(l => <option key={l.id} value={l.id}>{l.name} [{l.group}]</option>)}
                    </select>
                 </div>
               )}
            </div>

            {/* Content Table Block */}
            <div className="bg-white rounded-[3rem] border-2 border-slate-100 overflow-hidden shadow-2xl relative">
              {entryMode === 'LEDGER' ? (
                <div className="animate-in fade-in duration-300">
                   <table className="w-full text-left">
                      <thead className="bg-slate-950 text-[9px] font-black uppercase text-slate-500 tracking-widest">
                         <tr>
                            <th className="px-8 py-5 text-center w-24">Nature</th>
                            <th className="px-8 py-5">Ledger Account</th>
                            <th className="px-8 py-5 text-right w-48">Amount ($)</th>
                            <th className="px-8 py-5 w-16"></th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                         {ledgerEntries.map((entry) => (
                           <tr key={entry.id} className="group">
                              <td className="px-8 py-4">
                                 <button 
                                  type="button" 
                                  onClick={() => setLedgerEntries(prev => prev.map(e => e.id === entry.id ? {...e, type: e.type === 'Dr' ? 'Cr' : 'Dr'} : e))}
                                  className={`w-full py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${entry.type === 'Dr' ? 'bg-indigo-50 text-indigo-600 border border-indigo-200' : 'bg-rose-50 text-rose-600 border border-rose-200'}`}
                                 >
                                   {entry.type}
                                 </button>
                              </td>
                              <td className="px-8 py-4">
                                 <select 
                                  value={entry.ledgerId} 
                                  onChange={e => {
                                    const l = ledgers.find(x => x.id === e.target.value);
                                    setLedgerEntries(prev => prev.map(le => le.id === entry.id ? {...le, ledgerId: e.target.value, ledgerName: l?.name || ''} : le));
                                  }}
                                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-black text-slate-700 outline-none"
                                 >
                                   <option value="">-- Select Account --</option>
                                   {ledgers.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                                 </select>
                              </td>
                              <td className="px-8 py-4">
                                 <input 
                                  type="number" 
                                  value={entry.amount || ''} 
                                  onChange={e => setLedgerEntries(prev => prev.map(le => le.id === entry.id ? {...le, amount: parseFloat(e.target.value) || 0} : le))}
                                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-right text-xs font-black tabular-nums outline-none"
                                 />
                              </td>
                              <td className="px-8 py-4 text-center">
                                 <button type="button" onClick={() => setLedgerEntries(prev => prev.filter(le => le.id !== entry.id))} className="text-slate-200 hover:text-rose-500 transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                              </td>
                           </tr>
                         ))}
                      </tbody>
                   </table>
                   <button type="button" onClick={addLedgerEntry} className="w-full py-4 bg-slate-50 text-[10px] font-black uppercase text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all tracking-[0.3em]">+ APPEND LEDGER LINE</button>
                </div>
              ) : (
                <div className="animate-in fade-in duration-300">
                   <table className="w-full text-left">
                      <thead className="bg-slate-900 text-[9px] font-black uppercase text-slate-400 tracking-widest">
                         <tr>
                            <th className="px-8 py-5">Item/Service Descriptor</th>
                            <th className="px-8 py-5 text-center">HSN/SAC</th>
                            <th className="px-8 py-5 text-center">Qty / Unit</th>
                            <th className="px-8 py-5 text-right">Rate</th>
                            <th className="px-8 py-5 text-center">GST %</th>
                            <th className="px-8 py-5 text-right">Taxable Val</th>
                            <th className="px-8 py-5 w-16"></th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                         {items.map((item) => (
                           <tr key={item.id} className="hover:bg-slate-50 group">
                              <td className="px-8 py-4">
                                 <input value={item.name} onChange={e => updateItem(item.id, 'name', e.target.value)} placeholder="Enter details..." className="w-full bg-transparent border-none text-xs font-black text-slate-800 outline-none italic" />
                              </td>
                              <td className="px-8 py-4 text-center">
                                 <input value={item.hsn} onChange={e => updateItem(item.id, 'hsn', e.target.value)} placeholder="Code" className="w-20 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-center font-mono text-[10px] font-bold" />
                              </td>
                              <td className="px-8 py-4">
                                 <div className="flex items-center space-x-2">
                                    <input type="number" value={item.qty} onChange={e => updateItem(item.id, 'qty', e.target.value)} className="w-14 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-center font-black text-[10px]" />
                                    <input value={item.unit} onChange={e => updateItem(item.id, 'unit', e.target.value)} placeholder="UoM" className="w-12 bg-transparent border-none text-[9px] font-bold uppercase text-slate-400" />
                                 </div>
                              </td>
                              <td className="px-8 py-4 text-right">
                                 <input type="number" value={item.rate || ''} onChange={e => updateItem(item.id, 'rate', e.target.value)} placeholder="0" className="w-24 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-right font-black text-[11px] tabular-nums" />
                              </td>
                              <td className="px-8 py-4 text-center">
                                 <select value={item.igstRate} onChange={e => updateItem(item.id, 'igstRate', e.target.value)} className="bg-indigo-50 text-indigo-600 rounded-lg px-2 py-1 text-[10px] font-black border border-indigo-100 outline-none">
                                    {[0, 5, 12, 18, 28].map(s => <option key={s} value={s}>{s}%</option>)}
                                 </select>
                              </td>
                              <td className="px-8 py-4 text-right">
                                 <div className="font-black text-slate-900 text-[11px] tabular-nums">${item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                                 <div className="text-[8px] font-bold text-indigo-500 uppercase mt-0.5">Tax: ${item.taxAmount?.toFixed(2)}</div>
                              </td>
                              <td className="px-8 py-4 text-center">
                                 <button type="button" onClick={() => setItems(prev => prev.filter(i => i.id !== item.id))} className="text-slate-200 hover:text-rose-500 transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                              </td>
                           </tr>
                         ))}
                      </tbody>
                   </table>
                   <button type="button" onClick={addItem} className="w-full py-4 bg-slate-50 text-[10px] font-black uppercase text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all tracking-[0.3em]">+ APPEND SERVICE ITEM</button>
                </div>
              )}
            </div>

            <div className="space-y-2">
               <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Forensic Narration / Notes</label>
               <textarea 
                  value={narration}
                  onChange={e => setNarration(e.target.value)}
                  placeholder="Record mandatory business context for statutory audit..."
                  className="w-full h-32 px-8 py-6 rounded-[2.5rem] border border-slate-200 bg-slate-50/50 text-sm font-medium italic resize-none shadow-inner outline-none focus:ring-4 focus:ring-indigo-500/10"
               />
            </div>
          </div>

          {/* Forensic Sidebar */}
          <div className="space-y-8">
             <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl border-t-8 border-indigo-600">
                <div className="relative z-10 space-y-8">
                   <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400">Registry Summary</h4>
                   
                   {entryMode === 'LEDGER' ? (
                     <div className="space-y-6">
                        <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-500 tracking-widest">
                           <span>Total Debits</span>
                           <span className="text-white font-mono">${ledgerTotals.dr.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-500 tracking-widest">
                           <span>Total Credits</span>
                           <span className="text-white font-mono">${ledgerTotals.cr.toLocaleString()}</span>
                        </div>
                        <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                           <span className="text-[10px] font-black uppercase text-indigo-400 italic">Variance</span>
                           <span className={`text-xl font-black italic tabular-nums ${ledgerTotals.diff === 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                             {ledgerTotals.diff === 0 ? '✓ PROOF OK' : `$${ledgerTotals.diff.toLocaleString()}`}
                           </span>
                        </div>
                     </div>
                   ) : (
                     <div className="space-y-6">
                        <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-500 tracking-widest">
                           <span>Taxable Value</span>
                           <span className="text-white font-mono">${itemTotals.taxableTotal.toLocaleString()}</span>
                        </div>
                        <div className="space-y-2 border-t border-white/5 pt-4">
                           {supplyType === 'Local' ? (
                             <>
                               <div className="flex justify-between items-center text-[9px] font-black uppercase text-indigo-400/80 tracking-widest">
                                  <span>Output CGST</span>
                                  <span className="tabular-nums">${itemTotals.cgstTotal.toLocaleString()}</span>
                               </div>
                               <div className="flex justify-between items-center text-[9px] font-black uppercase text-indigo-400/80 tracking-widest">
                                  <span>Output SGST</span>
                                  <span className="tabular-nums">${itemTotals.sgstTotal.toLocaleString()}</span>
                               </div>
                             </>
                           ) : (
                             <div className="flex justify-between items-center text-[9px] font-black uppercase text-indigo-400/80 tracking-widest">
                                <span>Output IGST</span>
                                <span className="tabular-nums">${itemTotals.igstTotal.toLocaleString()}</span>
                             </div>
                           )}
                        </div>
                        <div className="pt-4 border-t border-white/5 flex flex-col items-end">
                           <span className="text-[9px] font-black uppercase text-indigo-500 tracking-[0.2em] mb-1">Settlement Total</span>
                           <div className="text-3xl font-black italic tabular-nums text-white">${itemTotals.grandTotal.toLocaleString()}</div>
                        </div>
                     </div>
                   )}
                </div>
                <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-600 rounded-full blur-[80px] opacity-10 -mr-24 -mt-24"></div>
             </div>

             <div className={`p-8 rounded-[2.5rem] border-2 text-center transition-all ${isBalanced ? 'bg-emerald-50/50 border-emerald-100 text-emerald-600' : 'bg-rose-50/50 border-rose-100 text-rose-600'}`}>
                <div className={`w-10 h-10 mx-auto rounded-xl flex items-center justify-center mb-4 shadow-sm ${isBalanced ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white animate-pulse'}`}>
                   {isBalanced ? '✓' : '!'}
                </div>
                <h5 className="text-[10px] font-black uppercase tracking-[0.2em]">Integrity Verified</h5>
                <p className="text-[10px] font-medium italic opacity-60 mt-1">{isBalanced ? 'Stream is balanced and compliant.' : 'Pending mandatory inputs or variance.'}</p>
             </div>

             <div className="pt-4 flex flex-col space-y-4">
                <button 
                  type="submit" 
                  disabled={!isBalanced || isReadOnly}
                  className={`w-full py-6 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl transition-all transform active:scale-95 border-b-8 border-slate-950 ${isBalanced ? 'bg-slate-900 text-white hover:bg-black' : 'bg-slate-200 text-slate-400 cursor-not-allowed border-none'}`}
                >
                   Commit to Ledger
                </button>
                <button type="button" onClick={onCancel} className="w-full py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest hover:text-rose-500 transition-colors">Discard Sequence</button>
             </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default VoucherEntryForm;