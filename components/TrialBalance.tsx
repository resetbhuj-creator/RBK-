import React, { useMemo } from 'react';
import { Ledger, Voucher } from '../types';
import ActionMenu, { ActionItem } from './ActionMenu';

interface TrialBalanceProps {
  ledgers: Ledger[];
  vouchers: Voucher[];
}

const TrialBalance: React.FC<TrialBalanceProps> = ({ ledgers, vouchers }) => {
  const data = useMemo(() => {
    let totalDebit = 0;
    let totalCredit = 0;

    const rows = ledgers.map(l => {
      let balance = l.openingBalance;
      vouchers.forEach(v => {
        if (v.ledgerId === l.id) {
          balance += (l.type === 'Debit' ? v.amount : -v.amount);
        }
      });

      const dr = l.type === 'Debit' ? balance : 0;
      const cr = l.type === 'Credit' ? balance : 0;
      totalDebit += dr;
      totalCredit += cr;

      return { id: l.id, name: l.name, group: l.group, dr, cr };
    });

    return { rows, totalDebit, totalCredit };
  }, [ledgers, vouchers]);

  const getLedgerActions = (row: any): ActionItem[] => [
    { 
      label: 'Account Ledger', 
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
      onClick: () => alert(`Loading detailed ledger for ${row.name}...`),
      variant: 'primary'
    },
    { 
      label: 'Monthly Summary', 
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
      onClick: () => alert(`Displaying monthly trend for ${row.name}...`)
    }
  ];

  return (
    <div className="bg-white rounded-[3rem] border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in duration-500">
      <div className="bg-blue-600 p-12 text-white">
         <h3 className="text-3xl font-black italic uppercase tracking-tighter">Trial Balance</h3>
         <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80 mt-2">Integrity Check Protocol</p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-900 text-[10px] font-black uppercase text-slate-400">
            <tr>
              <th className="px-12 py-6">Ledger Identity</th>
              <th className="px-12 py-6">Grouping</th>
              <th className="px-12 py-6 text-right">Debit ($)</th>
              <th className="px-12 py-6 text-right">Credit ($)</th>
              <th className="px-12 py-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.rows.map((row, i) => (
              <tr key={i} className="hover:bg-slate-50 transition-colors group">
                <td className="px-12 py-5 font-black text-slate-800 italic">{row.name}</td>
                <td className="px-12 py-5"><span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{row.group}</span></td>
                <td className="px-12 py-5 text-right font-mono text-xs">{row.dr > 0 ? row.dr.toLocaleString() : '-'}</td>
                <td className="px-12 py-5 text-right font-mono text-xs">{row.cr > 0 ? row.cr.toLocaleString() : '-'}</td>
                <td className="px-12 py-5 text-right">
                   <ActionMenu actions={getLedgerActions(row)} />
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-slate-50 border-t-4 border-slate-200">
             <tr className="font-black text-slate-900">
               <td colSpan={2} className="px-12 py-8 uppercase tracking-widest italic">Verification Totals</td>
               <td className="px-12 py-8 text-right text-lg tabular-nums">${data.totalDebit.toLocaleString()}</td>
               <td className="px-12 py-8 text-right text-lg tabular-nums">${data.totalCredit.toLocaleString()}</td>
               <td></td>
             </tr>
          </tfoot>
        </table>
      </div>
      
      {data.totalDebit === data.totalCredit ? (
        <div className="p-8 bg-emerald-50 text-emerald-800 text-center font-black uppercase tracking-widest border-t border-emerald-100">
           ✓ Mathematical Integrity Verified: Ledger is perfectly balanced.
        </div>
      ) : (
        <div className="p-8 bg-rose-50 text-rose-800 text-center font-black uppercase tracking-widest border-t border-rose-100 animate-pulse">
           ⚠ System Alert: Ledger variance detected. Manual audit required.
        </div>
      )}
    </div>
  );
};

export default TrialBalance;