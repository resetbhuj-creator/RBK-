import React, { useMemo } from 'react';
import { Ledger, Voucher } from '../types';
import ActionMenu, { ActionItem } from './ActionMenu';

interface BalanceSheetProps {
  ledgers: Ledger[];
  vouchers: Voucher[];
}

const BalanceSheet: React.FC<BalanceSheetProps> = ({ ledgers, vouchers }) => {
  const data = useMemo(() => {
    const categories = {
      fixedAssets: [] as any[],
      currentAssets: [] as any[],
      equity: [] as any[],
      longTermLiabilities: [] as any[],
      currentLiabilities: [] as any[]
    };
    
    ledgers.forEach(l => {
      let balance = l.openingBalance;
      vouchers.forEach(v => {
        if (v.ledgerId === l.id) {
          balance += (l.type === 'Debit' ? v.amount : -v.amount);
        }
      });

      const entry = { id: l.id, name: l.name, balance };
      const group = l.group.toLowerCase();

      if (group.includes('fixed') || group.includes('investment')) {
        categories.fixedAssets.push(entry);
      } else if (group.includes('bank') || group.includes('cash') || group.includes('debtor') || group.includes('current assets')) {
        categories.currentAssets.push(entry);
      } else if (group.includes('capital') || group.includes('reserve') || group.includes('equity')) {
        categories.equity.push(entry);
      } else if (group.includes('loan') || group.includes('secured')) {
        categories.longTermLiabilities.push(entry);
      } else {
        categories.currentLiabilities.push(entry);
      }
    });

    const sum = (arr: any[]) => arr.reduce((acc, x) => acc + x.balance, 0);

    return {
      ...categories,
      totalFixed: sum(categories.fixedAssets),
      totalCurrentA: sum(categories.currentAssets),
      totalEquity: sum(categories.equity),
      totalLongLiab: sum(categories.longTermLiabilities),
      totalCurrentLiab: sum(categories.currentLiabilities)
    };
  }, [ledgers, vouchers]);

  const totalAssets = data.totalFixed + data.totalCurrentA;
  const totalLiabEquity = data.totalEquity + data.totalLongLiab + data.totalCurrentLiab;

  const ReportRow = ({ label, value, isHeader = false, isTotal = false }: any) => (
    <div className={`flex justify-between items-center py-2 px-4 ${isHeader ? 'bg-slate-50 font-black text-[10px] uppercase text-slate-500 tracking-widest' : 'text-xs text-slate-700'} ${isTotal ? 'border-t-2 border-slate-900 mt-2 font-black text-slate-900 bg-indigo-50/30' : 'border-b border-slate-50 hover:bg-slate-50/50'}`}>
      <span className={isHeader ? 'mt-2 mb-1' : ''}>{label}</span>
      <span className="font-mono tabular-nums">${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto">
      <div className="bg-white rounded-[3rem] border border-slate-200 shadow-2xl overflow-hidden">
        {/* Statutory Header */}
        <div className="bg-indigo-950 p-12 text-white border-b-8 border-indigo-600">
           <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="space-y-2">
                 <h3 className="text-3xl font-black italic uppercase tracking-tighter">Statement of Financial Position</h3>
                 <p className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400">Balance Sheet • Consolidated Audit View</p>
              </div>
              <div className="text-right">
                 <div className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Reporting Period</div>
                 <div className="text-xl font-black italic">As on {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                 <p className="text-[9px] text-slate-500 font-bold uppercase mt-1 italic">All amounts in USD ($)</p>
              </div>
           </div>
        </div>

        <div className="p-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            {/* Equities & Liabilities */}
            <section className="space-y-2">
              <h4 className="text-[11px] font-black uppercase text-indigo-600 tracking-[0.2em] border-b-2 border-indigo-100 pb-2 mb-4">I. EQUITY AND LIABILITIES</h4>
              
              <ReportRow label="Shareholders' Funds" isHeader value={data.totalEquity} />
              {data.equity.map((l, i) => <ReportRow key={i} label={l.name} value={l.balance} />)}
              
              <ReportRow label="Non-Current Liabilities" isHeader value={data.totalLongLiab} />
              {data.longTermLiabilities.map((l, i) => <ReportRow key={i} label={l.name} value={l.balance} />)}
              
              <ReportRow label="Current Liabilities" isHeader value={data.totalCurrentLiab} />
              {data.currentLiabilities.map((l, i) => <ReportRow key={i} label={l.name} value={l.balance} />)}
              
              <ReportRow label="Total Equity & Liabilities" value={totalLiabEquity} isTotal />
            </section>

            {/* Assets */}
            <section className="space-y-2">
              <h4 className="text-[11px] font-black uppercase text-indigo-600 tracking-[0.2em] border-b-2 border-indigo-100 pb-2 mb-4">II. ASSETS</h4>
              
              <ReportRow label="Non-Current Assets" isHeader value={data.totalFixed} />
              {data.fixedAssets.map((l, i) => <ReportRow key={i} label={l.name} value={l.balance} />)}
              
              <ReportRow label="Current Assets" isHeader value={data.totalCurrentA} />
              {data.currentAssets.map((l, i) => <ReportRow key={i} label={l.name} value={l.balance} />)}
              
              <div className="pt-2">
                <ReportRow label="Total Assets" value={totalAssets} isTotal />
              </div>
            </section>
          </div>

          {/* Validation Footer */}
          <div className="mt-16 p-8 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200 flex flex-col md:flex-row items-center justify-between">
             <div className="flex items-center space-x-4">
                <div className={`w-3 h-3 rounded-full ${Math.abs(totalAssets - totalLiabEquity) < 1 ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-rose-500 shadow-[0_0_8px_#f43f5e] animate-pulse'}`}></div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Integrity Check: {Math.abs(totalAssets - totalLiabEquity) < 1 ? 'Balanced' : 'Variance Detected'}</span>
             </div>
             <div className="flex space-x-6 mt-4 md:mt-0">
                <button className="text-[10px] font-black text-indigo-600 uppercase hover:underline decoration-indigo-200 underline-offset-4">Schedule Audit</button>
                <button className="text-[10px] font-black text-indigo-600 uppercase hover:underline decoration-indigo-200 underline-offset-4">Export Schedule III</button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BalanceSheet;