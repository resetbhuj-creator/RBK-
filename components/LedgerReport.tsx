import React, { useState, useMemo } from 'react';
import { Ledger, Voucher, LedgerEntry } from '../types';

interface LedgerReportProps {
  ledgers: Ledger[];
  vouchers: Voucher[];
  onViewVoucher?: (id: string) => void;
  defaultLedgerId?: string;
}

const LedgerReport: React.FC<LedgerReportProps> = ({ ledgers, vouchers, onViewVoucher, defaultLedgerId }) => {
  const [selectedLedgerId, setSelectedLedgerId] = useState(defaultLedgerId || '');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const selectedLedger = useMemo(() => ledgers.find(l => l.id === selectedLedgerId), [ledgers, selectedLedgerId]);

  const statementData = useMemo(() => {
    if (!selectedLedger) return [];
    
    let runningBalance = selectedLedger.openingBalance;
    const entries: any[] = [];

    // Combine all sources of ledger movement
    const sortedVch = [...vouchers].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    sortedVch.forEach(v => {
      // Direct ledger match (Accounting Vch)
      if (v.ledgerId === selectedLedgerId) {
        const type = v.type === 'Payment' ? 'Cr' : 'Dr'; // Simplified logic
        const amt = v.amount;
        runningBalance += (selectedLedger.type === 'Debit' ? (type === 'Dr' ? amt : -amt) : (type === 'Cr' ? amt : -amt));
        entries.push({ date: v.date, vId: v.id, type, party: v.party, amount: amt, balance: runningBalance });
      }

      // Entry matches (Accounting/Inventory Vch)
      v.entries?.forEach(e => {
        if (e.ledgerId === selectedLedgerId) {
          runningBalance += (selectedLedger.type === 'Debit' ? (e.type === 'Dr' ? e.amount : -e.amount) : (e.type === 'Cr' ? e.amount : -e.amount));
          entries.push({ date: v.date, vId: v.id, type: e.type, party: v.party, amount: e.amount, balance: runningBalance });
        }
      });
    });

    return entries.filter(e => {
       if (!dateRange.start || !dateRange.end) return true;
       const d = new Date(e.date);
       return d >= new Date(dateRange.start) && d <= new Date(dateRange.end);
    }).reverse(); // Latest on top
  }, [selectedLedger, vouchers, selectedLedgerId, dateRange]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-white rounded-[3rem] border border-slate-200 p-10 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-8">
         <div className="flex-1 space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Contextual Ledger Probe</label>
            <select 
              value={selectedLedgerId} 
              onChange={e => setSelectedLedgerId(e.target.value)}
              className="w-full max-w-md bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-black text-indigo-600 outline-none focus:ring-8 focus:ring-indigo-500/5 shadow-inner"
            >
               <option value="">-- Choose Account Shard --</option>
               {ledgers.map(l => <option key={l.id} value={l.id}>{l.name} [{l.group}]</option>)}
            </select>
         </div>
         <div className="flex items-center space-x-4">
            <div className="space-y-1">
               <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Temporal Filter</label>
               <div className="flex items-center space-x-2">
                  <input type="date" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} className="bg-slate-100 border border-slate-200 rounded-xl px-4 py-2 text-[10px] font-black outline-none" />
                  <span className="text-[8px] font-black text-slate-300">TO</span>
                  <input type="date" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})} className="bg-slate-100 border border-slate-200 rounded-xl px-4 py-2 text-[10px] font-black outline-none" />
               </div>
            </div>
            <button onClick={() => setDateRange({start: '', end: ''})} className="p-3 mt-4 text-slate-400 hover:text-rose-500 transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg></button>
         </div>
      </div>

      {selectedLedger ? (
        <div className="bg-white rounded-[4rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[600px] animate-in slide-in-from-bottom-4">
           <div className="p-10 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row justify-between items-center gap-6">
              <div>
                 <h4 className="text-2xl font-black italic text-slate-800 uppercase leading-none">{selectedLedger.name}</h4>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-2">Class: {selectedLedger.group} • Opening: ${selectedLedger.openingBalance.toLocaleString()}</p>
              </div>
              <div className="text-right">
                 <div className="text-[10px] font-black uppercase text-indigo-400 tracking-widest mb-1">Current Ledger Exposure</div>
                 <div className="text-4xl font-black italic text-slate-900 tabular-nums">
                   ${statementData[0]?.balance.toLocaleString() || selectedLedger.openingBalance.toLocaleString()}
                 </div>
              </div>
           </div>
           
           <div className="overflow-x-auto flex-1 custom-scrollbar">
              <table className="w-full text-left">
                 <thead className="bg-slate-950 text-[10px] font-black uppercase text-slate-400 sticky top-0 z-10">
                    <tr>
                       <th className="px-10 py-6">Timeline</th>
                       <th className="px-10 py-6">Audit Hash</th>
                       <th className="px-10 py-6">Contra Entity</th>
                       <th className="px-10 py-6 text-right">Debit ($)</th>
                       <th className="px-10 py-6 text-right">Credit ($)</th>
                       <th className="px-10 py-6 text-right bg-indigo-50/20">Running Bal ($)</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                    {statementData.map((e, i) => (
                       <tr key={i} className="hover:bg-indigo-50/30 transition-colors group">
                          <td className="px-10 py-5 text-xs font-bold text-slate-400">{e.date}</td>
                          <td className="px-10 py-5">
                             <button onClick={() => onViewVoucher?.(e.vId)} className="text-[11px] font-black text-indigo-600 uppercase italic hover:underline">#{e.vId}</button>
                          </td>
                          <td className="px-10 py-5 text-xs font-black text-slate-700 uppercase italic">{e.party}</td>
                          <td className="px-10 py-5 text-right font-black text-indigo-600 tabular-nums">{e.type === 'Dr' ? e.amount.toLocaleString() : '-'}</td>
                          <td className="px-10 py-5 text-right font-black text-rose-600 tabular-nums">{e.type === 'Cr' ? e.amount.toLocaleString() : '-'}</td>
                          <td className="px-10 py-5 text-right font-black text-slate-900 tabular-nums italic bg-indigo-50/20 group-hover:bg-indigo-100/30">{e.balance.toLocaleString()}</td>
                       </tr>
                    ))}
                    {statementData.length === 0 && (
                       <tr><td colSpan={6} className="py-40 text-center text-slate-300 italic uppercase font-black tracking-widest">No activity shards found for specified period.</td></tr>
                    )}
                 </tbody>
              </table>
           </div>
        </div>
      ) : (
        <div className="py-32 flex flex-col items-center justify-center opacity-30 animate-pulse">
           <div className="w-24 h-24 rounded-[3rem] bg-slate-100 flex items-center justify-center text-5xl mb-8">📊</div>
           <p className="text-sm font-black uppercase tracking-[0.5em]">Awaiting Identity Selection</p>
        </div>
      )}
    </div>
  );
};

export default LedgerReport;