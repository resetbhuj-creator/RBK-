
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Item, Ledger, Voucher, VoucherItem, VoucherType, Batch, Attachment } from '../types';

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

const MAX_ATTACHMENT_SIZE = 2 * 1024 * 1024;
const ALLOWED_ATTACHMENT_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];

const InventoryVoucherForm: React.FC<InventoryVoucherFormProps> = ({ isReadOnly, items, batches, ledgers, vouchers = [], onSubmit, onCancel, getNextId, activeCompany, forcedVType }) => {
  const [vchType, setVchType] = useState<InvType>(forcedVType || 'Sales');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [partyId, setPartyId] = useState('');
  const [narration, setNarration] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [exchangeRate, setExchangeRate] = useState(1);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  
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
        const rate = item.salePrice || 0;
        const amt = vi.qty * rate;
        const taxRate = item.gstRate || 18;
        return {
          ...vi,
          itemId: item.id,
          name: item.name,
          hsn: item.hsnCode,
          rate: rate,
          unit: item.unit,
          igstRate: taxRate,
          amount: amt,
          taxAmount: (amt * taxRate) / 100
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
        // Recalculate line-item logic
        updated.amount = updated.qty * updated.rate;
        updated.taxAmount = (updated.amount * (updated.igstRate || 0)) / 100;
        return updated;
      }
      return item;
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    // Fixed: Explicitly typed 'file' as 'File' to resolve property access errors on 'unknown' type
    Array.from(files).forEach((file: File) => {
      if (!ALLOWED_ATTACHMENT_TYPES.includes(file.type)) return;
      if (file.size > MAX_ATTACHMENT_SIZE) return;

      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachments(prev => [...prev, {
          id: `att-${Date.now()}-${Math.random()}`,
          name: file.name,
          type: file.type,
          size: file.size,
          data: reader.result as string
        }]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
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
      taxTotal: totals.taxTotal,
      attachments
    });
  };

  return (
    <div className="bg-white rounded-[3.5rem] border border-slate-200 shadow-2xl overflow-hidden max-w-7xl mx-auto animate-in zoom-in-95 duration-500">
      <div className="px-10 py-12 bg-indigo-600 text-white flex justify-between items-center relative overflow-hidden border-b-8 border-indigo-900">
        <div className="relative z-10 flex items-center space-x-8">
          <div className="w-20 h-20 bg-white/20 rounded-[2.2rem] flex items-center justify-center text-4xl border border-white/10 backdrop-blur-md shadow-2xl transform -rotate-3 transition-transform hover:rotate-0">📤</div>
          <div>
            <h3 className="text-4xl font-black uppercase italic tracking-tighter leading-none">Console</h3>
            <p className="text-xs font-black uppercase tracking-[0.4em] opacity-70 mt-3 italic">Identity Shard: {getNextId(vchType)}</p>
          </div>
        </div>
        <div className="flex items-center space-x-6 relative z-10">
           <div className="space-y-2 text-right">
              <label className="text-[9px] font-black uppercase text-indigo-200 tracking-widest block">Anchor Currency</label>
              <div className="flex bg-black/20 p-1 rounded-xl border border-white/10 backdrop-blur-md shadow-inner">
                 {CURRENCIES.map(c => (
                   <button key={c.code} type="button" onClick={() => setCurrency(c.code)} className={`px-4 py-2 text-[10px] font-black rounded-lg transition-all ${currency === c.code ? 'bg-white text-indigo-600 shadow-md scale-105' : 'text-indigo-100 hover:text-white'}`}>{c.code}</button>
                 ))}
              </div>
           </div>
           <div className="space-y-2">
              <label className="text-[9px] font-black uppercase text-indigo-200 tracking-widest block">Exch. Rate</label>
              <input type="number" step="0.01" value={exchangeRate} onChange={e => setExchangeRate(parseFloat(e.target.value) || 1)} className="w-20 px-3 py-2.5 bg-black/20 border border-white/10 rounded-xl text-xs font-black text-center text-white outline-none focus:ring-4 focus:ring-white/10" />
           </div>
        </div>
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white rounded-full blur-[100px] opacity-10 -mr-48 -mt-48"></div>
      </div>

      <form onSubmit={handleSubmit} className="p-12 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 bg-slate-50 p-10 rounded-[3rem] border border-slate-100 shadow-inner">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Execution Moment</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full px-7 py-4 rounded-2xl border border-slate-200 text-sm font-black bg-white outline-none focus:ring-8 focus:ring-indigo-500/5 shadow-sm transition-all" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest">Authorized Party Node</label>
            <select value={partyId} onChange={e => setPartyId(e.target.value)} className="w-full px-7 py-4 rounded-2xl border border-slate-200 text-sm font-black text-indigo-600 bg-white outline-none focus:ring-8 focus:ring-indigo-500/5 shadow-sm appearance-none cursor-pointer transition-all">
              <option value="">-- Choose Master Ledger --</option>
              {filteredParties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        </div>

        <div className="bg-white rounded-[3.5rem] border border-slate-200 overflow-hidden shadow-2xl">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-950 text-[9px] font-black uppercase text-slate-400 tracking-widest">
              <tr>
                <th className="px-8 py-7">Resource Particulars</th>
                <th className="px-6 py-7 text-center w-28">Volume</th>
                <th className="px-6 py-7 text-right w-32">Unit Price</th>
                <th className="px-6 py-7 text-center w-28 bg-indigo-900/10">Tax (%)</th>
                <th className="px-6 py-7 text-right w-44">Net Value ({currency})</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 bg-white">
              {vchItems.map((item, idx) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-all group">
                  <td className="px-8 py-6 relative" ref={searchIdx === idx ? searchRef : null}>
                    {searchIdx === idx ? (
                      <div className="absolute top-2 left-6 z-50 w-[400px] bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95">
                          <input autoFocus value={query} onChange={e => setQuery(e.target.value)} placeholder="Query Catalogue..." className="w-full p-4 border-b text-sm font-bold outline-none italic" />
                          <div className="max-h-60 overflow-y-auto custom-scrollbar">
                            {searchResults.map(res => (
                              <div key={res.id} onClick={() => selectItem(idx, res)} className="p-4 hover:bg-indigo-50 cursor-pointer flex justify-between items-center border-b border-slate-50">
                                  <span className="text-xs font-black text-slate-800 uppercase italic">{res.name}</span>
                                  <span className="text-[10px] font-bold text-indigo-400">${res.salePrice}</span>
                              </div>
                            ))}
                          </div>
                      </div>
                    ) : (
                      <div onClick={() => setSearchIdx(idx)} className="cursor-pointer group/item">
                        <div className={`text-base font-black italic tracking-tighter uppercase ${item.name ? 'text-slate-800' : 'text-slate-300'}`}>
                          {item.name || '--- Locate Resource ---'}
                        </div>
                        {item.hsn && <div className="text-[9px] font-bold text-slate-400 uppercase mt-1">HSN: {item.hsn}</div>}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-6 text-center">
                    <input type="number" value={item.qty} onChange={e => updateItemField(item.id, 'qty', parseFloat(e.target.value) || 0)} className="w-full bg-slate-100/50 border border-slate-200 rounded-xl py-3 px-2 text-center text-sm font-black outline-none focus:ring-4 focus:ring-indigo-500/5" />
                  </td>
                  <td className="px-6 py-6 text-right">
                    <input type="number" value={item.rate} onChange={e => updateItemField(item.id, 'rate', parseFloat(e.target.value) || 0)} className="w-full bg-slate-100/50 border border-slate-200 rounded-xl py-3 px-4 text-right text-sm font-black outline-none tabular-nums focus:ring-4 focus:ring-indigo-500/5" />
                  </td>
                  <td className="px-6 py-6 bg-indigo-50/20 text-center">
                    <input type="number" value={item.igstRate} onChange={e => updateItemField(item.id, 'igstRate', parseFloat(e.target.value) || 0)} className="w-full bg-white border border-indigo-200 rounded-xl py-3 text-center text-xs font-black text-indigo-600 outline-none focus:ring-4 focus:ring-indigo-600/5" />
                  </td>
                  <td className="px-6 py-6 text-right">
                      <div className="text-lg font-black text-slate-900 tabular-nums italic group-hover:scale-105 transition-transform origin-right">
                        ${(item.amount + (item.taxAmount || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button type="button" onClick={addItem} className="w-full py-8 bg-slate-50 text-[11px] font-black uppercase text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all border-t border-slate-100 tracking-[0.5em] shadow-inner">+ Append Resource Node</button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-16 pt-10 border-t border-slate-100">
           <div className="space-y-10">
              <div className="space-y-4">
                 <label className="text-[11px] font-black uppercase text-slate-400 tracking-[0.4em] px-4">Audit Narrative</label>
                 <textarea value={narration} onChange={e => setNarration(e.target.value)} placeholder="Rationale..." className="w-full h-48 px-10 py-10 rounded-[3.5rem] border border-slate-200 bg-slate-50/50 text-sm font-medium italic resize-none shadow-inner outline-none focus:bg-white focus:ring-8 focus:ring-indigo-500/5 transition-all" />
              </div>

              <div className="space-y-4">
                 <div className="flex items-center justify-between px-6">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Evidence Shards (Attachments)</label>
                    <label className="cursor-pointer bg-white border border-slate-200 hover:border-indigo-600 px-4 py-2 rounded-xl text-[9px] font-black uppercase text-indigo-600 transition-all flex items-center space-x-2">
                       <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" strokeWidth={3}/></svg>
                       <span>Upload File</span>
                       <input type="file" multiple className="hidden" accept=".pdf,image/*" onChange={handleFileUpload} />
                    </label>
                 </div>
                 
                 <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[3rem] p-8 h-48 overflow-y-auto custom-scrollbar flex flex-wrap gap-4 items-start">
                    {attachments.map(att => (
                      <div key={att.id} className="relative group bg-white rounded-2xl p-2 border border-slate-100 shadow-sm flex flex-col items-center">
                         <div className="w-24 h-24 rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center">
                            {att.type.includes('image') ? (
                              <img src={att.data} alt={att.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="flex flex-col items-center">
                                 <span className="text-3xl">📄</span>
                                 <span className="text-[8px] font-black text-slate-400 uppercase mt-1">PDF</span>
                              </div>
                            )}
                         </div>
                         <span className="text-[7px] font-bold text-slate-400 mt-1 truncate w-20 text-center">{att.name}</span>
                         <button 
                           type="button"
                           onClick={() => setAttachments(prev => prev.filter(a => a.id !== att.id))}
                           className="absolute -top-2 -right-2 w-7 h-7 bg-rose-500 text-white rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg hover:bg-rose-600"
                         >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth={3}/></svg>
                         </button>
                      </div>
                    ))}
                    {attachments.length === 0 && (
                       <div className="w-full h-full flex flex-col items-center justify-center opacity-20 italic">
                          <p className="text-[10px] font-black uppercase tracking-[0.5em]">No evidence nodes attached</p>
                       </div>
                    )}
                 </div>
                 <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest px-6 italic text-center">PDF, JPG, PNG only • 2.0MB Partition Limit</p>
              </div>
           </div>
           
           <div className="w-full space-y-10">
              <div className="bg-slate-950 rounded-[4rem] p-12 text-white space-y-8 shadow-2xl relative overflow-hidden border-b-[12px] border-indigo-600 group">
                 <div className="relative z-10 space-y-6">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-500 tracking-widest">
                       <span>Aggregate Gross Value</span>
                       <span className="text-white tabular-nums italic">${totals.subTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-black uppercase text-indigo-400 tracking-widest">
                       <span>Statutory Yield (Line Tax)</span>
                       <span className="text-white tabular-nums italic">+ ${totals.taxTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="pt-12 flex justify-between items-end border-t border-slate-800">
                       <span className="text-[11px] font-black uppercase italic text-indigo-500 tracking-[0.6em] mb-3">GRAND TOTAL</span>
                       <div className="text-6xl font-black italic tracking-tighter tabular-nums text-white group-hover:scale-105 transition-transform origin-right duration-500">{currency} {totals.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                    </div>
                 </div>
                 <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600 rounded-full blur-[100px] opacity-10 -mr-32 -mt-32"></div>
              </div>
              
              <div className="flex gap-4">
                <button type="button" onClick={onCancel} className="flex-1 py-6 rounded-[2.2rem] border-2 border-slate-200 font-black text-xs uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all transform active:scale-95">Discard Cycles</button>
                <button type="submit" className="flex-[2] py-10 bg-slate-900 text-white rounded-[3.5rem] font-black text-sm uppercase tracking-[0.5em] shadow-2xl hover:bg-indigo-600 transition-all transform active:scale-95 border-b-[12px] border-slate-950">Authorize Sequence Burst</button>
              </div>
           </div>
        </div>
      </form>
    </div>
  );
};

export default InventoryVoucherForm;
