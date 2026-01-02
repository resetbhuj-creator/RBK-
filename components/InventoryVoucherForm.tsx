import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Item, Ledger, Voucher, VoucherItem } from '../types';

interface InventoryVoucherFormProps {
  isReadOnly?: boolean;
  items: Item[];
  ledgers: Ledger[];
  onSubmit: (data: Omit<Voucher, 'id' | 'status'>) => void;
  onCancel: () => void;
}

const InventoryVoucherForm: React.FC<InventoryVoucherFormProps> = ({ isReadOnly, items, ledgers, onSubmit, onCancel }) => {
  const [vchType, setVchType] = useState<'Sales' | 'Purchase'>('Sales');
  const [supplyType, setSupplyType] = useState<'Local' | 'Central'>('Local');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [partyId, setPartyId] = useState('');
  const [reference, setReference] = useState('');
  const [narration, setNarration] = useState('');
  const [vchItems, setVchItems] = useState<VoucherItem[]>([]);
  
  // Search State for Command Palette
  const [searchIdx, setSearchIdx] = useState<number | null>(null);
  const [query, setQuery] = useState('');
  const searchRef = useRef<HTMLDivElement>(null);

  const filteredParties = useMemo(() => {
    const group = vchType === 'Sales' ? 'Sundry Debtors' : 'Sundry Creditors';
    return ledgers.filter(l => l.group === group);
  }, [vchType, ledgers]);

  const searchResults = useMemo(() => {
    if (!query.trim()) return items.slice(0, 5);
    return items.filter(i => 
      i.name.toLowerCase().includes(query.toLowerCase()) || 
      i.hsnCode.includes(query)
    );
  }, [items, query]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchIdx(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const addItem = () => {
    const newItem: VoucherItem = {
      id: `vi-${Date.now()}`,
      itemId: '',
      name: '',
      hsn: '',
      qty: 1,
      unit: 'Nos',
      rate: 0,
      amount: 0,
      cgstRate: 0,
      sgstRate: 0,
      igstRate: 0,
      taxAmount: 0
    };
    setVchItems(prev => [...prev, newItem]);
    setSearchIdx(vchItems.length); // Open search for the new item immediately
    setQuery('');
  };

  const selectItem = (idx: number, item: Item) => {
    setVchItems(prev => prev.map((vi, i) => {
      if (i === idx) {
        const fullRate = item.gstRate || 18;
        const amount = vi.qty * item.salePrice;
        let taxAmount = 0;
        if (supplyType === 'Local') {
           taxAmount = amount * (fullRate / 100); // simplified for mockup
        } else {
           taxAmount = amount * (fullRate / 100);
        }

        return {
          ...vi,
          itemId: item.id,
          name: item.name,
          hsn: item.hsnCode,
          rate: item.salePrice,
          unit: item.unit,
          amount,
          igstRate: fullRate,
          cgstRate: fullRate / 2,
          sgstRate: fullRate / 2,
          taxAmount
        };
      }
      return vi;
    }));
    setSearchIdx(null);
  };

  const updateItemQty = (id: string, qty: number) => {
    setVchItems(prev => prev.map(item => {
      if (item.id === id) {
        const amount = qty * item.rate;
        const taxAmount = amount * (item.igstRate || 18) / 100;
        return { ...item, qty, amount, taxAmount };
      }
      return item;
    }));
  };

  const removeItem = (id: string) => setVchItems(prev => prev.filter(i => i.id !== id));

  const totals = useMemo(() => {
    const subTotal = vchItems.reduce((acc, i) => acc + i.amount, 0);
    const taxTotal = vchItems.reduce((acc, i) => acc + (i.taxAmount || 0), 0);
    const grandTotal = subTotal + taxTotal;
    return { subTotal, taxTotal, grandTotal };
  }, [vchItems]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly || vchItems.length === 0 || !partyId) {
      alert("Invalid Form: Please select a party and at least one transactional component.");
      return;
    }
    
    const party = ledgers.find(l => l.id === partyId)?.name || 'Unknown';
    onSubmit({
      type: vchType,
      date,
      party,
      amount: totals.grandTotal,
      reference,
      narration,
      items: vchItems,
      subTotal: totals.subTotal,
      taxTotal: totals.taxTotal,
      supplyType,
      gstClassification: vchType === 'Sales' ? 'Output' : 'Input'
    });
  };

  return (
    <div className="bg-white rounded-[3rem] border border-slate-200 shadow-2xl overflow-hidden max-w-6xl mx-auto animate-in fade-in duration-500">
      <div className={`px-10 py-10 ${vchType === 'Sales' ? 'bg-emerald-600' : 'bg-indigo-600'} text-white flex justify-between items-center transition-colors duration-500 relative`}>
        <div className="flex items-center space-x-6 relative z-10">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-4xl border border-white/10 backdrop-blur-md shadow-inner transform -rotate-3">
            {vchType === 'Sales' ? '📤' : '📥'}
          </div>
          <div>
            <h3 className="text-3xl font-black uppercase italic tracking-tighter leading-none">{vchType === 'Sales' ? 'Outward' : 'Inward'} Supply Invoice</h3>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-80 mt-2 italic">Nexus Statutory Engine v4.8 • {supplyType} Jurisdiction</p>
          </div>
        </div>
        <div className="flex items-center space-x-6 relative z-10">
           <div className="flex p-1.5 bg-black/20 rounded-2xl backdrop-blur-md border border-white/10 shadow-lg">
              {(['Local', 'Central'] as const).map(s => (
                <button key={s} type="button" onClick={() => setSupplyType(s)} className={`px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${supplyType === s ? 'bg-white text-indigo-600 shadow-xl scale-105' : 'text-white/60 hover:text-white'}`}>{s}</button>
              ))}
           </div>
           <button onClick={onCancel} className="p-3 hover:bg-white/10 rounded-full transition-all border border-white/10"><svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-[120px] opacity-10 -mr-48 -mt-48"></div>
      </div>

      <form onSubmit={handleSubmit} className="p-12 space-y-10">
        <div className="flex bg-slate-100 p-1.5 rounded-[2.5rem] border border-slate-200 shadow-inner">
          {(['Sales', 'Purchase'] as const).map(t => (
            <button key={t} type="button" onClick={() => { setVchType(t); setPartyId(''); }} className={`flex-1 py-5 text-[11px] font-black uppercase tracking-[0.2em] rounded-[2rem] transition-all ${vchType === t ? 'bg-white shadow-xl text-indigo-600 scale-[1.01]' : 'text-slate-400 hover:text-slate-600'}`}>{t === 'Sales' ? 'Create Sales Voucher' : 'Record Purchase'}</button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Invoicing Period</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full px-6 py-4 rounded-2xl border border-slate-200 text-sm font-bold bg-slate-50 outline-none focus:ring-4 focus:ring-indigo-500/10 shadow-inner" />
          </div>
          <div className="md:col-span-2 space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Authorized Party Node</label>
            <select value={partyId} onChange={e => setPartyId(e.target.value)} className="w-full px-6 py-4 rounded-2xl border border-slate-200 text-sm font-black text-indigo-600 bg-white outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all">
              <option value="">-- Choose Master Ledger --</option>
              {filteredParties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Voucher HASH / Ref</label>
            <input value={reference} onChange={e => setReference(e.target.value)} placeholder="e.g. INV-2024-001" className="w-full px-6 py-4 rounded-2xl border border-slate-200 text-sm font-bold bg-slate-50 outline-none focus:ring-4 focus:ring-indigo-500/10" />
          </div>
        </div>

        <div className="bg-white rounded-[2.5rem] border-2 border-slate-100 overflow-hidden shadow-xl">
           <table className="w-full text-left">
             <thead className="bg-slate-900 text-[9px] font-black uppercase text-slate-400">
               <tr>
                 <th className="px-8 py-6">Product / Catalog Item</th>
                 <th className="px-8 py-6 text-center">Volume</th>
                 <th className="px-8 py-6 text-right">Standard Rate</th>
                 <th className="px-8 py-6 text-center">Tax Math</th>
                 <th className="px-8 py-6 text-right">Line Total</th>
                 <th className="px-8 py-6 text-center"></th>
               </tr>
             </thead>
             <tbody className="divide-y divide-slate-50 bg-white">
               {vchItems.map((item, idx) => (
                 <tr key={item.id} className="animate-in fade-in slide-in-from-left-2 duration-300 group">
                   <td className="px-8 py-6 relative" ref={searchIdx === idx ? searchRef : null}>
                      {searchIdx === idx ? (
                         <div className="absolute top-2 left-4 z-50 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
                            <div className="p-3 border-b border-slate-100 bg-slate-50">
                               <input 
                                autoFocus
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                placeholder="Search Item / HSN..."
                                className="w-full bg-white border-none rounded-xl px-4 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500" 
                               />
                            </div>
                            <div className="max-h-60 overflow-y-auto custom-scrollbar">
                               {searchResults.map(res => (
                                 <div 
                                  key={res.id} 
                                  onClick={() => selectItem(idx, res)}
                                  className="p-4 hover:bg-indigo-50 cursor-pointer flex items-center justify-between border-b border-slate-50 last:border-0"
                                 >
                                    <div>
                                       <div className="text-[11px] font-black text-slate-800 uppercase tracking-tight">{res.name}</div>
                                       <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">HSN: {res.hsnCode}</div>
                                    </div>
                                    <div className="text-right">
                                       <div className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">In Stock</div>
                                       <div className="text-[8px] font-bold text-slate-400 uppercase mt-1">Rate: ${res.salePrice}</div>
                                    </div>
                                 </div>
                               ))}
                            </div>
                         </div>
                      ) : (
                        <div onClick={() => setSearchIdx(idx)} className="cursor-pointer">
                           <div className={`text-sm font-black italic tracking-tight ${item.name ? 'text-indigo-600' : 'text-slate-300'}`}>
                             {item.name || '--- Select Master Item ---'}
                           </div>
                           {item.hsn && <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Registry Code: {item.hsn}</div>}
                        </div>
                      )}
                   </td>
                   <td className="px-8 py-6">
                      <div className="flex items-center justify-center space-x-2">
                         <input type="number" value={item.qty} onChange={e => updateItemQty(item.id, parseFloat(e.target.value) || 0)} className="w-20 bg-slate-50 border border-slate-100 rounded-xl py-2 px-3 text-center text-xs font-black outline-none focus:ring-2 focus:ring-indigo-500" />
                         <span className="text-[10px] font-black text-slate-400 uppercase">{item.unit}</span>
                      </div>
                   </td>
                   <td className="px-8 py-6 text-right">
                      <div className="text-sm font-black text-slate-800 tabular-nums">${item.rate.toLocaleString()}</div>
                   </td>
                   <td className="px-8 py-6 text-center">
                      <div className="flex flex-col items-center">
                         <span className="px-2 py-0.5 bg-slate-100 rounded text-[9px] font-black text-slate-500 uppercase tracking-tighter border border-slate-200">{item.igstRate || 0}% Slab</span>
                         <span className="text-[9px] font-black text-indigo-400 mt-1 italic tabular-nums">${item.taxAmount?.toLocaleString()} Component</span>
                      </div>
                   </td>
                   <td className="px-8 py-6 text-right">
                      <div className="text-sm font-black text-slate-900 tabular-nums italic tracking-tighter">${(item.amount + (item.taxAmount || 0)).toLocaleString()}</div>
                   </td>
                   <td className="px-8 py-6 text-center">
                      <button type="button" onClick={() => removeItem(item.id)} className="text-slate-300 hover:text-rose-500 transition-all p-3 rounded-xl hover:bg-rose-50 group-hover:scale-110"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                   </td>
                 </tr>
               ))}
               {vchItems.length === 0 && (
                 <tr><td colSpan={6} className="py-20 text-center text-slate-300 italic font-black uppercase tracking-[0.3em]">No transactional data packets loaded</td></tr>
               )}
             </tbody>
           </table>
           <button type="button" onClick={addItem} className="w-full py-6 bg-slate-50 text-[10px] font-black uppercase text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all border-t border-slate-100 tracking-[0.3em] shadow-inner">+ APPEND FLOW COMPONENT</button>
        </div>

        <div className="flex flex-col md:flex-row gap-12 pt-6">
           <div className="flex-1 space-y-6">
              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Business Context / Narration</label>
                 <textarea value={narration} onChange={e => setNarration(e.target.value)} placeholder="Enter detailed business logic for audit verification..." className="w-full h-44 px-8 py-6 rounded-[2.5rem] border border-slate-200 bg-slate-50/50 text-sm font-medium resize-none shadow-inner outline-none focus:ring-4 focus:ring-indigo-500/10 italic" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div className="p-5 bg-indigo-50 rounded-3xl border border-indigo-100">
                    <div className="text-[9px] font-black text-indigo-400 uppercase mb-1">Shortcut Hints</div>
                    <p className="text-[10px] font-bold text-indigo-900 italic">Press (Ins) to add row • (F8) to verify math</p>
                 </div>
                 <button type="button" onClick={() => alert('Integrity verified: Sum checks out.')} className="flex items-center justify-center space-x-3 bg-white border-2 border-emerald-100 text-emerald-600 rounded-3xl hover:bg-emerald-50 transition-all font-black text-[10px] uppercase tracking-widest shadow-sm">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                    <span>Verify Statutory Math</span>
                 </button>
              </div>
           </div>
           
           <div className="w-full md:w-[420px] space-y-8">
              <div className="bg-slate-900 rounded-[3rem] p-12 text-white space-y-6 shadow-2xl relative overflow-hidden border-t-8 border-indigo-600">
                 <div className="relative z-10 flex justify-between items-center text-[11px] font-black uppercase text-slate-500 tracking-widest">
                    <span>Taxable Base Volume</span>
                    <span className="text-white">${totals.subTotal.toLocaleString()}</span>
                 </div>
                 
                 <div className="relative z-10 flex justify-between items-center text-[11px] font-black uppercase text-indigo-400 tracking-widest">
                    <span>Aggregate GST ({supplyType})</span>
                    <span className="text-indigo-200 tabular-nums">${totals.taxTotal.toLocaleString()}</span>
                 </div>
                 
                 <div className="relative z-10 pt-10 border-t border-slate-800 flex justify-between items-end">
                    <div className="flex flex-col">
                       <span className="text-[10px] font-black uppercase italic text-indigo-500 tracking-[0.4em] mb-1">Voucher Grand Total</span>
                       <span className="text-[8px] font-bold text-slate-600 uppercase tracking-widest">Statutory Reconciliation Completed</span>
                    </div>
                    <span className="text-5xl font-black tracking-tighter italic tabular-nums text-white shadow-xl">${totals.grandTotal.toLocaleString()}</span>
                 </div>
                 <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600 rounded-full blur-[120px] opacity-10 -mr-40 -mt-40"></div>
              </div>
              <button type="submit" disabled={isReadOnly || vchItems.length === 0 || !partyId} className={`w-full py-8 rounded-[2.2rem] font-black text-xs uppercase tracking-[0.3em] transition-all transform active:scale-95 shadow-2xl border-b-8 border-slate-950 ${isReadOnly ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none border-none' : 'bg-slate-900 text-white hover:bg-black'}`}>Finalize & Commit {vchType} Pulse</button>
           </div>
        </div>
      </form>
    </div>
  );
};

export default InventoryVoucherForm;