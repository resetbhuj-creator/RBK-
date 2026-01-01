import React, { useState, useMemo } from 'react';
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

  const filteredParties = useMemo(() => {
    const group = vchType === 'Sales' ? 'Sundry Debtors' : 'Sundry Creditors';
    return ledgers.filter(l => l.group === group);
  }, [vchType, ledgers]);

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
  };

  const updateItem = (id: string, field: keyof VoucherItem, value: any) => {
    setVchItems(prev => prev.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        if (field === 'itemId') {
          const master = items.find(i => i.id === value);
          if (master) {
            updated.name = master.name;
            updated.hsn = master.hsnCode;
            updated.rate = master.salePrice;
            updated.unit = master.unit;
            // Central IGST = Full Rate, Local CGST/SGST = Full/2
            const fullRate = master.gstRate || 18; 
            updated.igstRate = fullRate;
            updated.cgstRate = fullRate / 2;
            updated.sgstRate = fullRate / 2;
          }
        }
        
        updated.amount = updated.qty * updated.rate;
        
        if (supplyType === 'Local') {
           updated.taxAmount = updated.amount * ((updated.cgstRate || 0) + (updated.sgstRate || 0)) / 100;
        } else {
           updated.taxAmount = updated.amount * (updated.igstRate || 0) / 100;
        }
        
        return updated;
      }
      return item;
    }));
  };

  const removeItem = (id: string) => setVchItems(prev => prev.filter(i => i.id !== id));

  const totals = useMemo(() => {
    const subTotal = vchItems.reduce((acc, i) => acc + i.amount, 0);
    const cgstTotal = supplyType === 'Local' ? vchItems.reduce((acc, i) => acc + (i.amount * (i.cgstRate || 0) / 100), 0) : 0;
    const sgstTotal = supplyType === 'Local' ? vchItems.reduce((acc, i) => acc + (i.amount * (i.sgstRate || 0) / 100), 0) : 0;
    const igstTotal = supplyType === 'Central' ? vchItems.reduce((acc, i) => acc + (i.amount * (i.igstRate || 0) / 100), 0) : 0;
    const taxTotal = cgstTotal + sgstTotal + igstTotal;
    const grandTotal = subTotal + taxTotal;
    return { subTotal, cgstTotal, sgstTotal, igstTotal, taxTotal, grandTotal };
  }, [vchItems, supplyType]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly || vchItems.length === 0 || !partyId) return;
    
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
      <div className={`px-10 py-8 ${vchType === 'Sales' ? 'bg-emerald-600' : 'bg-indigo-600'} text-white flex justify-between items-center transition-colors duration-500`}>
        <div className="flex items-center space-x-5">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-3xl border border-white/10 backdrop-blur-md shadow-inner">
            {vchType === 'Sales' ? '📤' : '📥'}
          </div>
          <div>
            <h3 className="text-2xl font-black uppercase italic tracking-tight">{vchType === 'Sales' ? 'Output' : 'Input'} Invoice</h3>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80">Supply Mode: {supplyType} Jurisdiction</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
           <div className="flex p-1 bg-black/20 rounded-xl backdrop-blur-md border border-white/10">
              {(['Local', 'Central'] as const).map(s => (
                <button key={s} type="button" onClick={() => setSupplyType(s)} className={`px-5 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${supplyType === s ? 'bg-white text-indigo-600 shadow-lg' : 'text-white/60 hover:text-white'}`}>{s}</button>
              ))}
           </div>
           <button onClick={onCancel} className="p-2 hover:bg-white/10 rounded-full transition-colors"><svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-10 space-y-8">
        <div className="flex bg-slate-100 p-1.5 rounded-[2rem] border border-slate-200">
          {(['Sales', 'Purchase'] as const).map(t => (
            <button key={t} type="button" onClick={() => { setVchType(t); setPartyId(''); }} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest rounded-[1.5rem] transition-all ${vchType === t ? 'bg-white shadow-xl text-indigo-600' : 'text-slate-400'}`}>{t === 'Sales' ? 'Outward Supply' : 'Inward Supply'}</button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase text-slate-400 ml-1 tracking-widest">Invoicing Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full px-5 py-3 rounded-2xl border border-slate-200 text-sm font-bold bg-slate-50 outline-none focus:ring-4 focus:ring-indigo-500/10" />
          </div>
          <div className="md:col-span-2 space-y-1">
            <label className="text-[9px] font-black uppercase text-slate-400 ml-1 tracking-widest">Transacting Entity</label>
            <select value={partyId} onChange={e => setPartyId(e.target.value)} className="w-full px-5 py-3 rounded-2xl border border-slate-200 text-sm font-bold bg-white outline-none">
              <option value="">-- Select Master Ledger --</option>
              {filteredParties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase text-slate-400 ml-1 tracking-widest">Doc Reference</label>
            <input value={reference} onChange={e => setReference(e.target.value)} placeholder="Ref # / HASH" className="w-full px-5 py-3 rounded-2xl border border-slate-200 text-sm font-bold bg-slate-50" />
          </div>
        </div>

        <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm">
           <table className="w-full text-left">
             <thead className="bg-slate-900 text-[9px] font-black uppercase text-slate-400">
               <tr>
                 <th className="px-6 py-5">Item Definition</th>
                 <th className="px-6 py-5 text-center">Qty</th>
                 <th className="px-6 py-5 text-right">Rate</th>
                 <th className="px-6 py-5 text-center">{supplyType === 'Local' ? 'CGST+SGST' : 'IGST'}</th>
                 <th className="px-6 py-5 text-right">Total</th>
                 <th className="px-6 py-5 text-center"></th>
               </tr>
             </thead>
             <tbody className="divide-y divide-slate-100 bg-white">
               {vchItems.map(item => (
                 <tr key={item.id} className="animate-in fade-in slide-in-from-left-2 duration-300">
                   <td className="px-6 py-5">
                     <select value={item.itemId} onChange={e => updateItem(item.id, 'itemId', e.target.value)} className="w-full bg-transparent border-none text-xs font-black italic text-indigo-600 outline-none">
                       <option value="">-- Choose Catalogue Item --</option>
                       {items.map(i => <option key={i.id} value={i.id}>{i.name} (HSN: {i.hsnCode})</option>)}
                     </select>
                   </td>
                   <td className="px-6 py-5">
                      <input type="number" value={item.qty} onChange={e => updateItem(item.id, 'qty', parseFloat(e.target.value) || 0)} className="w-16 mx-auto bg-slate-50 border border-slate-100 rounded-lg py-1 px-2 text-center text-xs font-black" />
                   </td>
                   <td className="px-6 py-5">
                      <input type="number" value={item.rate} onChange={e => updateItem(item.id, 'rate', parseFloat(e.target.value) || 0)} className="w-24 ml-auto block bg-transparent border-none text-right text-xs font-black outline-none" />
                   </td>
                   <td className="px-6 py-5 text-center">
                      <div className="flex flex-col items-center">
                         <span className="text-[10px] font-black text-slate-800">{supplyType === 'Local' ? `${item.cgstRate}% + ${item.sgstRate}%` : `${item.igstRate}%`}</span>
                         <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Tax: ${item.taxAmount?.toLocaleString()}</span>
                      </div>
                   </td>
                   <td className="px-6 py-5 text-right text-xs font-black text-slate-800">${((item.amount || 0) + (item.taxAmount || 0)).toLocaleString()}</td>
                   <td className="px-6 py-5 text-center">
                      <button type="button" onClick={() => removeItem(item.id)} className="text-slate-300 hover:text-rose-500 transition-colors p-2 rounded-lg hover:bg-rose-50"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                   </td>
                 </tr>
               ))}
             </tbody>
           </table>
           <button type="button" onClick={addItem} className="w-full py-5 bg-slate-50 text-[10px] font-black uppercase text-indigo-600 hover:bg-indigo-100 transition-all border-t border-slate-100 tracking-[0.2em] shadow-inner">+ Append Transaction Component</button>
        </div>

        <div className="flex flex-col md:flex-row gap-10">
           <div className="flex-1 space-y-4">
              <label className="text-[9px] font-black uppercase text-slate-400 ml-1 tracking-widest">Narration / Footnote</label>
              <textarea value={narration} onChange={e => setNarration(e.target.value)} placeholder="Regulatory notes, payment terms, or logic justification..." className="w-full h-40 px-6 py-5 rounded-[2.5rem] border border-slate-200 bg-white text-xs font-medium resize-none shadow-inner outline-none focus:ring-4 focus:ring-indigo-500/10" />
           </div>
           <div className="w-full md:w-96 space-y-6">
              <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white space-y-5 shadow-2xl relative overflow-hidden border-t-8 border-indigo-600">
                 <div className="relative z-10 flex justify-between text-[10px] font-black uppercase text-slate-500 tracking-widest"><span>Taxable Value</span><span>${totals.subTotal.toLocaleString()}</span></div>
                 
                 {supplyType === 'Local' ? (
                   <>
                      <div className="relative z-10 flex justify-between text-[10px] font-black uppercase text-indigo-400 tracking-widest"><span>CGST Allocation</span><span>${totals.cgstTotal.toLocaleString()}</span></div>
                      <div className="relative z-10 flex justify-between text-[10px] font-black uppercase text-indigo-400 tracking-widest"><span>SGST Allocation</span><span>${totals.sgstTotal.toLocaleString()}</span></div>
                   </>
                 ) : (
                    <div className="relative z-10 flex justify-between text-[10px] font-black uppercase text-indigo-400 tracking-widest"><span>IGST Allocation</span><span>${totals.igstTotal.toLocaleString()}</span></div>
                 )}
                 
                 <div className="relative z-10 pt-6 border-t border-slate-800 flex justify-between items-center">
                    <div className="flex flex-col">
                       <span className="text-[10px] font-black uppercase italic text-indigo-500 tracking-widest">Voucher Total</span>
                       <span className="text-[8px] font-bold text-slate-600 uppercase">Incl. {supplyType} Taxes</span>
                    </div>
                    <span className="text-4xl font-black tracking-tighter italic">${totals.grandTotal.toLocaleString()}</span>
                 </div>
                 <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600 rounded-full blur-[100px] opacity-10 -mr-32 -mt-32"></div>
              </div>
              <button type="submit" disabled={isReadOnly || vchItems.length === 0 || !partyId} className={`w-full py-6 rounded-3xl font-black text-[11px] uppercase tracking-[0.2em] transition-all transform active:scale-95 shadow-2xl ${isReadOnly ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-slate-900 text-white shadow-slate-900/40 hover:bg-black'}`}>Finalize & Post {vchType === 'Sales' ? 'Outward' : 'Inward'} Supply</button>
           </div>
        </div>
      </form>
    </div>
  );
};

export default InventoryVoucherForm;