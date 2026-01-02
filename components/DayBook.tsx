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
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const filtered = useMemo(() => {
    return vouchers.filter(v => {
      const matchesSearch = v.party.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           v.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'All' || v.type === filterType;
      return matchesSearch && matchesType;
    });
  }, [vouchers, searchTerm, filterType]);

  const totals = useMemo(() => {
    const gross = filtered.reduce((acc, v) => acc + v.amount, 0);
    const count = filtered.length;
    return { gross, count };
  }, [filtered]);

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const getVoucherActions = (v: Voucher): ActionItem[] => [
    { 
      label: 'Inspect Record', 
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>,
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
      onClick: () => alert('Voucher voided.'),
      variant: 'danger'
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight italic uppercase">Chronological Day Book</h2>
          <p className="text-sm text-slate-500 font-medium">Immutable audit trail of organizational movements.</p>
        </div>
        <div className="bg-white px-8 py-5 rounded-[2.5rem] border border-slate-200 shadow-sm flex items-center space-x-10 relative overflow-hidden group">
           <div className="relative z-10 border-r border-slate-100 pr-10">
             <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Session Turnover</div>
             <div className="text-2xl font-black italic tabular-nums text-indigo-600">${totals.gross.toLocaleString()}</div>
           </div>
           <div className="relative z-10">
              <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Filtered Count</div>
              <div className="text-2xl font-black italic tabular-nums text-slate-800">{totals.count}</div>
           </div>
        </div>
      </div>

      <div className="bg-white rounded-[3.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
        <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center space-x-4 flex-1 w-full max-w-xl">
             <div className="relative flex-1">
                <input type="text" placeholder="Query party identity or voucher hash..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-12 pr-6 py-4 rounded-2xl border border-slate-200 bg-white text-sm font-bold shadow-sm outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all" />
                <svg className="w-5 h-5 text-slate-300 absolute left-4 top-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
             </div>
             <button onClick={() => setShowAdvanced(!showAdvanced)} className={`p-4 rounded-2xl transition-all border ${showAdvanced ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg' : 'bg-white text-slate-400 border-slate-200 hover:text-indigo-600'}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
             </button>
          </div>
          <div className="flex bg-slate-200/50 p-1.5 rounded-2xl border border-slate-200 overflow-x-auto no-scrollbar">
            {['All', 'Sales', 'Purchase', 'Payment', 'Receipt'].map(t => (
              <button key={t} onClick={() => setFilterType(t)} className={`px-6 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${filterType === t ? 'bg-white text-indigo-600 shadow-md scale-105' : 'text-slate-400 hover:text-slate-600'}`}>{t}</button>
            ))}
          </div>
        </div>

        {selectedIds.length > 0 && (
           <div className="px-10 py-4 bg-indigo-600 text-white flex items-center justify-between animate-in slide-in-from-top-2">
              <span className="text-xs font-black uppercase tracking-widest">{selectedIds.length} Transactions Staged for Bulk Action</span>
              <div className="flex items-center space-x-3">
                 <button onClick={() => alert('Batch Printing Initialized...')} className="px-5 py-2 bg-white/20 hover:bg-white text-white hover:text-indigo-600 rounded-xl text-[9px] font-black uppercase transition-all">Batch Print</button>
                 <button onClick={() => alert('Exporting Cluster to CSV...')} className="px-5 py-2 bg-white/20 hover:bg-white text-white hover:text-indigo-600 rounded-xl text-[9px] font-black uppercase transition-all">Export Selected</button>
                 <button onClick={() => setSelectedIds([])} className="p-2 hover:bg-rose-500 rounded-xl transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg></button>
              </div>
           </div>
        )}

        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-900 text-[10px] uppercase font-black tracking-widest text-slate-400 sticky top-0 z-10">
              <tr>
                <th className="px-10 py-6 w-16">
                   <button onClick={() => setSelectedIds(selectedIds.length === filtered.length ? [] : filtered.map(f => f.id))} className={`w-5 h-5 rounded border-2 transition-all ${selectedIds.length === filtered.length ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-slate-700 hover:border-slate-500'}`}>
                      {selectedIds.length === filtered.length && <svg fill="currentColor" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" /></svg>}
                   </button>
                </th>
                <th className="px-10 py-6">Vch ID / Moment</th>
                <th className="px-10 py-6">Class / Supply</th>
                <th className="px-10 py-6">Counterparty Entity</th>
                <th className="px-10 py-6 text-right">Value (FCY)</th>
                <th className="px-10 py-6 text-right">Operation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((v) => (
                <tr key={v.id} onClick={() => toggleSelection(v.id)} className={`hover:bg-indigo-50/20 transition-all group cursor-pointer ${selectedIds.includes(v.id) ? 'bg-indigo-50/50' : ''}`}>
                  <td className="px-10 py-6">
                     <div className={`w-5 h-5 rounded border-2 transition-all ${selectedIds.includes(v.id) ? 'bg-indigo-500 border-indigo-500 text-white scale-110' : 'border-slate-200 group-hover:border-indigo-300'}`}>
                        {selectedIds.includes(v.id) && <svg fill="currentColor" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" /></svg>}
                     </div>
                  </td>
                  <td className="px-10 py-6" onClick={(e) => { e.stopPropagation(); onViewVoucher?.(v.id); }}>
                    <span className="font-black text-slate-800 text-sm tracking-tight italic group-hover:text-indigo-600 transition-colors underline decoration-transparent group-hover:decoration-indigo-200">{v.id}</span>
                    <div className="text-[9px] text-slate-400 uppercase font-bold mt-1 tracking-tighter">{v.date}</div>
                  </td>
                  <td className="px-10 py-6">
                    <div className="flex flex-col space-y-1">
                       <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border self-start ${v.type === 'Sales' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : v.type === 'Purchase' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>{v.type}</span>
                       <span className="text-[8px] font-bold text-slate-300 uppercase tracking-tighter ml-1">{v.supplyType || 'Ledger Only'}</span>
                    </div>
                  </td>
                  <td className="px-10 py-6">
                    <span className="text-sm font-black text-slate-800 uppercase italic tracking-tight">{v.party}</span>
                    <div className="flex items-center space-x-2 mt-1">
                       <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                       <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">{v.status} • {v.items?.length || v.entries?.length || 0} Points</span>
                    </div>
                  </td>
                  <td className="px-10 py-6 text-right font-black text-slate-900 tabular-nums text-lg italic tracking-tighter">${v.amount.toLocaleString()}</td>
                  <td className="px-10 py-6 text-right" onClick={(e) => e.stopPropagation()}>
                    <ActionMenu actions={getVoucherActions(v)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-40 flex flex-col items-center opacity-30">
               <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6 border border-slate-200"><span className="text-4xl">🔍</span></div>
               <h5 className="text-sm font-black uppercase tracking-[0.3em]">No Transactions Found in Registry</h5>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DayBook;