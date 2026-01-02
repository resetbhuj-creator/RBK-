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

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto">
      <div className="bg-white rounded-[3rem] border border-slate-200 shadow-2xl overflow-hidden">
        <div className="bg-blue-950 p-12 text-white border-b-8 border-blue-600">
           <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="space-y-2">
                 <h3 className="text-3xl font-black italic uppercase tracking-tighter">Trial Balance</h3>
                 <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400">Master Integrity & Symmetry Check</p>
              </div>
              <div className="text-right">
                 <div className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Audit Context</div>
                 <div className="text-xl font-black italic">Pre-Closing Balance</div>
                 <p className="text-[9px] text-slate-500 font-bold uppercase mt-1 italic">Verified Registry</p>
              </div>
           </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-900 text-[10px] font-black uppercase text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-12 py-6">Ledger Account Title</th>
                <th className="px-12 py-6">Primary Group</th>
                <th className="px-12 py-6 text-right border-l border-white/5">Debit ($)</th>
                <th className="px-12 py-6 text-right border-l border-white/5">Credit ($)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {data.rows.map((row, i) => (
                <tr key={i} className="hover:bg-indigo-50/20 transition-colors group">
                  <td className="px-12 py-5 font-black text-slate-800 italic uppercase text-xs tracking-tight">{row.name}</td>
                  <td className="px-12 py-5"><span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[8px] font-black uppercase border border-slate-200">{row.group}</span></td>
                  <td className="px-12 py-5 text-right font-mono text-sm tabular-nums text-slate-600 bg-slate-50/30 border-l border-slate-100">{row.dr > 0 ? row.dr.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}</td>
                  <td className="px-12 py-5 text-right font-mono text-sm tabular-nums text-slate-600 bg-slate-50/30 border-l border-slate-100">{row.cr > 0 ? row.cr.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-900 border-t-8 border-blue-600 text-white">
               <tr className="font-black">
                 <td colSpan={2} className="px-12 py-8 text-sm uppercase tracking-widest italic">Verification Totals (Mathematical Proof)</td>
                 <td className="px-12 py-8 text-right text-2xl tabular-nums border-l border-white/10">${data.totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                 <td className="px-12 py-8 text-right text-2xl tabular-nums border-l border-white/10">${data.totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
               </tr>
            </tfoot>
          </table>
        </div>
        
        <div className={`p-8 text-center font-black uppercase tracking-[0.3em] text-[10px] ${data.totalDebit === data.totalCredit ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white animate-pulse'}`}>
           {data.totalDebit === data.totalCredit 
             ? '✓ Standard Proof Verified: Ledger is in Perfect Equilibrium' 
             : '⚠ Critical Variance: Debit/Credit Asymmetry Detected. Please re-run integrity checks.'}
        </div>
      </div>
    </div>
  );
};

export default TrialBalance;