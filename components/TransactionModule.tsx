import React, { useState, useMemo, useCallback } from 'react';
import { TransactionSubMenu, Voucher, Ledger, Item, VoucherType } from '../types';
import { TRANSACTION_SUB_MENUS } from '../constants';
import VoucherEntryForm from './VoucherEntryForm';
import InventoryVoucherForm from './InventoryVoucherForm';
import BankReconciliation from './BankReconciliation';
import DayBook from './DayBook';

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

  const generateVoucherId = useCallback((type: string) => {
    const prefixMap: Record<string, string> = {
      'Sales': 'SL', 'Purchase': 'PR', 'Sales Return': 'SR', 'Purchase Return': 'PR-RET',
      'Payment': 'PY', 'Receipt': 'RC', 'Contra': 'CN', 'Journal': 'JR',
      'Delivery Note': 'DN', 'Goods Receipt Note (GRN)': 'GRN', 'Stock Adjustment': 'SA', 'Purchase Order': 'PO'
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
  }, [vouchers, currentFY]);

  const handlePostVoucher = (data: Omit<Voucher, 'id'>) => {
    let assignedId = generateVoucherId(data.type);
    
    let attempts = 0;
    while (vouchers.some(v => v.id === assignedId) && attempts < 10) {
      const parts = assignedId.split('/');
      const nextNum = (parseInt(parts[parts.length - 1]) + 1).toString().padStart(5, '0');
      assignedId = `${parts[0]}/${parts[1]}/${nextNum}`;
      attempts++;
    }

    const newVch: Voucher = { ...data, id: assignedId };
    setVouchers(prev => [newVch, ...prev]);
    setActiveSubAction(TransactionSubMenu.DAY_BOOK);
  };

  const updateVoucher = (updated: Voucher) => {
    setVouchers(prev => prev.map(v => v.id === updated.id ? updated : v));
  };

  const deleteVoucher = (id: string) => {
    if (confirm("CRITICAL: Permanent deletion of transactional record requested. This will impact ledger balances and audit trials. Authorize purge?")) {
      setVouchers(prev => prev.filter(v => v.id !== id));
    }
  };

  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const posted = vouchers.filter(v => v.status === 'Posted').length;
    const pending = vouchers.filter(v => v.status === 'Pending Approval').length;
    const dayTurnover = vouchers.filter(v => v.date === today).reduce((acc, v) => acc + v.amount, 0);
    const draftCount = vouchers.filter(v => v.status === 'Draft').length;

    return { posted, pending, dayTurnover, draftCount };
  }, [vouchers]);

  const renderContent = () => {
    switch (activeSubAction) {
      case TransactionSubMenu.ACCOUNTING_VOUCHERS:
        return (
          <VoucherEntryForm 
            isReadOnly={isReadOnly} 
            ledgers={ledgers} 
            activeCompany={activeCompany}
            onSubmit={handlePostVoucher} 
            onCancel={() => setActiveSubAction(null)}
            getNextId={generateVoucherId}
          />
        );
      case TransactionSubMenu.INVENTORY_VOUCHERS:
        return (
          <InventoryVoucherForm 
            isReadOnly={isReadOnly} 
            items={items} 
            ledgers={ledgers} 
            activeCompany={activeCompany}
            onSubmit={handlePostVoucher} 
            onCancel={() => setActiveSubAction(null)}
            getNextId={generateVoucherId}
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
        return <DayBook vouchers={vouchers} onDelete={deleteVoucher} onViewVoucher={onViewVoucher} />;
      default:
        return <TransactionDashboard />;
    }
  };

  const TransactionDashboard = () => (
    <div className="space-y-10 animate-in fade-in duration-500">
      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: "Today's Volume", value: `$${stats.dayTurnover.toLocaleString()}`, icon: '💰', color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: "Pending Approvals", value: stats.pending, icon: '⚖️', color: 'text-rose-600', bg: 'bg-rose-50' },
          { label: "Posted Registry", value: stats.posted, icon: '📜', color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: "Draft Buffer", value: stats.draftCount, icon: '📝', color: 'text-amber-600', bg: 'bg-amber-50' }
        ].map((kpi, i) => (
          <div key={i} className={`p-8 rounded-[2.5rem] border border-slate-200 shadow-sm transition-all hover:shadow-xl hover:border-indigo-100 group ${kpi.bg}`}>
            <div className="flex justify-between items-start mb-4">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{kpi.label}</span>
              <span className="text-xl">{kpi.icon}</span>
            </div>
            <div className={`text-4xl font-black italic tracking-tighter tabular-nums ${kpi.color}`}>{kpi.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Module Entry Grid */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          {TRANSACTION_SUB_MENUS.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSubAction(item.id as TransactionSubMenu)}
              className="group relative bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm hover:shadow-2xl hover:border-indigo-200 transition-all duration-500 text-left overflow-hidden flex flex-col"
            >
              <div className={`w-16 h-16 ${item.color} rounded-2xl flex items-center justify-center text-white mb-10 group-hover:scale-110 group-hover:-rotate-3 transition-all shadow-xl`}>
                {React.cloneElement(item.icon as React.ReactElement<any>, { className: 'w-8 h-8' })}
              </div>
              <h3 className="text-2xl font-black text-slate-800 mb-3 group-hover:text-indigo-600 transition-colors uppercase italic leading-none tracking-tighter">{item.label}</h3>
              <p className="text-xs text-slate-400 font-medium leading-relaxed mb-10">{item.description}</p>
              
              <div className="mt-auto flex items-center text-indigo-600 font-black text-[10px] uppercase tracking-[0.3em] opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                <span>Enter Workplace</span>
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </div>
            </button>
          ))}
        </div>

        {/* Side Actions / Pending List */}
        <div className="space-y-8">
          <div className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl group">
             <div className="relative z-10">
                <h4 className="text-[10px] font-black uppercase text-indigo-400 tracking-[0.4em] mb-8 flex items-center">
                   <div className="w-2 h-2 rounded-full bg-rose-500 mr-3 animate-pulse shadow-[0_0_8px_#f43f5e]"></div>
                   Awaiting Authorization
                </h4>
                <div className="space-y-4">
                   {vouchers.filter(v => v.status === 'Pending Approval').slice(0, 3).map(v => (
                     <div key={v.id} onClick={() => onViewVoucher(v.id)} className="p-5 bg-white/5 border border-white/10 rounded-2xl cursor-pointer hover:bg-white/10 transition-all flex items-center justify-between group/v">
                        <div>
                           <div className="text-[11px] font-black text-white italic group-hover/v:text-indigo-400">{v.id}</div>
                           <div className="text-[9px] text-slate-500 font-bold uppercase mt-1">{v.party}</div>
                        </div>
                        <div className="text-right">
                           <div className="text-xs font-black tabular-nums">${v.amount.toLocaleString()}</div>
                           <div className="text-[8px] font-bold text-rose-500 uppercase mt-1">Authorize Required</div>
                        </div>
                     </div>
                   ))}
                   {stats.pending === 0 && (
                     <div className="py-12 text-center opacity-30 italic text-xs font-medium">All transactional objects reconciled.</div>
                   )}
                </div>
                {stats.pending > 3 && (
                   <button onClick={() => setActiveSubAction(TransactionSubMenu.DAY_BOOK)} className="mt-6 text-[9px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors">View all {stats.pending} pending objects &rarr;</button>
                )}
             </div>
             <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-600 rounded-full blur-[100px] opacity-10 -mr-24 -mt-24"></div>
          </div>

          <div className="p-8 bg-indigo-50 rounded-[2.5rem] border border-indigo-100">
             <h5 className="text-[10px] font-black uppercase text-indigo-900 tracking-widest mb-4">Operational Status</h5>
             <p className="text-[11px] text-indigo-700/70 font-medium leading-relaxed italic">
                Nexus Node is currently synced with the central treasury. High-fidelity cryptographic hashing is active for all new transactional commits.
             </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {activeSubAction && (
        <button 
          onClick={() => setActiveSubAction(null)}
          className="flex items-center space-x-3 text-[11px] font-black uppercase text-slate-400 hover:text-indigo-600 transition-all group mb-8"
        >
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
            <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
          </div>
          <span className="tracking-[0.3em]">Exit Operational Workspace</span>
        </button>
      )}
      {renderContent()}
    </div>
  );
};

export default TransactionModule;