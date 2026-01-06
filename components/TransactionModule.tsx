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

  const approveVoucher = (id: string) => {
    setVouchers(prev => prev.map(v => v.id === id ? { ...v, status: 'Posted', approvedBy: 'Super Admin', approvalDate: new Date().toISOString() } : v));
  };

  const deleteVoucher = (id: string) => {
    if (confirm("CRITICAL: Permanent deletion of transactional record requested. This will impact ledger balances and audit trials. Authorize purge?")) {
      setVouchers(prev => prev.filter(v => v.id !== id));
    }
  };

  const PurchaseOrderManager = () => {
    const [view, setView] = useState<'LIST' | 'CREATE'>('LIST');
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'Pending Approval' | 'Posted'>('ALL');
    
    const purchaseOrders = useMemo(() => {
      let filtered = vouchers.filter(v => v.type === 'Purchase Order');
      if (statusFilter !== 'ALL') {
        filtered = filtered.filter(v => v.status === statusFilter);
      }
      return filtered.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [vouchers, statusFilter]);

    const poMetrics = useMemo(() => {
      const pending = purchaseOrders.filter(v => v.status === 'Pending Approval');
      const value = pending.reduce((acc, v) => acc + v.amount, 0);
      return { count: pending.length, value };
    }, [purchaseOrders]);

    const getPoActions = (v: Voucher): ActionItem[] => [
      { label: 'Inspect PO', icon: '👁️', onClick: () => onViewVoucher(v.id), variant: 'primary' },
      { label: 'Approve PO', icon: '✅', onClick: () => approveVoucher(v.id), variant: 'success' },
      { label: 'Purge PO', icon: '🗑️', onClick: () => deleteVoucher(v.id), variant: 'danger' }
    ];

    if (view === 'CREATE') {
      return (
        <InventoryVoucherForm 
          isReadOnly={isReadOnly}
          items={items}
          batches={batches}
          ledgers={ledgers}
          activeCompany={activeCompany}
          onSubmit={(data) => {
             handlePostVoucher({ ...data, status: 'Pending Approval' });
             setView('LIST');
          }}
          onCancel={() => setView('LIST')}
          getNextId={generateVoucherId}
        />
      );
    }

    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        {/* PO Metrics Header */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="p-8 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm">
              <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Registry Shards</div>
              <div className="text-4xl font-black italic text-slate-800 tabular-nums">{purchaseOrders.length}</div>
           </div>
           <div className="p-8 bg-amber-50 rounded-[2.5rem] border border-amber-100 shadow-sm">
              <div className="text-[10px] font-black uppercase text-amber-600 tracking-widest mb-2">Pending Authorization</div>
              <div className="text-4xl font-black italic text-amber-900 tabular-nums">{poMetrics.count}</div>
           </div>
           <div className="p-8 bg-indigo-50 rounded-[2.5rem] border border-indigo-100 shadow-sm">
              <div className="text-[10px] font-black uppercase text-indigo-400 tracking-widest mb-1">Staged Commitment</div>
              <div className="text-4xl font-black italic text-indigo-900 tabular-nums">${poMetrics.value.toLocaleString()}</div>
           </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm gap-6">
           <div className="flex flex-col md:flex-row items-center gap-8">
              <div>
                <h3 className="text-2xl font-black italic text-slate-800 uppercase tracking-tighter">Purchase Order Hub</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 italic">Procurement Lifecycle Management</p>
              </div>
              <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
                 {(['ALL', 'Pending Approval', 'Posted'] as const).map(s => (
                   <button 
                     key={s} 
                     onClick={() => setStatusFilter(s)}
                     className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${statusFilter === s ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                   >
                     {s === 'Posted' ? 'Authorized' : s}
                   </button>
                 ))}
              </div>
           </div>
           <button 
             onClick={() => setView('CREATE')}
             className="px-12 py-5 bg-rose-600 text-white rounded-[1.8rem] font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-rose-700 transition-all transform active:scale-95 border-b-8 border-rose-900/40 flex items-center space-x-4"
           >
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
             <span>Generate Procurement Shard</span>
           </button>
        </div>

        <div className="bg-white rounded-[3.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[400px]">
           <div className="overflow-x-auto custom-scrollbar flex-1">
              <table className="w-full text-left">
                <thead className="bg-slate-950 text-[10px] font-black uppercase text-slate-500 tracking-widest border-b border-slate-900 sticky top-0 z-10">
                   <tr>
                      <th className="px-10 py-7">PO Signature / Date</th>
                      <th className="px-10 py-7">Supplier Node Identity</th>
                      <th className="px-10 py-7 text-right">Commitment Value</th>
                      <th className="px-10 py-7 text-center">Protocol Status</th>
                      <th className="px-10 py-7 text-right">Operations</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 bg-white">
                   {purchaseOrders.map(v => (
                     <tr key={v.id} className="hover:bg-rose-50/20 transition-all group cursor-pointer" onClick={() => onViewVoucher(v.id)}>
                        <td className="px-10 py-6">
                           <div className="text-sm font-black text-indigo-600 italic">#{v.id}</div>
                           <div className="text-[9px] font-bold text-slate-400 uppercase mt-1.5">{v.date}</div>
                        </td>
                        <td className="px-10 py-6">
                           <div className="text-sm font-black text-slate-800 uppercase italic group-hover:text-rose-600 transition-colors">{v.party}</div>
                           <div className="flex items-center space-x-2 mt-1.5">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Verified Master Ledger</span>
                           </div>
                        </td>
                        <td className="px-10 py-6 text-right font-black text-slate-900 tabular-nums italic text-base">
                           ${v.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-10 py-6 text-center">
                           <span className={`px-5 py-2 rounded-xl text-[9px] font-black uppercase border shadow-sm transition-all ${
                             v.status === 'Pending Approval' ? 'bg-amber-50 text-amber-600 border-amber-100 animate-pulse scale-105' : 
                             v.status === 'Posted' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                             'bg-slate-50 text-slate-400 border-slate-200'
                           }`}>
                             {v.status === 'Posted' ? 'Authorized' : v.status}
                           </span>
                        </td>
                        <td className="px-10 py-6 text-right" onClick={e => e.stopPropagation()}>
                           <ActionMenu actions={getPoActions(v)} label="Lifecycle" />
                        </td>
                     </tr>
                   ))}
                   {purchaseOrders.length === 0 && (
                     <tr>
                        <td colSpan={5} className="py-48 text-center opacity-30 italic animate-pulse">
                           <div className="w-24 h-24 bg-slate-50 rounded-[3rem] flex items-center justify-center mx-auto mb-8 border border-slate-100 shadow-inner">
                              <span className="text-4xl grayscale">📦</span>
                           </div>
                           <h4 className="text-xl font-black uppercase tracking-[0.5em] text-slate-300">No PO Shards found</h4>
                           <p className="text-[10px] font-black uppercase tracking-widest mt-4">Adjust filters or initialize a new procurement sequence.</p>
                        </td>
                     </tr>
                   )}
                </tbody>
              </table>
           </div>
           <div className="bg-slate-950 px-10 py-4 flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-slate-500">
              <div className="flex items-center space-x-6">
                 <span>Vault Registry: NX-PUR-001</span>
                 <span className="w-px h-3 bg-white/10"></span>
                 <span>Active FY: {currentFY}</span>
              </div>
              <span className="text-indigo-400">Secure Shard Node Active ✓</span>
           </div>
        </div>
      </div>
    );
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
      case TransactionSubMenu.SALES_RETURN:
        return (
          <VoucherEntryForm 
            isReadOnly={isReadOnly} 
            ledgers={ledgers} 
            activeCompany={activeCompany}
            forcedVType="Sales Return"
            onSubmit={handlePostVoucher} 
            onCancel={() => setActiveSubAction(null)}
            getNextId={generateVoucherId}
          />
        );
      case TransactionSubMenu.PURCHASE_RETURN:
        return (
          <VoucherEntryForm 
            isReadOnly={isReadOnly} 
            ledgers={ledgers} 
            activeCompany={activeCompany}
            forcedVType="Purchase Return"
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
            batches={batches}
            ledgers={ledgers} 
            activeCompany={activeCompany}
            onSubmit={handlePostVoucher} 
            onCancel={() => setActiveSubAction(null)}
            getNextId={generateVoucherId}
          />
        );
      case TransactionSubMenu.CREDIT_NOTE:
        return (
          <VoucherEntryForm 
            isReadOnly={isReadOnly} 
            ledgers={ledgers} 
            activeCompany={activeCompany}
            forcedVType="Credit Note"
            onSubmit={handlePostVoucher} 
            onCancel={() => setActiveSubAction(null)}
            getNextId={generateVoucherId}
          />
        );
      case TransactionSubMenu.DEBIT_NOTE:
        return (
          <VoucherEntryForm 
            isReadOnly={isReadOnly} 
            ledgers={ledgers} 
            activeCompany={activeCompany}
            forcedVType="Debit Note"
            onSubmit={handlePostVoucher} 
            onCancel={() => setActiveSubAction(null)}
            getNextId={generateVoucherId}
          />
        );
      case TransactionSubMenu.PURCHASE_ORDER:
        return <PurchaseOrderManager />;
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

        {/* Side Actions / Statutory Approval Queue */}
        <div className="space-y-8">
          <div className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl group border-l-8 border-rose-500">
             <div className="relative z-10">
                <div className="flex justify-between items-center mb-8">
                   <h4 className="text-[10px] font-black uppercase text-indigo-400 tracking-[0.4em] flex items-center">
                      <div className="w-2 h-2 rounded-full bg-rose-500 mr-3 animate-pulse shadow-[0_0_8px_#f43f5e]"></div>
                      Authorization Shard
                   </h4>
                   <span className="text-[9px] font-black text-slate-500 uppercase">Super Admin Access</span>
                </div>
                
                <div className="space-y-4">
                   {vouchers.filter(v => v.status === 'Pending Approval').map(v => (
                     <div key={v.id} className="p-5 bg-white/5 border border-white/10 rounded-2xl transition-all group/v">
                        <div className="flex items-center justify-between mb-4">
                           <div onClick={() => onViewVoucher(v.id)} className="cursor-pointer">
                              <div className="text-[11px] font-black text-white italic group-hover/v:text-indigo-400">#{v.id}</div>
                              <div className="text-[9px] text-slate-500 font-bold uppercase mt-1 truncate max-w-[140px]">{v.party}</div>
                           </div>
                           <div className="text-right">
                              <div className="text-xs font-black tabular-nums">${v.amount.toLocaleString()}</div>
                              <div className="text-[8px] font-bold text-rose-400 uppercase mt-1">Lvl 2 Verify</div>
                           </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                           <button onClick={() => approveVoucher(v.id)} className="py-2 bg-emerald-600/20 text-emerald-400 rounded-xl text-[9px] font-black uppercase hover:bg-emerald-600 hover:text-white transition-all">Authorize</button>
                           <button onClick={() => onViewVoucher(v.id)} className="py-2 bg-white/5 text-slate-400 rounded-xl text-[9px] font-black uppercase hover:bg-white/10 transition-all">Inspect</button>
                        </div>
                     </div>
                   ))}
                   {stats.pending === 0 && (
                     <div className="py-12 text-center opacity-30 italic text-xs font-medium">All transactional objects reconciled.</div>
                   )}
                </div>
             </div>
             <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-600 rounded-full blur-[100px] opacity-10 -mr-24 -mt-24"></div>
          </div>

          <div className="p-8 bg-indigo-950 rounded-[2.5rem] border border-indigo-900 shadow-xl">
             <div className="flex items-center space-x-4 mb-6">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-xl">🛡️</div>
                <h5 className="text-[10px] font-black uppercase text-white tracking-widest leading-none">Integrity Lock</h5>
             </div>
             <p className="text-[11px] text-indigo-300 font-medium leading-relaxed italic mb-6">
                {isReadOnly 
                  ? "Historical Audit Mode is currently ACTIVE. No mutations allowed to existing ledger shards." 
                  : "Live Operations Active. New postings are being cryptographically signed for verification."}
             </p>
             <div className="flex bg-black/20 p-1 rounded-xl">
                <div className={`flex-1 py-2 text-[8px] font-black text-center uppercase tracking-widest rounded-lg transition-all ${isReadOnly ? 'bg-rose-600 text-white shadow-lg' : 'text-slate-500'}`}>LOCKED</div>
                <div className={`flex-1 py-2 text-[8px] font-black text-center uppercase tracking-widest rounded-lg transition-all ${!isReadOnly ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500'}`}>ACTIVE</div>
             </div>
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