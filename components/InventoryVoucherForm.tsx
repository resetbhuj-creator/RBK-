import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Item, Ledger, Voucher, VoucherItem, Adjustment } from '../types';

interface InventoryVoucherFormProps {
  isReadOnly?: boolean;
  items: Item[];
  ledgers: Ledger[];
  onSubmit: (data: Omit<Voucher, 'id' | 'status'>) => void;
  onCancel: () => void;
  getNextId: (type: string) => string;
}

type InvType = 'Sales' | 'Purchase' | 'Delivery Note' | 'Receipt Note' | 'Stock Journal' | 'Purchase Order';

const COMMON_ADJUSTMENTS = ['Freight Charges', 'Insurance', 'Labor', 'Packaging', 'Rounding Off'];

const InventoryVoucherForm: React.FC<InventoryVoucherFormProps> = ({ isReadOnly, items, ledgers, onSubmit, onCancel, getNextId }) => {
  const [vchType, setVchType] = useState<InvType>('Sales');
  const [supplyType, setSupplyType] = useState<'Local' | 'Central'>('Local');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [partyId, setPartyId] = useState('');
  const [reference, setReference] = useState('');
  const [narration, setNarration] = useState('');
  const [vchItems, setVchItems] = useState<VoucherItem[]>([]);
  const [adjustments, setAdjustments] = useState<Adjustment[]>([]);
  
  const [searchIdx, setSearchIdx] = useState<number | null>(null);
  const [query, setQuery] = useState('');
  const searchRef = useRef<HTMLTableDataCellElement>(null);

  const nextIdPreview = useMemo(() => getNextId(vchType), [vchType, getNextId]);

  const isFinancial = vchType === 'Sales' || vchType === 'Purchase' || vchType === 'Purchase Order';
  const isAdjustment = vchType === 'Stock Journal';

  const filteredParties = useMemo(() => {
    if (isAdjustment) return [];
    const group = (vchType === 'Sales' || vchType === 'Delivery Note') ? 'Sundry Debtors' : 'Sundry Creditors';
    return ledgers.filter(l => l.group === group);
  }, [vchType, ledgers, isAdjustment]);

  const searchResults = useMemo(() => {
    if (!query.trim()) return items.slice(0, 8);
    const term = query.toLowerCase();
    return items.filter(i => 
      i.name.toLowerCase().includes(term) || 
      i.hsnCode.includes(term) ||
      i.category.toLowerCase().includes(term)
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
    if (!isFinancial) return;
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
        let taxAmount = isFinancial ? amount * (fullRate / 100) : 0;

        return {
          ...vi,
          itemId: item.id,
          name: item.name,
          hsn: item.hsnCode,
          rate: item.salePrice,
          unit: item.unit,
          amount,
          igstRate: isFinancial ? fullRate : 0,
          cgstRate: isFinancial ? fullRate / 2 : 0,
          sgstRate: isFinancial ? fullRate / 2 : 0,
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
        const taxAmount = isFinancial ? amount * (item.igstRate || 0) / 100 : 0;
        return { ...item, qty, amount, taxAmount };
      }
      return item;
    }));
  };

  const removeItem = (id: string) => setVchItems(prev => prev.filter(i => i.id !== id));

  const totals = useMemo(() => {
    const itemsSubTotal = vchItems.reduce((acc, i) => acc + i.amount, 0);
    const taxTotal = vchItems.reduce((acc, i) => acc + (i.taxAmount || 0), 0);
    const netAfterTax = itemsSubTotal + taxTotal;

    const adjustmentsTotal = adjustments.reduce((acc, a) => {
      return a.type === 'Add' ? acc + a.amount : acc - a.amount;
    }, 0);

    const grandTotal = netAfterTax + adjustmentsTotal;

    return { subTotal: itemsSubTotal, taxTotal, netAfterTax, adjustmentsTotal, grandTotal };
  }, [vchItems, adjustments, isFinancial]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly || vchItems.length === 0 || (!partyId && !isAdjustment)) {
      alert("Validation Error: Please ensure counterparty and items are valid.");
      return;
    }
    
    const partyName = isAdjustment ? 'Internal Stock Movement' : ledgers.find(l => l.id === partyId)?.name || 'Unknown';
    
    onSubmit({
      type: vchType as any,
      date,
      party: partyName,
      amount: totals.grandTotal,
      reference,
      narration,
      items: vchItems,
      adjustments: adjustments,
      subTotal: totals.subTotal,
      taxTotal: totals.taxTotal,
      supplyType,
      gstClassification: (vchType === 'Sales' || vchType === 'Delivery Note') ? 'Output' : 'Input'
    });
  };

  const themeConfig = {
    'Sales': { color: 'emerald', label: 'Sales Invoice', icon: '📤' },
    'Purchase': { color: 'indigo', label: 'Purchase Bill', icon: '📥' },
    'Delivery Note': { color: 'amber', label: 'Delivery Note', icon: '🚚' },
    'Receipt Note': { color: 'sky', label: 'Receipt Note', icon: '📦' },
    'Stock Journal': { color: 'slate', label: 'Stock Journal', icon: '⚖️' },
    'Purchase Order': { color: 'violet', label: 'Purchase Order', icon: '📝' }
  };

  const activeTheme = themeConfig[vchType];

  return (
    <div className="bg-white rounded-[3.5rem] border border-slate-200 shadow-2xl overflow-hidden max-w-7xl mx-auto animate-in zoom-in-95 duration-300">
      {/* Dynamic Header */}
      <div className={`px-10 py-12 bg-${activeTheme.color}-600 text-white flex justify-between items-center transition-all duration-700 relative overflow-hidden`}>
        <div className="flex items-center space-x-8 relative z-10">
          <div className="w-20 h-20 bg-white/20 rounded-[2rem] flex items-center justify-center text-4xl border border-white/10 backdrop-blur-md shadow-2xl transform -rotate-6 group-hover:rotate-0 transition-transform">
            {activeTheme.icon}
          </div>
          <div>
            <div className="flex items-center space-x-5">
              <h3 className="text-4xl font-black uppercase italic tracking-tighter leading-none">{activeTheme.label}</h3>
              <div className="px-5 py-1.5 bg-black/20 rounded-xl border border-white/10 flex items-center space-x-3">
                 <div className={`w-2 h-2 rounded-full bg-emerald-400 animate-pulse`}></div>
                 <span className="text-[11px] font-black uppercase tracking-widest text-emerald-400">Node Seq: {nextIdPreview}</span>
              </div>
            </div>
            <p className="text-xs font-black uppercase tracking-[0.4em] opacity-70 mt-3 italic flex items-center">
               <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
               Sovereign Inventory Stream • Verified Protocol
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-6 relative z-10">
           {!isAdjustment && (
             <div className="flex p-1.5 bg-black/20 rounded-2xl backdrop-blur-md border border-white/10 shadow-lg">
                {(['Local', 'Central'] as const).map(s => (
                  <button key={s} type="button" onClick={() => setSupplyType(s)} className={`px-6 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${supplyType === s ? 'bg-white text-indigo-600 shadow-xl scale-105' : 'text-white/60 hover:text-white'}`}>{s}</button>
                ))}
             </div>
           )}
           <button type="button" onClick={onCancel} className="p-4 hover:bg-white/10 rounded-full transition-all border border-white/10 group"><svg className="w-8 h-8 group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white rounded-full blur-[180px] opacity-10 -mr-64 -mt-64"></div>
      </div>

      <form onSubmit={handleSubmit} className="p-12 space-y-12">
        {/* Type Selector Tabs */}
        <div className="flex bg-slate-100 p-2 rounded-[3rem] border border-slate-200 shadow-inner max-w-5xl mx-auto overflow-x-auto no-scrollbar">
          {(Object.keys(themeConfig) as InvType[]).map(t => (
            <button 
              key={t} 
              type="button" 
              onClick={() => { setVchType(t); setPartyId(''); setVchItems([]); setAdjustments([]); }} 
              className={`flex-1 min-w-[140px] py-4 text-[10px] font-black uppercase tracking-[0.2em] rounded-[2.5rem] transition-all ${vchType === t ? 'bg-white shadow-2xl text-indigo-600 scale-[1.02] border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Core Metadata */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 bg-slate-50 p-10 rounded-[3.5rem] border border-slate-100 shadow-inner">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-[0.2em]">Transaction Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full px-7 py-4 rounded-2xl border border-slate-200 text-sm font-black bg-white outline-none focus:ring-8 focus:ring-indigo-500/5 shadow-sm" />
          </div>
          
          <div className="md:col-span-2 space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-[0.2em]">
              {isAdjustment ? 'Stock Shard Context' : 'Authorized Party Node'}
            </label>
            {isAdjustment ? (
              <div className="px-7 py-4 rounded-2xl border border-slate-200 bg-slate-100 text-sm font-black text-slate-400 italic">
                Internal Movement Logic Active
              </div>
            ) : (
              <select value={partyId} onChange={e => setPartyId(e.target.value)} className="w-full px-7 py-4 rounded-2xl border border-slate-200 text-sm font-black text-indigo-600 bg-white outline-none focus:ring-8 focus:ring-indigo-500/5 shadow-sm appearance-none cursor-pointer">
                <option value="">-- Choose Master Record --</option>
                {filteredParties.map(p => <option key={p.id} value={p.id}>{p.name} [{p.group}]</option>)}
              </select>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-[0.2em]">External Ref Hash</label>
            <input value={reference} onChange={e => setReference(e.target.value)} placeholder="e.g. BILL-922-A" className="w-full px-7 py-4 rounded-2xl border border-slate-200 text-sm font-black bg-white outline-none focus:ring-8 focus:ring-indigo-500/5" />
          </div>
        </div>

        {/* Item Catalogue Matrix */}
        <div className="space-y-6">
           <div className="flex items-center justify-between px-4">
              <div className="flex items-center space-x-4">
                <div className="w-2 h-8 bg-indigo-500 rounded-full"></div>
                <h4 className="text-[13px] font-black uppercase tracking-[0.3em] text-slate-800 italic">I. Product Allocation Shards</h4>
              </div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{vchItems.length} Data Points Staged</div>
           </div>

           <div className="bg-white rounded-[3.5rem] border border-slate-200 overflow-hidden shadow-2xl relative min-h-[300px]">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-900 text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">
                  <tr>
                    <th className="px-10 py-7">Catalogue Item Descriptor</th>
                    <th className="px-10 py-7 text-center w-32">Volume</th>
                    {isFinancial && (
                      <>
                        <th className="px-10 py-7 text-right w-44">Unit Price</th>
                        <th className="px-10 py-7 text-center w-32">GST %</th>
                      </>
                    )}
                    <th className="px-10 py-7 text-right w-56">Resolved Value</th>
                    <th className="px-8 py-7 w-20"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 bg-white">
                  {vchItems.map((item, idx) => (
                    <tr key={item.id} className="animate-in fade-in slide-in-from-left-4 duration-500 group hover:bg-slate-50/50 transition-colors">
                      <td className="px-10 py-6 relative" ref={searchIdx === idx ? searchRef : null}>
                          {searchIdx === idx ? (
                            <div className="absolute top-2 left-6 z-50 w-[420px] bg-white rounded-[2rem] shadow-[0_30px_100px_-12px_rgba(0,0,0,0.25)] border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200">
                                <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center space-x-4">
                                  <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                  <input autoFocus value={query} onChange={e => setQuery(e.target.value)} placeholder="Query Item, HSN or Category..." className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-black outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all" />
                                </div>
                                <div className="max-h-80 overflow-y-auto custom-scrollbar">
                                  {searchResults.map(res => (
                                    <div key={res.id} onClick={() => selectItem(idx, res)} className="p-6 hover:bg-indigo-50 cursor-pointer flex items-center justify-between border-b border-slate-50 last:border-0 group/res">
                                        <div className="flex items-center space-x-4">
                                           <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-xs font-black text-slate-400 group-hover/res:bg-indigo-600 group-hover/res:text-white transition-all">{res.name.charAt(0)}</div>
                                           <div>
                                              <div className="text-[12px] font-black text-slate-800 uppercase tracking-tight italic group-hover/res:text-indigo-700 transition-colors">{res.name}</div>
                                              <div className="flex items-center space-x-2 mt-1">
                                                 <span className="text-[8px] font-black bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded uppercase">HSN: {res.hsnCode}</span>
                                                 <span className="text-[8px] font-black bg-indigo-50 text-indigo-500 px-1.5 py-0.5 rounded uppercase">{res.category}</span>
                                              </div>
                                           </div>
                                        </div>
                                        <div className="text-right">
                                          <div className="text-[11px] font-black text-slate-900 tabular-nums">${res.salePrice.toLocaleString()}</div>
                                          <div className="text-[8px] font-bold text-slate-300 uppercase tracking-widest mt-1">Base Price</div>
                                        </div>
                                    </div>
                                  ))}
                                  {searchResults.length === 0 && (
                                     <div className="p-12 text-center text-slate-300 italic text-sm font-medium uppercase tracking-widest">No catalogue matches</div>
                                  )}
                                </div>
                            </div>
                          ) : (
                            <div onClick={() => setSearchIdx(idx)} className="cursor-pointer group/desc">
                              <div className={`text-base font-black italic tracking-tighter uppercase underline decoration-transparent group-hover/desc:decoration-indigo-200 underline-offset-8 transition-all ${item.name ? 'text-slate-800' : 'text-slate-300'}`}>
                                {item.name || '--- Locate Resource Node ---'}
                              </div>
                              {item.hsn && <div className="text-[9px] font-bold text-slate-400 uppercase mt-2 tracking-widest">HSN: {item.hsn} • {item.unit}</div>}
                            </div>
                          )}
                      </td>
                      <td className="px-10 py-6">
                          <div className="flex flex-col items-center">
                            <input type="number" value={item.qty} onChange={e => updateItemQty(item.id, parseFloat(e.target.value) || 0)} className="w-24 bg-slate-100 border border-slate-200 rounded-xl py-3 px-4 text-center text-sm font-black outline-none focus:ring-4 focus:ring-indigo-500/10 focus:bg-white transition-all shadow-inner" />
                            <span className="text-[9px] font-black text-slate-300 uppercase mt-2 tracking-widest">{item.unit} Unit</span>
                          </div>
                      </td>
                      {isFinancial && (
                        <>
                          <td className="px-10 py-6 text-right font-black text-slate-700 tabular-nums text-sm italic underline decoration-slate-100 underline-offset-4">${item.rate.toLocaleString()}</td>
                          <td className="px-10 py-6 text-center">
                              <span className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black border border-indigo-100 shadow-sm">{item.igstRate}%</span>
                          </td>
                        </>
                      )}
                      <td className="px-10 py-6 text-right">
                          <div className="text-lg font-black text-slate-900 tabular-nums italic tracking-tighter">
                            ${(isFinancial ? (item.amount + (item.taxAmount || 0)) : item.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </div>
                          {isFinancial && <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Net Valuation</div>}
                      </td>
                      <td className="px-8 py-6 text-center">
                          <button type="button" onClick={() => removeItem(item.id)} className="text-slate-200 hover:text-rose-600 transition-all p-3 rounded-2xl hover:bg-rose-50 transform hover:scale-110"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                      </td>
                    </tr>
                  ))}
                  {vchItems.length === 0 && (
                    <tr>
                      <td colSpan={isFinancial ? 6 : 4} className="py-32 text-center">
                         <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-slate-100 shadow-inner">
                            <svg className="w-10 h-10 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                         </div>
                         <h5 className="text-sm font-black uppercase text-slate-300 tracking-[0.4em] italic">Catalogue Buffer Empty</h5>
                         <p className="text-[10px] font-bold text-slate-400 uppercase mt-2">Append items to begin verification</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              <button type="button" onClick={addItem} className="w-full py-6 bg-slate-50 text-[11px] font-black uppercase text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all border-t border-slate-100 tracking-[0.4em] shadow-inner">+ APPEND PRODUCT SHARD</button>
           </div>
        </div>

        {/* Adjustments Section (Financial Only) */}
        {isFinancial && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center space-x-4 px-4">
              <div className="w-2 h-8 bg-emerald-500 rounded-full"></div>
              <h4 className="text-[13px] font-black uppercase tracking-[0.3em] text-slate-800 italic">II. Fiscal Adjustments (Post-Tax)</h4>
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                <div className="bg-slate-50 rounded-[3rem] border border-slate-200 overflow-hidden shadow-inner">
                    <table className="w-full text-left">
                       <thead className="bg-slate-100 text-[10px] font-black uppercase text-slate-500 tracking-widest">
                          <tr>
                             <th className="px-10 py-5">Adjustment Node</th>
                             <th className="px-10 py-5 text-center">Protocol</th>
                             <th className="px-10 py-5 text-right">Debit ($)</th>
                             <th className="px-10 py-5"></th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-200">
                          {adjustments.map(adj => (
                            <tr key={adj.id} className="animate-in fade-in duration-300 group">
                               <td className="px-10 py-5">
                                  <input 
                                    value={adj.label} 
                                    onChange={e => updateAdjustment(adj.id, 'label', e.target.value)} 
                                    placeholder="Adjustment Ledger..." 
                                    className="bg-transparent border-none text-[12px] font-black text-slate-800 italic uppercase outline-none w-full group-hover:bg-white transition-colors" 
                                  />
                               </td>
                               <td className="px-10 py-5 text-center">
                                  <button 
                                    type="button" 
                                    onClick={() => updateAdjustment(adj.id, 'type', adj.type === 'Add' ? 'Less' : 'Add')}
                                    className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-tighter transition-all shadow-md ${adj.type === 'Add' ? 'bg-emerald-600 text-white shadow-emerald-900/20' : 'bg-rose-600 text-white shadow-rose-900/20'}`}
                                  >
                                    {adj.type === 'Add' ? 'Add (+)' : 'Less (-)'}
                                  </button>
                               </td>
                               <td className="px-10 py-5 text-right">
                                  <input 
                                    type="number" 
                                    value={adj.amount || ''} 
                                    onChange={e => updateAdjustment(adj.id, 'amount', parseFloat(e.target.value) || 0)} 
                                    className="bg-transparent border-none text-[12px] font-black text-slate-900 text-right outline-none w-32 tabular-nums group-hover:bg-white transition-colors" 
                                  />
                               </td>
                               <td className="px-10 py-5 text-center">
                                  <button type="button" onClick={() => removeAdjustment(adj.id)} className="text-slate-300 hover:text-rose-600 transition-all transform hover:scale-125"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                               </td>
                            </tr>
                          ))}
                       </tbody>
                    </table>
                    <button type="button" onClick={() => addAdjustment()} className="w-full py-5 bg-white/50 text-[10px] font-black uppercase text-indigo-500 hover:bg-white hover:text-indigo-600 transition-all border-t border-slate-200 tracking-[0.4em] shadow-inner">+ CUSTOM FISCAL OVERRIDE</button>
                </div>

                <div className="bg-white rounded-[3rem] p-10 border border-slate-200 shadow-sm relative overflow-hidden group/presets">
                   <h5 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-8 flex items-center">
                      <svg className="w-4 h-4 mr-3 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                      Institutional Preset Blocks
                   </h5>
                   <div className="flex flex-wrap gap-4 relative z-10">
                      {COMMON_ADJUSTMENTS.map(label => (
                         <button key={label} type="button" onClick={() => addAdjustment(label)} className="px-6 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-[10px] font-black uppercase text-slate-500 hover:border-indigo-500 hover:text-indigo-600 hover:shadow-2xl transition-all active:scale-95 shadow-sm transform hover:-translate-y-0.5">{label}</button>
                      ))}
                   </div>
                   <div className="mt-10 p-8 bg-indigo-50 rounded-[2.5rem] border border-indigo-100 flex items-start space-x-6 relative z-10">
                      <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-3xl shadow-xl border border-indigo-50 shrink-0">💡</div>
                      <div>
                        <h6 className="text-[11px] font-black uppercase text-indigo-900 mb-1 tracking-widest">Regulatory Policy Hint</h6>
                        <p className="text-[11px] text-indigo-700/70 font-medium leading-relaxed italic">"Financial adjustments define the delta between the statutory tax liability and the final settlement value. Use 'Less' for trade discounts and 'Add' for freight."</p>
                      </div>
                   </div>
                   <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-600 rounded-full blur-[80px] opacity-0 group-hover/presets:opacity-5 transition-opacity"></div>
                </div>
            </div>
          </div>
        )}

        {/* Narrative & Resolution Section */}
        <div className="flex flex-col xl:flex-row gap-12 pt-8 border-t border-slate-100">
           <div className="flex-1 space-y-4">
              <label className="text-[11px] font-black uppercase text-slate-400 ml-4 tracking-[0.4em]">Audit Narrative & Context</label>
              <textarea value={narration} onChange={e => setNarration(e.target.value)} placeholder="Record organizational context for this movement..." className="w-full h-48 px-10 py-8 rounded-[3.5rem] border border-slate-200 bg-slate-50/50 text-sm font-medium resize-none shadow-inner outline-none focus:ring-8 focus:ring-indigo-500/5 italic leading-relaxed" />
           </div>
           
           <div className="w-full xl:w-[460px] space-y-8">
              <div className="bg-slate-900 rounded-[3.5rem] p-12 text-white space-y-6 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.4)] relative overflow-hidden border-b-8 border-indigo-600">
                 <div className="relative z-10 space-y-6">
                    <div className="flex justify-between items-center text-[12px] font-black uppercase text-slate-500 tracking-widest">
                       <span>Physical Shard Value</span>
                       <span className="text-white tabular-nums">${totals.subTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>

                    {isFinancial && (
                      <div className="flex justify-between items-center text-[12px] font-black uppercase text-indigo-400 tracking-widest">
                         <span>Statutory GST Aggregate</span>
                         <span className="text-indigo-200 tabular-nums">${totals.taxTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                    )}
                    
                    <div className="pt-6 border-t border-slate-800 flex justify-between items-center text-[12px] font-black uppercase text-slate-500 tracking-widest">
                       <span>Combined Ledger Value</span>
                       <span className="text-white tabular-nums">${totals.netAfterTax.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>

                    {isFinancial && (
                      <div className="flex justify-between items-center text-[12px] font-black uppercase tracking-widest">
                         <span className="text-amber-500 italic">Institutional Adjustments</span>
                         <span className={`tabular-nums ${totals.adjustmentsTotal >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                           {totals.adjustmentsTotal >= 0 ? '+' : '-'}${Math.abs(totals.adjustmentsTotal).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                         </span>
                      </div>
                    )}
                    
                    <div className="pt-12 border-t border-slate-800 flex justify-between items-end">
                       <div className="flex flex-col">
                          <span className="text-[11px] font-black uppercase italic text-indigo-500 tracking-[0.5em] mb-2">Grand Total</span>
                          <span className="text-[8px] font-bold text-slate-600 uppercase tracking-[0.2em] animate-pulse">Integrity Pass Verified</span>
                       </div>
                       <span className="text-6xl font-black tracking-tighter italic tabular-nums text-white drop-shadow-2xl">${totals.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                 </div>
                 <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600 rounded-full blur-[200px] opacity-10 -mr-64 -mt-64 pointer-events-none"></div>
              </div>
              
              <button 
                type="submit" 
                disabled={isReadOnly || vchItems.length === 0 || (!partyId && !isAdjustment)} 
                className={`w-full py-8 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.4em] transition-all transform active:scale-95 shadow-2xl border-b-8 border-slate-950 ${isReadOnly ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none border-none' : 'bg-slate-900 text-white hover:bg-black group'}`}
              >
                 <span className="group-hover:scale-110 transition-transform block">Authorize Resource Transmission</span>
              </button>
           </div>
        </div>
      </form>
    </div>
  );
};

export default InventoryVoucherForm;