import React, { useState } from 'react';
import { HouseKeepingSubMenu, AuditLog, Ledger, Voucher } from '../types';
import { HOUSE_KEEPING_SUB_MENUS } from '../constants';
import DatabaseUtility from './HouseKeeping/DatabaseUtility';
import IntegrityCheck from './HouseKeeping/IntegrityCheck';
import SystemAudit from './HouseKeeping/SystemAudit';
import PreferenceCenter from './HouseKeeping/PreferenceCenter';

interface HouseKeepingModuleProps {
  activeCompany: any;
  activeSubAction: HouseKeepingSubMenu | null;
  setActiveSubAction: (sub: HouseKeepingSubMenu | null) => void;
  auditLogs: AuditLog[];
  ledgers: Ledger[];
  vouchers: Voucher[];
}

const HouseKeepingModule: React.FC<HouseKeepingModuleProps> = ({ 
  activeCompany, activeSubAction, setActiveSubAction, auditLogs, ledgers, vouchers 
}) => {

  const renderContent = () => {
    switch (activeSubAction) {
      case HouseKeepingSubMenu.DATABASE_UTILITY:
        return <DatabaseUtility />;
      case HouseKeepingSubMenu.INTEGRITY_CHECK:
        return <IntegrityCheck ledgers={ledgers} vouchers={vouchers} />;
      case HouseKeepingSubMenu.SYSTEM_AUDIT:
        return <SystemAudit auditLogs={auditLogs} />;
      case HouseKeepingSubMenu.PREFERENCES:
        return <PreferenceCenter />;
      default:
        return <HouseKeepingDashboard />;
    }
  };

  const HouseKeepingDashboard = () => (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight italic uppercase">System Sovereignty</h2>
          <p className="text-slate-500 font-medium">Maintain system health and data persistence for optimized performance.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {HOUSE_KEEPING_SUB_MENUS.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveSubAction(item.id as HouseKeepingSubMenu)}
            className="group relative bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-2xl hover:border-indigo-200 transition-all duration-300 text-left overflow-hidden"
          >
            <div className={`w-14 h-14 ${item.color} rounded-2xl flex items-center justify-center text-white mb-8 group-hover:scale-110 transition-transform shadow-xl`}>
              {item.icon}
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-2 group-hover:text-indigo-600 transition-colors uppercase italic leading-none">{item.label}</h3>
            <p className="text-sm text-slate-400 font-medium leading-relaxed">{item.description}</p>
          </button>
        ))}
      </div>

      <div className="bg-slate-900 rounded-[3rem] p-12 text-white relative overflow-hidden group shadow-2xl border border-slate-800">
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
           <div>
              <div className="inline-block px-3 py-1 bg-amber-600 rounded-lg text-[10px] font-black uppercase tracking-[0.3em] mb-6 text-white">System Ops v4.4</div>
              <h3 className="text-4xl font-black italic tracking-tighter mb-4">Engineering Health Protocol</h3>
              <p className="text-slate-400 font-medium text-sm leading-relaxed mb-8">
                The Nexus core requires periodic index optimization and mathematical proofing of ledger partitions. Failure to maintain these may result in degraded reporting latency.
              </p>
              <div className="grid grid-cols-2 gap-4">
                 <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                    <div className="text-[10px] font-black uppercase text-indigo-400 mb-1">Index Health</div>
                    <div className="text-2xl font-black">94.2%</div>
                 </div>
                 <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                    <div className="text-[10px] font-black uppercase text-emerald-400 mb-1">Data Shards</div>
                    <div className="text-2xl font-black">Stable</div>
                 </div>
              </div>
           </div>
           <div className="flex justify-center">
              <div className="w-64 h-64 bg-amber-600/10 rounded-[3rem] flex items-center justify-center border border-amber-500/20 rotate-6 group-hover:rotate-0 transition-transform">
                 <svg className="w-32 h-32 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" /></svg>
              </div>
           </div>
        </div>
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-600 rounded-full blur-[150px] -mr-64 -mt-64 opacity-10 pointer-events-none"></div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 min-h-[70vh]">
      {activeSubAction && (
        <button onClick={() => setActiveSubAction(null)} className="flex items-center space-x-2 text-[10px] font-black uppercase text-slate-400 hover:text-amber-600 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
          <span>Return to Engineering Hub</span>
        </button>
      )}
      {renderContent()}
    </div>
  );
};

export default HouseKeepingModule;