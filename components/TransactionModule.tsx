import React, { useState } from 'react';
import { TransactionSubMenu, Voucher, Ledger, Item } from '../types';
import { TRANSACTION_SUB_MENUS } from '../constants';
import VoucherEntryForm from './VoucherEntryForm';
import InventoryVoucherForm from './InventoryVoucherForm';
import DayBook from './DayBook';

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

  const renderContent = () => {
    switch (activeSubAction) {
      case TransactionSubMenu.ACCOUNTING_VOUCHERS:
        return <VoucherEntryForm isReadOnly={isReadOnly} ledgers={ledgers} onSubmit={handlePostVoucher} onCancel={() => setActiveSubAction(null)} />;
      case TransactionSubMenu.INVENTORY_VOUCHERS:
        return <InventoryVoucherForm isReadOnly={isReadOnly} items={items} ledgers={ledgers} onSubmit={handlePostVoucher} onCancel={() => setActiveSubAction(null)} />;
      case TransactionSubMenu.DAY_BOOK:
        return <DayBook vouchers={vouchers} />;
      default:
        return <TransactionDashboard />;
    }
  };

  const TransactionDashboard = () => (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight italic uppercase">Transactional Workspace</h2>
          <p className="text-slate-500 font-medium">Post financial movements and audit chronological entries.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {TRANSACTION_SUB_MENUS.map((item) => (
          <button key={item.id} onClick={() => setActiveSubAction(item.id as TransactionSubMenu)} className="group relative bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-2xl hover:border-indigo-200 transition-all duration-300 text-left overflow-hidden">
            <div className={`w-14 h-14 ${item.color} rounded-2xl flex items-center justify-center text-white mb-8 group-hover:scale-110 transition-transform shadow-xl`}>
              {item.icon}
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-2 group-hover:text-indigo-600 transition-colors uppercase italic">{item.label}</h3>
            <p className="text-sm text-slate-400 font-medium leading-relaxed pr-6">{item.description}</p>
            <div className="mt-8 flex items-center text-indigo-600 font-black text-[10px] uppercase tracking-[0.2em] opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
              <span>Access Module</span>
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
            </div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         <div className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl">
            <h3 className="text-[10px] font-black uppercase text-indigo-400 tracking-[0.3em] mb-10">Flow Intelligence</h3>
            <div className="grid grid-cols-2 gap-10">
               <div>
                  <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Total Turnover</div>
                  <div className="text-3xl font-black italic">${vouchers.reduce((acc, v) => acc + v.amount, 0).toLocaleString()}</div>
               </div>
               <div>
                  <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Active Vouchers</div>
                  <div className="text-3xl font-black italic">{vouchers.length}</div>
               </div>
            </div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600 rounded-full blur-[120px] opacity-10 -mr-32 -mt-32"></div>
         </div>

         <div className="bg-white rounded-[3rem] border border-slate-200 p-10 shadow-sm overflow-y-auto max-h-[300px] custom-scrollbar">
            <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] mb-8">Recent Postings</h3>
            <div className="space-y-6">
              {vouchers.slice(0, 5).map(v => (
                <div key={v.id} className="flex items-center justify-between border-b border-slate-50 pb-4">
                  <div className="flex items-center space-x-4">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black ${v.type === 'Sales' ? 'bg-emerald-50 text-emerald-600' : v.type === 'Purchase' ? 'bg-indigo-50 text-indigo-600' : 'bg-rose-50 text-rose-600'}`}>
                      {v.type.charAt(0)}
                    </div>
                    <div>
                      <div className="text-xs font-black text-slate-800 uppercase tracking-tight">{v.party}</div>
                      <div className="text-[8px] font-bold text-slate-400 uppercase">{v.id} • {v.date}</div>
                    </div>
                  </div>
                  <div className="text-sm font-black text-slate-900">${v.amount.toLocaleString()}</div>
                </div>
              ))}
            </div>
         </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 min-h-[70vh]">
      {isReadOnly && (
        <div className="bg-amber-50 border-l-4 border-amber-400 p-5 rounded-r-3xl flex items-center space-x-5 shadow-sm">
          <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600 shrink-0">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
          </div>
          <div><h4 className="text-sm font-black text-amber-900 uppercase tracking-widest">Read-Only Mode</h4><p className="text-[11px] text-amber-700 font-medium">Compliance lock active for current period.</p></div>
        </div>
      )}
      {renderContent()}
    </div>
  );
};

export default TransactionModule;