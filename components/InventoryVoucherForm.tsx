import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Item, Ledger, Voucher, VoucherItem, Adjustment, VoucherType, Batch, Attachment } from '../types';

interface InventoryVoucherFormProps {
  isReadOnly?: boolean;
  items: Item[];
  batches: Batch[];
  ledgers: Ledger[];
  vouchers?: Voucher[];
  onSubmit: (data: Omit<Voucher, 'id' | 'status'>) => void;
  onCancel: () => void;
  getNextId: (type: string) => string;
  activeCompany?: any;
  forcedVType?: InvType;
}

type InvType = Extract<VoucherType, 'Sales' | 'Purchase' | 'Sales Return' | 'Purchase Return' | 'Purchase Order' | 'Delivery Note' | 'Goods Receipt Note (GRN)' | 'Stock Adjustment' | 'Credit Note' | 'Debit Note'>;

const CURRENCIES = [
  { code: 'USD', symbol: '$' },
  { code: 'EUR', symbol: '€' },
  { code: 'GBP', symbol: '£' },
  { code: 'INR', symbol: '₹' },
  { code: 'AED', symbol: 'د.إ' }
];

const InventoryVoucherForm: React.FC<InventoryVoucherFormProps> = ({ isReadOnly, items, batches, ledgers, vouchers = [], onSubmit, onCancel, getNextId, activeCompany, forcedVType }) => {
  const [vchType, setVchType] = useState<InvType>(forcedVType || 'Sales');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [partyId, setPartyId] = useState('');
  const [narration, setNarration] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [exchangeRate, setExchangeRate] = useState(1);
  
  const [vchItems, setVchItems] = useState<VoucherItem[]>([
    { id: '1', itemId: '', name: '', hsn: '', qty: 1, unit: 'Nos', rate: 0, amount: 0, igstRate: 18, taxAmount: 0 }
  ]);

  const [searchIdx, setSearchIdx] = useState<number | null>(null);
  const [query, setQuery] = useState('');
  const searchRef = useRef<HTMLTableDataCellElement>(null);

  const filteredParties = useMemo(() => {
    if (vchType.includes('Sales')) return ledgers.filter(l => l.group === 'Sundry Debtors');
    if (vchType.includes('Purchase')) return ledgers.filter(l => l.group === 'Sundry Creditors');
    return ledgers;
  }, [ledgers, vchType]);

  const searchResults = useMemo(() => {
    const term = query.toLowerCase();
    return items.filter(i => i.name.toLowerCase().includes(term) || i.hsnCode.includes(term)).slice(0, 5);
  }, [items, query]);

  const addItem = () => {
    setVchItems([...vchItems, { id: Date.now().toString(), itemId: '', name: '', hsn: '', qty: 1, unit: 'Nos', rate: 0, amount: 0, igstRate: 18, taxAmount: 0 }]);
  };

  const selectItem = (idx: number, item: Item) => {
    setVchItems(prev => prev.map((vi, i) => {
      if (i === idx) {
        return {
          ...vi,
          itemId: item.id,
          name: item.name,
          hsn: item.hsnCode,
          rate: item.salePrice,
          unit: item.unit,
          amount: vi.qty * item.salePrice,
          taxAmount: (vi.qty * item.salePrice * vi.igstRate!) / 100
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
        updated.amount = updated.qty * updated.rate;
        updated.taxAmount = (updated.amount * (updated.igstRate || 0)) / 100;
        return updated;
      }
      return item;
    }));
  };

  const totals = useMemo(() => {
    const subTotal = vchItems.reduce((acc, i) => acc + i.amount, 0);
    const taxTotal = vchItems.reduce((acc, i) => acc + (i.taxAmount || 0), 0);
    const grandTotal = subTotal + taxTotal;
    return { subTotal, taxTotal, grandTotal };
  }, [vchItems]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;
    onSubmit({
      type: vchType,
      date,
      party: ledgers.find(l => l.id === partyId)?.name || 'Unknown',
      amount: totals.grandTotal,
      currency,
      exchangeRate,
      items: vchItems,
      subTotal: totals.subTotal,
      taxTotal: totals.taxTotal
    });
  };

  return (
    <div className="bg-white rounded-[3.5rem] border border-slate-200 shadow-2xl overflow-hidden max-w-7xl mx-auto animate-in zoom-in-95">
      <div className="px-10 py-12 bg-indigo-600 text-white flex justify-between items-center relative overflow-hidden">
        <div className="relative z-10 flex items-center space-x-8">
          <div className="w-20 h-20 bg-white/20 rounded-[2rem] flex items-center justify-center text-4xl border border-white/10 backdrop-blur-md shadow-2xl">📤</div>
          <div>
            <h3 className="text-4xl font-black uppercase italic tracking-tighter leading-none">{vchType} Console</h3>
            <p className="text-xs font-black uppercase tracking-[0.4em] opacity-70 mt-3 italic">Identity Shard: {getNextId(vchType)}</p>
          </div>
        </div>
        <div className="flex items-center space-x-6 relative z-10">
           <div className="space-y-2 text-right">
              <label className="text-[9px] font-black uppercase text-indigo-200 tracking-widest block">Anchor Currency</label>
              <div className="flex bg-black/20 p-1 rounded-xl border border-white/10 backdrop-blur-md">
                 {CURRENCIES.map(c => (
                   <button key={c.code} type="button" onClick={() => setCurrency(c.code)} className={`px-3 py-1.5 text-[10px] font-black rounded-lg transition-all ${currency === c.code ? 'bg-white text-indigo-600 shadow-md' : 'text-indigo-100 hover:text-white'}`}>{c.code}</button>
                 ))}
              </div>
           </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-12 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 bg-slate-50 p-10 rounded-[3rem] border border-slate-100 shadow-inner">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Execution Moment</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full px-7 py-4 rounded-2xl border border-slate-200 text-sm font-black bg-white outline-none focus:ring-8 focus:ring-indigo-500/5 shadow-sm" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Authorized Party Node</label>
            <select value={partyId} onChange={e => setPartyId(e.target.value)} className="w-full px-7 py-4 rounded-2xl border border-slate-200 text-sm font-black text-indigo-600 bg-white outline-none focus:ring-8 focus:ring-indigo-500/5 shadow-sm appearance-none cursor-pointer">
              <option value="">-- Choose Master Ledger --</option>
              {filteredParties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        </div>

        <div className="bg-white rounded-[3.5rem] border border-slate-200 overflow-hidden shadow-2xl">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-950 text-[9px] font-black uppercase text-slate-400 tracking-widest">
              <tr>
                <th className="px-8 py-7">Resource Designation</th>
                <th className="px-6 py-7 text-center w-24">Qty</th>
                <th className="px-6 py-7 text-right w-32">Rate</th>
                <th className="px-6 py-7 text-center w-24 bg-indigo-950/20">Tax%</th>
                <th className="px-6 py-7 text-right w-44">Net Value ({currency})</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 bg-white">
              {vchItems.map((item, idx) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-all group">
                  <td className="px-8 py-6 relative" ref={searchIdx === idx ? searchRef : null}>
                    {searchIdx === idx ? (
                      <div className="absolute top-2 left-6 z-50 w-[400px] bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95">
                          <input autoFocus value={query} onChange={e => setQuery(e.target.value)} placeholder="Query Catalogue..." className="w-full p-4 border-b text-sm font-bold outline-none" />
                          <div className="max-h-60 overflow-y-auto custom-scrollbar">
                            {searchResults.map(res => (
                              <div key={res.id} onClick={() => selectItem(idx, res)} className="p-4 hover:bg-indigo-50 cursor-pointer flex justify-between items-center border-b border-slate-50">
                                  <span className="text-xs font-black text-slate-800 uppercase italic">{res.name}</span>
                                  <span className="text-[10px] font-bold text-slate-400">${res.salePrice}</span>
                              </div>
                            ))}
                          </div>
                      </div>
                    ) : (
                      <div onClick={() => setSearchIdx(idx)} className="cursor-pointer">
                        <div className={`text-base font-black italic tracking-tighter uppercase ${item.name ? 'text-slate-800' : 'text-slate-300'}`}>
                          {item.name || '--- Locate Resource ---'}
                        </div>
                        {item.hsn && <div className="text-[9px] font-bold text-slate-400 uppercase mt-1">HSN: {item.hsn}</div>}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-6 text-center">
                    <input type="number" value={item.qty} onChange={e => updateItemField(item.id, 'qty', parseFloat(e.target.value) || 0)} className="w-20 bg-slate-50 border border-slate-200 rounded-xl py-3 px-2 text-center text-sm font-black outline-none" />
                  </td>
                  <td className="px-6 py-6 text-right">
                    <input type="number" value={item.rate} onChange={e => updateItemField(item.id, 'rate', parseFloat(e.target.value) || 0)} className="w-28 bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-right text-sm font-black outline-none tabular-nums" />
                  </td>
                  <td className="px-6 py-6 bg-indigo-50/20 text-center">
                    <input type="number" value={item.igstRate} onChange={e => updateItemField(item.id, 'igstRate', parseFloat(e.target.value) || 0)} className="w-16 bg-white border border-indigo-200 rounded-xl py-3 text-center text-xs font-black text-indigo-500 outline-none" />
                  </td>
                  <td className="px-6 py-6 text-right">
                      <div className="text-lg font-black text-slate-900 tabular-nums italic">
                        ${(item.amount + (item.taxAmount || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button type="button" onClick={addItem} className="w-full py-8 bg-slate-50 text-[11px] font-black uppercase text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all border-t border-slate-100 tracking-[0.5em] shadow-inner">+ Append Resource Shard</button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-16 pt-10 border-t border-slate-100">
           <div className="space-y-6">
              <label className="text-[11px] font-black uppercase text-slate-400 tracking-[0.4em] px-4">Audit Narrative</label>
              <textarea value={narration} onChange={e => setNarration(e.target.value)} placeholder="Rationale..." className="w-full h-48 px-10 py-10 rounded-[3rem] border border-slate-200 bg-slate-50/50 text-sm font-medium italic resize-none shadow-inner outline-none focus:bg-white transition-all" />
           </div>
           
           <div className="w-full space-y-10">
              <div className="bg-slate-950 rounded-[4rem] p-12 text-white space-y-8 shadow-2xl relative overflow-hidden border-b-[12px] border-indigo-600 group">
                 <div className="relative z-10 space-y-6">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-500 tracking-widest">
                       <span>Aggregate Gross</span>
                       <span className="text-white tabular-nums">${totals.subTotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-black uppercase text-indigo-400 tracking-widest">
                       <span>Statutory Yield (GST)</span>
                       <span className="text-white tabular-nums">+ ${totals.taxTotal.toLocaleString()}</span>
                    </div>
                    <div className="pt-12 flex justify-between items-end border-t border-slate-800">
                       <span className="text-[11px] font-black uppercase italic text-indigo-500 tracking-[0.6em] mb-3">GRAND TOTAL</span>
                       <div className="text-6xl font-black italic tracking-tighter tabular-nums text-white group-hover:scale-105 transition-transform origin-right duration-500">{currency} {totals.grandTotal.toLocaleString()}</div>
                    </div>
                 </div>
                 <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600 rounded-full blur-[100px] opacity-10 -mr-32 -mt-32"></div>
              </div>
              
              <div className="flex gap-4">
                <button type="button" onClick={onCancel} className="flex-1 py-6 rounded-[2rem] border border-slate-200 font-black text-xs uppercase tracking-widest text-slate-400 hover:bg-slate-50">Discard</button>
                <button type="submit" className="flex-[2] py-10 bg-slate-900 text-white rounded-[3.5rem] font-black text-sm uppercase tracking-[0.5em] shadow-2xl hover:bg-black transition-all transform active:scale-95 border-b-[12px] border-slate-950">Authorize Sequence</button>
              </div>
           </div>
        </div>
      </form>
    </div>
  );
};

export default InventoryVoucherForm;