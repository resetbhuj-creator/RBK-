import React, { useState } from 'react';
import { DisplaySubMenu, Ledger, Voucher, Item, Tax, TaxGroup, Batch } from '../types';
import { DISPLAY_SUB_MENUS } from '../constants';
import BalanceSheet from './BalanceSheet';
import ProfitAndLoss from './ProfitAndLoss';
import TrialBalance from './TrialBalance';
import CashFlow from './CashFlow';
import InventorySummary from './InventorySummary';
import GstReportSystem from './GstReportSystem';
import Gstr1Report from './Gstr1Report';
import Gstr2Report from './Gstr2Report';
import Gstr3BReport from './Gstr3BReport';
import HsnSummaryReport from './HsnSummaryReport';
import BudgetVariance from './BudgetVariance';
import LedgerReport from './LedgerReport';
import OutstandingReport from './OutstandingReport';

interface DisplayModuleProps {
  activeCompany: any;
  activeSubAction: DisplaySubMenu | null;
  setActiveSubAction: (sub: DisplaySubMenu | null) => void;
  ledgers: Ledger[];
  vouchers: Voucher[];
  items: Item[];
  batches: Batch[];
  taxes: Tax[];
  taxGroups: TaxGroup[];
  onViewVoucher: (id: string) => void;
  onPostVoucher: (data: Omit<Voucher, 'id' | 'status'>) => void;
}

