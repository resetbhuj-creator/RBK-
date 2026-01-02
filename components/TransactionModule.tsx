import React, { useState, useMemo } from 'react';
import { TransactionSubMenu, Voucher, Ledger, Item } from '../types';
import { TRANSACTION_SUB_MENUS } from '../constants';
import VoucherEntryForm from './VoucherEntryForm';
import InventoryVoucherForm from './InventoryVoucherForm';
import DayBook from './DayBook';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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
      'Payment': 'PY',
      'Receipt': 'RC',
      'Contra': 'CN',
      'Journal': 'JR'
    };
    const prefix = prefixMap[type] || 'VCH';
    // Format year part to 23-24 from 2023 - 2024
    const yearPart = currentFY.split(' - ').map(y => y.trim().slice(-2)).join('-');
    
    // FORENSIC FILTER: Isolate only vouchers of this type within the CURRENT financial year
    const yearPattern = `/${yearPart}/`;
    const relevantVouchers = vouchers.filter(v => v.type === type && v.id.includes(yearPattern));
    
    let maxNum = 0;
    relevantVouchers.forEach(v => {
      // Extract the terminal digits from the ID (e.g., 0042 from PY/23-24/0042)
      const match = v.id.match(/\d+$/);
      if (match) {
        const num = parseInt(match[0]);
        if (num > maxNum) maxNum = num;
      }
    });

    const nextNum = (maxNum + 1).toString().padStart(4, '0');
    return `${prefix}/${yearPart}/${nextNum}`;
  };

  const handlePostVoucher = (data: Omit<Voucher, 'id' | 'status'>) => {
    const newVch: Voucher = {
      ...data,
      id: generateVoucherId(data.type),
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
      { day: 'Fri', sales: 1890, expenses: 4800 },
      { day: 'Sat', sales: 2390, purchase: 3800 },
      { day: 'Sun', sales: 3490, purchase: 4300 },
    ];
  }, []);

  const stats = useMemo(() => {
    const posted = vouchers.filter(v => v.status === 'Posted').length;
    const totalVal = vouchers.reduce((acc, v) => acc + v.amount, 0);
    const dayTurnover = vouchers.filter(v => v.date === new Date().toISOString().split('T')[0]).reduce((acc, v) => acc + v.amount, 0);
    return { posted, totalVal, dayTurnover };
  }, [vouchers]);

  const renderContent = () => {
    switch (activeSubAction) {
      case TransactionSubMenu.ACCOUNTING_VOUCHERS:
        return (
          <VoucherEntryForm 
            isReadOnly={isReadOnly} 
            ledgers={ledgers} 
            onSubmit={handlePostVoucher} 
            onCancel={() => setActiveSubAction(null)}
            // Provide preview mapping for various voucher classes
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
            <div className="w-16 h-16 bg-indigo-600 rounded-[1.5rem] flex items-center justify-center shadow-2xl border-4 border-indigo-400/20">
              <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/></svg>
            </div>
            <div>
              <h2 className="text-3xl font-black italic uppercase tracking-tighter">Operational Stream</h2>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400 mt-2">Verified Ledger Throughput • {activeCompany.name}</p>
            </div>
          </div>
          <div className="flex gap-8 border-l border-white/10 pl-10">
             <div className="text-center">
                <div className="text-[9px] font-black uppercase text-slate-500 tracking-widest mb-1">Today's Vol.</div>
                <div className="text-2xl font-black italic tabular-nums">${stats.dayTurnover.toLocaleString()}</div>
             </div>
             <div className="text-center">
                <div className="text-[9px] font-black uppercase text-slate-500 tracking-widest mb-1">Queue Depth</div>
                <div className="text-2xl font-black italic tabular-nums">{stats.posted}</div>
             </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-600 rounded-full blur-[120px] opacity-10 -mr-40 -mt-40"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {TRANSACTION_SUB_MENUS.map((item) => (
          <button key={item.id} onClick={() => setActiveSubAction(item.id as TransactionSubMenu)} className="group relative bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm hover:shadow-2xl hover:border-indigo-200 transition-all duration-300 text-left overflow-hidden">
            <div className={`w-14 h-14 ${item.color} rounded-2xl flex items-center justify-center text-white mb-8 group-hover:scale-110 transition-transform shadow-xl`}>
              {React.cloneElement(item.icon as React.ReactElement, { className: 'w-7 h-7' })}
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-2 group-hover:text-indigo-600 transition-colors uppercase italic">{item.label}</h3>
            <p className="text-sm text-slate-400 font-medium leading-relaxed">{item.description}</p>
            <div className="mt-8 flex items-center text-indigo-600 font-black text-[10px] uppercase tracking-[0.2em] opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
               <span>Launch Engine</span>
               <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
            </div>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-[3rem] p-12 border border-slate-200 shadow-sm relative overflow-hidden group">
         <div className="flex items-center justify-between mb-12">
            <h3 className="text-[11px] font-black uppercase text-slate-400 tracking-[0.4em]">Throughput Velocity (7D)</h3>
            <div className="px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-xl text-[9px] font-black uppercase tracking-widest border border-emerald-100">Statutory Reconciliation Active</div>
         </div>
         <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={flowData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 9, fontWeight: 900}} />
                <Tooltip contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)' }} />
                <Area type="monotone" dataKey="sales" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
         </div>
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
          <span>Return to Transaction Hub</span>
        </button>
      )}
      {renderContent()}
    </div>
  );
};

export default TransactionModule;