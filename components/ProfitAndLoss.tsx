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
    let indirectExpenses = 0;
    
    vouchers.forEach(v => {
      if (v.type === 'Sales') sales += (v.subTotal || v.amount);
      if (v.type === 'Purchase') purchase += (v.subTotal || v.amount);
      if (v.type === 'Receipt') otherIncome += v.amount;
      if (v.type === 'Payment') indirectExpenses += v.amount;
    });

    const grossProfit = sales - purchase;
    const netProfit = (grossProfit + otherIncome) - indirectExpenses;

    return { sales, purchase, otherIncome, indirectExpenses, grossProfit, netProfit };
  }, [vouchers]);

  const ItemRow = ({ label, value, type = 'normal', indent = false }: any) => {
    const baseClass = "flex justify-between items-center py-3 px-6";
    const labelClass = `${indent ? 'pl-10' : ''} text-xs font-bold uppercase tracking-tight ${type === 'total' ? 'text-slate-900' : 'text-slate-500'}`;
    const valueClass = `font-mono text-sm tabular-nums ${type === 'total' ? 'font-black text-slate-900 border-b-2 border-slate-900' : 'text-slate-700'}`;
    
    return (
      <div className={`${baseClass} ${type === 'total' ? 'bg-slate-50' : 'border-b border-slate-50 hover:bg-slate-50/50 transition-colors'}`}>
        <span className={labelClass}>{label}</span>
        <span className={valueClass}>${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
      <div className="bg-white rounded-[3rem] border border-slate-200 shadow-2xl overflow-hidden">
        {/* Statutory Header */}
        <div className="bg-emerald-900 p-12 text-white border-b-8 border-emerald-600">
           <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="space-y-2">
                 <h3 className="text-3xl font-black italic uppercase tracking-tighter">Profit & Loss Statement</h3>
                 <p className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-400">Statement of Comprehensive Income</p>
              </div>
              <div className="text-right">
                 <div className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Reporting Period</div>
                 <div className="text-xl font-black italic">FY 2023 - 2024</div>
                 <p className="text-[9px] text-slate-500 font-bold uppercase mt-1 italic">Consolidated Node Output</p>
              </div>
           </div>
        </div>

        <div className="p-10">
          <div className="border-2 border-slate-100 rounded-[2rem] overflow-hidden bg-white shadow-sm">
             <div className="bg-slate-900 text-white px-8 py-3 text-[10px] font-black uppercase tracking-[0.3em]">I. Trading Account</div>
             <ItemRow label="Revenue from Operations (Gross Sales)" value={stats.sales} />
             <ItemRow label="Less: Cost of Goods Sold (Purchases)" value={stats.purchase} />
             <ItemRow label="Gross Profit / (Loss) carried down" value={stats.grossProfit} type="total" />

             <div className="bg-slate-900 text-white px-8 py-3 text-[10px] font-black uppercase tracking-[0.3em] mt-8">II. Profit & Loss Account</div>
             <ItemRow label="Gross Profit b/f" value={stats.grossProfit} />
             <ItemRow label="Add: Other Operating Income" value={stats.otherIncome} />
             <ItemRow label="Less: Indirect Operating Expenses" value={stats.indirectExpenses} />
             
             <div className="mt-6 border-t-4 border-slate-900">
                <div className={`flex justify-between items-center p-8 ${stats.netProfit >= 0 ? 'bg-emerald-50' : 'bg-rose-50'}`}>
                   <div>
                      <div className={`text-[10px] font-black uppercase tracking-[0.4em] mb-1 ${stats.netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {stats.netProfit >= 0 ? 'Net Profit for the Period' : 'Net Loss for the Period'}
                      </div>
                      <p className="text-[9px] text-slate-400 font-bold uppercase italic tracking-widest">Transferred to Capital Reserves</p>
                   </div>
                   <div className={`text-5xl font-black italic tracking-tighter tabular-nums ${stats.netProfit >= 0 ? 'text-emerald-900' : 'text-rose-900'}`}>
                      ${stats.netProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                   </div>
                </div>
             </div>
          </div>

          <div className="mt-10 p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-center space-x-4">
             <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm">💡</div>
             <p className="text-[10px] text-slate-500 font-medium leading-relaxed italic">
                Note: This statement is an interim draft generated from verified transaction streams. Closing stock valuation and depreciation adjustments have not been applied in this view.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfitAndLoss;