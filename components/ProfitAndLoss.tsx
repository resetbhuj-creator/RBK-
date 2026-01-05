import React, { useMemo, useState } from 'react';
import { Ledger, Voucher } from '../types';

interface ProfitAndLossProps {
  ledgers: Ledger[];
  vouchers: Voucher[];
  onDrillDown?: (ledgerId: string) => void;
}

type ComparisonMode = 'NONE' | 'PREVIOUS' | 'BUDGET';

const ProfitAndLoss: React.FC<ProfitAndLossProps> = ({ ledgers, vouchers, onDrillDown }) => {
  const [comparisonMode, setComparisonMode] = useState<ComparisonMode>('NONE');

  const stats = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const prevYear = currentYear - 1;

    const calculateMetrics = (filterVouchers: Voucher[]) => {
      let sales = 0;
      let purchase = 0;
      let otherIncome = 0;
      let directExpenses = 0;
      let indirectExpenses = 0;
      
      filterVouchers.forEach(v => {
        const taxable = v.subTotal || v.amount;
        if (v.type === 'Sales') sales += taxable;
        if (v.type === 'Purchase') purchase += taxable;
        if (v.type === 'Receipt') otherIncome += v.amount;
        if (v.type === 'Payment') indirectExpenses += v.amount;
        
        if (v.type === 'Sales Return') sales -= taxable;
        if (v.type === 'Purchase Return') purchase -= taxable;
      });

      const grossProfit = sales - purchase - directExpenses;
      const netProfit = (grossProfit + otherIncome) - indirectExpenses;

      return { sales, purchase, otherIncome, directExpenses, indirectExpenses, grossProfit, netProfit };
    };

    const currentVouchers = vouchers.filter(v => new Date(v.date).getFullYear() === currentYear);
    const prevVouchers = vouchers.filter(v => new Date(v.date).getFullYear() === prevYear);

    // Budget aggregation from ledgers
    const budgetMetrics = {
      sales: ledgers.filter(l => l.group === 'Sales Accounts').reduce((acc, l) => acc + (l.budget || 0), 0),
      purchase: ledgers.filter(l => l.group === 'Purchase Accounts').reduce((acc, l) => acc + (l.budget || 0), 0),
      otherIncome: ledgers.filter(l => l.group === 'Indirect Incomes').reduce((acc, l) => acc + (l.budget || 0), 0),
      directExpenses: ledgers.filter(l => l.group === 'Direct Expenses').reduce((acc, l) => acc + (l.budget || 0), 0),
      indirectExpenses: ledgers.filter(l => l.group === 'Indirect Expenses').reduce((acc, l) => acc + (l.budget || 0), 0),
      grossProfit: 0,
      netProfit: 0
    };
    budgetMetrics.grossProfit = budgetMetrics.sales - budgetMetrics.purchase - budgetMetrics.directExpenses;
    budgetMetrics.netProfit = (budgetMetrics.grossProfit + budgetMetrics.otherIncome) - budgetMetrics.indirectExpenses;

    return {
      current: calculateMetrics(currentVouchers),
      previous: calculateMetrics(prevVouchers),
      budget: budgetMetrics
    };
  }, [vouchers, ledgers]);

  const ItemRow = ({ label, field, type = 'normal', indent = false }: any) => {
    const currentValue = (stats.current as any)[field];
    const compareValue = comparisonMode === 'PREVIOUS' ? (stats.previous as any)[field] : (stats.budget as any)[field];
    const hasCompare = comparisonMode !== 'NONE';
    
    // Variance calculation
    const variance = hasCompare ? currentValue - compareValue : 0;
    const varPercent = hasCompare && compareValue !== 0 ? (variance / Math.abs(compareValue)) * 100 : 0;
    const isGood = field === 'sales' || field === 'otherIncome' || field === 'grossProfit' || field === 'netProfit' 
      ? variance > 0 : variance < 0;

    return (
      <div 
        onClick={() => !type.includes('total') && onDrillDown?.(field)}
        className={`flex justify-between items-center py-4 px-10 transition-all border-b border-slate-50 group ${
          type === 'total' ? 'bg-slate-900 text-white' : 'hover:bg-slate-50/80 cursor-pointer'
        }`}
      >
        <div className="flex items-center space-x-4">
           {indent && <div className="w-8 h-px bg-slate-200"></div>}
           <span className={`text-[11px] font-black uppercase tracking-[0.1em] ${type === 'total' ? 'text-emerald-400 italic' : 'text-slate-500 group-hover:text-indigo-600'}`}>
             {label}
           </span>
        </div>

        <div className="flex items-center space-x-12">
           {hasCompare && (
             <div className="flex flex-col items-end w-32">
                <span className="text-[10px] font-black text-slate-400 tabular-nums">
                  ${compareValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
                <span className={`text-[8px] font-bold ${isGood ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {variance > 0 ? '▲' : '▼'} {Math.abs(varPercent).toFixed(1)}%
                </span>
             </div>
           )}
           <span className={`font-mono text-sm tabular-nums w-32 text-right ${type === 'total' ? 'font-black text-white text-lg' : 'text-slate-900'}`}>
             ${currentValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
           </span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700 max-w-5xl mx-auto pb-20">
      <div className="bg-white rounded-[3.5rem] border border-slate-200 shadow-2xl overflow-hidden">
        {/* Statutory Header */}
        <div className="bg-emerald-950 p-12 text-white border-b-8 border-emerald-600 relative overflow-hidden">
           <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
              <div className="space-y-3">
                 <div className="inline-block px-3 py-1 bg-emerald-500/20 rounded-lg text-[9px] font-black uppercase tracking-[0.4em] border border-emerald-500/30 mb-2">Performance Audit</div>
                 <h3 className="text-4xl font-black italic uppercase tracking-tighter leading-none">Profit & Loss Statement</h3>
                 <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400">Comprehensive Statement of Organizational Income</p>
              </div>
              <div className="bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10 flex flex-col space-y-3">
                   <label className="text-[8px] font-black uppercase tracking-[0.3em] text-emerald-400">Analysis Mode</label>
                   <div className="flex bg-slate-900 p-1 rounded-xl">
                      {(['NONE', 'PREVIOUS', 'BUDGET'] as ComparisonMode[]).map(mode => (
                        <button 
                          key={mode} 
                          onClick={() => setComparisonMode(mode)}
                          className={`px-4 py-2 text-[9px] font-black uppercase tracking-tighter rounded-lg transition-all ${comparisonMode === mode ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                        >
                          {mode === 'NONE' ? 'Actual' : mode === 'PREVIOUS' ? 'Trend' : 'Budget'}
                        </button>
                      ))}
                   </div>
                </div>
           </div>
           <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500 rounded-full blur-[100px] opacity-10 -mr-32 -mt-32"></div>
        </div>

        <div className="p-10 bg-slate-50/30">
          {comparisonMode !== 'NONE' && (
            <div className="flex justify-end px-10 mb-4 space-x-12 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
               <span className="w-32 text-right">{comparisonMode === 'PREVIOUS' ? 'Prev Year' : 'Target'}</span>
               <span className="w-32 text-right text-emerald-600">Current</span>
            </div>
          )}

          <div className="border-2 border-slate-100 rounded-[3rem] overflow-hidden bg-white shadow-xl relative">
             <div className="bg-slate-900 text-white px-10 py-5 text-[10px] font-black uppercase tracking-[0.4em] italic flex items-center">
                <div className="w-1 h-4 bg-emerald-500 rounded-full mr-4"></div>
                Part I: Revenue & Direct Allocations
             </div>
             <ItemRow label="Revenue from Operations" field="sales" />
             <ItemRow label="Direct Cost of Goods" field="purchase" />
             <ItemRow label="Gross Profit / (Loss)" field="grossProfit" type="total" />

             <div className="bg-slate-900 text-white px-10 py-5 text-[10px] font-black uppercase tracking-[0.4em] italic mt-12 flex items-center">
                <div className="w-1 h-4 bg-indigo-500 rounded-full mr-4"></div>
                Part II: Institutional Overhead & Secondary Income
             </div>
             <ItemRow label="Other Operating Income" field="otherIncome" />
             <ItemRow label="Administrative Expenses" field="indirectExpenses" />
             
             <div className="mt-10 border-t-8 border-slate-900">
                <div className={`flex flex-col md:flex-row justify-between items-center p-12 gap-10 ${stats.current.netProfit >= 0 ? 'bg-emerald-50' : 'bg-rose-50'}`}>
                   <div>
                      <div className={`text-[12px] font-black uppercase tracking-[0.5em] mb-3 ${stats.current.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {stats.current.netProfit >= 0 ? 'Net Operating Surplus' : 'Net Operating Deficit'}
                      </div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase italic tracking-widest max-w-xs leading-relaxed">
                        Result for the selected period after all statutory deductions.
                      </p>
                   </div>
                   <div className={`text-7xl font-black italic tracking-tighter tabular-nums drop-shadow-2xl ${stats.current.netProfit >= 0 ? 'text-emerald-900' : 'text-rose-900'}`}>
                      ${stats.current.netProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                   </div>
                </div>
             </div>
          </div>

          <div className="mt-12 p-8 bg-slate-900 rounded-[2.5rem] border-4 border-slate-800 flex items-center space-x-8 text-white relative overflow-hidden">
             <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-3xl shadow-2xl shrink-0">🏛️</div>
             <p className="text-[11px] text-slate-400 font-medium leading-relaxed italic relative z-10">
                <span className="text-white font-black uppercase tracking-widest mr-2">Audit Footnote:</span> 
                This intelligence stream is generated from real-time voucher postings. Click any revenue or expense category to view the underlying ledger shards and individual transaction hashes.
             </p>
             <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500 rounded-full blur-[60px] opacity-10"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfitAndLoss;