import React, { useState, useMemo } from 'react';
import { Voucher } from '../types';
import ActionMenu, { ActionItem } from './ActionMenu';

interface DayBookProps {
  vouchers: Voucher[];
  onClone?: (v: Voucher) => void;
  onViewVoucher?: (id: string) => void;
}

const DayBook: React.FC<DayBookProps> = ({ vouchers, onClone, onViewVoucher }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Advanced Filters
  const [minAmount, setMinAmount] = useState<string>('');
  const [maxAmount, setMaxAmount] = useState<string>('');
  const [datePreset, setDatePreset] = useState<'All' | 'Today' | 'Week' | 'Month'>('All');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const filtered = useMemo(() => {
    return vouchers.filter(v => {
      const matchesSearch = v.party.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           v.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'All' || v.type === filterType;
      
      const vAmount = v.amount;
      const matchesMin = minAmount === '' || vAmount >= parseFloat(minAmount);
      const matchesMax = maxAmount === '' || vAmount <= parseFloat(maxAmount);
      
      const vDate = new Date(v.date);
      vDate.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      let matchesDate = true;
      
      // Preset Logic
      if (datePreset === 'Today') {
        matchesDate = vDate.getTime() === today.getTime();
      } else if (datePreset === 'Week') {
        const lastWeek = new Date();
        lastWeek.setDate(today.getDate() - 7);
        lastWeek.setHours(0, 0, 0, 0);
        matchesDate = vDate >= lastWeek;
      } else if (datePreset === 'Month') {
        matchesDate = vDate.getMonth() === today.getMonth() && vDate.getFullYear() === today.getFullYear();
      }

      // Custom Range Logic (Explicit override/addition)
      if (startDate !== '') {
        const s = new Date(startDate);
        s.setHours(0, 0, 0, 0);
        if (vDate < s) matchesDate = false;
      }
      if (endDate !== '') {
        const e = new Date(endDate);
        e.setHours(0, 0, 0, 0);
        if (vDate > e) matchesDate = false;
      }

      return matchesSearch && matchesType && matchesMin && matchesMax && matchesDate;
    });
  }, [vouchers, searchTerm, filterType, minAmount, maxAmount, datePreset, startDate, endDate]);

  const totals = useMemo(() => filtered.reduce((acc, v) => acc + v.amount, 0), [filtered]);

  const getVoucherActions = (v: Voucher): ActionItem[] => [
    { 
      label: 'View / Print', 
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>,
      onClick: () => onViewVoucher?.(v.id),
      variant: 'primary'
    },
    { 
      label: 'Duplicate Entry', 
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" /></svg>,
      onClick: () => onClone?.(v)
    },
    { 
      label: 'Void Voucher', 
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>,
      onClick: () => { if(confirm('Are you sure you want to void this transaction? Integrity logs will capture this event.')) alert('Voucher voided.'); },
      variant: 'danger'
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight italic uppercase">Chronological Day Book</h2>
          <p className="text-sm text-slate-500 font-medium">Comprehensive audit trail of verified transactional movements.</p>
        </div>
        <div className="bg-indigo-600 px-8 py-5 rounded-[2.5rem] text-white shadow-2xl shadow-indigo-900/30 flex items-center space-x-10 relative overflow-hidden group">
           <div className="relative z-10 border-r border-white/20 pr-10">
             <div className="text-[9px] font-black uppercase tracking-widest opacity-70 mb-1">Aggregate Vol.</div>
             <div className="text-2xl font-black italic tabular-nums">${totals.toLocaleString()}</div>
           </div>
           <div className="relative z-10">
              <div className="text-[9px] font-black uppercase tracking-widest opacity-70 mb-1">Entries</div>
              <div className="text-2xl font-black italic tabular-nums">{filtered.length}</div>
           </div>
           <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-white/20 transition-all"></div>
        </div>
      </div>

      <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center space-x-4 flex-1 w-full max-w-xl">
             <div className="relative flex-1">
                <input type="text" placeholder="Search party, ID or reference..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-12 pr-6 py-4 rounded-2xl border border-slate-200 bg-white text-sm font-bold shadow-sm outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all" />
                <svg className="w-5 h-5 text-slate-300 absolute left-4 top-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
             </div>
             <button onClick={() => setShowAdvanced(!showAdvanced)} className={`p-4 rounded-2xl transition-all border ${showAdvanced ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg' : 'bg-white text-slate-400 border-slate-200 hover:text-indigo-600'}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
             </button>
          </div>
          <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 overflow-x-auto no-scrollbar">
            {['All', 'Sales', 'Purchase', 'Payment', 'Receipt'].map(t => (
              <button key={t} onClick={() => setFilterType(t)} className={`px-6 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${filterType === t ? 'bg-white text-indigo-600 shadow-md scale-105' : 'text-slate-400 hover:text-slate-600'}`}>{t}</button>
            ))}
          </div>
        </div>

        {showAdvanced && (
           <div className="p-8 bg-white border-b border-slate-100 grid grid-cols-1 md:grid-cols-4 gap-10 animate-in slide-in-from-top-4 duration-500">
              <div className="space-y-3">
                 <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Amount Thresholds</label>
                 <div className="flex items-center space-x-3">
                    <input type="number" placeholder="Min" value={minAmount} onChange={e => setMinAmount(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-100 bg-slate-50 text-xs font-bold focus:ring-2 focus:ring-indigo-500" />
                    <span className="text-slate-300">—</span>
                    <input type="number" placeholder="Max" value={maxAmount} onChange={e => setMaxAmount(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-100 bg-slate-50 text-xs font-bold focus:ring-2 focus:ring-indigo-500" />
                 </div>
              </div>
              <div className="space-y-3">
                 <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Period Presets</label>
                 <div className="grid grid-cols-2 gap-2">
                    {(['All', 'Today', 'Week', 'Month'] as const).map(p => (
                      <button key={p} onClick={() => setDatePreset(p)} className={`py-2.5 text-[9px] font-black uppercase rounded-xl border transition-all ${datePreset === p ? 'bg-indigo-50 border-indigo-200 text-indigo-600 shadow-inner' : 'bg-white border-slate-100 text-slate-400 hover:bg-slate-50'}`}>{p}</button>
                    ))}
                 </div>
              </div>
              <div className="space-y-3">
                 <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Custom Archival Window</label>
                 <div className="flex flex-col space-y-2">
                    <div className="relative">
                      <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-100 bg-slate-50 text-[10px] font-bold focus:ring-2 focus:ring-indigo-500" />
                      <span className="absolute left-3 top-2.5 text-[8px] font-black text-slate-400 uppercase">From</span>
                    </div>
                    <div className="relative">
                      <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-100 bg-slate-50 text-[10px] font-bold focus:ring-2 focus:ring-indigo-500" />
                      <span className="absolute left-3 top-2.5 text-[8px] font-black text-slate-400 uppercase">To</span>
                    </div>
                 </div>
              </div>
              <div className="flex items-end">
                 <button onClick={() => { setMinAmount(''); setMaxAmount(''); setDatePreset('All'); setSearchTerm(''); setStartDate(''); setEndDate(''); }} className="w-full py-4 text-[10px] font-black uppercase tracking-widest text-rose-500 hover:bg-rose-50 rounded-2xl transition-all">Reset Intelligent Filters</button>
              </div>
           </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-900 text-[10px] uppercase font-black tracking-widest text-slate-400">
              <tr>
                <th className="px-10 py-6">Identity Node</th>
                <th className="px-10 py-6">Class / Supply</th>
                <th className="px-10 py-6">Counterparty Context</th>
                <th className="px-10 py-6 text-right">Value (FCY)</th>
                <th className="px-10 py-6 text-right">Operation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((v) => (
                <tr key={v.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-10 py-6" onClick={() => onViewVoucher?.(v.id)}>
                    <span className="font-black text-slate-800 text-sm tracking-tight italic group-hover:text-indigo-600 transition-colors cursor-pointer underline decoration-transparent group-hover:decoration-indigo-200">{v.id}</span>
                    <div className="text-[9px] text-slate-400 uppercase font-bold mt-1 tracking-tighter">{v.date}</div>
                  </td>
                  <td className="px-10 py-6">
                    <div className="flex flex-col space-y-1">
                       <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border self-start ${v.type === 'Sales' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : v.type === 'Purchase' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>{v.type}</span>
                       <span className="text-[8px] font-bold text-slate-300 uppercase tracking-tighter ml-1">{v.supplyType || 'Accounting'}</span>
                    </div>
                  </td>
                  <td className="px-10 py-6">
                    <span className="text-sm font-black text-slate-800 italic uppercase tracking-tight">{v.party}</span>
                    <div className="flex items-center space-x-2 mt-1">
                       <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                       <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">{v.status || 'Posted'} • {v.items?.length || 0} Nodes</span>
                    </div>
                  </td>
                  <td className="px-10 py-6 text-right font-black text-slate-900 tabular-nums text-lg italic tracking-tighter">${v.amount.toLocaleString()}</td>
                  <td className="px-10 py-6 text-right">
                    <ActionMenu actions={getVoucherActions(v)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DayBook;