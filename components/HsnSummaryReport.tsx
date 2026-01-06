import React, { useState, useMemo } from 'react';
import { Voucher } from '../types';

interface HsnSummaryReportProps {
  vouchers: Voucher[];
  activeCompany: any;
}

interface HsnEntry {
  hsn: string;
  desc: string;
  uom: string;
  qty: number;
  taxable: number;
  tax: number;
}

const HsnSummaryReport: React.FC<HsnSummaryReportProps> = ({ vouchers, activeCompany }) => {
  const [sortKey, setSortKey] = useState<keyof HsnEntry>('hsn');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const hsnData = useMemo(() => {
    const map: Record<string, HsnEntry> = {};
    vouchers.forEach(v => {
      v.items?.forEach(item => {
        const code = item.hsn || 'N/A';
        if (!map[code]) map[code] = { hsn: code, desc: item.name, uom: item.unit || 'Nos', qty: 0, taxable: 0, tax: 0 };
        const factor = (v.type.includes('Return') || v.type === 'Credit Note' || v.type === 'Debit Note') ? -1 : 1;
        map[code].qty += item.qty * factor;
        map[code].taxable += item.amount * factor;
        map[code].tax += (item.taxAmount || 0) * factor;
      });
    });

    const result = Object.values(map);
    return result.sort((a, b) => {
      const valA = a[sortKey];
      const valB = b[sortKey];
      if (typeof valA === 'string' && typeof valB === 'string') {
          return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      if (typeof valA === 'number' && typeof valB === 'number') {
          return sortOrder === 'asc' ? valA - valB : valB - valA;
      }
      return 0;
    });
  }, [vouchers, sortKey, sortOrder]);

  const handleSort = (key: keyof HsnEntry) => {
    if (sortKey === key) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortOrder('asc'); }
  };

  const SortIndicator = ({ k }: { k: keyof HsnEntry }) => {
    if (sortKey !== k) return <span className="ml-1 opacity-20">↕</span>;
    return <span className="ml-1 text-white">{sortOrder === 'asc' ? '↑' : '↓'}</span>;
  };

  return (
    <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-500 max-w-5xl mx-auto">
      <div className="p-10 bg-slate-900 text-white flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-black italic uppercase tracking-tighter">HSN/SAC Aggregate Summary</h3>
          <p className="text-[10px] font-bold text-sky-400 uppercase tracking-widest mt-2">Verified Ledger Shards • {activeCompany.name}</p>
        </div>
        <button onClick={() => window.print()} className="px-6 py-2.5 bg-sky-600 text-white rounded-xl text-[10px] font-black uppercase shadow-lg transition-all transform active:scale-95 hover:bg-sky-500">Print Report</button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-950 text-[9px] font-black uppercase text-slate-400 tracking-widest">
            <tr>
              <th className="px-10 py-6 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('hsn')}>Code Node <SortIndicator k="hsn" /></th>
              <th className="px-10 py-6">Description</th>
              <th className="px-10 py-6 text-center cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('qty')}>Volume <SortIndicator k="qty" /></th>
              <th className="px-10 py-6 text-right cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('taxable')}>Taxable Point <SortIndicator k="taxable" /></th>
              <th className="px-10 py-6 text-right cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('tax')}>Tax Yield <SortIndicator k="tax" /></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {hsnData.map(row => (
              <tr key={row.hsn} className="hover:bg-slate-50 transition-colors">
                <td className="px-10 py-5 font-mono text-xs font-black text-sky-600">{row.hsn}</td>
                <td className="px-10 py-5 text-sm font-black text-slate-800 uppercase italic">{row.desc}</td>
                <td className="px-10 py-5 text-center font-black tabular-nums">{row.qty} <span className="text-[9px] text-slate-400">{row.uom}</span></td>
                <td className="px-10 py-5 text-right font-black tabular-nums italic text-slate-900">${row.taxable.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                <td className="px-10 py-5 text-right font-black text-sky-600 tabular-nums">${row.tax.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HsnSummaryReport;