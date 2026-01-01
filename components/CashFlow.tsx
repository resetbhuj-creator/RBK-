import React, { useMemo } from 'react';
import { Ledger, Voucher } from '../types';
import ActionMenu, { ActionItem } from './ActionMenu';

interface CashFlowProps {
  ledgers: Ledger[];
  vouchers: Voucher[];
}

const CashFlow: React.FC<CashFlowProps> = ({ ledgers, vouchers }) => {
  const data = useMemo(() => {
    const inflows = vouchers.filter(v => v.type === 'Receipt').reduce((acc, v) => acc + v.amount, 0);
    const outflows = vouchers.filter(v => v.type === 'Payment').reduce((acc, v) => acc + v.amount, 0);
    return { inflows, outflows, net: inflows - outflows };
  }, [vouchers]);

  const flowActions = (mode: 'IN' | 'OUT'): ActionItem[] => [
    { 
      label: 'Breakdown by Bank', 
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 10h18M7 15h1m4 0h1m4 0h1m-7 4h12a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
      onClick: () => alert(`Extracting bank-wise ${mode === 'IN' ? 'Receipts' : 'Payments'}...`),
      variant: 'primary'
    },
    { 
      label: 'Forecast Next Period', 
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>,
      onClick: () => alert(`Running predictive model based on historical ${mode === 'IN' ? 'revenue' : 'burn'}...`)
    },
    { 
      label: 'Daily Breakdown', 
      icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
      onClick: () => alert(`Loading chronological flow list...`)
    }
  ];

  return (
    <div className="bg-white rounded-[3rem] border border-slate-200 shadow-2xl overflow-hidden max-w-4xl mx-auto animate-in fade-in duration-500">
      <div className="bg-amber-600 p-12 text-white flex justify-between items-center">
         <div>
            <h3 className="text-3xl font-black italic uppercase tracking-tighter">Cash Flow</h3>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80 mt-2">Liquidity & Movement Analysis</p>
         </div>
         <div className="flex space-x-3">
            <button onClick={() => alert('Dispatched to Print Center...')} className="p-3 bg-white/20 hover:bg-white/30 rounded-xl border border-white/10 transition-all"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg></button>
            <ActionMenu 
              label="Intelligence"
              actions={[
                { label: 'Reconciliation', icon: '📝', onClick: () => {} },
                { label: 'Variance Report', icon: '📊', onClick: () => {} }
              ]} 
            />
         </div>
      </div>

      <div className="p-12 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
           <div className="p-8 bg-emerald-50 rounded-[2rem] border border-emerald-100 group transition-all hover:shadow-xl">
              <div className="flex justify-between items-start mb-6">
                <div className="text-[10px] font-black uppercase text-emerald-600 tracking-widest">Total Inflows</div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <ActionMenu actions={flowActions('IN')} label="Analyze" />
                </div>
              </div>
              <div className="text-4xl font-black text-emerald-900">${data.inflows.toLocaleString()}</div>
              <p className="text-[10px] text-emerald-600/60 font-bold uppercase mt-2">Aggregate Receipts</p>
           </div>

           <div className="p-8 bg-rose-50 rounded-[2rem] border border-rose-100 group transition-all hover:shadow-xl">
              <div className="flex justify-between items-start mb-6">
                <div className="text-[10px] font-black uppercase text-rose-600 tracking-widest">Total Outflows</div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <ActionMenu actions={flowActions('OUT')} label="Analyze" />
                </div>
              </div>
              <div className="text-4xl font-black text-rose-900">${data.outflows.toLocaleString()}</div>
              <p className="text-[10px] text-rose-600/60 font-bold uppercase mt-2">Aggregate Payments</p>
           </div>
        </div>

        <div className="bg-slate-900 p-10 rounded-[2.5rem] text-white flex items-center justify-between relative overflow-hidden shadow-2xl border-4 border-slate-800">
           <div className="relative z-10">
              <div className="text-[10px] font-black uppercase text-amber-400 tracking-[0.3em] mb-2">Net Cash Position</div>
              <div className="text-5xl font-black italic tracking-tighter">${data.net.toLocaleString()}</div>
           </div>
           <div className="relative z-10 flex flex-col items-end">
              <div className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg ${data.net >= 0 ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                 {data.net >= 0 ? 'Liquidity Surplus' : 'Cash Deficit'}
              </div>
              <button className="mt-4 text-[9px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors">Generate Projection Report</button>
           </div>
           <div className="absolute top-0 right-0 w-64 h-64 bg-amber-600 rounded-full blur-[100px] opacity-10 -mr-32 -mt-32 pointer-events-none"></div>
        </div>
      </div>
    </div>
  );
};

export default CashFlow;