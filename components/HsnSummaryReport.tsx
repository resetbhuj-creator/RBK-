import React, { useState, useMemo } from 'react';
import { Voucher } from '../types';
import ActionMenu from './ActionMenu';

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

type SortKey = 'hsn' | 'qty' | 'taxable' | 'tax' | 'desc';
type SortOrder = 'asc' | 'desc';

const HsnSummaryReport: React.FC<HsnSummaryReportProps> = ({ vouchers, activeCompany }) => {
  const [dateRange, setDateRange] = useState({ 
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0], 
    end: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0] 
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('hsn');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const hsnData = useMemo(() => {
    const map: Record<string, HsnEntry> = {};
    
    const filteredVouchers = vouchers.filter(v => {
      const vDate = new Date(v.date);
      const inRange = vDate >= new Date(dateRange.start) && vDate <= new Date(dateRange.end);
      return inRange && (v.type === 'Sales' || v.type === 'Sales Return' || v.type === 'Purchase' || v.type === 'Purchase Return');
    });

    filteredVouchers.forEach(v => {
      const factor = (v.type.includes('Return') || v.type === 'Debit Note') ? -1 : 1;
      v.items?.forEach(item => {
        const code = item.hsn || 'N/A';
        if (!map[code]) {
          map[code] = { hsn: code, desc: item.name, uom: item.unit || 'Nos', qty: 0, taxable: 0, tax: 0 };
        }
        map[code].qty += item.qty * factor;
        map[code].taxable += item.amount * factor;
        map[code].tax += (item.taxAmount || 0) * factor;
      });
    });

    const result = Object.values(map).filter(e => 
      e.hsn.toLowerCase().includes(searchTerm.toLowerCase()) || 
      e.desc.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Sorting Logic
    return result.sort((a, b) => {
      let valA: any = a[sortKey];
      let valB: any = b[sortKey];

      if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [vouchers, dateRange, searchTerm, sortKey, sortOrder]);

  const totals = useMemo(() => {
    return hsnData.reduce((acc, curr) => ({
      taxable: acc.taxable + curr.taxable,
      tax: acc.tax + curr.tax,
      count: acc.count + 1
    }), { taxable: 0, tax: 0, count: 0 });
  }, [hsnData]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  const SortIcon = ({ field }: { field: SortKey }) => {
    if (sortKey !== field) return <span className="ml-1 opacity-20 group-hover:opacity-100 transition-opacity">↕</span>;
    return <span className="ml-1 text-sky-500">{sortOrder === 'asc' ? '↑' : '↓'}</span>;
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500 max-w-7xl mx-auto pb-20">
      <div className="bg-slate-900 rounded-[3.5rem] p-12 text-white relative overflow-hidden shadow-2xl border-b-8 border-sky-600">
         <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-10">
            <div>
               <div className="flex items-center space-x-6 mb-6">
                  <div className="w-16 h-16 rounded-[1.5rem] bg-sky-600 flex items-center justify-center shadow-2xl border-4 border-sky-400/20 transform rotate-3">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  </div>
                  <h2 className="text-4xl font-black italic tracking-tighter uppercase leading-none">HSN/SAC Aggregate Summary</h2>
               </div>
               <p className="text-sm text-slate-400 font-medium max-w-md">Statutory code-wise reconstruction of inventory supply shards and tax yields.</p>
            </div>

            <div className="flex items-center space-x-6 bg-white/5 backdrop-blur-md p-6 rounded-[2.2rem] border border-white/10">
               <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase text-sky-400 tracking-widest ml-1">Reporting Period</label>
                  <div className="flex items-center space-x-2">
                     <input type="date" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-xs font-black text-white outline-none focus:ring-2 focus:ring-sky-500" />
                     <span className="text-slate-600 font-black text-[9px]">TO</span>
                     <input type="date" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})} className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-xs font-black text-white outline-none focus:ring-2 focus:ring-sky-500" />
                  </div>
               </div>
            </div>
         </div>
         <div className="absolute top-0 right-0 w-96 h-96 bg-sky-600 rounded-full blur-[150px] opacity-10 -mr-32 -mt-32"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         {[
           { label: 'Aggregate Taxable', value: totals.taxable, color: 'text-slate-800', bg: 'bg-white' },
           { label: 'Statutory Tax Yield', value: totals.tax, color: 'text-sky-600', bg: 'bg-sky-50' },
           { label: 'Unique Code Blocks', value: totals.count, color: 'text-emerald-600', bg: 'bg-emerald-50', isValue: false }
         ].map((stat, i) => (
           <div key={i} className={`p-8 rounded-[2.5rem] border border-slate-200 shadow-sm group hover:-translate-y-1 transition-all ${stat.bg}`}>
              <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 group-hover:text-sky-600 transition-colors">{stat.label}</div>
              <div className={`text-4xl font-black italic tracking-tighter tabular-nums ${stat.color}`}>
                {stat.isValue !== false ? `$${stat.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : stat.value}
              </div>
           </div>
         ))}
      </div>

      <div className="bg-white rounded-[4rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
         <div className="p-10 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="relative max-w-md w-full group">
               <input 
                 type="text" 
                 placeholder="Search by HSN or Description..." 
                 value={searchTerm}
                 onChange={e => setSearchTerm(e.target.value)}
                 className="w-full pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-3xl text-sm font-black italic outline-none focus:ring-8 focus:ring-sky-500/5 shadow-inner"
               />
               <svg className="w-6 h-6 text-slate-300 absolute left-4 top-4 group-focus-within:text-sky-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <button onClick={() => window.print()} className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-sky-600 transition-all shadow-xl">Export Summary</button>
         </div>

         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead className="bg-slate-950 text-[9px] font-black uppercase text-slate-400 tracking-widest">
                  <tr>
                     <th 
                       className="px-10 py-7 cursor-pointer group hover:text-white transition-colors"
                       onClick={() => handleSort('hsn')}
                     >
                       <div className="flex items-center">
                         Regulatory Code Shard <SortIcon field="hsn" />
                       </div>
                     </th>
                     <th 
                       className="px-10 py-7 cursor-pointer group hover:text-white transition-colors"
                       onClick={() => handleSort('desc')}
                     >
                       <div className="flex items-center">
                         Canonical Description <SortIcon field="desc" />
                       </div>
                     </th>
                     <th 
                       className="px-10 py-7 text-center cursor-pointer group hover:text-white transition-colors"
                       onClick={() => handleSort('qty')}
                     >
                       <div className="flex items-center justify-center">
                         Cumulative Qty <SortIcon field="qty" />
                       </div>
                     </th>
                     <th 
                       className="px-10 py-7 text-right cursor-pointer group hover:text-white transition-colors"
                       onClick={() => handleSort('taxable')}
                     >
                       <div className="flex items-center justify-end">
                         Taxable Aggregate <SortIcon field="taxable" />
                       </div>
                     </th>
                     <th 
                       className="px-10 py-7 text-right bg-sky-50/20 text-sky-600 cursor-pointer group hover:text-sky-400 transition-colors"
                       onClick={() => handleSort('tax')}
                     >
                       <div className="flex items-center justify-end">
                         Tax Component <SortIcon field="tax" />
                       </div>
                     </th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-50 bg-white">
                  {hsnData.map((row, i) => (
                    <tr key={i} className="hover:bg-sky-50/20 transition-all group border-b border-slate-50 last:border-0">
                       <td className="px-10 py-6">
                          <div className="px-5 py-2 bg-slate-900 text-sky-400 rounded-xl text-xs font-black inline-block border border-slate-800 shadow-lg font-mono tracking-widest group-hover:scale-110 transition-transform">
                             {row.hsn}
                          </div>
                       </td>
                       <td className="px-10 py-6 text-sm font-black text-slate-800 uppercase italic group-hover:text-sky-700 transition-colors">{row.desc}</td>
                       <td className="px-10 py-6 text-center">
                          <div className="text-lg font-black text-slate-900 tabular-nums italic">{row.qty}</div>
                          <div className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">{row.uom}</div>
                       </td>
                       <td className="px-10 py-6 text-right font-black tabular-nums italic text-sm underline decoration-slate-100 underline-offset-4">${row.taxable.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                       <td className="px-10 py-6 text-right font-black tabular-nums text-sky-600 text-base bg-sky-50/10 group-hover:bg-sky-50/20 transition-all">${row.tax.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    </tr>
                  ))}
                  {hsnData.length === 0 && (
                    <tr><td colSpan={5} className="py-48 text-center opacity-30 italic font-black uppercase text-[10px] tracking-[0.5em]">Forensic Buffer Empty</td></tr>
                  )}
               </tbody>
               <tfoot className="bg-slate-900 text-white">
                  <tr className="font-black italic">
                     <td colSpan={3} className="px-10 py-8 text-xs uppercase tracking-[0.4em]">Sovereign Aggregates</td>
                     <td className="px-10 py-8 text-right text-2xl tabular-nums tracking-tighter">${totals.taxable.toLocaleString()}</td>
                     <td className="px-10 py-8 text-right text-2xl tabular-nums tracking-tighter text-sky-400 border-l border-white/5">${totals.tax.toLocaleString()}</td>
                  </tr>
               </tfoot>
            </table>
         </div>
      </div>

      <div className="p-12 bg-slate-900 border-4 border-slate-800 rounded-[3.5rem] flex flex-col md:flex-row items-center gap-12 shadow-2xl relative overflow-hidden group">
         <div className="w-24 h-24 bg-sky-600 rounded-3xl flex items-center justify-center text-4xl shadow-2xl shadow-sky-900/40 shrink-0 transform -rotate-6 transition-transform group-hover:rotate-0 border-4 border-sky-400/20 z-10">📑</div>
         <div className="space-y-4 relative z-10">
            <h5 className="text-xl font-black uppercase italic tracking-widest text-white flex items-center">
              HSN/SAC Aggregator Protocol
              <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse ml-4 shadow-[0_0_12px_#10b981]"></div>
            </h5>
            <p className="text-sm font-medium text-slate-400 leading-relaxed italic max-w-4xl">
              "The Nexus statutory engine performs per-line item reconstruction. This report maps transacted quantities and values to unique HSN shards, ensuring that your outward and inward supply summaries are mathematically reconciled with the GSTR-1 Table 12 and GSTR-2 aggregates."
            </p>
         </div>
         <div className="absolute top-0 right-0 w-80 h-80 bg-sky-600 rounded-full blur-[150px] opacity-10 -mr-40 -mt-40 pointer-events-none group-hover:opacity-20 transition-opacity"></div>
      </div>
    </div>
  );
};

export default HsnSummaryReport;