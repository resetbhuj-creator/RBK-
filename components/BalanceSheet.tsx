import React, { useMemo } from 'react';
import { Ledger, Voucher } from '../types';
import ActionMenu, { ActionItem } from './ActionMenu';

interface BalanceSheetProps {
  ledgers: Ledger[];
  vouchers: Voucher[];
}

interface ReportRowProps {
  label: string;
  value: number;
  isBold?: boolean;
  actions?: ActionItem[];
}

const ReportRow: React.FC<ReportRowProps> = ({ label, value, isBold = false, actions }) => (
  <div className={`flex justify-between items-center py-3 border-b border-slate-50 group ${isBold ? 'font-black text-slate-900 bg-slate-50/50 px-4 rounded-lg' : 'text-slate-600 px-4 hover:bg-slate-50 transition-colors'}`}>
    <div className="flex items-center space-x-3">
      <span className="text-xs uppercase tracking-tight">{label}</span>
      {actions && !isBold && (
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <ActionMenu actions={actions} label="Drill" />
        </div>
      )}
    </div>
    <span className="text-sm tabular-nums font-mono">${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
  </div>
);

const BalanceSheet: React.FC<BalanceSheetProps> = ({ ledgers, vouchers }) => {
  const data = useMemo(() => {
    const assets: any[] = [];
    const liabilities: any[] = [];
    
    ledgers.forEach(l => {
      let balance = l.openingBalance;
      vouchers.forEach(v => {
        if (v.ledgerId === l.id) {
          balance += (l.type === 'Debit' ? v.amount : -v.amount);
        }
      });

      const entry = { id: l.id, name: l.name, balance };
      if (['Assets', 'Bank Accounts', 'Cash-in-hand', 'Sundry Debtors'].some(n => l.group.includes(n))) {
        assets.push(entry);
      } else {
        liabilities.push(entry);
      }
    });

    return { 
      assets, 
      liabilities, 
      totalAssets: assets.reduce((acc, a) => acc + a.balance, 0), 
      totalLiab: liabilities.reduce((acc, l) => acc + l.balance, 0) 
    };
  }, [ledgers, vouchers]);

  const getLedgerActions = (id: string, name: string): ActionItem[] => [
    { 
      label: 'View Detailed Ledger', 
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
      onClick: () => alert(`Opening ledger drill-down for: ${name}`),
      variant: 'primary'
    },
    { 
      label: 'Extract Audit Schedule', 
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
      onClick: () => alert(`Generating CSV schedule for auditors...`)
    },
    { 
      label: 'Compare Period Variance', 
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
      onClick: () => alert(`Analyzing variance against previous FY...`)
    },
    { 
      label: 'Dispatch to Stakeholders', 
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
      onClick: () => alert(`Mailing statement breakdown to registered stakeholders.`)
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white rounded-[3rem] border border-slate-200 shadow-2xl overflow-hidden max-w-5xl mx-auto">
        <div className="bg-indigo-600 px-12 py-10 text-white flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <h3 className="text-3xl font-black italic uppercase tracking-tighter">Balance Sheet</h3>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80 mt-2">Statement of Financial Position • Consolidated</p>
          </div>
          <div className="flex space-x-3">
             <button className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/20 transition-all">Historical View</button>
             <button className="px-6 py-2 bg-white text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl transition-all hover:bg-indigo-50">Export Master PDF</button>
          </div>
        </div>

        <div className="p-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            <section className="space-y-6">
              <h4 className="text-[11px] font-black uppercase text-indigo-600 tracking-[0.2em] border-b-2 border-indigo-100 pb-2 flex justify-between items-center">
                <span>I. Liabilities & Equity</span>
                <span className="text-[9px] text-slate-400 font-bold">SOURCE: LEDGER MASTER</span>
              </h4>
              <div className="space-y-1">
                {data.liabilities.map((l, i) => (
                  <ReportRow key={i} label={l.name} value={l.balance} actions={getLedgerActions(l.id, l.name)} />
                ))}
                <div className="pt-6">
                  <ReportRow label="Total Equity & Liabilities" value={data.totalLiab} isBold />
                </div>
              </div>
            </section>

            <section className="space-y-6">
              <h4 className="text-[11px] font-black uppercase text-indigo-600 tracking-[0.2em] border-b-2 border-indigo-100 pb-2 flex justify-between items-center">
                <span>II. Assets</span>
                <span className="text-[9px] text-slate-400 font-bold">MARKET VALUATION</span>
              </h4>
              <div className="space-y-1">
                {data.assets.map((a, i) => (
                  <ReportRow key={i} label={a.name} value={a.balance} actions={getLedgerActions(a.id, a.name)} />
                ))}
                <div className="pt-6">
                  <ReportRow label="Total Business Assets" value={data.totalAssets} isBold />
                </div>
              </div>
            </section>
          </div>

          <div className="mt-16 p-8 bg-slate-900 rounded-[2.5rem] text-white flex flex-col md:flex-row items-center justify-between shadow-2xl border-4 border-slate-800 relative overflow-hidden">
             <div className="flex items-center space-x-6 relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-3xl shadow-lg transform -rotate-3 transition-transform hover:rotate-0">⚖️</div>
                <div>
                   <h5 className="text-[10px] font-black uppercase text-indigo-400 tracking-[0.3em]">Fundamental Proofing</h5>
                   <p className="text-sm font-black italic">Differential: ${Math.abs(data.totalAssets - data.totalLiab).toLocaleString()}</p>
                </div>
             </div>
             <div className="text-right mt-6 md:mt-0 relative z-10">
                <div className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">Corporate Net Worth</div>
                <div className="text-4xl font-black italic text-indigo-400 tracking-tighter tabular-nums">${data.totalAssets.toLocaleString()}</div>
             </div>
             <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600 rounded-full blur-[100px] opacity-10 -mr-32 -mt-32"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BalanceSheet;