import React, { useMemo, useState } from 'react';
import { Ledger, Voucher } from '../types';

interface BalanceSheetProps {
  ledgers: Ledger[];
  vouchers: Voucher[];
  onDrillDown?: (ledgerId: string) => void;
}

type ComparisonMode = 'NONE' | 'PREVIOUS' | 'BUDGET';

const BalanceSheet: React.FC<BalanceSheetProps> = ({ ledgers, vouchers, onDrillDown }) => {
  const [comparisonMode, setComparisonMode] = useState<ComparisonMode>('NONE');

  const data = useMemo(() => {
    // Determine current period boundaries (Mocked based on common FY patterns if not explicitly provided)
    // In a production app, we'd use the activeCompany.fyStartDate
    const currentYear = new Date().getFullYear();
    const prevYear = currentYear - 1;

    const calculateBalances = (filterVouchers: Voucher[]) => {
      const categories = {
        fixedAssets: [] as any[],
        currentAssets: [] as any[],
        equity: [] as any[],
        longTermLiabilities: [] as any[],
        currentLiabilities: [] as any[]
      };

      ledgers.forEach(l => {
        let balance = l.openingBalance;
        filterVouchers.forEach(v => {
          if (v.ledgerId === l.id) {
            balance += (l.type === 'Debit' ? v.amount : -v.amount);
          }
          v.entries?.forEach(e => {
            if (e.ledgerId === l.id) {
              balance += (l.type === 'Debit' ? (e.type === 'Dr' ? e.amount : -e.amount) : (e.type === 'Cr' ? e.amount : -e.amount));
            }
          });
        });

        const entry = { id: l.id, name: l.name, balance, budget: l.budget || 0 };
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
      const sumBudget = (arr: any[]) => arr.reduce((acc, x) => acc + x.budget, 0);

      return {
        ...categories,
        totalFixed: sum(categories.fixedAssets),
        totalCurrentA: sum(categories.currentAssets),
        totalEquity: sum(categories.equity),
        totalLongLiab: sum(categories.longTermLiabilities),
        totalCurrentLiab: sum(categories.currentLiabilities),
        totalFixedBudget: sumBudget(categories.fixedAssets),
        totalCurrentABudget: sumBudget(categories.currentAssets),
        totalEquityBudget: sumBudget(categories.equity),
        totalLongLiabBudget: sumBudget(categories.longTermLiabilities),
        totalCurrentLiabBudget: sumBudget(categories.currentLiabilities)
      };
    };

    // Filter vouchers for current year
    const currentVouchers = vouchers.filter(v => new Date(v.date).getFullYear() === currentYear);
    // Filter vouchers for previous year (demo purposes)
    const prevVouchers = vouchers.filter(v => new Date(v.date).getFullYear() === prevYear);

    return {
      current: calculateBalances(currentVouchers),
      previous: calculateBalances(prevVouchers)
    };
  }, [ledgers, vouchers]);

  const currentTotalAssets = data.current.totalFixed + data.current.totalCurrentA;
  const currentTotalLiab = data.current.totalEquity + data.current.totalLongLiab + data.current.totalCurrentLiab;

  const getCompareValue = (category: string, ledgerId?: string) => {
    if (comparisonMode === 'NONE') return null;
    if (comparisonMode === 'BUDGET') {
      if (ledgerId) return ledgers.find(l => l.id === ledgerId)?.budget || 0;
      return (data.current as any)[category + 'Budget'] || 0;
    }
    // Previous Year
    if (ledgerId) {
      // Find ledger in previous data
      const catKeys = ['fixedAssets', 'currentAssets', 'equity', 'longTermLiabilities', 'currentLiabilities'];
      for (const key of catKeys) {
        const found = (data.previous as any)[key].find((l: any) => l.id === ledgerId);
        if (found) return found.balance;
      }
      return 0;
    }
    return (data.previous as any)[category] || 0;
  };

  const ReportRow = ({ label, value, ledgerId, isHeader = false, isTotal = false }: any) => {
    const compareVal = getCompareValue(isHeader ? label.replace(/\s+/g, '') : '', ledgerId);
    const hasCompare = comparisonMode !== 'NONE';

    return (
      <div 
        onClick={() => !isHeader && ledgerId && onDrillDown?.(ledgerId)}
        className={`flex justify-between items-center py-3.5 px-6 transition-all duration-200 ${
          isHeader ? 'bg-slate-900 font-black text-[9px] uppercase text-indigo-400 tracking-[0.2em]' : 
          'text-[11px] font-bold uppercase text-slate-600 cursor-pointer hover:bg-indigo-50 hover:pl-8'
        } ${
          isTotal ? 'border-t-4 border-slate-900 mt-4 font-black text-slate-900 bg-slate-50 scale-[1.02] shadow-md z-10' : 
          'border-b border-slate-50'
        }`}
      >
        <div className="flex items-center space-x-3">
          {ledgerId && <span className="text-[8px] opacity-0 group-hover:opacity-100 transition-opacity">🔍</span>}
          <span>{label}</span>
        </div>
        <div className="flex space-x-8">
          {hasCompare && (
            <span className="font-mono tabular-nums text-slate-400 text-right w-24">
              ${(compareVal || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          )}
          <span className={`font-mono tabular-nums text-right w-24 ${isTotal ? 'text-indigo-600' : 'text-slate-900'}`}>
            ${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700 max-w-[1400px] mx-auto pb-20">
      {/* Header Architecture */}
      <div className="bg-indigo-950 rounded-[4rem] border border-slate-200 shadow-2xl overflow-hidden relative">
        <div className="p-16 text-white border-b-8 border-indigo-600 relative overflow-hidden">
           <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-10">
              <div className="space-y-4">
                 <div className="inline-block px-3 py-1 bg-white/5 rounded-lg text-[9px] font-black uppercase tracking-[0.4em] border border-white/10 mb-2">Statutory Schedule III View</div>
                 <h3 className="text-5xl font-black italic uppercase tracking-tighter leading-none">Statement of Position</h3>
                 <p className="text-[11px] font-black uppercase tracking-[0.5em] text-indigo-400">Balance Sheet • Enterprise Intelligence Node</p>
              </div>
              <div className="flex items-center space-x-6">
                <div className="bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10 flex flex-col space-y-3">
                   <label className="text-[8px] font-black uppercase tracking-[0.3em] text-indigo-300">Comparison Engine</label>
                   <div className="flex bg-slate-900 p-1 rounded-xl">
                      {(['NONE', 'PREVIOUS', 'BUDGET'] as ComparisonMode[]).map(mode => (
                        <button 
                          key={mode} 
                          onClick={() => setComparisonMode(mode)}
                          className={`px-4 py-2 text-[9px] font-black uppercase tracking-tighter rounded-lg transition-all ${comparisonMode === mode ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                        >
                          {mode === 'NONE' ? 'Standard' : mode === 'PREVIOUS' ? 'Prev Year' : 'Budget'}
                        </button>
                      ))}
                   </div>
                </div>
              </div>
           </div>
           <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-600 rounded-full blur-[200px] opacity-10 -mr-96 -mt-96 pointer-events-none"></div>
        </div>

        <div className="p-16">
          {/* Column Headers for Comparative View */}
          {comparisonMode !== 'NONE' && (
            <div className="flex justify-end px-6 mb-4 space-x-8 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
               <span className="w-24 text-right">{comparisonMode === 'PREVIOUS' ? 'Previous' : 'Budgeted'}</span>
               <span className="w-24 text-right text-indigo-600">Actual</span>
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-24">
            {/* Equities & Liabilities */}
            <section className="space-y-1 relative">
              <div className="flex items-center space-x-5 mb-8">
                 <div className="w-2 h-10 bg-indigo-600 rounded-full"></div>
                 <h4 className="text-xl font-black uppercase italic tracking-tight text-slate-800">I. EQUITY AND LIABILITIES</h4>
              </div>
              
              <ReportRow label="Shareholders Funds" isHeader value={data.current.totalEquity} />
              {data.current.equity.map((l, i) => <ReportRow key={i} label={l.name} value={l.balance} ledgerId={l.id} />)}
              
              <div className="h-6"></div>
              <ReportRow label="Non-Current Liabilities" isHeader value={data.current.totalLongLiab} />
              {data.current.longTermLiabilities.map((l, i) => <ReportRow key={i} label={l.name} value={l.balance} ledgerId={l.id} />)}
              
              <div className="h-6"></div>
              <ReportRow label="Current Liabilities" isHeader value={data.current.totalCurrentLiab} />
              {data.current.currentLiabilities.map((l, i) => <ReportRow key={i} label={l.name} value={l.balance} ledgerId={l.id} />)}
              
              <div className="pt-8">
                <ReportRow label="Total Equity & Liabilities" value={currentTotalLiab} isTotal />
              </div>
            </section>

            {/* Assets */}
            <section className="space-y-1 relative">
              <div className="flex items-center space-x-5 mb-8">
                 <div className="w-2 h-10 bg-emerald-600 rounded-full"></div>
                 <h4 className="text-xl font-black uppercase italic tracking-tight text-slate-800">II. ASSETS</h4>
              </div>
              
              <ReportRow label="Non-Current Assets" isHeader value={data.current.totalFixed} />
              {data.current.fixedAssets.map((l, i) => <ReportRow key={i} label={l.name} value={l.balance} ledgerId={l.id} />)}
              
              <div className="h-6"></div>
              <ReportRow label="Current Assets" isHeader value={data.current.totalCurrentA} />
              {data.current.currentAssets.map((l, i) => <ReportRow key={i} label={l.name} value={l.balance} ledgerId={l.id} />)}
              
              <div className="pt-8">
                <div className="h-[210px] hidden xl:block"></div> {/* Alignment spacer */}
                <ReportRow label="Total Aggregate Assets" value={currentTotalAssets} isTotal />
              </div>
            </section>
          </div>

          <div className={`mt-24 p-12 rounded-[3rem] border-4 border-dashed transition-all flex flex-col md:flex-row items-center justify-between gap-10 ${Math.abs(currentTotalAssets - currentTotalLiab) < 1 ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
             <div className="flex items-center space-x-8">
                <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center text-4xl shadow-2xl border-4 ${Math.abs(currentTotalAssets - currentTotalLiab) < 1 ? 'bg-emerald-500 text-white border-emerald-400/30' : 'bg-rose-500 text-white border-rose-400/30 animate-pulse'}`}>
                  {Math.abs(currentTotalAssets - currentTotalLiab) < 1 ? '✓' : '⚠'}
                </div>
                <div>
                   <h5 className={`text-2xl font-black uppercase italic tracking-tight ${Math.abs(currentTotalAssets - currentTotalLiab) < 1 ? 'text-emerald-900' : 'text-rose-900'}`}>
                     {Math.abs(currentTotalAssets - currentTotalLiab) < 1 ? 'Ledger Symmetry Verified' : 'Critical Balance Variance'}
                   </h5>
                   <p className="text-sm font-medium text-slate-500 mt-1 italic">
                     {Math.abs(currentTotalAssets - currentTotalLiab) < 1 
                        ? 'All ledger partitions are mathematically reconciled against the fundamental accounting equation.' 
                        : `A variance of $${Math.abs(currentTotalAssets - currentTotalLiab).toLocaleString()} was detected in the active data shard.`}
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