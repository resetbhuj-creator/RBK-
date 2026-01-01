import React, { useMemo } from 'react';
import { Ledger, Voucher } from '../types';
import ActionMenu, { ActionItem } from './ActionMenu';

interface ProfitAndLossProps {
  ledgers: Ledger[];
  vouchers: Voucher[];
}

const ProfitAndLoss: React.FC<ProfitAndLossProps> = ({ ledgers, vouchers }) => {
  const data = useMemo(() => {
    let income = 0;
    let expenses = 0;
    
    vouchers.forEach(v => {
      if (v.type === 'Sales' || v.type === 'Receipt') income += v.amount;
      if (v.type === 'Purchase' || v.type === 'Payment') expenses += v.amount;
    });

    const netProfit = income - expenses;
    return { income, expenses, netProfit };
  }, [vouchers]);

  const summaryActions = (type: string): ActionItem[] => [
    { 
      label: 'Analyze Trend', 
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>,
      onClick: () => alert(`Opening 12-month trend for ${type}...`),
      variant: 'primary'
    },
    { 
      label: 'Center Breakdown', 
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>,
      onClick: () => alert(`Analyzing cost centers for ${type}...`)
    },
    { 
      label: 'Export Annexure', 
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>,
      onClick: () => alert(`Dispatched ${type} breakdown to XLSX.`)
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-white rounded-[3rem] border border-slate-200 shadow-2xl overflow-hidden max-w-4xl mx-auto">
        <div className="bg-emerald-600 px-12 py-10 text-white flex items-center justify-between">
           <div>
             <h3 className="text-3xl font-black italic uppercase tracking-tighter">Profit & Loss Account</h3>
             <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80 mt-2">Operational Performance Summary</p>
           </div>
           <button onClick={() => alert('Extracting statutory format...')} className="p-4 bg-white/20 hover:bg-white/30 rounded-2xl border border-white/10 transition-all">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
           </button>
        </div>

        <div className="p-12 space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
             <div className="space-y-6 group">
                <div className="flex items-center justify-between">
                  <h4 className="text-[11px] font-black uppercase text-slate-400 tracking-widest border-b pb-2 flex-1">Revenues</h4>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity ml-4 -mt-2">
                    <ActionMenu actions={summaryActions('Operating Income')} label="Analytics" />
                  </div>
                </div>
                <div className="flex justify-between items-end">
                   <span className="text-xs font-black text-slate-600 uppercase">Gross Operating Income</span>
                   <span className="text-2xl font-black text-emerald-600">${data.income.toLocaleString()}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                   <div className="h-full bg-emerald-500 w-full animate-in slide-in-from-left duration-1000"></div>
                </div>
             </div>

             <div className="space-y-6 group">
                <div className="flex items-center justify-between">
                  <h4 className="text-[11px] font-black uppercase text-slate-400 tracking-widest border-b pb-2 flex-1">Expenditure</h4>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity ml-4 -mt-2">
                    <ActionMenu actions={summaryActions('Operating Expenses')} label="Analytics" />
                  </div>
                </div>
                <div className="flex justify-between items-end">
                   <span className="text-xs font-black text-slate-600 uppercase">Operating Overheads</span>
                   <span className="text-2xl font-black text-rose-600">${data.expenses.toLocaleString()}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                   <div className="h-full bg-rose-500 transition-all duration-1000" style={{ width: `${(data.expenses/data.income) * 100}%` }}></div>
                </div>
             </div>
          </div>

          <div className={`p-10 rounded-[2.5rem] text-center border-4 relative overflow-hidden transition-all ${data.netProfit >= 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
             <div className={`text-[10px] font-black uppercase tracking-[0.4em] mb-4 ${data.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {data.netProfit >= 0 ? 'Net Surplus Generated' : 'Operating Deficit Detected'}
             </div>
             <div className={`text-6xl font-black italic tracking-tighter ${data.netProfit >= 0 ? 'text-emerald-900' : 'text-rose-900'}`}>
                ${Math.abs(data.netProfit).toLocaleString()}
             </div>
             <p className="mt-6 text-xs font-medium text-slate-400 max-w-sm mx-auto leading-relaxed">
                Calculated across all verified vouchers for the active financial period. Subject to end-of-year adjustments.
             </p>
             <div className="absolute top-0 right-0 w-32 h-32 bg-white/50 blur-3xl rounded-full -mr-16 -mt-16"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfitAndLoss;