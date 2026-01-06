import React, { useState, useMemo, useCallback } from 'react';
import { TransactionSubMenu, Voucher, Ledger, Item, VoucherType, Batch } from '../types';
import { TRANSACTION_SUB_MENUS } from '../constants';
import VoucherEntryForm from './VoucherEntryForm';
import InventoryVoucherForm from './InventoryVoucherForm';
import BankReconciliation from './BankReconciliation';
import DayBook from './DayBook';
import ActionMenu, { ActionItem } from './ActionMenu';

interface TransactionModuleProps {
  activeCompany: any;
  currentFY: string;
  isReadOnly?: boolean;
  activeSubAction: TransactionSubMenu | null;
  setActiveSubAction: (sub: TransactionSubMenu | null) => void;
  ledgers: Ledger[];
  items: Item[];
  batches: Batch[];
  vouchers: Voucher[];
  setVouchers: React.Dispatch<React.SetStateAction<Voucher[]>>;
  onViewVoucher: (id: string) => void;
}

const TransactionModule: React.FC<TransactionModuleProps> = ({ 
  activeCompany, currentFY, isReadOnly, activeSubAction, setActiveSubAction, ledgers, items, batches, vouchers, setVouchers, onViewVoucher 
}) => {
  const [editingVoucher, setEditingVoucher] = useState<Voucher | undefined>(undefined);

  const generateVoucherId = useCallback((type: string) => {
    const prefixMap: Record<string, string> = {
      'Sales': 'SL', 'Purchase': 'PR', 'Sales Return': 'SR', 'Purchase Return': 'PR-RET',
      'Payment': 'PY', 'Receipt': 'RC', 'Contra': 'CN', 'Journal': 'JR',
      'Delivery Note': 'DN', 'Goods Receipt Note (GRN)': 'GRN', 'Stock Adjustment': 'SA', 'Purchase Order': 'PO',
      'Credit Note': 'CRN', 'Debit Note': 'DRN'
    };
    const prefix = prefixMap[type] || 'VCH';
    const yearParts = currentFY.split(' - ').map(y => y.trim().slice(-2));
    const yearPart = yearParts.join('-');
    const yearIdentifier = `/${yearPart}/`;
    
    // Filter by type and year
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

  const handlePostVoucher = (data: Omit<Voucher, 'id' | 'status'>, status: Voucher['status'] = 'Posted') => {
    if (editingVoucher) {
      // Logic for editing existing voucher
      const updatedVch: Voucher = { 
        ...editingVoucher, 
        ...data, 
        status, 
        approvedBy: undefined, 
        approvalDate: undefined 
      };
      setVouchers(prev => prev.map(v => v.id === editingVoucher.id ? updatedVch : v));
      setEditingVoucher(undefined);
    } else {
      // Logic for new voucher
      let assignedId = generateVoucherId(data.type);
      const newVch: Voucher = { ...data, id: assignedId, status };
      setVouchers(prev => [newVch, ...prev]);
    }
    setActiveSubAction(TransactionSubMenu.DAY_BOOK);
  };

  const handleEditFromList = (v: Voucher) => {
    setEditingVoucher(v);
    if (['Sales', 'Purchase', 'Sales Return', 'Purchase Return', 'Purchase Order', 'Delivery Note', 'Goods Receipt Note (GRN)', 'Stock Adjustment', 'Credit Note', 'Debit Note'].includes(v.type)) {
      setActiveSubAction(TransactionSubMenu.INVENTORY_VOUCHERS);
    } else {
      setActiveSubAction(TransactionSubMenu.ACCOUNTING_VOUCHERS);
    }
  };

  const updateVoucher = (updated: Voucher) => {
    setVouchers(prev => prev.map(v => v.id === updated.id ? updated : v));
  };

  const deleteVoucher = (id: string) => {
    if (confirm("CRITICAL: Permanent deletion of transactional record requested. Authorize purge?")) {
      setVouchers(prev => prev.filter(v => v.id !== id));
    }
  };

  const renderContent = () => {
    switch (activeSubAction) {
      case TransactionSubMenu.ACCOUNTING_VOUCHERS:
        return (
          <VoucherEntryForm 
            isReadOnly={isReadOnly} 
            ledgers={ledgers} 
            vouchers={vouchers}
            activeCompany={activeCompany}
            onSubmit={handlePostVoucher} 
            onCancel={() => { setActiveSubAction(null); setEditingVoucher(undefined); }}
            getNextId={generateVoucherId}
            editingVoucher={editingVoucher}
          />
        );
      case TransactionSubMenu.INVENTORY_VOUCHERS:
      case TransactionSubMenu.SALES_RETURN:
      case TransactionSubMenu.PURCHASE_RETURN:
      case TransactionSubMenu.CREDIT_NOTE:
      case TransactionSubMenu.DEBIT_NOTE:
        return (
          <InventoryVoucherForm 
            isReadOnly={isReadOnly} 
            items={items} 
            batches={batches}
            ledgers={ledgers} 
            vouchers={vouchers}
            activeCompany={activeCompany}
            forcedVType={activeSubAction === TransactionSubMenu.INVENTORY_VOUCHERS ? undefined : activeSubAction as unknown as any}
            onSubmit={handlePostVoucher} 
            onCancel={() => { setActiveSubAction(null); setEditingVoucher(undefined); }}
            getNextId={generateVoucherId}
            editingVoucher={editingVoucher}
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
        return (
          <DayBook 
            vouchers={vouchers} 
            onDelete={deleteVoucher} 
            onViewVoucher={onViewVoucher} 
            onEditVoucher={handleEditFromList}
          />
        );
      default:
        return <TransactionDashboard />;
    }
  };

  const TransactionDashboard = () => (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
    </div>
  );

  return (
    <div className="space-y-4">
      {activeSubAction && (
        <button 
          onClick={() => { setActiveSubAction(null); setEditingVoucher(undefined); }}
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