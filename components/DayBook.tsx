import React, { useState, useMemo } from 'react';
import { Voucher, VoucherType } from '../types';
import ActionMenu, { ActionItem } from './ActionMenu';
import * as XLSX from 'xlsx';

interface DayBookProps {
  vouchers: Voucher[];
  onClone?: (v: Voucher) => void;
  onDelete?: (id: string) => void;
  onViewVoucher?: (id: string) => void;
}

const DayBook: React.FC<DayBookProps> = ({ vouchers, onClone, onDelete, onViewVoucher }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('All');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [amountRange, setAmountRange] = useState({ min: '', max: '' });
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    return vouchers.filter(v => {
      const matchesSearch = v.party.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           v.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'All' || v.type === filterType;
      
      const vDate = new Date(v.date);
      const matchesStart = !dateRange.start || vDate >= new Date(dateRange.start);
      const matchesEnd = !dateRange.end || vDate <= new Date(dateRange.end);
      
      const matchesMin = !amountRange.min || v.amount >= parseFloat(amountRange.min);
      const matchesMax = !amountRange.max || v.amount <= parseFloat(amountRange.max);

      return matchesSearch && matchesType && matchesStart && matchesEnd && matchesMin && matchesMax;
    });
  }, [vouchers, searchTerm, filterType, dateRange, amountRange]);

  const stats = useMemo(() => {
    const gross = filtered.reduce((acc, v) => acc + v.amount, 0);
    const count = filtered.length;
    return { gross, count };
  }, [filtered]);

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filtered);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Transactions");
    XLSX.writeFile(wb, `Nexus_Daybook_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const getVoucherActions = (v: Voucher): ActionItem[] => [
    { label: 'Inspect Record', icon: '👁️', onClick: () => onViewVoucher?.(v.id), variant: 'primary' },
    { label: 'Clone Transaction', icon: '📋', onClick: () => onClone?.(v) },
    { label: 'Purge Context', icon: '🗑️', onClick: () => onDelete?.(v.id), variant: 'danger' }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      {/* Search & Filter Trigger */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-8 bg-white p-8 rounded-[3.5rem] border border-slate-200 shadow-sm">
        <div className="flex-1 max-w-2xl">
           <div className="relative group">
              <input 
                type="text" 
                placeholder="Search Identity or Transaction Hash..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                className="w-full pl-14 pr-6 py-4 rounded-3xl border border-slate-200 bg-slate-50 text-sm font-bold shadow-inner outline-none focus:ring-8 focus:ring-indigo-500/5 transition-all italic" 
              />
              <svg className="w-6 h-6 text-slate-300 absolute left-5 top-4 group-focus-within:text-indigo-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
           </div>
        </div>

        <div className="flex items-center space-x-4 shrink-0">
           <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`px-6 py-4 rounded-3xl text-xs font-black uppercase tracking-widest transition-all flex items-center space-x-2 border-2 ${showFilters ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-white border-slate-200 text-slate-400 hover:border-indigo-300'}`}
           >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
              <span>{showFilters ? 'Close Audit Filters' : 'Audit Filters'}</span>
           </button>
           <button onClick={exportToExcel} className="p-4 bg-emerald-600 text-white rounded-3xl shadow-xl hover:bg-emerald-700 transition-all transform active:scale-95 shadow-emerald-200 border-b-4 border-emerald-800">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
           </button>
        </div>
      </div>

      {/* Advanced Filter Panel */}
      {showFilters && (
        <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-2xl animate-in slide-in-from-top-4 duration-300">
           <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Temporal Shard (Date)</label>
                 <div className="flex items-center space-x-2">
                    <input type="date" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-4 focus:ring-indigo-500/5 outline-none" />
                    <span className="text-slate-300 font-black text-[10px]">TO</span>
                    <input type="date" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-4 focus:ring-indigo-500/5 outline-none" />
                 </div>
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Monetary Range ($)</label>
                 <div className="flex items-center space-x-2">
                    <input type="number" placeholder="Min" value={amountRange.min} onChange={e => setAmountRange({...amountRange, min: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-4 focus:ring-indigo-500/5 outline-none" />
                    <input type="number" placeholder="Max" value={amountRange.max} onChange={e => setAmountRange({...amountRange, max: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-4 focus:ring-indigo-500/5 outline-none" />
                 </div>
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Voucher Class</label>
                 <select 
                  value={filterType} 
                  onChange={e => setFilterType(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-indigo-600 outline-none"
                 >
                    <option value="All">All Classifications</option>
                    {['Sales', 'Purchase', 'Payment', 'Receipt', 'Contra', 'Journal'].map(t => <option key={t} value={t}>{t}</option>)}
                 </select>
              </div>
              <div className="flex items-end">
                 <button 
                  onClick={() => { setFilterType('All'); setDateRange({start: '', end: ''}); setAmountRange({min: '', max: ''}); setSearchTerm(''); }}
                  className="w-full py-2.5 bg-slate-100 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-50 hover:text-rose-600 transition-all"
                 >
                   Flush Parameters
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Main Registry */}
      <div className="bg-white rounded-[4rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
        <div className="px-12 py-10 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
           <div className="space-y-1">
              <h3 className="text-xl font-black italic text-slate-800 uppercase leading-none">Day Book Registry</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Temporal Log • Shard 44.X</p>
           </div>
           <div className="flex items-end space-x-10">
              <div className="text-right">
                 <div className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">Result Volume</div>
                 <div className="text-2xl font-black italic text-slate-800 tabular-nums">{stats.count} Objects</div>
              </div>
              <div className="text-right">
                 <div className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">Aggregate Net</div>
                 <div className="text-2xl font-black italic text-emerald-600 tabular-nums">${stats.gross.toLocaleString()}</div>
              </div>
           </div>
        </div>

        <div className="overflow-x-auto flex-1 custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-950 text-[10px] uppercase font-black tracking-widest text-slate-500 border-b border-slate-900 sticky top-0 z-10">
              <tr>
                <th className="px-12 py-8">Audit Identification</th>
                <th className="px-12 py-8">Classification</th>
                <th className="px-12 py-8">Counterparty Master</th>
                <th className="px-12 py-8 text-right">Resolved Value ($)</th>
                <th className="px-12 py-8 text-center">Status</th>
                <th className="px-12 py-8 text-right">Operations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 bg-white">
              {filtered.map((v) => (
                <tr key={v.id} className="hover:bg-indigo-50/20 transition-all group border-b border-slate-50 last:border-0" onClick={() => onViewVoucher?.(v.id)}>
                  <td className="px-12 py-8">
                    <div className="font-black text-slate-800 text-base tracking-tighter italic group-hover:text-indigo-600 transition-colors">#{v.id}</div>
                    <div className="text-[10px] text-slate-400 uppercase font-black mt-2 tracking-widest">{v.date}</div>
                  </td>
                  <td className="px-12 py-8">
                    <span className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] border shadow-sm ${
                      v.type === 'Sales' || v.type === 'Receipt' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                      v.type === 'Purchase' || v.type === 'Payment' ? 'bg-rose-50 text-rose-600 border-rose-100' : 
                      'bg-indigo-50 text-indigo-600 border-indigo-100'
                    }`}>{v.type}</span>
                  </td>
                  <td className="px-12 py-8">
                    <span className="text-sm font-black text-slate-900 uppercase italic tracking-tight">{v.party}</span>
                  </td>
                  <td className="px-12 py-8 text-right font-black text-slate-900 tabular-nums text-xl italic tracking-tighter">${v.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td className="px-12 py-8 text-center">
                    <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase border tracking-widest ${
                      v.status === 'Posted' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-amber-50 text-amber-600 border-amber-200'
                    }`}>{v.status}</span>
                  </td>
                  <td className="px-12 py-8 text-right" onClick={e => e.stopPropagation()}>
                    <ActionMenu actions={getVoucherActions(v)} />
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-40 text-center opacity-30 italic flex flex-col items-center">
                    <div className="text-6xl mb-6">📂</div>
                    <p className="text-sm font-black uppercase tracking-[0.4em]">Zero Matching Records</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DayBook;