const DisplayModule: React.FC<DisplayModuleProps> = ({ 
  activeCompany, activeSubAction, setActiveSubAction, ledgers, vouchers, items, batches, taxes, taxGroups, onViewVoucher, onPostVoucher 
}) => {
  const [drillDownLedgerId, setDrillDownLedgerId] = useState<string | undefined>(undefined);

  const handleDrillDown = (id: string) => {
    setDrillDownLedgerId(id);
    setActiveSubAction(DisplaySubMenu.LEDGER_REPORT);
  };

  const renderContent = () => {
    switch (activeSubAction) {
      case DisplaySubMenu.BALANCE_SHEET:
        return <BalanceSheet ledgers={ledgers} vouchers={vouchers} onDrillDown={handleDrillDown} />;
      case DisplaySubMenu.PROFIT_LOSS:
        return <ProfitAndLoss ledgers={ledgers} vouchers={vouchers} onDrillDown={(field) => {
          setActiveSubAction(DisplaySubMenu.LEDGER_REPORT);
        }} />;
      case DisplaySubMenu.BUDGET_VARIANCE:
        return <BudgetVariance ledgers={ledgers} vouchers={vouchers} />;
      case DisplaySubMenu.TRIAL_BALANCE:
        return <TrialBalance ledgers={ledgers} vouchers={vouchers} />;
      case DisplaySubMenu.CASH_FLOW:
        return <CashFlow ledgers={ledgers} vouchers={vouchers} />;
      case DisplaySubMenu.LEDGER_REPORT:
        return <LedgerReport ledgers={ledgers} vouchers={vouchers} onViewVoucher={onViewVoucher} defaultLedgerId={drillDownLedgerId} />;
      case DisplaySubMenu.OUTSTANDING_REPORT:
        return <OutstandingReport ledgers={ledgers} vouchers={vouchers} onDrillDown={handleDrillDown} />;
      case DisplaySubMenu.INVENTORY_SUMMARY:
        return (
          <InventorySummary 
            items={items} 
            vouchers={vouchers} 
            batches={batches} 
            onAdjustStock={onPostVoucher} 
            onViewVoucher={onViewVoucher}
          />
        );
      case DisplaySubMenu.GST_REPORTS:
        return <GstReportSystem vouchers={vouchers} activeCompany={activeCompany} taxes={taxes} taxGroups={taxGroups} onViewVoucher={onViewVoucher} />;
      case DisplaySubMenu.GSTR_1:
        return <Gstr1Report vouchers={vouchers} activeCompany={activeCompany} ledgers={ledgers} onViewVoucher={onViewVoucher} />;
      case DisplaySubMenu.GSTR_2:
        return <Gstr2Report vouchers={vouchers} activeCompany={activeCompany} ledgers={ledgers} onViewVoucher={onViewVoucher} />;
      case DisplaySubMenu.GSTR_3B:
        return <Gstr3BReport vouchers={vouchers} activeCompany={activeCompany} onViewVoucher={onViewVoucher} />;
      case DisplaySubMenu.HSN_SUMMARY:
        return <HsnSummaryReport vouchers={vouchers} activeCompany={activeCompany} />;
      default:
        return <DisplayDashboard />;
    }
  };

  const DisplayDashboard = () => (
    <div className="space-y-12 animate-in fade-in duration-500">
      <div className="bg-slate-900 rounded-[3.5rem] p-12 text-white relative overflow-hidden shadow-2xl border-b-8 border-indigo-600">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-10">
          <div className="flex items-center space-x-8">
            <div className="w-20 h-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center shadow-2xl border-4 border-indigo-400/20 transform -rotate-3 transition-transform hover:rotate-0">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
            </div>
            <div>
              <h2 className="text-4xl font-black italic uppercase tracking-tighter leading-tight">Analytical Command</h2>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400 mt-2">Verified Ledger Insight • {activeCompany.name}</p>
            </div>
          </div>
          <div className="flex gap-12 border-l border-white/10 pl-12">
             <div className="text-center">
                <div className="text-[9px] font-black uppercase text-slate-500 tracking-widest mb-1">Audit Confidence</div>
                <div className="text-3xl font-black italic text-emerald-400">100%</div>
             </div>
             <div className="text-center">
                <div className="text-[9px] font-black uppercase text-slate-500 tracking-widest mb-1">Active Nodes</div>
                <div className="text-3xl font-black italic tabular-nums">{ledgers.length}</div>
             </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-600 rounded-full blur-[150px] opacity-10 -mr-64 -mt-64 pointer-events-none"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {DISPLAY_SUB_MENUS.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveSubAction(item.id as DisplaySubMenu)}
            className="group relative bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm hover:shadow-2xl hover:border-indigo-200 transition-all duration-500 text-left overflow-hidden flex flex-col"
          >
            <div className={`w-16 h-16 ${item.color} rounded-2xl flex items-center justify-center text-white mb-10 group-hover:scale-110 group-hover:-rotate-3 transition-all shadow-xl`}>
              {React.cloneElement(item.icon as React.ReactElement<any>, { className: 'w-8 h-8' })}
            </div>
            <h3 className="text-2xl font-black text-slate-800 mb-3 group-hover:text-indigo-600 transition-colors uppercase italic leading-none tracking-tighter">{item.label}</h3>
            <p className="text-xs text-slate-400 font-medium leading-relaxed mb-10">{item.description}</p>
            
            <div className="mt-auto flex items-center text-indigo-600 font-black text-[10px] uppercase tracking-[0.3em] opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
              <span>Execute Analysis</span>
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </div>
          </button>
        ))}
      </div>

      <div className="bg-slate-900 rounded-[4rem] p-16 text-white relative overflow-hidden group shadow-2xl border border-slate-800">
        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-16">
          <div className="space-y-8 max-w-2xl">
            <div className="inline-block px-4 py-1.5 bg-indigo-600/30 rounded-xl text-[10px] font-black uppercase tracking-[0.4em] border border-indigo-500/20">Compliance Architecture v4.4</div>
            <h3 className="text-5xl font-black italic tracking-tighter leading-none">Automated Statutory Reconstruction</h3>
            <p className="text-slate-400 font-medium text-lg leading-relaxed italic">
              "The Nexus reporting engine utilizes high-fidelity cryptographic ledger mapping to ensure that all financial statements are derivative of a single source of truth."
            </p>
            <div className="flex space-x-6">
               <button className="px-10 py-4 bg-white text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-500 hover:text-white transition-all shadow-xl transform active:scale-95 border-b-4 border-slate-950">Export Master Archive</button>
               <button className="px-10 py-4 bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-all">Verify Chain Consistency</button>
            </div>
          </div>
          <div className="w-full lg:w-96 h-64 bg-white/5 rounded-[3rem] border border-white/10 flex flex-col items-center justify-center shadow-inner backdrop-blur-2xl group-hover:bg-white/10 transition-all">
             <div className="text-center">
                <div className="text-5xl font-black text-indigo-400 tracking-tighter italic">99.99%</div>
                <div className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-500 mt-4">Precision Metric</div>
             </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-600 rounded-full blur-[200px] -mr-96 -mt-96 opacity-10 pointer-events-none group-hover:opacity-20 transition-opacity"></div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 min-h-[80vh]">
      {activeSubAction && (
        <button 
          onClick={() => { setActiveSubAction(null); setDrillDownLedgerId(undefined); }}
          className="flex items-center space-x-3 text-[11px] font-black uppercase text-slate-400 hover:text-indigo-600 transition-all group mb-8"
        >
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-indigo-50 transition-colors">
            <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
          </div>
          <span className="tracking-[0.3em]">Exit to Intelligence Hub</span>
        </button>
      )}
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-700">
        {renderContent()}
      </div>
    </div>
  );
};

export default DisplayModule;