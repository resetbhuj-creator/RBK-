import React, { useState } from 'react';
import { DisplaySubMenu, Ledger, Voucher, Item, Tax, TaxGroup } from '../types';
import { DISPLAY_SUB_MENUS } from '../constants';
import BalanceSheet from './BalanceSheet';
import ProfitAndLoss from './ProfitAndLoss';
import TrialBalance from './TrialBalance';
import CashFlow from './CashFlow';
import InventorySummary from './InventorySummary';
import GstReportSystem from './GstReportSystem';

interface DisplayModuleProps {
  activeCompany: any;
  activeSubAction: DisplaySubMenu | null;
  setActiveSubAction: (sub: DisplaySubMenu | null) => void;
  ledgers: Ledger[];
  vouchers: Voucher[];
  items: Item[];
  taxes: Tax[];
  taxGroups: TaxGroup[];
  onViewVoucher: (id: string) => void;
}

const DisplayModule: React.FC<DisplayModuleProps> = ({ 
  activeCompany, activeSubAction, setActiveSubAction, ledgers, vouchers, items, taxes, taxGroups, onViewVoucher 
}) => {

  const renderContent = () => {
    switch (activeSubAction) {
      case DisplaySubMenu.BALANCE_SHEET:
        return <BalanceSheet ledgers={ledgers} vouchers={vouchers} />;
      case DisplaySubMenu.PROFIT_LOSS:
        return <ProfitAndLoss ledgers={ledgers} vouchers={vouchers} />;
      case DisplaySubMenu.TRIAL_BALANCE:
        return <TrialBalance ledgers={ledgers} vouchers={vouchers} />;
      case DisplaySubMenu.CASH_FLOW:
        return <CashFlow ledgers={ledgers} vouchers={vouchers} />;
      case DisplaySubMenu.INVENTORY_SUMMARY:
        return <InventorySummary items={items} vouchers={vouchers} />;
      case DisplaySubMenu.GST_REPORTS:
        return <GstReportSystem vouchers={vouchers} activeCompany={activeCompany} taxes={taxes} taxGroups={taxGroups} onViewVoucher={onViewVoucher} />;
      default:
        return <DisplayDashboard />;
    }
  };

  const DisplayDashboard = () => (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight italic uppercase">Financial Intelligence</h2>
          <p className="text-slate-500 font-medium">Extract high-fidelity audit reports and compliance data.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {DISPLAY_SUB_MENUS.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveSubAction(item.id as DisplaySubMenu)}
            className="group relative bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-2xl hover:border-indigo-200 transition-all duration-300 text-left overflow-hidden"
          >
            <div className={`w-14 h-14 ${item.color} rounded-2xl flex items-center justify-center text-white mb-8 group-hover:scale-110 transition-transform shadow-xl`}>
              {item.icon}
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-2 group-hover:text-indigo-600 transition-colors uppercase italic">{item.label}</h3>
            <p className="text-sm text-slate-400 font-medium leading-relaxed pr-6">{item.description}</p>
            <div className="mt-8 flex items-center text-indigo-600 font-black text-[10px] uppercase tracking-[0.2em] opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
              <span>Generate Report</span>
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
            </div>
          </button>
        ))}
      </div>

      <div className="bg-slate-900 rounded-[3rem] p-12 text-white relative overflow-hidden group shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="space-y-6 max-w-xl">
            <div className="inline-block px-3 py-1 bg-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-[0.3em]">Compliance Protocol</div>
            <h3 className="text-4xl font-black italic tracking-tighter leading-none">Automated Statutory Audit</h3>
            <p className="text-slate-400 font-medium text-sm leading-relaxed">
              Nexus maintains a cryptographically verified ledger stream. Every report generated is reconciled against the fundamental accounting equation in real-time.
            </p>
            <div className="flex space-x-4">
               <button className="px-8 py-3 bg-white text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all shadow-xl">Export Master Audit</button>
            </div>
          </div>
          <div className="w-full md:w-80 h-48 bg-white/5 rounded-[2rem] border border-white/10 flex items-center justify-center shadow-inner backdrop-blur-md">
             <div className="text-center">
                <div className="text-3xl font-black text-indigo-400">99.9%</div>
                <div className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-1">Data Precision</div>
             </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600 rounded-full blur-[150px] -mr-48 -mt-48 opacity-20 transition-opacity group-hover:opacity-40"></div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 min-h-[70vh]">
      {activeSubAction && (
        <button 
          onClick={() => setActiveSubAction(null)}
          className="flex items-center space-x-2 text-[10px] font-black uppercase text-slate-400 hover:text-indigo-600 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
          <span>Back to Analytics Registry</span>
        </button>
      )}
      {renderContent()}
    </div>
  );
};

export default DisplayModule;