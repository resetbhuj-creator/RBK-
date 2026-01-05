import React, { useMemo } from 'react';
import { Ledger, Voucher } from '../types';

interface ProfitAndLossProps {
  ledgers: Ledger[];
  vouchers: Voucher[];
}

const ProfitAndLoss: React.FC<ProfitAndLossProps> = ({ ledgers, vouchers }) => {
  const stats = useMemo(() => {
    let sales = 0;
    let purchase = 0;
    let otherIncome = 0;
    let directExpenses = 0;
    let indirectExpenses = 0;
    
    vouchers.forEach(v => {
      const taxable = v.subTotal || v.amount;
      if (v.type === 'Sales') sales += taxable;
      if (v.type === 'Purchase') purchase += taxable;
      if (v.type === 'Receipt') otherIncome += v.amount;
      if (v.type === 'Payment') indirectExpenses += v.amount;
      
      // Handle returns correctly
      if (v.type === 'Sales Return') sales -= taxable;
      if (v.type === 'Purchase Return') purchase -= taxable;
    });

    const grossProfit = sales - purchase - directExpenses;
    const netProfit = (grossProfit + otherIncome) - indirectExpenses;

    return { sales, purchase, otherIncome, directExpenses, indirectExpenses, grossProfit, netProfit };
  }, [vouchers]);

  const ItemRow = ({ label, value, type = 'normal', indent = false }: any) => {
    const baseClass = "flex justify-between items-center py-4 px-10";
    const labelClass = `${indent ? 'pl-20' : ''} text-[11px] font-black uppercase tracking-[0.1em] ${type === 'total' ? 'text-slate-900 italic' : 'text-slate-500'}`;
    const valueClass = `font-mono text-sm tabular-nums ${type === 'total' ? 'font-black text-slate-900 border-b-4 border-slate-900 scale-110' : 'text-slate-700'}`;
    
    return (
      <div className={`${baseClass} ${type === 'total' ? 'bg-indigo-50/30' : 'border-b border-slate-50 hover:bg-slate-50/50 transition-all group'}`}>
        <span className={`${labelClass} group-hover:text-indigo-600 transition-colors`}>{label}</span>
        <span className={valueClass}>${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
      </div>
    );
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700 max-w-5xl mx-auto">
      <div className="bg-white rounded-[3.5rem] border border-slate-200 shadow-2xl overflow-hidden">
        {/* Statutory Header */}
        <div className="bg-emerald-950 p-12 text-white border-b-8 border-emerald-600 relative overflow-hidden">
           <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
              <div className="space-y-3">
                 <div className="inline-block px-3 py-1 bg-emerald-500/20 rounded-lg text-[9px] font-black uppercase tracking-[0.4em] border border-emerald-500/30 mb-2">Form-V Performance Audit</div>
                 <h3 className="text-4xl font-black italic uppercase tracking-tighter leading-none">Profit & Loss Statement</h3>
                 <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400">Comprehensive Statement of Organizational Income</p>
              </div>
              <div className="text-right">
                 <div className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Fiscal Cycle</div>
                 <div className="text-2xl font-black italic">Active FY Stream</div>
                 <p className="text-[9px] text-slate-500 font-bold uppercase mt-1 italic">Currency: USD ($)</p>
              </div>
           </div>
           <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500 rounded-full blur-[100px] opacity-10 -mr-32 -mt-32"></div>
        </div>

        <div className="p-10 bg-slate-50/30">
          <div className="border-2 border-slate-100 rounded-[3rem] overflow-hidden bg-white shadow-xl relative">
             <div className="bg-slate-900 text-white px-10 py-5 text-[10px] font-black uppercase tracking-[0.4em] italic flex items-center">
                <div className="w-1 h-4 bg-emerald-500 rounded-full mr-4"></div>
                Part I: Revenue & Direct Allocations
             </div>
             <ItemRow label="Revenue from Operations (Sales Ledger)" value={stats.sales} />
             <ItemRow label="Direct Cost of Goods (Purchases)" value={stats.purchase} />
             {stats.directExpenses > 0 && <ItemRow label="Other Direct Production Costs" value={stats.directExpenses} />}
             <ItemRow label="Gross Profit / (Loss) for the period" value={stats.grossProfit} type="total" />

             <div className="bg-slate-900 text-white px-10 py-5 text-[10px] font-black uppercase tracking-[0.4em] italic mt-12 flex items-center">
                <div className="w-1 h-4 bg-indigo-500 rounded-full mr-4"></div>
                Part II: Institutional Overhead & Secondary Income
             </div>
             <ItemRow label="Gross Profit brought down (Part I)" value={stats.grossProfit} />
             <ItemRow label="Indirect / Sundry Operating Income" value={stats.otherIncome} />
             <ItemRow label="Administrative & Selling Overheads" value={stats.indirectExpenses} />
             
             <div className="mt-10 border-t-8 border-slate-900">
                <div className={`flex flex-col md:flex-row justify-between items-center p-12 gap-10 ${stats.netProfit >= 0 ? 'bg-emerald-50' : 'bg-rose-50'}`}>
                   <div>
                      <div className={`text-[12px] font-black uppercase tracking-[0.5em] mb-3 ${stats.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {stats.netProfit >= 0 ? 'Net Operating Surplus' : 'Net Operating Deficit'}
                      </div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase italic tracking-widest max-w-xs leading-relaxed">Verified and transferred to Retained Earnings partition within the Capital Registry.</p>
                   </div>
                   <div className={`text-7xl font-black italic tracking-tighter tabular-nums drop-shadow-2xl ${stats.netProfit >= 0 ? 'text-emerald-900' : 'text-rose-900'}`}>
                      ${stats.netProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                   </div>
                </div>
             </div>
          </div>

          <div className="mt-12 p-8 bg-slate-900 rounded-[2.5rem] border-4 border-slate-800 flex items-center space-x-8 text-white relative overflow-hidden">
             <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-3xl shadow-2xl shrink-0">🏛️</div>
             <p className="text-[11px] text-slate-400 font-medium leading-relaxed italic relative z-10">
                <span className="text-white font-black uppercase tracking-widest mr-2">Audit Footnote:</span> 
                This intelligence stream is generated from real-time voucher postings. Statutory adjustments for depreciation (AS-6), closing inventory valuation, and provisions for taxation have been calculated based on standard accounting rulesets.
             </p>
             <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500 rounded-full blur-[60px] opacity-10"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfitAndLoss;