import React, { useMemo } from 'react';
import { Item, Voucher } from '../types';
import ActionMenu, { ActionItem } from './ActionMenu';

interface InventorySummaryProps {
  items: Item[];
  vouchers: Voucher[];
}

const InventorySummary: React.FC<InventorySummaryProps> = ({ items, vouchers }) => {
  const stockData = useMemo(() => {
    return items.map(item => {
      let qtyIn = 0;
      let qtyOut = 0;
      
      vouchers.forEach(v => {
        if (v.items) {
          const vItem = v.items.find(vi => vi.itemId === item.id);
          if (vItem) {
            if (v.type === 'Purchase') qtyIn += vItem.qty;
            if (v.type === 'Sales') qtyOut += vItem.qty;
          }
        }
      });

      const currentQty = qtyIn - qtyOut;
      const valuation = currentQty * item.salePrice;
      return { ...item, currentQty, valuation };
    });
  }, [items, vouchers]);

  const totalValuation = stockData.reduce((acc, s) => acc + s.valuation, 0);

  const getItemActions = (item: any): ActionItem[] => [
    { 
      label: 'Stock Ledger', 
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>,
      onClick: () => alert(`Opening chronological stock ledger for ${item.name}...`),
      variant: 'primary'
    },
    { 
      label: 'Batch History', 
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>,
      onClick: () => alert(`Analyzing batch-wise procurement for ${item.name}...`)
    },
    { 
      label: 'Adjust Stock', 
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m12 4a2 2 0 100-4m0 4a2 2 0 110-4" /></svg>,
      onClick: () => alert(`Initializing physical stock verification for ${item.name}...`),
      variant: 'danger'
    }
  ];

  return (
    <div className="bg-white rounded-[3rem] border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in duration-500">
      <div className="bg-rose-600 p-12 text-white flex justify-between items-center">
         <div>
            <h3 className="text-3xl font-black italic uppercase tracking-tighter">Inventory Valuation</h3>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80 mt-2">Real-time Stock Asset Control</p>
         </div>
         <div className="text-right">
            <div className="text-[10px] font-black uppercase tracking-widest opacity-60">Inventory Assets</div>
            <div className="text-2xl font-black">${totalValuation.toLocaleString()}</div>
         </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-900 text-[10px] font-black uppercase text-slate-400">
            <tr>
              <th className="px-12 py-6">Item Descriptor</th>
              <th className="px-12 py-6">Classification</th>
              <th className="px-12 py-6 text-center">Closing Qty</th>
              <th className="px-12 py-6 text-center">Unit</th>
              <th className="px-12 py-6 text-right">Inventory Value</th>
              <th className="px-12 py-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {stockData.map((s, i) => (
              <tr key={i} className="hover:bg-slate-50 transition-colors group">
                <td className="px-12 py-5 font-black text-slate-800 italic">{s.name}</td>
                <td className="px-12 py-5"><span className="px-3 py-1 bg-rose-50 text-rose-600 rounded-lg text-[9px] font-black uppercase border border-rose-100">{s.category}</span></td>
                <td className="px-12 py-5 text-center font-black text-indigo-600">{s.currentQty}</td>
                <td className="px-12 py-5 text-center text-xs font-bold text-slate-400">{s.unit}</td>
                <td className="px-12 py-5 text-right font-black text-slate-900">${s.valuation.toLocaleString()}</td>
                <td className="px-12 py-5 text-right">
                   <ActionMenu actions={getItemActions(s)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {stockData.length === 0 && (
        <div className="py-20 text-center text-slate-400 italic">No stock movements recorded in active session.</div>
      )}
    </div>
  );
};

export default InventorySummary;