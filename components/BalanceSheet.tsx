import React, { useMemo } from 'react';
import { Ledger, Voucher } from '../types';

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
        // Simple balance logic for preview
        if (v.ledgerId === l.id) {
          balance += (l.type === 'Debit' ? v.amount : -v.amount);
        }
        v.entries?.forEach(e => {
          if (e.ledgerId === l.id) {
            balance += (l.type === 'Debit' ? (e.type === 'Dr' ? e.amount : -e.amount) : (e.type === 'Cr' ? e.amount : -e.amount));
          }
        });
      });

      const entry = { id: l.id, name: l.name, balance };
      const group = l.group.toLowerCase();

      if (group.includes('fixed') || group.includes('investment') || group.includes('asset')) {
         if (group.includes('current')) categories.currentAssets.push(entry);
         else categories.fixedAssets.push(entry);
      } else if (group.includes('capital') || group.includes('reserve') || group.includes('equity')) {
        categories.equity.push(entry);
      } else if (group.includes('loan') || group.includes('liability')) {
         if (group.includes('current')) categories.currentLiabilities.push(entry);
         else categories.longTermLiabilities.push(entry);
      } else {
        categories.currentAssets.push(entry);
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
    <div className={`flex justify-between items-center py-3.5 px-6 ${isHeader ? 'bg-slate-900 font-black text-[9px] uppercase text-indigo-400 tracking-[0.2em]' : 'text-[11px] font-bold uppercase text-slate-600'} ${isTotal ? 'border-t-4 border-slate-900 mt-4 font-black text-slate-900 bg-slate-50 scale-105 shadow-sm' : 'border-b border-slate-50 hover:bg-slate-50/50 transition-colors'}`}>
      <span>{label}</span>
      <span className="font-mono tabular-nums text-slate-900">${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
    </div>
  );

  return (
    <div className="space-y-12 animate-in fade-in duration-700 max-w-[1400px] mx-auto pb-20">
      <div className="bg-white rounded-[4rem] border border-slate-200 shadow-2xl overflow-hidden relative">
        <div className="bg-indigo-950 p-16 text-white border-b-8 border-indigo-600 relative overflow-hidden">
           <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-10">
              <div className="space-y-4">
                 <div className="inline-block px-3 py-1 bg-white/5 rounded-lg text-[9px] font-black uppercase tracking-[0.4em] border border-white/10 mb-2">Statutory Schedule III View</div>
                 <h3 className="text-5xl font-black italic uppercase tracking-tighter leading-none">Statement of Position</h3>
                 <p className="text-[11px] font-black uppercase tracking-[0.5em] text-indigo-400">Balance Sheet • Enterprise Intelligence Node</p>
              </div>
              <div className="text-right flex flex-col items-end">
                 <div className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-2">Audit Timestamp</div>
                 <div className="text-3xl font-black italic tabular-nums">As on {new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                 <p className="text-[10px] text-slate-500 font-bold uppercase mt-3 italic tracking-tighter underline decoration-slate-700 underline-offset-4">Verified Reconciled Registry</p>
              </div>
           </div>
           <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-600 rounded-full blur-[200px] opacity-10 -mr-96 -mt-96 pointer-events-none"></div>
        </div>

        <div className="p-16">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-24">
            {/* Equities & Liabilities */}
            <section className="space-y-3 relative">
              <div className="flex items-center space-x-5 mb-8">
                 <div className="w-2 h-10 bg-indigo-600 rounded-full"></div>
                 <h4 className="text-xl font-black uppercase italic tracking-tight text-slate-800">I. EQUITY AND LIABILITIES</h4>
              </div>
              
              <ReportRow label="Shareholders' Funds" isHeader value={data.totalEquity} />
              {data.equity.map((l, i) => <ReportRow key={i} label={l.name} value={l.balance} />)}
              
              <div className="h-10"></div>
              <ReportRow label="Non-Current Liabilities" isHeader value={data.totalLongLiab} />
              {data.longTermLiabilities.map((l, i) => <ReportRow key={i} label={l.name} value={l.balance} />)}
              
              <div className="h-10"></div>
              <ReportRow label="Current Liabilities" isHeader value={data.totalCurrentLiab} />
              {data.currentLiabilities.map((l, i) => <ReportRow key={i} label={l.name} value={l.balance} />)}
              
              <div className="pt-8">
                <ReportRow label="Total Equity & Liabilities" value={totalLiabEquity} isTotal />
              </div>
            </section>

            {/* Assets */}
            <section className="space-y-3 relative">
              <div className="flex items-center space-x-5 mb-8">
                 <div className="w-2 h-10 bg-emerald-600 rounded-full"></div>
                 <h4 className="text-xl font-black uppercase italic tracking-tight text-slate-800">II. ASSETS</h4>
              </div>
              
              <ReportRow label="Non-Current Assets" isHeader value={data.totalFixed} />
              {data.fixedAssets.map((l, i) => <ReportRow key={i} label={l.name} value={l.balance} />)}
              
              <div className="h-10"></div>
              <ReportRow label="Current Assets" isHeader value={data.totalCurrentA} />
              {data.currentAssets.map((l, i) => <ReportRow key={i} label={l.name} value={l.balance} />)}
              
              <div className="pt-2">
                <div className="h-[218px] hidden xl:block"></div> {/* Spacer to align totals vertically */}
                <ReportRow label="Total Aggregate Assets" value={totalAssets} isTotal />
              </div>
            </section>
          </div>

          <div className={`mt-24 p-12 rounded-[3rem] border-4 border-dashed transition-all flex flex-col md:flex-row items-center justify-between gap-10 ${Math.abs(totalAssets - totalLiabEquity) < 1 ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
             <div className="flex items-center space-x-8">
                <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center text-4xl shadow-2xl border-4 ${Math.abs(totalAssets - totalLiabEquity) < 1 ? 'bg-emerald-500 text-white border-emerald-400/30' : 'bg-rose-500 text-white border-rose-400/30 animate-pulse'}`}>
                  {Math.abs(totalAssets - totalLiabEquity) < 1 ? '✓' : '⚠'}
                </div>
                <div>
                   <h5 className={`text-2xl font-black uppercase italic tracking-tight ${Math.abs(totalAssets - totalLiabEquity) < 1 ? 'text-emerald-900' : 'text-rose-900'}`}>
                     {Math.abs(totalAssets - totalLiabEquity) < 1 ? 'Ledger Symmetry Verified' : 'Critical Balance Variance'}
                   </h5>
                   <p className="text-sm font-medium text-slate-500 mt-1 italic">
                     {Math.abs(totalAssets - totalLiabEquity) < 1 
                        ? 'All ledger partitions are mathematically reconciled against the fundamental accounting equation.' 
                        : `A variance of $${Math.abs(totalAssets - totalLiabEquity).toLocaleString()} was detected in the active data shard.`}
                   </p>
                </div>
             </div>
             <div className="flex items-center space-x-4">
                <button className="px-12 py-5 bg-slate-900 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-indigo-600 transition-all transform active:scale-95 border-b-4 border-black/30">Download Statutory XML</button>
             </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-emerald-500 to-rose-500"></div>
      </div>
    </div>
  );
};

export default BalanceSheet;