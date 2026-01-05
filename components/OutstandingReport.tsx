import React, { useState, useMemo } from 'react';
import { Ledger, Voucher } from '../types';

interface OutstandingReportProps {
  ledgers: Ledger[];
  vouchers: Voucher[];
  onDrillDown: (ledgerId: string) => void;
}

const OutstandingReport: React.FC<OutstandingReportProps> = ({ ledgers, vouchers, onDrillDown }) => {
  const [reportType, setReportType] = useState<'RECEIVABLES' | 'PAYABLES'>('RECEIVABLES');

  const ageingData = useMemo(() => {
    const targetGroup = reportType === 'RECEIVABLES' ? 'Sundry Debtors' : 'Sundry Creditors';
    const parties = ledgers.filter(l => l.group === targetGroup);
    const today = new Date();

    return parties.map(p => {
      let totalDue = p.openingBalance;
      const buckets = { '0-30': 0, '31-60': 0, '61-90': 0, '90+': 0 };

      vouchers.forEach(v => {
        if (v.party === p.name || v.ledgerId === p.id) {
           const isPositive = (p.group === 'Sundry Debtors' && ['Sales', 'Debit Note', 'Payment'].includes(v.type)) || 
                              (p.group === 'Sundry Creditors' && ['Purchase', 'Credit Note', 'Receipt'].includes(v.type));
           
           const amt = isPositive ? v.amount : -v.amount;
           totalDue += amt;

           if (amt > 0) {
              const diffTime = Math.abs(today.getTime() - new Date(v.date).getTime());
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              if (diffDays <= 30) buckets['0-30'] += amt;
              else if (diffDays <= 60) buckets['31-60'] += amt;
              else if (diffDays <= 90) buckets['61-90'] += amt;
              else buckets['90+'] += amt;
           }
        }
      });

      return { id: p.id, name: p.name, totalDue, buckets };
    }).filter(p => p.totalDue !== 0).sort((a,b) => b.totalDue - a.totalDue);
  }, [ledgers, vouchers, reportType]);

  const totals = useMemo(() => {
    return ageingData.reduce((acc, p) => ({
      due: acc.due + p.totalDue,
      b1: acc.b1 + p.buckets['0-30'],
      b2: acc.b2 + p.buckets['31-60'],
      b3: acc.b3 + p.buckets['61-90'],
      b4: acc.b4 + p.buckets['90+']
    }), { due: 0, b1: 0, b2: 0, b3: 0, b4: 0 });
  }, [ageingData]);

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex bg-slate-900 p-2 rounded-[2.5rem] border border-slate-800 max-w-xl mx-auto shadow-2xl">
         {(['RECEIVABLES', 'PAYABLES'] as const).map(t => (
           <button 
            key={t} 
            onClick={() => setReportType(t)}
            className={`flex-1 py-4 text-[10px] font-black uppercase tracking-[0.3em] rounded-[2rem] transition-all ${reportType === t ? 'bg-indigo-600 text-white shadow-xl scale-105' : 'text-slate-500 hover:text-slate-300'}`}
           >
             {t === 'RECEIVABLES' ? 'Sundry Debtors' : 'Sundry Creditors'}
           </button>
         ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
         {[
           { label: 'Total Outstanding', value: totals.due, color: 'text-slate-900', bg: 'bg-white' },
           { label: 'Current (0-30)', value: totals.b1, color: 'text-emerald-600', bg: 'bg-emerald-50' },
           { label: 'Delayed (31-60)', value: totals.b2, color: 'text-amber-600', bg: 'bg-amber-50' },
           { label: 'Critical (61-90)', value: totals.b3, color: 'text-rose-600', bg: 'bg-rose-50' },
           { label: 'Stagnant (90+)', value: totals.b4, color: 'text-rose-900', bg: 'bg-rose-100' }
         ].map((s, i) => (
           <div key={i} className={`p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col justify-between h-40 ${s.bg}`}>
              <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">{s.label}</span>
              <div className={`text-2xl font-black italic tracking-tighter tabular-nums ${s.color}`}>${s.value.toLocaleString()}</div>
           </div>
         ))}
      </div>

      <div className="bg-white rounded-[4rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
         <div className="p-10 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <h4 className="text-xl font-black italic text-slate-800 uppercase">{reportType} Ageing Registry</h4>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Sorted by Net Exposure</div>
         </div>
         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead className="bg-slate-950 text-[9px] font-black uppercase text-slate-400">
                  <tr>
                     <th className="px-10 py-7">Legal Counterparty Title</th>
                     <th className="px-10 py-7 text-right">0-30 Days</th>
                     <th className="px-10 py-7 text-right">31-60 Days</th>
                     <th className="px-10 py-7 text-right">61-90 Days</th>
                     <th className="px-10 py-7 text-right">90+ Days</th>
                     <th className="px-10 py-7 text-right bg-rose-50 text-rose-900">Total Outstanding ($)</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                  {ageingData.map((p, i) => (
                    <tr key={i} onClick={() => onDrillDown(p.id)} className="hover:bg-slate-50 cursor-pointer transition-colors group">
                       <td className="px-10 py-6">
                          <div className="text-xs font-black text-slate-800 uppercase italic group-hover:text-indigo-600 transition-colors">{p.name}</div>
                          <div className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter mt-1 underline decoration-transparent group-hover:decoration-indigo-100">View Shard Account &rarr;</div>
                       </td>
                       <td className="px-10 py-6 text-right font-mono text-[11px] text-slate-400">{p.buckets['0-30'] > 0 ? p.buckets['0-30'].toLocaleString() : '-'}</td>
                       <td className="px-10 py-6 text-right font-mono text-[11px] text-amber-600">{p.buckets['31-60'] > 0 ? p.buckets['31-60'].toLocaleString() : '-'}</td>
                       <td className="px-10 py-6 text-right font-mono text-[11px] text-rose-600">{p.buckets['61-90'] > 0 ? p.buckets['61-90'].toLocaleString() : '-'}</td>
                       <td className="px-10 py-6 text-right font-mono text-[11px] text-rose-900 font-black">{p.buckets['90+'] > 0 ? p.buckets['90+'].toLocaleString() : '-'}</td>
                       <td className="px-10 py-6 text-right font-black text-rose-900 tabular-nums italic bg-rose-50/30 text-base underline underline-offset-4 decoration-rose-200">
                          ${p.totalDue.toLocaleString()}
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

export default OutstandingReport;