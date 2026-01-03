import React, { useState, useMemo } from 'react';
import { Voucher } from '../types';
import ActionMenu, { ActionItem } from './ActionMenu';
import * as XLSX from 'xlsx';

interface DayBookProps {
  vouchers: Voucher[];
  onClone?: (v: Voucher) => void;
  onViewVoucher?: (id: string) => void;
}

const DayBook: React.FC<DayBookProps> = ({ vouchers, onClone, onViewVoucher }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Advanced Filter State
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [amountRange, setAmountRange] = useState({ min: '', max: '' });

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
    const avg = count > 0 ? gross / count : 0;
    const peak = count > 0 ? Math.max(...filtered.map(v => v.amount)) : 0;
    return { gross, count, avg, peak };
  }, [filtered]);

  const handleExportXLSX = () => {
    const data = filtered.map(v => ({
      'Audit HASH': v.id,
      'Post Date': v.date,
      'Transaction Class': v.type,
      'Counterparty Node': v.party,
      'Monetary Value': v.amount,
      'Integrity Status': v.status,
      'Narrative Digest': v.narration || ''
    }));
    
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "ReconciledRegistry");
    XLSX.writeFile(wb, `nexus_audit_stream_${Date.now()}.xlsx`);
  };

  const getVoucherActions = (v: Voucher): ActionItem[] => [
    { 
      label: 'Inspect Record', 
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>,
      onClick: () => onViewVoucher?.(v.id),
      variant: 'primary'
    },
    { 
      label: 'Clone Transaction', 
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" /></svg>,
      onClick: () => onClone?.(v)
    },
    { 
      label: 'Purge Context', 
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
      onClick: () => alert('Voucher purge initialized.'),
      variant: 'danger'
    }
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-20">
      {/* Telemetry Dashboard Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         {[
           { label: 'Cumulative Turnover', value: `$${stats.gross.toLocaleString()}`, color: 'text-indigo-600', bg: 'bg-indigo-50' },
           { label: 'Voucher Density', value: stats.count, color: 'text-slate-800', bg: 'bg-slate-50' },
           { label: 'Transmission Peak', value: `$${stats.peak.toLocaleString()}`, color: 'text-rose-600', bg: 'bg-rose-50' },
           { label: 'Unit Efficiency', value: `$${stats.avg.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, color: 'text-emerald-600', bg: 'bg-emerald-50' }
         ].map((s, i) => (
           <div key={i} className={`p-8 rounded-[2.5rem] border border-slate-200 shadow-sm group hover:-translate-y-1 transition-all ${s.bg}`}>
              <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2 group-hover:text-indigo-600">{s.label}</div>
              <div className={`text-4xl font-black italic tracking-tighter tabular-nums ${s.color}`}>{s.value}</div>
           </div>
         ))}
      </div>

      <div className="bg-white rounded-[4rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[600px]">
        <div className="p-10 border-b border-slate-100 bg-slate-50/50 space-y-8">
          <div className="flex flex-col xl:flex-row items-center justify-between gap-10">
            <div className="flex items-center space-x-6 flex-1 w-full max-w-2xl">
               <div className="relative flex-1 group">
                  <input 
                    type="text" 
                    placeholder="Search Reconciled Stream (Party, Hash, Type)..." 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                    className="w-full pl-16 pr-8 py-5 rounded-3xl border border-slate-200 bg-white text-sm font-bold shadow-inner outline-none focus:ring-8 focus:ring-indigo-500/5 transition-all italic" 
                  />
                  <svg className="w-6 h-6 text-slate-300 absolute left-6 top-4.5 group-focus-within:text-indigo-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
               </div>
               <button onClick={() => setShowAdvanced(!showAdvanced)} className={`p-5 rounded-[1.5rem] transition-all border-2 flex items-center space-x-3 ${showAdvanced ? 'bg-slate-900 border-slate-900 text-white shadow-2xl' : 'bg-white text-slate-400 border-slate-200 hover:border-indigo-400 hover:text-indigo-600 shadow-sm'}`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m12 4a2 2 0 100-4m0 4a2 2 0 110-4" /></svg>
                  <span className="text-[10px] font-black uppercase tracking-widest">Filter Matrix</span>
               </button>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex bg-slate-200/50 p-1.5 rounded-[1.8rem] border border-slate-200 overflow-x-auto no-scrollbar shadow-inner">
                {['All', 'Sales', 'Purchase', 'Sales Return', 'Purchase Return', 'Payment', 'Receipt', 'Contra', 'Journal', 'Delivery Note', 'Goods Receipt Note (GRN)', 'Stock Adjustment'].map(t => (
                  <button key={t} onClick={() => setFilterType(t)} className={`px-6 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all whitespace-nowrap ${filterType === t ? 'bg-white text-indigo-600 shadow-xl scale-[1.02] border border-slate-100' : 'text-slate-500 hover:text-slate-800'}`}>{t}</button>
                ))}
              </div>
              <button onClick={handleExportXLSX} className="p-5 bg-emerald-600 text-white rounded-[1.5rem] shadow-xl hover:bg-emerald-700 transition-all active:scale-90 border-b-4 border-emerald-900/40">
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              </button>
            </div>
          </div>

          {showAdvanced && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 p-10 bg-white rounded-[2.5rem] border-2 border-indigo-100 shadow-2xl animate-in slide-in-from-top-4 duration-500 relative overflow-hidden">
               <div className="space-y-1.5 relative z-10">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2">Temporal Opening</label>
                  <input type="date" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-xs font-black outline-none focus:ring-4 focus:ring-indigo-500/10 shadow-inner" />
               </div>
               <div className="space-y-1.5 relative z-10">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2">Temporal Closing</label>
                  <input type="date" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-xs font-black outline-none focus:ring-4 focus:ring-indigo-500/10 shadow-inner" />
               </div>
               <div className="space-y-1.5 relative z-10">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2">Monetary Floor ($)</label>
                  <input type="number" placeholder="0.00" value={amountRange.min} onChange={e => setAmountRange({...amountRange, min: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-xs font-black outline-none focus:ring-4 focus:ring-indigo-500/10 shadow-inner" />
               </div>
               <div className="space-y-1.5 relative z-10">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2">Monetary Ceiling ($)</label>
                  <input type="number" placeholder="∞" value={amountRange.max} onChange={e => setAmountRange({...amountRange, max: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-xs font-black outline-none focus:ring-4 focus:ring-indigo-500/10 shadow-inner" />
               </div>
               <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600 rounded-full blur-3xl opacity-5 -mr-16 -mt-16"></div>
            </div>
          )}
        </div>

        <div className="overflow-x-auto flex-1 custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-950 text-[10px] uppercase font-black tracking-widest text-slate-500 border-b border-slate-900 sticky top-0 z-20">
              <tr>
                <th className="px-12 py-8 w-16">
                   <button onClick={() => setSelectedIds(selectedIds.length === filtered.length ? [] : filtered.map(f => f.id))} className={`w-6 h-6 rounded-lg border-2 transition-all flex items-center justify-center ${selectedIds.length === filtered.length ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-800 hover:border-slate-600'}`}>
                      {selectedIds.length === filtered.length && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={4}><path d="M5 13l4 4L19 7" /></svg>}
                   </button>
                </th>
                <th className="px-12 py-8">Audit Identification</th>
                <th className="px-12 py-8">Classification</th>
                <th className="px-12 py-8">Counterparty Master</th>
                <th className="px-12 py-8 text-right">Resolved Value</th>
                <th className="px-12 py-8 text-right">Operations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 bg-white">
              {filtered.map((v) => (
                <tr key={v.id} onClick={() => setSelectedIds(prev => prev.includes(v.id) ? prev.filter(x => x !== v.id) : [...prev, v.id])} className={`hover:bg-indigo-50/20 transition-all group cursor-pointer border-b border-slate-50 ${selectedIds.includes(v.id) ? 'bg-indigo-50/50' : ''}`}>
                  <td className="px-12 py-8">
                     <div className={`w-6 h-6 rounded-lg border-2 transition-all flex items-center justify-center ${selectedIds.includes(v.id) ? 'bg-indigo-600 border-indigo-600 text-white scale-110 shadow-lg' : 'border-slate-200 group-hover:border-indigo-300'}`}>
                        {selectedIds.includes(v.id) && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={4}><path d="M5 13l4 4L19 7" /></svg>}
                     </div>
                  </td>
                  <td className="px-12 py-8" onClick={(e) => { e.stopPropagation(); onViewVoucher?.(v.id); }}>
                    <div className="font-black text-slate-800 text-base tracking-tighter italic group-hover:text-indigo-600 transition-colors underline decoration-transparent group-hover:decoration-indigo-200 underline-offset-8">#{v.id}</div>
                    <div className="text-[10px] text-slate-400 uppercase font-black mt-2 tracking-widest">{v.date}</div>
                  </td>
                  <td className="px-12 py-8">
                    <div className="flex flex-col space-y-2">
                       <span className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] border self-start shadow-sm transition-transform group-hover:scale-105 ${
                         v.type === 'Sales' || v.type === 'Receipt' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                         v.type === 'Purchase' || v.type === 'Payment' ? 'bg-rose-50 text-rose-600 border-rose-100' : 
                         v.type === 'Sales Return' || v.type === 'Purchase Return' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                         'bg-indigo-50 text-indigo-600 border-indigo-100'
                       }`}>{v.type}</span>
                       <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em] ml-1">{v.supplyType || 'Internal Node'}</span>
                    </div>
                  </td>
                  <td className="px-12 py-8">
                    <span className="text-sm font-black text-slate-900 uppercase italic tracking-tight">{v.party}</span>
                    <div className="flex items-center space-x-3 mt-2">
                       <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981] animate-pulse"></div>
                       <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Verified • {v.items?.length || v.entries?.length || 0} Data Points</span>
                    </div>
                  </td>
                  <td className="px-12 py-8 text-right">
                    <div className="font-black text-slate-900 tabular-nums text-xl italic tracking-tighter">${v.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Confirmed Volume</div>
                  </td>
                  <td className="px-12 py-8 text-right" onClick={e => e.stopPropagation()}>
                    <ActionMenu actions={getVoucherActions(v)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-48 flex flex-col items-center opacity-20 animate-pulse">
               <div className="w-32 h-32 bg-slate-100 rounded-[3rem] flex items-center justify-center mb-8 border border-slate-200 shadow-inner">
                  <svg className="w-16 h-16 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
               </div>
               <h5 className="text-xl font-black uppercase tracking-[0.5em] text-slate-500 italic">Audit Stream Exhausted</h5>
               <p className="text-xs font-bold text-slate-400 uppercase mt-4 tracking-widest">Zero matching transactional objects in buffer.</p>
            </div>
          )}
        </div>
        
        <div className="px-12 py-6 bg-slate-950 text-white flex items-center justify-between shrink-0">
           <div className="flex items-center space-x-10">
              <div className="flex flex-col">
                 <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em]">Aggregate Output</span>
                 <span className="text-lg font-black italic tracking-tighter">${stats.gross.toLocaleString()}</span>
              </div>
              <div className="w-px h-8 bg-white/10"></div>
              <div className="flex flex-col">
                 <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em]">Line Count</span>
                 <span className="text-lg font-black italic tracking-tighter">{stats.count}</span>
              </div>
           </div>
           <div className="flex items-center space-x-4">
              <span className="text-[10px] font-black uppercase text-indigo-400 tracking-widest">Integrity Checked ✓</span>
              <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse shadow-[0_0_8px_#6366f1]"></div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default DayBook;