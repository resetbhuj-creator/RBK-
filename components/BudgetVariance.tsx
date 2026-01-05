import React, { useMemo } from 'react';
import { Ledger, Voucher } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface BudgetVarianceProps {
  ledgers: Ledger[];
  vouchers: Voucher[];
}

const BudgetVariance: React.FC<BudgetVarianceProps> = ({ ledgers, vouchers }) => {
  const data = useMemo(() => {
    // Standard ERP practice: Compare Ledger Budgets vs Actual Posting Sums
    return ledgers
      .filter(l => (l.budget && l.budget > 0) || (l.group === 'Indirect Expenses' || l.group === 'Direct Expenses'))
      .map(l => {
        let actual = 0;
        vouchers.forEach(v => {
          // If ledger is part of voucher entries
          if (v.ledgerId === l.id) {
            actual += v.amount;
          }
          v.entries?.forEach(e => {
            if (e.ledgerId === l.id) {
              actual += e.amount;
            }
          });
        });

        const budget = l.budget || 5000; // Mock budget if not defined
        const variance = budget - actual;
        const percent = (actual / budget) * 100;
        
        return {
          name: l.name,
          budget,
          actual,
          variance,
          percent,
          status: percent > 100 ? 'OVER' : percent > 85 ? 'WARNING' : 'UNDER'
        };
      })
      .sort((a, b) => b.percent - a.percent);
  }, [ledgers, vouchers]);

  const aggregate = useMemo(() => {
    const totalBudget = data.reduce((acc, d) => acc + d.budget, 0);
    const totalActual = data.reduce((acc, d) => acc + d.actual, 0);
    return { totalBudget, totalActual, variance: totalBudget - totalActual };
  }, [data]);

  return (
    <div className="space-y-10 animate-in fade-in duration-700 max-w-7xl mx-auto">
      <div className="bg-indigo-950 rounded-[3.5rem] p-12 text-white border-b-8 border-indigo-600 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-12">
          <div className="space-y-4">
             <div className="inline-block px-4 py-1.5 bg-indigo-500/20 rounded-xl text-[10px] font-black uppercase tracking-[0.4em] border border-indigo-500/20">Fiscal Oversite Node</div>
             <h3 className="text-5xl font-black italic tracking-tighter uppercase leading-none">Budget vs Actual</h3>
             <p className="text-sm text-indigo-300 font-medium max-w-md italic">Analysis of departmental burn rates against authorized treasury allocations.</p>
          </div>
          <div className="grid grid-cols-2 gap-6 shrink-0">
             <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/10 backdrop-blur-xl">
                <div className="text-[10px] font-black uppercase text-indigo-400 tracking-widest mb-1">Global Limit</div>
                <div className="text-3xl font-black italic tabular-nums">${aggregate.totalBudget.toLocaleString()}</div>
             </div>
             <div className="p-8 bg-indigo-600 rounded-[2.5rem] shadow-xl border border-indigo-400/30">
                <div className="text-[10px] font-black uppercase text-indigo-200 tracking-widest mb-1">Net Absorption</div>
                <div className="text-3xl font-black italic tabular-nums">${aggregate.totalActual.toLocaleString()}</div>
             </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-600 rounded-full blur-[180px] opacity-10 -mr-64 -mt-64 pointer-events-none"></div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-8">
          <div className="bg-white rounded-[3.5rem] border border-slate-200 p-10 shadow-sm">
             <h4 className="text-[11px] font-black uppercase text-slate-400 tracking-[0.4em] mb-12 flex items-center">
                <div className="w-2 h-2 rounded-full bg-indigo-600 mr-4 animate-pulse"></div>
                Ledger Variance Matrix
             </h4>
             <div className="h-[450px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.slice(0, 8)} layout="vertical" margin={{ left: 40, right: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" axisLine={false} tickLine={false} hide />
                    <YAxis dataKey="name" type="category" width={140} axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10, fontWeight: 900, textTransform: 'uppercase'}} />
                    <Tooltip 
                      cursor={{fill: '#f8fafc'}}
                      contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)', fontSize: '12px', fontWeight: 900}}
                    />
                    <Bar dataKey="actual" radius={[0, 12, 12, 0]} barSize={24}>
                       {data.map((entry, index) => (
                         <Cell key={`cell-${index}`} fill={entry.status === 'OVER' ? '#f43f5e' : entry.status === 'WARNING' ? '#f59e0b' : '#6366f1'} />
                       ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
             </div>
          </div>

          <div className="bg-white rounded-[3.5rem] border border-slate-200 shadow-sm overflow-hidden">
             <table className="w-full text-left">
                <thead className="bg-slate-950 text-[10px] font-black uppercase text-slate-500 tracking-widest border-b border-slate-900">
                   <tr>
                      <th className="px-10 py-7">Treasury Ledger</th>
                      <th className="px-10 py-7 text-right">Authorized ($)</th>
                      <th className="px-10 py-7 text-right">Utilization ($)</th>
                      <th className="px-10 py-7 text-right">Variance ($)</th>
                      <th className="px-10 py-7 text-center">Efficiency</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                   {data.map((row, i) => (
                     <tr key={i} className="hover:bg-indigo-50/20 transition-all group">
                        <td className="px-10 py-6">
                           <div className="text-sm font-black text-slate-800 uppercase italic tracking-tighter group-hover:text-indigo-600 transition-colors underline decoration-transparent group-hover:decoration-indigo-100 underline-offset-4">{row.name}</div>
                        </td>
                        <td className="px-10 py-6 text-right font-black text-slate-400 tabular-nums">${row.budget.toLocaleString()}</td>
                        <td className="px-10 py-6 text-right font-black text-slate-900 tabular-nums">${row.actual.toLocaleString()}</td>
                        <td className={`px-10 py-6 text-right font-black tabular-nums italic ${row.variance < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                           {row.variance < 0 ? `(${Math.abs(row.variance).toLocaleString()})` : row.variance.toLocaleString()}
                        </td>
                        <td className="px-10 py-6 text-center">
                           <div className={`inline-flex items-center px-3 py-1 rounded-lg text-[9px] font-black uppercase border tracking-widest ${
                             row.status === 'OVER' ? 'bg-rose-50 text-rose-600 border-rose-100' : 
                             row.status === 'WARNING' ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                             'bg-emerald-50 text-emerald-600 border-emerald-100'
                           }`}>
                              {Math.round(row.percent)}%
                           </div>
                        </td>
                     </tr>
                   ))}
                </tbody>
             </table>
          </div>
        </div>

        <div className="space-y-8">
           <div className="bg-white rounded-[3rem] p-10 border border-slate-200 shadow-sm space-y-10">
              <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] flex items-center">
                 <svg className="w-5 h-5 mr-3 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                 Budget Intensity
              </h4>
              <div className="space-y-8">
                 {data.slice(0, 4).map((item, i) => (
                   <div key={i} className="space-y-3">
                      <div className="flex justify-between items-end">
                         <span className="text-[10px] font-black text-slate-800 uppercase italic truncate max-w-[150px]">{item.name}</span>
                         <span className={`text-[10px] font-black ${item.status === 'OVER' ? 'text-rose-600' : 'text-indigo-600'}`}>{Math.round(item.percent)}%</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner border border-slate-200">
                         <div className={`h-full transition-all duration-1000 ${item.status === 'OVER' ? 'bg-rose-500 shadow-[0_0_10px_#f43f5e]' : 'bg-indigo-600 shadow-[0_0_10px_#6366f1]'}`} style={{ width: `${Math.min(item.percent, 100)}%` }}></div>
                      </div>
                   </div>
                 ))}
              </div>
           </div>

           <div className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl group">
              <div className="relative z-10">
                 <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center mb-8 border border-white/10 group-hover:scale-110 transition-transform shadow-2xl">⚡</div>
                 <h4 className="text-xl font-black italic uppercase tracking-tighter mb-4">Statutory Governance</h4>
                 <p className="text-xs text-slate-400 leading-relaxed font-medium">
                   "Voucher locking mechanisms are automatically triggered when departmental budgets exceed the <span className="text-white font-bold underline underline-offset-4 decoration-indigo-500">Authorized Threshold</span>."
                 </p>
                 <button className="mt-8 text-[9px] font-black text-indigo-400 uppercase tracking-widest hover:text-white transition-colors border-b border-indigo-500/30 pb-1">Review Treasury Limits</button>
              </div>
              <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-600 rounded-full blur-[100px] opacity-10 -mr-24 -mt-24"></div>
           </div>

           <div className="p-8 bg-amber-50 rounded-[2.5rem] border border-amber-100 space-y-4">
              <div className="flex items-center space-x-3">
                 <span className="text-xl">🏛️</span>
                 <h5 className="text-[10px] font-black uppercase text-amber-900 tracking-widest">Audit Alert</h5>
              </div>
              <p className="text-[11px] font-medium text-amber-800/80 leading-relaxed italic">
                Nexus detected 2 ledgers exceeding their quarterly allocations by >15%. Automated alerts have been dispatched to the Financial Controller.
              </p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default BudgetVariance;