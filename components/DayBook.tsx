import React, { useState, useMemo } from 'react';
import { Voucher } from '../types';
import ActionMenu, { ActionItem } from './ActionMenu';

interface DayBookProps {
  vouchers: Voucher[];
}

const DayBook: React.FC<DayBookProps> = ({ vouchers }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');

  const filtered = useMemo(() => {
    return vouchers.filter(v => {
      const matchesSearch = v.party.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           v.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'All' || v.type === filterType;
      return matchesSearch && matchesType;
    });
  }, [vouchers, searchTerm, filterType]);

  const totals = useMemo(() => filtered.reduce((acc, v) => acc + v.amount, 0), [filtered]);

  const getVoucherActions = (v: Voucher): ActionItem[] => [
    { 
      label: 'View / Print', 
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>,
      onClick: () => alert(`Loading print layout for ${v.id}...`),
      variant: 'primary'
    },
    { 
      label: 'Email Voucher', 
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
      onClick: () => alert(`Transmitting ${v.id} to client mailbox...`)
    },
    { 
      label: 'Send SMS Alert', 
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>,
      onClick: () => alert(`SMS alert triggered for ${v.id}.`)
    },
    { 
      label: 'Void / Cancel', 
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>,
      onClick: () => { if(confirm('Are you sure you want to void this transaction?')) alert('Voucher voided.'); },
      variant: 'danger'
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight italic uppercase">Chronological Day Book</h2>
          <p className="text-sm text-slate-500 font-medium">Verified transactional audit trail for the active period.</p>
        </div>
        <div className="bg-indigo-600 px-8 py-4 rounded-[2rem] text-white shadow-2xl shadow-indigo-900/30 flex items-center space-x-6">
           <div className="border-r border-white/20 pr-6">
             <div className="text-[9px] font-black uppercase tracking-widest opacity-70">Filtered Vol.</div>
             <div className="text-xl font-black italic">${totals.toLocaleString()}</div>
           </div>
           <div><div className="text-[9px] font-black uppercase tracking-widest opacity-70">Entries</div><div className="text-xl font-black italic">{filtered.length}</div></div>
        </div>
      </div>

      <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/30 flex flex-col md:flex-row items-center justify-between gap-6">
          <input type="text" placeholder="Search entries..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full max-w-md px-6 py-3 rounded-2xl border border-slate-200 bg-white text-sm font-bold shadow-sm outline-none focus:ring-4 focus:ring-indigo-500/10" />
          <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 overflow-x-auto no-scrollbar">
            {['All', 'Sales', 'Purchase', 'Payment', 'Receipt'].map(t => (
              <button key={t} onClick={() => setFilterType(t)} className={`px-5 py-2 text-[9px] font-black uppercase rounded-xl transition-all ${filterType === t ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>{t}</button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-900 text-[10px] uppercase font-black tracking-widest text-slate-400">
              <tr>
                <th className="px-10 py-6">Voucher Identity</th>
                <th className="px-10 py-6">Class</th>
                <th className="px-10 py-6">Entity / Details</th>
                <th className="px-10 py-6 text-right">Grand Value</th>
                <th className="px-10 py-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((v) => (
                <tr key={v.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-10 py-6"><span className="font-black text-slate-800 text-sm tracking-tight">{v.id}</span><div className="text-[9px] text-slate-400 uppercase font-bold">{v.date}</div></td>
                  <td className="px-10 py-6"><span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${v.type === 'Sales' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : v.type === 'Purchase' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>{v.type}</span></td>
                  <td className="px-10 py-6"><span className="text-sm font-black text-slate-800 italic uppercase">{v.party}</span>{v.items && <div className="text-[9px] text-slate-400 mt-1 uppercase font-bold">{v.items.length} Line Items Resolved</div>}</td>
                  <td className="px-10 py-6 text-right font-black text-slate-900 tabular-nums">${v.amount.toLocaleString()}</td>
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