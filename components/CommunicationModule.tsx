import React, { useState, useMemo } from 'react';
import { CommunicationSubMenu, Voucher, Ledger } from '../types';
import { COMMUNICATION_SUB_MENUS } from '../constants';
import PrintCenter from './PrintCenter';
import EmailGateway from './EmailGateway';
import SMSGateway from './SMSGateway';
import DispatchLogs from './DispatchLogs';

interface CommunicationModuleProps {
  activeCompany: any;
  activeSubAction: CommunicationSubMenu | null;
  setActiveSubAction: (sub: CommunicationSubMenu | null) => void;
  vouchers: Voucher[];
  ledgers: Ledger[];
  onViewVoucher: (id: string) => void;
}

const CommunicationModule: React.FC<CommunicationModuleProps> = ({ 
  activeCompany, activeSubAction, setActiveSubAction, vouchers, ledgers, onViewVoucher 
}) => {

  const deliveryStats = useMemo(() => ({
    total: 14502,
    success: 99.2,
    email: 8430,
    sms: 5200,
    print: 872,
    growth: 12.4
  }), []);

  const renderContent = () => {
    switch (activeSubAction) {
      case CommunicationSubMenu.PRINT_CENTER:
        return <PrintCenter vouchers={vouchers} activeCompany={activeCompany} />;
      case CommunicationSubMenu.EMAIL_GATEWAY:
        return <EmailGateway vouchers={vouchers} ledgers={ledgers} activeCompany={activeCompany} />;
      case CommunicationSubMenu.SMS_ALERTS:
        return <SMSGateway vouchers={vouchers} ledgers={ledgers} />;
      case CommunicationSubMenu.DISPATCH_LOGS:
        return <DispatchLogs onViewVoucher={onViewVoucher} />;
      default:
        return <CommunicationDashboard />;
    }
  };

  const CommunicationDashboard = () => (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight italic uppercase">Communication Orchestrator</h2>
          <p className="text-slate-500 font-medium">Manage cross-channel delivery clusters and statutory correspondence.</p>
        </div>
        <div className="flex items-center space-x-3 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
           <div className="px-4 py-2 border-r border-slate-100 text-center">
              <div className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Queue Health</div>
              <div className="text-sm font-black text-emerald-600">Stable</div>
           </div>
           <div className="px-4 py-2 text-center">
              <div className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Latency</div>
              <div className="text-sm font-black text-indigo-600">14ms</div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {COMMUNICATION_SUB_MENUS.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveSubAction(item.id as CommunicationSubMenu)}
            className="group relative bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-2xl hover:border-indigo-200 transition-all duration-300 text-left overflow-hidden flex flex-col"
          >
            <div className={`w-14 h-14 ${item.color} rounded-2xl flex items-center justify-center text-white mb-8 group-hover:scale-110 transition-transform shadow-xl`}>
              {item.icon}
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-2 group-hover:text-indigo-600 transition-colors uppercase italic leading-none">{item.label}</h3>
            <p className="text-sm text-slate-400 font-medium leading-relaxed mb-8">{item.description}</p>
            <div className="mt-auto flex items-center text-indigo-600 font-black text-[10px] uppercase tracking-[0.2em] opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
              <span>Execute Procedure</span>
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
            </div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2 bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl border-b-8 border-indigo-600">
            <div className="relative z-10 space-y-10">
               <div className="flex items-center justify-between">
                  <h3 className="text-[10px] font-black uppercase text-indigo-400 tracking-[0.4em]">Global Dispatch Telemetry</h3>
                  <span className="bg-white/5 border border-white/10 px-4 py-1 rounded-full text-[9px] font-black uppercase">Cluster: CORE-01</span>
               </div>
               
               <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                  <div>
                    <div className="text-4xl font-black italic tracking-tighter tabular-nums">{deliveryStats.total.toLocaleString()}</div>
                    <div className="text-[8px] font-black uppercase text-slate-500 mt-1">Total Shards</div>
                  </div>
                  <div>
                    <div className="text-4xl font-black text-emerald-400 italic tracking-tighter tabular-nums">{deliveryStats.success}%</div>
                    <div className="text-[8px] font-black uppercase text-slate-500 mt-1">SLA Accuracy</div>
                  </div>
                  <div>
                    <div className="text-4xl font-black text-indigo-400 italic tracking-tighter tabular-nums">{deliveryStats.email.toLocaleString()}</div>
                    <div className="text-[8px] font-black uppercase text-slate-500 mt-1">Mail Dispatched</div>
                  </div>
                  <div>
                    <div className="text-4xl font-black text-blue-400 italic tracking-tighter tabular-nums">{deliveryStats.sms.toLocaleString()}</div>
                    <div className="text-[8px] font-black uppercase text-slate-500 mt-1">Signal Outbound</div>
                  </div>
               </div>

               <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/10 flex flex-col md:flex-row items-center justify-between gap-6 backdrop-blur-md">
                  <div className="flex items-center space-x-6">
                     <div className="w-12 h-12 bg-indigo-600/30 rounded-2xl flex items-center justify-center text-2xl border border-indigo-500/30">🎯</div>
                     <div>
                        <h4 className="text-sm font-black italic uppercase tracking-tight">Channel Velocity</h4>
                        <p className="text-[10px] text-slate-400 font-medium leading-relaxed">Network reach is <span className="text-white font-bold">12.4% above</span> quarterly baseline.</p>
                     </div>
                  </div>
                  <div className="w-32 h-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/5">
                     <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">+12.4% ↗</span>
                  </div>
               </div>
            </div>
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-600 rounded-full blur-[150px] opacity-10 -mr-64 -mt-64 pointer-events-none"></div>
         </div>

         <div className="bg-white rounded-[3rem] border border-slate-200 p-10 shadow-sm space-y-8">
            <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em]">Module Integrity</h3>
            <div className="space-y-6">
               {[
                 { label: 'Print Relay Node', val: 100, color: 'bg-emerald-500' },
                 { label: 'SMTP Authorized Cluster', val: 98.4, color: 'bg-indigo-500' },
                 { label: 'SMS Gateway Shard', val: 94.2, color: 'bg-amber-500' },
                 { label: 'Statutory PDF Parser', val: 100, color: 'bg-blue-500' }
               ].map((c, i) => (
                 <div key={i} className="space-y-2">
                    <div className="flex justify-between text-[10px] font-black uppercase text-slate-500 tracking-tighter">
                       <span>{c.label}</span>
                       <span className={c.val < 95 ? 'text-amber-600' : 'text-slate-800'}>{c.val}%</span>
                    </div>
                    <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                       <div className={`h-full ${c.color} transition-all duration-1000`} style={{ width: `${c.val}%` }}></div>
                    </div>
                 </div>
               ))}
            </div>
            <div className="pt-6 border-t border-slate-100 flex flex-col items-center">
               <button className="text-[9px] font-black text-indigo-600 uppercase tracking-widest hover:underline underline-offset-4 decoration-indigo-200">System Diagnostic</button>
            </div>
         </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 min-h-[70vh]">
      {activeSubAction && (
        <button onClick={() => setActiveSubAction(null)} className="flex items-center space-x-2 text-[10px] font-black uppercase text-slate-400 hover:text-indigo-600 transition-colors group mb-6">
          <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
          <span className="tracking-widest">Return to Communication Lab</span>
        </button>
      )}
      {renderContent()}
    </div>
  );
};

export default CommunicationModule;