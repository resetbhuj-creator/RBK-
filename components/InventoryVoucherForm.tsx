import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Item, Ledger, Voucher, VoucherItem, Adjustment } from '../types';

interface InventoryVoucherFormProps {
  isReadOnly?: boolean;
  items: Item[];
  ledgers: Ledger[];
  onSubmit: (data: Omit<Voucher, 'id' | 'status'>) => void;
  onCancel: () => void;
}

const COMMON_ADJUSTMENTS = ['Freight Charges', 'Insurance', 'Trade Discount', 'Packaging Charges', 'Rounding Off'];

const InventoryVoucherForm: React.FC<InventoryVoucherFormProps> = ({ isReadOnly, items, ledgers, onSubmit, onCancel }) => {
  const [vchType, setVchType] = useState<'Sales' | 'Purchase'>('Sales');
  const [supplyType, setSupplyType] = useState<'Local' | 'Central'>('Local');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [partyId, setPartyId] = useState('');
  const [reference, setReference] = useState('');
  const [narration, setNarration] = useState('');
  const [vchItems, setVchItems] = useState<VoucherItem[]>([]);
  const [adjustments, setAdjustments] = useState<Adjustment[]>([]);
  
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
    setSearchIdx(vchItems.length);
    setQuery('');
  };

  const addAdjustment = (label: string = '') => {
    const newAdj: Adjustment = {
      id: `adj-${Date.now()}`,
      label,
      type: 'Add',
      amount: 0
    };
    setAdjustments(prev => [...prev, newAdj]);
  };

  const updateAdjustment = (id: string, field: keyof Adjustment, value: any) => {
    setAdjustments(prev => prev.map(adj => adj.id === id ? { ...adj, [field]: value } : adj));
  };

  const removeAdjustment = (id: string) => setAdjustments(prev => prev.filter(a => a.id !== id));

  const selectItem = (idx: number, item: Item) => {
    setVchItems(prev => prev.map((vi, i) => {
      if (i === idx) {
        const fullRate = item.gstRate || 18;
        const amount = vi.qty * item.salePrice;
        let taxAmount = amount * (fullRate / 100);

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
    const itemsSubTotal = vchItems.reduce((acc, i) => acc + i.amount, 0);
    const adjustmentsTotal = adjustments.reduce((acc, a) => {
      return a.type === 'Add' ? acc + a.amount : acc - a.amount;
    }, 0);
    const taxTotal = vchItems.reduce((acc, i) => acc + (i.taxAmount || 0), 0);
    const grandTotal = itemsSubTotal + adjustmentsTotal + taxTotal;
    return { subTotal: itemsSubTotal, adjustmentsTotal, taxTotal, grandTotal };
  }, [vchItems, adjustments]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly || vchItems.length === 0 || !partyId) {
      alert("Validation Error: Counterparty node and line items are required.");
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
      adjustments: adjustments,
      subTotal: totals.subTotal,
      taxTotal: totals.taxTotal,
      supplyType,
      gstClassification: vchType === 'Sales' ? 'Output' : 'Input'
    });
  };

  return (
    <div className="bg-white rounded-[3rem] border border-slate-200 shadow-2xl overflow-hidden max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className={`px-10 py-10 ${vchType === 'Sales' ? 'bg-emerald-600' : 'bg-indigo-600'} text-white flex justify-between items-center transition-colors duration-500 relative`}>
        <div className="flex items-center space-x-6 relative z-10">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-4xl border border-white/10 backdrop-blur-md shadow-inner transform -rotate-3">
            {vchType === 'Sales' ? '📤' : '📥'}
          </div>
          <div>
            <h3 className="text-3xl font-black uppercase italic tracking-tighter leading-none">{vchType === 'Sales' ? 'Outward' : 'Inward'} Supply Invoice</h3>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-80 mt-2 italic">Nexus Statutory Engine v5.0 • {supplyType} Jurisdiction</p>
          </div>
        </div>
        <div className="flex items-center space-x-6 relative z-10">
           <div className="flex p-1.5 bg-black/20 rounded-2xl backdrop-blur-md border border-white/10 shadow-lg">
              {(['Local', 'Central'] as const).map(s => (
                <button key={s} type="button" onClick={() => setSupplyType(s)} className={`px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${supplyType === s ? 'bg-white text-indigo-600 shadow-xl scale-105' : 'text-white/60 hover:text-white'}`}>{s}</button>
              ))}
           </div>
           <button type="button" onClick={onCancel} className="p-3 hover:bg-white/10 rounded-full transition-all border border-white/10"><svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-[120px] opacity-10 -mr-48 -mt-48"></div>
      </div>

      <form onSubmit={handleSubmit} className="p-10 space-y-8">
        <div className="flex bg-slate-100 p-1.5 rounded-[2.5rem] border border-slate-200 shadow-inner">
          {(['Sales', 'Purchase'] as const).map(t => (
            <button key={t} type="button" onClick={() => { setVchType(t); setPartyId(''); }} className={`flex-1 py-4 text-[11px] font-black uppercase tracking-[0.2em] rounded-[2rem] transition-all ${vchType === t ? 'bg-white shadow-xl text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}>{t === 'Sales' ? 'Outward Invoice' : 'Inward Purchase'}</button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Invoicing Period</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full px-6 py-3 rounded-2xl border border-slate-200 text-sm font-bold bg-slate-50 outline-none focus:ring-4 focus:ring-indigo-500/10 shadow-inner" />
          </div>
          <div className="md:col-span-2 space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Authorized Party Node</label>
            <select value={partyId} onChange={e => setPartyId(e.target.value)} className="w-full px-6 py-3 rounded-2xl border border-slate-200 text-sm font-black text-indigo-600 bg-white outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all">
              <option value="">-- Choose Master Ledger --</option>
              {filteredParties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Voucher HASH / Ref</label>
            <input value={reference} onChange={e => setReference(e.target.value)} placeholder="e.g. INV-2024-001" className="w-full px-6 py-3 rounded-2xl border border-slate-200 text-sm font-bold bg-slate-50 outline-none focus:ring-4 focus:ring-indigo-500/10" />
          </div>
        </div>

        {/* Inventory Section */}
        <div className="space-y-4">
           <div className="flex items-center space-x-3 text-slate-400">
              <div className="w-1.5 h-6 bg-slate-200 rounded-full"></div>
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em]">I. Catalog Items</h4>
           </div>
           <div className="bg-white rounded-[2.5rem] border-2 border-slate-100 overflow-hidden shadow-xl">
              <table className="w-full text-left">
                <thead className="bg-slate-900 text-[9px] font-black uppercase text-slate-400">
                  <tr>
                    <th className="px-8 py-5">Product Descriptor</th>
                    <th className="px-8 py-5 text-center">Volume</th>
                    <th className="px-8 py-5 text-right">Rate</th>
                    <th className="px-8 py-5 text-center">Tax Math</th>
                    <th className="px-8 py-5 text-right">Net Value</th>
                    <th className="px-8 py-5 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 bg-white">
                  {vchItems.map((item, idx) => (
                    <tr key={item.id} className="animate-in fade-in slide-in-from-left-2 duration-300 group">
                      <td className="px-8 py-5 relative" ref={searchIdx === idx ? searchRef : null}>
                          {searchIdx === idx ? (
                            <div className="absolute top-2 left-4 z-50 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
                                <div className="p-3 border-b border-slate-100 bg-slate-50">
                                  <input autoFocus value={query} onChange={e => setQuery(e.target.value)} placeholder="Search Item / HSN..." className="w-full bg-white border-none rounded-xl px-4 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500" />
                                </div>
                                <div className="max-h-60 overflow-y-auto custom-scrollbar">
                                  {searchResults.map(res => (
                                    <div key={res.id} onClick={() => selectItem(idx, res)} className="p-4 hover:bg-indigo-50 cursor-pointer flex items-center justify-between border-b border-slate-50 last:border-0">
                                        <div>
                                          <div className="text-[11px] font-black text-slate-800 uppercase tracking-tight">{res.name}</div>
                                          <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">HSN: {res.hsnCode}</div>
                                        </div>
                                        <div className="text-right">
                                          <div className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">Stocked</div>
                                          <div className="text-[8px] font-bold text-slate-400 uppercase mt-1">Rate: ${res.salePrice}</div>
                                        </div>
                                    </div>
                                  ))}
                                </div>
                            </div>
                          ) : (
                            <div onClick={() => setSearchIdx(idx)} className="cursor-pointer">
                              <div className={`text-sm font-black italic tracking-tight ${item.name ? 'text-indigo-600' : 'text-slate-300'}`}>
                                {item.name || '--- Choose Item ---'}
                              </div>
                            </div>
                          )}
                      </td>
                      <td className="px-8 py-5">
                          <div className="flex items-center justify-center space-x-2">
                            <input type="number" value={item.qty} onChange={e => updateItemQty(item.id, parseFloat(e.target.value) || 0)} className="w-16 bg-slate-50 border border-slate-100 rounded-xl py-1.5 px-3 text-center text-xs font-black outline-none focus:ring-2 focus:ring-indigo-500" />
                          </div>
                      </td>
                      <td className="px-8 py-5 text-right font-black text-slate-800 tabular-nums">${item.rate.toLocaleString()}</td>
                      <td className="px-8 py-5 text-center">
                          <span className="px-2 py-0.5 bg-slate-100 rounded text-[9px] font-black text-slate-500 uppercase tracking-tighter border border-slate-200">{item.igstRate}%</span>
                      </td>
                      <td className="px-8 py-5 text-right font-black text-slate-900 tabular-nums italic tracking-tighter">${(item.amount + (item.taxAmount || 0)).toLocaleString()}</td>
                      <td className="px-8 py-5 text-center">
                          <button type="button" onClick={() => removeItem(item.id)} className="text-slate-200 hover:text-rose-500 transition-all p-2 rounded-lg hover:bg-rose-50"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button type="button" onClick={addItem} className="w-full py-4 bg-slate-50 text-[10px] font-black uppercase text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all border-t border-slate-100 tracking-[0.3em]">+ APPEND PRODUCT PACKET</button>
           </div>
        </div>

        {/* Adjustments Section */}
        <div className="space-y-4">
           <div className="flex items-center space-x-3 text-slate-400">
              <div className="w-1.5 h-6 bg-slate-200 rounded-full"></div>
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em]">II. Financial Add / Less</h4>
           </div>
           <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              <div className="space-y-4">
                 <div className="bg-slate-50 rounded-[2rem] border border-slate-200 overflow-hidden shadow-inner">
                    <table className="w-full text-left">
                       <thead className="bg-slate-100 text-[8px] font-black uppercase text-slate-500">
                          <tr>
                             <th className="px-6 py-3">Adjustment Ledger</th>
                             <th className="px-6 py-3 text-center">Protocol</th>
                             <th className="px-6 py-3 text-right">Value</th>
                             <th className="px-6 py-3"></th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-200">
                          {adjustments.map(adj => (
                            <tr key={adj.id} className="animate-in fade-in duration-300">
                               <td className="px-6 py-3">
                                  <input 
                                    value={adj.label} 
                                    onChange={e => updateAdjustment(adj.id, 'label', e.target.value)} 
                                    placeholder="e.g. Freight Charges" 
                                    className="bg-transparent border-none text-[11px] font-black text-slate-700 outline-none w-full" 
                                  />
                               </td>
                               <td className="px-6 py-3 text-center">
                                  <button 
                                    type="button" 
                                    onClick={() => updateAdjustment(adj.id, 'type', adj.type === 'Add' ? 'Less' : 'Add')}
                                    className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-tighter transition-all ${adj.type === 'Add' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-900/20' : 'bg-rose-500 text-white shadow-lg shadow-rose-900/20'}`}
                                  >
                                    {adj.type === 'Add' ? 'Add (+)' : 'Less (-)'}
                                  </button>
                               </td>
                               <td className="px-6 py-3 text-right">
                                  <input 
                                    type="number" 
                                    value={adj.amount} 
                                    onChange={e => updateAdjustment(adj.id, 'amount', parseFloat(e.target.value) || 0)} 
                                    className="bg-transparent border-none text-[11px] font-black text-slate-900 text-right outline-none w-24" 
                                  />
                               </td>
                               <td className="px-6 py-3 text-center">
                                  <button type="button" onClick={() => removeAdjustment(adj.id)} className="text-slate-300 hover:text-rose-500 transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                               </td>
                            </tr>
                          ))}
                          {adjustments.length === 0 && (
                            <tr><td colSpan={4} className="py-12 text-center text-[10px] font-black text-slate-300 uppercase tracking-widest italic">Zero global adjustments</td></tr>
                          )}
                       </tbody>
                    </table>
                    <button type="button" onClick={() => addAdjustment()} className="w-full py-4 bg-white/50 text-[10px] font-black uppercase text-indigo-400 hover:bg-white hover:text-indigo-600 transition-all border-t border-slate-200">+ APPEND CUSTOM ADJUSTMENT</button>
                 </div>
              </div>

              <div className="bg-slate-50 rounded-[2.5rem] p-8 border border-slate-200">
                 <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    Institutional Presets
                 </h5>
                 <div className="flex flex-wrap gap-3">
                    {COMMON_ADJUSTMENTS.map(label => (
                       <button key={label} type="button" onClick={() => addAdjustment(label)} className="px-5 py-2.5 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase text-slate-500 hover:border-indigo-600 hover:text-indigo-600 hover:shadow-xl transition-all active:scale-95 shadow-sm">{label}</button>
                    ))}
                 </div>
                 <div className="mt-8 p-6 bg-white rounded-3xl border border-slate-100 flex items-start space-x-4">
                    <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shadow-inner">💡</div>
                    <p className="text-[10px] text-slate-400 font-medium leading-relaxed italic">"Financial adjustments allow you to account for overhead costs or rebates without affecting master stock valuation logic."</p>
                 </div>
              </div>
           </div>
        </div>

        <div className="flex flex-col md:flex-row gap-12 pt-6">
           <div className="flex-1 space-y-6">
              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Business Context / Narration</label>
                 <textarea value={narration} onChange={e => setNarration(e.target.value)} placeholder="Enter detailed business logic for audit verification..." className="w-full h-44 px-8 py-6 rounded-[2.5rem] border border-slate-200 bg-slate-50/50 text-sm font-medium resize-none shadow-inner outline-none focus:ring-4 focus:ring-indigo-500/10 italic" />
              </div>
           </div>
           
           <div className="w-full md:w-[420px] space-y-6">
              <div className="bg-slate-900 rounded-[3rem] p-12 text-white space-y-5 shadow-2xl relative overflow-hidden border-t-8 border-indigo-600">
                 <div className="relative z-10 flex justify-between items-center text-[11px] font-black uppercase text-slate-500 tracking-widest">
                    <span>Taxable Base</span>
                    <span className="text-white tabular-nums">${totals.subTotal.toLocaleString()}</span>
                 </div>
                 
                 <div className="relative z-10 flex justify-between items-center text-[11px] font-black uppercase tracking-widest">
                    <span className="text-indigo-400">Add / Less Sum</span>
                    <span className={`tabular-nums ${totals.adjustmentsTotal >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {totals.adjustmentsTotal >= 0 ? '+' : '-'}${Math.abs(totals.adjustmentsTotal).toLocaleString()}
                    </span>
                 </div>

                 <div className="relative z-10 flex justify-between items-center text-[11px] font-black uppercase text-indigo-400 tracking-widest">
                    <span>Statutory GST Total</span>
                    <span className="text-indigo-200 tabular-nums">${totals.taxTotal.toLocaleString()}</span>
                 </div>
                 
                 <div className="relative z-10 pt-10 border-t border-slate-800 flex justify-between items-end">
                    <div className="flex flex-col">
                       <span className="text-[10px] font-black uppercase italic text-indigo-500 tracking-[0.4em] mb-1">Grand Total</span>
                       <span className="text-[8px] font-bold text-slate-600 uppercase tracking-widest">Reconciliation Verified ✓</span>
                    </div>
                    <span className="text-5xl font-black tracking-tighter italic tabular-nums text-white">${totals.grandTotal.toLocaleString()}</span>
                 </div>
                 <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600 rounded-full blur-[150px] opacity-10 -mr-40 -mt-40 pointer-events-none"></div>
              </div>
              <button type="submit" disabled={isReadOnly || vchItems.length === 0 || !partyId} className={`w-full py-8 rounded-[2.2rem] font-black text-xs uppercase tracking-[0.3em] transition-all transform active:scale-95 shadow-2xl border-b-8 border-slate-950 ${isReadOnly ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none border-none' : 'bg-slate-900 text-white hover:bg-black'}`}>Initialize Transaction Stream</button>
           </div>
        </div>
      </form>
    </div>
  );
};

export default InventoryVoucherForm;