import React, { useState, useMemo } from 'react';
import { TransactionSubMenu, Voucher, Ledger, Item } from '../types';
import { TRANSACTION_SUB_MENUS } from '../constants';
import VoucherEntryForm from './VoucherEntryForm';
import InventoryVoucherForm from './InventoryVoucherForm';
import DayBook from './DayBook';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface TransactionModuleProps {
  activeCompany: any;
  isReadOnly?: boolean;
  activeSubAction: TransactionSubMenu | null;
  setActiveSubAction: (sub: TransactionSubMenu | null) => void;
  ledgers: Ledger[];
  items: Item[];
  vouchers: Voucher[];
  setVouchers: React.Dispatch<React.SetStateAction<Voucher[]>>;
}

const TransactionModule: React.FC<TransactionModuleProps> = ({ 
  activeCompany, isReadOnly, activeSubAction, setActiveSubAction, ledgers, items, vouchers, setVouchers 
}) => {

  const handlePostVoucher = (data: Omit<Voucher, 'id' | 'status'>) => {
    const newVch: Voucher = {
      ...data,
      id: `V-${1000 + vouchers.length + 1}`,
      status: 'Posted'
    };
    setVouchers(prev => [newVch, ...prev]);
    setActiveSubAction(TransactionSubMenu.DAY_BOOK);
  };

  const handleCloneVoucher = (v: Voucher) => {
    setActiveSubAction(v.items ? TransactionSubMenu.INVENTORY_VOUCHERS : TransactionSubMenu.ACCOUNTING_VOUCHERS);
  };

  const flowData = useMemo(() => {
    return [
      { day: 'Mon', sales: 4000, purchase: 2400 },
      { day: 'Tue', sales: 3000, purchase: 1398 },
      { day: 'Wed', sales: 2000, purchase: 9800 },
      { day: 'Thu', sales: 2780, purchase: 3908 },
      { day: 'Fri', sales: 1890, purchase: 4800 },
      { day: 'Sat', sales: 2390, purchase: 3800 },
      { day: 'Sun', sales: 3490, purchase: 4300 },
    ];
  }, []);

  const stats = useMemo(() => {
    const posted = vouchers.filter(v => v.status === 'Posted').length;
    const drafts = vouchers.filter(v => v.status === 'Draft').length;
    const total = vouchers.reduce((acc, v) => acc + v.amount, 0);
    return { posted, drafts, total };
  }, [vouchers]);

  const renderContent = () => {
    switch (activeSubAction) {
      case TransactionSubMenu.ACCOUNTING_VOUCHERS:
        return <VoucherEntryForm isReadOnly={isReadOnly} ledgers={ledgers} onSubmit={handlePostVoucher} onCancel={() => setActiveSubAction(null)} />;
      case TransactionSubMenu.INVENTORY_VOUCHERS:
        return <InventoryVoucherForm isReadOnly={isReadOnly} items={items} ledgers={ledgers} onSubmit={handlePostVoucher} onCancel={() => setActiveSubAction(null)} />;
      case TransactionSubMenu.DAY_BOOK:
        return <DayBook vouchers={vouchers} onClone={handleCloneVoucher} />;
      default:
        return <TransactionDashboard />;
    }
  };

  const TransactionDashboard = () => (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight italic uppercase">Transactional Ops</h2>
          <p className="text-xs text-slate-500 font-medium">Verified ledger stream management hub.</p>
        </div>
        <div className="bg-white border border-slate-200 px-4 py-1.5 rounded-xl shadow-sm flex items-center space-x-3">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.4)]"></div>
          <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Postings: Verified</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {TRANSACTION_SUB_MENUS.map((item) => (
          <button key={item.id} onClick={() => setActiveSubAction(item.id as TransactionSubMenu)} className="group relative bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-indigo-300/50 transition-all duration-300 text-left overflow-hidden">
            <div className={`w-10 h-10 ${item.color} rounded-xl flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform shadow-md`}>
              {React.cloneElement(item.icon as React.ReactElement, { className: 'w-5 h-5' })}
            </div>
            <h3 className="text-sm font-black text-slate-800 mb-1 group-hover:text-indigo-600 transition-colors uppercase italic">{item.label}</h3>
            <p className="text-[11px] text-slate-400 font-medium leading-relaxed line-clamp-2">{item.description}</p>
            <div className="mt-4 flex items-center text-indigo-600 font-black text-[9px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all translate-y-1 group-hover:translate-y-0">
              <span>Enter Workspace</span>
              <svg className="w-3 h-3 ml-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
            </div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <div className="lg:col-span-2 bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
               <h3 className="text-[9px] font-black uppercase text-slate-400 tracking-[0.3em]">Volume Metrics (7D)</h3>
               <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1.5">
                     <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                     <span className="text-[8px] font-black uppercase text-slate-400">Sales</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                     <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                     <span className="text-[8px] font-black uppercase text-slate-400">Purchase</span>
                  </div>
               </div>
            </div>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={flowData}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorPurch" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 9, fontWeight: 900}} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                  <Area type="monotone" dataKey="sales" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" />
                  <Area type="monotone" dataKey="purchase" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorPurch)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
         </div>

         <div className="space-y-4">
            <div className="bg-slate-900 rounded-3xl p-6 text-white relative overflow-hidden shadow-xl">
               <h3 className="text-[9px] font-black uppercase text-indigo-400 tracking-[0.2em] mb-6">Ledger Integrity</h3>
               <div className="space-y-6 relative z-10">
                  <div>
                    <div className="flex justify-between items-end mb-1.5">
                       <span className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter">Post Reconciliation</span>
                       <span className="text-lg font-black text-emerald-400 italic">{Math.round((stats.posted / (stats.posted + stats.drafts || 1)) * 100)}%</span>
                    </div>
                    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                       <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(stats.posted / (stats.posted + stats.drafts || 1)) * 100}%` }}></div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                     <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                        <div className="text-[7px] font-black text-slate-500 uppercase mb-0.5 tracking-tighter">Posted</div>
                        <div className="text-lg font-black text-white">{stats.posted}</div>
                     </div>
                     <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                        <div className="text-[7px] font-black text-slate-500 uppercase mb-0.5 tracking-tighter">Drafts</div>
                        <div className="text-lg font-black text-amber-400">{stats.drafts}</div>
                     </div>
                  </div>
               </div>
               <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600 rounded-full blur-[80px] opacity-10 -mr-16 -mt-16"></div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm overflow-y-auto max-h-[160px] custom-scrollbar">
               <h3 className="text-[9px] font-black uppercase text-slate-400 tracking-[0.2em] mb-4">Latest Vouchers</h3>
               <div className="space-y-3">
                 {vouchers.slice(0, 3).map(v => (
                   <div key={v.id} className="flex items-center justify-between border-b border-slate-50 pb-2.5">
                     <div className="flex items-center space-x-2.5">
                       <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[9px] font-black ${v.type === 'Sales' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>{v.type.charAt(0)}</div>
                       <div className="min-w-0">
                         <div className="text-[10px] font-black text-slate-800 uppercase truncate max-w-[80px] leading-none">{v.party}</div>
                         <div className="text-[7px] font-bold text-slate-400 uppercase mt-1">{v.id}</div>
                       </div>
                     </div>
                     <div className="text-right">
                       <div className="text-[10px] font-black text-slate-900">${v.amount.toLocaleString()}</div>
                     </div>
                   </div>
                 ))}
               </div>
            </div>
         </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {isReadOnly && (
        <div className="bg-amber-50 border-l-4 border-amber-400 p-3 rounded-r-xl flex items-center space-x-3 shadow-sm mb-2">
          <svg className="w-4 h-4 text-amber-600 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
          <p className="text-[10px] text-amber-800 font-bold uppercase tracking-tight">Cycle Locked: Modification Restricted</p>
        </div>
      )}
      {renderContent()}
    </div>
  );
};

export default TransactionModule;