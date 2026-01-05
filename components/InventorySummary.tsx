import React, { useMemo, useState } from 'react';
import { Item, Voucher, Batch, VoucherType } from '../types';
import ActionMenu, { ActionItem } from './ActionMenu';

interface InventorySummaryProps {
  items: Item[];
  vouchers: Voucher[];
  batches: Batch[];
  onAdjustStock?: (vch: Omit<Voucher, 'id' | 'status'>) => void;
  onViewVoucher?: (id: string) => void;
}

type ActiveView = 'LIST' | 'LEDGER' | 'BATCHES' | 'ADJUST';

const InventorySummary: React.FC<InventorySummaryProps> = ({ items, vouchers, batches, onAdjustStock, onViewVoucher }) => {
  const [activeView, setActiveView] = useState<ActiveView>('LIST');
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [adjustmentQty, setAdjustmentQty] = useState<number>(0);
  const [adjustmentType, setAdjustmentType] = useState<'Add' | 'Less'>('Add');
  const [adjustmentNarration, setAdjustmentNarration] = useState('');

  const stockData = useMemo(() => {
    return items.map(item => {
      let qtyIn = 0;
      let qtyOut = 0;
      
      vouchers.forEach(v => {
        if (v.items) {
          const vItem = v.items.find(vi => vi.itemId === item.id);
          if (vItem) {
            if (v.type === 'Purchase' || v.type === 'Sales Return' || v.type === 'Goods Receipt Note (GRN)') qtyIn += vItem.qty;
            if (v.type === 'Sales' || v.type === 'Purchase Return' || v.type === 'Delivery Note') qtyOut += vItem.qty;
            if (v.type === 'Stock Adjustment') {
                // Adjustments can be positive or negative based on amount/qty logic in a real system
                // For this demo, we'll assume adjustments are added to Inward if positive
                vItem.qty > 0 ? qtyIn += vItem.qty : qtyOut += Math.abs(vItem.qty);
            }
          }
        }
      });

      const currentQty = qtyIn - qtyOut;
      const valuation = currentQty * (item.costPrice || item.salePrice);
      
      let status: 'CRITICAL' | 'LOW' | 'OPTIMAL' = 'OPTIMAL';
      if (currentQty <= 0) status = 'CRITICAL';
      else if (currentQty < 10) status = 'LOW';

      return { ...item, currentQty, qtyIn, qtyOut, valuation, status };
    });
  }, [items, vouchers]);

  const totalValuation = stockData.reduce((acc, s) => acc + s.valuation, 0);

  const itemLedgerData = useMemo(() => {
    if (!selectedItem) return [];
    let runningBal = 0;
    const ledger: any[] = [];

    // Sort vouchers by date for ledger consistency
    const sortedVch = [...vouchers].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    sortedVch.forEach(v => {
      const vItem = v.items?.find(vi => vi.itemId === selectedItem.id);
      if (vItem) {
        let inward = 0;
        let outward = 0;
        if (['Purchase', 'Sales Return', 'Goods Receipt Note (GRN)'].includes(v.type)) inward = vItem.qty;
        else if (['Sales', 'Purchase Return', 'Delivery Note'].includes(v.type)) outward = vItem.qty;
        else if (v.type === 'Stock Adjustment') vItem.qty > 0 ? inward = vItem.qty : outward = Math.abs(vItem.qty);

        runningBal += (inward - outward);
        ledger.push({
          date: v.date,
          type: v.type,
          id: v.id,
          party: v.party,
          inward,
          outward,
          balance: runningBal
        });
      }
    });
    return ledger.reverse(); // Show latest first
  }, [selectedItem, vouchers]);

  const itemBatches = useMemo(() => {
    if (!selectedItem) return [];
    return batches.filter(b => b.itemId === selectedItem.id);
  }, [selectedItem, batches]);

  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || !onAdjustStock) return;

    const qty = adjustmentType === 'Add' ? adjustmentQty : -adjustmentQty;
    const adjustmentVch: Omit<Voucher, 'id' | 'status'> = {
      type: 'Stock Adjustment',
      date: new Date().toISOString().split('T')[0],
      party: 'SYSTEM_INTERNAL',
      amount: Math.abs(qty * (selectedItem.costPrice || selectedItem.salePrice)),
      narration: adjustmentNarration || `Manual stock adjustment for ${selectedItem.name}`,
      items: [{
        id: `adj-${Date.now()}`,
        itemId: selectedItem.id,
        name: selectedItem.name,
        hsn: selectedItem.hsnCode,
        qty: qty,
        unit: selectedItem.unit,
        rate: selectedItem.costPrice || selectedItem.salePrice,
        amount: Math.abs(qty * (selectedItem.costPrice || selectedItem.salePrice))
      }]
    };

    onAdjustStock(adjustmentVch);
    setAdjustmentQty(0);
    setAdjustmentNarration('');
    setActiveView('LIST');
    alert(`Stock adjustment voucher generated for ${selectedItem.name}.`);
  };

  const getItemActions = (item: any): ActionItem[] => [
    { 
      label: 'Stock Ledger', 
      icon: '📜',
      onClick: () => { setSelectedItem(item); setActiveView('LEDGER'); },
      variant: 'primary'
    },
    { 
      label: 'Batch History', 
      icon: '📦',
      onClick: () => { setSelectedItem(item); setActiveView('BATCHES'); }
    },
    { 
      label: 'Adjust Stock', 
      icon: '🔧',
      onClick: () => { setSelectedItem(item); setActiveView('ADJUST'); },
      variant: 'danger'
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Dynamic Summary Panel */}
      <div className="bg-slate-900 rounded-[3.5rem] p-12 text-white relative overflow-hidden shadow-2xl border-b-8 border-rose-600">
         <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
            <div className="flex items-center space-x-8">
               <div className="w-20 h-20 bg-rose-600 rounded-[2rem] flex items-center justify-center text-4xl shadow-2xl border-4 border-rose-400/20 transform -rotate-3 hover:rotate-0 transition-transform">📊</div>
               <div>
                  <h3 className="text-4xl font-black italic uppercase tracking-tighter leading-none">Inventory Vault</h3>
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-rose-400 mt-2">Real-Time Asset Valuation & Forensic Audit</p>
               </div>
            </div>
            <div className="flex gap-12 border-l border-white/10 pl-12">
               <div className="text-center">
                  <div className="text-[9px] font-black uppercase text-slate-500 tracking-widest mb-1">Aggregate Net Value</div>
                  <div className="text-4xl font-black italic tabular-nums text-white">${totalValuation.toLocaleString()}</div>
               </div>
               <div className="text-center">
                  <div className="text-[9px] font-black uppercase text-slate-500 tracking-widest mb-1">Catalogued Nodes</div>
                  <div className="text-4xl font-black italic tabular-nums text-white">{items.length}</div>
               </div>
            </div>
         </div>
         <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-rose-600 rounded-full blur-[150px] opacity-10 -mr-64 -mt-64 pointer-events-none"></div>
      </div>

      {activeView === 'LIST' && (
        <div className="bg-white rounded-[3.5rem] border border-slate-200 shadow-sm overflow-hidden animate-in slide-in-from-bottom-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-950 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-slate-900">
                <tr>
                  <th className="px-12 py-8">Resource Designation</th>
                  <th className="px-12 py-8">Status Registry</th>
                  <th className="px-12 py-8 text-center">Movement (In/Out)</th>
                  <th className="px-12 py-8 text-center">In-Stock</th>
                  <th className="px-12 py-8 text-right">Inventory Valuation</th>
                  <th className="px-12 py-8 text-right">Operations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 bg-white">
                {stockData.map((s, i) => (
                  <tr key={i} className="hover:bg-rose-50/20 transition-all group">
                    <td className="px-12 py-6">
                       <div className="font-black text-slate-800 italic uppercase tracking-tight text-sm group-hover:text-rose-600 transition-colors underline decoration-transparent group-hover:decoration-rose-100 underline-offset-4">{s.name}</div>
                       <div className="text-[9px] font-bold text-slate-400 uppercase mt-1">CAT: {s.category} • HSN: {s.hsnCode}</div>
                    </td>
                    <td className="px-12 py-6">
                       <span className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest border shadow-sm ${
                         s.status === 'CRITICAL' ? 'bg-rose-50 text-rose-600 border-rose-200 animate-pulse' : 
                         s.status === 'LOW' ? 'bg-amber-50 text-amber-600 border-amber-200' : 
                         'bg-emerald-50 text-emerald-600 border-emerald-200'
                       }`}>
                         {s.status}
                       </span>
                    </td>
                    <td className="px-12 py-6 text-center">
                       <div className="flex items-center justify-center space-x-3 text-[10px] font-black tabular-nums">
                          <span className="text-emerald-500">+{s.qtyIn}</span>
                          <span className="text-slate-300">/</span>
                          <span className="text-rose-500">-{s.qtyOut}</span>
                       </div>
                    </td>
                    <td className="px-12 py-6 text-center">
                       <div className="text-lg font-black text-slate-900 tabular-nums italic">{s.currentQty}</div>
                       <div className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">{s.unit} UNIT</div>
                    </td>
                    <td className="px-12 py-6 text-right">
                       <div className="text-xl font-black text-slate-900 tabular-nums italic tracking-tighter">${s.valuation.toLocaleString()}</div>
                       <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Cost Basis</div>
                    </td>
                    <td className="px-12 py-6 text-right">
                       <ActionMenu actions={getItemActions(s)} label="Forensic" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Forensic Stock Ledger Modal-like View */}
      {activeView === 'LEDGER' && selectedItem && (
        <div className="bg-white rounded-[3.5rem] border-4 border-indigo-600 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
           <div className="p-10 bg-slate-950 text-white flex justify-between items-center relative overflow-hidden">
              <div className="relative z-10">
                 <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-2xl shadow-lg transform -rotate-3">📜</div>
                    <h4 className="text-2xl font-black italic uppercase tracking-tighter">Stock Ledger: {selectedItem.name}</h4>
                 </div>
                 <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-indigo-400 mt-2">Chronological Movement Audit • Reconciled Registry</p>
              </div>
              <button onClick={() => setActiveView('LIST')} className="relative z-10 px-8 py-3 bg-white/10 hover:bg-rose-500 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">Close Shard</button>
           </div>
           <div className="p-10">
              <table className="w-full text-left">
                 <thead className="bg-slate-50 text-[9px] font-black uppercase text-slate-500 border-b border-slate-100">
                    <tr>
                       <th className="px-8 py-5">Date</th>
                       <th className="px-8 py-5">Voucher Hash / Class</th>
                       <th className="px-8 py-5">Counterparty</th>
                       <th className="px-8 py-5 text-right">Inward</th>
                       <th className="px-8 py-5 text-right">Outward</th>
                       <th className="px-8 py-5 text-right bg-indigo-50/30">Node Bal</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                    {itemLedgerData.map((log, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80 transition-colors group">
                         <td className="px-8 py-4 text-xs font-bold text-slate-400">{log.date}</td>
                         <td className="px-8 py-4">
                            <button onClick={() => onViewVoucher?.(log.id)} className="text-[11px] font-black text-indigo-600 uppercase italic hover:underline">#{log.id}</button>
                            <div className="text-[8px] font-bold text-slate-300 uppercase">{log.type}</div>
                         </td>
                         <td className="px-8 py-4 text-xs font-black text-slate-700 uppercase italic">{log.party}</td>
                         <td className="px-8 py-4 text-right text-emerald-600 font-black tabular-nums">{log.inward > 0 ? `+${log.inward}` : '-'}</td>
                         <td className="px-8 py-4 text-right text-rose-600 font-black tabular-nums">{log.outward > 0 ? `-${log.outward}` : '-'}</td>
                         <td className="px-8 py-4 text-right bg-indigo-50/20 font-black text-slate-900 tabular-nums">{log.balance}</td>
                      </tr>
                    ))}
                    {itemLedgerData.length === 0 && (
                      <tr><td colSpan={6} className="py-20 text-center text-slate-300 italic font-black uppercase text-[10px] tracking-widest">No transaction shards detected for this item.</td></tr>
                    )}
                 </tbody>
              </table>
           </div>
        </div>
      )}

      {/* Batch History View */}
      {activeView === 'BATCHES' && selectedItem && (
        <div className="bg-white rounded-[3.5rem] border-4 border-blue-600 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
           <div className="p-10 bg-slate-950 text-white flex justify-between items-center relative overflow-hidden">
              <div className="relative z-10">
                 <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-2xl shadow-lg transform rotate-6">📦</div>
                    <h4 className="text-2xl font-black italic uppercase tracking-tighter">Batch Registry: {selectedItem.name}</h4>
                 </div>
                 <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-blue-400 mt-2">Life-Cycle Tracking • Expiry Forensics</p>
              </div>
              <button onClick={() => setActiveView('LIST')} className="relative z-10 px-8 py-3 bg-white/10 hover:bg-rose-500 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">Back to Vault</button>
           </div>
           <div className="p-10">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {itemBatches.map(b => (
                   <div key={b.id} className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 shadow-sm group hover:border-blue-300 transition-all hover:-translate-y-1">
                      <div className="flex justify-between items-start mb-6">
                         <div className="px-3 py-1 bg-blue-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest shadow-md">Lot: {b.batchNo}</div>
                         <div className="text-right">
                            <div className="text-[8px] font-black text-slate-400 uppercase mb-1">Current Stock</div>
                            <div className="text-2xl font-black text-slate-800 italic tabular-nums">{b.currentStock} <span className="text-[9px] not-italic text-slate-400">{selectedItem.unit}</span></div>
                         </div>
                      </div>
                      <div className="space-y-4 pt-4 border-t border-slate-200">
                         <div className="flex justify-between items-center">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">MFG Date</span>
                            <span className="text-xs font-black text-slate-800">{b.mfgDate}</span>
                         </div>
                         <div className="flex justify-between items-center">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Expiry Window</span>
                            <span className={`text-xs font-black ${new Date(b.expiryDate) < new Date() ? 'text-rose-600 underline underline-offset-4' : 'text-slate-800'}`}>{b.expiryDate}</span>
                         </div>
                      </div>
                   </div>
                 ))}
                 {itemBatches.length === 0 && (
                   <div className="col-span-3 py-20 text-center bg-slate-50 rounded-[3rem] border border-dashed border-slate-200">
                      <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em] italic">Zero Batches Registerd for this entity.</p>
                   </div>
                 )}
              </div>
           </div>
        </div>
      )}

      {/* Stock Adjustment Form */}
      {activeView === 'ADJUST' && selectedItem && (
        <div className="bg-white rounded-[3.5rem] border-4 border-rose-600 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 max-w-2xl mx-auto">
           <div className="p-10 bg-slate-950 text-white flex justify-between items-center relative overflow-hidden">
              <div className="relative z-10">
                 <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-rose-600 rounded-2xl flex items-center justify-center text-2xl shadow-lg">🔧</div>
                    <h4 className="text-2xl font-black italic uppercase tracking-tighter">Stock Adjustment</h4>
                 </div>
                 <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-rose-400 mt-2">Identity correction: {selectedItem.name}</p>
              </div>
              <button onClick={() => setActiveView('LIST')} className="relative z-10 p-3 hover:bg-white/10 rounded-full transition-all">
                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
           </div>
           <form onSubmit={handleAdjustSubmit} className="p-12 space-y-10">
              <div className="grid grid-cols-2 gap-8">
                 <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Correction Class</label>
                    <div className="flex p-1 bg-slate-100 rounded-2xl border border-slate-200 shadow-inner">
                       {(['Add', 'Less'] as const).map(type => (
                         <button key={type} type="button" onClick={() => setAdjustmentType(type)} className={`flex-1 py-4 text-[10px] font-black uppercase rounded-xl transition-all ${adjustmentType === type ? 'bg-white text-rose-600 shadow-lg scale-105' : 'text-slate-400 hover:text-slate-600'}`}>{type === 'Add' ? 'Increment (+)' : 'Decrement (-)'}</button>
                       ))}
                    </div>
                 </div>
                 <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Quantity Offset</label>
                    <div className="relative">
                       <input type="number" value={adjustmentQty} onChange={e => setAdjustmentQty(parseFloat(e.target.value) || 0)} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xl font-black text-slate-800 outline-none focus:ring-8 focus:ring-rose-500/5 shadow-inner" />
                       <span className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300 uppercase">{selectedItem.unit}</span>
                    </div>
                 </div>
              </div>
              <div className="space-y-3">
                 <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Forensic Justification</label>
                 <textarea value={adjustmentNarration} onChange={e => setAdjustmentNarration(e.target.value)} placeholder="State the reason for this inventory correction (e.g. Physical Verification, Damaged Stock, Audit Variance)..." className="w-full h-32 px-8 py-6 rounded-[2rem] border border-slate-200 bg-slate-50 text-sm font-medium italic outline-none focus:ring-8 focus:ring-rose-500/5 resize-none leading-relaxed" />
              </div>

              <div className="pt-6 border-t border-slate-100 flex justify-end gap-4">
                 <button type="button" onClick={() => setActiveView('LIST')} className="px-10 py-5 rounded-2xl text-slate-400 font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all">Abort</button>
                 <button type="submit" disabled={adjustmentQty <= 0} className="px-14 py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:bg-rose-600 transition-all transform active:scale-95 border-b-8 border-slate-950 disabled:bg-slate-100 disabled:text-slate-300 disabled:border-none">Commit Correction</button>
              </div>
           </form>
        </div>
      )}
    </div>
  );
};

export default InventorySummary;