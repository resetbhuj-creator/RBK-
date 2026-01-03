import React, { useState, useMemo } from 'react';
import { TransactionSubMenu, Voucher, Ledger, Item, VoucherType } from '../types';
import { TRANSACTION_SUB_MENUS } from '../constants';
import VoucherEntryForm from './VoucherEntryForm';
import InventoryVoucherForm from './InventoryVoucherForm';
import BankReconciliation from './BankReconciliation';
import DayBook from './DayBook';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface TransactionModuleProps {
  activeCompany: any;
  currentFY: string;
  isReadOnly?: boolean;
  activeSubAction: TransactionSubMenu | null;
  setActiveSubAction: (sub: TransactionSubMenu | null) => void;
  ledgers: Ledger[];
  items: Item[];
  vouchers: Voucher[];
  setVouchers: React.Dispatch<React.SetStateAction<Voucher[]>>;
  onViewVoucher: (id: string) => void;
}

const TransactionModule: React.FC<TransactionModuleProps> = ({ 
  activeCompany, currentFY, isReadOnly, activeSubAction, setActiveSubAction, ledgers, items, vouchers, setVouchers, onViewVoucher 
}) => {

  const generateVoucherId = (type: string) => {
    const prefixMap: Record<string, string> = {
      'Sales': 'SL',
      'Purchase': 'PR',
      'Sales Return': 'SR',
      'Purchase Return': 'PR-RET',
      'Payment': 'PY',
      'Receipt': 'RC',
      'Contra': 'CN',
      'Journal': 'JR',
      'Delivery Note': 'DN',
      'Goods Receipt Note (GRN)': 'GRN',
      'Stock Adjustment': 'SA',
      'Purchase Order': 'PO'
    };
    const prefix = prefixMap[type] || 'VCH';
    const yearParts = currentFY.split(' - ').map(y => y.trim().slice(-2));
    const yearPart = yearParts.join('-');
    const yearIdentifier = `/${yearPart}/`;
    
    const relevantVouchers = vouchers.filter(v => v.type === type && v.id.includes(yearIdentifier));
    
    let maxNum = 0;
    relevantVouchers.forEach(v => {
      const parts = v.id.split('/');
      const serialPart = parts[parts.length - 1];
      const num = parseInt(serialPart);
      if (!isNaN(num) && num > maxNum) maxNum = num;
    });

    const nextNum = (maxNum + 1).toString().padStart(5, '0');
    return `${prefix}/${yearPart}/${nextNum}`;
  };

  const handlePostVoucher = (data: Omit<Voucher, 'id' | 'status'>) => {
    const assignedId = generateVoucherId(data.type);
    if (vouchers.some(v => v.id === assignedId)) {
      alert("Serial Collision: Re-calculating...");
      return;
    }
    const newVch: Voucher = { ...data, id: assignedId, status: 'Posted' };
    setVouchers(prev => [newVch, ...prev]);
    setActiveSubAction(TransactionSubMenu.DAY_BOOK);
  };

  const updateVoucher = (updated: Voucher) => {
    setVouchers(prev => prev.map(v => v.id === updated.id ? updated : v));
  };

  const handleCloneVoucher = (v: Voucher) => {
    setActiveSubAction(v.items ? TransactionSubMenu.INVENTORY_VOUCHERS : TransactionSubMenu.ACCOUNTING_VOUCHERS);
  };

  const stats = useMemo(() => {
    const posted = vouchers.filter(v => v.status === 'Posted').length;
    const totalVal = vouchers.reduce((acc, v) => acc + v.amount, 0);
    const dayTurnover = vouchers.filter(v => v.date === new Date().toISOString().split('T')[0]).reduce((acc, v) => acc + v.amount, 0);
    
    const typeGroups: Record<string, number> = {};
    vouchers.forEach(v => {
      typeGroups[v.type] = (typeGroups[v.type] || 0) + v.amount;
    });
    const pieData = Object.entries(typeGroups).map(([name, value]) => ({ name, value }));

    return { posted, totalVal, dayTurnover, pieData };
  }, [vouchers]);

  const COLORS = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#3b82f6'];

  const renderContent = () => {
    switch (activeSubAction) {
      case TransactionSubMenu.ACCOUNTING_VOUCHERS:
        return (
          <VoucherEntryForm 
            isReadOnly={isReadOnly} 
            ledgers={ledgers} 
            vouchers={vouchers}
            onSubmit={handlePostVoucher} 
            onCancel={() => setActiveSubAction(null)}
            getNextId={(type) => generateVoucherId(type)}
          />
        );
      case TransactionSubMenu.INVENTORY_VOUCHERS:
        return (
          <InventoryVoucherForm 
            isReadOnly={isReadOnly} 
            items={items} 
            ledgers={ledgers} 
            onSubmit={handlePostVoucher} 
            onCancel={() => setActiveSubAction(null)}
            getNextId={(type) => generateVoucherId(type)}
          />
        );
      case TransactionSubMenu.BANK_RECONCILIATION:
        return (
          <BankReconciliation 
            vouchers={vouchers} 
            ledgers={ledgers} 
            onUpdateVoucher={updateVoucher} 
            onCancel={() => setActiveSubAction(null)} 
          />
        );
      case TransactionSubMenu.DAY_BOOK:
        return <DayBook vouchers={vouchers} onClone={handleCloneVoucher} onViewVoucher={onViewVoucher} />;
      default:
        return <TransactionDashboard />;
    }
  };

  const TransactionDashboard = () => (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl border-b-8 border-indigo-600">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-10">
          <div className="flex items-center space-x-6">
            <div className="w-16 h-16 bg-indigo-600 rounded-[1.5rem] flex items-center justify-center shadow-2xl border-4 border-indigo-400/20 transform -rotate-3 transition-transform hover:rotate-0">
              <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/></svg>
            </div>
            <div>
              <h2 className="text-3xl font-black italic uppercase tracking-tighter">Operational Node</h2>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400 mt-2">Verified Throughput • {activeCompany.name}</p>
            </div>
          </div>
          <div className="flex gap-12 border-l border-white/10 pl-12">
             <div className="text-center">
                <div className="text-[9px] font-black uppercase text-slate-500 tracking-widest mb-1">Today's Delta</div>
                <div className="text-2xl font-black italic tabular-nums">${stats.dayTurnover.toLocaleString()}</div>
             </div>
             <div className="text-center">
                <div className="text-[9px] font-black uppercase text-slate-500 tracking-widest mb-1">Total Registry</div>
                <div className="text-2xl font-black italic tabular-nums">{stats.posted}</div>
             </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600 rounded-full blur-[120px] opacity-10 -mr-40 -mt-40"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {TRANSACTION_SUB_MENUS.map((item) => (
          <button key={item.id} onClick={() => setActiveSubAction(item.id as TransactionSubMenu)} className="group relative bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-2xl hover:border-indigo-200 transition-all duration-300 text-left overflow-hidden">
            <div className={`w-14 h-14 ${item.color} rounded-2xl flex items-center justify-center text-white mb-8 group-hover:scale-110 transition-transform shadow-xl`}>
              {React.cloneElement(item.icon as React.ReactElement<any>, { className: 'w-7 h-7' })}
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-2 group-hover:text-indigo-600 transition-colors uppercase italic leading-tight">{item.label}</h3>
            <p className="text-xs text-slate-400 font-medium leading-relaxed">{item.description}</p>
            <div className="mt-8 flex items-center text-indigo-600 font-black text-[10px] uppercase tracking-[0.2em] opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
               <span>Open Workspace</span>
               <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {activeSubAction && (
        <button 
          onClick={() => setActiveSubAction(null)}
          className="flex items-center space-x-2 text-[10px] font-black uppercase text-slate-400 hover:text-indigo-600 transition-colors group mb-4"
        >
          <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
          <span>Exit Module</span>
        </button>
      )}
      {renderContent()}
    </div>
  );
};

export default TransactionModule;