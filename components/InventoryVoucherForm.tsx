import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Item, Ledger, Voucher, VoucherItem, Adjustment, VoucherType, Batch } from '../types';

interface InventoryVoucherFormProps {
  isReadOnly?: boolean;
  items: Item[];
  batches: Batch[];
  ledgers: Ledger[];
  onSubmit: (data: Omit<Voucher, 'id' | 'status'>) => void;
  onCancel: () => void;
  getNextId: (type: string) => string;
  activeCompany?: any;
}

type InvType = Extract<VoucherType, 'Sales' | 'Purchase' | 'Sales Return' | 'Purchase Return' | 'Purchase Order' | 'Delivery Note' | 'Goods Receipt Note (GRN)' | 'Stock Adjustment'>;

const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' }
];

const InventoryVoucherForm: React.FC<InventoryVoucherFormProps> = ({ isReadOnly, items, batches, ledgers, onSubmit, onCancel, getNextId, activeCompany }) => {
  const [vchType, setVchType] = useState<InvType>('Sales');
  const [supplyType, setSupplyType] = useState<'Local' | 'Central'>('Local');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [partyId, setPartyId] = useState('');
  const [reference, setReference] = useState('');
  const [narration, setNarration] = useState('');
  const [vchItems, setVchItems] = useState<VoucherItem[]>([]);
  const [adjustments, setAdjustments] = useState<Adjustment[]>([]);
  
  const [currency, setCurrency] = useState(activeCompany?.currencyConfig?.code || 'USD');
  const [exchangeRate, setExchangeRate] = useState(1);

  const [searchIdx, setSearchIdx] = useState<number | null>(null);
  const [query, setQuery] = useState('');
  const searchRef = useRef<HTMLTableDataCellElement>(null);

  const baseCurrencyCode = activeCompany?.currencyConfig?.code || 'USD';
  const isForeignCurrency = currency !== baseCurrencyCode;

  const nextIdPreview = useMemo(() => getNextId(vchType), [vchType, getNextId]);

  const isSales = vchType === 'Sales' || vchType === 'Sales Return' || vchType === 'Delivery Note';
  const isFinancial = ['Sales', 'Purchase', 'Purchase Order', 'Sales Return', 'Purchase Return'].includes(vchType);

  const filteredParties = useMemo(() => {
    const group = isSales ? 'Sundry Debtors' : 'Sundry Creditors';
    return ledgers.filter(l => l.group === group);
  }, [isSales, ledgers]);

  const searchResults = useMemo(() => {
    const term = query.toLowerCase();
    return items.filter(i => 
      i.name.toLowerCase().includes(term) || 
      i.hsnCode.includes(term) ||
      i.category.toLowerCase().includes(term)
    ).slice(0, 8);
  }, [items, query]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchIdx(null);
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
      discountRate: 0,
      discountAmount: 0,
      amount: 0,
      igstRate: 0,
      taxAmount: 0,
      batchNo: ''
    };
    setVchItems(prev => [...prev, newItem]);
    setSearchIdx(vchItems.length);
    setQuery('');
  };

  const selectItem = (idx: number, item: Item) => {
    setVchItems(prev => prev.map((vi, i) => {
      if (i === idx) {
        const fullRate = item.gstRate || 0;
        const gross = vi.qty * item.salePrice;
        return {
          ...vi,
          itemId: item.id,
          name: item.name,
          hsn: item.hsnCode,
          rate: item.salePrice,
          unit: item.unit,
          amount: gross,
          igstRate: fullRate,
          taxAmount: gross * (fullRate / 100),
          batchNo: '' // Reset batch on item change
        };
      }
      return vi;
    }));
    setSearchIdx(null);
  };

  const updateItemField = (id: string, field: keyof VoucherItem, value: any) => {
    setVchItems(prev => prev.map(item => {
      if (item.id === id) {
        let updated = { ...item, [field]: value };
        
        // Recalculate logic chain: Gross -> Discount -> Taxable -> Tax -> Net
        const gross = updated.qty * updated.rate;
        if (field === 'discountRate') {
          updated.discountAmount = (gross * (updated.discountRate || 0)) / 100;
        } else if (field === 'discountAmount') {
          updated.discountRate = gross > 0 ? (updated.discountAmount! / gross) * 100 : 0;
        }
        
        updated.amount = gross - (updated.discountAmount || 0);
        if (isFinancial) {
          updated.taxAmount = (updated.amount * (updated.igstRate || 0)) / 100;
        }
        
        return updated;
      }
      return item;
    }));
  };

  const totals = useMemo(() => {
    const subTotal = vchItems.reduce((acc, i) => acc + (i.qty * i.rate), 0);
    const discTotal = vchItems.reduce((acc, i) => acc + (i.discountAmount || 0), 0);
    const taxableTotal = vchItems.reduce((acc, i) => acc + i.amount, 0);
    const taxTotal = vchItems.reduce((acc, i) => acc + (i.taxAmount || 0), 0);

    const adjTotal = adjustments.reduce((acc, a) => a.type === 'Add' ? acc + a.amount : acc - a.amount, 0);
    const grandTotal = taxableTotal + taxTotal + adjTotal;

    return { subTotal, discTotal, taxableTotal, taxTotal, grandTotal };
  }, [vchItems, adjustments]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly || vchItems.length === 0 || !partyId) {
      alert("Verification Failed: Valid party and items required.");
      return;
    }
    
    onSubmit({
      type: vchType,
      date,
      party: ledgers.find(l => l.id === partyId)?.name || 'Unknown',
      amount: totals.grandTotal,
      currency,
      exchangeRate,
      reference,
      narration,
      items: vchItems,
      adjustments: adjustments,
      subTotal: totals.subTotal,
      discountTotal: totals.discTotal,
      taxTotal: totals.taxTotal,
      supplyType
    });
  };

  const activeColor = isSales ? 'emerald' : 'indigo';

  return (
    <div className="bg-white rounded-[3.5rem] border border-slate-200 shadow-2xl overflow-hidden max-w-7xl mx-auto animate-in zoom-in-95 duration-300">
      <div className={`px-10 py-12 bg-${activeColor}-600 text-white flex justify-between items-center relative overflow-hidden`}>
        <div className="flex items-center space-x-8 relative z-10">
          <div className="w-20 h-20 bg-white/20 rounded-[2rem] flex items-center justify-center text-4xl border border-white/10 backdrop-blur-md shadow-2xl transform -rotate-6">
            {isSales ? '📤' : '📥'}
          </div>
          <div>
            <div className="flex items-center space-x-5">
              <h3 className="text-4xl font-black uppercase italic tracking-tighter leading-none">{vchType} Protocol</h3>
              <div className="px-5 py-1.5 bg-black/20 rounded-xl border border-white/10 flex items-center space-x-3">
                 <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                 <span className="text-[11px] font-black uppercase tracking-widest text-emerald-400">NODE: {nextIdPreview}</span>
              </div>
            </div>
            <p className="text-xs font-black uppercase tracking-[0.4em] opacity-70 mt-3 italic">Inventory Lifecycle Hub</p>
          </div>
        </div>
        <div className="flex items-center space-x-6 relative z-10">
           <div className="bg-white/10 p-4 rounded-3xl backdrop-blur-xl border border-white/10 flex items-center space-x-6 text-white">
              <div className="space-y-1">
                 <label className="text-[8px] font-black uppercase text-white/60">Currency</label>
                 <select value={currency} onChange={e => setCurrency(e.target.value)} className="bg-transparent border-none text-sm font-black outline-none">
                   {CURRENCIES.map(c => <option key={c.code} value={c.code} className="bg-slate-900">{c.code}</option>)}
                 </select>
              </div>
              {isForeignCurrency && (
                <div className="space-y-1 border-l border-white/10 pl-6">
                   <label className="text-[8px] font-black uppercase text-white/60">Exch Rate</label>
                   <input type="number" step="0.0001" value={exchangeRate} onChange={e => setExchangeRate(parseFloat(e.target.value) || 1)} className="bg-transparent border-none text-sm font-black outline-none w-20" />
                </div>
              )}
           </div>
        </div>
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white rounded-full blur-[180px] opacity-10 -mr-64 -mt-64"></div>
      </div>

      <form onSubmit={handleSubmit} className="p-12 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 bg-slate-50 p-10 rounded-[3.5rem] border border-slate-100 shadow-inner">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Post Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full px-7 py-4 rounded-2xl border border-slate-200 text-sm font-black bg-white outline-none focus:ring-8 focus:ring-indigo-500/5 shadow-sm" />
          </div>
          <div className="md:col-span-2 space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Authorized Party Node</label>
            <select value={partyId} onChange={e => setPartyId(e.target.value)} className="w-full px-7 py-4 rounded-2xl border border-slate-200 text-sm font-black text-indigo-600 bg-white outline-none focus:ring-8 focus:ring-indigo-500/5 shadow-sm">
              <option value="">-- Choose Master Ledger --</option>
              {filteredParties.map(p => <option key={p.id} value={p.id}>{p.name} [{p.group}]</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Ref Document</label>
            <input value={reference} onChange={e => setReference(e.target.value)} placeholder="PO / GRN Hash" className="w-full px-7 py-4 rounded-2xl border border-slate-200 text-sm font-black bg-white outline-none" />
          </div>
        </div>

        <div className="bg-white rounded-[3.5rem] border border-slate-200 overflow-hidden shadow-2xl min-h-[300px]">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-900 text-[9px] font-black uppercase text-slate-400 tracking-widest">
              <tr>
                <th className="px-8 py-7 w-64">Product Resource</th>
                <th className="px-6 py-7 text-center w-32">Batch No</th>
                <th className="px-6 py-7 text-center w-24">Qty</th>
                <th className="px-6 py-7 text-right w-32">Rate</th>
                <th className="px-6 py-7 text-center w-24 bg-indigo-950/30">Disc%</th>
                <th className="px-6 py-7 text-center w-24 bg-indigo-950/30">Tax%</th>
                <th className="px-6 py-7 text-right w-44">Net Value ({currency})</th>
                <th className="px-6 py-7 w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 bg-white">
              {vchItems.map((item, idx) => {
                const master = items.find(i => i.id === item.itemId);
                const itemBatches = batches.filter(b => b.itemId === item.itemId);
                const margin = master?.costPrice ? ((item.rate - master.costPrice) / item.rate) * 100 : null;
                
                return (
                  <tr key={item.id} className="animate-in fade-in transition-colors group hover:bg-slate-50/50">
                    <td className="px-8 py-6 relative" ref={searchIdx === idx ? searchRef : null}>
                        {searchIdx === idx ? (
                          <div className="absolute top-2 left-6 z-50 w-[460px] bg-white rounded-[2.5rem] shadow-2xl border border-slate-200 overflow-hidden">
                              <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center space-x-4">
                                <input autoFocus value={query} onChange={e => setQuery(e.target.value)} placeholder="Query Catalogue Registry..." className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-black outline-none" />
                              </div>
                              <div className="max-h-80 overflow-y-auto custom-scrollbar">
                                {searchResults.map(res => (
                                  <div key={res.id} onClick={() => selectItem(idx, res)} className="p-6 hover:bg-indigo-50 cursor-pointer flex items-center justify-between border-b border-slate-50 group/res">
                                      <div className="flex items-center space-x-4">
                                         <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-lg shadow-sm group-hover/res:bg-indigo-600 group-hover/res:text-white transition-all">{res.name.charAt(0)}</div>
                                         <div>
                                            <div className="text-xs font-black text-slate-800 uppercase italic group-hover/res:text-indigo-700">{res.name}</div>
                                            <div className="flex items-center space-x-3 mt-1.5">
                                               <span className="text-[8px] font-black bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded uppercase">SOH: {res.currentStock || 0} {res.unit}</span>
                                               <span className="text-[8px] font-black text-indigo-400 uppercase italic">{res.category}</span>
                                            </div>
                                         </div>
                                      </div>
                                      <span className="text-sm font-black text-slate-900">${res.salePrice.toLocaleString()}</span>
                                  </div>
                                ))}
                              </div>
                          </div>
                        ) : (
                          <div onClick={() => setSearchIdx(idx)} className="cursor-pointer">
                            <div className={`text-base font-black italic tracking-tighter uppercase ${item.name ? 'text-slate-800' : 'text-slate-300'}`}>
                              {item.name || '--- Locate Resource Node ---'}
                            </div>
                            {master && (
                              <div className="flex items-center space-x-3 mt-1.5">
                                <span className="text-[9px] font-black text-slate-400 uppercase">SOH: {master.currentStock || 0} {item.unit}</span>
                                {isSales && margin !== null && (
                                  <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${margin > 20 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                    Margin: {margin.toFixed(1)}%
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                    </td>
                    <td className="px-6 py-6">
                      {master?.isBatchTracked ? (
                        <select value={item.batchNo} onChange={e => updateItemField(item.id, 'batchNo', e.target.value)} className="w-full bg-slate-100 border border-slate-200 rounded-xl py-3 px-2 text-xs font-black outline-none focus:bg-white">
                          <option value="">-- Batch --</option>
                          {itemBatches.map(b => <option key={b.id} value={b.batchNo}>{b.batchNo} (Stock: {b.currentStock})</option>)}
                        </select>
                      ) : (
                        <span className="text-[9px] font-bold text-slate-300 uppercase block text-center italic">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-6 text-center">
                      <input type="number" value={item.qty} onChange={e => updateItemField(item.id, 'qty', parseFloat(e.target.value) || 0)} className="w-20 bg-slate-100 border border-slate-200 rounded-xl py-3 px-2 text-center text-sm font-black outline-none focus:bg-white" />
                      <div className="text-center text-[8px] font-black text-slate-300 uppercase mt-2">{item.unit}</div>
                    </td>
                    <td className="px-6 py-6 text-right">
                       <input type="number" value={item.rate} onChange={e => updateItemField(item.id, 'rate', parseFloat(e.target.value) || 0)} className="w-28 bg-slate-100 border border-slate-200 rounded-xl py-3 px-4 text-right text-sm font-black outline-none focus:bg-white" />
                    </td>
                    <td className="px-6 py-6 bg-indigo-50/20 text-center">
                       <input type="number" step="0.01" value={item.discountRate || ''} onChange={e => updateItemField(item.id, 'discountRate', parseFloat(e.target.value) || 0)} className="w-16 bg-white border border-indigo-200 rounded-xl py-3 text-center text-xs font-black text-indigo-500 outline-none" placeholder="0%" />
                    </td>
                    <td className="px-6 py-6 bg-indigo-50/20 text-center">
                       <input type="number" value={item.igstRate} onChange={e => updateItemField(item.id, 'igstRate', parseFloat(e.target.value) || 0)} className="w-16 bg-white border border-indigo-200 rounded-xl py-3 text-center text-xs font-black text-indigo-500 outline-none" />
                    </td>
                    <td className="px-6 py-6 text-right">
                        <div className="text-lg font-black text-slate-900 tabular-nums italic">
                          {(item.amount + (item.taxAmount || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                        <div className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Tax: ${item.taxAmount?.toFixed(2)}</div>
                    </td>
                    <td className="px-6 py-6 text-center">
                        <button type="button" onClick={() => setVchItems(prev => prev.filter(i => i.id !== item.id))} className="text-slate-200 hover:text-rose-600 transition-all"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <button type="button" onClick={addItem} className="w-full py-6 bg-slate-50 text-[10px] font-black uppercase text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all border-t border-slate-100 tracking-[0.4em] shadow-inner">+ Append Product Shard</button>
        </div>

        <div className="flex flex-col xl:flex-row gap-12 pt-8 border-t border-slate-100">
           <div className="flex-1 space-y-4">
              <label className="text-[11px] font-black uppercase text-slate-400 ml-4 tracking-[0.4em]">Audit Narrative & Context</label>
              <textarea value={narration} onChange={e => setNarration(e.target.value)} placeholder="Record organizational context for this resource movement..." className="w-full h-48 px-10 py-8 rounded-[3.5rem] border border-slate-200 bg-slate-50/50 text-sm font-medium resize-none shadow-inner outline-none focus:ring-8 focus:ring-indigo-500/5 italic leading-relaxed" />
           </div>
           
           <div className="w-full xl:w-[460px] space-y-8">
              <div className="bg-slate-900 rounded-[3.5rem] p-12 text-white space-y-6 shadow-2xl relative overflow-hidden border-b-8 border-indigo-600">
                 <div className="relative z-10 space-y-5">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-500 tracking-widest">
                       <span>Gross Value</span>
                       <span className="text-white tabular-nums">{currency} {totals.subTotal.toLocaleString()}</span>
                    </div>
                    {totals.discTotal > 0 && (
                      <div className="flex justify-between items-center text-[10px] font-black uppercase text-rose-400 tracking-widest">
                         <span>Volume Discount</span>
                         <span className="tabular-nums">- {currency} {totals.discTotal.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-[10px] font-black uppercase text-indigo-400 tracking-widest border-t border-white/5 pt-4">
                       <span>Resolved Tax Component</span>
                       <span className="text-white tabular-nums">{currency} {totals.taxTotal.toLocaleString()}</span>
                    </div>
                    <div className="pt-10 flex justify-between items-end border-t border-slate-800">
                       <div className="flex flex-col">
                          <span className="text-[11px] font-black uppercase italic text-indigo-500 tracking-[0.5em] mb-2">Grand Total</span>
                          <span className="text-[8px] font-bold text-slate-600 uppercase tracking-widest">Base Eq: {baseCurrencyCode} {(totals.grandTotal * exchangeRate).toLocaleString()}</span>
                       </div>
                       <span className="text-6xl font-black tracking-tighter italic tabular-nums text-white">{currency} {totals.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                 </div>
                 <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600 rounded-full blur-[200px] opacity-10 -mr-64 -mt-64 pointer-events-none"></div>
              </div>
              
              <button 
                type="submit" 
                disabled={isReadOnly || vchItems.length === 0 || !partyId} 
                className={`w-full py-8 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.4em] shadow-2xl transition-all transform active:scale-95 border-b-8 border-slate-950 ${isReadOnly ? 'bg-slate-200 text-slate-400 cursor-not-allowed border-none' : 'bg-slate-900 text-white hover:bg-black group'}`}
              >
                 Authorize Resource Transmission
              </button>
           </div>
        </div>
      </form>
    </div>
  );
};

export default InventoryVoucherForm;