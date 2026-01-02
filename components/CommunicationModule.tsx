import React, { useState, useMemo } from 'react';
import { CommunicationSubMenu, Voucher, Ledger } from '../types';
import { COMMUNICATION_SUB_MENUS } from '../constants';
import PrintCenter from './PrintCenter';
import EmailGateway from './EmailGateway';
import SMSGateway from './SMSGateway';

interface CommunicationModuleProps {
  activeCompany: any;
  activeSubAction: CommunicationSubMenu | null;
  setActiveSubAction: (sub: CommunicationSubMenu | null) => void;
  vouchers: Voucher[];
  ledgers: Ledger[];
}

const CommunicationModule: React.FC<CommunicationModuleProps> = ({ 
  activeCompany, activeSubAction, setActiveSubAction, vouchers, ledgers 
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
        return <DispatchLogs />;
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
              <div className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Network Latency</div>
              <div className="text-sm font-black text-indigo-600">14ms</div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {COMMUNICATION_SUB_MENUS.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveSubAction(item.id as CommunicationSubMenu)}
            className="group relative bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-2xl hover:border-indigo-200 transition-all duration-300 text-left overflow-hidden"
          >
            <div className={`w-14 h-14 ${item.color} rounded-2xl flex items-center justify-center text-white mb-8 group-hover:scale-110 transition-transform shadow-xl`}>
              {item.icon}
            </div>
            <h3 className="text-xl font-black text-slate-800 mb-2 group-hover:text-indigo-600 transition-colors uppercase italic leading-none">{item.label}</h3>
            <p className="text-sm text-slate-400 font-medium leading-relaxed">{item.description}</p>
            <div className="mt-8 flex items-center text-indigo-600 font-black text-[10px] uppercase tracking-[0.2em] opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
              <span>Enter Workspace</span>
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
            </div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2 bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl border-b-8 border-indigo-600">
            <div className="relative z-10 space-y-10">
               <div className="flex items-center justify-between">
                  <h3 className="text-[10px] font-black uppercase text-indigo-400 tracking-[0.4em]">Global Delivery Analytics</h3>
                  <span className="bg-white/5 border border-white/10 px-4 py-1 rounded-full text-[9px] font-black uppercase">Live Cluster: US-EAST-1</span>
               </div>
               
               <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                  <div>
                    <div className="text-4xl font-black italic tracking-tighter tabular-nums">{deliveryStats.total.toLocaleString()}</div>
                    <div className="text-[8px] font-black uppercase text-slate-500 mt-1">Total Requests</div>
                  </div>
                  <div>
                    <div className="text-4xl font-black text-emerald-400 italic tracking-tighter tabular-nums">{deliveryStats.success}%</div>
                    <div className="text-[8px] font-black uppercase text-slate-500 mt-1">Success Rate</div>
                  </div>
                  <div>
                    <div className="text-4xl font-black text-indigo-400 italic tracking-tighter tabular-nums">{deliveryStats.email.toLocaleString()}</div>
                    <div className="text-[8px] font-black uppercase text-slate-500 mt-1">Mails Dispatched</div>
                  </div>
                  <div>
                    <div className="text-4xl font-black text-blue-400 italic tracking-tighter tabular-nums">{deliveryStats.sms.toLocaleString()}</div>
                    <div className="text-[8px] font-black uppercase text-slate-500 mt-1">SMS Alerts Sent</div>
                  </div>
               </div>

               <div className="p-8 bg-white/5 rounded-[2rem] border border-white/10 flex flex-col md:flex-row items-center justify-between gap-6 backdrop-blur-md">
                  <div className="flex items-center space-x-6">
                     <div className="w-12 h-12 bg-indigo-600/30 rounded-2xl flex items-center justify-center text-2xl border border-indigo-500/30">🎯</div>
                     <div>
                        <h4 className="text-sm font-black italic uppercase tracking-tight">Outreach Performance</h4>
                        <p className="text-[10px] text-slate-400 font-medium leading-relaxed">System reached <span className="text-white font-bold">12.4% more</span> counterparties this month compared to previous period.</p>
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
            <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em]">Channel Reliability</h3>
            <div className="space-y-6">
               {[
                 { label: 'Thermal Print Bridge', val: 100, color: 'bg-emerald-500' },
                 { label: 'SMTP Relay Cluster', val: 98.4, color: 'bg-indigo-500' },
                 { label: 'SMS Gateway Pool', val: 94.2, color: 'bg-amber-500' },
                 { label: 'PDF Rendering Node', val: 100, color: 'bg-blue-500' }
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
               <button className="text-[9px] font-black text-indigo-600 uppercase tracking-widest hover:underline underline-offset-4 decoration-indigo-200">Execute System Diagnostic</button>
            </div>
         </div>
      </div>
    </div>
  );

  const DispatchLogs = () => {
    const logs = [
      { id: 'TXN-9082', type: 'Email', party: 'Acme Global', target: 'finance@acme.com', time: '2 mins ago', status: 'Sent' },
      { id: 'TXN-9081', type: 'SMS', party: 'Retailers Inc', target: '+141500022', time: '14 mins ago', status: 'Delivered' },
      { id: 'TXN-9080', type: 'Print', party: 'Self-Pickup', target: 'Local LPT1', time: '1 hour ago', status: 'Printed' },
      { id: 'TXN-9079', type: 'Email', party: 'Global Supp', target: 'billing@global.net', time: '2 hours ago', status: 'Bounced' },
    ];

    return (
      <div className="bg-white rounded-[3rem] border border-slate-200 overflow-hidden shadow-sm animate-in fade-in duration-500">
        <div className="px-10 py-8 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
           <h3 className="text-xl font-black italic uppercase text-slate-800 tracking-tight">Comprehensive Dispatch Audit</h3>
           <div className="flex items-center space-x-3">
              <input type="text" placeholder="Search Logs..." className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm" />
              <button className="px-6 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all">Export XLS</button>
           </div>
        </div>
        <div className="overflow-x-auto custom-scrollbar">
           <table className="w-full text-left">
              <thead className="bg-slate-900 text-[10px] font-black uppercase text-slate-400">
                 <tr>
                    <th className="px-10 py-5">Audit HASH</th>
                    <th className="px-10 py-5">Communication Mode</th>
                    <th className="px-10 py-5">Counterparty Node</th>
                    <th className="px-10 py-5">Status</th>
                    <th className="px-10 py-5 text-right">Time Offset</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                 {logs.map(l => (
                   <tr key={l.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-10 py-6 font-mono text-[10px] font-black text-indigo-500 italic">{l.id}</td>
                      <td className="px-10 py-6">
                         <span className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border ${
                           l.type === 'Email' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                           l.type === 'SMS' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                           'bg-slate-50 text-slate-600 border-slate-100'
                         }`}>{l.type}</span>
                      </td>
                      <td className="px-10 py-6">
                         <div className="text-xs font-black text-slate-800 uppercase italic">{l.party}</div>
                         <div className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">{l.target}</div>
                      </td>
                      <td className="px-10 py-6">
                         <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border ${
                           l.status === 'Sent' || l.status === 'Delivered' || l.status === 'Printed' 
                           ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                           : 'bg-rose-50 text-rose-600 border-rose-100'
                         }`}>{l.status}</span>
                      </td>
                      <td className="px-10 py-6 text-right text-[10px] font-black text-slate-400 uppercase">{l.time}</td>
                   </tr>
                 ))}
              </tbody>
           </table>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 min-h-[70vh]">
      {activeSubAction && (
        <button onClick={() => setActiveSubAction(null)} className="flex items-center space-x-2 text-[10px] font-black uppercase text-slate-400 hover:text-indigo-600 transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
          <span>Return to Communication Dashboard</span>
        </button>
      )}
      {renderContent()}
    </div>
  );
};

export default CommunicationModule;